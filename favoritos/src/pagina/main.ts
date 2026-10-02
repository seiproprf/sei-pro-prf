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
import { corDoTemaSei, temaEscuroLegado } from "@comum/pagina/tema";
import { ligarLadoAba } from "@comum/ponte/lateral";
import { criarRpc, ErroRpc, type PortaRpc, type Rpc } from "@comum/ponte/rpc";
import cssBase from "@comum/ui/base.css";
import { acaoNaArvore, lerArvore } from "@nucleo/dominio/arvore";
import { listarCaixa } from "@nucleo/dominio/caixa";
import { lerHistorico } from "@nucleo/dominio/historico";
import { criarArmazemTextoPadrao } from "@nucleo/dominio/textoPadrao";
import { Sei } from "@nucleo/sei";
import { criarHttp } from "@nucleo/sessao/http";
import { lerArquivoAntigo } from "../migracao/fontes";
import { CANAL_FAVORITOS, CANAL_LATERAL, CHAVE_LATERAL, CHAVE_PREFERENCIAS } from "../modelo/constantes";
import { chaveDoContexto, escoposDoContexto } from "../modelo/escopo";
import { ondeMostrar, temPainelLateral } from "../modelo/exibicao";
import type { ContextoAba, Favorito, TipoLista } from "../modelo/tipos";
import { gravarPreferencias, lerPreferencias } from "../preferencias";
import { moverEntreListas, RepositorioFavoritos } from "../repositorio";
import { DESCRICAO_TEXTO, nomeDoTexto } from "../sincronia/textoPadrao";
import { ControleAtualizar, chaveProgresso } from "./atualizar";
import { avisoNaPagina } from "./aviso";
import { abrirBalao } from "./balao";
import { contarPendencias, instalarBotaoArvore, instalarBotaoCaixa, pedirPainelLateral, pintarContador } from "./botao";
import { contextoDe, documentoTopo, paginaDe } from "./contexto";
import { alternarDocumento, instalarEstrelasDocumentos } from "./documentosArvore";
import { instalarManterNoEnvio } from "./enviar";
import { instalarEstilo } from "./estilo";
import { instalarEstrelaArvore } from "./estrelaArvore";
import { instalarEstrelasCaixa } from "./estrelasCaixa";
import { instalarEstrelasListas } from "./estrelasListas";
import { instalarEstrelasPesquisa } from "./estrelasPesquisa";
import { tratadoresDaAba } from "./executor";
import { filtroAtivoNaCaixa } from "./filtroCaixa";
import { marcarAtivo } from "./marca";
import { capturarDaArvore, capturarDaCaixa } from "./novidades";
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

