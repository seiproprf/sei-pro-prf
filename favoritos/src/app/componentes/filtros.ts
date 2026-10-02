/**
 * Barra de filtros e barra de seleção. Os filtros são seletores inteligentes
 * (sei-comum/ui/combobox): múltipla escolha, busca sem acento, contagem por
 * opção. Ficam montados de uma vez e só são atualizados: redesenhar a lista a
 * cada marcação não pode fechar o seletor que o usuário está usando.
 */

import { type Combo, criarCombo, type OpcaoCombo } from "@comum/ui/combobox";
import { h, icone, type NomeIcone } from "@comum/ui/dom";
import { SEM_PASTA } from "../../modelo/constantes";
import type { Etiqueta, Filtro, ModoOrdem, Pasta, SituacaoFiltro } from "../../modelo/tipos";

type ChavePrazo = NonNullable<Filtro["prazos"]>[number];

/** `sempre`: aparece mesmo sem nenhum item (as raras só aparecem quando existem). */
export const PRAZOS: ReadonlyArray<{ valor: ChavePrazo; rotulo: string; icone: NomeIcone; sempre?: true }> = [
  { valor: "atrasado", rotulo: "Atrasados", icone: "alerta", sempre: true },
  { valor: "hoje", rotulo: "Vencem hoje", icone: "relogio", sempre: true },
  { valor: "noPrazo", rotulo: "No prazo", icone: "check", sempre: true },
  { valor: "aguardando", rotulo: "Aguardando o documento", icone: "documento" },
  { valor: "semVencimento", rotulo: "Só contando os dias", icone: "calendario" },
  { valor: "semPrazo", rotulo: "Sem prazo", icone: "fechar", sempre: true },
];

export const SITUACOES: ReadonlyArray<{ valor: SituacaoFiltro; rotulo: string; icone: NomeIcone; sempre?: true }> = [
  { valor: "novidade", rotulo: "Com novidade", icone: "brilho", sempre: true },
  { valor: "lembrete", rotulo: "Lembrete para hoje", icone: "sino", sempre: true },
  { valor: "nota", rotulo: "Com nota", icone: "nota", sempre: true },
  { valor: "documentos", rotulo: "Com documentos favoritos", icone: "documento" },
  { valor: "local", rotulo: "Com local no mapa", icone: "local" },
  { valor: "fora", rotulo: "Fora da unidade", icone: "saida", sempre: true },
  { valor: "sigiloso", rotulo: "Sigilosos", icone: "cadeado" },
];

export const ORDENS: ReadonlyArray<{ valor: ModoOrdem; rotulo: string; icone: NomeIcone; descricao: string }> = [
  { valor: "manual", rotulo: "Minha ordem", icone: "alca", descricao: "Arraste os itens para ordenar" },
  { valor: "prazo", rotulo: "Por prazo", icone: "relogio", descricao: "Os que vencem antes primeiro" },
  { valor: "novidade", rotulo: "Novidades primeiro", icone: "brilho", descricao: "O que mudou desde a última vez" },
  { valor: "inclusao", rotulo: "Mais recentes", icone: "calendario", descricao: "Os favoritados por último primeiro" },
  { valor: "protocolo", rotulo: "Por número", icone: "ordenar", descricao: "Pelo número do processo" },
];

export interface ContagensFiltros {
  pastas: ReadonlyMap<string, number>;
  etiquetas: ReadonlyMap<string, number>;
  prazos: ReadonlyMap<string, number>;
  situacoes: ReadonlyMap<string, number>;
}

export interface EstadoFiltros {
  filtro: Filtro;
  ordem: ModoOrdem;
  agrupar: boolean;
  pastas: Pasta[];
  etiquetas: Etiqueta[];
  contagens: ContagensFiltros;
}

export interface AcoesFiltros {
  filtrar(f: Filtro): void;
  ordenar(m: ModoOrdem): void;
  agrupar(v: boolean): void;
}

export interface BarraFiltros {
  /** Os seletores (pasta, etiqueta, prazo, situação, ordem, agrupar). */
  el: HTMLElement;
  /** Os filtros ligados, como fichas que se tiram com um clique. */
  ativos: HTMLElement;
  atualizar(e: EstadoFiltros): void;
}

