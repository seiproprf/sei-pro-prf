/**
 * Documentos assinados de um processo, para o prazo "a partir da assinatura de
 * um documento" (paridade com o legado, `ajaxDadosDocumentosPro`): a tela
 * "Gerar Arquivo PDF do Processo" lista número SEI, nome e data de cada
 * documento, numa requisição que não marca nada no SEI.
 *
 * O link dessa tela vem da árvore. Se a aba já mostra a árvore do processo, o
 * link sai dela sem custo. Senão, abrir a árvore faz o SEI registrar o
 * recebimento ou a visualização quando o processo está aberto na unidade
 * (arvore_montar.php:420): por isso só com `buscar`, que o usuário pede
 * depois de ler o aviso.
 */

import type { DataISO } from "@comum/datas/dias";
import { ErroRpc } from "@comum/ponte/rpc";

export interface DocumentoAssinado {
  id: string;
  numero: string;
  nome: string;
  data: DataISO;
}

const DATA_BR = /(\d{2})\/(\d{2})\/(\d{4})/;

export function lerDocumentosGerarPdf(doc: Document): DocumentoAssinado[] {
  const saida: DocumentoAssinado[] = [];
  for (const tr of doc.querySelectorAll("#tblDocumentos tr")) {
    const a = tr.querySelector<HTMLAnchorElement>('a[href*="id_documento="]');
    if (!a) continue;
    const id = /id_documento=(\d+)/.exec((a.getAttribute("href") ?? "").replace(/&amp;/g, "&"))?.[1];
    const celulas = [...tr.querySelectorAll("td")];
    const i = celulas.findIndex((td) => td.contains(a));
    const nome = (celulas[i + 1]?.textContent ?? "").trim();
    const m = celulas
      .slice(i + 2)
      .map((td) => DATA_BR.exec(td.textContent ?? ""))
      .find(Boolean);
    if (!id || !m) continue;
    saida.push({ id, numero: (a.textContent ?? "").trim(), nome, data: `${m[3]}-${m[2]}-${m[1]}` as DataISO });
  }
  return saida;
}

export interface DepsDocumentos {
  /** A árvore que a aba já mostra, se for deste processo. */
  arvoreAberta(id: string): { acaoGerarPdf: string | null } | null;
  /** Abre a árvore pela pesquisa rápida (pode marcar o processo como visualizado). */
  arvoreBuscada(protocolo: string): Promise<{ acaoGerarPdf: string | null }>;
  obter(url: string): Promise<Document>;
}

export async function buscarDocumentosAssinados(
  a: { id: string; protocolo: string; buscar: boolean },
  d: DepsDocumentos,
): Promise<{ documentos: DocumentoAssinado[]; origem: "arvore-aberta" | "busca" }> {
  let origem: "arvore-aberta" | "busca" = "arvore-aberta";
  let arvore = d.arvoreAberta(a.id);
  if (!arvore) {
    if (!a.buscar) {
      throw new ErroRpc(
        "PRECISA_BUSCAR",
        "Para listar os documentos, o SEI Pro precisa abrir a árvore deste processo. Se ele estiver aberto na sua unidade, o SEI pode registrar o andamento “Processo recebido” em seu nome, ou marcá-lo como visualizado, como se você o abrisse.",
      );
    }
    origem = "busca";
    arvore = await d.arvoreBuscada(a.protocolo);
  }
  if (!arvore.acaoGerarPdf) {
    throw new ErroRpc(
      "SEM_LISTA_DOCUMENTOS",
      "O SEI não oferece a lista de documentos deste processo para você (falta “Gerar Arquivo PDF do Processo”).",
    );
  }
  return { documentos: lerDocumentosGerarPdf(await d.obter(arvore.acaoGerarPdf)), origem };
}
