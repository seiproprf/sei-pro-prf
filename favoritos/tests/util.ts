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