function qualTela(doc: Document): "caixa" | "arvore" | "listas" | "enviar" | "pesquisa" | null {
  if (doc.querySelector("#frmProcedimentoControlar")) return "caixa";
  if (doc.querySelector("table.pesquisaResultado")) return "pesquisa";
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
  const corTema = corDoTemaSei(topo);
  if (corTema) ctx.corTema = corTema;
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
          travarEsperando: travarEsperandoComLocks,
          armazem: () =>
            criarArmazemTextoPadrao(new Sei(location.href, () => paginaDe(document)), {
              nome: nomeDoTexto(ctx.login),
              descricao: DESCRICAO_TEXTO,
            }),
        })
      : null;
  if (controle) await controle.iniciar(tela);
  const atualizar = noTopo ? controleAtualizar(ctx, area, repos) : null;
  if (noTopo) ligarPainelLateral(ctx, area, controle, atualizar);
  if (!tela) return;
  const servico = new ServicoFavoritosPagina({
    ...repos,
    aoAdicionar: (f, repo, ancora) => void perguntar(f, repo, ancora, repos, ctx, sync),
  });
  await servico.carregar();
  if (tela === "caixa") {
    instalarEstrelasCaixa(document, servico);
    // "O que mudou": os sinais que a caixa já mostra, sem requisição.
    if (repos.unidade) void capturarDaCaixa(document, repos.unidade).catch((e) => console.warn("[SEI Pro] favoritos: captura da caixa", e));
    if (noTopo) {
      const botao = await controlarPainelEmbutido(ctx, sync, lateral, abrirLateral, controle, atualizar);
      if (botao)
        ligarContador(
          botao,
          [repos.unidade, repos.pessoal].filter((r): r is RepositorioFavoritos => !!r),
        );
    }
  } else if (tela === "arvore") {
    if ((await instalarEstrelaArvore(document, servico, location.href)) && lateral) {
      instalarBotaoArvore(document, { url: (c) => chrome.runtime.getURL(c), abrirLateral });
    }
    instalarDocumentosFavoritos(repos);
    // O usuário abriu o processo: lê o que a árvore já trouxe (e o histórico pelo link dela) e marca como visto.
    const http = criarHttp(location.href);
    void capturarDaArvore(
      document,
      location.href,
      [repos.unidade, repos.pessoal].filter((r): r is RepositorioFavoritos => !!r),
      (u) => http.obter(u),
    ).catch((e) => console.warn("[SEI Pro] favoritos: captura da árvore", e));
  } else if (tela === "pesquisa") {
    instalarEstrelasPesquisa(document, servico);
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
function ligarPainelLateral(ctx: ContextoAba, area: Area, sincronia: ControleSincronia | null, atualizar: ControleAtualizar | null): void {
  let foco = document.hasFocus() ? Date.now() : 0;
  const lado = ligarLadoAba({
    area,
    chave: CHAVE_LATERAL,
    conectar: () => chrome.runtime.connect({ name: CANAL_LATERAL }) as unknown as PortaRpc,
    tratadores: tratadoresDaAba({
      doc: document,
      ctx,
      iframe: null,
      armazenamento: localStorage,
      lerArquivo: () => lerArquivoAntigo(),
      sincronia,
      atualizar,
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
      hoje: hojeISO(),
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
  atualizar: ControleAtualizar | null,
): Promise<HTMLElement | null> {
  let prefs = await lerPreferencias(sync);
  let montado: { painel: HTMLElement; corpo: HTMLElement; fechar(): void } | null = null;
  const aplicar = () => {
    const onde = ondeMostrar(prefs.exibir, lateral);
    if (onde.abaixo && !montado) montado = montarEmbutido(ctx, sync, prefs.recolhido, sincronia, atualizar);
    else if (!onde.abaixo && montado) {
      montado.fechar();
      montado = null;
    }
  };
  aplicar();
  const botao = instalarBotaoCaixa(document, {
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
  return botao;
}

function montarEmbutido(
  ctx: ContextoAba,
  sync: Area,
  recolhido: boolean,
  sincronia: ControleSincronia | null,
  atualizar: ControleAtualizar | null,
): { painel: HTMLElement; corpo: HTMLElement; fechar(): void } | null {
  const montado = montarPainel(document, {
    urlApp: chrome.runtime.getURL("html/favoritos.html"),
    temaEscuro: ctx.temaEscuro,
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
    atualizar,
    sobreposicao: montado.sobreposicao,
    avisar: avisoNaPagina(document, ctx.temaEscuro),
  });
  let rpc: Rpc | null = null;
  // A cada carga do iframe, uma porta nova: o app só aceita a porta da própria aba (@comum/ponte/conexaoDaAba).
  montado.iframe.addEventListener("load", () => {
    rpc?.fechar();
    rpc = criarRpc(chrome.runtime.connect({ name: CANAL_FAVORITOS }), tratadores);
    // A porta caiu (app fechado ou extensão atualizada): ninguém mais vai pedir para desligar a sobreposição.
    rpc.aoFechar(() => montado.sobreposicao.ligar(false));
  });
  return {
    painel: montado.painel,
    corpo: montado.corpo,
    fechar: () => {
      rpc?.fechar();
      montado.fechar();
    },
  };
}

/** Uma aba sincroniza por vez (Web Locks; o SEI em HTTP não tem: aí vale a comparação de conteúdo do motor). */
function travarComLocks<T>(nome: string, fn: () => Promise<T>): Promise<T | null> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) return fn();
  return locks.request(nome, { ifAvailable: true }, async (lock): Promise<T | null> => (lock ? fn() : null)) as Promise<T | null>;
}

/** "Atualizar fora da unidade": a caixa inteira como trava, depois um processo por vez (pagina/atualizar.ts). */
function controleAtualizar(ctx: ContextoAba, area: Area, repos: Repos): ControleAtualizar {
  return new ControleAtualizar(
    () => {
      const sei = new Sei(location.href, () => paginaDe(document));
      return {
        repos: [repos.unidade, repos.pessoal].filter((r): r is RepositorioFavoritos => !!r),
        listarCaixa: async (sinal) => {
          // A caixa como o SEI a devolve AGORA (com os filtros salvos do usuário): filtrada, não serve de trava.
          const primeira = await sei.http.obter(sei.linkMenu("procedimento_controlar"), { sinal, aceitarValidacao: true });
          const filtro = filtroAtivoNaCaixa(primeira.doc);
          if (filtro)
            throw new ErroRpc(
              "CAIXA_FILTRADA",
              `A caixa do Controle de Processos está com ${filtro}. Tire o filtro e tente de novo: sem a caixa inteira, o SEI Pro não sabe quais processos estão na sua unidade.`,
            );
          const r = await listarCaixa(sei, { limite: Number.MAX_SAFE_INTEGER, sinal });
          // Sem a caixa inteira não há trava: ler a árvore de um processo da unidade marcaria o recebimento.
          if (r.processos.length < r.total)
            throw new ErroRpc("CAIXA_INCOMPLETA", "Não foi possível ler a caixa inteira; nada foi atualizado.");
          return new Set(r.processos.map((p) => p.idProcedimento));
        },
        localizar: async (protocolo, sinal) => (await sei.localizar(protocolo, { sinal })).idProcedimento,
        lerProcesso: async (protocolo, sinal) => {
          const arv = await sei.arvore(protocolo, { sinal, forcar: true });
          const link = acaoNaArvore(arv, "procedimento_consultar_historico");
          const a = link ? lerHistorico(await sei.http.obter(link, { sinal }))[0] : undefined;
          return {
            qtdDocumentos: arv.documentos.length,
            // "Enviar Processo" na barra só existe com o processo aberto na unidade.
            abertoNaUnidade: !!acaoNaArvore(arv, "procedimento_enviar"),
            ultimoAndamento: a ? { data: a.data, unidade: a.unidade, descricao: a.descricao } : undefined,
          };
        },
        esperar: (ms, sinal) =>
          new Promise<void>((ok) => {
            const t = setTimeout(ok, ms);
            sinal.addEventListener(
              "abort",
              () => {
                clearTimeout(t);
                ok();
              },
              { once: true },
            );
          }),
      };
    },
    (p) => area.gravar({ [chaveProgresso(ctx.host, ctx.login)]: { ...p, quando: Date.now() } }),
    { area, host: ctx.host, login: ctx.login },
  );
}

/** Selo no botão Favoritos: lembretes vencidos + novidades, refeito quando as listas mudam. */
function ligarContador(botao: HTMLElement, repos: RepositorioFavoritos[]): void {
  let agendado = false;
  const pintar = () => {
    if (agendado) return;
    agendado = true;
    setTimeout(() => {
      agendado = false;
      void contarPendencias(repos, hojeISO())
        .then((n) => pintarContador(botao, n))
        .catch(() => undefined);
    }, 100);
  };
  for (const r of repos) {
    r.aoMudar(pintar);
    r.aoMudarAtuais(pintar);
  }
  pintar();
}

/** Estrela em cada documento da árvore (documentos favoritos). */
function instalarDocumentosFavoritos(repos: Repos): void {
  let arv: ReturnType<typeof lerArvore>;
  try {
    arv = lerArvore(paginaDe(document, location.href));
  } catch {
    return;
  }
  if (!arv.idProcedimento || !arv.documentos.length) return;
  const processo = { id: arv.idProcedimento, protocolo: arv.protocolo, tipo: arv.tipo || undefined, sigiloso: arv.nivel === "sigiloso" };
  let marcados = new Set<string>();
  const ler = async () => {
    const f = (await repos.unidade?.obter(processo.id)) ?? (await repos.pessoal.obter(processo.id));
    marcados = new Set(f && f.removidoEm === undefined ? (f.documentos ?? []).map((d) => d.id) : []);
  };
  void ler().then(() => {
    instalarEstilo(document);
    const estrelas = instalarEstrelasDocumentos(
      document,
      arv.documentos.map((d) => ({ id: d.id, numero: d.numero, titulo: d.titulo })),
      {
        marcado: (id) => marcados.has(id),
        alternar: async (d) => {
          await alternarDocumento(repos, processo, d);
          await ler();
        },
      },
    );
    for (const r of [repos.unidade, repos.pessoal]) r?.aoMudar(() => void ler().then(() => estrelas.repintar()));
  });
}

/** A mesma trava, esperando a vez (para o "apagar do SEI" nunca ser pulado). */
function travarEsperandoComLocks<T>(nome: string, fn: () => Promise<T>): Promise<T> {
  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) return fn();
  return locks.request(nome, () => fn()) as Promise<T>;
}
