import { h, icone } from "@comum/ui/dom";

/** Botão de verdade (teclado, leitor de tela), no lugar do <i onclick> do legado. */
export function criarEstrela(ativo: boolean, aoClicar: (b: HTMLButtonElement) => void): HTMLButtonElement {
  const b = h("button", { type: "button", class: "spro-fav-estrela" });
  b.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    aoClicar(b);
  });
  atualizarEstrela(b, ativo);
  return b;
}

export function atualizarEstrela(b: HTMLButtonElement, ativo: boolean): void {
  if (b.getAttribute("aria-pressed") === String(ativo) && b.firstChild) return;
  const rotulo = ativo ? "Remover dos favoritos" : "Adicionar aos favoritos";
  b.setAttribute("aria-pressed", String(ativo));
  b.setAttribute("aria-label", rotulo);
  b.title = rotulo;
  b.replaceChildren(icone(ativo ? "estrelaCheia" : "estrela", 16));
}
