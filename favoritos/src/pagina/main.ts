/**
 * Content script do favoritos (mundo isolado, todos os frames, document_start).
 * Primeiro marca o documento, de forma síncrona, para o legado não carregar o
 * sei-pro-favoritos.js. Depois, já com o DOM, decide o que fazer pela tela:
 * caixa (estrelas + painel no topo), árvore (estrela no número) ou listas
 * (blocos, acompanhamento, sobrestados).
 */

import { type Area, areaChrome } from "@comum/armazenamento/area";
import { idDispositivo } from "@comum/armazenamento/dispositivo";
import { hojeISO } from "@comum/datas/dias";
import { lerOpcaoLegada } from "@comum/opcoes/legadas";
import { criarRpc, type PortaRpc, type Rpc } from "@comum/ponte/rpc";
import cssBase from "@comum/ui/base.css";
import { criarArmazemTextoPadrao } from "@nucleo/dominio/textoPadrao";
import { Sei } from "@nucleo/sei";
import { lerArquivoAntigo } from "../migracao/fontes";
import { CANAL_FAVORITOS, CANAL_LATERAL, CHAVE_PREFERENCIAS } from "../modelo/constantes";
import { chaveDoContexto, escoposDoContexto } from "../modelo/escopo";
import { ondeMostrar, temPainelLateral } from "../modelo/exibicao";
import type { ContextoAba, Favorito, TipoLista } from "../modelo/tipos";
import { gravarPreferencias, lerPreferencias } from "../preferencias";
import { moverEntreListas, RepositorioFavoritos } from "../repositorio";
import { DESCRICAO_TEXTO, nomeDoTexto } from "../sincronia/textoPadrao";
import { abrirBalao } from "./balao";
import { instalarBotaoArvore, instalarBotaoCaixa, pedirPainelLateral } from "./botao";
import { contextoDe, documentoTopo, paginaDe, temaEscuroLegado } from "./contexto";
import { instalarManterNoEnvio } from "./enviar";
import { instalarEstrelaArvore } from "./estrelaArvore";
import { instalarEstrelasCaixa } from "./estrelasCaixa";
import { instalarEstrelasListas } from "./estrelasListas";
import { tratadoresDaAba } from "./executor";
import { ligarLadoAba } from "./lateral";
import { marcarAtivo } from "./marca";
import { montarPainel, ordemLegada } from "./painel";
import { ServicoFavoritosPagina } from "./servico";
import { ControleSincronia, ocultarTextosInternos } from "./sincronia";

marcarAtivo(document);

const global = window as unknown as { __seiProFavoritos?: boolean };
if (!global.__seiProFavoritos) {
  global.__seiProFavoritos = true;
  const iniciar = () => void principal().catch((e) => console.warn("[SEI Pro] favoritos:", e));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
}

type Repos = { unidade: RepositorioFavoritos | null; pessoal: RepositorioFavoritos };

function qualTela(doc: Document): "caixa" | "arvore" | "listas" | "enviar" | null {
  if (doc.querySelector("#frmProcedimentoControlar")) return "caixa";
  if (doc.querySelector('#frmAtividadeListar[action*="acao=procedimento_enviar"]')) return "enviar";
  if (doc.querySelector("#topmenu") && doc.querySelector("#divArvore")) return "arvore";
  if (doc.querySelector("#frmRelBlocoProtocoloLista, #frmAcompanhamentoLista, #frmProcedimentoSobrestar")) return "listas";
  return null;
}

