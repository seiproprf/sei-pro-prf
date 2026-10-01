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
      { class: "fav-item" },
      h("span"),
      h("span"),
      h("div", { class: "fav-principal" }, h("strong", {}, f.protocolo), h("span", {}, f.titulo || f.tipo || "")),
      h("span", { class: "fav-pasta" }, `removido em ${formatarData(hojeISO(new Date(f.removidoEm ?? agora)))}`),
      h(
        "button",
        {
          type: "button",
          class: "spro-botao",
          "aria-label": `Restaurar ${f.protocolo}`,
          onclick: async () => {
            await d.restaurar(f.id);
            li.remove();
          },
        },
        icone("restaurar", 14),
        "Restaurar",
      ),
    );
    return li;
  });
  return h(
    "div",
    {},
    h(
      "div",
      { class: "linha fav-lixeira-topo" },
      h("button", { type: "button", class: "spro-botao", onclick: () => d.voltar() }, "Voltar à lista"),
      h("span", { class: "fav-previa" }, `Os removidos ficam aqui por ${DIAS_LIXEIRA} dias.`),
    ),
    lista.length ? h("ul", { class: "fav-lista" }, ...linhas) : h("p", { class: "fav-vazio" }, "A lixeira está vazia."),
  );
}
