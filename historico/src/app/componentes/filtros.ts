/**
 * Barra de filtros do histórico. Os seletores são montados uma vez e só
 * atualizados: redesenhar a cada marcação fecharia o seletor em uso.
 */

import { type Combo, criarCombo, type OpcaoCombo } from "@comum/ui/combobox";
import { h, icone, type NomeIcone } from "@comum/ui/dom";
import { ROTULO_PERIODO } from "../../modelo/dias";
import type { Contagens } from "../../modelo/operacoes";
import { type Filtro, type Ordem, PERIODOS, type Periodo, type Situacao } from "../../modelo/tipos";

const ORDENS: ReadonlyArray<{ valor: Ordem; rotulo: string; icone: NomeIcone; descricao: string }> = [
  { valor: "recentes", rotulo: "Mais recentes", icone: "relogio", descricao: "Pela última visita" },
  { valor: "visitados", rotulo: "Mais visitados", icone: "historico", descricao: "Quantas vezes você abriu" },
  { valor: "protocolo", rotulo: "Por número", icone: "ordenar", descricao: "Pelo número do processo" },
];

/** `sempre`: aparece mesmo sem nenhum item; `favoritos`: só com Favoritos ativo. */
const SITUACAO_OPCOES: ReadonlyArray<{ valor: Situacao; rotulo: string; icone: NomeIcone; sempre?: true; favoritos?: true }> = [
  { valor: "favoritos", rotulo: "Nos favoritos", icone: "estrelaCheia", sempre: true, favoritos: true },
  { valor: "foraFavoritos", rotulo: "Fora dos favoritos", icone: "estrela", sempre: true, favoritos: true },
  { valor: "repetidos", rotulo: "Visitados mais de uma vez", icone: "camadas" },
  { valor: "publico", rotulo: "Públicos", icone: "olho", sempre: true },
  { valor: "restrito", rotulo: "Restritos", icone: "cadeado" },
  { valor: "sigiloso", rotulo: "Sigilosos", icone: "cadeado" },
];

export interface EstadoFiltros {
  filtro: Filtro;
  ordem: Ordem;
  agrupar: boolean;
  contagens: Contagens;
  favoritosAtivo: boolean;
}

export interface AcoesFiltros {
  filtrar(f: Filtro): void;
  ordenar(o: Ordem): void;
  agrupar(v: boolean): void;
}

export interface BarraFiltros {
  el: HTMLElement;
  /** Os filtros ligados, como fichas que se tiram com um clique. */
  ativos: HTMLElement;
  atualizar(e: EstadoFiltros): void;
}

type ChaveLista = "tipos" | "unidades" | "interessados" | "assuntos";

