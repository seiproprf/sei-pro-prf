/**
 * O app do favoritos: estado da tela e orquestração. Não toca o navegador
 * direto (diálogo, download, área de transferência, arquivo e a aba do SEI
 * chegam por `DepsApp`), e por isso roda inteiro nos testes com linkedom.
 */

import type { Area } from "@comum/armazenamento/area";
import type { DataISO } from "@comum/datas/dias";
import type { Rpc } from "@comum/ponte/rpc";
import { h, icone } from "@comum/ui/dom";
import { exportarTudo, importarEnvelope, lerEnvelope } from "../arquivo";
import { converterLegado } from "../migracao/legado";
import { CHAVE_PREFERENCIAS, chaveMigracao, chaveUltimaUnidade } from "../modelo/constantes";
import { escoposDoContexto } from "../modelo/escopo";
import { lembreteVencido, textoLembrete } from "../modelo/lembrete";
import { compararInstantaneos, type Mudanca, resumoNovidade } from "../modelo/novidades";
import { filtrar, ordenar } from "../modelo/operacoes";
import { calcularPrazo } from "../modelo/prazo";
import {
  type Carimbo,
  type ContextoAba,
  type Escopo,
  type Etiqueta,
  type Favorito,
  type Filtro,
  type Instantaneo,
  type Pasta,
  PREFERENCIAS_PADRAO,
  type Preferencias,
  type ResumoPrazo,
  type TipoLista,
} from "../modelo/tipos";
import { montarOpcoesExibicao } from "../opcoes/exibicao";
import { chaveProgresso, type ProgressoAtualizacao } from "../pagina/atualizar";
import type { DocumentoAssinado } from "../pagina/documentos";
import { chaveStatusTexto } from "../pagina/sincronia";
import { definirTextoPadrao, estadoTextoPadrao, gravarPreferencias, lerPreferencias } from "../preferencias";
import { moverEntreListas, type RepositorioFavoritos } from "../repositorio";
import type { ControleArquivo } from "../sincronia/arquivoSync";
import { type ArmazemCopias, fazerCopiaDoDia, restaurarCopia } from "../sincronia/copias";
import type { StatusSync } from "../sincronia/motor";
import { nomeDoTexto } from "../sincronia/textoPadrao";
import { avisar } from "./aviso";
import { montarEditor } from "./componentes/editor";
import { renderFiltros, renderLote } from "./componentes/filtros";
import { montarGerenciar } from "./componentes/gerenciar";
import type { AcoesItem } from "./componentes/item";
import { montarLembrete } from "./componentes/lembrete";
import { renderLista, vizinhosAoMover } from "./componentes/lista";
import { montarLixeira } from "./componentes/lixeira";
import { montarMigracao } from "./componentes/migracao";
import { montarSincronizacao } from "./componentes/sincronizacao";
import { gerarCsv, linhasCsv } from "./csv";
import { type LeafletMinimo, montarMapaFavorito, montarMapaGeral, pontosDoMapa } from "./mapa";

export type AbrirModal = (o: { titulo: string; conteudo: HTMLElement; aoFechar?: () => void }) => { fechar(): void };

export interface DepsApp {
  rpc: Pick<Rpc, "chamar">;
  ctx: ContextoAba;
  area: Area;
  sync: Area;
  repos: { unidade: RepositorioFavoritos | null; pessoal: RepositorioFavoritos };
  carimbo: () => Carimbo;
  abrirModal: AbrirModal;
  confirmar(texto: string): Promise<boolean>;
  baixar(nome: string, conteudo: string, tipo: string): void;
  copiar(texto: string): Promise<void>;
  escolherArquivo(): Promise<string | null>;
  hoje(): DataISO;
  /**
   * Depois de cada redesenho. Fora da tela o Chrome suspende o ResizeObserver de
   * iframe de outra origem (prova P2): quem embute o app mede a altura aqui.
   */
  aoRedesenhar?: () => void;
  /** O pacote tem painel lateral (decide as opções de "onde mostrar"). */
  lateralDisponivel?: boolean;
  /** Carrega o Leaflet sob demanda; ausente, o app não oferece mapa. */
  carregarMapa?: () => Promise<LeafletMinimo>;
  /** Cópias diárias (IndexedDB da extensão). */
  copias?: ArmazemCopias;
  /** Arquivo numa pasta da nuvem (File System Access); null onde não há como. */
  arquivo?: ControleArquivo | null;
  /** Pendências (lembretes vencidos + novidades) a cada redesenho: o contador da aba do painel. */
  aoContar?: (n: number) => void;
}

export class AppFavoritos {
  private lista: TipoLista;
  private visao: "lista" | "lixeira" = "lista";
  private todos: Favorito[] = [];
  private atuais = new Map<string, Instantaneo>();
  private pastas: Pasta[] = [];
  private etiquetas: Etiqueta[] = [];
  private contagem = { unidade: 0, pessoal: 0 };
  private filtro: Filtro = {};
  private readonly selecao = new Set<string>();
  private prefs: Preferencias = { ...PREFERENCIAS_PADRAO };
  private recargaAgendada = false;
  private destruido = false;
  private readonly parar: Array<() => void> = [];
  private readonly el: {
    faixas: HTMLElement;
    abas: HTMLElement;
    filtros: HTMLElement;
    lote: HTMLElement;
    corpo: HTMLElement;
    status: HTMLElement;
    atualizar: HTMLButtonElement;
  };

