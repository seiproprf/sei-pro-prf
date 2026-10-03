/**
 * Entrada de html/historico.html. Liga o app ao navegador: <dialog>, download,
 * área de transferência e a ponte com o SEI.
 *
 * Dois modos, pelo hash da URL:
 * - modal (padrão, `#modo=modal&tema=claro|escuro`): iframe transparente sobre
 *   a tela do SEI, ligado à PRÓPRIA aba (pagina/modal.ts); o app mora num
 *   <dialog> com véu;
 * - lateral (`#modo=lateral`): dentro do painel lateral (Task 14).
 */

import { areaChrome } from "@comum/armazenamento/area";
import { lerOpcaoLegada } from "@comum/opcoes/legadas";
import { esperarConexaoDaAba } from "@comum/ponte/conexaoDaAba";
import type { Rpc } from "@comum/ponte/rpc";
import { h, icone } from "@comum/ui/dom";
import { CANAL_HISTORICO, chaveEscopo } from "../modelo/constantes";
import type { ContextoHistorico } from "../modelo/tipos";
import { RepositorioHistorico } from "../repositorio";
import { type AbrirModal, AppHistorico } from "./app";

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

if (lateral) raiz.replaceChildren(h("p", { class: "spro-lista-erro" }, "A barra lateral do histórico ainda não está disponível."));
else void iniciarModal();

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
      modo: "modal",
      ctx,
      area,
      repo: new RepositorioHistorico(area, chaveEscopo(ctx.host, ctx.login)),
      rpc,
      // Task 15: a ponte com os Favoritos.
      favoritos: null,
      historicoLigado: () => lerOpcaoLegada("historicoproc"),
      abrirModal,
      confirmar,
      baixar,
      copiar: (texto) => navigator.clipboard.writeText(texto),
      agora: () => Date.now(),
      fechar: () => dlg.close(),
      abrirLateral: ctx.lateralDisponivel ? () => abrirLateral(dlg) : undefined,
      abrirOpcoes,
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
