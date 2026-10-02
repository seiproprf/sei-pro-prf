/**
 * Camada flutuante (lista do combobox, menu): onde anexar, onde posicionar e
 * quando fechar. Fica em `position: fixed` e, por isso, não é cortada por
 * nenhum `overflow` de quem a abriu.
 *
 * Onde anexar:
 * - dentro de um `<dialog>` modal aberto, no próprio diálogo: o resto da página
 *   fica inerte e abaixo da camada de cima (top layer);
 * - numa Shadow Root (o balão da página do SEI), nela, para herdar o estilo;
 * - senão, no `body`.
 *
 * Avisa pelo evento `spro-popover` da janela até onde a camada desce: o iframe
 * abaixo da lista de processos cresce com o conteúdo e precisa saber.
 */

export interface OpcoesFlutuante {
  /** Alinha a borda direita da camada com a da âncora (menus de ação no canto). */
  alinharDireita?: boolean;
  /** Largura mínima; o padrão é a largura da âncora. */
  larguraMinima?: number;
  /** Largura fixa (ignora a da âncora). */
  largura?: number;
  /** Altura máxima. */
  alturaMaxima?: number;
  /** Clique fora ou rolagem da página fecharam. */
  aoFechar: () => void;
}

export interface Flutuante {
  posicionar(): void;
  fechar(): void;
}

/** Onde a camada deve morar para ficar visível e clicável a partir da âncora. */
export function destinoDaCamada(ancora: Element): ParentNode {
  const dialogo = ancora.closest?.("dialog[open]");
  if (dialogo) return dialogo;
  const raiz = ancora.getRootNode?.() as (Node & { host?: Element }) | undefined;
  const doc = ancora.ownerDocument;
  if (raiz && raiz !== doc && raiz.host) return raiz as unknown as ShadowRoot;
  return doc.body ?? doc.documentElement;
}

function anunciar(janela: Window | null, fundo: number): void {
  const w = janela as (Window & { CustomEvent?: typeof CustomEvent }) | null;
  try {
    if (w?.CustomEvent) w.dispatchEvent(new w.CustomEvent("spro-popover", { detail: { fundo } }));
  } catch {
    /* sem janela de verdade (testes) */
  }
}

export function abrirFlutuante(ancora: HTMLElement, camada: HTMLElement, o: OpcoesFlutuante): Flutuante {
  const doc = ancora.ownerDocument;
  const janela = doc.defaultView;
  destinoDaCamada(ancora).append(camada);
  let aberta = true;

  const posicionar = () => {
    if (!aberta) return;
    const r = ancora.getBoundingClientRect?.();
    if (!r) return;
    const altJanela = janela?.innerHeight ?? 0;
    const largJanela = janela?.innerWidth ?? 0;
    const largura = Math.min(o.largura ?? Math.max(r.width, o.larguraMinima ?? 0), Math.max(180, largJanela - 16));
    const esquerdaIdeal = o.alinharDireita ? r.right - largura : r.left;
    const esquerda = Math.max(8, Math.min(esquerdaIdeal, largJanela - largura - 8));
    const maxima = o.alturaMaxima ?? 360;
    const desejada = Math.min(camada.scrollHeight || maxima, maxima);
    const embaixo = altJanela - r.bottom - 8;
    const emCima = r.top - 8;
    const paraCima = embaixo < Math.min(desejada, 200) && emCima > embaixo;
    camada.style.left = `${esquerda}px`;
    camada.style.width = `${largura}px`;
    camada.style.maxHeight = `${Math.max(140, Math.min(maxima, paraCima ? emCima : embaixo > 140 ? embaixo : maxima))}px`;
    camada.classList.toggle("spro-flutuante-cima", paraCima);
    if (paraCima) {
      camada.style.top = "";
      camada.style.bottom = `${altJanela - r.top + 4}px`;
    } else {
      camada.style.bottom = "";
      camada.style.top = `${r.bottom + 4}px`;
    }
    anunciar(janela, paraCima ? 0 : Math.ceil(r.bottom + 4 + desejada + 12));
  };

  const fora = (ev: Event) => {
    const caminho = (ev.composedPath?.() ?? []) as EventTarget[];
    const alvo = ev.target as Node | null;
    const dentro = (no: Node) => caminho.includes(no) || (!!alvo && !!no.contains?.(alvo));
    if (dentro(camada) || dentro(ancora)) return;
    o.aoFechar();
  };
  const rolou = (ev: Event) => {
    if (ev.target instanceof Node && camada.contains(ev.target)) return;
    posicionar();
  };
  doc.addEventListener("pointerdown", fora, true);
  janela?.addEventListener("scroll", rolou, true);
  janela?.addEventListener("resize", posicionar);
  posicionar();

  return {
    posicionar,
    fechar() {
      if (!aberta) return;
      aberta = false;
      doc.removeEventListener("pointerdown", fora, true);
      janela?.removeEventListener("scroll", rolou, true);
      janela?.removeEventListener("resize", posicionar);
      camada.remove();
      anunciar(janela, 0);
    },
  };
}