  constructor(
    raiz: HTMLElement,
    private readonly d: DepsApp,
  ) {
    this.lista = d.repos.unidade ? "unidade" : "pessoal";
    const busca = h("input", {
      type: "search",
      class: "spro-campo fav-busca",
      placeholder: "Buscar por número, título, tipo, etiqueta ou nota",
      "aria-label": "Buscar nos favoritos",
    });
    let espera: ReturnType<typeof setTimeout> | undefined;
    busca.addEventListener("input", () => {
      clearTimeout(espera);
      espera = setTimeout(() => this.filtrar({ ...this.filtro, busca: busca.value || undefined }), 150);
    });
    this.el = {
      faixas: h("div", { class: "fav-faixas" }),
      abas: h("div", { class: "fav-abas", role: "tablist", "aria-label": "Listas" }),
      filtros: h("div"),
      lote: h("div", { hidden: true }),
      corpo: h("div", { class: "fav-corpo" }),
      status: h("p", { class: "fav-status-sync", hidden: true }),
      atualizar: h("button", {
        type: "button",
        class: "spro-botao fav-atualizar",
        hidden: true,
        onclick: () => void this.atualizarForaDaUnidade(),
      }),
    };
    raiz.replaceChildren(
      this.el.faixas,
      h("header", { class: "fav-topo" }, this.el.abas, this.menu()),
      h("div", { class: "fav-ferramentas" }, busca, this.el.filtros, this.el.atualizar),
      this.el.lote,
      this.el.corpo,
      this.el.status,
    );
  }

  private get repo(): RepositorioFavoritos {
    return (this.lista === "unidade" ? this.d.repos.unidade : null) ?? this.d.repos.pessoal;
  }

  private get sigla(): string {
    return this.d.ctx.unidade?.sigla || "Unidade";
  }

  /** O content script já entrega minúsculo; aqui se garante, porque as chaves dependem disso. */
  private get login(): string {
    return this.d.ctx.login.toLowerCase();
  }

  private get outra(): { repo: RepositorioFavoritos; rotulo: string } | null {
    const u = this.d.repos.unidade;
    if (!u) return null;
    return this.lista === "unidade" ? { repo: this.d.repos.pessoal, rotulo: "Pessoal" } : { repo: u, rotulo: this.sigla };
  }

  async iniciar(): Promise<void> {
    this.prefs = await lerPreferencias(this.d.sync);
    await Promise.all([this.d.repos.unidade?.registrar(), this.d.repos.pessoal.registrar()]);
    await this.recarregar();
    for (const r of [this.d.repos.unidade, this.d.repos.pessoal])
      if (r)
        this.parar.push(
          r.aoMudar(() => {
            this.agendarRecarga();
            this.d.arquivo?.agendar();
          }),
          r.aoMudarAtuais(() => this.agendarRecarga()),
        );
    this.parar.push(
      this.d.sync.aoMudar((m) => {
        if (CHAVE_PREFERENCIAS in m) {
          void lerPreferencias(this.d.sync).then((p) => {
            this.prefs = p;
            this.redesenhar();
          });
        }
      }),
    );
    await this.verificarFaixaUnidade();
    this.convidarSincronia();
    this.ligarStatusSync();
    this.ligarProgressoAtualizar();
    void this.copiaDoDia();
    void this.d.arquivo?.sincronizar().catch(() => undefined);
    await this.oferecerMigracao(false);
    void this.repo.limpar().catch(() => undefined);
  }

  private async copiaDoDia(): Promise<void> {
    if (!this.d.copias) return;
    try {
      await fazerCopiaDoDia(this.d.area, { host: this.d.ctx.host, login: this.login }, this.d.copias, this.d.hoje(), this.d.carimbo());
    } catch (e) {
      console.warn("[SEI Pro] favoritos: cópia do dia não foi feita", e);
    }
  }

  /** O painel lateral troca de app quando a aba da frente é de outra unidade ou outro SEI. */
  destruir(): void {
    this.destruido = true;
    this.d.arquivo?.parar();
    for (const p of this.parar.splice(0)) p();
  }

  private agendarRecarga(): void {
    if (this.recargaAgendada || this.destruido) return;
    this.recargaAgendada = true;
    setTimeout(() => {
      this.recargaAgendada = false;
      void this.recarregar();
    }, 30);
  }

  async recarregar(): Promise<void> {
    // Uma leitura para a lista aberta e outra só para a contagem da outra aba.
    const outra = this.outra?.repo;
    const [inst, daOutra, atuais] = await Promise.all([
      this.repo.instantaneo(),
      outra ? outra.ativos() : Promise.resolve([]),
      this.repo.atuais(),
    ]);
    const { todos, pastas, etiquetas } = inst;
    this.todos = todos;
    this.atuais = atuais;
    this.pastas = pastas;
    this.etiquetas = etiquetas;
    const aqui = todos.filter((f) => f.removidoEm === undefined).length;
    this.contagem = this.lista === "unidade" ? { unidade: aqui, pessoal: daOutra.length } : { unidade: daOutra.length, pessoal: aqui };
    for (const id of [...this.selecao]) if (!todos.some((f) => f.id === id && f.removidoEm === undefined)) this.selecao.delete(id);
    this.redesenhar();
  }

  private readonly resumo = (f: Favorito): ResumoPrazo | undefined => (f.prazo ? calcularPrazo(f.prazo, this.d.hoje()) : undefined);

  private readonly novidades = (f: Favorito): Mudanca[] => compararInstantaneos(f.visto, this.atuais.get(f.id));

  private visiveis(): Favorito[] {
    const apoio = {
      etiquetas: new Map(this.etiquetas.map((e) => [e.id, e])),
      resumo: this.resumo,
      novidades: this.novidades,
      hoje: this.d.hoje(),
    };
    return ordenar(filtrar(this.todos, this.filtro, apoio), this.prefs.ordem, this.resumo, this.novidades);
  }

