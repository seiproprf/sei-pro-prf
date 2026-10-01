/** Blocos, Acompanhamento Especial e sobrestados: estrela na 3a coluna, como no legado (sei-pro-all.js). */

import { parametros } from "@nucleo/links/links";
import { textoDe } from "@nucleo/sessao/dom";
import type { DadosProcesso } from "../modelo/tipos";
import { instalarEstilo } from "./estilo";
import { atualizarEstrela, criarEstrela } from "./estrela";
import type { ServicoFavoritosPagina } from "./servico";

const TABELAS = "#frmRelBlocoProtocoloLista .infraTable, #frmAcompanhamentoLista .infraTable, #frmProcedimentoSobrestar .infraTable";

export function dadosDaLinhaLista(tr: Element): DadosProcesso | null {
  const link = tr.querySelectorAll("td")[2]?.querySelector("a[href*='acao=procedimento_trabalhar']");
  if (!link) return null;
  const id = parametros(link.getAttribute("href") ?? "").get("id_procedimento");
  const protocolo = textoDe(link);
  if (!id || !protocolo) return null;
  return { id, protocolo, sigiloso: /Sigiloso/i.test(link.getAttribute("class") ?? "") };
}

export function instalarEstrelasListas(doc: Document, servico: ServicoFavoritosPagina): { atualizar(): void; desligar(): void } {
  instalarEstilo(doc);
  const atualizar = () => {
    for (const tabela of doc.querySelectorAll(TABELAS)) {
      for (const tr of tabela.querySelectorAll("tr")) {
        const dados = dadosDaLinhaLista(tr);
        const td = tr.querySelectorAll("td")[2];
        if (!dados || !td) continue;
        const existente = td.querySelector<HTMLButtonElement>(".spro-fav-estrela");
        if (existente) atualizarEstrela(existente, servico.ativo(dados.id));
        else td.prepend(criarEstrela(servico.ativo(dados.id), (b) => void servico.alternar(dados, b)));
      }
    }
  };
  const parar = servico.aoMudar(atualizar);
  atualizar();
  return { atualizar, desligar: parar };
}
