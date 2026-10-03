import { parDePortas } from "@comum/ponte/parDePortas";
import { criarRpc, type PortaRpc, type Rpc } from "@comum/ponte/rpc";
import { EVENTO_ABRIR, LEGADO_CHAVE } from "../src/modelo/constantes";
import type { ContextoHistorico } from "../src/modelo/tipos";
import { tratadoresHistorico } from "../src/pagina/executor";
import { criarControleModal, montarModal } from "../src/pagina/modal";
import { checar, instalarDom, lanca, secao, telaSei, tique } from "./util";

const CTX: ContextoHistorico = {
  host: "sei.antaq.gov.br",
  login: "pedro.soares",
  nome: "Pedro Soares",
  unidade: { id: "110000001", sigla: "GPF", nome: "Gerência de Fiscalização" },
  versao: "4.1.5",
  temaEscuro: false,
  favoritosAtivo: false,
  lateralDisponivel: true,
};

const URL_APP = "chrome-extension://abc/html/historico.html#modo=modal";

/** Tecla do linkedom (o KeyboardEvent do Node não serve aos elementos dele). */
function tecla(el: Element, key: string): void {
  const Ev = (el.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  const ev = new Ev("keydown", { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "key", { value: key });
  el.dispatchEvent(ev);
}

/** O que o item do menu do legado faz (sei-functions-pro.js#getHistoryProcessosPro). */
function pedirAbertura(doc: Document): void {
  const Ev = (doc.defaultView as unknown as { CustomEvent: typeof CustomEvent }).CustomEvent;
  doc.dispatchEvent(new Ev(EVENTO_ABRIR));
}

/** Avisos do console durante `fazer` (sem sujar a saída das provas). */
function avisosDoConsole(fazer: () => unknown): string[] {
  const original = console.warn;
  const avisos: string[] = [];
  console.warn = (...a: unknown[]) => {
    avisos.push(a.map(String).join(" "));
  };
  try {
    fazer();
  } finally {
    console.warn = original;
  }
  return avisos;
}

const iframes = (doc: Document) => doc.querySelectorAll("iframe[data-spro-historico-modal]");

function armazenamentoFalso(inicial: Record<string, string> = {}) {
  const m = new Map(Object.entries(inicial));
  return {
    getItem: (k: string) => m.get(k) ?? null,
    removeItem: (k: string) => void m.delete(k),
    tem: (k: string) => m.has(k),
  };
}

export async function verificarModal(): Promise<void> {
  secao("historico: modal sobre a tela do SEI (montarModal)");
  const doc = instalarDom("<html><body><p>Controle de Processos</p></body></html>");
  doc.body.style.overflow = "scroll";
  let fechou = 0;
  const m = montarModal(doc, { urlApp: URL_APP, temaEscuro: true, aoFechar: () => fechou++ });
  const fr = doc.querySelector<HTMLIFrameElement>("iframe[data-spro-historico-modal]");
  checar("cria o iframe do app no body", !!fr && fr === m.iframe && fr.parentElement === doc.body);
  checar("iframe aponta para o app no modo modal", fr?.getAttribute("src") === URL_APP);
  checar(
    "iframe cobre a tela inteira, por cima de tudo",
    fr?.style.position === "fixed" && fr.style.inset === "0" && fr.style.zIndex === "2147483646",
    fr?.getAttribute("style"),
  );
  checar(
    "fundo transparente e color-scheme do tema (senao o Chrome pinta fundo opaco)",
    fr?.style.background === "transparent" && fr.style.getPropertyValue("color-scheme") === "dark",
    fr?.getAttribute("style"),
  );
  checar("iframe com permissao de copiar e titulo", fr?.getAttribute("allow") === "clipboard-write" && !!fr.getAttribute("title"));
  checar(
    "trava a rolagem da pagina (html e body)",
    doc.documentElement.style.overflow === "hidden" && doc.body.style.overflow === "hidden",
  );
  m.fechar();
  checar("fechar tira o iframe", iframes(doc).length === 0);
  checar("fechar devolve os valores exatos de antes", doc.body.style.overflow === "scroll" && doc.documentElement.style.overflow === "", [
    doc.body.style.overflow,
    doc.documentElement.style.overflow,
  ]);
  checar("fechar chama o aoFechar", fechou === 1);
  checar("fechar duas vezes nao lanca nem repete o aoFechar", (await lanca(() => m.fechar())) === null && fechou === 1);
  const claro = montarModal(doc, { urlApp: URL_APP, temaEscuro: false });
  checar("tema claro: color-scheme light", claro.iframe.style.getPropertyValue("color-scheme") === "light");
  claro.fechar();

  secao("historico: modal pelo item do menu (content script do topo)");
  const docT = instalarDom('<html><body><ul id="infraMenu"><li><a id="historicoProcessosPro">Histórico</a></li></ul></body></html>');
  let focos = 0;
  (docT.getElementById("historicoProcessosPro") as HTMLElement).focus = () => {
    focos++;
  };
  const loja = armazenamentoFalso({ [LEGADO_CHAVE]: "[]" });
  let ladoApp: PortaRpc | null = null;
  let conexoes = 0;
  let conectarFalha = false;
  let urlFalha = false;
  const controle = criarControleModal(docT, {
    urlApp: () => {
      if (urlFalha) throw new Error("Extension context invalidated.");
      return URL_APP;
    },
    temaEscuro: false,
    conectar: () => {
      if (conectarFalha) throw new Error("Extension context invalidated.");
      conexoes++;
      const [app, aba] = parDePortas();
      ladoApp = app;
      return aba;
    },
    tratadores: (fechar) => tratadoresHistorico({ doc: docT, ctx: CTX, armazenamento: loja, fechar }),
    prazoContatoMs: 40,
  });
  /** O app conecta como o html/historico.html: na carga do iframe, pede o contexto. */
  const carregar = async (): Promise<Rpc> => {
    const f = iframes(docT)[0];
    if (!f) throw new Error("sem iframe");
    f.dispatchEvent(new (docT.defaultView as unknown as { Event: typeof Event }).Event("load"));
    const app = criarRpc(ladoApp!);
    await app.chamar<ContextoHistorico>("contexto");
    return app;
  };

  pedirAbertura(docT);
  checar("o evento do menu abre o modal", iframes(docT).length === 1 && controle.aberto);
  checar("pagina travada", docT.documentElement.style.overflow === "hidden" && docT.body.style.overflow === "hidden");
  pedirAbertura(docT);
  checar("o evento de novo, com o modal aberto, nao cria um segundo iframe", iframes(docT).length === 1);
  const app1 = await carregar();
  checar("na carga do iframe, uma porta nova que atende o app", conexoes === 1 && app1.aberta);
  tecla(docT.body, "Escape");
  checar("Esc na pagina fecha o modal", iframes(docT).length === 0 && !controle.aberto);
  checar("Esc destrava a rolagem", docT.documentElement.style.overflow === "" && docT.body.style.overflow === "");
  checar("fechar devolve o foco ao item do menu", focos === 1);
  await tique();
  checar("fechar derruba a porta do app", !app1.aberta);
  tecla(docT.body, "Escape");
  checar("Esc com o modal fechado nao faz nada", focos === 1);

  pedirAbertura(docT);
  checar("abre de novo depois de fechado", iframes(docT).length === 1);
  await carregar();
  ladoApp!.disconnect();
  await tique();
  checar("porta caida (extensao recarregada): o iframe sai", iframes(docT).length === 0 && !controle.aberto);
  checar("porta caida: a rolagem volta", docT.documentElement.style.overflow === "" && docT.body.style.overflow === "");
  checar("porta caida: o foco volta ao item do menu", focos === 2);

  pedirAbertura(docT);
  const app3 = await carregar();
  const pedido = await lanca(() => app3.chamar("fechar"));
  checar("o app pede fechar (X, Esc ou veu do dialogo): o modal sai", iframes(docT).length === 0 && !controle.aberto, pedido);
  checar("fechar pelo app destrava e devolve o foco", docT.body.style.overflow === "" && focos === 3);

  pedirAbertura(docT);
  const f4 = iframes(docT)[0];
  f4?.dispatchEvent(new (docT.defaultView as unknown as { Event: typeof Event }).Event("load"));
  await tique(80);
  checar("o app nao responde no prazo: o modal sai (nao prende a tela)", iframes(docT).length === 0 && !controle.aberto);

  pedirAbertura(docT);
  await carregar();
  await tique(80);
  checar("com o app conversando, o prazo nao fecha", iframes(docT).length === 1 && controle.aberto);
  controle.fechar();
  controle.fechar();
  checar("fechar de novo nao repete nada", iframes(docT).length === 0 && focos === 5);

  pedirAbertura(docT);
  conectarFalha = true;
  const avisosConectar = avisosDoConsole(() =>
    iframes(docT)[0]?.dispatchEvent(new (docT.defaultView as unknown as { Event: typeof Event }).Event("load")),
  );
  checar(
    "sem como conectar (extensao recarregada): o modal sai na hora e avisa no console",
    iframes(docT).length === 0 && !controle.aberto && avisosConectar.length === 1,
  );
  conectarFalha = false;

  urlFalha = true;
  let erro: unknown = null;
  const avisosUrl = avisosDoConsole(() => {
    try {
      pedirAbertura(docT);
    } catch (e) {
      erro = e;
    }
  });
  checar(
    "sem o endereco do app, nao monta nada, nao lanca e avisa no console",
    erro === null && iframes(docT).length === 0 && avisosUrl.length === 1,
  );
  urlFalha = false;
  controle.desligar();
  pedirAbertura(docT);
  checar("desligado, o evento nao abre", iframes(docT).length === 0);

  secao("historico: pedidos do app a aba (tratadoresHistorico)");
  const docE = instalarDom(
    '<html><body><form id="frmProtocoloPesquisaRapida" target=""><input id="txtPesquisaRapida"></form></body></html>',
  );
  const form = docE.querySelector("form") as HTMLFormElement;
  let enviados = 0;
  (form as unknown as { requestSubmit: () => void }).requestSubmit = () => {
    enviados++;
  };
  let fechados = 0;
  const lojaE = armazenamentoFalso({ [LEGADO_CHAVE]: '[{"id_procedimento":"1"}]', outra: "x" });
  const [pApp, pAba] = parDePortas();
  criarRpc(pAba, tratadoresHistorico({ doc: docE, ctx: CTX, armazenamento: lojaE, fechar: () => fechados++ }));
  const appE = criarRpc(pApp);
  checar("contexto devolve o ctx", (await appE.chamar<ContextoHistorico>("contexto")).login === CTX.login);
  const r = await appE.chamar("abrirProcesso", { id: "9", protocolo: "50300.000009/2026-09", novaAba: false });
  checar(
    "abrirProcesso pela pesquisa rapida: preenche o numero e submete",
    r === "pesquisa" && enviados === 1 && (docE.querySelector("#txtPesquisaRapida") as HTMLInputElement).value === "50300.000009/2026-09",
  );
  const { doc: caixa } = telaSei("sei41/caixa.html");
  const [cApp, cAba] = parDePortas();
  criarRpc(cAba, tratadoresHistorico({ doc: caixa, ctx: CTX, armazenamento: lojaE }));
  const appC = criarRpc(cApp);
  checar(
    "abrirProcesso na caixa: pelo link da propria linha",
    (await appC.chamar("abrirProcesso", { id: "157584", protocolo: "x", novaAba: false })) === "linha",
  );
  checar("fechar chama o fechar da aba", (await appE.chamar("fechar")) === true && fechados === 1);
  checar("sem fechar (barra lateral), responde false", (await appC.chamar("fechar")) === false);
  await appE.chamar("apagarLegado");
  checar("apagarLegado remove so a chave antiga", !lojaE.tem(LEGADO_CHAVE) && lojaE.tem("outra"));
  const quebrada = {
    removeItem: (): void => {
      throw new Error("sem acesso ao localStorage");
    },
  };
  const [qApp, qAba] = parDePortas();
  criarRpc(qAba, tratadoresHistorico({ doc: docE, ctx: CTX, armazenamento: quebrada }));
  checar(
    "apagarLegado sem acesso: o erro volta ao app (que grava a pendencia)",
    (await lanca(() => criarRpc(qApp).chamar("apagarLegado"))) !== null,
  );
}
