import { tokens, corresponde } from './texto';
import { TABELAS, GRUPOS, camposDaLinha, buscarCampo, type Contexto } from './leitura';
import { destacar, limpar } from './destaque';
export const OCULTA = 'spro-pesquisa-oculta';
const DICA = 'Digite para filtrar a página atual. Enter mantém a pesquisa rápida nativa.';

/** Ciclo de vida do content script, sem Chrome, rede ou jQuery. */
export function iniciar(doc: Document, contexto: Contexto, campo = () => buscarCampo(doc)) {
  let ligada = false;
  let encerrado = false;
  let input: HTMLInputElement | null = null;
  let titulo: string | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let procura: ReturnType<typeof setInterval> | undefined;
  const observer = doc.defaultView?.MutationObserver ? new doc.defaultView.MutationObserver(agendar) : null;
  function observar() {
    if (ligada && doc.body)
      observer?.observe(doc.body, {
        subtree: true,
        childList: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['title', 'aria-label', 'alt', 'onmouseover', 'data-tagname'],
      });
  }
  function adotarCampo() {
    let novo: HTMLInputElement | null = null;
    try {
      novo = campo();
    } catch {
      /* Cabeçalho inacessível. */
    }
    if (novo === input) return;
    soltarCampo();
    input = novo;
    if (input) {
      if (contexto === 'lista' && input.ownerDocument === doc) {
        titulo = input.getAttribute('title');
        input.setAttribute('title', DICA);
      }
      input.addEventListener('input', agendar);
      input.addEventListener('keydown', tecla);
    }
  }
  function soltarCampo() {
    if (!input) return;
    input.removeEventListener('input', agendar);
    input.removeEventListener('keydown', tecla);
    if (contexto === 'lista' && input.ownerDocument === doc) {
      if (titulo === null) input.removeAttribute('title');
      else input.setAttribute('title', titulo);
    }
    input = null;
  }
  function atualizar() {
    clearTimeout(timer);
    timer = undefined;
    observer?.disconnect();
    if (ligada) adotarCampo();
    const termos = ligada ? tokens(input?.value ?? '') : [];
    if (contexto === 'lista') {
      for (const tabela of doc.querySelectorAll(TABELAS)) {
        let grupo: Element[] = [];
        let temProcessos = false;
        let visivel = false;
        const fecharGrupo = () => {
          for (const cabecalho of grupo) cabecalho.classList.toggle(OCULTA, termos.length > 0 && !visivel);
        };
        for (const linha of tabela.querySelectorAll('tbody > tr')) {
          if (linha.matches(GRUPOS)) {
            // A contagem e o título são linhas consecutivas do mesmo agrupamento.
            if (temProcessos) {
              fecharGrupo();
              grupo = [];
              visivel = false;
              temProcessos = false;
            }
            grupo.push(linha);
            continue;
          }
          if (!linha.querySelector('td')) continue;
          temProcessos = true;
          const casa = corresponde(camposDaLinha(linha), termos);
          linha.classList.toggle(OCULTA, !casa);
          if (casa) visivel = true;
        }
        fecharGrupo();
      }
      if (!termos.length) for (const el of doc.querySelectorAll(`.${OCULTA}`)) el.classList.remove(OCULTA);
    }
    destacar(doc, termos, contexto === 'lista');
    observar();
  }
  function agendar() {
    if (!ligada || encerrado) return;
    clearTimeout(timer);
    timer = setTimeout(atualizar, 120);
  }
  function tecla(evento: KeyboardEvent) {
    if (evento.key !== 'Escape' || !input) return;
    input.value = '';
    atualizar();
    // Todos os frames ouvem input; Escape precisa limpar os destaques dos irmãos também.
    input.dispatchEvent(new input.ownerDocument.defaultView!.Event('input', { bubbles: true }));
  }
  function parar() {
    clearTimeout(timer);
    clearInterval(procura);
    observer?.disconnect();
    soltarCampo();
  }
  return {
    configurar(valor: boolean) {
      if (encerrado) return;
      parar();
      ligada = valor;
      atualizar();
      if (ligada)
        procura = setInterval(() => {
          const antes = input;
          adotarCampo();
          if (input !== antes) atualizar();
        }, 500);
    },
    fechar() {
      if (encerrado) return;
      ligada = false;
      parar();
      atualizar();
      limpar(doc);
      encerrado = true;
    },
  };
}
