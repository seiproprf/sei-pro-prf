/**
 * Ciclo de vida, independente do Chrome: redesenha quando as tabelas mudam
 * (paginação, agrupamento, edição da anotação) e quando a largura delas muda
 * (a seta depende da largura). Nenhuma requisição: tudo vem da própria tela.
 */
import { aoClicarSeta, renderizar, TABELAS } from './view';

export function iniciar(doc: Document) {
  const janela = doc.defaultView;
  let ligada = false;
  let encerrado = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const larguras = new Map<Element, number>();

  const dentro = (no: Node) => !!(no.nodeType === 1 ? (no as Element) : no.parentElement)?.closest?.(TABELAS);
  const contem = (no: Node) => no.nodeType === 1 && (!!(no as Element).closest?.(TABELAS) || !!(no as Element).querySelector?.(TABELAS));
  const mutacoes = janela?.MutationObserver
    ? new janela.MutationObserver(lista => {
        if (lista.some(m => dentro(m.target) || [...m.addedNodes].some(contem) || [...m.removedNodes].some(contem))) agendar();
      })
    : null;
  // Só a largura interessa: a altura muda com os próprios cartões.
  const tamanho = janela?.ResizeObserver
    ? new janela.ResizeObserver(entradas => {
        let mudou = false;
        for (const { target, contentRect } of entradas) {
          if (larguras.get(target) !== contentRect.width) mudou = true;
          larguras.set(target, contentRect.width);
        }
        if (mudou) agendar();
      })
    : null;

  function agendar() {
    if (encerrado || !ligada || timer !== undefined) return;
    timer = setTimeout(() => { timer = undefined; atualizar(); }, 40);
  }
  function parar() {
    clearTimeout(timer); timer = undefined;
    mutacoes?.disconnect(); tamanho?.disconnect(); larguras.clear();
    doc.removeEventListener('click', aoClicarSeta, true);
  }
  function atualizar() {
    // Desconecta para não reagir às próprias mudanças.
    mutacoes?.disconnect();
    renderizar(doc, ligada);
    if (!ligada) return;
    const tabelas = new Set(doc.querySelectorAll(TABELAS));
    for (const tabela of [...larguras.keys()]) if (!tabelas.has(tabela)) { tamanho?.unobserve(tabela); larguras.delete(tabela); }
    for (const tabela of tabelas) if (!larguras.has(tabela)) { larguras.set(tabela, -1); tamanho?.observe(tabela); }
    mutacoes?.observe(doc.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-label', 'onmouseover', 'src', 'href'] });
  }

  return {
    configurar(valor: boolean) {
      if (encerrado) return;
      ligada = valor;
      parar();
      if (ligada) doc.addEventListener('click', aoClicarSeta, true);
      atualizar();
    },
    fechar() {
      encerrado = true;
      parar();
      renderizar(doc, false);
    },
  };
}