  /** Favoritos desta lista que pedem atenção: lembrete vencido ou novidade. */
  private pendencias(): number {
    const hoje = this.d.hoje();
    return this.todos.filter((f) => f.removidoEm === undefined && (lembreteVencido(f, hoje) || this.novidades(f).length > 0)).length;
  }

  /** Não estão na caixa (pelo que se sabe) e não são sigilosos: o que o "Atualizar" leria. */
  private foraDaUnidade(): number {
    return this.todos.filter((f) => f.removidoEm === undefined && !f.sigiloso && this.atuais.get(f.id)?.abertoNaUnidade !== true).length;
  }

  private filtrar(f: Filtro): void {
    this.filtro = f;
    this.redesenhar();
  }

  private redesenhar(): void {
    if (this.destruido) return;
    this.desenhar();
    this.d.aoRedesenhar?.();
  }

  private desenhar(): void {
    this.desenharAbas();
    this.el.filtros.replaceChildren(
      renderFiltros(
        {
          filtro: this.filtro,
          ordem: this.prefs.ordem,
          agrupar: this.prefs.agruparPorPasta,
          pastas: this.pastas,
          etiquetas: this.etiquetas,
        },
        {
          filtrar: (f) => this.filtrar(f),
          ordenar: (m) => void gravarPreferencias(this.d.sync, { ordem: m }),
          agrupar: (v) => void gravarPreferencias(this.d.sync, { agruparPorPasta: v }),
          selecionarTodos: () => {
            for (const f of this.visiveis()) this.selecao.add(f.id);
            this.redesenhar();
          },
        },
      ),
    );
    if (this.visao === "lixeira") {
      this.el.lote.hidden = true;
      this.el.corpo.replaceChildren(
        montarLixeira(this.todos, Date.now(), {
          restaurar: async (id) => {
            await this.repo.restaurar([id]);
          },
          voltar: () => {
            this.visao = "lista";
            this.redesenhar();
          },
        }),
      );
      return;
    }
    const todosVisiveis = this.visiveis();
    this.desenharLote(todosVisiveis);
    this.desenharAtualizar();
    this.d.aoContar?.(this.pendencias());
    const hoje = this.d.hoje();
    // "Para hoje" no topo (lembretes vencidos), salvo quando o próprio filtro já é esse.
    const paraHoje = this.filtro.lembrete ? [] : todosVisiveis.filter((f) => lembreteVencido(f, hoje));
    const itens = paraHoje.length ? todosVisiveis.filter((f) => !paraHoje.includes(f)) : todosVisiveis;
    const pastas = new Map(this.pastas.map((p) => [p.id, p]));
    const etiquetas = new Map(this.etiquetas.map((e) => [e.id, e]));
    const manual = this.prefs.ordem === "manual" && !this.prefs.agruparPorPasta;
    const temAlgum = this.todos.some((f) => f.removidoEm === undefined);
    const apoio = (arrastavel: boolean) => (f: Favorito) => ({
      pastas,
      etiquetas,
      resumo: this.resumo(f),
      selecionado: this.selecao.has(f.id),
      arrastavel,
      outraLista: this.outra?.rotulo ?? null,
      novidade: resumoNovidade(this.novidades(f)),
      lembrete: f.lembrete ? textoLembrete(f.lembrete, hoje) : undefined,
    });
    const acoes = this.acoesItem(itens.map((f) => f.id));
    this.el.corpo.replaceChildren(
      ...(paraHoje.length
        ? [
            h(
              "section",
              { class: "fav-hoje" },
              h("h3", {}, `Para hoje (${paraHoje.length})`),
              renderLista({ itens: paraHoje, agrupar: false, pastas: this.pastas, apoio: apoio(false), acoes, vazio: "" }),
            ),
          ]
        : []),
      itens.length || !paraHoje.length
        ? renderLista({
            itens,
            agrupar: this.prefs.agruparPorPasta,
            pastas: this.pastas,
            apoio: apoio(manual),
            acoes,
            reordenar: manual ? (id, antes, depois) => void this.repo.mover(id, antes, depois) : undefined,
            vazio: temAlgum
              ? "Nenhum favorito com esses filtros."
              : "Nenhum favorito nesta lista ainda. Clique na estrela ao lado de um processo, no Controle de Processos ou na árvore, para guardá-lo aqui.",
          })
        : h("span"),
    );
  }

  private desenharAtualizar(): void {
    const n = this.visao === "lista" ? this.foraDaUnidade() : 0;
    this.el.atualizar.hidden = n === 0;
    this.el.atualizar.replaceChildren(icone("atualizar", 14), `Atualizar fora da unidade (${n})`);
  }

