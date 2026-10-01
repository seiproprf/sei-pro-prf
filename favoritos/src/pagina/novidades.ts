/**
 * De onde vem o "atual" de cada favorito (spec 7.3), do mais barato ao mais
 * caro, e nunca abrindo a árvore de processo aberto na unidade:
 *
 * 1. A CAIXA que o usuário já carregou: aberto na unidade, não visualizado,
 *    documento novo, atribuição e sinais. "Fora da unidade" só se conclui com
 *    a caixa inteira na tela: na paginada, ausente pode estar na página 2.
 *    Só a lista da unidade: para a Pessoal, "a unidade" muda com o usuário.
 * 2. A ÁRVORE que o próprio usuário abriu: quantidade de documentos e o último
 *    andamento (pelo link do histórico que a própria árvore traz; o histórico
 *    não chama `receber`). Abrir é ver: o visto passa a ser essa leitura.
 *
 * A primeira leitura de um favorito vira também o `visto`: sem base, nada de
 * "novidade" falsa.
 */

import { lerArvore } from "@nucleo/dominio/arvore";
import { lerCaixaDaPagina } from "@nucleo/dominio/caixa";
import { lerHistorico } from "@nucleo/dominio/historico";
import { linkDaAcao } from "@nucleo/links/links";
import type { Pagina } from "@nucleo/sessao/http";
import type { Instantaneo } from "../modelo/tipos";
import type { RepositorioFavoritos } from "../repositorio";
import { paginaDe } from "./contexto";

/** A caixa está inteira na tela? (O caption diz "N registros"; a página mostra as linhas.) */
function caixaInteira(doc: Document): boolean {
  for (const id of ["#tblProcessosRecebidos", "#tblProcessosGerados"]) {
    const t = doc.querySelector(id);
    if (!t) continue;
    const total = Number(/\((\d+)\s+registro/.exec(t.querySelector("caption")?.textContent ?? "")?.[1] ?? Number.NaN);
    if (!Number.isFinite(total) || total > t.querySelectorAll("tr[id^='P']").length) return false;
  }
  return true;
}

const igual = (a: Instantaneo | undefined, b: Instantaneo) =>
  !!a &&
  a.abertoNaUnidade === b.abertoNaUnidade &&
  a.naoVisualizado === b.naoVisualizado &&
  a.documentoNovo === b.documentoNovo &&
  a.atribuido === b.atribuido &&
  JSON.stringify(a.marcadores ?? []) === JSON.stringify(b.marcadores ?? []);

/** Sinais da caixa para a lista DA UNIDADE. Devolve quantos favoritos foram atualizados. */
export async function capturarDaCaixa(doc: Document, repo: RepositorioFavoritos, agora = Date.now()): Promise<number> {
  if (repo.escopo.lista !== "unidade") return 0;
  const linhas = new Map(lerCaixaDaPagina(paginaDe(doc)).map((p) => [p.idProcedimento, p]));
  const inteira = caixaInteira(doc);
  const [ativos, atuais] = await Promise.all([repo.ativos(), repo.atuais()]);
  const gravar: Array<[string, Instantaneo]> = [];
  const semVisto: Array<[string, Instantaneo]> = [];
  for (const f of ativos) {
    const linha = linhas.get(f.id);
    const anterior = atuais.get(f.id);
    let novo: Instantaneo;
    if (linha) {
      novo = {
        ...anterior,
        quando: agora,
        fonte: "caixa",
        abertoNaUnidade: true,
        naoVisualizado: linha.novo,
        documentoNovo: linha.documentoNovo,
        atribuido: linha.atribuido || undefined,
        marcadores: linha.sinais.filter((s) => /marcador/i.test(s)),
        recebidoNaLeitura: undefined,
      };
    } else if (inteira) {
      novo = {
        ...anterior,
        quando: agora,
        fonte: "caixa",
        abertoNaUnidade: false,
        naoVisualizado: undefined,
        documentoNovo: undefined,
        recebidoNaLeitura: undefined,
      };
    } else {
      continue;
    }
    if (!igual(anterior, novo)) gravar.push([f.id, novo]);
    if (!f.visto) semVisto.push([f.id, novo]);
  }
  if (gravar.length) await repo.gravarAtuais(gravar);
  for (const [id, inst] of semVisto) await repo.editar(id, { visto: inst });
  return gravar.length;
}

/**
 * A árvore aberta pelo usuário (`ifrArvore`). `obter` busca o histórico pelo
 * link que a própria árvore traz. Devolve em quantas listas o processo é favorito.
 */
export async function capturarDaArvore(
  doc: Document,
  url: string,
  repos: RepositorioFavoritos[],
  obter: (url: string) => Promise<Pagina>,
  agora = Date.now(),
): Promise<number> {
  let arv: ReturnType<typeof lerArvore>;
  try {
    arv = lerArvore(paginaDe(doc, url));
  } catch {
    return 0;
  }
  if (!arv.idProcedimento || arv.nivel === "sigiloso") return 0;
  const donos: RepositorioFavoritos[] = [];
  for (const r of repos) if (await r.contem(arv.idProcedimento)) donos.push(r);
  if (!donos.length) return 0;
  const linkHistorico =
    linkDaAcao(arv.links, "procedimento_consultar_historico") ??
    /consultarAndamento\('([^']+)'/
      .exec(doc.querySelector("#divConsultarAndamento a")?.getAttribute("onclick") ?? "")?.[1]
      ?.replace(/&amp;/g, "&") ??
    null;
  let ultimoAndamento: Instantaneo["ultimoAndamento"];
  if (linkHistorico) {
    try {
      const a = lerHistorico(await obter(linkHistorico))[0];
      if (a) ultimoAndamento = { data: a.data, unidade: a.unidade, descricao: a.descricao };
    } catch {
      /* sem histórico, fica só a contagem de documentos */
    }
  }
  for (const r of donos) {
    const anterior = (await r.atuais()).get(arv.idProcedimento);
    const novo: Instantaneo = {
      ...anterior,
      quando: agora,
      fonte: "arvore",
      qtdDocumentos: arv.documentos.length,
      ultimoAndamento: ultimoAndamento ?? anterior?.ultimoAndamento,
      recebidoNaLeitura: undefined,
    };
    await r.gravarAtual(arv.idProcedimento, novo);
    await r.marcarVisto([arv.idProcedimento]);
  }
  return donos.length;
}
