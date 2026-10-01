import { h } from "@comum/ui/dom";
import { SEM_PASTA } from "../../modelo/constantes";
import type { Favorito, Pasta } from "../../modelo/tipos";
import { type AcoesItem, type ApoioItem, renderItem } from "./item";

/** Vizinhos (anterior, posterior) de onde o item foi solto, já sem ele mesmo na lista. */
export function vizinhosAoSoltar(ids: string[], movido: string, alvo: string, depois: boolean): [string | null, string | null] {
  const resto = ids.filter((id) => id !== movido);
  const i = resto.indexOf(alvo);
  if (i < 0) return [resto[resto.length - 1] ?? null, null];
  return depois ? [alvo, resto[i + 1] ?? null] : [resto[i - 1] ?? null, alvo];
}

/** Para "Mover para cima/baixo" (teclado e menu): null quando já está na ponta. */
export function vizinhosAoMover(ids: string[], id: string, direcao: -1 | 1): [string | null, string | null] | null {
  const i = ids.indexOf(id);
  if (i < 0) return null;
  if (direcao < 0) return i === 0 ? null : [ids[i - 2] ?? null, ids[i - 1] ?? null];
  return i === ids.length - 1 ? null : [ids[i + 1] ?? null, ids[i + 2] ?? null];
}

export interface OpcoesLista {
  itens: Favorito[];
  agrupar: boolean;
  pastas: Pasta[];
  apoio: (f: Favorito) => ApoioItem;
  acoes: AcoesItem;
  reordenar?: (id: string, anteriorId: string | null, posteriorId: string | null) => void;
  vazio: string;
}

export function renderLista(o: OpcoesLista): HTMLElement {
  if (!o.itens.length) return h("p", { class: "fav-vazio" }, o.vazio);
  if (!o.agrupar) return listaSimples(o.itens, o);
  const grupos = new Map<string, Favorito[]>();
  for (const f of o.itens) {
    const chave = f.pasta && o.pastas.some((p) => p.id === f.pasta) ? f.pasta : SEM_PASTA;
    grupos.set(chave, [...(grupos.get(chave) ?? []), f]);
  }
  const secoes = [...o.pastas.map((p) => [p.id, p.nome] as const), [SEM_PASTA, "Sem pasta"] as const]
    .filter(([id]) => grupos.has(id))
    .map(([id, nome]) => {
      const lista = grupos.get(id) ?? [];
      return h(
        "section",
        { class: "fav-grupo" },
        h("h3", {}, `${nome} (${lista.length})`),
        listaSimples(lista, { ...o, reordenar: undefined }),
      );
    });
  return h("div", {}, ...secoes);
}

function listaSimples(itens: Favorito[], o: OpcoesLista): HTMLElement {
  const ul = h("ul", { class: "fav-lista" }, ...itens.map((f) => renderItem(f, o.apoio(f), o.acoes)));
  if (o.reordenar)
    ativarArrasto(
      ul,
      itens.map((f) => f.id),
      o.reordenar,
    );
  return ul;
}

function ativarArrasto(ul: HTMLElement, ids: string[], reordenar: NonNullable<OpcoesLista["reordenar"]>): void {
  let movido: string | null = null;
  const item = (ev: Event) => (ev.target as Element | null)?.closest?.("li.fav-item") as HTMLElement | null;
  const depoisDe = (ev: DragEvent, li: HTMLElement) => {
    const r = li.getBoundingClientRect();
    return ev.clientY > r.top + r.height / 2;
  };
  const limparMarcas = () => {
    for (const el of ul.querySelectorAll(".alvo-antes, .alvo-depois")) el.classList.remove("alvo-antes", "alvo-depois");
  };
  ul.addEventListener("dragstart", (ev) => {
    const li = item(ev);
    movido = li?.dataset.id ?? null;
    li?.classList.add("arrastando");
    (ev as DragEvent).dataTransfer?.setData("text/plain", movido ?? "");
  });
  ul.addEventListener("dragover", (ev) => {
    const li = item(ev);
    if (!movido || !li) return;
    ev.preventDefault();
    limparMarcas();
    li.classList.add(depoisDe(ev as DragEvent, li) ? "alvo-depois" : "alvo-antes");
  });
  ul.addEventListener("drop", (ev) => {
    ev.preventDefault();
    const li = item(ev);
    const alvo = li?.dataset.id;
    limparMarcas();
    if (!movido || !li || !alvo || alvo === movido) return;
    const [antes, depois] = vizinhosAoSoltar(ids, movido, alvo, depoisDe(ev as DragEvent, li));
    reordenar(movido, antes, depois);
  });
  ul.addEventListener("dragend", () => {
    movido = null;
    limparMarcas();
    ul.querySelector(".arrastando")?.classList.remove("arrastando");
  });
}
