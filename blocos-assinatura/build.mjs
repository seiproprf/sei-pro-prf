import { build } from 'esbuild';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const outfile = fileURLToPath(new URL('../dist/js/init_blocos_assinatura.js', import.meta.url));
await build({ entryPoints: [fileURLToPath(new URL('src/main.ts', import.meta.url))], outfile, bundle: true, minify: true, format: 'iife', target: ['chrome116', 'firefox115'], charset: 'ascii', legalComments: 'none', loader: { '.css': 'text' }, banner: { js: '/* GERADO por blocos-assinatura/build.mjs. NAO EDITE. Rode: npm run build */' } });
if ((await readFile(outfile)).some(byte => byte > 127)) throw new Error('Bundle contém bytes não ASCII');
console.log('Blocos de assinatura: bundle gerado.');
