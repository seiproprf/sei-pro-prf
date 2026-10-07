import { lerPrioridade } from './leitura';
import { renderizar, TABELAS } from './view';
export interface Dependencias {
  doc: Document;
  lerPagina: (href: string, sinal: AbortSignal) => Promise<Document>;
}
/** Ciclo de vida independente do Chrome; IO injetado usa o transporte do núcleo. */
export function iniciar({ doc, lerPagina }: Dependencias) {
  let ligada = false;
  let encerrado = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let geracao = 0;
  let abortar = new AbortController();
  const prioridades = new Map<string, boolean>();
  const tentadas = new Set<string>();
  const observados = new Set<HTMLElement>();
  const Resize = doc.defaultView?.ResizeObserver;
  const resize = Resize ? new Resize(() => agendar()) : null;
  doc.defaultView?.addEventListener('resize', agendar);
  const Observer = doc.defaultView?.MutationObserver;
  const observer = Observer ? new Observer(mudancas => {
    if (mudancas.some(m => ((m.target.nodeType === 1 ? m.target : m.target.parentElement) as Element | null)?.closest?.(TABELAS) || [...m.addedNodes, ...m.removedNodes].some(no => (no as Element).closest?.(TABELAS) || (no as Element).matches?.(TABELAS) || (no as Element).querySelector?.(TABELAS)))) agendar();
  }) : null;
  function observar() {
    if (!encerrado) observer?.observe(doc.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['onmouseover', 'aria-label', 'href'], characterData: true });
  }
  function agendar() {
    if (encerrado || timer !== undefined) return;
    timer = setTimeout(() => { timer = undefined; atualizar(); }, 40);
  }
  function atualizar() {
    if (encerrado) return;
    observer?.disconnect();
    const notas = renderizar(doc, ligada, prioridades);
    const cards = new Set(doc.querySelectorAll<HTMLElement>('.spro-anotacao'));
    for (const card of observados) if (!cards.has(card)) { resize?.unobserve(card); observados.delete(card); }
    for (const card of cards) if (!observados.has(card)) { resize?.observe(card); observados.add(card); }
    observar();
    if (!ligada) return;
    const pendentes = notas.filter(nota => {
      if (!nota.href || tentadas.has(nota.href)) return false;
      tentadas.add(nota.href);
      return true;
    });
    const atual = geracao;
    const sinal = abortar.signal;
    // No máximo duas leituras simultâneas; cada link é lido uma vez nesta tela.
    const ler = async () => {
      while (pendentes.length && ligada && atual === geracao && !encerrado) {
        const nota = pendentes.shift()!;
        try {
          const pagina = await lerPagina(nota.href, sinal);
          if (atual !== geracao || encerrado) return;
          prioridades.set(nota.href, lerPrioridade(pagina));
          agendar();
        } catch {
          // Mantém o texto da lista se a sessão ou leitura de prioridade falhar.
        }
      }
    };
    void ler(); void ler();
  }
  observar();
  return {
    configurar(valor: boolean) {
      if (encerrado) return;
      if (valor !== ligada) {
        geracao++; abortar.abort(); abortar = new AbortController();
        prioridades.clear(); tentadas.clear();
      }
      ligada = valor; atualizar();
    },
    fechar() {
      encerrado = true; abortar.abort(); observer?.disconnect(); resize?.disconnect(); observados.clear();
      doc.defaultView?.removeEventListener('resize', agendar); clearTimeout(timer);
      renderizar(doc, false);
    },
  };
}
