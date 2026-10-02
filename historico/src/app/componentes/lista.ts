import { h } from "@comum/ui/dom";
import { PAGINA_LISTA } from "../../modelo/constantes";
import { ROTULO_PERIODO } from "../../modelo/dias";
import { agrupar } from "../../modelo/operacoes";
import type { Visita } from "../../modelo/tipos";
import { type AcoesItem, renderItem } from "./item";

export interface OpcoesLista {
  agora: number;
  agrupar: boolean;
  visiveis: number;
  selecao: ReadonlySet<string>;
  /** null = Favoritos inativo. */
  favoritos: ReadonlySet<string> | null;
  acoes: AcoesItem;
  mostrarMais(): void;
}

export function renderLista(visitas: Visita[], o: OpcoesLista): HTMLElement {
  const mostradas = visitas.slice(0, o.visiveis);
  const item = (v: Visita) =>
    renderItem(v, { agora: o.agora, selecionado: o.selecao.has(v.id), favorito: o.favoritos ? o.favoritos.has(v.id) : null }, o.acoes);
  const lista = (l: Visita[]) => h("ul", { class: "spro-lista" }, ...l.map(item));

  const desenhados = new Set(mostradas.map((v) => v.id));
  // O cabeçalho conta o grupo inteiro; só se desenham as linhas dentro das `visiveis` primeiras.
  const corpo = o.agrupar
    ? agrupar(visitas, o.agora).flatMap((g) => {
        const linhas = g.itens.filter((v) => desenhados.has(v.id));
        return linhas.length
          ? [h("h3", { class: "spro-lista-grupo" }, `${ROTULO_PERIODO[g.grupo]} · ${g.itens.length}`), lista(linhas)]
          : [];
      })
    : [lista(mostradas)];

  const restantes = visitas.length - mostradas.length;
  return h(
    "div",
    { class: "spro-lista-tudo" },
    ...corpo,
    restantes > 0
      ? h(
          "button",
          { type: "button", class: "spro-botao spro-lista-mais", onclick: () => o.mostrarMais() },
          `Mostrar mais ${Math.min(restantes, PAGINA_LISTA)}`,
        )
      : null,
  );
}
