import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { lerAnotacaoDaLinha, lerPrioridade } from '../src/leitura';
import { renderizar } from '../src/view';
import { opcaoLegadaLigada } from '../../sei-comum/src/opcoes/legadas';
import { definirAnalisador } from '../../sei-nucleo/src/sessao/dom';
definirAnalisador(html => parseHTML(html).document as unknown as Document);
let n = 0;
function teste(nome: string, fn: () => void) { fn(); console.log(`OK ${++n}: ${nome}`); }
const criar = (html: string) => parseHTML(`<html><body>${html}</body></html>`).document as unknown as Document;
const linha = (tooltip = String.raw`return infraTooltipMostrar('Falta:\nD\'Ávila &amp; equipe','ana');`, extra = '') => `<tr id="P42"><td><input type="checkbox" value="42"></td><td><a href="controlador.php?acao=anotacao_registrar&amp;id_protocolo=42&amp;infra_hash=abc" onmouseover="${tooltip.replaceAll('"', '&quot;')}"><img src="anotacao.svg"></a></td><td><a href="controlador.php?acao=procedimento_trabalhar&amp;id_procedimento=42">123</a></td><td>(ana)</td>${extra}</tr>`;
const docTabela = (id = 'tblProcessosRecebidos', tooltip?: string) => criar(`<table id="${id}"><tbody><tr><th>Selecionar</th><th colspan="3">Recebidos</th></tr>${linha(tooltip)}</tbody></table>`);
teste('lê escapes, entidades e autor sem executar o tooltip', () => {
  assert.deepEqual(lerAnotacaoDaLinha(docTabela().querySelector('tr#P42')!), { texto: "Falta:\nD'Ávila & equipe", autor: 'ana', href: 'controlador.php?acao=anotacao_registrar&id_protocolo=42&infra_hash=abc' });
});
teste('prefere aria-label ao tooltip transformado pelo legado', () => {
  const d = docTabela(); d.querySelector('a')!.setAttribute('aria-label', 'Anotação: Texto original\nOutra linha');
  assert.equal(lerAnotacaoDaLinha(d.querySelector('tr#P42')!)?.texto, 'Texto original\nOutra linha');
});
teste('expressão JS não vira anotação', () => {
  assert.equal(lerAnotacaoDaLinha(docTabela('tblProcessosRecebidos', 'return infraTooltipMostrar(alert(1), "ana");').querySelector('tr#P42')!), null);
});
teste('prioridade vem do checkbox do formulário', () => {
  assert.equal(lerPrioridade(criar('<input id="chkSinPrioridade" type="checkbox" checked>')), true);
  assert.equal(lerPrioridade(criar('<input id="chkSinPrioridade" type="checkbox">')), false);
});
for (const id of ['tblProcessosRecebidos', 'tblProcessosGerados', 'tblProcessosDetalhado']) teste(`renderiza sem mudar colunas e sem duplicar: ${id}`, () => {
  const d = docTabela(id); renderizar(d, true); renderizar(d, true);
  assert.equal(d.querySelectorAll('.spro-anotacao').length, 1);
  assert.equal(d.querySelector('tr#P42')!.querySelectorAll('td').length, 4);
  assert.equal(d.querySelector('th[colspan]')!.getAttribute('colspan'), '3');
  assert.match(d.querySelector('.spro-anotacao')!.textContent!, /D'Ávila & equipe/);
  assert.equal(d.querySelectorAll('a[href*="anotacao_registrar"]').length, 1);
  renderizar(d, false); assert.equal(d.querySelectorAll('.spro-anotacao').length, 0);
});
teste('mudança do tooltip atualiza cartão', () => {
  const d = docTabela(); renderizar(d, true);
  d.querySelector('a')!.setAttribute('onmouseover', "infraTooltipMostrar('Novo texto', 'ana')");
  renderizar(d, true); assert.match(d.querySelector('.spro-anotacao')!.textContent!, /Novo texto/);
});
teste('texto malicioso permanece texto e cartão longo tem expansão acessível', () => {
  const d = docTabela('tblProcessosRecebidos', "infraTooltipMostrar('&lt;img src=x onerror=alert(1)&gt;\\nLinha 2\\nLinha 3', 'ana')");
  renderizar(d, true);
  assert.equal(d.querySelector('.spro-anotacao img'), null);
  const botao = d.querySelector<HTMLButtonElement>('.spro-anotacao button')!;
  assert.equal(botao.getAttribute('aria-expanded'), 'false'); botao.click();
  assert.equal(botao.getAttribute('aria-expanded'), 'true');
});
teste('linha sem anotação não ganha cartão', () => {
  const d = docTabela(); d.querySelector('a')!.remove(); renderizar(d, true);
  assert.equal(d.querySelector('.spro-anotacao'), null);
});
teste('opção ausente liga, false desliga no formato atual', () => {
  assert.equal(opcaoLegadaLigada(undefined, 'mostraranotacaocontrole'), true);
  assert.equal(opcaoLegadaLigada(JSON.stringify([{configGeral: [{name: 'mostraranotacaocontrole', value: false}]}]), 'mostraranotacaocontrole'), false);
});
teste('visão detalhada reutiliza texto nativo e restaura ao desligar', () => {
  const d = criar(`<table id="tblProcessosDetalhado"><tbody><tr><th>Seleção</th><th>Status</th><th>Processo</th><th>Anotação</th><th>Atribuição</th></tr>${linha(undefined, '<td></td>')}</tbody></table>`);
  const celula = d.querySelector('tr#P42')!.querySelectorAll('td')[3]!;
  celula.textContent = 'Nota nativa'; renderizar(d, true);
  assert.equal(celula.querySelector('.spro-anotacao')?.textContent?.includes('Nota nativa'), true);
  renderizar(d, false); assert.equal(celula.textContent, 'Nota nativa');
});
teste('lê anotação acessível na fixture real SEI 4.1', () => {
  const d = criar(readFileSync(new URL('../../sei-nucleo/tests/fixtures/sei41/caixa.html', import.meta.url), 'utf8'));
  const nota = lerAnotacaoDaLinha(d.querySelector('#P148265')!);
  assert.equal(nota?.texto, 'teste');
  assert.equal(nota?.autor, 'usuario01 em 10/07/2025 16:04');
});
teste('detalhado mantém quebras de linha e acompanha célula substituída pelo SEI', () => {
  const d = criar(`<table id="tblProcessosDetalhado"><tbody><tr><th>Seleção</th><th>Status</th><th>Processo</th><th>Anotação</th></tr>${linha()}</tbody></table>`);
  const celula = d.querySelector('tr#P42')!.querySelectorAll('td')[3]!;
  celula.innerHTML = 'Primeira<br>Segunda'; renderizar(d, true);
  assert.equal(celula.querySelector('.spro-anotacao-texto')!.textContent, 'Primeira\nSegunda');
  celula.textContent = 'Atualizada'; renderizar(d, true);
  assert.equal(celula.querySelector('.spro-anotacao-texto')!.textContent, 'Atualizada');
  renderizar(d, false); assert.equal(celula.textContent, 'Atualizada');
});
console.log(`${n} verificações passaram.`);