async function principal(): Promise<void> {
  // Cosmético e barato: os textos de dados do SEI Pro não aparecem como modelo ao gerar documento.
  ocultarTextosInternos(document);
  const noTopo = window === window.top;
  const tela = qualTela(document);
  // A janela de topo de qualquer tela com sessão atende o painel lateral; os frames, só as telas conhecidas.
  if (!tela && !noTopo) return;
  if (!(await lerOpcaoLegada("gerenciarfavoritos"))) return;
  const topo = documentoTopo();
  const ctx = contextoDe(topo, temaEscuroLegado(localStorage), topo.location?.href);
  if (!ctx) return;
  const area = areaChrome(chrome.storage.local, "local");
  const sync = areaChrome(chrome.storage.sync, "sync");
  const lateral = temPainelLateral(chrome.runtime.getManifest());
  const abrirLateral = () =>
    pedirPainelLateral(
      (m) => chrome.runtime.sendMessage(m),
      (u) => void window.open(u, "seiProPainel", "popup,width=420,height=760"),
      chrome.runtime.getURL("html/painel.html#aba=favoritos"),
    );
  const dispositivo = await idDispositivo(area);
  const carimbo = () => ({ agora: Date.now(), dispositivo });
  const esc = escoposDoContexto(ctx);
  const repos: Repos = {
    unidade: esc.unidade ? new RepositorioFavoritos(area, esc.unidade, carimbo) : null,
    pessoal: new RepositorioFavoritos(area, esc.pessoal, carimbo),
  };
  // Sincronia por Texto Padrão: só na janela de topo (tem a sessão e o menu) e só com unidade.
  const controle =
    noTopo && repos.unidade && esc.unidade
      ? new ControleSincronia({
          ctx,
          area,
          sync,
          repo: repos.unidade,
          escopo: esc.unidade,
          carimbo,
          travar: travarComLocks,
          armazem: () =>
            criarArmazemTextoPadrao(new Sei(location.href, () => paginaDe(document)), {
              nome: nomeDoTexto(ctx.login),
              descricao: DESCRICAO_TEXTO,
            }),
        })
      : null;
  if (controle) await controle.iniciar(tela);
  if (noTopo) ligarPainelLateral(ctx, area, controle);
  if (!tela) return;
  const servico = new ServicoFavoritosPagina({
    ...repos,
    aoAdicionar: (f, repo, ancora) => void perguntar(f, repo, ancora, repos, ctx, sync),
  });
  await servico.carregar();
  if (tela === "caixa") {
    instalarEstrelasCaixa(document, servico);
    if (noTopo) await controlarPainelEmbutido(ctx, sync, lateral, abrirLateral, controle);
  } else if (tela === "arvore") {
    if ((await instalarEstrelaArvore(document, servico, location.href)) && lateral) {
      instalarBotaoArvore(document, { url: (c) => chrome.runtime.getURL(c), abrirLateral });
    }
  } else if (tela === "enviar") {
    // No envio, a lista é a da unidade (ou a Pessoal, se o processo já estiver lá).
    const ondeEsta = async (id: string) =>
      (await repos.unidade?.contem(id)) ? repos.unidade : (await repos.pessoal.contem(id)) ? repos.pessoal : null;
    const principalRepo = repos.unidade ?? repos.pessoal;
    await instalarManterNoEnvio(document, {
      ativo: (id) => servico.ativo(id),
      adicionar: (p) => principalRepo.adicionar(p),
      remover: (ids) => Promise.all([repos.unidade?.remover(ids), repos.pessoal.remover(ids)]),
      editar: async (id, m) => (await ondeEsta(id))?.editar(id, m),
      obter: async (id) => (await ondeEsta(id))?.obter(id),
      pastas: () => principalRepo.pastasAtivas(),
      hoje: () => hojeISO(),
    });
  } else {
    instalarEstrelasListas(document, servico);
  }
}

