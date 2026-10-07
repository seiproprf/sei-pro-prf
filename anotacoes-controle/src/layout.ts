/** Coluna visual própria; classes identificam células extras para os leitores antigos. */
export function prepararColuna(tabela: Element, ligada: boolean): boolean {
  const doc = tabela.ownerDocument;
  let mudou = false;
  tabela.classList.toggle('spro-anotacao-layout', ligada);
  if (!ligada) {
    for (const el of tabela.querySelectorAll('.spro-anotacao-coluna, .spro-anotacao-cabecalho, .spro-anotacao-apoio')) { el.remove(); mudou = true; }
    for (const th of tabela.querySelectorAll('[data-spro-colspan]')) {
      th.setAttribute('colspan', th.getAttribute('data-spro-colspan')!); th.removeAttribute('data-spro-colspan');
    }
    return mudou;
  }
  // A visão detalhada já tem uma coluna nativa de anotação.
  const header = [...tabela.querySelectorAll('tr')].find(tr => tr.querySelector('th') && !tr.classList.contains('tablesorter-filter-row'));
  if (tabela.id === 'tblProcessosDetalhado' && [...(header?.querySelectorAll('th') ?? [])].some(th => /anota[\u00e7c][\u00e3a]o/i.test(th.textContent ?? '') && !th.classList.contains('spro-anotacao-cabecalho'))) return false;
  const primeira = [...tabela.querySelectorAll('tr')].find(tr => tr.querySelector('a[href*="acao=procedimento_trabalhar"]'));
  const processo = primeira?.querySelector('a[href*="acao=procedimento_trabalhar"]')?.closest('td');
  if (!processo || !primeira) return false;
  const indice = [...primeira.querySelectorAll('td:not(.spro-anotacao-coluna)')].indexOf(processo);
  for (const linha of tabela.querySelectorAll('tr')) {
    const celula = linha.querySelector('a[href*="acao=procedimento_trabalhar"]')?.closest('td');
    if (!celula) continue;
    const extras = [...linha.querySelectorAll('td.spro-anotacao-coluna')];
    let nota = extras.shift();
    for (const extra of extras) extra.remove();
    if (!nota) { nota = doc.createElement('td'); nota.className = 'spro-anotacao-coluna'; mudou = true; }
    if (nota.nextElementSibling !== celula) celula.before(nota);
  }
  if (header && !header.querySelector('.spro-anotacao-cabecalho')) {
    let posicao = 0;
    for (const th of [...header.querySelectorAll('th')]) {
      const span = Number(th.getAttribute('colspan') ?? 1);
      if (posicao <= indice && posicao + span > indice) {
        if (span > 1) {
          th.setAttribute('data-spro-colspan', String(span)); th.removeAttribute('colspan');
          // Mesmo cabeçalho simples que o tablesorter já monta no SEI 4/5.
          for (let i = posicao; i < posicao + span; i++) {
            if (i === indice) continue;
            const apoio = doc.createElement('th'); apoio.className = `${th.className} spro-anotacao-apoio`;
            if (i < indice) th.before(apoio); else th.after(apoio);
          }
        }
        const novo = doc.createElement('th'); novo.className = `${th.className} spro-anotacao-cabecalho`;
        novo.textContent = 'Anotação'; th.before(novo); mudou = true; break;
      }
      posicao += span;
    }
  }
  return mudou;
}
