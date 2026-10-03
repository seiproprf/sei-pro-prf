/**
 * Entrada de html/historico.html. Liga o app ao navegador: <dialog>, download,
 * área de transferência e a ponte com o SEI.
 *
 * Dois modos, pelo hash da URL:
 * - modal (padrão, `#modo=modal&tema=claro|escuro`): iframe transparente sobre
 *   a tela do SEI, ligado à PRÓPRIA aba (pagina/modal.ts); o app mora num
 *   <dialog> com véu;
 * - lateral (`#modo=lateral`): dentro do painel lateral, ligado à aba do SEI que está na frente
 *   nesta janela (ponte por host|login) e remontado só quando muda o SEI ou o login.
 */

import { areaChrome } from "@comum/armazenamento/area";
import { idDispositivo } from "@comum/armazenamento/dispositivo";
import { novoId } from "@comum/id";
import { lerOpcaoLegada } from "@comum/opcoes/legadas";
import { esperarConexaoDaAba } from "@comum/ponte/conexaoDaAba";
import { PonteLateral } from "@comum/ponte/lateral";
import { ErroRpc, type PortaRpc, type Rpc } from "@comum/ponte/rpc";
import { h, icone } from "@comum/ui/dom";
import { CANAL_HISTORICO, CANAL_LATERAL, CHAVE_LATERAL, chaveEscopo } from "../modelo/constantes";
import type { ContextoHistorico } from "../modelo/tipos";
import { RepositorioHistorico } from "../repositorio";
import { type AbrirModal, AppHistorico } from "./app";
import { favoritosDoApp, precisaRemontar } from "./favoritos";

const parametros = new URLSearchParams(location.hash.slice(1));
const lateral = parametros.get("modo") === "lateral";
document.documentElement.dataset.modo = lateral ? "lateral" : "modal";
// Modal: o tema do SEI já vem no endereço. Sem ele, até o contexto chegar valeria o do sistema, e com
// esquema de cores diferente do iframe (pagina/modal.ts) o Chrome pinta o fundo opaco sobre a tela do SEI.
const temaDoEndereco = parametros.get("tema");
if (!lateral && (temaDoEndereco === "claro" || temaDoEndereco === "escuro")) document.documentElement.dataset.tema = temaDoEndereco;
const raiz = document.getElementById("app")!;

// Modal: o ouvinte da porta é registrado já, antes do `load` do iframe, que é quando o content script conecta.
const conexao = lateral ? null : esperarConexaoDaAba(CANAL_HISTORICO);

const mensagem = (e: unknown): string => (e instanceof Error ? e.message : String(e));

if (lateral)
  void iniciarLateral().catch((e) =>
    raiz.replaceChildren(h("p", { class: "spro-lista-erro" }, `Não foi possível abrir o histórico: ${mensagem(e)}`)),
  );
else void iniciarModal();

/** O que o app precisa do navegador, igual nos dois modos. */
function depsComuns(ctx: ContextoHistorico, area: ReturnType<typeof areaChrome>, rpc: Pick<Rpc, "chamar">, dispositivo: string) {
  return {
    ctx,
    area,
    repo: new RepositorioHistorico(area, chaveEscopo(ctx.host, ctx.login)),
    rpc,
    // null (sem estrela, filtro nem "Favoritar") quando o Favoritos novo não está ativo.
    favoritos: favoritosDoApp(area, ctx, () => ({ agora: Date.now(), dispositivo })),
    historicoLigado: () => lerOpcaoLegada("historicoproc"),
    abrirModal,
    confirmar,
    baixar,
    copiar: (texto: string) => navigator.clipboard.writeText(texto),
    agora: () => Date.now(),
    abrirOpcoes,
  };
}

