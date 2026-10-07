import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { lerAnotacaoDaLinha } from '../src/leitura';
import { aoClicarSeta, renderizar } from '../src/view';
import { iniciar } from '../src/controle';
import { lerLinhaCaixa } from '../../sei-nucleo/src/dominio/caixa';
import { definirAnalisador } from '../../sei-nucleo/src/sessao/dom';
definirAnalisador(html => parseHTML(html).document as unknown as Document);

let n = 0;
async function teste(nome: string, fn: () => void | Promise<void>) { await fn(); console.log(`OK ${++n}: ${nome}`); }
const criar = (html: string) => parseHTML(`<html><body>${html}</body></html>`).document as unknown as Document;
const fixture41 = () => criar(readFileSync(new URL('../../sei-nucleo/tests/fixtures/sei41/caixa.html', import.meta.url), 'utf8'));
const esperar = () => new Promise(resolve => setTimeout(resolve, 100));
const HREF = 'controlador.php?acao=anotacao_registrar&amp;id_protocolo=42&amp;infra_hash=abc';
/** Linha no formato do SEI 4.1/5: aria-label "Anotação[ com prioridade] / texto / autor". */
const linha5 = (rotulo: string, icone = 'svg/anotacao1.svg?18') =>
  `<tr id="P42"><td><input type="checkbox" value="42" title="123"></td><td><a href="${HREF}" aria-label="${rotulo}" onmouseover="return infraTooltipMostrar('outro','x');"><img src="${icone}" class="imagemStatus"></a></td><td><a href="controlador.php?acao=procedimento_trabalhar&amp;id_procedimento=42">123</a></td><td>(ana)</td></tr>`;
/** Linha no formato do SEI 3: só o tooltip, sem aria-label. */
const linha3 = (tooltip: string, icone = 'imagens/sei_anotacao_pequeno.gif') =>
  `<tr id="P42"><td><input type="checkbox" value="42"></td><td><a href="${HREF}" onmouseover="${tooltip.replaceAll('"', '&quot;')}"><img src="${icone}"></a></td><td><a href="controlador.php?acao=procedimento_trabalhar&amp;id_procedimento=42">123</a></td><td>(ana)</td></tr>`;
const tabela = (linhas: string, id = 'tblProcessosRecebidos') => criar(`<table id="${id}"><tbody><tr><th>Sel</th><th colspan="3">Recebidos</th></tr>${linhas}</tbody></table>`);
const tr = (d: Document) => d.querySelector('tr#P42')!;
const textoDe = (cartao: Element) => [...cartao.querySelectorAll('.spro-anotacao-linha')].map(l => l.querySelector('.spro-anotacao-conteudo')?.textContent).join('\n');

// ---- leitura ----
await teste('SEI 4.1: texto e autor pelo aria-label; ícone comum não é prioridade', () => {
  const nota = lerAnotacaoDaLinha(fixture41().querySelector('#P148265')!);
  assert.deepEqual(nota && { texto: nota.texto, autor: nota.autor, prioridade: nota.prioridade }, { texto: 'teste', autor: 'usuario01 em 10/07/2025 16:04', prioridade: false });
});
await teste('SEI 5: "com prioridade" no aria-label e quebra de linha (&#13;)', () => {
  const nota = lerAnotacaoDaLinha(tr(tabela(linha5('Anota&ccedil;&atilde;o com prioridade / Linha 1&#13;Linha 2 / ana em 01/10/2026 10:00'))));
  assert.deepEqual(nota && { texto: nota.texto, autor: nota.autor, prioridade: nota.prioridade }, { texto: 'Linha 1\nLinha 2', autor: 'ana em 01/10/2026 10:00', prioridade: true });
});
await teste('prioridade pelo ícone anotacao2.svg mesmo sem o rótulo', () => {
  assert.equal(lerAnotacaoDaLinha(tr(tabela(linha5('Anota&ccedil;&atilde;o / nota / ana em 01/10/2026 10:00', 'svg/anotacao2.svg?18'))))?.prioridade, true);
});
await teste('texto com " / " no meio não perde pedaço', () => {
  const nota = lerAnotacaoDaLinha(tr(tabela(linha5('Anota&ccedil;&atilde;o / Ver item 3 / prazo 10/10 / ana em 01/10/2026 10:00'))));
  assert.equal(nota?.texto, 'Ver item 3 / prazo 10/10');
  assert.equal(nota?.autor, 'ana em 01/10/2026 10:00');
});
await teste('SEI 3: tooltip com escapes e entidades; prioridade pelo nome do ícone', () => {
  const nota = lerAnotacaoDaLinha(tr(tabela(linha3(String.raw`return infraTooltipMostrar('Falta:\nD\'Ávila &amp; equipe','ana');`, 'imagens/sei_anotacao_prioridade_pequeno.gif'))));
  assert.deepEqual(nota && { texto: nota.texto, autor: nota.autor, prioridade: nota.prioridade }, { texto: "Falta:\nD'Ávila & equipe", autor: 'ana', prioridade: true });
});
await teste('SEI 3: desfaz o checklist que o legado converteu em HTML no tooltip', () => {
  const tooltip = String.raw`return infraTooltipMostrar('Lista:<div style=\"text-decoration: line-through;\"><i class=\"fas fa-check-square\"></i> Feito</div><div><i class=\"far fa-square\"></i> Pendente</div>','ana');`;
  assert.equal(lerAnotacaoDaLinha(tr(tabela(linha3(tooltip))))?.texto, 'Lista:\n[X] Feito\n[ ] Pendente');
});
await teste('expressão JS no tooltip não vira anotação', () => {
  assert.equal(lerAnotacaoDaLinha(tr(tabela(linha3('return infraTooltipMostrar(alert(1), "ana");')))), null);
});
await teste('linha sem ícone de anotação não tem anotação', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana')); d.querySelector('a[href*=anotacao_registrar]')!.remove();
  assert.equal(lerAnotacaoDaLinha(tr(d)), null);
});

