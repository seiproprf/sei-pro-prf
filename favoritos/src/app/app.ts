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
import { filtrar, ordenar } from "../modelo/operacoes";
import { calcularPrazo } from "../modelo/prazo";
import {
  type Carimbo,
  type ContextoAba,
  type Escopo,
  type Etiqueta,
  type Favorito,
  type Filtro,
  type Pasta,
  PREFERENCIAS_PADRAO,
  type Preferencias,
  type ResumoPrazo,
  type TipoLista,
} from "../modelo/tipos";
import { montarOpcoesExibicao } from "../opcoes/exibicao";
import type { DocumentoAssinado } from "../pagina/documentos";
import { chaveStatusTexto } from "../pagina/sincronia";
import { gravarPreferencias, lerPreferencias } from "../preferencias";
import { moverEntreListas, type RepositorioFavoritos } from "../repositorio";
import type { StatusSync } from "../sincronia/motor";
import { nomeDoTexto } from "../sincronia/textoPadrao";
import { avisar } from "./aviso";
import { montarEditor } from "./componentes/editor";
import { renderFiltros, renderLote } from "./componentes/filtros";
import { montarGerenciar } from "./componentes/gerenciar";
import type { AcoesItem } from "./componentes/item";
import { renderLista, vizinhosAoMover } from "./componentes/lista";
import { montarLixeira } from "./componentes/lixeira";
import { montarMigracao } from "./componentes/migracao";
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
}

