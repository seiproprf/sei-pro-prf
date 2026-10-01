/**
 * Entrada de html/favoritos.html. Liga o app ao navegador: <dialog>, download,
 * área de transferência, seletor de arquivo e a ponte com o SEI.
 *
 * Dois modos, pelo hash da URL:
 * - embutido (padrão): iframe abaixo da lista, ligado à PRÓPRIA aba;
 * - lateral (`#modo=lateral`): dentro do painel lateral, ligado à aba do SEI
 *   que está na frente nesta janela, e remontado quando ela é de outra unidade.
 */

import type { Area } from "@comum/armazenamento/area";
import { areaChrome } from "@comum/armazenamento/area";
import { idDispositivo } from "@comum/armazenamento/dispositivo";
import { hojeISO } from "@comum/datas/dias";
import { novoId } from "@comum/id";
import { ErroRpc, type PortaRpc, type Rpc } from "@comum/ponte/rpc";
import { h, icone } from "@comum/ui/dom";
import { CANAL_LATERAL } from "../modelo/constantes";
import { chaveDoContexto, escoposDoContexto } from "../modelo/escopo";
import { temPainelLateral } from "../modelo/exibicao";
import type { Carimbo, ContextoAba } from "../modelo/tipos";
import { RepositorioFavoritos } from "../repositorio";
import { ControleArquivo, type HandleArquivo, handlesNoIndexedDB, temSeletorDeArquivo } from "../sincronia/arquivoSync";
import { copiasNoIndexedDB } from "../sincronia/copias";
import { observarAltura } from "./altura";
import { type AbrirModal, AppFavoritos } from "./app";
import { PonteLateral } from "./lateral";
import { carregarLeaflet } from "./mapa";
import { esperarConexaoDaAba } from "./ponte";

const lateral = new URLSearchParams(location.hash.slice(1)).get("modo") === "lateral";
document.documentElement.dataset.modo = lateral ? "lateral" : "embutido";
const raiz = document.getElementById("app")!;

// Embutido: o ouvinte da porta é registrado já, antes do `load` do iframe, que é quando o content script conecta.
const conexao = lateral ? null : esperarConexaoDaAba();

const mostrarErro = (e: unknown) =>
  raiz.replaceChildren(h("p", { class: "fav-erro" }, `Não foi possível abrir os favoritos: ${e instanceof Error ? e.message : String(e)}`));

void (lateral ? iniciarLateral() : iniciarEmbutido()).catch(mostrarErro);

// O arquivo da nuvem pode ter mudado em outro computador enquanto o app estava escondido.
let appAtual: AppFavoritos | null = null;
addEventListener("focus", () => appAtual?.aoGanharFoco());
document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && appAtual?.aoGanharFoco());

interface Base {
  area: Area;
  sync: Area;
  carimbo: () => Carimbo;
}

async function base(): Promise<Base> {
  const area = areaChrome(chrome.storage.local, "local");
  const sync = areaChrome(chrome.storage.sync, "sync");
  const dispositivo = await idDispositivo(area);
  return { area, sync, carimbo: () => ({ agora: Date.now(), dispositivo }) };
}

async function iniciarEmbutido(): Promise<void> {
  const rpc = await conexao!;
  const ctx = await rpc.chamar<ContextoAba>("contexto");
  const b = await base();
  const altura = observarAltura(rpc);
  const app = criarApp(b, ctx, rpc, {
    aoAbrirModal: () => altura.minimo(640),
    aoFecharModal: () => altura.minimo(0),
    aoRedesenhar: () => altura.medir(),
  });
  appAtual = app;
  await app.iniciar();
}

async function iniciarLateral(): Promise<void> {
  const b = await base();
  let janela = -1;
  try {
    janela = (await chrome.windows.getCurrent()).id ?? -1;
  } catch {
    /* sidebar do Firefox: sem API de janelas, aceita qualquer aba */
  }
  const ponte = new PonteLateral({
    area: b.area,
    janela,
    novoId: () => novoId(),
    ouvirConexoes: (cb) =>
      chrome.runtime.onConnect.addListener((porta) => {
        // Portas de outros canais (o app embutido, o agente) não são deste painel: não se mexe nelas.
        if (porta.name === CANAL_LATERAL) cb(porta as unknown as PortaRpc, porta.sender ?? {});
      }),
  });
  // O rpc do app fala sempre com a aba da frente: trocar de aba na mesma unidade não remonta nada.
  const rpc: Pick<Rpc, "chamar"> = {
    chamar: <T>(op: string, args?: unknown, prazo?: number) => {
      const a = ponte.atual();
      return a
        ? a.rpc.chamar<T>(op, args, prazo)
        : Promise.reject(new ErroRpc("SEM_ABA", "Nenhuma aba do SEI aberta nesta janela. Abra o SEI e tente de novo."));
    },
  };
  let montado: { chave: string; app: AppFavoritos } | null = null;
  let fila = Promise.resolve();
  const esperando = h(
    "div",
    { class: "fav-sem-aba" },
    icone("estrela", 28),
    h("p", {}, "Abra o SEI nesta janela para ver seus favoritos."),
    h("p", { class: "fav-dica" }, "Se o SEI já está aberto e nada aparece, recarregue a página dele (F5)."),
  );
  const reagir = () => {
    fila = fila
      .then(async () => {
        const a = ponte.atual();
        const chave = a?.chave ?? "";
        if (montado && montado.chave === chave) return;
        montado?.app.destruir();
        montado = null;
        if (!a) {
          raiz.replaceChildren(esperando);
          return;
        }
        const ctx = await a.rpc.chamar<ContextoAba>("contexto");
        // A aba pode ter mudado enquanto o contexto chegava: a próxima volta da fila corrige.
        if (chaveDoContexto(ctx) !== chave) return;
        const app = criarApp(b, ctx, rpc, {});
        montado = { chave, app };
        appAtual = app;
        await app.iniciar();
      })
      .catch(mostrarErro);
  };
  raiz.replaceChildren(h("p", { class: "fav-dica" }, "Procurando o SEI nesta janela…"));
  ponte.aoMudar(reagir);
  await ponte.iniciar();
  addEventListener("pagehide", () => void ponte.encerrar());
  // As abas que já estão abertas conectam ao ver o anúncio; se nenhuma vier, avisa.
  setTimeout(reagir, 1500);
}