async function iniciarLateral(): Promise<void> {
  const area = areaChrome(chrome.storage.local, "local");
  // Opção desligada: o estado "desligado" direto, sem esperar aba (o app nem lê o repositório).
  if (!(await lerOpcaoLegada("historicoproc"))) {
    const vazio: ContextoHistorico = {
      host: "",
      login: "",
      nome: "",
      unidade: null,
      versao: "",
      temaEscuro: false,
      favoritosAtivo: false,
      lateralDisponivel: true,
    };
    await new AppHistorico(raiz, {
      ...depsComuns(vazio, area, { chamar: () => Promise.reject(new ErroRpc("SEM_ABA", "O histórico está desligado.")) }, ""),
      modo: "lateral",
    }).iniciar();
    return;
  }
  const dispositivo = await idDispositivo(area);
  let janela = -1;
  try {
    janela = (await chrome.windows.getCurrent()).id ?? -1;
  } catch {
    /* sidebar do Firefox: sem API de janelas, aceita qualquer aba */
  }
  const ponte = new PonteLateral({
    area,
    chave: CHAVE_LATERAL,
    janela,
    novoId: () => novoId(),
    ouvirConexoes: (cb) =>
      chrome.runtime.onConnect.addListener((porta) => {
        // Portas de outros canais (o modal, o agente) não são deste painel.
        if (porta.name === CANAL_LATERAL) cb(porta as unknown as PortaRpc, porta.sender ?? {});
      }),
  });
  let montado: { chave: string; unidadeId: string; app: AppHistorico } | null = null;
  // O rpc fala com uma aba do mesmo SEI e login da lista montada: trocar de aba ou de unidade
  // não remonta nada, e um pedido nunca vai para outro SEI ou outro usuário.
  const rpc: Pick<Rpc, "chamar"> = {
    chamar: <T>(op: string, args?: unknown, prazo?: number) => {
      const a = ponte.daChave(montado?.chave ?? "");
      return a
        ? a.rpc.chamar<T>(op, args, prazo)
        : Promise.reject(
            new ErroRpc("SEM_ABA", "A aba do SEI deste histórico não está mais aberta nesta janela. Abra o SEI e tente de novo."),
          );
    },
  };
  const semAba = h(
    "div",
    { class: "spro-lista-sem-aba" },
    icone("historico", 28),
    h("p", {}, "Abra o SEI nesta janela para ver seu histórico."),
    h("p", { class: "spro-lista-dica" }, "Se o SEI já está aberto e nada aparece, recarregue a página dele (F5)."),
  );
  let fila = Promise.resolve();
  const reagir = () => {
    fila = fila
      .then(async () => {
        const a = ponte.atual();
        const chave = a?.chave ?? "";
        if (montado && montado.chave !== chave) {
          montado.app.destruir();
          montado = null;
        }
        if (!a) {
          raiz.replaceChildren(semAba);
          return;
        }
        let ctx: ContextoHistorico;
        try {
          ctx = await a.rpc.chamar<ContextoHistorico>("contexto");
        } catch (e) {
          // Mesmo SEI e login já montado: a falha não derruba a lista que está na tela.
          if (montado) return;
          throw e;
        }
        // A aba pode ter mudado enquanto o contexto chegava: a próxima volta da fila corrige.
        if (chaveEscopo(ctx.host, ctx.login) !== chave) return;
        // Mesmo SEI e login, mas outra unidade (o SEI recarrega a página): as listas dos Favoritos são da unidade.
        const unidadeId = ctx.unidade?.id ?? "";
        if (!precisaRemontar(montado ? { chave: montado.chave, unidadeId: montado.unidadeId } : null, chave, unidadeId)) return;
        montado?.app.destruir();
        const app = new AppHistorico(raiz, { ...depsComuns(ctx, area, rpc, dispositivo), modo: "lateral" });
        montado = { chave, unidadeId, app };
        await app.iniciar();
      })
      .catch((e) => raiz.replaceChildren(h("p", { class: "spro-lista-erro" }, `Não foi possível abrir o histórico: ${mensagem(e)}`)));
  };
  raiz.replaceChildren(h("p", { class: "spro-lista-dica" }, "Procurando o SEI nesta janela…"));
  ponte.aoMudar(reagir);
  await ponte.iniciar();
  addEventListener("pagehide", () => void ponte.encerrar());
  // As abas que já estão abertas conectam ao ver o anúncio; se nenhuma vier, avisa.
  setTimeout(reagir, 1500);
}

