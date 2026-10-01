/**
 * O que o app (iframe embutido ou painel lateral) pede à aba do SEI. Só o
 * content script tem a página: o cabeçalho (contexto), os links assinados e o
 * localStorage antigo. As operações são poucas e não escrevem nada no SEI.
 */

import type { Tratador } from "@comum/ponte/rpc";
import { acaoNaArvore, lerArvore } from "@nucleo/dominio/arvore";
import { Sei } from "@nucleo/sei";
import { lerLegadoLocal } from "../migracao/fontes";
import type { ContextoAba } from "../modelo/tipos";
import { abrirProcesso } from "./abrir";
import { paginaDe } from "./contexto";
import { buscarDocumentosAssinados, type DepsDocumentos } from "./documentos";

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
    documentosAssinados: (args) => {
      const a = (args ?? {}) as { id?: unknown; protocolo?: unknown; buscar?: unknown };
      return buscarDocumentosAssinados(
        { id: String(a.id ?? ""), protocolo: String(a.protocolo ?? ""), buscar: a.buscar === true },
        depsDocumentos(d.doc),
      );
    },
  };
}

/** Na aba: a árvore que já está na tela, ou a pesquisa rápida do núcleo (só com o pedido do usuário). */
function depsDocumentos(doc: Document): DepsDocumentos {
  let sei: Sei | null = null;
  const nucleo = () => {
    sei ??= new Sei(doc.location?.href ?? location.href, () => paginaDe(doc));
    return sei;
  };
  return {
    arvoreAberta(id) {
      try {
        const arv = doc.querySelector<HTMLIFrameElement>("#ifrArvore")?.contentDocument;
        if (!arv?.querySelector("#divArvore")) return null;
        const lida = lerArvore(paginaDe(arv, arv.location.href));
        return lida.idProcedimento === id ? { acaoGerarPdf: acaoNaArvore(lida, "procedimento_gerar_pdf") } : null;
      } catch {
        return null;
      }
    },
    async arvoreBuscada(protocolo) {
      const lida = await nucleo().arvore(protocolo);
      return { acaoGerarPdf: acaoNaArvore(lida, "procedimento_gerar_pdf") };
    },
    async obter(url) {
      return (await nucleo().http.obter(url)).doc;
    },
  };
}
