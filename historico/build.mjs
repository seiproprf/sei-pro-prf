#!/usr/bin/env node
/**
 * Build do Historico.
 *
 *   dist/js/init_historico.js  content script (IIFE, mundo isolado, todos os frames)
 * As demais entradas (app, painel) entram nas Tasks 12 e 13. Saidas todas ASCII (portao de bytes abaixo).
 */
import { build } from "esbuild";
import { mkdir, readFile, rm, stat } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIST = resolve(AQUI, "..", "dist");

// Opcoes comuns do esbuild, usadas por cada `build({ ...comum, ... })` das entradas.
const comum = {
  bundle: true,
  minify: true,
  target: ["chrome116", "firefox115"],
  // Acentos saem como \uXXXX: regra do projeto para JS da extensao.
  charset: "ascii",
  logLevel: "warning",
  legalComments: "none",
  loader: { ".css": "text" },
  banner: { js: "/* GERADO por historico/build.mjs. NAO EDITE ESTE ARQUIVO. Rode: npm run build */" },
};

await rm(join(DIST, "js", "historico"), { recursive: true, force: true });
await mkdir(join(DIST, "js", "historico"), { recursive: true });

await build({ ...comum, entryPoints: [resolve(AQUI, "src/pagina/main.ts")], outfile: join(DIST, "js", "init_historico.js"), format: "iife" });

const SAIDAS = ["js/init_historico.js"];

// Regra do projeto: JS da extensao so com ASCII (conferencia byte a byte, como no Favoritos).
for (const f of SAIDAS) {
  const bytes = await readFile(join(DIST, f));
  const i = bytes.findIndex((b) => b > 0x7f);
  if (i >= 0) {
    console.error(`ERRO: byte nao-ASCII em dist/${f} (posicao ${i}): ${bytes.subarray(Math.max(0, i - 40), i + 10).toString("utf8")}`);
    process.exit(1);
  }
}

const kb = async (f) => `${Math.round((await stat(join(DIST, f))).size / 1024)} KB`;
console.log("\nHistorico -- build");
for (const f of SAIDAS) console.log(`  ${f.padEnd(26)} ${await kb(f)}`);
