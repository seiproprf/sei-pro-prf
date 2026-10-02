/**
 * O que o app (iframe embutido ou painel lateral) pede à aba do SEI. Só o
 * content script tem a página: o cabeçalho (contexto), os links assinados e o
 * localStorage antigo. As operações são poucas e não escrevem nada no SEI.
 */

import { ErroRpc, type Tratador } from "@comum/ponte/rpc";
import { acaoNaArvore, lerArvore } from "@nucleo/dominio/arvore";
import { Sei } from "@nucleo/sei";
import { lerLegadoLocal } from "../migracao/fontes";
import type { ContextoAba } from "../modelo/tipos";
import { abrirProcesso } from "./abrir";
import type { AvisarNaPagina } from "./aviso";
import { paginaDe } from "./contexto";
import { buscarDocumentosAssinados, type DepsDocumentos } from "./documentos";
import type { Sobreposicao } from "./sobreposicao";

export interface DepsExecutor {
  doc: Document;
  ctx: ContextoAba;
  iframe: HTMLIFrameElement | null;
  armazenamento: Pick<Storage, "getItem">;
  lerArquivo?: () => Promise<unknown | null>;
  /** "Atualizar fora da unidade" (só na janela de topo). */
  atualizar?: { iniciar(): Promise<unknown>; cancelar(): boolean } | null;
  /** Sincronia por Texto Padrão desta aba (só na janela de topo, com unidade). */
  sincronia?: { agora(): Promise<unknown>; apagar(): Promise<boolean> } | null;
  /** Painel embutido: diálogo no meio da tela (pagina/sobreposicao.ts). */
  sobreposicao?: Sobreposicao | null;
  /** Painel embutido: aviso no rodapé da tela (pagina/aviso.ts). */
  avisar?: AvisarNaPagina | null;
}

export function tratadoresDaAba(d: DepsExecutor): Record<string, Tratador> {
  return {
    contexto: () => d.ctx,
    altura: (args) => {
      const px = Number((args as { px?: unknown } | null)?.px);
      if (d.sobreposicao) d.sobreposicao.altura(px);
      else if (d.iframe && Number.isFinite(px)) d.iframe.style.height = `${Math.max(80, Math.min(Math.round(px), 20000))}px`;
      return true;
    },
    sobrepor: (args) => (d.sobreposicao ? d.sobreposicao.ligar((args as { ativo?: unknown } | null)?.ativo === true) : false),
    aviso: (args) => {
      const a = (args ?? {}) as { texto?: unknown; acao?: unknown; ms?: unknown };
      if (!d.avisar) return false;
      const ms = Number(a.ms);
      return d.avisar(
        String(a.texto ?? "").slice(0, 400),
        a.acao ? String(a.acao).slice(0, 40) : undefined,
        Number.isFinite(ms) ? ms : 7000,
      );
    },
    abrirProcesso: (args) => {
      const a = (args ?? {}) as { id?: unknown; protocolo?: unknown; novaAba?: unknown };
      return abrirProcesso(d.doc, String(a.id ?? ""), String(a.protocolo ?? ""), a.novaAba === true);
    },
    lerLegado: async () => ({ local: lerLegadoLocal(d.armazenamento), arquivo: d.lerArquivo ? await d.lerArquivo() : null }),
    atualizarForaDaUnidade: () => {
      if (!d.atualizar) throw new ErroRpc("SEM_ATUALIZAR", "Abra uma tela do SEI para atualizar.");
      return d.atualizar.iniciar();
    },
    cancelarAtualizacao: () => d.atualizar?.cancelar() ?? false,
    sincronizarAgora: () => {
      if (!d.sincronia) throw new ErroRpc("SEM_SINCRONIA", "A sincronia pelo Texto Padrão só funciona numa tela do SEI com unidade.");
      return d.sincronia.agora();
    },
    apagarDoSei: () => {
      if (!d.sincronia) throw new ErroRpc("SEM_SINCRONIA", "A sincronia pelo Texto Padrão só funciona numa tela do SEI com unidade.");
      return d.sincronia.apagar();
    },
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
