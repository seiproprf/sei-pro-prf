import { h, icone } from "@comum/ui/dom";

/**
 * Botão de verdade (teclado, leitor de tela), no lugar do <i onclick> do legado.
 * Sem ouvinte próprio: o clique é delegado ao documento (cliques.ts), para a
 * estrela continuar funcionando quando o legado clona a linha.
 */
/**
 * `comoIcone`: a estrela fica entre os ícones de status do SEI (caixa, blocos, acompanhamento),
 * e então tem o tamanho e o alinhamento deles. Sem isso (pesquisa), acompanha o texto.
 */
export function criarEstrela(ativo: boolean, comoIcone = false): HTMLButtonElement {
  const b = h("button", { type: "button", class: comoIcone ? "spro-fav-estrela spro-fav-icone" : "spro-fav-estrela" });
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
