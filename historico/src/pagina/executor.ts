/**
 * O que o app do histórico (modal ou barra lateral) pede à aba do SEI. Só o
 * content script tem a página: o contexto, a pesquisa rápida e o localStorage
 * antigo. Dados não passam por aqui: o app lê o chrome.storage.local direto.
 */

import { abrirProcesso } from "@comum/pagina/abrir";
import type { Tratador } from "@comum/ponte/rpc";
import { LEGADO_CHAVE } from "../modelo/constantes";
import type { ContextoHistorico } from "../modelo/tipos";

export interface DepsExecutor {
  doc: Document;
  ctx: ContextoHistorico;
  armazenamento: Pick<Storage, "removeItem">;
  /** Só no modal: tira o iframe da tela. */
  fechar?: () => void;
}

export function tratadoresHistorico(d: DepsExecutor): Record<string, Tratador> {
  return {
    contexto: () => d.ctx,
    abrirProcesso: (args) => {
      const a = (args ?? {}) as { id?: unknown; protocolo?: unknown; novaAba?: unknown };
      return abrirProcesso(d.doc, String(a.id ?? ""), String(a.protocolo ?? ""), a.novaAba === true);
    },
    fechar: () => {
      if (!d.fechar) return false;
      d.fechar();
      return true;
    },
    // Sem acesso ao localStorage, o erro volta ao app, que grava a pendência na meta.
    apagarLegado: () => {
      d.armazenamento.removeItem(LEGADO_CHAVE);
      return true;
    },
  };
}
