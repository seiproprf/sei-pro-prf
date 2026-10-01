/**
 * O que o app (iframe ou, na F2, o painel lateral) pede à aba do SEI. Só o
 * content script tem a página: o cabeçalho (contexto), os links assinados e o
 * localStorage antigo. As operações são poucas e não escrevem nada no SEI.
 */

import type { Tratador } from "@comum/ponte/rpc";
import { lerLegadoLocal } from "../migracao/fontes";
import type { ContextoAba } from "../modelo/tipos";
import { abrirProcesso } from "./abrir";

export interface DepsExecutor {
  doc: Document;
  ctx: ContextoAba;
  iframe: HTMLIFrameElement | null;
  armazenamento: Pick<Storage, "getItem">;
  lerArquivo?: () => Promise<unknown | null>;
}

export function tratadoresDaAba(d: DepsExecutor): Record<string, Tratador> {
  return {
    contexto: () => d.ctx,
    altura: (args) => {
      const px = Number((args as { px?: unknown } | null)?.px);
      if (d.iframe && Number.isFinite(px)) d.iframe.style.height = `${Math.max(80, Math.min(Math.round(px), 20000))}px`;
      return true;
    },
    abrirProcesso: (args) => {
      const a = (args ?? {}) as { id?: unknown; protocolo?: unknown; novaAba?: unknown };
      return abrirProcesso(d.doc, String(a.id ?? ""), String(a.protocolo ?? ""), a.novaAba === true);
    },
    lerLegado: async () => ({ local: lerLegadoLocal(d.armazenamento), arquivo: d.lerArquivo ? await d.lerArquivo() : null }),
  };
}
