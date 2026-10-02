/**
 * O painel "Favoritos" abaixo da lista do Controle de Processos. É um iframe
 * da própria extensão (html/favoritos.html), e não HTML injetado: o app roda
 * na origem da extensão (chrome.storage direto, CSS isolado do SEI) e é o
 * MESMO app do painel lateral da F2. Container e id são os do legado
 * (#panelHomePro, #favoritesPro), para valer a ordem entre painéis que o
 * usuário já escolheu.
 */

import { h, icone } from "@comum/ui/dom";
import { instalarEstilo } from "./estilo";

export function ordemLegada(armazenamento: Pick<Storage, "getItem">): number | null {
  try {
    const op = JSON.parse(armazenamento.getItem("optionsPro") ?? "{}") as { orderPanelHome?: unknown };
    if (!Array.isArray(op.orderPanelHome)) return null;
    const item = op.orderPanelHome.find((i) => (i as { name?: unknown })?.name === "favoritesPro") as { index?: unknown } | undefined;
    const n = Number(item?.index);
    return item && Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/** Mesma regra de `orderDivPanel` (sei-pro.js): antes do primeiro painel de ordem maior. */
export function inserirNaOrdem(container: Element, painel: Element, ordem: number | null): void {
  if (ordem !== null) {
    for (const outro of [...container.children]) {
      if (!outro.classList.contains("panelHomePro")) continue;
      const n = Number.parseInt(outro.getAttribute("data-order") ?? "", 10);
      if (Number.isFinite(n) && n > ordem) {
        outro.before(painel);
        return;
      }
    }
  }
  container.append(painel);
}

export interface OpcoesPainel {
  urlApp: string;
  /**
   * Mesmo esquema de cor do app: com esquemas diferentes, o navegador pinta um
   * fundo opaco atrás do iframe, e o diálogo sobreposto não teria fundo transparente.
   */
  temaEscuro?: boolean;
  recolhido: boolean;
  ordem: number | null;
  aoRecolher(recolhido: boolean): void;
}

export function montarPainel(
  doc: Document,
  o: OpcoesPainel,
): { painel: HTMLElement; iframe: HTMLIFrameElement; corpo: HTMLElement } | null {
  const form = doc.querySelector("#frmProcedimentoControlar");
  // #tblMarcadores: caixa filtrada por marcador, onde o legado também não punha painéis.
  if (!form || doc.querySelector("#tblMarcadores") || doc.querySelector("#favoritesPro")) return null;
  instalarEstilo(doc);
  let container = doc.querySelector("#panelHomePro");
  if (!container) {
    container = h("div", { id: "panelHomePro", style: "display: inline-block; width: 100%;" });
    form.after(container);
  }
  const iframe = h("iframe", {
    src: o.urlApp,
    title: "Favoritos do SEI Pro",
    allow: "clipboard-write",
    style: `width: 100%; height: 120px; border: 0; display: block; color-scheme: ${o.temaEscuro ? "dark" : "light"};`,
  });
  const corpo = h("div", { class: "spro-fav-corpo", hidden: o.recolhido }, iframe);
  const recolher = h("button", { type: "button", class: "spro-fav-recolher" });
  const pintar = () => {
    const fechado = corpo.hidden;
    const rotulo = fechado ? "Mostrar favoritos" : "Recolher favoritos";
    recolher.setAttribute("aria-expanded", String(!fechado));
    recolher.setAttribute("aria-label", rotulo);
    recolher.title = rotulo;
    recolher.replaceChildren(icone(fechado ? "expandir" : "recolher", 16));
  };
  recolher.addEventListener("click", () => {
    corpo.hidden = !corpo.hidden;
    pintar();
    o.aoRecolher(corpo.hidden);
  });
  pintar();
  const estrela = icone("estrelaCheia", 16);
  estrela.setAttribute("style", "color:#e0a100");
  const titulo = h("div", { class: "infraBarraLocalizacao titlePanelHome spro-fav-titulo" }, estrela, h("span", {}, "Favoritos"), recolher);
  const painel = h(
    "div",
    {
      class: "panelHomePro",
      id: "favoritesPro",
      "data-order": o.ordem === null ? "" : String(o.ordem),
      style: "display: inline-block; width: 100%;",
    },
    titulo,
    corpo,
  );
  inserirNaOrdem(container, painel, o.ordem);
  return { painel, iframe, corpo };
}