  /** "Atualizar fora da unidade": na 1ª vez, explica o cuidado antes de rodar. */
  private async atualizarForaDaUnidade(): Promise<void> {
    const chave = "favoritos/atualizarExplicado";
    const explicado = !!(await this.d.area.obter(chave))[chave];
    const rodar = () =>
      void this.d.rpc
        .chamar<{ lidos: number; erros: number; chegaram: number }>("atualizarForaDaUnidade", undefined, 60 * 60_000)
        .then((r) => {
          if (!r || typeof r !== "object") return;
          avisar(
            `${r.lidos} ${r.lidos === 1 ? "processo atualizado" : "processos atualizados"}.${r.erros ? ` ${r.erros} com erro.` : ""}${r.chegaram ? ` ${r.chegaram} chegaram à sua unidade durante a leitura (o SEI registrou o recebimento).` : ""}`,
          );
        })
        .catch((e: Error) => avisar(e.message));
    if (explicado) {
      rodar();
      return;
    }
    let modal: { fechar(): void } | null = null;
    const conteudo = h(
      "div",
      { class: "fav-form" },
      h(
        "p",
        {},
        "O SEI Pro vai abrir, um de cada vez, os favoritos que estão fora da sua unidade para ver o que mudou (documentos e último andamento). Antes, ele lê a sua caixa inteira e deixa de fora tudo o que está nela: abrir um processo aberto na unidade faria o SEI registrar o recebimento ou marcá-lo como visualizado.",
      ),
      h("p", { class: "fav-dica" }, "Processos sigilosos ficam de fora. Você pode cancelar a qualquer momento."),
      h(
        "div",
        { class: "spro-dialogo-rodape" },
        h("button", { type: "button", class: "spro-botao", onclick: () => modal?.fechar() }, "Cancelar"),
        h(
          "button",
          {
            type: "button",
            class: "spro-botao primario",
            onclick: () => {
              modal?.fechar();
              void this.d.area.gravar({ [chave]: Date.now() });
              rodar();
            },
          },
          "Atualizar",
        ),
      ),
    );
    modal = this.d.abrirModal({ titulo: "Atualizar fora da unidade", conteudo });
  }

  /** Faixa "Atualizando 3 de 12…" enquanto a aba lê os favoritos fora da unidade. */
  private ligarProgressoAtualizar(): void {
    const chave = chaveProgresso(this.d.ctx.host, this.login);
    let faixa: HTMLElement | null = null;
    const pintar = (p: ProgressoAtualizacao | undefined) => {
      const ativo = p && !p.fim && Date.now() - ((p as { quando?: number }).quando ?? 0) < 10 * 60_000;
      if (!ativo) {
        faixa?.remove();
        faixa = null;
        this.d.aoRedesenhar?.();
        return;
      }
      faixa ??= h("div", { class: "fav-faixa fav-progresso", role: "status" });
      faixa.replaceChildren(
        h("span", {}, `Atualizando ${p.feitos} de ${p.total}${p.atual ? ` (${p.atual})` : ""}…`),
        h(
          "button",
          { type: "button", class: "spro-botao", onclick: () => void this.d.rpc.chamar("cancelarAtualizacao").catch(() => undefined) },
          "Cancelar",
        ),
      );
      if (!faixa.isConnected) this.el.faixas.append(faixa);
      this.d.aoRedesenhar?.();
    };
    void this.d.area.obter(chave).then((v) => pintar(v[chave] as ProgressoAtualizacao | undefined));
    this.parar.push(
      this.d.area.aoMudar((m) => {
        if (chave in m) pintar(m[chave]?.novo as ProgressoAtualizacao | undefined);
      }),
    );
  }

  private abrirLembrete(f: Favorito): void {
    let modal: { fechar(): void } | null = null;
    const repo = this.repo;
    const conteudo = montarLembrete({
      lembrete: f.lembrete,
      hoje: this.d.hoje(),
      salvar: async (l) => {
        await repo.editar(f.id, { lembrete: l });
      },
      fechar: () => modal?.fechar(),
    });
    modal = this.d.abrirModal({ titulo: `Lembrete — ${f.protocolo}`, conteudo });
  }

  private desenharAbas(): void {
    const aba = (lista: TipoLista, rotulo: string) =>
      h(
        "button",
        {
          type: "button",
          role: "tab",
          class: "spro-botao",
          "aria-selected": String(this.lista === lista && this.visao === "lista"),
          onclick: () => {
            this.lista = lista;
            this.visao = "lista";
            this.selecao.clear();
            this.filtro = { busca: this.filtro.busca };
            void this.recarregar();
          },
        },
        rotulo,
      );
    this.el.abas.replaceChildren(
      ...(this.d.repos.unidade ? [aba("unidade", `${this.sigla} (${this.contagem.unidade})`)] : []),
      aba("pessoal", `Pessoal (${this.contagem.pessoal})`),
    );
  }

  private selecionados(): Favorito[] {
    return this.todos.filter((f) => this.selecao.has(f.id) && f.removidoEm === undefined);
  }

  private desenharLote(visiveis: Favorito[]): void {
    const qtd = visiveis.filter((f) => this.selecao.has(f.id)).length;
    this.el.lote.hidden = qtd === 0;
    if (!qtd) {
      this.el.lote.replaceChildren();
      return;
    }
    const outra = this.outra;
    this.el.lote.replaceChildren(
      renderLote(qtd, this.pastas, this.etiquetas, {
        moverPasta: (pasta) => void this.emLote((f) => this.repo.editar(f.id, { pasta })),
        etiquetar: (id) => void this.emLote((f) => this.repo.editar(f.id, { etiquetas: [...f.etiquetas, id] })),
        copiar: () =>
          void this.d
            .copiar(
              this.selecionados()
                .map((f) => f.protocolo)
                .join("\n"),
            )
            .then(() => avisar("Números copiados.")),
        csv: () => this.baixarCsv(this.selecionados()),
        remover: () => void this.remover(this.selecionados().map((f) => f.id)),
        limpar: () => {
          this.selecao.clear();
          this.redesenhar();
        },
        marcarVistos: () => {
          void this.repo
            .marcarVisto(this.selecionados().map((f) => f.id))
            .then((n) => avisar(`${n} ${n === 1 ? "marcado" : "marcados"} como visto.`));
        },
        outraLista: outra ? { rotulo: outra.rotulo, mover: () => void this.moverParaOutra(this.selecionados().map((f) => f.id)) } : null,
      }),
    );
  }