export function criarFiltros(inicial: EstadoFiltros, a: AcoesFiltros): BarraFiltros {
  let e = inicial;
  const mudar = (parcial: Partial<Filtro>) => a.filtrar({ ...e.filtro, ...parcial });
  // As raras só aparecem quando existem; a escolhida aparece sempre (senão não daria para desmarcar).
  const relevantes = <T extends { valor: string; sempre?: true }>(
    lista: readonly T[],
    conta: ReadonlyMap<string, number>,
    marcados: string[] = [],
  ) => lista.filter((o) => o.sempre || (conta.get(o.valor) ?? 0) > 0 || marcados.includes(o.valor));

  const pasta = criarCombo({
    rotulo: "Pasta",
    vazio: "Pasta",
    icone: "pasta",
    multiplo: true,
    opcoes: (): OpcaoCombo[] => [
      ...e.pastas.map((p) => ({ valor: p.id, rotulo: p.nome, contagem: e.contagens.pastas.get(p.id) ?? 0, cor: p.cor })),
      { valor: SEM_PASTA, rotulo: "Sem pasta", contagem: e.contagens.pastas.get(SEM_PASTA) ?? 0 },
    ],
    valor: e.filtro.pastas,
    aoMudar: (v) => mudar({ pastas: v.length ? v : undefined }),
    larguraLista: 240,
  });
  const etiqueta = criarCombo({
    rotulo: "Etiqueta",
    vazio: "Etiqueta",
    icone: "etiqueta",
    multiplo: true,
    opcoes: () => e.etiquetas.map((x) => ({ valor: x.id, rotulo: x.nome, cor: x.cor, contagem: e.contagens.etiquetas.get(x.id) ?? 0 })),
    valor: e.filtro.etiquetas,
    aoMudar: (v) => mudar({ etiquetas: v.length ? v : undefined }),
    larguraLista: 240,
  });
  const prazo = criarCombo({
    rotulo: "Prazo",
    vazio: "Prazo",
    icone: "relogio",
    multiplo: true,
    busca: false,
    opcoes: () =>
      relevantes(PRAZOS, e.contagens.prazos, e.filtro.prazos).map((o) => ({
        valor: o.valor,
        rotulo: o.rotulo,
        icone: o.icone,
        contagem: e.contagens.prazos.get(o.valor) ?? 0,
      })),
    valor: e.filtro.prazos,
    aoMudar: (v) => mudar({ prazos: v.length ? (v as ChavePrazo[]) : undefined }),
    larguraLista: 240,
  });
  const situacao = criarCombo({
    rotulo: "Situação",
    vazio: "Situação",
    icone: "filtro",
    multiplo: true,
    busca: false,
    opcoes: () =>
      relevantes(SITUACOES, e.contagens.situacoes, e.filtro.situacoes).map((o) => ({
        valor: o.valor,
        rotulo: o.rotulo,
        icone: o.icone,
        contagem: e.contagens.situacoes.get(o.valor) ?? 0,
      })),
    valor: e.filtro.situacoes,
    aoMudar: (v) => mudar({ situacoes: v.length ? (v as SituacaoFiltro[]) : undefined }),
    larguraLista: 250,
  });
  const ordem = criarCombo({
    rotulo: "Ordem",
    icone: "ordenar",
    busca: false,
    opcoes: ORDENS.map((o) => ({ valor: o.valor, rotulo: o.rotulo, icone: o.icone, descricao: o.descricao })),
    valor: [e.ordem],
    aoMudar: (v) => v[0] && a.ordenar(v[0] as ModoOrdem),
    classe: "fav-ordem",
    larguraLista: 260,
  });
  const agrupar = h(
    "button",
    {
      type: "button",
      class: "spro-botao fantasma fav-agrupar",
      title: "Agrupar por pasta",
      "aria-label": "Agrupar por pasta",
      "aria-pressed": String(e.agrupar),
      onclick: () => a.agrupar(!e.agrupar),
    },
    icone("camadas", 15),
    h("span", { class: "fav-agrupar-texto" }, "Agrupar"),
  );
  const ativos = h("div", { class: "fav-ativos", "aria-label": "Filtros ligados" });

  const ficha = (rotulo: string, cor: string | undefined, tirar: () => void) =>
    h(
      "button",
      { type: "button", class: "fav-ficha", title: `Tirar o filtro ${rotulo}`, "aria-label": `Tirar o filtro ${rotulo}`, onclick: tirar },
      cor ? h("span", { class: "spro-combo-cor", style: `background:${cor}` }) : null,
      h("span", {}, rotulo),
      icone("fechar", 12),
    );

  const desenharAtivos = () => {
    const f = e.filtro;
    const sem = <T>(l: T[] | undefined, x: T) => {
      const r = (l ?? []).filter((y) => y !== x);
      return r.length ? r : undefined;
    };
    const fichas: HTMLElement[] = [
      ...(f.pastas ?? []).map((id) => {
        const p = e.pastas.find((x) => x.id === id);
        return ficha(id === SEM_PASTA ? "Sem pasta" : (p?.nome ?? "Pasta"), p?.cor, () => mudar({ pastas: sem(f.pastas, id) }));
      }),
      ...(f.etiquetas ?? []).map((id) => {
        const x = e.etiquetas.find((y) => y.id === id);
        return ficha(x?.nome ?? "Etiqueta", x?.cor, () => mudar({ etiquetas: sem(f.etiquetas, id) }));
      }),
      ...(f.prazos ?? []).map((v) =>
        ficha(PRAZOS.find((o) => o.valor === v)?.rotulo ?? v, undefined, () => mudar({ prazos: sem(f.prazos, v) })),
      ),
      ...(f.situacoes ?? []).map((v) =>
        ficha(SITUACOES.find((o) => o.valor === v)?.rotulo ?? v, undefined, () => mudar({ situacoes: sem(f.situacoes, v) })),
      ),
    ];
    ativos.hidden = !fichas.length;
    if (fichas.length > 1)
      fichas.push(
        h("button", { type: "button", class: "fav-limpar-filtros", onclick: () => a.filtrar({ busca: e.filtro.busca }) }, "Limpar filtros"),
      );
    ativos.replaceChildren(...fichas);
  };

  const atualizar = (novo: EstadoFiltros) => {
    e = novo;
    pasta.definir(e.filtro.pastas ?? []);
    etiqueta.definir(e.filtro.etiquetas ?? []);
    prazo.definir(e.filtro.prazos ?? []);
    situacao.definir(e.filtro.situacoes ?? []);
    ordem.definir([e.ordem]);
    for (const c of [pasta, etiqueta, prazo, situacao] as Combo[]) c.atualizar();
    etiqueta.el.hidden = !e.etiquetas.length && !e.filtro.etiquetas?.length;
    agrupar.setAttribute("aria-pressed", String(e.agrupar));
    desenharAtivos();
  };
  atualizar(e);

  return {
    el: h(
      "div",
      { class: "fav-filtros" },
      h("div", { class: "fav-filtros-campos" }, pasta.el, etiqueta.el, prazo.el, situacao.el),
      h("div", { class: "fav-filtros-vista" }, ordem.el, agrupar),
    ),
    ativos,
    atualizar,
  };
}