interface Ganchos {
  aoAbrirModal?: () => void;
  aoFecharModal?: () => void;
  aoRedesenhar?: () => void;
}

function criarApp(b: Base, ctx: ContextoAba, rpc: Pick<Rpc, "chamar">, g: Ganchos): AppFavoritos {
  document.documentElement.dataset.tema = ctx.temaEscuro ? "escuro" : "claro";
  const esc = escoposDoContexto(ctx);
  const repos = {
    unidade: esc.unidade ? new RepositorioFavoritos(b.area, esc.unidade, b.carimbo) : null,
    pessoal: new RepositorioFavoritos(b.area, esc.pessoal, b.carimbo),
  };

  const abrirModal: AbrirModal = ({ titulo, conteudo, aoFechar }) => {
    const dlg = h("dialog", { class: "spro-dialogo", "aria-label": titulo });
    const fechar = () => {
      if (dlg.open) dlg.close();
    };
    dlg.append(
      h(
        "header",
        {},
        h("h2", {}, titulo),
        h("button", { type: "button", class: "spro-botao-icone", "aria-label": "Fechar", onclick: fechar }, icone("fechar", 16)),
      ),
      h("div", { class: "spro-dialogo-corpo" }, conteudo),
    );
    dlg.addEventListener("close", () => {
      dlg.remove();
      g.aoFecharModal?.();
      aoFechar?.();
    });
    document.body.append(dlg);
    g.aoAbrirModal?.();
    dlg.showModal();
    return { fechar };
  };

  const confirmar = (texto: string) =>
    new Promise<boolean>((ok) => {
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
            "Confirmar",
          ),
        ),
      );
      modal = abrirModal({ titulo: "Confirmar", conteudo: corpo, aoFechar: () => ok(resposta) });
    });

  const baixar = (nome: string, conteudo: string, tipo: string) => {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = h("a", { href: url, download: nome });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const escolherArquivo = () =>
    new Promise<string | null>((ok) => {
      const i = h("input", { type: "file", accept: ".json,application/json" });
      i.addEventListener("change", async () => ok(i.files?.[0] ? await i.files[0].text() : null));
      i.addEventListener("cancel", () => ok(null));
      i.click();
    });

  return new AppFavoritos(raiz, {
    rpc,
    ctx,
    area: b.area,
    sync: b.sync,
    repos,
    carimbo: b.carimbo,
    abrirModal,
    confirmar,
    baixar,
    copiar: (texto) => navigator.clipboard.writeText(texto),
    escolherArquivo,
    hoje: () => hojeISO(),
    aoRedesenhar: g.aoRedesenhar,
    lateralDisponivel: temPainelLateral(chrome.runtime.getManifest()),
    carregarMapa: () => carregarLeaflet(document, (c) => `../${c}`),
    copias: copiasNoIndexedDB(),
    arquivo: temSeletorDeArquivo(window)
      ? new ControleArquivo({
          area: b.area,
          dono: { host: ctx.host, login: ctx.login.toLowerCase() },
          handles: handlesNoIndexedDB(),
          carimbo: b.carimbo,
          escolher: (modo) => escolherArquivoSync(modo),
        })
      : null,
  });
}

/** Seletor de arquivo do navegador (File System Access). Cancelar devolve null. */
async function escolherArquivoSync(modo: "novo" | "existente"): Promise<HandleArquivo | null> {
  const tipos = [{ description: "Favoritos do SEI Pro", accept: { "application/json": [".json"] } }];
  const w = window as unknown as {
    showSaveFilePicker(o: unknown): Promise<HandleArquivo>;
    showOpenFilePicker(o: unknown): Promise<HandleArquivo[]>;
  };
  try {
    if (modo === "novo") return await w.showSaveFilePicker({ suggestedName: "favoritos-seipro.json", types: tipos });
    return (await w.showOpenFilePicker({ types: tipos, multiple: false }))[0] ?? null;
  } catch (e) {
    if ((e as { name?: string }).name === "AbortError") return null;
    throw e;
  }
}
