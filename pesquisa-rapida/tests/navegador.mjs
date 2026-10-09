/** Smoke opcional no Chromium, com bundle real e storage simulado; não usa sessão do SEI. */
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const pasta = await mkdtemp(join(tmpdir(), 'seipro-pesquisa-'));
const sessao = `pesquisa-${process.pid}`;
function cli(...args) {
  const resultado = spawnSync(
    'npx',
    ['--yes', '--package', '@playwright/cli', 'playwright-cli', `-s=${sessao}`, ...args],
    { encoding: 'utf8', cwd: pasta },
  );
  if (resultado.error || resultado.status !== 0 || /^### Error/m.test(resultado.stdout)) {
    throw resultado.error ?? new Error(resultado.stdout + resultado.stderr);
  }
  return resultado.stdout;
}
try {
  const bundle = await readFile(new URL('../../dist/js/init_pesquisa_rapida.js', import.meta.url), 'utf8');
  const template = await readFile(new URL('smoke-navegador.txt', import.meta.url), 'utf8');
  const arquivo = join(pasta, 'smoke.js');
  await writeFile(arquivo, template.replace('__BUNDLE__', JSON.stringify(bundle)));
  cli('open', 'about:blank');
  const resultado = cli('run-code', '--filename', arquivo);
  const resumo = resultado.match(/### Result\n([\s\S]*?)(?=\n###|$)/)?.[1];
  if (!resumo?.includes('troca de documento: OK')) throw new Error(resultado);
  console.log(resumo.trim());
} finally {
  try {
    cli('close');
  } finally {
    await rm(pasta, { recursive: true, force: true });
  }
}
