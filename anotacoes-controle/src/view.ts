import { prepararColuna } from './layout';
import { lerAnotacaoDaLinha, type Anotacao } from './leitura';
export const TABELAS = '#tblProcessosRecebidos, #tblProcessosGerados, #tblProcessosDetalhado';
function remover(linha: Element): void {
  const estado = estados.get(linha);
  if (!estado) return;
  const restaurar = estado.card.parentNode === estado.celula;
  estado.card.remove();
  if (restaurar && estado.original?.parentNode === estado.celula) estado.original.replaceWith(...estado.original.childNodes);
  estados.delete(linha);
}
function textoNativoDe(nos: Iterable<Node>): string {
  return [...nos].map(no => {
    if (no.nodeType === 3) return no.textContent ?? '';
    if (no.nodeName === 'BR') return '\n';
    const valor = textoNativoDe(no.childNodes);
    return /^(DIV|P|LI)$/.test(no.nodeName) ? `${valor}\n` : valor;
  }).join('');
}
/** Mede o texto recolhido na largura real; não estima pelo número de caracteres. */
function atualizarExpansao(doc: Document): void {
  for (const card of doc.querySelectorAll<HTMLElement>('.spro-anotacao')) {
    const texto = card.querySelector<HTMLElement>('.spro-anotacao-texto');
    const botao = card.querySelector<HTMLButtonElement>('button');
    if (!texto || !botao) continue;
    const expandido = card.classList.contains('spro-anotacao-expandida');
    card.classList.remove('spro-anotacao-expandida', 'spro-anotacao-expansivel');
    const transborda = texto.clientHeight > 0 && texto.scrollHeight > texto.clientHeight + 1;
    botao.hidden = !transborda;
    card.classList.toggle('spro-anotacao-expansivel', transborda);
    card.classList.toggle('spro-anotacao-expandida', transborda && expandido);
    if (!transborda && expandido) {
      botao.setAttribute('aria-expanded', 'false'); botao.textContent = '⌄';
      botao.title = 'Ver anotação completa'; botao.setAttribute('aria-label', botao.title);
    }
  }
}
const estados = new WeakMap<Element, { chave: string; card: HTMLElement; original?: HTMLElement; celula: Element }>();
/** Cartão na coluna própria; mantém os links nativos para leitura e restauração. */
export function renderizar(doc: Document, ligada: boolean, prioridades: ReadonlyMap<string, boolean> = new Map()): Anotacao[] {
  const notas: Anotacao[] = [];
  let mudouLayout = false;
  const mudaColunas = [...doc.querySelectorAll(TABELAS)].some(tabela => {
    const extra = !!tabela.querySelector('.spro-anotacao-cabecalho');
    const nativa = tabela.id === 'tblProcessosDetalhado' && [...tabela.querySelectorAll('th')].some(th => /anota[\u00e7c][\u00e3a]o/i.test(th.textContent ?? '') && !th.classList.contains('spro-anotacao-cabecalho'));
    return !nativa && !!tabela.querySelector('a[href*="acao=procedimento_trabalhar"]') && extra !== ligada;
  });
  if (mudaColunas) doc.dispatchEvent(new (doc.defaultView?.Event ?? Event)('spro-anotacoes-antes-colunas'));

  for (const tabela of doc.querySelectorAll(TABELAS)) {
    if (!ligada) {
      for (const linha of tabela.querySelectorAll('tr')) remover(linha);
      for (const card of tabela.querySelectorAll('.spro-anotacao')) card.remove();
      for (const original of tabela.querySelectorAll('.spro-anotacao-original')) original.replaceWith(...original.childNodes);
      for (const link of tabela.querySelectorAll('.spro-anotacao-icone-oculto')) link.classList.remove('spro-anotacao-icone-oculto');
    }
    mudouLayout = prepararColuna(tabela, ligada) || mudouLayout;
    const cabecalhos = [...tabela.querySelectorAll('tr')].find(tr => tr.querySelector('th'));
    const colunaNota = [...(cabecalhos?.querySelectorAll('th') ?? [])].findIndex(th => /anota[\u00e7c][\u00e3a]o/i.test(th.textContent ?? ''));
    for (const linha of tabela.querySelectorAll('tr')) {
      const processo = linha.querySelector('a[href*="acao=procedimento_trabalhar"]');
      if (!processo) continue;
      const antiga = estados.get(linha);
      const detalhada = tabela.id === 'tblProcessosDetalhado' && colunaNota >= 0;
      const nativa = detalhada ? linha.querySelectorAll('td')[colunaNota] : null;
      const originalNativo = nativa?.querySelector('.spro-anotacao-original');
      const textoNativo = originalNativo ? textoNativoDe(originalNativo.childNodes) : nativa ? textoNativoDe(nativa.childNodes) : '';
      const lida = ligada ? lerAnotacaoDaLinha(linha) : null;
      const nota = ligada && textoNativo?.trim() ? { texto: textoNativo.trim(), autor: lida?.autor ?? '', href: lida?.href ?? '' } : lida;
      if (!nota) {
        remover(linha);
        for (const sobrando of linha.querySelectorAll('.spro-anotacao')) sobrando.remove();
        linha.querySelector('.spro-anotacao-icone-oculto')?.classList.remove('spro-anotacao-icone-oculto');
        continue;
      }
      notas.push(nota);
      linha.querySelector('a[href*="acao=anotacao_registrar"]')?.classList.add('spro-anotacao-icone-oculto');
      const prioridade = prioridades.get(nota.href) === true;
      const chave = JSON.stringify([nota, prioridade]);
      if (antiga?.chave === chave && antiga.card.isConnected) continue;
      remover(linha);
      // O SEI Pro clona linhas ao agrupar: WeakMap não acompanha clones.
      for (const sobrando of linha.querySelectorAll('.spro-anotacao')) sobrando.remove();
      // Na visão detalhada o SEI já oferece coluna própria; mantém seu conteúdo nativo.
      const celula = detalhada
        ? linha.querySelectorAll('td')[colunaNota] : linha.querySelector('td.spro-anotacao-coluna');
      if (!celula) continue;
      const card = doc.createElement('div'); card.className = `spro-anotacao${prioridade ? ' spro-anotacao-prioridade' : ''}`;
      const conteudo = doc.createElement('div'); conteudo.className = 'spro-anotacao-texto'; conteudo.textContent = nota.texto;
      if (nota.autor) card.title = `Anotação de ${nota.autor}`;
      card.append(conteudo);
      // A seta nasce oculta e só aparece após medir o conteúdo renderizado.
      const botao = doc.createElement('button'); botao.type = 'button'; botao.hidden = true; botao.textContent = '⌄';
      botao.title = 'Ver anotação completa'; botao.setAttribute('aria-label', botao.title); botao.setAttribute('aria-expanded', 'false');
      botao.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        const expandido = botao.getAttribute('aria-expanded') !== 'true';
        botao.setAttribute('aria-expanded', String(expandido));
        card.classList.toggle('spro-anotacao-expandida', expandido);
        botao.textContent = expandido ? '⌃' : '⌄';
        botao.title = expandido ? 'Recolher anotação' : 'Ver anotação completa'; botao.setAttribute('aria-label', botao.title);
      });
      let original: HTMLElement | undefined;
      if (detalhada) {
        original = celula.querySelector<HTMLElement>('.spro-anotacao-original') ?? undefined;
        if (!original) {
          original = doc.createElement('span'); original.className = 'spro-anotacao-original'; original.hidden = true;
          original.append(...celula.childNodes); celula.append(original);
        }
      }
      card.append(botao); celula.prepend(card); estados.set(linha, { chave, card, original, celula });
    }
  }
  if (mudouLayout) doc.dispatchEvent(new (doc.defaultView?.Event ?? Event)('spro-anotacoes-colunas'));
  atualizarExpansao(doc);
  return notas;
}
