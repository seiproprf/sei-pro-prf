import { parDePortas } from "@comum/ponte/parDePortas";
import { criarRpc } from "@comum/ponte/rpc";
import { abrirProcesso, localizarAbertura } from "../src/pagina/abrir";
import { tratadoresDaAba } from "../src/pagina/executor";
import { inserirNaOrdem, montarPainel, ordemLegada } from "../src/pagina/painel";
import { checar, instalarDom, lanca, secao, telaSei } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarPainel(): Promise<void> {
  secao("abrir processo sem montar link");
  const { doc: caixa } = telaSei("sei41/caixa.html");
  const pelaLinha = localizarAbertura(caixa, "157584");
  checar(
    "processo da caixa abre pelo link da propria linha",
    pelaLinha?.tipo === "linha" && pelaLinha.link.getAttribute("href")?.includes("id_procedimento=157584") === true,
  );
  checar("fora da caixa, pela pesquisa rapida", localizarAbertura(caixa, "1")?.tipo === "pesquisa");

  const doc = instalarDom(
    '<html><body><form id="frmProtocoloPesquisaRapida" target=""><input id="txtPesquisaRapida"></form><form id="frmProcedimentoControlar"></form></body></html>',
  );
  const form = doc.querySelector("form") as HTMLFormElement;
  let enviados = 0;
  let alvoNoEnvio = "";
  (form as unknown as { requestSubmit: () => void }).requestSubmit = () => {
    enviados += 1;
    alvoNoEnvio = form.getAttribute("target") ?? "";
  };
  checar("pesquisa rapida com o protocolo", abrirProcesso(doc, "9", "50300.000009/2026-09", false) === "pesquisa" && enviados === 1);
  checar("o numero vai no campo", (doc.querySelector("#txtPesquisaRapida") as HTMLInputElement).value === "50300.000009/2026-09");
  abrirProcesso(doc, "9", "50300.000009/2026-09", true);
  checar("nova aba usa target _blank e devolve o original", alvoNoEnvio === "_blank" && (form.getAttribute("target") ?? "") === "");
  const semPesquisa = instalarDom("<html><body></body></html>");
  checar("sem pesquisa rapida, erro claro", (await lanca(() => abrirProcesso(semPesquisa, "9", "x", false)))?.codigo === "SEM_PESQUISA");

  secao("painel embutido abaixo da lista");
  checar(
    "ordem do legado lida do optionsPro",
    ordemLegada({ getItem: () => JSON.stringify({ orderPanelHome: [{ name: "favoritesPro", index: 3 }] }) }) === 3,
  );
  checar("sem ordem guardada", ordemLegada({ getItem: () => null }) === null && ordemLegada({ getItem: () => "{x" }) === null);
  const docP = instalarDom('<html><body><form id="frmProcedimentoControlar"></form></body></html>');
  const recolhidos: boolean[] = [];
  const m = montarPainel(docP, {
    urlApp: "chrome-extension://abc/html/favoritos.html",
    recolhido: false,
    ordem: null,
    aoRecolher: (r) => recolhidos.push(r),
  });
  checar(
    "cria #panelHomePro depois do formulario e o painel dentro",
    docP.querySelector("#frmProcedimentoControlar + #panelHomePro > #favoritesPro") !== null,
  );
  checar(
    "iframe do app com permissao de copiar",
    m?.iframe.getAttribute("src") === "chrome-extension://abc/html/favoritos.html" && m.iframe.getAttribute("allow") === "clipboard-write",
  );
  (docP.querySelector(".spro-fav-recolher") as HTMLButtonElement).click();
  checar("recolher esconde e grava a preferencia", m?.corpo.hidden === true && recolhidos.join() === "true");
  checar("nao monta duas vezes", montarPainel(docP, { urlApp: "x", recolhido: false, ordem: null, aoRecolher: () => undefined }) === null);

  const docO = instalarDom(
    '<html><body><div id="c"><div class="panelHomePro" id="a" data-order="1"></div><div class="panelHomePro" id="b" data-order="5"></div></div></body></html>',
  );
  const novo = docO.createElement("div");
  novo.id = "n";
  inserirNaOrdem(docO.querySelector("#c")!, novo, 3);
  checar("entra na posicao da ordem salva", [...docO.querySelectorAll("#c > div")].map((d) => d.id).join() === "a,n,b");

  secao("operacoes que o app pede a aba");
  const docE = instalarDom(
    '<html><body><table><tr id="P5"><td></td><td><a href="controlador.php?acao=procedimento_trabalhar&id_procedimento=5">5/2026</a></td></tr></table></body></html>',
  );
  const iframe = docE.createElement("iframe");
  const loja = {
    getItem: (k: string) =>
      k === "configDataFavoritesPro" ? JSON.stringify({ favorites: [{ id_procedimento: "1", processo: "1/2026" }] }) : null,
  };
  const [ladoApp, ladoAba] = parDePortas();
  criarRpc(ladoAba, tratadoresDaAba({ doc: docE, ctx: CTX, iframe, armazenamento: loja }));
  const app = criarRpc(ladoApp);
  checar("contexto", (await app.chamar<typeof CTX>("contexto")).login === CTX.login);
  await app.chamar("altura", { px: 345.4 });
  checar("altura do iframe segue o conteudo", iframe.style.height === "345px", iframe.style.height);
  await app.chamar("altura", { px: 10 });
  checar("altura minima", iframe.style.height === "80px");
  checar("abre pela linha", (await app.chamar("abrirProcesso", { id: "5", protocolo: "5/2026" })) === "linha");
  const legado = await app.chamar<{ local: { favorites: unknown[] }; arquivo: unknown }>("lerLegado");
  checar("le os favoritos antigos do localStorage", legado.local.favorites.length === 1 && legado.arquivo === null);
}
