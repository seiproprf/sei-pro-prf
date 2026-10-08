/**
 * Cartão da anotação dentro da célula do processo, logo abaixo do número. Não
 * cria coluna nem esconde o ícone nativo (que continua abrindo a edição), então
 * o legado que lê as colunas por posição não percebe nada. O estado fica no
 * próprio cartão (`data-spro-chave`) e a seta usa um ouvinte único no
 * documento: as linhas que o agrupamento do SEI Pro clona seguem funcionando.
 */
import { icone } from '../../sei-comum/src/ui/dom';
import { type Anotacao, lerAnotacaoDaLinha } from './leitura';

/** Recebidos e Gerados; a visão detalhada já tem a coluna Anotação do SEI. */
export const TABELAS = '#tblProcessosRecebidos, #tblProcessosGerados';
const PROCESSO = 'a[href*="acao=procedimento_trabalhar"]';

const chaveDe = (nota: Anotacao) => JSON.stringify([nota.texto, nota.autor, nota.prioridade]);

/** O chevron é o mesmo nos dois estados; quem o gira é o CSS. */
function definirSeta(seta: Element, expandida: boolean): void {
  const rotulo = expandida ? 'Recolher anotação' : 'Ver anotação completa';
  seta.setAttribute('aria-expanded', String(expandida));
  seta.setAttribute('title', rotulo);
  seta.setAttribute('aria-label', rotulo);
}

function elemento(doc: Document, tag: 'div' | 'span', classe: string, texto?: string): HTMLElement {
  const el = doc.createElement(tag);
  el.className = classe;
  if (texto !== undefined) el.textContent = texto;
  return el;
}

// Checklist das anotações do SEI Pro: "[ ]" ou "[X]" (aceita "[x]") no INÍCIO da linha.
const ITEM = /^\s*\[( |x|X)\]\s?(.*)$/;

/** Só desenho: não é <input>, não tem clique e não grava nada. */
function caixa(doc: Document, feito: boolean): HTMLElement {
  const el = elemento(doc, 'span', 'spro-anotacao-caixa');
  el.setAttribute('role', 'img');
  el.setAttribute('aria-label', feito ? 'concluído' : 'pendente');
  if (feito) el.append(icone('check', 10, doc));
  return el;
}

function criarLinha(doc: Document, linha: string): HTMLElement {
  const item = ITEM.exec(linha);
  if (!item) {
    const el = elemento(doc, 'div', 'spro-anotacao-linha');
    el.append(elemento(doc, 'span', 'spro-anotacao-conteudo', linha));
    return el;
  }
  const feito = item[1] !== ' ';
  const el = elemento(doc, 'div', `spro-anotacao-linha spro-anotacao-item${feito ? ' spro-anotacao-item-feito' : ''}`);
  el.append(caixa(doc, feito), elemento(doc, 'span', 'spro-anotacao-conteudo', item[2]));
  return el;
}

/** [ícone de nota] [linhas (com a pílula de prioridade) + rodapé "autor · data"] [seta]. */
function criarCartao(doc: Document, nota: Anotacao): HTMLElement {
  const cartao = elemento(doc, 'div', nota.prioridade ? 'spro-anotacao spro-anotacao-prioridade' : 'spro-anotacao');
  cartao.setAttribute('data-spro-chave', chaveDe(nota));
  if (nota.autor) cartao.setAttribute('title', `Anotação de ${nota.autor}`);
  const texto = elemento(doc, 'div', 'spro-anotacao-texto');
  texto.append(...nota.texto.split('\n').map(linha => criarLinha(doc, linha)));
  // A cor não basta para dizer "prioridade": a pílula diz com texto. Antes de
  // texto comum, vai na mesma linha; antes de item do checklist, numa linha
  // própria (na mesma linha, pílula + caixa esmagam o item em célula estreita).
  if (nota.prioridade) {
    const pilula = elemento(doc, 'span', 'spro-anotacao-pilula', 'Prioridade');
    const primeira = texto.firstElementChild;
    if (primeira?.classList.contains('spro-anotacao-item')) texto.prepend(pilula);
    else primeira?.prepend(pilula);
  }
  const corpo = elemento(doc, 'div', 'spro-anotacao-corpo');
  corpo.append(texto);
  // "sigla em dd/mm/aaaa hh:mm" vira "sigla · dd/mm/aaaa hh:mm", como as datas dos favoritos.
  if (nota.autor) corpo.append(elemento(doc, 'div', 'spro-anotacao-rodape', nota.autor.replace(' em ', ' · ')));
  // A seta nasce oculta e só aparece depois de medir o texto na largura real.
  const seta = doc.createElement('button');
  seta.setAttribute('type', 'button');
  seta.className = 'spro-anotacao-seta';
  seta.hidden = true;
  seta.append(icone('chevron', 14, doc));
  definirSeta(seta, false);
  cartao.append(icone('nota', 14, doc), corpo, seta);
  return cartao;
}

/** Mede em três passadas (escreve, lê, escreve) para não forçar um layout por cartão. */
function atualizarSetas(cartoes: HTMLElement[]): void {
  const expandidos = cartoes.map(cartao => cartao.classList.contains('spro-anotacao-expandida'));
  for (const cartao of cartoes) cartao.classList.remove('spro-anotacao-expandida');
  const transborda = cartoes.map(cartao => {
    const texto = cartao.querySelector<HTMLElement>('.spro-anotacao-texto');
    return !!texto && texto.clientHeight > 0 && texto.scrollHeight > texto.clientHeight + 1;
  });
  cartoes.forEach((cartao, i) => {
    const seta = cartao.querySelector<HTMLButtonElement>('.spro-anotacao-seta');
    if (!seta) return;
    seta.hidden = !transborda[i];
    if (transborda[i] && expandidos[i]) cartao.classList.add('spro-anotacao-expandida');
    else if (expandidos[i]) definirSeta(seta, false);
  });
}

/** Põe, atualiza ou retira os cartões; desligado, devolve as células como eram. */
export function renderizar(doc: Document, ligada: boolean): void {
  const visiveis: HTMLElement[] = [];
  for (const tabela of doc.querySelectorAll(TABELAS)) {
    for (const linha of tabela.querySelectorAll('tr')) {
      const celula = linha.querySelector(PROCESSO)?.closest('td');
      const nota = ligada && celula ? lerAnotacaoDaLinha(linha) : null;
      const chave = nota ? chaveDe(nota) : null;
      const cartoes = [...linha.querySelectorAll<HTMLElement>('.spro-anotacao')];
      const manter = cartoes.find(c => c.parentElement === celula && c.getAttribute('data-spro-chave') === chave);
      for (const cartao of cartoes) if (cartao !== manter) cartao.remove();
      if (!nota || !celula) continue;
      const cartao = manter ?? criarCartao(doc, nota);
      if (!manter) celula.append(cartao);
      visiveis.push(cartao);
    }
  }
  atualizarSetas(visiveis);
}

/** Ouvinte único (fase de captura no documento): o clique na seta não chega à linha. */
export function aoClicarSeta(evento: Event): void {
  const alvo = evento.target as Element | null;
  const seta = alvo?.closest?.('.spro-anotacao-seta');
  const cartao = seta?.closest('.spro-anotacao');
  if (!seta || !cartao) return;
  evento.preventDefault();
  evento.stopPropagation();
  const expandida = seta.getAttribute('aria-expanded') !== 'true';
  cartao.classList.toggle('spro-anotacao-expandida', expandida);
  definirSeta(seta, expandida);
}