export class AppFavoritos {
  private lista: TipoLista;
  private visao: "lista" | "lixeira" = "lista";
  private todos: Favorito[] = [];
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
    };
    raiz.replaceChildren(
      this.el.faixas,
      h("header", { class: "fav-topo" }, this.el.abas, this.menu()),
      h("div", { class: "fav-ferramentas" }, busca, this.el.filtros),
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
    for (const r of [this.d.repos.unidade, this.d.repos.pessoal]) if (r) this.parar.push(r.aoMudar(() => this.agendarRecarga()));
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
    await this.oferecerMigracao(false);
    void this.repo.limpar().catch(() => undefined);
  }

  /** O painel lateral troca de app quando a aba da frente é de outra unidade ou outro SEI. */
  destruir(): void {
    this.destruido = true;
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
    const [inst, daOutra] = await Promise.all([this.repo.instantaneo(), outra ? outra.ativos() : Promise.resolve([])]);
    const { todos, pastas, etiquetas } = inst;
    this.todos = todos;
    this.pastas = pastas;
    this.etiquetas = etiquetas;
    const aqui = todos.filter((f) => f.removidoEm === undefined).length;
    this.contagem = this.lista === "unidade" ? { unidade: aqui, pessoal: daOutra.length } : { unidade: daOutra.length, pessoal: aqui };
    for (const id of [...this.selecao]) if (!todos.some((f) => f.id === id && f.removidoEm === undefined)) this.selecao.delete(id);
    this.redesenhar();
  }

  private readonly resumo = (f: Favorito): ResumoPrazo | undefined => (f.prazo ? calcularPrazo(f.prazo, this.d.hoje()) : undefined);

  private visiveis(): Favorito[] {
    const apoio = { etiquetas: new Map(this.etiquetas.map((e) => [e.id, e])), resumo: this.resumo };
    return ordenar(filtrar(this.todos, this.filtro, apoio), this.prefs.ordem, this.resumo);
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
    const itens = this.visiveis();
    this.desenharLote(itens);
    const pastas = new Map(this.pastas.map((p) => [p.id, p]));
    const etiquetas = new Map(this.etiquetas.map((e) => [e.id, e]));
    const manual = this.prefs.ordem === "manual" && !this.prefs.agruparPorPasta;
    const temAlgum = this.todos.some((f) => f.removidoEm === undefined);
    this.el.corpo.replaceChildren(
      renderLista({
        itens,
        agrupar: this.prefs.agruparPorPasta,
        pastas: this.pastas,
        apoio: (f) => ({
          pastas,
          etiquetas,
          resumo: this.resumo(f),
          selecionado: this.selecao.has(f.id),
          arrastavel: manual,
          outraLista: this.outra?.rotulo ?? null,
        }),
        acoes: this.acoesItem(itens.map((f) => f.id)),
        reordenar: manual ? (id, antes, depois) => void this.repo.mover(id, antes, depois) : undefined,
        vazio: temAlgum
          ? "Nenhum favorito com esses filtros."
          : "Nenhum favorito nesta lista ainda. Clique na estrela ao lado de um processo, no Controle de Processos ou na árvore, para guardá-lo aqui.",
      }),
    );
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
        this.escopoUnidade ? item("Sincronização…", () => this.abrirSincronizacao()) : null,
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

  private get escopoUnidade(): Escopo | null {
    return escoposDoContexto(this.d.ctx).unidade;
  }

  /** Convite único (por navegador) para sincronizar a lista da unidade pelo Texto Padrão. */
  private convidarSincronia(): void {
    if (!this.escopoUnidade || this.prefs.textoPadrao !== "nao-perguntado") return;
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
            void gravarPreferencias(this.d.sync, { textoPadrao: "desligado" });
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
              void gravarPreferencias(this.d.sync, { textoPadrao: "ligado" });
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
      const texto = this.prefs.textoPadrao === "ligado" ? textoDoStatus(st, Date.now()) : "";
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

  private abrirSincronizacao(): void {
    const esc = this.escopoUnidade;
    if (!esc) return;
    let modal: { fechar(): void } | null = null;
    const situacao = h("p", { class: "fav-dica" });
    const pintar = async () => {
      const st = (await this.d.area.obter(chaveStatusTexto(esc)))[chaveStatusTexto(esc)] as StatusSync | undefined;
      situacao.textContent =
        this.prefs.textoPadrao === "ligado"
          ? textoDoStatus(st, Date.now()) || "Ligada. A primeira sincronia acontece numa tela do SEI desta unidade."
          : "Desligada: estes favoritos ficam só neste navegador.";
    };
    void pintar();
    const ligado = this.prefs.textoPadrao === "ligado";
    const acao = (op: string, aviso: string) => async () => {
      try {
        await this.d.rpc.chamar(op, undefined, 120_000);
        avisar(aviso);
      } catch (e) {
        avisar(e instanceof Error ? e.message : String(e));
      }
      void pintar();
    };
    const conteudo = h(
      "div",
      { class: "fav-form" },
      h("h3", {}, `Texto Padrão da ${this.sigla}`),
      situacao,
      ligado
        ? h(
            "div",
            { class: "linha" },
            h("button", { type: "button", class: "spro-botao", onclick: acao("sincronizarAgora", "Sincronizado.") }, "Sincronizar agora"),
            h(
              "button",
              {
                type: "button",
                class: "spro-botao",
                onclick: () => {
                  void gravarPreferencias(this.d.sync, { textoPadrao: "desligado" });
                  modal?.fechar();
                  avisar("Sincronização desligada. O texto continua no SEI até você apagá-lo.");
                },
              },
              "Desligar",
            ),
            h(
              "button",
              {
                type: "button",
                class: "spro-botao perigo",
                onclick: async () => {
                  if (
                    !(await this.d.confirmar(
                      `Apagar do SEI o texto “${nomeDoTexto(this.d.ctx.login)}” e desligar? Os favoritos continuam neste navegador.`,
                    ))
                  )
                    return;
                  await acao("apagarDoSei", "Texto apagado do SEI e sincronização desligada.")();
                  modal?.fechar();
                },
              },
              "Desligar e apagar do SEI",
            ),
          )
        : h(
            "button",
            {
              type: "button",
              class: "spro-botao primario",
              onclick: () => {
                modal?.fechar();
                this.pedirConsentimento();
              },
            },
            "Ligar…",
          ),
    );
    modal = this.d.abrirModal({ titulo: "Sincronização", conteudo });
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
