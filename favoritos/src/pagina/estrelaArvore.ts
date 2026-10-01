/**
 * Estrela no topo da árvore, ao lado do número. Os dados (id, protocolo, tipo,
 * nível) vêm dos literais `Nos[]` que a própria árvore já trouxe, lidos pelo
 * `lerArvore` do núcleo sobre a página aberta. Nenhuma requisição.
 */

import { lerArvore } from "@nucleo/dominio/arvore";
import type { DadosProcesso } from "../modelo/tipos";
import { paginaDe } from "./contexto";
import { esperar } from "./esperar";
import { instalarEstilo } from "./estilo";
import { atualizarEstrela, criarEstrela } from "./estrela";
import type { ServicoFavoritosPagina } from "./servico";

const NO_DO_PROCESSO = '#topmenu a[target="ifrVisualizacao"], #topmenu a[target="ifrConteudoVisualizacao"]';

export function dadosDaArvore(doc: Document, url: string): DadosProcesso | null {
  try {
    const a = lerArvore(paginaDe(doc, url));
    return { id: a.idProcedimento, protocolo: a.protocolo, tipo: a.tipo || undefined, sigiloso: a.nivel === "sigiloso" };
  } catch {
    return null;
  }
}

export async function instalarEstrelaArvore(doc: Document, servico: ServicoFavoritosPagina, url: string): Promise<boolean> {
  const dados = dadosDaArvore(doc, url);
  if (!dados) return false;
  const no = await esperar(() => doc.querySelector(NO_DO_PROCESSO), 10_000);
  if (!no || no.parentElement?.querySelector(".spro-fav-estrela")) return false;
  instalarEstilo(doc);
  const estrela = criarEstrela(servico.ativo(dados.id), (b) => void servico.alternar(dados, b));
  no.after(estrela);
  servico.aoMudar(() => atualizarEstrela(estrela, servico.ativo(dados.id)));
  return true;
}
