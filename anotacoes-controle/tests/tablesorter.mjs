/** Regressão com jQuery/tablesorter reais. Rode node tests/tablesorter.mjs e abra a URL. */
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const raiz = new URL('../../', import.meta.url);
const compilado = await build({
  stdin: { contents: "import { renderizar } from './src/view'; window.renderizar = renderizar;", resolveDir: new URL('../', import.meta.url).pathname },
  bundle: true, write: false, format: 'iife',
});
const jquery = await readFile(new URL('dist/js/lib/jquery-3.4.1.min.js', raiz), 'utf8');
const sorter = await readFile(new URL('dist/js/lib/jquery.tablesorter.combined.min.js', raiz), 'utf8');
const legado = await readFile(new URL('dist/js/sei-pro.js', raiz), 'utf8');
const adaptador = legado.slice(legado.indexOf('// O content script isolado avisa'));
const testes = await readFile(new URL('tablesorter-browser.js', import.meta.url), 'utf8');
const html = `<!doctype html><meta charset="utf-8"><title>Regressão das anotações e agrupamentos</title>
<pre id="resultado">Executando…</pre><div id="fixture"></div>
${[jquery, sorter, compilado.outputFiles[0].text, adaptador, testes].map(s => `<script>${s}</script>`).join('')}`;
const servidor = createServer((_req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
});
servidor.listen(Number(process.env.PORT || 8768), '127.0.0.1', () => {
  console.log(`Abra http://127.0.0.1:${servidor.address().port} — resultado em window.resultadoTestes.`);
});
