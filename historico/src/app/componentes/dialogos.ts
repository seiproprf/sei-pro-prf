/**
 * Conteúdo dos diálogos do histórico (apagar por período e limite). Só montam
 * o corpo; quem abre e fecha o `<dialog>` é o `abrirModal` do app.
 *
 * Rádios nativos num `fieldset`, como as opções de exibição do Favoritos. O
 * valor escolhido vem do evento `change`, e não da leitura de `checked` no fim.
 */

import { h } from "@comum/ui/dom";
import { LIMITES, type Limite, type PeriodoApagar } from "../../modelo/tipos";
import { numero, processos } from "../formato";

const PERIODOS_APAGAR: ReadonlyArray<[PeriodoApagar, string]> = [
  ["hora", "Da última hora"],
  ["hoje", "De hoje"],
  ["7dias", "Dos últimos 7 dias"],
  ["30dias", "Dos últimos 30 dias"],
  ["tudo", "Tudo"],
];

let grupos = 0;

function grupoDeOpcoes<T extends string | number>(legenda: string, opcoes: ReadonlyArray<[T, string]>, inicial: T, mudar?: (v: T) => void) {
  const nome = `spro-historico-opcao-${++grupos}`;
  let atual = inicial;
  const rotulos = opcoes.map(([v, texto]) => {
    const r = h("input", { type: "radio", name: nome, value: String(v), checked: v === inicial });
    r.addEventListener("change", () => {
      if (!r.checked) return;
      atual = v;
      mudar?.(v);
    });
    return h("label", { class: "spro-lista-opcao" }, r, h("span", {}, texto));
  });
  return { el: h("fieldset", { class: "spro-lista-opcoes" }, h("legend", {}, legenda), ...rotulos), valor: () => atual };
}

const rodape = (aoCancelar: () => void, ok: HTMLButtonElement) =>
  h(
    "div",
    { class: "spro-dialogo-rodape" },
    h("button", { type: "button", class: "spro-botao", onclick: () => aoCancelar() }, "Cancelar"),
    ok,
  );

export function montarApagar(o: { aoApagar(p: PeriodoApagar): void; aoCancelar(): void }): HTMLElement {
  // Começa no menor estrago, como o "Limpar dados de navegação" do navegador.
  const grupo = grupoDeOpcoes("Apagar os processos visitados", PERIODOS_APAGAR, "hora");
  return h(
    "div",
    { class: "spro-lista-form" },
    grupo.el,
    h(
      "p",
      { class: "spro-lista-dica" },
      "Sai o processo inteiro se a última visita dele caiu no período (um processo visto há 20 dias e de novo hoje sai em “De hoje”).",
    ),
    rodape(o.aoCancelar, h("button", { type: "button", class: "spro-botao perigo", onclick: () => o.aoApagar(grupo.valor()) }, "Apagar")),
  );
}

export function montarLimite(o: { atual: Limite; total: number; aoSalvar(l: Limite): void; aoCancelar(): void }): HTMLElement {
  const aviso = h("p", { class: "spro-lista-aviso", role: "status" });
  const pintar = (l: Limite) => {
    const saem = Math.max(0, o.total - l);
    aviso.hidden = saem === 0;
    aviso.textContent = !saem ? "" : saem === 1 ? "1 processo mais antigo vai sair." : `${numero(saem)} processos mais antigos vão sair.`;
  };
  const grupo = grupoDeOpcoes(
    "Guardar até",
    LIMITES.map((l): [Limite, string] => [l, `${numero(l)} processos`]),
    o.atual,
    pintar,
  );
  pintar(o.atual);
  return h(
    "div",
    { class: "spro-lista-form" },
    h("p", {}, `Hoje há ${processos(o.total)} no histórico.`),
    grupo.el,
    aviso,
    rodape(o.aoCancelar, h("button", { type: "button", class: "spro-botao primario", onclick: () => o.aoSalvar(grupo.valor()) }, "Salvar")),
  );
}
