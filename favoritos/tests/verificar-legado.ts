/**
 * Com o favoritos novo, o sei-pro-favoritos.js deixa de carregar, e com ele some o
 * getStoreFavoritePro. As funções de etiqueta do legado que os Projetos também usam
 * (getColorTags, sugestEtiquetaPro, saveConfigEtiqueta sem modo) não podem quebrar.
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checar, secao } from "./util";

const FONTE = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "dist", "js", "sei-functions-pro.js"), "latin1");

function extrair(nome: string): string {
  const i = FONTE.indexOf(`\nfunction ${nome}(`);
  if (i < 0) throw new Error(`funcao ${nome} nao achada`);
  return FONTE.slice(i, FONTE.indexOf("\n}", i) + 2);
}

export function verificarLegado(): void {
  secao("legado: etiquetas dos Projetos sem o favoritos antigo");
  const fontes = ["getColorTags", "sugestEtiquetaPro", "saveConfigEtiqueta"].map(extrair).join("\n");
  const $ = { map: (l: unknown[], f: (v: unknown) => unknown) => (l ?? []).flatMap((v) => f(v) ?? []) };
  const gravados: unknown[] = [];
  const legado = new Function(
    "$",
    "uniqPro",
    "localStorageStorePro",
    `${fontes}; return { getColorTags, sugestEtiquetaPro, saveConfigEtiqueta };`,
  )(
    $,
    (l: unknown[]) => [...new Set(l)],
    (...a: unknown[]) => gravados.push(a),
  ) as {
    getColorTags(m?: string): unknown[];
    sugestEtiquetaPro(m?: string): unknown[];
    saveConfigEtiqueta(n: string, v: string, i: string, m?: string): void;
  };
  let erro = "";
  try {
    checar("getColorTags sem modo devolve lista vazia", JSON.stringify(legado.getColorTags()) === "[]");
    checar("sugestEtiquetaPro sem modo devolve lista vazia", JSON.stringify(legado.sugestEtiquetaPro()) === "[]");
    legado.saveConfigEtiqueta("urgente", "#f00", "tag");
  } catch (e) {
    erro = String(e);
  }
  checar("nenhuma chama getStoreFavoritePro inexistente", erro === "", erro);
}
