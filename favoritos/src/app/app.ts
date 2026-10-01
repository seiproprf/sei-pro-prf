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
import { filtrar, ordenar } from "../modelo/operacoes";
import { calcularPrazo } from "../modelo/prazo";
import {
  type Carimbo,
  type ContextoAba,
  type Etiqueta,
  type Favorito,
  type Filtro,
  type Pasta,
  PREFERENCIAS_PADRAO,
  type Preferencias,
  type ResumoPrazo,
  type TipoLista,
} from "../modelo/tipos";
import { gravarPreferencias, lerPreferencias } from "../preferencias";
import { moverEntreListas, type RepositorioFavoritos } from "../repositorio";
import { avisar } from "./aviso";
import { montarEditor } from "./componentes/editor";
import { renderFiltros, renderLote } from "./componentes/filtros";
import { montarGerenciar } from "./componentes/gerenciar";
import type { AcoesItem } from "./componentes/item";
import { renderLista, vizinhosAoMover } from "./componentes/lista";
import { montarLixeira } from "./componentes/lixeira";
import { montarMigracao } from "./componentes/migracao";
import { gerarCsv, linhasCsv } from "./csv";

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
  private readonly el: { faixas: HTMLElement; abas: HTMLElement; filtros: HTMLElement; lote: HTMLElement; corpo: HTMLElement };

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
    };
    raiz.replaceChildren(
      this.el.faixas,
      h("header", { class: "fav-topo" }, this.el.abas, this.menu()),
      h("div", { class: "fav-ferramentas" }, busca, this.el.filtros),
      this.el.lote,
      this.el.corpo,
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
    for (const r of [this.d.repos.unidade, this.d.repos.pessoal]) r?.aoMudar(() => this.agendarRecarga());
    this.d.sync.aoMudar((m) => {
      if (CHAVE_PREFERENCIAS in m) {
        void lerPreferencias(this.d.sync).then((p) => {
          this.prefs = p;
          this.redesenhar();
        });
      }
    });
    await this.verificarFaixaUnidade();
    await this.oferecerMigracao(false);
    void this.repo.limpar().catch(() => undefined);
  }

  private agendarRecarga(): void {
    if (this.recargaAgendada) return;
    this.recargaAgendada = true;
    setTimeout(() => {
      this.recargaAgendada = false;
      void this.recarregar();
    }, 30);
  }

  async recarregar(): Promise<void> {
    const [todos, pastas, etiquetas, daUnidade, pessoais] = await Promise.all([
      this.repo.todos(),
      this.repo.pastasAtivas(),
      this.repo.etiquetasAtivas(),
      this.d.repos.unidade ? this.d.repos.unidade.ativos() : Promise.resolve([]),
      this.d.repos.pessoal.ativos(),
    ]);
    this.todos = todos;
    this.pastas = pastas;
    this.etiquetas = etiquetas;
    this.contagem = { unidade: daUnidade.length, pessoal: pessoais.length };
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
    const perguntar = h("input", {
      type: "checkbox",
      onchange: (ev) => void gravarPreferencias(this.d.sync, { perguntarAoFavoritar: (ev.target as HTMLInputElement).checked }),
    });
    void lerPreferencias(this.d.sync).then((p) => {
      perguntar.checked = p.perguntarAoFavoritar;
    });
    detalhes.append(
      h("summary", { title: "Opções", "aria-label": "Opções dos favoritos" }, icone("ajustes", 18)),
      h(
        "div",
        { class: "fav-menu-lista", role: "menu" },
        item("Pastas e etiquetas", () => void this.abrirGerenciar()),
        item("Lixeira", () => {
          this.visao = "lixeira";
          this.redesenhar();
        }),
        item("Exportar arquivo (.json)", () => void this.exportar()),
        item("Importar arquivo", () => void this.importar()),
        item("Trazer favoritos da versão anterior", () => void this.oferecerMigracao(true)),
        h("label", { class: "fav-menu-opcao" }, perguntar, "Perguntar pasta e etiquetas ao favoritar"),
      ),
    );
    return detalhes;
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
      bruto = JSON.parse(texto.replace(/^﻿/, ""));
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
    if (!forcar && (await this.d.area.obter(chave))[chave]) return;
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
      { class: "fav-faixa", role: "note" },
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
  }
}