// ---- desenho ----
const celulaProcesso = (d: Document) => tr(d).querySelector('a[href*=procedimento_trabalhar]')!.closest('td')!;
await teste('cartão fica na célula do processo, depois do número, sem coluna nova e sem esconder o ícone', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota curta / ana em 01/10/2026 10:00'));
  renderizar(d, true);
  const card = celulaProcesso(d).querySelector('.spro-anotacao')!;
  assert.ok(card, 'sem cartão');
  assert.equal(card.previousElementSibling?.getAttribute('href')?.includes('procedimento_trabalhar'), true);
  assert.equal(card.querySelector('.spro-anotacao-texto')!.textContent, 'nota curta');
  assert.equal(card.getAttribute('title'), 'Anotação de ana em 01/10/2026 10:00');
  assert.equal(tr(d).querySelectorAll('td').length, 4);
  assert.equal(d.querySelectorAll('th').length, 2);
  assert.doesNotMatch(tr(d).querySelector('a[href*=anotacao_registrar]')!.getAttribute('class') ?? '', /spro/);
});
await teste('cartão tem ícone de nota, corpo e seta com chevron (sem caractere solto)', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana em 01/10/2026 10:00'));
  renderizar(d, true);
  const cartao = d.querySelector('.spro-anotacao')!;
  assert.equal(cartao.firstElementChild?.tagName.toLowerCase(), 'svg');
  assert.equal(cartao.firstElementChild?.getAttribute('aria-hidden'), 'true');
  assert.ok(cartao.querySelector('.spro-anotacao-corpo > .spro-anotacao-texto'));
  const seta = cartao.querySelector('.spro-anotacao-seta')!;
  assert.ok(seta.querySelector('svg'));
  assert.equal(seta.textContent, '');
  assert.equal(seta.getAttribute('aria-label'), 'Ver anotação completa');
});
await teste('rodapé mostra autor e data separados por ponto', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana em 01/10/2026 10:00'));
  renderizar(d, true);
  assert.equal(d.querySelector('.spro-anotacao-corpo > .spro-anotacao-rodape')?.textContent, 'ana · 01/10/2026 10:00');
});
await teste('sem autor, sem rodapé', () => {
  const d = tabela(linha3("return infraTooltipMostrar('nota sem autor');"));
  renderizar(d, true);
  assert.ok(d.querySelector('.spro-anotacao'));
  assert.equal(d.querySelector('.spro-anotacao-rodape'), null);
});
await teste('prioridade ganha pílula com texto antes da anotação; comum não', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o com prioridade / urgente / ana'));
  renderizar(d, true);
  const primeira = d.querySelector('.spro-anotacao-texto > .spro-anotacao-linha')!;
  assert.equal(primeira.firstElementChild?.className, 'spro-anotacao-pilula');
  assert.equal(primeira.firstElementChild?.textContent, 'Prioridade');
  assert.equal(textoDe(d.querySelector('.spro-anotacao')!), 'urgente');
  const comum = tabela(linha5('Anota&ccedil;&atilde;o / comum / ana'));
  renderizar(comum, true);
  assert.equal(comum.querySelector('.spro-anotacao-pilula'), null);
});
const itensDe = (d: Document) => [...d.querySelectorAll('.spro-anotacao-linha')].map(l => ({
  feito: l.classList.contains('spro-anotacao-item-feito'),
  item: l.classList.contains('spro-anotacao-item'),
  caixa: l.querySelector('.spro-anotacao-caixa')?.getAttribute('aria-label') ?? null,
  marca: !!l.querySelector('.spro-anotacao-caixa svg'),
  texto: l.querySelector('.spro-anotacao-conteudo')?.textContent,
}));
await teste('checklist: [X], [x] e [ ] no início da linha viram caixas (só desenho)', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / Tarefas:&#13;[X] Cadastro no SFIS;&#13;[ ] Confer&ecirc;ncia&#13;  [x]min&uacute;sculo / ana'));
  renderizar(d, true);
  assert.deepEqual(itensDe(d), [
    { feito: false, item: false, caixa: null, marca: false, texto: 'Tarefas:' },
    { feito: true, item: true, caixa: 'concluído', marca: true, texto: 'Cadastro no SFIS;' },
    { feito: false, item: true, caixa: 'pendente', marca: false, texto: 'Conferência' },
    { feito: true, item: true, caixa: 'concluído', marca: true, texto: 'minúsculo' },
  ]);
  assert.equal(d.querySelector('.spro-anotacao input'), null);
});
await teste('marcador no meio da linha continua texto', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / Ver [ ] depois e [X] tamb&eacute;m / ana'));
  renderizar(d, true);
  assert.deepEqual(itensDe(d), [{ feito: false, item: false, caixa: null, marca: false, texto: 'Ver [ ] depois e [X] também' }]);
});
await teste('linhas em branco entre os itens são preservadas', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / [X] um&#13;&#13;[ ] dois / ana'));
  renderizar(d, true);
  assert.deepEqual(itensDe(d).map(l => l.texto), ['um', '', 'dois']);
});
await teste('com checklist na primeira linha, a pílula fica numa linha própria (não esmaga o item)', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o com prioridade / [ ] urgente&#13;[X] feito / ana'));
  renderizar(d, true);
  const texto = d.querySelector('.spro-anotacao-texto')!;
  assert.equal(texto.firstElementChild?.className, 'spro-anotacao-pilula');
  const primeira = d.querySelector('.spro-anotacao-linha')!;
  assert.deepEqual([...primeira.children].map(e => e.className), ['spro-anotacao-caixa', 'spro-anotacao-conteudo']);
  assert.equal(textoDe(d.querySelector('.spro-anotacao')!), 'urgente\nfeito');
});
await teste('item malicioso continua texto', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / [X] &lt;img src=x onerror=alert(1)&gt; / ana'));
  renderizar(d, true);
  assert.equal(d.querySelector('.spro-anotacao img'), null);
  assert.equal(d.querySelector('.spro-anotacao-conteudo')!.textContent, '<img src=x onerror=alert(1)>');
});
await teste('redesenhar não duplica e preserva o mesmo cartão', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana'));
  renderizar(d, true); const antes = d.querySelector('.spro-anotacao'); renderizar(d, true);
  assert.equal(d.querySelectorAll('.spro-anotacao').length, 1);
  assert.equal(d.querySelector('.spro-anotacao'), antes);
});
await teste('mudança da anotação atualiza o cartão', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / antiga / ana'));
  renderizar(d, true);
  d.querySelector('a[href*=anotacao_registrar]')!.setAttribute('aria-label', 'Anotação com prioridade / nova / ana');
  renderizar(d, true);
  assert.equal(d.querySelectorAll('.spro-anotacao').length, 1);
  assert.equal(textoDe(d.querySelector('.spro-anotacao')!), 'nova');
  assert.equal(d.querySelector('.spro-anotacao')!.classList.contains('spro-anotacao-prioridade'), true);
});
await teste('texto malicioso continua texto', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / &lt;img src=x onerror=alert(1)&gt; / ana'));
  renderizar(d, true);
  assert.equal(d.querySelector('.spro-anotacao img'), null);
  assert.equal(d.querySelector('.spro-anotacao-texto')!.textContent, '<img src=x onerror=alert(1)>');
});
await teste('desligar devolve a célula exatamente como era', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana'));
  const original = tr(d).innerHTML;
  renderizar(d, true); renderizar(d, false);
  assert.equal(tr(d).innerHTML, original);
});
await teste('linha que perde a anotação perde o cartão', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana'));
  renderizar(d, true); d.querySelector('a[href*=anotacao_registrar]')!.remove(); renderizar(d, true);
  assert.equal(d.querySelector('.spro-anotacao'), null);
});
await teste('visão detalhada não é alterada (o SEI já tem a coluna Anotação)', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana'), 'tblProcessosDetalhado');
  const original = d.body.innerHTML; renderizar(d, true);
  assert.equal(d.body.innerHTML, original);
});
await teste('linha clonada pelo agrupamento mantém um cartão e a seta funciona', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana'));
  d.addEventListener('click', aoClicarSeta, true);
  renderizar(d, true);
  const clone = tr(d).cloneNode(true) as Element; tr(d).remove(); d.querySelector('tbody')!.append(clone);
  renderizar(d, true);
  assert.equal(clone.querySelectorAll('.spro-anotacao').length, 1);
  const botao = clone.querySelector<HTMLButtonElement>('.spro-anotacao-seta')!;
  botao.click();
  assert.equal(botao.getAttribute('aria-expanded'), 'true');
  assert.equal(clone.querySelector('.spro-anotacao')!.classList.contains('spro-anotacao-expandida'), true);
});
// O linkedom ignora a fase de captura; a ordem real (documento antes da linha) é conferida no Chrome.
await teste('clique na seta é cancelado e para de propagar', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana'));
  renderizar(d, true);
  const seta = d.querySelector('.spro-anotacao-seta')!;
  const evento = new (d.defaultView as unknown as typeof globalThis).Event('click', { bubbles: true, cancelable: true });
  let parou = false;
  const parar = evento.stopPropagation.bind(evento);
  evento.stopPropagation = () => { parou = true; parar(); };
  seta.addEventListener('click', aoClicarSeta);
  seta.dispatchEvent(evento);
  assert.equal(evento.defaultPrevented, true);
  assert.equal(parou, true);
});
await teste('seta só aparece com transbordamento medido e recolhe quando cabe', () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / nota / ana'));
  d.addEventListener('click', aoClicarSeta, true);
  renderizar(d, true);
  const texto = d.querySelector<HTMLElement>('.spro-anotacao-texto')!;
  const botao = d.querySelector<HTMLButtonElement>('.spro-anotacao-seta')!;
  let total = 28;
  Object.defineProperty(texto, 'clientHeight', { get: () => 28 });
  Object.defineProperty(texto, 'scrollHeight', { get: () => total });
  renderizar(d, true); assert.equal(botao.hidden, true);
  total = 65; renderizar(d, true); assert.equal(botao.hidden, false);
  botao.click(); assert.equal(botao.getAttribute('aria-expanded'), 'true');
  total = 28; renderizar(d, true);
  assert.equal(botao.hidden, true);
  assert.equal(botao.getAttribute('aria-expanded'), 'false');
  assert.equal(d.querySelector('.spro-anotacao-expandida'), null);
});
await teste('núcleo (agente e favoritos) lê a mesma linha com o cartão', () => {
  const d = fixture41(); const linha = d.querySelector('#P148265')!;
  const antes = lerLinhaCaixa(linha, 'recebidos');
  renderizar(d, true);
  assert.ok(linha.querySelector('.spro-anotacao'));
  assert.deepEqual(lerLinhaCaixa(linha, 'recebidos'), antes);
});

