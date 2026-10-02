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

/**
 * Cor de destaque a partir da barra do SEI (o tema escolhido pelo órgão), já
 * no formato do getComputedStyle (`rgb(21, 94, 158)`) ou em hex. Cinza e
 * transparente não servem (fica o azul padrão); cor clara demais é escurecida
 * até o texto branco ficar legível sobre ela (botão primário, número do processo).
 */
export function destaqueDaCorSei(css: string): string | null {
  const t = css.trim().toLowerCase();
  let rgb: number[] | null = null;
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(t);
  if (hex) rgb = [hex[1], hex[2], hex[3]].map((x) => Number.parseInt(x ?? "0", 16));
  const fn = /^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(t);
  if (fn) {
    const alfa = fn[4] === undefined ? 1 : fn[4].endsWith("%") ? Number.parseFloat(fn[4]) / 100 : Number.parseFloat(fn[4]);
    if (alfa < 0.9) return null;
    rgb = [fn[1], fn[2], fn[3]].map((x) => Number(x));
  }
  if (!rgb || rgb.some((x) => !Number.isFinite(x) || x < 0 || x > 255)) return null;
  const [r, g, b] = rgb as [number, number, number];
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0 || (max - min) / max < 0.25) return null;
  let cor: [number, number, number] = [r, g, b];
  for (let i = 0; i < 12 && corDoTexto(paraHex(cor)) !== "#ffffff"; i++)
    cor = cor.map((x) => Math.round(x * 0.88)) as [number, number, number];
  return paraHex(cor);
}

function paraHex(c: readonly number[]): string {
  return `#${c.map((x) => x.toString(16).padStart(2, "0")).join("")}`;
}
