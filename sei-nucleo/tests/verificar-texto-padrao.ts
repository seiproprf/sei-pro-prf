/**
 * Armazém em Texto Padrão contra as telas reais do SEI 4.1.5 (fixtures da
 * prova P1), com um transporte falso que faz o papel do servidor.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { criarArmazemTextoPadrao } from "../src/dominio/textoPadrao";
import { Sei } from "../src/sei";
import { checar, lanca, paginaSintetica, secao } from "./util";

const AQUI = dirname(fileURLToPath(import.meta.url));
const ler = (n: string) => readFileSync(join(AQUI, "fixtures", "sei41", n), "utf8").replace(/^<!-- url: .*? -->\n/, "");
const NOME = "[_SEIPRO_FAV_ana]";
const RAIZ = "https://sei.exemplo.gov.br/sei/";

/** Servidor falso: a lista tem `textos`, com o nosso na página `paginaDoNosso` (0 ou 1). */
function servidor(o: { existe: boolean; paginaDoNosso?: number; conteudo?: string; semMenu?: boolean }) {
  const estado = { existe: o.existe, conteudo: o.conteudo ?? "<p>x</p>", posts: [] as Array<{ acao: string; corpo: string }> };
  const listar0 = ler("texto_padrao_listar.html");
  const comNosso = (html: string) => html.replace(/ASSINATURA 2/g, NOME);
  const pagina = (n: number) => {
    let h = listar0;
    if (estado.existe && (o.paginaDoNosso ?? 0) === n) h = comNosso(h);
    // Página 0 de duas: o controle "próxima" do infra.
    if (n === 0 && (o.paginaDoNosso ?? 0) === 1) h = h.replace('<div id="divInfraAreaPaginacaoSuperior" class="infraAreaPaginacao">', `<div id="divInfraAreaPaginacaoSuperior" class="infraAreaPaginacao"><a href="javascript:infraAcaoPaginar('+',1,'Infra', null);">Próxima</a>`);
    return h;
  };
  const resp = (url: string, html: string) => {
    const bytes = new Uint8Array([...html].map((c) => c.charCodeAt(0) & 0xff));
    return { url, status: 200, arrayBuffer: async () => bytes.buffer } as unknown as Response;
  };
  const fetch = (async (u: string, init?: RequestInit) => {
    const acao = /[?&]acao=(\w+)/.exec(u)?.[1] ?? "";
    const corpo = String(init?.body ?? "");
    if (init?.method === "POST") estado.posts.push({ acao, corpo });
    const lista = (n = 0) => resp(`${RAIZ}controlador.php?acao=texto_padrao_interno_listar&infra_hash=1`, pagina(n));
    if (acao === "texto_padrao_interno_listar") return lista(/hdnInfraPaginaAtual=(\d+)/.exec(corpo) ? Number(/hdnInfraPaginaAtual=(\d+)/.exec(corpo)![1]) : 0);
    if (acao === "texto_padrao_interno_cadastrar" && init?.method === "POST") {
      estado.existe = true;
      return lista();
    }
    if (acao === "texto_padrao_interno_alterar" && init?.method === "POST") return lista();
    if (acao === "texto_padrao_interno_excluir") {
      estado.existe = false;
      return lista();
    }
    if (acao === "texto_padrao_interno_cadastrar") return resp(u, ler("texto_padrao_cadastrar.html"));
    if (acao === "texto_padrao_interno_alterar") return resp(u, ler("texto_padrao_alterar.html"));
    if (acao === "texto_padrao_interno_consultar") {
      const c = estado.conteudo.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      return resp(u, ler("texto_padrao_consultar.html").replace(/(<textarea[^>]*name="txaConteudo"[^>]*>)[\s\S]*?(<\/textarea>)/, `$1${c}$2`));
    }
    return resp(u, "<html><body>?</body></html>");
  }) as unknown as typeof globalThis.fetch;
  const menu = o.semMenu ? "" : `<a href="controlador.php?acao=texto_padrao_interno_listar&infra_item_menu=162&infra_hash=${"0".repeat(64)}">Textos Padrão</a>`;
  const base = paginaSintetica(`<div id="infraMenu">${menu}</div><form id="frmProtocoloPesquisaRapida"></form>`, `${RAIZ}controlador.php?acao=procedimento_controlar`);
  const sei = new Sei(base.url, () => base, { fetch });
  return { sei, estado };
}