  private async emLote(fazer: (f: Favorito) => Promise<unknown>): Promise<void> {
    for (const f of this.selecionados()) await fazer(f);
  }

  private acoesItem(ids: string[]): AcoesItem {
    return {
      abrir: (f, novaAba) =>
        void this.d.rpc.chamar("abrirProcesso", { id: f.id, protocolo: f.protocolo, novaAba }).catch((e: Error) => avisar(e.message)),
      editar: (f) => this.abrirEditor(f),
      alternarSelecao: (f, marcado) => {
        if (marcado) this.selecao.add(f.id);
        else this.selecao.delete(f.id);
        this.desenharLote(this.visiveis());
      },
      remover: (f) => void this.remover([f.id]),
      marcarVisto: (f) => void this.repo.marcarVisto([f.id]),
      // Documento pela pesquisa rápida com o número SEI: o SEI abre o processo já nele. Sem id, não usa a linha da caixa.
      abrirDocumento: (_f, d, novaAba) =>
        void this.d.rpc.chamar("abrirProcesso", { id: "", protocolo: d.numero, novaAba }).catch((e: Error) => avisar(e.message)),
      removerDocumento: (f, d) => void this.repo.editar(f.id, { documentos: (f.documentos ?? []).filter((x) => x.id !== d.id) }),
      lembrete: (f) => this.abrirLembrete(f),
      moverLista: (f) => void this.moverParaOutra([f.id]),
      mapa: this.d.carregarMapa ? (f) => void this.abrirMapa(f) : undefined,
      moverOrdem: (f, direcao) => {
        const v = vizinhosAoMover(ids, f.id, direcao);
        if (!v) return;
        if (this.prefs.ordem !== "manual") void gravarPreferencias(this.d.sync, { ordem: "manual" });
        void this.repo.mover(f.id, v[0], v[1]);
      },
    };
  }

  private async remover(ids: string[]): Promise<void> {
    const repo = this.repo;
    const n = await repo.remover(ids);
    this.selecao.clear();
    avisar(`${n} ${n === 1 ? "favorito foi" : "favoritos foram"} para a lixeira.`, {
      rotulo: "Desfazer",
      fazer: () => void repo.restaurar(ids),
    });
  }

  private async moverParaOutra(ids: string[]): Promise<void> {
    const outra = this.outra;
    if (!outra) return;
    for (const id of ids) await moverEntreListas(this.repo, outra.repo, id);
    this.selecao.clear();
    avisar(`Movido para ${outra.rotulo}.`);
  }

  private baixarCsv(itens: Favorito[]): void {
    const rotulo = this.lista === "unidade" ? this.sigla : "Pessoal";
    const csv = gerarCsv(
      linhasCsv(itens, {
        pastas: new Map(this.pastas.map((p) => [p.id, p])),
        etiquetas: new Map(this.etiquetas.map((e) => [e.id, e])),
        resumo: this.resumo,
        lista: rotulo,
      }),
    );
    this.d.baixar(`favoritos-${rotulo}-${this.d.hoje()}.csv`, csv, "text/csv;charset=utf-8");
  }

  private abrirEditor(f: Favorito): void {
    let modal: { fechar(): void } | null = null;
    const conteudo = montarEditor({
      favorito: f,
      pastas: this.pastas,
      etiquetas: this.etiquetas,
      hoje: this.d.hoje(),
      salvar: async (m) => {
        await this.repo.editar(f.id, m);
      },
      criarPasta: (nome) => this.repo.criarPasta(nome),
      criarEtiqueta: (nome) => this.repo.criarEtiqueta(nome),
      fechar: () => modal?.fechar(),
      listarDocumentos: (buscar) =>
        this.d.rpc
          .chamar<{ documentos: DocumentoAssinado[] }>("documentosAssinados", { id: f.id, protocolo: f.protocolo, buscar }, 90_000)
          .then((r) => r.documentos),
    });
    modal = this.d.abrirModal({ titulo: `Favorito ${f.protocolo}`, conteudo });
  }

  private async abrirGerenciar(): Promise<void> {
    const repo = this.repo;
    const conteudo = await montarGerenciar({
      listar: async () => ({ pastas: await repo.pastasAtivas(), etiquetas: await repo.etiquetasAtivas() }),
      criarPasta: (n) => repo.criarPasta(n),
      editarPasta: (id, m) => repo.editarPasta(id, m),
      removerPasta: (id) => repo.removerPasta(id),
      criarEtiqueta: (n) => repo.criarEtiqueta(n),
      editarEtiqueta: (id, m) => repo.editarEtiqueta(id, m),
      removerEtiqueta: (id) => repo.removerEtiqueta(id),
      confirmar: (t) => this.d.confirmar(t),
    });
    this.d.abrirModal({ titulo: `Pastas e etiquetas — ${this.lista === "unidade" ? this.sigla : "Pessoal"}`, conteudo });
  }

