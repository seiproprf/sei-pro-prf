/**
 * Mesmos utilitários da sei-comum (o contador de falhas é um só, porque o
 * módulo é o mesmo arquivo), mais as telas reais do SEI das fixtures do núcleo.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { definirAnalisador } from "@nucleo/sessao/dom";
import type { Pagina } from "@nucleo/sessao/http";
import { DOMParser } from "linkedom";

export { botao, checar, disparar, escolher, instalarDom, lanca, resumo, secao } from "../../sei-comum/tests/util";

const parser = new DOMParser();
definirAnalisador((html) => parser.parseFromString(html, "text/html") as unknown as Document);

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "sei-nucleo", "tests", "fixtures");

/** Tela real do SEI (fixture do núcleo) como Pagina e como Document, que vira o `document` global. */
export function telaSei(nome: string): { pagina: Pagina; doc: Document } {
  const bruto = readFileSync(join(FIXTURES, nome), "utf8");
  const url = /^<!-- url: (.*?) -->/.exec(bruto)?.[1] ?? "https://sei.exemplo.gov.br/sei/controlador.php";
  const html = bruto.replace(/^<!-- url: .*? -->\n/, "");
  const doc = parser.parseFromString(html, "text/html") as unknown as Document;
  (globalThis as { document?: Document }).document = doc;
  return { pagina: { url, status: 200, html, doc }, doc };
}

/** Deixa as promessas e os setTimeout(0) correrem. */
export const tique = (ms = 5): Promise<void> => new Promise((r) => setTimeout(r, ms));

/** O seletor inteligente (combobox) pelo rótulo. */
export function combo(raiz: ParentNode, rotulo: string): HTMLButtonElement | null {
  return raiz.querySelector<HTMLButtonElement>(`button[role="combobox"][aria-label="${rotulo}"]`);
}

/** Escolhe uma opção do seletor: abre, clica e, na escolha múltipla, fecha de novo. */
export function escolherCombo(raiz: ParentNode, rotulo: string, valor: string): void {
  const b = combo(raiz, rotulo);
  if (!b) throw new Error(`seletor "${rotulo}" não encontrado`);
  if (b.getAttribute("aria-expanded") !== "true") b.click();
  const op = b.ownerDocument.querySelector<HTMLElement>(`.spro-combo-pop [role="option"][data-valor="${valor}"]`);
  if (!op) throw new Error(`opção "${valor}" não encontrada em "${rotulo}"`);
  op.click();
  if (b.getAttribute("aria-expanded") === "true") b.click();
}

/** Opções que o seletor oferece agora (abre e fecha). */
export function opcoesDoCombo(raiz: ParentNode, rotulo: string): string[] {
  const b = combo(raiz, rotulo);
  if (!b) return [];
  b.click();
  const valores = [...b.ownerDocument.querySelectorAll('.spro-combo-pop [role="option"]')].map((o) => o.getAttribute("data-valor") ?? "");
  b.click();
  return valores;
}

/** Abre o menu pelo rótulo do botão e clica o item pelo texto. */
export function itemDoMenu(raiz: ParentNode, menu: string, item: string): boolean {
  const b = raiz.querySelector<HTMLButtonElement>(`button[aria-haspopup="menu"][aria-label="${menu}"]`);
  if (!b) return false;
  if (b.getAttribute("aria-expanded") !== "true") b.click();
  const alvo = [...b.ownerDocument.querySelectorAll<HTMLButtonElement>('.spro-menu-pop [role="menuitem"]')].find(
    (i) => (i.textContent ?? "").trim() === item || (i.querySelector(".spro-menu-rotulo")?.textContent ?? "") === item,
  );
  if (!alvo) {
    b.click();
    return false;
  }
  alvo.click();
  return true;
}
