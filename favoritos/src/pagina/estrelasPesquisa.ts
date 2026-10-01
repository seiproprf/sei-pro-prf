/**
 * Estrela nos resultados da Pesquisa (`protocolo_pesquisar`, spec 7.1). Cada
 * resultado traz o link do processo (com o id) e o número; o tipo vem no
 * `title` do link. Favoritar não faz requisição.
 */

import { parametros } from "@nucleo/links/links";
import { textoDe } from "@nucleo/sessao/dom";
import type { DadosProcesso } from "../modelo/tipos";
import { delegarEstrelas } from "./cliques";
import { instalarEstilo } from "./estilo";
import { atualizarEstrela, criarEstrela } from "./estrela";
import type { ServicoFavoritosPagina } from "./servico";

const LINHAS = "table.pesquisaResultado tr.pesquisaTituloRegistro";

export function dadosDaLinhaPesquisa(tr: Element): DadosProcesso | null {
  const link = tr.querySelector<HTMLAnchorElement>("a.protocoloNormal[href*='acao=procedimento_trabalhar']");
  if (!link) return null;
  const id = parametros((link.getAttribute("href") ?? "").replace(/&amp;/g, "&")).get("id_procedimento");
  const protocolo = textoDe(link);
  if (!id || !protocolo) return null;
  return { id, protocolo, tipo: link.getAttribute("title")?.trim() || undefined };
}

export function instalarEstrelasPesquisa(doc: Document, servico: ServicoFavoritosPagina): void {
  instalarEstilo(doc);
  delegarEstrelas(doc, servico, (estrela) => {
    const tr = estrela.closest("tr");
    return tr?.matches(LINHAS) ? dadosDaLinhaPesquisa(tr) : null;
  });
  const atualizar = () => {
    for (const tr of doc.querySelectorAll(LINHAS)) {
      const dados = dadosDaLinhaPesquisa(tr);
      const link = tr.querySelector("a.protocoloNormal[href*='acao=procedimento_trabalhar']");
      if (!dados || !link) continue;
      const existente = tr.querySelector<HTMLButtonElement>(".spro-fav-estrela");
      if (existente) atualizarEstrela(existente, servico.ativo(dados.id));
      else link.after(criarEstrela(servico.ativo(dados.id)));
    }
  };
  servico.aoMudar(atualizar);
  atualizar();
}