  private menu(): HTMLElement {
    const detalhes = h("details", { class: "fav-menu-topo" });
    const item = (rotulo: string, fazer: () => void) =>
      h(
        "button",
        {
          type: "button",
          role: "menuitem",
          onclick: () => {
            detalhes.removeAttribute("open");
            fazer();
          },
        },
        rotulo,
      );
    detalhes.append(
      h("summary", { title: "Opções", "aria-label": "Opções dos favoritos" }, icone("ajustes", 18)),
      h(
        "div",
        { class: "fav-menu-lista", role: "menu" },
        item("Pastas e etiquetas", () => void this.abrirGerenciar()),
        this.d.carregarMapa ? item("Mapa dos favoritos", () => void this.abrirMapaGeral()) : null,
        item("Lixeira", () => {
          this.visao = "lixeira";
          this.redesenhar();
        }),
        item("Exportar arquivo (.json)", () => void this.exportar()),
        item("Importar arquivo", () => void this.importar()),
        item("Trazer favoritos da versão anterior", () => void this.oferecerMigracao(true)),
        item("Sincronização…", () => void this.abrirSincronizacao()),
        item("Preferências…", () => void this.abrirPreferencias()),
      ),
    );
    return detalhes;
  }

  private async abrirMapa(f: Favorito): Promise<void> {
    let L: LeafletMinimo;
    try {
      L = await this.d.carregarMapa!();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível abrir o mapa.");
      return;
    }
    const repo = this.repo;
    let modal: { fechar(): void } | null = null;
    const m = montarMapaFavorito({
      L,
      favorito: f,
      salvar: async (local) => {
        await repo.editar(f.id, { local });
      },
      fechar: () => modal?.fechar(),
    });
    modal = this.d.abrirModal({ titulo: `Local no mapa — ${f.protocolo}`, conteudo: m.el });
    m.iniciar();
  }

  private async abrirMapaGeral(): Promise<void> {
    let L: LeafletMinimo;
    try {
      L = await this.d.carregarMapa!();
    } catch (e) {
      avisar(e instanceof Error ? e.message : "Não foi possível abrir o mapa.");
      return;
    }
    const porId = new Map(this.todos.map((f) => [f.id, f]));
    const m = montarMapaGeral({
      L,
      pontos: pontosDoMapa(this.visiveis()),
      abrir: (id) => {
        const f = porId.get(id);
        if (f)
          void this.d.rpc
            .chamar("abrirProcesso", { id: f.id, protocolo: f.protocolo, novaAba: false })
            .catch((e: Error) => avisar(e.message));
      },
    });
    this.d.abrirModal({ titulo: "Mapa dos favoritos", conteudo: m.el });
    m.iniciar();
  }

  /** Consentimento do Texto Padrão desta unidade (ver preferencias.ts). */
  private estadoTP(): "nao-perguntado" | "ligado" | "desligado" {
    return estadoTextoPadrao(this.prefs, this.d.ctx.host, this.d.ctx.unidade?.id ?? "");
  }

  private definirTP(v: "ligado" | "desligado"): Promise<unknown> {
    return definirTextoPadrao(this.d.sync, this.d.ctx.host, this.d.ctx.unidade?.id ?? "", v);
  }

  private get escopoUnidade(): Escopo | null {
    return escoposDoContexto(this.d.ctx).unidade;
  }

  /** Convite único (por navegador) para sincronizar a lista da unidade pelo Texto Padrão. */
  private convidarSincronia(): void {
    if (!this.escopoUnidade || this.estadoTP() !== "nao-perguntado") return;
    const faixa: HTMLElement = h(
      "div",
      { class: "fav-faixa fav-convite-sync", role: "note" },
      h(
        "span",
        {},
        `Quer ver os favoritos da ${this.sigla} também em outros computadores? O SEI Pro pode guardá-los num Texto Padrão da unidade, sem servidor nenhum.`,
      ),
      h(
        "button",
        { type: "button", class: "spro-botao primario", onclick: () => this.pedirConsentimento(() => faixa.remove()) },
        "Saiba mais e ligar",
      ),
      h(
        "button",
        {
          type: "button",
          class: "spro-botao",
          onclick: () => {
            faixa.remove();
            this.d.aoRedesenhar?.();
            void this.definirTP("desligado");
          },
        },
        "Agora não",
      ),
    );
    this.el.faixas.append(faixa);
    this.d.aoRedesenhar?.();
  }

  private pedirConsentimento(aoLigar?: () => void): void {
    let modal: { fechar(): void } | null = null;
    const nome = nomeDoTexto(this.d.ctx.login);
    const conteudo = h(
      "div",
      { class: "fav-form" },
      h(
        "p",
        {},
        `Os favoritos da ${this.sigla} ficam guardados no próprio SEI, num Texto Padrão chamado “${nome}”, e aparecem em qualquer computador em que você usar o SEI Pro. Antes de ligar:`,
      ),
      h(
        "ul",
        {},
        h("li", {}, `O texto fica visível para toda a unidade: qualquer pessoa da ${this.sigla} pode abri-lo na lista de Textos Padrão.`),
        h("li", {}, "Não use esse texto em documentos e não o edite: o SEI Pro o regrava sozinho."),
        h("li", {}, "Processos sigilosos e a lista Pessoal nunca vão para o SEI."),
        h("li", {}, "Para desligar, use “Sincronização…” no menu dos favoritos. Lá você também pode apagar o texto do SEI na hora."),
      ),
      h(
        "div",
        { class: "spro-dialogo-rodape" },
        h("button", { type: "button", class: "spro-botao", onclick: () => modal?.fechar() }, "Agora não"),
        h(
          "button",
          {
            type: "button",
            class: "spro-botao primario",
            onclick: () => {
              modal?.fechar();
              aoLigar?.();
              this.d.aoRedesenhar?.();
              void this.definirTP("ligado");
            },
          },
          "Ligar",
        ),
      ),
    );
    modal = this.d.abrirModal({ titulo: "Sincronizar pelo Texto Padrão", conteudo });
  }

