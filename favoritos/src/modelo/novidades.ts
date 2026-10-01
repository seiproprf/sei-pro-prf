/**
 * "O que mudou" (spec 7.3): compara o que o usuário viu por último com a última
 * leitura. Sem `visto` não há base, e então não há novidade: a primeira leitura
 * de um favorito nunca acusa mudança falsa.
 */

import type { Instantaneo } from "./tipos";

export interface Mudanca {
  tipo: "documentos" | "andamento" | "saiu" | "voltou" | "naoVisualizado" | "documentoNovo" | "concluido" | "recebido";
  texto: string;
}

export function compararInstantaneos(visto: Instantaneo | undefined, atual: Instantaneo | undefined): Mudanca[] {
  if (!atual || !visto) return [];
  const m: Mudanca[] = [];
  if (atual.qtdDocumentos !== undefined && visto.qtdDocumentos !== undefined && atual.qtdDocumentos > visto.qtdDocumentos) {
    const n = atual.qtdDocumentos - visto.qtdDocumentos;
    m.push({ tipo: "documentos", texto: n === 1 ? "1 documento novo" : `${n} documentos novos` });
  }
  const a = atual.ultimoAndamento;
  const v = visto.ultimoAndamento;
  if (a && v && (a.data !== v.data || a.descricao !== v.descricao))
    m.push({ tipo: "andamento", texto: `andamento: ${a.descricao}${a.unidade ? ` (${a.unidade})` : ""}` });
  if (visto.abertoNaUnidade === true && atual.abertoNaUnidade === false) m.push({ tipo: "saiu", texto: "saiu da sua unidade" });
  if (visto.abertoNaUnidade === false && atual.abertoNaUnidade === true) m.push({ tipo: "voltou", texto: "voltou para a sua unidade" });
  if (atual.naoVisualizado && !visto.naoVisualizado) m.push({ tipo: "naoVisualizado", texto: "não visualizado" });
  if (atual.documentoNovo && !visto.documentoNovo) m.push({ tipo: "documentoNovo", texto: "documento novo" });
  if (atual.concluido && !visto.concluido) m.push({ tipo: "concluido", texto: "concluído" });
  if (atual.recebidoNaLeitura) m.push({ tipo: "recebido", texto: "chegou à sua unidade — o SEI registrou o recebimento" });
  return m;
}

/** O andamento entra no selo só quando é a única mudança (é longo). */
export function resumoNovidade(m: Mudanca[]): string {
  const curtas = m.filter((x) => x.tipo !== "andamento");
  return (curtas.length ? curtas : m).map((x) => x.texto).join(" · ");
}
