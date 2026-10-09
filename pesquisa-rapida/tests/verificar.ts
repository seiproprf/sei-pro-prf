import assert from 'node:assert/strict';
import { parseHTML } from 'linkedom';
import { iniciar } from '../src/controle';
import { contextoDaPagina } from '../src/leitura';
import { readFileSync } from 'node:fs';
import { definirAnalisador } from '../../sei-nucleo/src/sessao/dom';
definirAnalisador((html) => parseHTML(html).document as unknown as Document);
import { opcaoLegadaLigada } from '../../sei-comum/src/opcoes/legadas';

let n = 0;
async function teste(nome: string, fn: () => void | Promise<void>) {
  await fn();
  console.log(`OK ${++n}: ${nome}`);
}
const criar = (html: string) =>
  parseHTML(`<html><head></head><body>${html}</body></html>`).document as unknown as Document;
const esperar = () => new Promise((r) => setTimeout(r, 180));
const oculta = (d: Document, id: string) => d.getElementById(id)!.classList.contains('spro-pesquisa-oculta');
const lista = () =>
  criar(`<input id="txtPesquisaRapida"><table id="tblProcessosRecebidos"><tbody>
<tr><th>Recebidos</th></tr><tr id="g1" class="tagintable"><td>Grupo um</td></tr>
<tr id="p1"><td>12.345/0001-99</td><td title="AÇÃO útil">João</td></tr>
<tr id="g2" class="tableHeader"><td>Grupo dois</td></tr>
<tr id="p2"><td>98765</td><td>Maria</td><td>ação</td><td>útil</td></tr>
</tbody></table><p>Ação útil</p>`);
function digitar(d: Document, valor: string) {
  const input = d.querySelector<HTMLInputElement>('#txtPesquisaRapida')!;
  input.value = valor;
  input.dispatchEvent(new d.defaultView!.Event('input'));
}
function tecla(d: Document, key: string) {
  const evento = new d.defaultView!.Event('keydown', { cancelable: true });
  Object.defineProperty(evento, 'key', { value: key });
  d.querySelector('#txtPesquisaRapida')!.dispatchEvent(evento);
  return evento;
}
await teste('preferência ausente liga e escolha salva desliga', () => {
  assert.equal(opcaoLegadaLigada(undefined, 'filtrarpaginapelapesquisarapida'), true);
  assert.equal(
    opcaoLegadaLigada(
      JSON.stringify([{ configGeral: [{ name: 'filtrarpaginapelapesquisarapida', value: false }] }]),
      'filtrarpaginapelapesquisarapida',
    ),
    false,
  );
});
await teste('filtra número sem pontuação e oculta cabeçalho vazio', async () => {
  const d = lista();
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, '12345');
  await esperar();
  assert.equal(oculta(d, 'p1'), false);
  assert.equal(oculta(d, 'p2'), true);
  assert.equal(oculta(d, 'g1'), false);
  assert.equal(oculta(d, 'g2'), true);
  assert.equal(d.querySelector('th')!.closest('tr')!.className, '');
  c.fechar();
});
await teste('cabeçalhos consecutivos acompanham os processos do agrupamento', async () => {
  const d = criar(`<input id="txtPesquisaRapida"><table id="tblProcessosRecebidos"><tbody>
<tr id="c1" class="infraCaption tagintable"><td>1 registros:</td></tr>
<tr id="h1" class="tagintable tableHeader"><th>Grupo um</th></tr>
<tr id="p1"><td>João</td></tr>
<tr id="c2" class="infraCaption tagintable"><td>1 registros:</td></tr>
<tr id="h2" class="tagintable tableHeader"><th>Grupo dois</th></tr>
<tr id="p2"><td>Maria</td></tr>
</tbody></table>`);
  const c = iniciar(d, 'lista');
  try {
    c.configurar(true);
    digitar(d, 'João');
    await esperar();
    for (const id of ['c1', 'h1', 'p1']) assert.equal(oculta(d, id), false, id);
    for (const id of ['c2', 'h2', 'p2']) assert.equal(oculta(d, id), true, id);
    digitar(d, 'Maria');
    await esperar();
    for (const id of ['c1', 'h1', 'p1']) assert.equal(oculta(d, id), true, id);
    for (const id of ['c2', 'h2', 'p2']) assert.equal(oculta(d, id), false, id);
    tecla(d, 'Escape');
    for (const id of ['c1', 'h1', 'p1', 'c2', 'h2', 'p2']) assert.equal(oculta(d, id), false, id);
  } finally {
    c.fechar();
  }
});
await teste('palavras no mesmo campo, acentos e tooltip; não junta células', async () => {
  const d = lista();
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, 'acao UTIL');
  await esperar();
  assert.equal(oculta(d, 'p1'), false);
  assert.equal(oculta(d, 'p2'), true);
  assert.ok(d.querySelector('p .spro-pesquisa-destaque'));
  c.fechar();
});
await teste('Enter nativo, Escape restaura e menos de três caracteres não filtra', async () => {
  const d = lista();
  const original = d.querySelector('table')!.innerHTML;
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, 'inexistente');
  await esperar();
  assert.equal(oculta(d, 'p1'), true);
  assert.equal(tecla(d, 'Enter').defaultPrevented, false);
  tecla(d, 'Escape');
  assert.equal(d.querySelector<HTMLInputElement>('input')!.value, '');
  assert.equal(oculta(d, 'p1'), false);
  assert.equal(d.querySelector('table')!.innerHTML, original);
  digitar(d, 'a!');
  await esperar();
  assert.equal(oculta(d, 'p2'), false);
  assert.equal(d.querySelectorAll('.spro-pesquisa-destaque').length, 0);
  c.fechar();
});
await teste('desligar restaura e novas linhas respeitam o termo ativo', async () => {
  const d = lista();
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, '12345');
  await esperar();
  d.querySelector('tbody')!.insertAdjacentHTML('beforeend', '<tr id="p3"><td>outro processo</td></tr>');
  await esperar();
  assert.equal(oculta(d, 'p3'), true);
  c.configurar(false);
  assert.equal(oculta(d, 'p2'), false);
  digitar(d, 'Maria');
  await esperar();
  assert.equal(oculta(d, 'p1'), false);
  c.configurar(true);
  await esperar();
  assert.equal(oculta(d, 'p1'), true);
  c.fechar();
  assert.equal(oculta(d, 'p1'), false);
});
await teste('árvore e documento só destacam, preservam links e ignoram editor e menus', async () => {
  for (const contexto of ['arvore', 'documento'] as const) {
    const pai = criar('<input id="txtPesquisaRapida">');
    const d = criar(
      '<div id="divArvore"><a href="#x">AÇÃO 12.345</a></div><textarea>AÇÃO</textarea><div contenteditable="true">AÇÃO</div><nav id="navInfraBarraNavegacao">AÇÃO</nav>',
    );
    const original = d.body.innerHTML;
    const link = d.querySelector('a');
    const c = iniciar(d, contexto, () => pai.querySelector('input'));
    c.configurar(true);
    digitar(pai, 'acao');
    await esperar();
    assert.equal(d.querySelectorAll('.spro-pesquisa-destaque').length, 1);
    assert.equal(d.querySelector('a'), link);
    assert.equal(d.querySelectorAll('.spro-pesquisa-oculta').length, 0);
    d.querySelector('#divArvore')!.insertAdjacentHTML('beforeend', '<span>Ação nova</span>');
    await esperar();
    assert.equal(d.querySelectorAll('.spro-pesquisa-destaque').length, 2);
    tecla(pai, 'Escape');
    assert.equal(d.querySelectorAll('.spro-pesquisa-destaque').length, 0);
    d.querySelector('#divArvore > span')!.remove();
    assert.equal(d.body.innerHTML, original);
    c.fechar();
  }
});
await teste('campo tardio é adotado e acesso bloqueado não lança', async () => {
  const d = criar('<p>Ação</p>');
  const c = iniciar(d, 'documento');
  c.configurar(true);
  d.body.insertAdjacentHTML('afterbegin', '<input id="txtPesquisaRapida">');
  await esperar();
  digitar(d, 'acao');
  await esperar();
  assert.ok(d.querySelector('.spro-pesquisa-destaque'));
  c.fechar();
  const bloqueado = iniciar(d, 'documento', () => {
    throw new Error('cross-origin');
  });
  bloqueado.configurar(true);
  await esperar();
  bloqueado.fechar();
});
await teste('tooltip HTML e escapes são lidos como texto sem executar código', async () => {
  const d = lista();
  d.querySelector('#p1 td')!.setAttribute(
    'onmouseover',
    String.raw`return infraTooltipMostrar('Ação <b>especial</b> d\'Ávila','Tipo');`,
  );
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, 'acao especial');
  await esperar();
  assert.equal(oculta(d, 'p1'), false);
  assert.equal(oculta(d, 'p2'), true);
  c.fechar();
});
await teste('rotas reais do SEI incluem arvore_visualizar e excluem editor', () => {
  for (const [acao, esperado] of [
    ['arvore_visualizar', 'documento'],
    ['procedimento_visualizar', 'documento'],
    ['documento_editar', null],
  ] as const) {
    const d = criar('<p>Conteúdo</p>');
    Object.defineProperty(d, 'URL', { value: `https://sei.exemplo.br/sei/controlador.php?acao=${acao}` });
    assert.equal(contextoDaPagina(d), esperado);
  }
});
await teste('fixture real do SEI 4.1 busca especificação em tooltip e mantém cabeçalho', async () => {
  const d = parseHTML(
    readFileSync(new URL('../../sei-nucleo/tests/fixtures/sei41/caixa.html', import.meta.url), 'utf8'),
  ).document as unknown as Document;
  d.body.insertAdjacentHTML('afterbegin', '<input id="txtPesquisaRapida">');
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, 'Dilação prazo');
  await esperar();
  assert.equal(oculta(d, 'P150098'), false);
  assert.equal(oculta(d, 'P157584'), true);
  c.fechar();
});
await teste('destaque cobre número formatado, limpa e preserva texto não HTML', async () => {
  const d = criar('<input id="txtPesquisaRapida"><p>12.345/0001-99</p>');
  const original = d.querySelector('p')!.innerHTML;
  const c = iniciar(d, 'documento');
  c.configurar(true);
  digitar(d, '12345');
  await esperar();
  assert.equal(d.querySelector('.spro-pesquisa-destaque')!.textContent, '12.345');
  c.configurar(false);
  assert.equal(d.querySelector('p')!.innerHTML, original);
  c.fechar();
  Object.defineProperty(d, 'contentType', { value: 'application/pdf' });
  const pdf = iniciar(d, 'documento');
  pdf.configurar(true);
  await esperar();
  assert.equal(d.querySelector('.spro-pesquisa-destaque'), null);
  pdf.fechar();
});
await teste('frames irmãos não deixam título residual no campo compartilhado', () => {
  const pai = criar('<input id="txtPesquisaRapida" title="Pesquisa nativa">');
  const a = iniciar(criar('<div id="divArvore">Ação</div>'), 'arvore', () => pai.querySelector('input'));
  const b = iniciar(criar('<p>Ação</p>'), 'documento', () => pai.querySelector('input'));
  a.configurar(true);
  b.configurar(true);
  a.configurar(false);
  b.configurar(false);
  assert.equal(pai.querySelector('input')!.getAttribute('title'), 'Pesquisa nativa');
  a.fechar();
  b.fechar();
});
await teste('estrutura PRF: metadados do checkbox e label entram na pesquisa', async () => {
  const d = lista();
  d.querySelector('#p1 td')!.innerHTML =
    '<div class="infraCheckboxDiv"><input type="checkbox" title="08650.000001/2026-00" aria-label="Tipo Orientações / Especificação Teste PRF"><label title="08650.000001/2026-00"></label></div>';
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, 'Teste PRF');
  await esperar();
  assert.equal(oculta(d, 'p1'), false);
  assert.equal(oculta(d, 'p2'), true);
  c.fechar();
});
await teste('limpar preserva ocultação de outros filtros e agrupamentos', async () => {
  const d = lista();
  const linha = d.getElementById('p1')!;
  linha.classList.add('outro-filtro');
  linha.setAttribute('style', 'display:none');
  const c = iniciar(d, 'lista');
  c.configurar(true);
  digitar(d, 'Maria');
  await esperar();
  tecla(d, 'Escape');
  assert.equal(linha.classList.contains('outro-filtro'), true);
  assert.equal(linha.getAttribute('style'), 'display:none');
  c.fechar();
});
console.log(`${n} verificações passaram.`);
