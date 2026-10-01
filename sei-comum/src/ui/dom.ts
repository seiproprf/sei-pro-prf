/**
 * DOM sem framework e SEM innerHTML: texto que vem do SEI ou do usuário entra
 * sempre como nó de texto. É o contrato do DOM seguro (spec do Firefox): um
 * nome de pasta `<img onerror=...>` não tem como virar código.
 *
 * Mesmo `h()` do agente (agente-ia/src/painel/dom.ts), com a mesma correção:
 * `<textarea>` NÃO tem atributo `value` (o valor inicial é o conteúdo), e com
 * setAttribute a caixa abria vazia, como se a nota tivesse sumido.
 */

export type Filho = Node | string | null | undefined | false;
type Atributo = string | boolean | ((ev: Event) => void) | undefined;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, Atributo> = {},
  ...filhos: Filho[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (typeof v === "function") el.addEventListener(k.replace(/^on/, ""), v);
    else if (v === true) el.setAttribute(k, "");
    else if (k === "class") el.className = v;
    else if (k === "value" && tag === "textarea") (el as HTMLTextAreaElement).value = v;
    else el.setAttribute(k, v);
  }
  for (const f of filhos) if (f !== null && f !== undefined && f !== false) el.append(f);
  return el;
}

/**
 * Ícones em SVG desenhados no DOM: sem fonte de ícones (o SEI Pro dependia do
 * FontAwesome da página) e sem emoji, que muda de forma a cada sistema. O traço
 * usa `currentColor`, então acompanha a cor do botão e o modo escuro.
 */
type Forma = [string, Record<string, string>];
const preenchido = { fill: "currentColor", stroke: "none" };
const CONTORNO_ESTRELA = "M12 3.2l2.7 5.5 6 .9-4.35 4.25 1 6L12 17l-5.35 2.85 1-6L3.3 9.6l6-.9z";