// ---- ciclo de vida ----
await teste('opção ao vivo, linhas novas e encerramento', async () => {
  const d = tabela(linha5('Anota&ccedil;&atilde;o / primeira / ana'));
  const c = iniciar(d);
  c.configurar(false); await esperar(); assert.equal(d.querySelectorAll('.spro-anotacao').length, 0);
  c.configurar(true); assert.equal(d.querySelectorAll('.spro-anotacao').length, 1);
  d.querySelector('tbody')!.insertAdjacentHTML('beforeend', linha5('Anota&ccedil;&atilde;o / segunda / ana').replace('P42', 'P43'));
  await esperar(); assert.equal(d.querySelectorAll('.spro-anotacao').length, 2);
  d.querySelector('a[href*=anotacao_registrar]')!.setAttribute('aria-label', 'Anotação / alterada / ana');
  await esperar(); assert.equal(d.querySelector('.spro-anotacao-texto')!.textContent, 'alterada');
  c.configurar(false); assert.equal(d.querySelectorAll('.spro-anotacao').length, 0);
  c.configurar(true); c.fechar();
  assert.equal(d.querySelectorAll('.spro-anotacao').length, 0);
  d.querySelector('tbody')!.insertAdjacentHTML('beforeend', linha5('Anota&ccedil;&atilde;o / depois / ana').replace('P42', 'P44'));
  await esperar(); assert.equal(d.querySelectorAll('.spro-anotacao').length, 0);
});

console.log(`${n} verificações passaram.`);
