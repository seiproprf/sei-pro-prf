import { hashCurto, normalizarTexto } from "@comum/texto";

/** Tons claros: o texto da etiqueta fica escuro e legível nos dois temas. */
export const PALETA = ["#bfd5e8", "#c8e6c9", "#ffe0b2", "#f8bbd0", "#d1c4e9", "#b2ebf2", "#fff9c4", "#d7ccc8"];

export function corPadrao(nome: string): string {
  const i = Number.parseInt(hashCurto(normalizarTexto(nome)).slice(0, 6), 16) % PALETA.length;
  return PALETA[i] ?? "#bfd5e8";
}

export { corDoTexto, destaqueDaCorSei } from "@comum/pagina/tema";