const ICONES = {
  estrela: [["path", { d: CONTORNO_ESTRELA }]],
  estrelaCheia: [["path", { d: CONTORNO_ESTRELA, fill: "currentColor" }]],
  pasta: [["path", { d: "M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z" }]],
  etiqueta: [
    ["path", { d: "M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0z" }],
    ["circle", { cx: "8", cy: "8", r: "1.4", ...preenchido }],
  ],
  relogio: [
    ["circle", { cx: "12", cy: "12", r: "9" }],
    ["path", { d: "M12 7.2V12l3.2 1.9" }],
  ],
  nota: [
    ["path", { d: "M6 3.5h9l3.5 3.5v13.5H6z" }],
    ["path", { d: "M9 11h6" }],
    ["path", { d: "M9 15h6" }],
  ],
  lixeira: [
    ["path", { d: "M4.5 6.5h15" }],
    ["path", { d: "M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7" }],
    ["path", { d: "M6.8 6.5 7.6 19c0 .8.7 1.5 1.5 1.5h5.8c.8 0 1.5-.7 1.5-1.5l.8-12.5" }],
  ],
  lapis: [
    ["path", { d: "M17.5 3.5a2.1 2.1 0 0 1 3 3L9 18l-4.5 1.5L6 15z" }],
    ["path", { d: "M15 6l3 3" }],
  ],
  fechar: [
    ["path", { d: "M18 6 6 18" }],
    ["path", { d: "M6 6l12 12" }],
  ],
  mais: [
    ["path", { d: "M12 5v14" }],
    ["path", { d: "M5 12h14" }],
  ],
  busca: [
    ["circle", { cx: "11", cy: "11", r: "6.5" }],
    ["path", { d: "M20.5 20.5l-4.8-4.8" }],
  ],
  baixar: [
    ["path", { d: "M12 3.5v11" }],
    ["path", { d: "M7.5 10.2 12 14.7l4.5-4.5" }],
    ["path", { d: "M4.5 19.5h15" }],
  ],
  subir: [
    ["path", { d: "M12 14.5v-11" }],
    ["path", { d: "M7.5 7.8 12 3.3l4.5 4.5" }],
    ["path", { d: "M4.5 19.5h15" }],
  ],
  copiar: [
    ["rect", { x: "8.5", y: "8.5", width: "12", height: "12", rx: "2" }],
    ["path", { d: "M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" }],
  ],
  restaurar: [
    ["path", { d: "M9 14 4 9l5-5" }],
    ["path", { d: "M4 9h9a7 7 0 0 1 7 7v4" }],
  ],
  check: [["path", { d: "M20 6.5 9.2 17.3 4 12.1" }]],
  alerta: [
    ["path", { d: "M10.3 4.4 2.8 17.6a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0z" }],
    ["path", { d: "M12 9.5v4" }],
    ["circle", { cx: "12", cy: "16.8", r: "1", ...preenchido }],
  ],
  menu: [
    ["circle", { cx: "5", cy: "12", r: "1.4", ...preenchido }],
    ["circle", { cx: "12", cy: "12", r: "1.4", ...preenchido }],
    ["circle", { cx: "19", cy: "12", r: "1.4", ...preenchido }],
  ],
  alca: [
    ["circle", { cx: "9", cy: "6", r: "1.3", ...preenchido }],
    ["circle", { cx: "15", cy: "6", r: "1.3", ...preenchido }],
    ["circle", { cx: "9", cy: "12", r: "1.3", ...preenchido }],
    ["circle", { cx: "15", cy: "12", r: "1.3", ...preenchido }],
    ["circle", { cx: "9", cy: "18", r: "1.3", ...preenchido }],
    ["circle", { cx: "15", cy: "18", r: "1.3", ...preenchido }],
  ],
  ajustes: [
    ["path", { d: "M4 7h5" }],
    ["path", { d: "M13 7h7" }],
    ["circle", { cx: "11", cy: "7", r: "2.1" }],
    ["path", { d: "M4 17h9" }],
    ["path", { d: "M17 17h3" }],
    ["circle", { cx: "15", cy: "17", r: "2.1" }],
  ],
  setaCima: [
    ["path", { d: "M12 19V6" }],
    ["path", { d: "M6 12l6-6 6 6" }],
  ],
  setaBaixo: [
    ["path", { d: "M12 5v13" }],
    ["path", { d: "M18 12l-6 6-6-6" }],
  ],
  recolher: [["path", { d: "M6 15l6-6 6 6" }]],
  expandir: [["path", { d: "M6 9l6 6 6-6" }]],
  local: [
    ["path", { d: "M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z" }],
    ["circle", { cx: "12", cy: "10", r: "2.3" }],
  ],
  sino: [
    ["path", { d: "M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14z" }],
    ["path", { d: "M10 20.5a2 2 0 0 0 4 0" }],
  ],
  documento: [
    ["path", { d: "M7 3.5h7l4 4v13H7z" }],
    ["path", { d: "M14 3.5v4h4" }],
  ],
  painel: [
    ["rect", { x: "3.5", y: "4.5", width: "17", height: "15", rx: "2" }],
    ["path", { d: "M14.5 4.5v15" }],
  ],
  atualizar: [
    ["path", { d: "M19.5 12a7.5 7.5 0 1 1-2.2-5.3" }],
    ["path", { d: "M19.5 4.5v4h-4" }],
  ],
  nuvem: [["path", { d: "M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z" }]],
} satisfies Record<string, Forma[]>;

export type NomeIcone = keyof typeof ICONES;
export const NOMES_ICONES = Object.keys(ICONES) as NomeIcone[];

export function icone(nome: NomeIcone, tamanho = 18): SVGSVGElement {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  const base: Record<string, string> = {
    viewBox: "0 0 24 24",
    width: String(tamanho),
    height: String(tamanho),
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.8",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
    focusable: "false",
    class: "spro-icone",
  };
  for (const [k, v] of Object.entries(base)) svg.setAttribute(k, v);
  for (const [tag, attrs] of ICONES[nome] as Forma[]) {
    const el = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    svg.append(el);
  }
  return svg;
}