/** A aba do SEI atende o app do painel lateral quando ele anuncia que abriu. */
function ligarPainelLateral(ctx: ContextoAba, area: Area, sincronia: ControleSincronia | null): void {
  let foco = document.hasFocus() ? Date.now() : 0;
  const lado = ligarLadoAba({
    area,
    conectar: () => chrome.runtime.connect({ name: CANAL_LATERAL }) as unknown as PortaRpc,
    tratadores: tratadoresDaAba({
      doc: document,
      ctx,
      iframe: null,
      armazenamento: localStorage,
      lerArquivo: () => lerArquivoAntigo(),
      sincronia,
    }),
    estado: () => ({ visivel: document.visibilityState === "visible", foco, chave: chaveDoContexto(ctx) }),
  });
  const marcar = () => {
    foco = Date.now();
    lado.apresentar();
  };
  window.addEventListener("focus", marcar);
  document.addEventListener("visibilitychange", () => (document.visibilityState === "visible" ? marcar() : lado.apresentar()));
  // Rede de segurança para abas abertas antes do painel e portas que caíram sem aviso.
  setInterval(() => lado.verificar(), 5000);
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

/**
 * O painel abaixo da lista segue a preferência "onde mostrar", inclusive
 * quando ela muda com a página aberta (pelas opções ou pelo próprio app).
 */
async function controlarPainelEmbutido(
  ctx: ContextoAba,
  sync: Area,
  lateral: boolean,
  abrirLateral: () => void,
  sincronia: ControleSincronia | null,
): Promise<void> {
  let prefs = await lerPreferencias(sync);
  let montado: { painel: HTMLElement; corpo: HTMLElement; fechar(): void } | null = null;
  const aplicar = () => {
    const onde = ondeMostrar(prefs.exibir, lateral);
    if (onde.abaixo && !montado) montado = montarEmbutido(ctx, sync, prefs.recolhido, sincronia);
    else if (!onde.abaixo && montado) {
      montado.fechar();
      montado = null;
    }
  };
  aplicar();
  instalarBotaoCaixa(document, {
    url: (c) => chrome.runtime.getURL(c),
    destino: () => (ondeMostrar(prefs.exibir, lateral).lateral ? "lateral" : "abaixo"),
    abrirLateral,
    rolarAtePainel: () => {
      if (!montado) return abrirLateral();
      if (montado.corpo.hidden) montado.painel.querySelector<HTMLButtonElement>(".spro-fav-recolher")?.click();
      montado.painel.scrollIntoView({ behavior: "smooth", block: "start" });
    },
  });
  sync.aoMudar((m) => {
    if (!(CHAVE_PREFERENCIAS in m)) return;
    void lerPreferencias(sync).then((p) => {
      prefs = p;
      aplicar();
    });
  });
}

function montarEmbutido(
  ctx: ContextoAba,
  sync: Area,
  recolhido: boolean,
  sincronia: ControleSincronia | null,
): { painel: HTMLElement; corpo: HTMLElement; fechar(): void } | null {
  const montado = montarPainel(document, {
    urlApp: chrome.runtime.getURL("html/favoritos.html"),
    recolhido,
    ordem: ordemLegada(localStorage),
    aoRecolher: (r) => void gravarPreferencias(sync, { recolhido: r }),
  });
  if (!montado) return null;
  const tratadores = tratadoresDaAba({
    doc: document,
    ctx,
    iframe: montado.iframe,
    armazenamento: localStorage,
    lerArquivo: () => lerArquivoAntigo(),
    sincronia,
  });
  let rpc: Rpc | null = null;
  // A cada carga do iframe, uma porta nova: o app só aceita a porta da própria aba (app/ponte.ts).
  montado.iframe.addEventListener("load", () => {
    rpc?.fechar();
    rpc = criarRpc(chrome.runtime.connect({ name: CANAL_FAVORITOS }), tratadores);
  });
  return {
    painel: montado.painel,
    corpo: montado.corpo,
    fechar: () => {
      rpc?.fechar();
      montado.painel.remove();
    },
  };
}

/** Uma aba sincroniza por vez (Web Locks; o SEI em HTTP não tem: aí vale a comparação de conteúdo do motor). */
function travarComLocks<T>(nome: string, fn: () => Promise<T>): Promise<T | null> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) return fn();
  return locks.request(nome, { ifAvailable: true }, async (lock): Promise<T | null> => (lock ? fn() : null)) as Promise<T | null>;
}