export function criarFiltros(inicial: EstadoFiltros, a: AcoesFiltros): BarraFiltros {
  let e = inicial;
  const mudar = (parcial: Partial<Filtro>) => a.filtrar({ ...e.filtro, ...parcial });

  // Mais frequentes primeiro; as marcadas aparecem mesmo com contagem 0.
  const porContagem = (conta: ReadonlyMap<string, number>, marcados: string[] = []): OpcaoCombo[] => {
    const chaves = new Set([...conta.keys(), ...marcados]);
    return [...chaves]
      .map((k) => ({ valor: k, rotulo: k, contagem: conta.get(k) ?? 0 }))
      .sort((x, y) => y.contagem - x.contagem || x.rotulo.localeCompare(y.rotulo, "pt-BR"));
  };
  const comboLista = (rotulo: string, nome: NomeIcone, chave: ChaveLista): Combo =>
    criarCombo({
      rotulo,
      vazio: rotulo,
      icone: nome,
      multiplo: true,
      opcoes: () => porContagem(e.contagens[chave], e.filtro[chave]),
      valor: e.filtro[chave],
      aoMudar: (v) => mudar({ [chave]: v.length ? v : undefined }),
      larguraLista: 260,
    });

  const periodo = criarCombo({
    rotulo: "Período",
    vazio: "Período",
    icone: "calendario",
    multiplo: true,
    busca: false,
    opcoes: () => PERIODOS.map((p) => ({ valor: p, rotulo: ROTULO_PERIODO[p], contagem: e.contagens.periodos.get(p) ?? 0 })),
    valor: e.filtro.periodos,
    aoMudar: (v) => mudar({ periodos: v.length ? (v as Periodo[]) : undefined }),
    larguraLista: 230,
  });
  const tipo = comboLista("Tipo", "documento", "tipos");
  const unidade = comboLista("Unidade", "predio", "unidades");
  const interessado = comboLista("Interessado", "pessoa", "interessados");
  const assunto = comboLista("Assunto", "etiqueta", "assuntos");
  const situacao = criarCombo({
    rotulo: "Situação",
    vazio: "Situação",
    icone: "filtro",
    multiplo: true,
    busca: false,
    opcoes: () =>
      SITUACAO_OPCOES.filter(
        (o) =>
          (!o.favoritos || e.favoritosAtivo) &&
          (o.sempre || (e.contagens.situacoes.get(o.valor) ?? 0) > 0 || e.filtro.situacoes?.includes(o.valor)),
      ).map((o) => ({ valor: o.valor, rotulo: o.rotulo, icone: o.icone, contagem: e.contagens.situacoes.get(o.valor) ?? 0 })),
    valor: e.filtro.situacoes,
    aoMudar: (v) => mudar({ situacoes: v.length ? (v as Situacao[]) : undefined }),
    larguraLista: 250,
  });
  const ordem = criarCombo({
    rotulo: "Ordem",
    icone: "ordenar",
    busca: false,
    opcoes: ORDENS.map((o) => ({ valor: o.valor, rotulo: o.rotulo, icone: o.icone, descricao: o.descricao })),
    valor: [e.ordem],
    aoMudar: (v) => v[0] && a.ordenar(v[0] as Ordem),
    larguraLista: 260,
  });
  const agrupar = h(
    "button",
    {
      type: "button",
      class: "spro-botao fantasma spro-lista-agrupar",
      title: "Agrupar por dia",
      "aria-label": "Agrupar por dia",
      "aria-pressed": String(e.agrupar),
      onclick: () => a.agrupar(!e.agrupar),
    },
    icone("camadas", 15),
    h("span", {}, "Agrupar"),
  );
  const ativos = h("div", { class: "spro-lista-ativos", "aria-label": "Filtros ligados" });

  const ficha = (rotulo: string, tirar: () => void) =>
    h(
      "button",
      {
        type: "button",
        class: "spro-lista-ficha",
        title: `Tirar o filtro ${rotulo}`,
        "aria-label": `Tirar o filtro ${rotulo}`,
        onclick: tirar,
      },
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
      ...(f.periodos ?? []).map((p) => ficha(ROTULO_PERIODO[p], () => mudar({ periodos: sem(f.periodos, p) }))),
      ...(["tipos", "unidades", "interessados", "assuntos"] as const).flatMap((c) =>
        (f[c] ?? []).map((x) => ficha(x, () => mudar({ [c]: sem(f[c], x) }))),
      ),
      ...(f.situacoes ?? []).map((s) =>
        ficha(SITUACAO_OPCOES.find((o) => o.valor === s)?.rotulo ?? s, () => mudar({ situacoes: sem(f.situacoes, s) })),
      ),
    ];
    ativos.hidden = !fichas.length;
    if (fichas.length > 1)
      fichas.push(
        h("button", { type: "button", class: "spro-lista-limpar", onclick: () => a.filtrar({ busca: e.filtro.busca }) }, "Limpar filtros"),
      );
    ativos.replaceChildren(...fichas);
  };

  const todos: Array<[Combo, () => string[]]> = [
    [periodo, () => e.filtro.periodos ?? []],
    [tipo, () => e.filtro.tipos ?? []],
    [unidade, () => e.filtro.unidades ?? []],
    [interessado, () => e.filtro.interessados ?? []],
    [assunto, () => e.filtro.assuntos ?? []],
    [situacao, () => e.filtro.situacoes ?? []],
  ];
  const atualizar = (novo: EstadoFiltros) => {
    e = novo;
    for (const [c, valor] of todos) {
      c.definir(valor());
      c.atualizar();
    }
    ordem.definir([e.ordem]);
    agrupar.setAttribute("aria-pressed", String(e.agrupar));
    agrupar.hidden = e.ordem !== "recentes";
    desenharAtivos();
  };
  atualizar(e);

  return {
    el: h(
      "div",
      { class: "spro-lista-filtros" },
      h("div", { class: "spro-lista-filtros-campos" }, periodo.el, tipo.el, unidade.el, interessado.el, assunto.el, situacao.el),
      h("div", { class: "spro-lista-filtros-vista" }, ordem.el, agrupar),
    ),
    ativos,
    atualizar,
  };
}
