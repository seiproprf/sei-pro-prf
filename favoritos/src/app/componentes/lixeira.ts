import { formatarData, hojeISO } from "@comum/datas/dias";
import { h, icone } from "@comum/ui/dom";
import { DIAS_LIXEIRA } from "../../modelo/constantes";
import type { Favorito } from "../../modelo/tipos";

export function naLixeira(itens: Favorito[], agora: number): Favorito[] {
  const limite = agora - DIAS_LIXEIRA * 86_400_000;
  return (
    itens
      // Registro mínimo sem cópia local (veio do Texto Padrão): não há número nem dados para restaurar.
      .filter((f) => f.removidoEm !== undefined && f.removidoEm >= limite && !(f.resumido && !f.protocolo))
      .sort((a, b) => (b.removidoEm ?? 0) - (a.removidoEm ?? 0))
  );
}

export function montarLixeira(itens: Favorito[], agora: number, d: { restaurar(id: string): Promise<void>; voltar(): void }): HTMLElement {
  const lista = naLixeira(itens, agora);
  const linhas = lista.map((f) => {
    const li: HTMLLIElement = h(
      "li",
      { class: "fav-item fav-item-lixeira" },
      h("div", { class: "fav-cabeca-item" }, h("strong", {}, f.protocolo)),
      h("div", { class: "fav-principal" }, h("span", { class: "fav-titulo" }, f.titulo || f.tipo || "")),
      h(
        "div",
        { class: "fav-meta" },
        h(
          "span",
          { class: "spro-pilula fav-pasta" },
          icone("lixeira", 12),
          h("span", {}, `removido em ${formatarData(hojeISO(new Date(f.removidoEm ?? agora)))}`),
        ),
      ),
      h(
        "div",
        { class: "fav-acoes" },
        h(
          "button",
          {
            type: "button",
            class: "spro-botao pequeno",
            "aria-label": `Restaurar ${f.protocolo}`,
            onclick: async () => {
              await d.restaurar(f.id);
              li.remove();
            },
          },
          icone("restaurar", 14),
          "Restaurar",
        ),
      ),
    );
    return li;
  });
  return h(
    "div",
    { class: "fav-corpo" },
    h(
      "div",
      { class: "fav-lixeira-topo" },
      h("button", { type: "button", class: "spro-botao pequeno", onclick: () => d.voltar() }, icone("restaurar", 14), "Voltar à lista"),
      h("span", { class: "fav-dica" }, `Os removidos ficam aqui por ${DIAS_LIXEIRA} dias.`),
    ),
    lista.length
      ? h("ul", { class: "fav-lista fav-lista-lixeira" }, ...linhas)
      : h(
          "div",
          { class: "fav-vazio" },
          h("span", { class: "fav-vazio-arte", "aria-hidden": "true" }, icone("lixeira", 26)),
          h("p", { class: "fav-vazio-texto" }, "A lixeira está vazia."),
        ),
  );
}