export interface AcoesLote {
  moverPasta(id: string | undefined): void;
  etiquetar(id: string): void;
  copiar(): void;
  csv(): void;
  remover(): void;
  limpar(): void;
  marcarVistos(): void;
  outraLista: { rotulo: string; mover(): void } | null;
}

const botaoLote = (nome: NomeIcone, rotulo: string, fazer: () => void, classe = "") =>
  h(
    "button",
    { type: "button", class: `spro-botao pequeno ${classe}`.trim(), "aria-label": rotulo, title: rotulo, onclick: fazer },
    icone(nome, 14),
    h("span", { class: "fav-lote-texto" }, rotulo),
  );

/** Seletor que dispara a ação ao escolher e volta ao rótulo ("Mover para pasta…"). */
function comboDeAcao(rotulo: string, nome: NomeIcone, opcoes: OpcaoCombo[], fazer: (v: string) => void): HTMLElement {
  const c: Combo = criarCombo({
    rotulo,
    vazio: rotulo,
    icone: nome,
    opcoes,
    classe: "fav-lote-combo",
    larguraLista: 240,
    aoMudar: (v) => {
      c.definir([]);
      if (v[0]) fazer(v[0]);
    },
  });
  return c.el;
}

export function renderLote(qtd: number, pastas: Pasta[], etiquetas: Etiqueta[], a: AcoesLote): HTMLElement {
  return h(
    "div",
    { class: "fav-lote", role: "toolbar", "aria-label": "Ações nos selecionados" },
    h(
      "div",
      { class: "fav-lote-qtd" },
      h(
        "button",
        {
          type: "button",
          class: "spro-botao-icone pequeno",
          "aria-label": "Limpar seleção",
          title: "Limpar seleção",
          onclick: () => a.limpar(),
        },
        icone("fechar", 14),
      ),
      h("strong", {}, `${qtd} selecionado${qtd === 1 ? "" : "s"}`),
    ),
    h(
      "div",
      { class: "fav-lote-acoes" },
      comboDeAcao(
        "Mover para pasta",
        "pasta",
        [{ valor: SEM_PASTA, rotulo: "(sem pasta)" }, ...pastas.map((p) => ({ valor: p.id, rotulo: p.nome, cor: p.cor }))],
        (v) => a.moverPasta(v === SEM_PASTA ? undefined : v),
      ),
      etiquetas.length
        ? comboDeAcao(
            "Etiquetar",
            "etiqueta",
            etiquetas.map((e) => ({ valor: e.id, rotulo: e.nome, cor: e.cor })),
            (v) => a.etiquetar(v),
          )
        : null,
      a.outraLista ? botaoLote("mover", `Mover para ${a.outraLista.rotulo}`, () => a.outraLista?.mover()) : null,
      botaoLote("olho", "Marcar como vistos", () => a.marcarVistos()),
      botaoLote("copiar", "Copiar números", () => a.copiar()),
      botaoLote("planilha", "Baixar CSV", () => a.csv()),
      botaoLote("lixeira", "Remover selecionados", () => a.remover(), "perigo"),
    ),
  );
}