  private ligarStatusSync(): void {
    const esc = this.escopoUnidade;
    if (!esc) return;
    const chave = chaveStatusTexto(esc);
    const pintar = async () => {
      const st = (await this.d.area.obter(chave))[chave] as StatusSync | undefined;
      const texto = this.estadoTP() === "ligado" ? textoDoStatus(st, Date.now()) : "";
      this.el.status.hidden = !texto;
      this.el.status.replaceChildren(
        ...(texto
          ? [
              h(
                "button",
                { type: "button", class: "fav-status-botao", title: "Abrir a sincronização", onclick: () => this.abrirSincronizacao() },
                icone("nuvem", 14),
                texto,
              ),
            ]
          : []),
      );
      this.el.status.dataset.estado = st?.estado ?? "nunca";
      this.d.aoRedesenhar?.();
    };
    void pintar();
    this.parar.push(
      this.d.area.aoMudar((m) => {
        if (chave in m) void pintar();
      }),
      this.d.sync.aoMudar((m) => {
        if (CHAVE_PREFERENCIAS in m) setTimeout(() => void pintar(), 20);
      }),
    );
    const relogio = setInterval(() => void pintar(), 60_000);
    // Só atualiza o "há N min": não pode segurar o processo dos testes (Node) aberto.
    (relogio as unknown as { unref?: () => void }).unref?.();
    this.parar.push(() => clearInterval(relogio));
  }

  private async abrirSincronizacao(): Promise<void> {
    const esc = this.escopoUnidade;
    let modal: { fechar(): void } | null = null;
    const dono = { host: this.d.ctx.host, login: this.login };
    const chamar = async (op: string, aviso: string) => {
      try {
        await this.d.rpc.chamar(op, undefined, 120_000);
        avisar(aviso);
      } catch (e) {
        avisar(e instanceof Error ? e.message : String(e));
      }
    };
    const arquivo = this.d.arquivo ?? null;
    const conteudo = await montarSincronizacao({
      textoPadrao: esc
        ? {
            sigla: this.sigla,
            nomeTexto: nomeDoTexto(this.d.ctx.login),
            ligado: this.estadoTP() === "ligado",
            situacao: async () => {
              const st = (await this.d.area.obter(chaveStatusTexto(esc)))[chaveStatusTexto(esc)] as StatusSync | undefined;
              return this.estadoTP() === "ligado" ? textoDoStatus(st, Date.now()) : "Desligada: esta lista fica só neste navegador.";
            },
            ligar: () => {
              modal?.fechar();
              this.pedirConsentimento();
            },
            agora: () => chamar("sincronizarAgora", "Sincronizado."),
            desligar: () => {
              void this.definirTP("desligado");
              modal?.fechar();
              avisar("Sincronização desligada. O texto continua no SEI até você apagá-lo.");
            },
            apagar: async () => {
              await chamar("apagarDoSei", "Texto apagado do SEI e sincronização desligada.");
              modal?.fechar();
            },
          }
        : null,
      arquivo: arquivo
        ? {
            status: () => arquivo.status(),
            configurado: () => arquivo.configurado(),
            escolher: async (modo) => {
              try {
                await arquivo.escolher(modo);
              } catch (e) {
                // Seletor cancelado não é erro; o resto (iframe sem permissão de seletor) vira aviso.
                if ((e as { name?: string }).name !== "AbortError") avisar(e instanceof Error ? e.message : String(e));
              }
            },
            reconectar: async () => void (await arquivo.reconectar()),
            agora: async () => void (await arquivo.sincronizar()),
            esquecer: () => arquivo.esquecer(),
          }
        : null,
      copias: this.d.copias
        ? {
            listar: () => this.d.copias!.listar(dono),
            restaurar: async (c) => {
              const r = await restaurarCopia(this.d.area, c, this.d.carimbo, dono);
              modal?.fechar();
              avisar(`${r.restaurados} ${r.restaurados === 1 ? "item restaurado" : "itens restaurados"}.`);
            },
          }
        : null,
      confirmar: (t) => this.d.confirmar(t),
    });
    modal = this.d.abrirModal({ titulo: "Sincronização", conteudo });
  }

  /** O app voltou a ficar visível: o arquivo pode ter sido mudado por outro computador. */
  aoGanharFoco(): void {
    void this.d.arquivo?.sincronizar().catch(() => undefined);
  }

  private async abrirPreferencias(): Promise<void> {
    const conteudo = await montarOpcoesExibicao({ sync: this.d.sync, lateralDisponivel: this.d.lateralDisponivel === true });
    this.d.abrirModal({ titulo: "Preferências dos favoritos", conteudo });
  }

  private async exportar(): Promise<void> {
    const env = await exportarTudo(this.d.area, this.d.ctx.host, this.login, this.d.carimbo());
    this.d.baixar(`favoritos-seipro-${this.login}-${this.d.hoje()}.json`, JSON.stringify(env, null, 2), "application/json");
  }

  private async importar(): Promise<void> {
    const texto = await this.d.escolherArquivo();
    if (!texto) return;
    let bruto: unknown;
    try {
      bruto = JSON.parse(texto.replace(/^\uFEFF/, ""));
    } catch {
      avisar("O arquivo escolhido não é um JSON válido.");
      return;
    }
    const lido = lerEnvelope(bruto);
    if (lido) {
      const r = await importarEnvelope(this.d.area, lido.envelope, this.d.carimbo, { host: this.d.ctx.host, login: this.login });
      const extra = [
        lido.descartados ? `${lido.descartados} itens ilegíveis ignorados` : "",
        r.deOutro ? `${r.deOutro} listas de outro usuário ignoradas` : "",
      ]
        .filter(Boolean)
        .join("; ");
      avisar(`${r.novos} novos e ${r.atualizados} atualizados.${extra ? ` (${extra})` : ""}`);
      return;
    }
    if (Array.isArray((bruto as { favorites?: unknown })?.favorites)) {
      await this.mostrarMigracao([bruto], true);
      return;
    }
    avisar("Este arquivo não é um arquivo de favoritos do SEI Pro.");
  }

