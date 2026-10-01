import { h, icone, type NomeIcone } from "@comum/ui/dom";
import { SEM_PASTA } from "../../modelo/constantes";
import type { Etiqueta, Filtro, ModoOrdem, Pasta } from "../../modelo/tipos";

type Opcao = readonly [valor: string, texto: string];

function seletor(rotulo: string, valor: string, opcoes: Opcao[], mudar: (v: string) => void): HTMLSelectElement {
  const s: HTMLSelectElement = h(
    "select",
    { class: "spro-campo", "aria-label": rotulo, onchange: () => mudar(s.value ?? "") },
    ...opcoes.map(([v, t]) => h("option", { value: v, selected: v === valor }, t)),
  );
  return s;
}

export interface AcoesFiltros {
  filtrar(f: Filtro): void;
  ordenar(m: ModoOrdem): void;
  agrupar(v: boolean): void;
  selecionarTodos(): void;
}

export function renderFiltros(
  e: { filtro: Filtro; ordem: ModoOrdem; agrupar: boolean; pastas: Pasta[]; etiquetas: Etiqueta[] },
  a: AcoesFiltros,
): HTMLElement {
  return h(
    "div",
    { class: "fav-filtros" },
    seletor(
      "Pasta",
      e.filtro.pasta ?? "",
      [["", "Todas as pastas"], [SEM_PASTA, "Sem pasta"], ...e.pastas.map((p) => [p.id, p.nome] as const)],
      (v) => a.filtrar({ ...e.filtro, pasta: v || undefined }),
    ),
    seletor("Etiqueta", e.filtro.etiqueta ?? "", [["", "Todas as etiquetas"], ...e.etiquetas.map((x) => [x.id, x.nome] as const)], (v) =>
      a.filtrar({ ...e.filtro, etiqueta: v || undefined }),
    ),
    seletor(
      "Prazo",
      e.filtro.prazo ?? "",
      [
        ["", "Qualquer prazo"],
        ["atrasado", "Atrasados"],
        ["hoje", "Vencem hoje"],
        ["noPrazo", "No prazo"],
        ["semPrazo", "Sem prazo"],
      ],
      (v) => a.filtrar({ ...e.filtro, prazo: (v || undefined) as Filtro["prazo"] }),
    ),
    seletor(
      "Ordem",
      e.ordem,
      [
        ["manual", "Minha ordem"],
        ["prazo", "Por prazo"],
        ["protocolo", "Por número"],
        ["inclusao", "Mais recentes"],
      ],
      (v) => a.ordenar(v as ModoOrdem),
    ),
    h(
      "label",
      { class: "fav-agrupar" },
      h("input", { type: "checkbox", checked: e.agrupar, onchange: (ev) => a.agrupar((ev.target as HTMLInputElement).checked) }),
      "Agrupar por pasta",
    ),
    h("button", { type: "button", class: "spro-botao", onclick: () => a.selecionarTodos() }, "Selecionar todos"),
  );
}

export interface AcoesLote {
  moverPasta(id: string | undefined): void;
  etiquetar(id: string): void;
  copiar(): void;
  csv(): void;
  remover(): void;
  limpar(): void;
  outraLista: { rotulo: string; mover(): void } | null;
}

const botaoIcone = (nome: NomeIcone, rotulo: string, fazer: () => void, classe = "") =>
  h(
    "button",
    { type: "button", class: `spro-botao ${classe}`.trim(), "aria-label": rotulo, title: rotulo, onclick: fazer },
    icone(nome, 15),
    rotulo,
  );

export function renderLote(qtd: number, pastas: Pasta[], etiquetas: Etiqueta[], a: AcoesLote): HTMLElement {
  // Select de ação: escolher dispara e o campo volta ao rótulo.
  const acao = (rotulo: string, opcoes: Opcao[], fazer: (v: string) => void) =>
    seletor(rotulo, "", [["", `${rotulo}…`], ...opcoes], (v) => v && fazer(v));
  return h(
    "div",
    { class: "fav-lote", role: "toolbar", "aria-label": "Ações nos selecionados" },
    h("strong", {}, `${qtd} selecionado${qtd === 1 ? "" : "s"}`),
    acao("Mover para pasta", [[SEM_PASTA, "(sem pasta)"], ...pastas.map((p) => [p.id, p.nome] as const)], (v) =>
      a.moverPasta(v === SEM_PASTA ? undefined : v),
    ),
    acao(
      "Etiquetar",
      etiquetas.map((e) => [e.id, e.nome] as const),
      (v) => a.etiquetar(v),
    ),
    a.outraLista
      ? h("button", { type: "button", class: "spro-botao", onclick: () => a.outraLista?.mover() }, `Mover para ${a.outraLista.rotulo}`)
      : null,
    botaoIcone("copiar", "Copiar números", () => a.copiar()),
    botaoIcone("baixar", "Baixar CSV", () => a.csv()),
    botaoIcone("lixeira", "Remover selecionados", () => a.remover(), "perigo"),
    h("button", { type: "button", class: "spro-botao", onclick: () => a.limpar() }, "Limpar seleção"),
  );
}