export async function verificarTextoPadrao(): Promise<void> {
  secao("texto padrao: localizar");
  const s1 = servidor({ existe: true });
  const a1 = criarArmazemTextoPadrao(s1.sei, { nome: NOME, descricao: "Dados internos do SEI Pro" });
  const achado = await a1.localizar();
  checar("acha pelo nome exato na lista", achado?.id === "901" && !!achado.consultar && !!achado.alterar, achado);
  const s2 = servidor({ existe: true, paginaDoNosso: 1 });
  const achado2 = await criarArmazemTextoPadrao(s2.sei, { nome: NOME, descricao: "x" }).localizar();
  checar("acha na pagina 2 (paginacao pelo formulario da lista)", achado2?.id === "901" && s2.estado.posts.some((p) => p.acao === "texto_padrao_interno_listar" && /hdnInfraPaginaAtual=1/.test(p.corpo)), s2.estado.posts);
  checar("ausente: null", (await criarArmazemTextoPadrao(servidor({ existe: false }).sei, { nome: NOME, descricao: "x" }).localizar()) === null);

  secao("texto padrao: ler, gravar, excluir");
  const s3 = servidor({ existe: true, conteudo: "<p>Legivel ok</p>\n<p>QUJD_-x</p>" });
  const a3 = criarArmazemTextoPadrao(s3.sei, { nome: NOME, descricao: "x" });
  const lido = await a3.ler();
  // O escape do <textarea> (um ou dois níveis, conforme a versão) é desfeito por quem decodifica (sei-comum/sincronia/codec).
  checar("le o conteudo do textarea (sem id, por name)", lido?.includes("QUJD_-x") === true, lido);
  checar("ler ausente: null", (await criarArmazemTextoPadrao(servidor({ existe: false }).sei, { nome: NOME, descricao: "x" }).ler()) === null);
  await a3.gravar("<p>novo</p>");
  const alt = s3.estado.posts.find((p) => p.acao === "texto_padrao_interno_alterar");
  checar("existente: altera com o botao de alterar e o conteudo", !!alt && /sbmAlterarTextoPadraoInterno=/.test(alt.corpo) && /txaConteudo=%3Cp%3Enovo%3C%2Fp%3E/.test(alt.corpo), alt?.corpo.slice(0, 300));
  const s4 = servidor({ existe: false });
  const a4 = criarArmazemTextoPadrao(s4.sei, { nome: NOME, descricao: "Dados internos" });
  await a4.gravar("<p>primeiro</p>");
  const cad = s4.estado.posts.find((p) => p.acao === "texto_padrao_interno_cadastrar");
  checar("ausente: cadastra com nome, descricao e botao de cadastrar", !!cad && /sbmCadastrarTextoPadraoInterno=/.test(cad.corpo) && cad.corpo.includes(`txtNome=${encodeURIComponent(NOME).replace(/%20/g, "+")}`), cad?.corpo.slice(0, 300));
  await a4.excluir();
  const exc = s4.estado.posts.find((p) => p.acao === "texto_padrao_interno_excluir");
  checar("excluir posta o id no link assinado da lista", !!exc && /hdnInfraItemId=901/.test(exc.corpo), exc?.corpo.slice(0, 200));
  checar("e some da lista", (await a4.localizar()) === null);

  secao("texto padrao: sem permissao");
  const e = await lanca(() => criarArmazemTextoPadrao(servidor({ existe: false, semMenu: true }).sei, { nome: NOME, descricao: "x" }).localizar());
  checar("sem o item no menu: SEI_ACAO_INDISPONIVEL", e?.codigo === "SEI_ACAO_INDISPONIVEL", e);
  const longo = await lanca(() => criarArmazemTextoPadrao(s1.sei, { nome: "x".repeat(51), descricao: "x" }).localizar());
  checar("nome acima de 50 e recusado", longo?.codigo === "ARGUMENTO_INVALIDO", longo);
}
