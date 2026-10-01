import { hashCurto, normalizarTexto } from "@comum/texto";

/** Tons claros: o texto da etiqueta fica escuro e legível nos dois temas. */
export const PALETA = ["#bfd5e8", "#c8e6c9", "#ffe0b2", "#f8bbd0", "#d1c4e9", "#b2ebf2", "#fff9c4", "#d7ccc8"];

export function corPadrao(nome: string): string {
  const i = Number.parseInt(hashCurto(normalizarTexto(nome)).slice(0, 6), 16) % PALETA.length;
  return PALETA[i] ?? "#bfd5e8";
}

/** Cor do texto sobre a cor da etiqueta (as do legado podem ser escuras). */
export function corDoTexto(hex: string): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex);
  if (!m) return "#1f2328";
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => Number.parseInt(x ?? "0", 16));
  return (r! * 299 + g! * 587 + b! * 114) / 1000 > 140 ? "#1f2328" : "#ffffff";
}
