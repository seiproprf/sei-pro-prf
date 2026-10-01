import { h, icone } from "@comum/ui/dom";
import { corDoTexto } from "../../modelo/cores";
import type { Etiqueta, Favorito, Pasta, ResumoPrazo } from "../../modelo/tipos";

export interface ApoioItem {
  pastas: ReadonlyMap<string, Pasta>;
  etiquetas: ReadonlyMap<string, Etiqueta>;
  resumo?: ResumoPrazo;
  selecionado: boolean;
  arrastavel: boolean;
  /** Rótulo da outra lista ("Pessoal" ou a sigla), ou null quando só existe uma. */
  outraLista: string | null;
}

export interface AcoesItem {
  abrir(f: Favorito, novaAba: boolean): void;
  editar(f: Favorito): void;
  alternarSelecao(f: Favorito, marcado: boolean): void;
  remover(f: Favorito): void;
  moverLista(f: Favorito): void;
  moverOrdem(f: Favorito, direcao: -1 | 1): void;
  /** Ausente quando o mapa não está disponível (testes, pacote sem Leaflet). */
  mapa?(f: Favorito): void;
}

const itemMenu = (rotulo: string, fazer: () => void, classe?: string) =>
  h(
    "button",
    {
      type: "button",
      role: "menuitem",
      class: classe,
      onclick: (ev) => {
        (ev.currentTarget as HTMLElement | null)?.closest("details")?.removeAttribute("open");
        fazer();
      },
    },
    rotulo,
  );

export function renderItem(f: Favorito, a: ApoioItem, acoes: AcoesItem): HTMLLIElement {
  const titulo = f.titulo || [f.tipo, f.especificacao].filter(Boolean).join(" · ") || "(sem descrição)";
  const pasta = f.pasta ? a.pastas.get(f.pasta) : undefined;
  const etiquetas = f.etiquetas.map((id) => a.etiquetas.get(id)).filter((e): e is Etiqueta => !!e && e.removidoEm === undefined);
  return h(
    "li",
    { class: "fav-item", "data-id": f.id, draggable: a.arrastavel ? "true" : undefined },
    h("input", {
      type: "checkbox",
      class: "fav-sel",
      "aria-label": `Selecionar ${f.protocolo}`,
      checked: a.selecionado,
      onchange: (ev) => acoes.alternarSelecao(f, (ev.target as HTMLInputElement).checked),
    }),
    a.arrastavel ? h("span", { class: "fav-alca", title: "Arraste para reordenar", "aria-hidden": "true" }, icone("alca", 14)) : h("span"),
    h(
      "div",
      { class: "fav-principal" },
      h(
        "a",
        {
          class: "fav-protocolo",
          href: "#",
          title: "Abrir o processo (Ctrl+clique abre em outra aba)",
          onclick: (ev) => {
            ev.preventDefault();
            const m = ev as MouseEvent;
            acoes.abrir(f, !!(m.ctrlKey || m.metaKey));
          },
        },
        f.protocolo,
      ),
      f.sigiloso ? h("span", { class: "fav-selo", title: "Processo sigiloso" }, "sigiloso") : null,
      h("button", { type: "button", class: "fav-titulo", title: "Editar favorito", onclick: () => acoes.editar(f) }, titulo),
    ),
    h(
      "div",
      { class: "fav-meta" },
      pasta ? h("span", { class: "fav-pasta" }, icone("pasta", 13), pasta.nome) : null,
      ...etiquetas.map((e) => h("span", { class: "fav-etiqueta", style: `--cor:${e.cor};--cor-texto:${corDoTexto(e.cor)}` }, e.nome)),
      a.resumo
        ? h("span", { class: `fav-prazo fav-prazo-${a.resumo.situacao}`, title: a.resumo.dica }, icone("relogio", 13), a.resumo.texto)
        : null,
      f.nota ? h("span", { class: "fav-nota", title: f.nota, "aria-label": `Nota: ${f.nota}` }, icone("nota", 14)) : null,
      f.local && acoes.mapa
        ? h(
            "button",
            {
              type: "button",
              class: "fav-local",
              title: "Ver o local no mapa",
              "aria-label": "Ver o local no mapa",
              onclick: () => acoes.mapa?.(f),
            },
            icone("local", 14),
          )
        : null,
    ),
    h(
      "details",
      { class: "fav-menu" },
      h("summary", { title: "Mais ações", "aria-label": `Mais ações para ${f.protocolo}` }, icone("menu", 16)),
      h(
        "div",
        { class: "fav-menu-lista", role: "menu" },
        itemMenu("Editar", () => acoes.editar(f)),
        a.outraLista ? itemMenu(`Mover para ${a.outraLista}`, () => acoes.moverLista(f)) : null,
        itemMenu("Mover para cima", () => acoes.moverOrdem(f, -1)),
        itemMenu("Mover para baixo", () => acoes.moverOrdem(f, 1)),
        acoes.mapa ? itemMenu("Local no mapa…", () => acoes.mapa?.(f)) : null,
        itemMenu("Remover", () => acoes.remover(f), "perigo"),
      ),
    ),
  );
}
