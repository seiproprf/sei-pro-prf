import { parDePortas } from "@comum/ponte/parDePortas";
import { criarRpc } from "@comum/ponte/rpc";
import { abrirProcesso, localizarAbertura } from "../src/pagina/abrir";
import { avisoNaPagina } from "../src/pagina/aviso";
import { instalarEstilo } from "../src/pagina/estilo";
import { tratadoresDaAba } from "../src/pagina/executor";
import { igualarAoTituloDoSei, inserirNaOrdem, montarPainel, ordemLegada } from "../src/pagina/painel";
import { criarSobreposicao } from "../src/pagina/sobreposicao";
import { botao, checar, disparar, instalarDom, lanca, secao, telaSei, tique } from "./util";
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
  const docT = instalarDom('<html><body><div id="divInfraBarraLocalizacao">Controle de Processos</div></body></html>');
  (docT.defaultView as unknown as { getComputedStyle: () => Partial<CSSStyleDeclaration> }).getComputedStyle = () => ({
    fontSize: "22.4px",
    fontWeight: "600",
    fontFamily: "Roboto, Arial",
  });
  const tituloT = docT.createElement("div");
  igualarAoTituloDoSei(docT, tituloT);
  checar(
    "titulo Favoritos com a mesma letra do titulo da tela",
    tituloT.style.fontSize === "22.4px" && tituloT.style.fontWeight === "600",
    tituloT.getAttribute("style"),
  );
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
  const tituloP = docP.querySelector("#favoritesPro .spro-fav-titulo");
  checar(
    "texto do titulo solto no div, como o do Controle de Processos (o SEI encolhe todo span)",
    !tituloP?.querySelector("span") && (tituloP?.textContent ?? "").trim() === "Favoritos",
    tituloP?.innerHTML,
  );
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

  secao("dialogo do painel embutido no meio da tela (sobreposicao)");
  const docS = instalarDom(
    '<html><body><div id="corpo"><iframe id="f" style="width: 100%; height: 300px; border: 0;"></iframe></div></body></html>',
  );
  const fr = docS.getElementById("f") as HTMLIFrameElement;
  const corpoS = docS.getElementById("corpo") as HTMLElement;
  const [pApp, pAba] = parDePortas();
  criarRpc(
    pAba,
    tratadoresDaAba({
      doc: docS,
      ctx: CTX,
      iframe: fr,
      armazenamento: { getItem: () => null },
      sobreposicao: criarSobreposicao(docS, fr, corpoS),
    }),
  );
  const appS = criarRpc(pApp);
  checar("liga", (await appS.chamar("sobrepor", { ativo: true })) === true);
  checar(
    "iframe cobre a tela visivel, por cima de tudo",
    fr.style.position === "fixed" && fr.style.height === "100vh" && fr.style.width === "100vw" && fr.style.zIndex === "2147483646",
    fr.getAttribute("style"),
  );
  checar("reserva o lugar do iframe (a pagina nao pula)", corpoS.style.minHeight === "300px", corpoS.style.minHeight);
  checar("trava a rolagem da pagina", docS.documentElement.style.overflow === "hidden");
  await appS.chamar("altura", { px: 500 });
  checar("altura pedida durante a sobreposicao espera", fr.style.height === "100vh");
  await appS.chamar("sobrepor", { ativo: false });
  checar(
    "desliga e devolve tudo, ja com a altura pedida",
    fr.style.position === "" && fr.style.height === "500px" && corpoS.style.minHeight === "" && docS.documentElement.style.overflow === "",
    fr.getAttribute("style"),
  );
  checar("sem sobreposicao (lateral), nega", (await app.chamar("sobrepor", { ativo: true })) === false);
  await appS.chamar("sobrepor", { ativo: true });
  disparar(fr, "load");
  checar(
    "iframe recarregado com dialogo aberto: a pagina destrava sozinha",
    fr.style.position === "" && docS.documentElement.style.overflow === "",
    fr.getAttribute("style"),
  );

  secao("sobreposicao: painel recolhido e painel fechado com dialogo aberto");
  const docR = instalarDom('<html><body><form id="frmProcedimentoControlar"></form></body></html>');
  const rec = montarPainel(docR, { urlApp: "x", recolhido: true, ordem: null, aoRecolher: () => undefined })!;
  checar(
    "painel recolhido: nega a sobreposicao (o dialogo nem aparece) e nao trava a pagina",
    rec.sobreposicao.ligar(true) === false && docR.documentElement.style.overflow === "" && rec.iframe.style.position === "",
  );
  rec.corpo.hidden = false;
  checar("aberto de novo: liga", rec.sobreposicao.ligar(true) === true && docR.documentElement.style.overflow === "hidden");
  rec.fechar();
  checar(
    "fechar o painel (trocou 'onde mostrar') com o dialogo aberto destrava a pagina",
    docR.documentElement.style.overflow === "" && !docR.querySelector("#favoritesPro"),
  );

  secao("aviso do painel embutido no rodape da tela");
  const docEst = instalarDom("<html><head></head><body></body></html>");
  instalarEstilo(docEst);
  checar(
    "a animacao do aviso existe no CSS da pagina",
    (docEst.getElementById("spro-fav-estilo")?.textContent ?? "").includes("@keyframes spro-fav-aviso"),
  );
  const docA = instalarDom("<html><body></body></html>");
  const [aApp, aAba] = parDePortas();
  criarRpc(
    aAba,
    tratadoresDaAba({ doc: docA, ctx: CTX, iframe: null, armazenamento: { getItem: () => null }, avisar: avisoNaPagina(docA, false) }),
  );
  const appA = criarRpc(aApp);
  const resposta = appA.chamar<boolean>("aviso", { texto: "1 favorito foi para a lixeira.", acao: "Desfazer", ms: 5000 });
  await tique();
  const toast = docA.querySelector(".spro-fav-aviso");
  checar("mostra o texto na pagina do SEI", (toast?.textContent ?? "").includes("1 favorito foi para a lixeira."));
  botao(docA.body, "Desfazer")!.click();
  checar("a acao volta ao app", (await resposta) === true && !docA.querySelector(".spro-fav-aviso"));
  const semAcao = appA.chamar<boolean>("aviso", { texto: "Copiado.", ms: 20 });
  checar("some sozinho e diz que nao houve acao", (await semAcao) === false);
}
