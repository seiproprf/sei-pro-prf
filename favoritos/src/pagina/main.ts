/**
 * Content script do favoritos (mundo isolado, todos os frames, document_start).
 * Primeiro marca o documento, de forma síncrona, para o legado não carregar o
 * sei-pro-favoritos.js. Depois, já com o DOM, decide o que fazer pela tela:
 * caixa (estrelas + painel no topo), árvore (estrela no número) ou listas
 * (blocos, acompanhamento, sobrestados).
 */

import { type Area, areaChrome } from "@comum/armazenamento/area";
import { idDispositivo } from "@comum/armazenamento/dispositivo";
import { lerOpcaoLegada } from "@comum/opcoes/legadas";
import { criarRpc, type Rpc } from "@comum/ponte/rpc";
import cssBase from "@comum/ui/base.css";
import { lerArquivoAntigo } from "../migracao/fontes";
import { CANAL_FAVORITOS } from "../modelo/constantes";
import { escoposDoContexto } from "../modelo/escopo";
import type { ContextoAba, Favorito, TipoLista } from "../modelo/tipos";
import { gravarPreferencias, lerPreferencias } from "../preferencias";
import { moverEntreListas, RepositorioFavoritos } from "../repositorio";
import { abrirBalao } from "./balao";
import { contextoDe, documentoTopo, temaEscuroLegado } from "./contexto";
import { instalarEstrelaArvore } from "./estrelaArvore";
import { instalarEstrelasCaixa } from "./estrelasCaixa";
import { instalarEstrelasListas } from "./estrelasListas";
import { tratadoresDaAba } from "./executor";
import { marcarAtivo } from "./marca";
import { montarPainel, ordemLegada } from "./painel";
import { ServicoFavoritosPagina } from "./servico";

marcarAtivo(document);

const global = window as unknown as { __seiProFavoritos?: boolean };
if (!global.__seiProFavoritos) {
  global.__seiProFavoritos = true;
  const iniciar = () => void principal().catch((e) => console.warn("[SEI Pro] favoritos:", e));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
}

type Repos = { unidade: RepositorioFavoritos | null; pessoal: RepositorioFavoritos };

function qualTela(doc: Document): "caixa" | "arvore" | "listas" | null {
  if (doc.querySelector("#frmProcedimentoControlar")) return "caixa";
  if (doc.querySelector("#topmenu") && doc.querySelector("#divArvore")) return "arvore";
  if (doc.querySelector("#frmRelBlocoProtocoloLista, #frmAcompanhamentoLista, #frmProcedimentoSobrestar")) return "listas";
  return null;
}

async function principal(): Promise<void> {
  const tela = qualTela(document);
  if (!tela) return;
  if (!(await lerOpcaoLegada("gerenciarfavoritos"))) return;
  const topo = documentoTopo();
  const ctx = contextoDe(topo, temaEscuroLegado(localStorage), topo.location?.href);
  if (!ctx) return;
  const area = areaChrome(chrome.storage.local, "local");
  const sync = areaChrome(chrome.storage.sync, "sync");
  const dispositivo = await idDispositivo(area);
  const carimbo = () => ({ agora: Date.now(), dispositivo });
  const esc = escoposDoContexto(ctx);
  const repos: Repos = {
    unidade: esc.unidade ? new RepositorioFavoritos(area, esc.unidade, carimbo) : null,
    pessoal: new RepositorioFavoritos(area, esc.pessoal, carimbo),
  };
  const servico = new ServicoFavoritosPagina({
    ...repos,
    aoAdicionar: (f, repo, ancora) => void perguntar(f, repo, ancora, repos, ctx, sync),
  });
  await servico.carregar();
  if (tela === "caixa") {
    instalarEstrelasCaixa(document, servico);
    if (window === window.top) await instalarPainel(ctx, sync);
  } else if (tela === "arvore") {
    await instalarEstrelaArvore(document, servico, location.href);
  } else {
    instalarEstrelasListas(document, servico);
  }
}

async function perguntar(
  f: Favorito,
  repo: RepositorioFavoritos,
  ancora: HTMLElement,
  repos: Repos,
  ctx: ContextoAba,
  sync: Area,
): Promise<void> {
  if (!(await lerPreferencias(sync)).perguntarAoFavoritar) return;
  const lista: TipoLista = repo === repos.unidade ? "unidade" : "pessoal";
  const [pastas, etiquetas] = await Promise.all([repo.pastasAtivas(), repo.etiquetasAtivas()]);
  abrirBalao(
    ancora,
    {
      favorito: f,
      lista,
      siglaUnidade: repos.unidade ? (ctx.unidade?.sigla ?? "Unidade") : null,
      pastas,
      etiquetas,
      temaEscuro: ctx.temaEscuro,
      editar: (m) => repo.editar(f.id, m),
      criarPasta: (nome) => repo.criarPasta(nome),
      criarEtiqueta: (nome) => repo.criarEtiqueta(nome),
      moverPara: async (destino) => {
        const alvo = destino === "unidade" ? repos.unidade : repos.pessoal;
        if (!alvo || alvo === repo) return;
        const movido = await moverEntreListas(repo, alvo, f.id);
        // Reabre o balão já na outra lista (abrirBalao fecha o anterior).
        if (movido) await perguntar(movido, alvo, ancora, repos, ctx, sync);
      },
    },
    cssBase,
  );
}

async function instalarPainel(ctx: ContextoAba, sync: Area): Promise<void> {
  const prefs = await lerPreferencias(sync);
  if (prefs.exibir === "lateral") return;
  const montado = montarPainel(document, {
    urlApp: chrome.runtime.getURL("html/favoritos.html"),
    recolhido: prefs.recolhido,
    ordem: ordemLegada(localStorage),
    aoRecolher: (r) => void gravarPreferencias(sync, { recolhido: r }),
  });
  if (!montado) return;
  const tratadores = tratadoresDaAba({
    doc: document,
    ctx,
    iframe: montado.iframe,
    armazenamento: localStorage,
    lerArquivo: () => lerArquivoAntigo(),
  });
  let rpc: Rpc | null = null;
  // A cada carga do iframe, uma porta nova: o app só aceita a porta da própria aba (app/ponte.ts).
  montado.iframe.addEventListener("load", () => {
    rpc?.fechar();
    rpc = criarRpc(chrome.runtime.connect({ name: CANAL_FAVORITOS }), tratadores);
  });
}