  private async oferecerMigracao(forcar: boolean): Promise<void> {
    const chave = chaveMigracao(this.d.ctx.host, this.login);
    const marca = (await this.d.area.obter(chave))[chave] as { adiadoEm?: number } | undefined;
    // Trazidos: nunca mais pergunta. "Agora não": pergunta de novo depois de 30 dias.
    const adiadoVencido = typeof marca?.adiadoEm === "number" && Date.now() - marca.adiadoEm > 30 * 86_400_000;
    if (!forcar && marca && !adiadoVencido) return;
    let fontes: { local?: unknown; arquivo?: unknown };
    try {
      fontes = await this.d.rpc.chamar("lerLegado", undefined, 5000);
    } catch {
      if (forcar) avisar("Não foi possível ler os favoritos antigos nesta tela.");
      return;
    }
    await this.mostrarMigracao([fontes.local, fontes.arquivo], forcar);
  }

  /** Fontes em ordem de preferência: o que já está na primeira não é trazido de novo das seguintes. */
  private async mostrarMigracao(fontes: unknown[], forcar: boolean): Promise<void> {
    const chave = chaveMigracao(this.d.ctx.host, this.login);
    const agora = Date.now();
    const vistos = new Set<string>();
    const lotes = fontes.map((b) => {
      const r = converterLegado(b, { agora });
      const favoritos = r.favoritos.filter((f) => !vistos.has(f.id));
      for (const f of favoritos) vistos.add(f.id);
      return { ...r, favoritos };
    });
    if (!vistos.size) {
      if (forcar) avisar("Não há favoritos da versão anterior neste navegador.");
      return;
    }
    let modal: { fechar(): void } | null = null;
    const conteudo = montarMigracao({
      quantidade: vistos.size,
      amostra: lotes.flatMap((l) => l.favoritos.map((f) => f.protocolo)).slice(0, 3),
      siglaUnidade: this.d.repos.unidade ? this.sigla : null,
      trazer: async (destino) => {
        const repo = (destino === "unidade" ? this.d.repos.unidade : null) ?? this.d.repos.pessoal;
        let novos = 0;
        for (const l of lotes) novos += (await repo.importar(l)).novos;
        await this.d.area.gravar({ [chave]: { em: Date.now(), quantidade: vistos.size, destino } });
        modal?.fechar();
        avisar(`${novos} favoritos trazidos para ${destino === "unidade" ? this.sigla : "Pessoal"}.`);
      },
      adiar: async () => {
        await this.d.area.gravar({ [chave]: { adiadoEm: Date.now() } });
        modal?.fechar();
      },
    });
    modal = this.d.abrirModal({ titulo: "Favoritos da versão anterior", conteudo });
  }

  private async verificarFaixaUnidade(): Promise<void> {
    const u = this.d.ctx.unidade;
    if (!u) return;
    const chave = chaveUltimaUnidade(this.d.ctx.host, this.login);
    const ultima = (await this.d.area.obter(chave))[chave] as { id?: string; sigla?: string } | undefined;
    await this.d.area.gravar({ [chave]: { id: u.id, sigla: u.sigla } });
    if (!ultima?.id || ultima.id === u.id || this.prefs.faixaUnidadeDispensada) return;
    const faixa: HTMLElement = h(
      "div",
      { class: "fav-faixa fav-faixa-unidade", role: "note" },
      h(
        "span",
        {},
        `Você está na unidade ${u.sigla}: estes são os favoritos desta unidade. Os da ${ultima.sigla ?? "unidade anterior"} continuam guardados, e a lista Pessoal aparece em todas.`,
      ),
      h("button", { type: "button", class: "spro-botao", onclick: () => faixa.remove() }, "Entendi"),
      h(
        "button",
        {
          type: "button",
          class: "spro-botao",
          onclick: () => {
            faixa.remove();
            void gravarPreferencias(this.d.sync, { faixaUnidadeDispensada: true });
          },
        },
        "Não mostrar de novo",
      ),
    );
    this.el.faixas.append(faixa);
    this.d.aoRedesenhar?.();
  }
}

/** "Sincronizado há 2 min", "Erro: …" — a linha de status do Texto Padrão. */
export function textoDoStatus(st: StatusSync | undefined, agora: number): string {
  if (!st || st.estado === "nunca") return "Sincronia pelo Texto Padrão ligada: aguardando uma tela do SEI desta unidade.";
  if (st.estado === "erro") return `Erro na sincronia: ${st.mensagem ?? "tente de novo"}`;
  if (st.estado === "indisponivel") return st.mensagem ?? "Sincronia indisponível nesta unidade.";
  const min = Math.max(0, Math.round((agora - (st.ultimoOk ?? st.quando)) / 60_000));
  const quando =
    min < 1
      ? "agora há pouco"
      : min < 60
        ? `há ${min} min`
        : min < 1440
          ? `há ${Math.round(min / 60)} h`
          : `há ${Math.round(min / 1440)} dia(s)`;
  return `${st.pendente ? "Alterações a enviar · " : ""}Sincronizado ${quando} · Texto Padrão${st.mensagem ? ` · ${st.mensagem}` : ""}`;
}
