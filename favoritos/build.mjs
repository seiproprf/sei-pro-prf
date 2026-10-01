#!/usr/bin/env node
/**
 * Build do Favoritos.
 *
 *   dist/js/init_favoritos.js  content script (IIFE, mundo isolado, todos os frames)
 *   dist/js/favoritos/app.js   app de html/favoritos.html (ESM)
 *   dist/html/favoritos.html   copia de estatico/
 *   dist/css/favoritos.css     sei-comum/src/ui/base.css + estatico/favoritos.css
 *
 * CSS importado no codigo (o balao em Shadow DOM) entra como texto (loader "text").
 */
import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(AQUI, "..", "dist");

const comum = {
  bundle: true,
  minify: true,
  target: ["chrome116", "firefox115"],
  // Acentos saem como \uXXXX: regra do projeto para JS da extensao.
  charset: "ascii",
  logLevel: "warning",
  legalComments: "none",
  loader: { ".css": "text" },
  banner: { js: "/* GERADO por favoritos/build.mjs. NAO EDITE ESTE ARQUIVO. Rode: npm run build */" },
};

await rm(join(DIST, "js", "favoritos"), { recursive: true, force: true });
await mkdir(join(DIST, "js", "favoritos"), { recursive: true });

await build({ ...comum, entryPoints: [resolve(AQUI, "src/app/main.ts")], outfile: join(DIST, "js", "favoritos", "app.js"), format: "esm" });
await build({ ...comum, entryPoints: [resolve(AQUI, "src/pagina/main.ts")], outfile: join(DIST, "js", "init_favoritos.js"), format: "iife" });

await copyFile(resolve(AQUI, "estatico/favoritos.html"), join(DIST, "html", "favoritos.html"));
const css = [await readFile(resolve(AQUI, "../sei-comum/src/ui/base.css"), "utf8"), await readFile(resolve(AQUI, "estatico/favoritos.css"), "utf8")].join("\n");
await writeFile(join(DIST, "css", "favoritos.css"), `/* GERADO por favoritos/build.mjs. NAO EDITE ESTE ARQUIVO. */\n${css}`);

// Regra do projeto: JS da extensao so com ASCII. O charset "ascii" do esbuild NAO escapa
// caractere cru dentro de regex literal, e o grep BSD nao enxerga isso (memoria
// feedback_sei_unicode_escape): a conferencia e feita aqui, byte a byte.
for (const f of ["js/init_favoritos.js", "js/favoritos/app.js"]) {
  const bytes = await readFile(join(DIST, f));
  const i = bytes.findIndex((b) => b > 0x7f);
  if (i >= 0) {
    console.error(`ERRO: byte nao-ASCII em dist/${f} (posicao ${i}): ${bytes.subarray(Math.max(0, i - 40), i + 10).toString("utf8")}`);
    process.exit(1);
  }
}

const kb = async (f) => `${Math.round((await stat(join(DIST, f))).size / 1024)} KB`;
console.log("\nFavoritos -- build");
for (const f of ["js/init_favoritos.js", "js/favoritos/app.js", "css/favoritos.css"]) console.log(`  ${f.padEnd(26)} ${await kb(f)}`);
