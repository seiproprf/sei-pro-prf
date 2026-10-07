import { lerAnotacaoDaLinha, type Anotacao } from './leitura';
export const TABELAS = '#tblProcessosRecebidos, #tblProcessosGerados, #tblProcessosDetalhado';
function remover(linha: Element): void {
  const estado = estados.get(linha);
  if (!estado) return;
  const restaurar = estado.card.parentNode === estado.celula;
  estado.card.remove();
  if (restaurar && estado.original) estado.celula.append(...estado.original);
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
const estados = new WeakMap<Element, { chave: string; card: HTMLElement; original?: Node[]; celula: Element }>();
/** Não insere colunas: mantém o contrato das tabelas com o SEI, núcleo e tablesorter. */
export function renderizar(doc: Document, ligada: boolean, prioridades: ReadonlyMap<string, boolean> = new Map()): Anotacao[] {
  const notas: Anotacao[] = [];
  for (const tabela of doc.querySelectorAll(TABELAS)) {
    const cabecalhos = [...tabela.querySelectorAll('tr')].find(tr => tr.querySelector('th'));
    const colunaNota = [...(cabecalhos?.querySelectorAll('th') ?? [])].findIndex(th => /anota[\u00e7c][\u00e3a]o/i.test(th.textContent ?? ''));
    for (const linha of tabela.querySelectorAll('tr')) {
      const processo = linha.querySelector('a[href*="acao=procedimento_trabalhar"]');
      if (!processo) continue;
      const antiga = estados.get(linha);
      const detalhada = tabela.id === 'tblProcessosDetalhado' && colunaNota >= 0;
      const nativa = detalhada ? linha.querySelectorAll('td')[colunaNota] : null;
      const textoNativo = antiga?.original && antiga.card.parentNode === nativa ? textoNativoDe(antiga.original) : nativa ? textoNativoDe(nativa.childNodes) : '';
      const lida = ligada ? lerAnotacaoDaLinha(linha) : null;
      const nota = ligada && textoNativo?.trim() ? { texto: textoNativo.trim(), autor: lida?.autor ?? '', href: lida?.href ?? '' } : lida;
      if (!nota) { remover(linha); continue; }
      notas.push(nota);
      const prioridade = prioridades.get(nota.href) === true;
      const chave = JSON.stringify([nota, prioridade]);
      if (antiga?.chave === chave && antiga.card.isConnected) continue;
      remover(linha);
      // Na visão detalhada o SEI já oferece coluna própria; mantém seu conteúdo nativo.
      const celula = detalhada
        ? linha.querySelectorAll('td')[colunaNota] : processo.closest('td');
      if (!celula) continue;
      const card = doc.createElement('div'); card.className = `spro-anotacao${prioridade ? ' spro-anotacao-prioridade' : ''}`;
      const conteudo = doc.createElement('div'); conteudo.className = 'spro-anotacao-texto'; conteudo.textContent = nota.texto;
      if (nota.autor) card.title = `Anotação de ${nota.autor}`;
      card.append(conteudo);
      // O botão funciona também para textos de uma linha que quebram com a largura da tabela.
      const botao = doc.createElement('button'); botao.type = 'button'; botao.textContent = '⌄';
      botao.title = 'Ver anotação completa'; botao.setAttribute('aria-label', botao.title); botao.setAttribute('aria-expanded', 'false');
      botao.addEventListener('click', event => {
        event.preventDefault(); event.stopPropagation();
        const expandido = botao.getAttribute('aria-expanded') !== 'true';
        botao.setAttribute('aria-expanded', String(expandido));
        card.classList.toggle('spro-anotacao-expandida', expandido);
        botao.textContent = expandido ? '⌃' : '⌄';
        botao.title = expandido ? 'Recolher anotação' : 'Ver anotação completa'; botao.setAttribute('aria-label', botao.title);
      });
      const original = detalhada ? [...celula.childNodes] : undefined;
      if (original) celula.replaceChildren();
      card.append(botao); celula.prepend(card); estados.set(linha, { chave, card, original, celula });
    }
  }
  return notas;
}
