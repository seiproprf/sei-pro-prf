/**
 * Estrela em cada linha do Controle de Processos (mesma coluna do legado, a
 * dos ícones), INCLUSIVE em processo não visualizado: favoritar não abre nada.
 * O MutationObserver cobre as linhas que a paginação infinita do legado
 * acrescenta depois.
 */

import { lerLinhaCaixa } from "@nucleo/dominio/caixa";
import type { DadosProcesso } from "../modelo/tipos";
import { instalarEstilo } from "./estilo";
import { delegarEstrelas } from "./cliques";
import { atualizarEstrela, criarEstrela } from "./estrela";
import type { ServicoFavoritosPagina } from "./servico";

// Qualquer linha de processo da caixa, inclusive as que o legado clona para outras tabelas ao agrupar.
const LINHAS = "tr[id^='P']";

function dadosDaLinhaCaixa(tr: Element): DadosProcesso | null {
  const linha = lerLinhaCaixa(tr, tr.closest("#tblProcessosGerados") ? "gerados" : "recebidos");
  if (!linha?.idProcedimento) return null;
  return {
    id: linha.idProcedimento,
    protocolo: linha.protocolo,
    tipo: linha.tipo || undefined,
    especificacao: linha.especificacao || undefined,
    sigiloso: linha.sigiloso,
  };
}

export function instalarEstrelasCaixa(doc: Document, servico: ServicoFavoritosPagina): { atualizar(): void; desligar(): void } {
  instalarEstilo(doc);
  delegarEstrelas(doc, servico, (estrela) => {
    const tr = estrela.closest(LINHAS);
    return tr ? dadosDaLinhaCaixa(tr) : null;
  });
  const atualizar = () => {
    for (const tr of doc.querySelectorAll(LINHAS)) {
      const existente = tr.querySelector<HTMLButtonElement>(".spro-fav-estrela");
      if (existente) {
        atualizarEstrela(existente, servico.ativo(tr.id.slice(1)));
        continue;
      }
      const dados = dadosDaLinhaCaixa(tr);
      const td = tr.querySelectorAll("td")[1];
      if (!dados || !td) continue;
      td.prepend(criarEstrela(servico.ativo(dados.id)));
    }
  };
  let pendente = false;
  const observador =
    typeof MutationObserver === "function"
      ? new MutationObserver(() => {
          if (pendente) return;
          pendente = true;
          setTimeout(() => {
            pendente = false;
            atualizar();
          }, 50);
        })
      : null;
  const alvo = doc.querySelector("#frmProcedimentoControlar") ?? doc.body;
  if (observador && alvo) observador.observe(alvo, { childList: true, subtree: true });
  const pararServico = servico.aoMudar(atualizar);
  atualizar();
  return {
    atualizar,
    desligar() {
      observador?.disconnect();
      pararServico();
    },
  };
}