async function iniciarModal(): Promise<void> {
  const dlg = h("dialog", { class: "spro-dialogo hist-modal", "aria-label": "Histórico de processos visitados" });
  // O CSS do modal mira `dialog.hist-modal #app`.
  dlg.append(raiz);
  document.body.append(dlg);
  let rpc: Rpc | null = null;
  let app: AppHistorico | null = null;
  // Fechar o diálogo (X, Esc, véu, processo aberto) pede à aba que tire o iframe. O pedido vai PRIMEIRO:
  // sem ele, a tela do SEI fica presa sob o iframe transparente até o F5.
  dlg.addEventListener("close", () => {
    void rpc?.chamar("fechar", undefined, 3000).catch(() => undefined);
    try {
      app?.destruir();
    } catch (e) {
      console.warn("[SEI Pro] histórico: falha ao desmontar o app", e);
    }
  });
  // Véu: o clique cai no próprio <dialog>, fora do retângulo dele. Começo e fim no véu,
  // para uma seleção de texto que termina fora não fechar a janela.
  const noVeu = (ev: MouseEvent) => {
    if (ev.target !== dlg) return false;
    const r = dlg.getBoundingClientRect();
    return ev.clientX < r.left || ev.clientX > r.right || ev.clientY < r.top || ev.clientY > r.bottom;
  };
  let comecouNoVeu = false;
  dlg.addEventListener("pointerdown", (ev) => {
    comecouNoVeu = noVeu(ev);
  });
  dlg.addEventListener("click", (ev) => {
    if (comecouNoVeu && noVeu(ev)) dlg.close();
    comecouNoVeu = false;
  });
  const mostrar = () => {
    if (!dlg.open) dlg.showModal();
  };
  try {
    rpc = await conexao!;
    const ctx = await rpc.chamar<ContextoHistorico>("contexto");
    // Segue o SEI (modo noturno do SEI Pro e cor da barra), como o painel embutido do Favoritos.
    const html = document.documentElement;
    html.dataset.tema = ctx.temaEscuro ? "escuro" : "claro";
    if (ctx.corTema) {
      html.style.setProperty("--spro-cor-sei", ctx.corTema);
      html.dataset.corSei = "";
    }
    const area = areaChrome(chrome.storage.local, "local");
    app = new AppHistorico(raiz, {
      ...depsComuns(ctx, area, rpc, await idDispositivo(area)),
      modo: "modal",
      fechar: () => dlg.close(),
      abrirLateral: ctx.lateralDisponivel ? () => abrirLateral(dlg) : undefined,
    });
    // Avisos: os do próprio app (sem emissor). O iframe cobre a tela, então já ficam no rodapé dela.
    mostrar();
    await app.iniciar();
  } catch (e) {
    app?.destruir();
    app = null;
    // Mesmo com erro o diálogo abre: é por ele que o usuário fecha o iframe que cobre a tela.
    raiz.replaceChildren(
      h("p", { class: "spro-lista-erro" }, `Não foi possível abrir o histórico: ${mensagem(e)}`),
      h(
        "div",
        { class: "spro-dialogo-rodape" },
        h("button", { type: "button", class: "spro-botao", onclick: () => dlg.close() }, "Fechar"),
      ),
    );
    mostrar();
  }
}

/** Barra lateral: o background abre o painel na aba Histórico; sem ele, uma janela própria. Depois o modal sai. */
function abrirLateral(dlg: HTMLDialogElement): void {
  // Chamado direto do clique: o sidePanel.open do background exige o gesto do usuário.
  chrome.runtime
    .sendMessage({ tipo: "abrirPainel", aba: "historico" })
    .catch(() => void window.open(chrome.runtime.getURL("html/painel.html#aba=historico"), "seiProPainel", "popup,width=420,height=760"))
    // Só depois: fechar tira o iframe, e com ele este código (o window.open da reserva não rodaria).
    .finally(() => dlg.close());
}

function abrirOpcoes(): void {
  void chrome.runtime.openOptionsPage().catch(() => void window.open(chrome.runtime.getURL("html/options.html"), "_blank"));
}

/** Diálogos do app: <dialog> modais irmãos do modal, e o mais novo fica por cima (top layer). */
const abrirModal: AbrirModal = ({ titulo, conteudo, icone: nome, aoFechar }) => {
  const dlg = h("dialog", { class: "spro-dialogo", "aria-label": titulo });
  const fechar = () => {
    if (dlg.open) dlg.close();
  };
  dlg.append(
    h(
      "header",
      {},
      nome ? h("span", { class: "spro-dialogo-icone", "aria-hidden": "true" }, icone(nome, 18)) : null,
      h("h2", {}, titulo),
      h(
        "button",
        { type: "button", class: "spro-botao-icone", "aria-label": "Fechar", title: "Fechar (Esc)", onclick: fechar },
        icone("fechar", 16),
      ),
    ),
    h("div", { class: "spro-dialogo-corpo" }, conteudo),
  );
  dlg.addEventListener("close", () => {
    dlg.remove();
    aoFechar?.();
  });
  document.body.append(dlg);
  dlg.showModal();
  // Foco no primeiro campo (e não no X do cabeçalho, o primeiro focável da árvore).
  dlg
    .querySelector<HTMLElement>(
      ".spro-dialogo-corpo :is(input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, .spro-combo, .spro-botao.primario)",
    )
    ?.focus({ preventScroll: true });
  return { fechar };
};

function confirmar(texto: string, rotuloOk = "Confirmar"): Promise<boolean> {
  return new Promise<boolean>((ok) => {
    let resposta = false;
    let modal: { fechar(): void } | null = null;
    const corpo = h(
      "div",
      {},
      h("p", {}, texto),
      h(
        "div",
        { class: "spro-dialogo-rodape" },
        h("button", { type: "button", class: "spro-botao", onclick: () => modal?.fechar() }, "Cancelar"),
        h(
          "button",
          {
            type: "button",
            class: "spro-botao perigo",
            onclick: () => {
              resposta = true;
              modal?.fechar();
            },
          },
          rotuloOk,
        ),
      ),
    );
    modal = abrirModal({ titulo: "Confirmar", icone: "alerta", conteudo: corpo, aoFechar: () => ok(resposta) });
  });
}

function baixar(nome: string, conteudo: string, tipo: string): void {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = h("a", { href: url, download: nome });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
