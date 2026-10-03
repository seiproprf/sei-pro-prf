import { h, icone } from "./dom";

export interface AcaoAviso {
  rotulo: string;
  fazer(): void;
}

/**
 * Quem mostra o aviso fora do app, quando o app mora num iframe que não é o
 * lugar certo para ele (por exemplo, um iframe que cresce com o conteúdo: um
 * aviso preso ao rodapé dele ficaria fora da vista). O emissor mostra o aviso
 * na tela visível da página hospedeira. Devolve false para o app mostrar ele
 * mesmo.
 */
export type EmissorAviso = (texto: string, acao: AcaoAviso | undefined, ms: number) => boolean;

let emissor: EmissorAviso | null = null;

export function definirEmissorDeAviso(e: EmissorAviso | null): void {
  emissor = e;
}

/** Aviso curto (toast) no rodapé da tela, com uma ação opcional ("Desfazer"). */
export function avisar(texto: string, acao?: AcaoAviso, ms = 7000): void {
  if (emissor?.(texto, acao, ms)) return;
  mostrarAviso(document, texto, acao, ms);
}

export function mostrarAviso(doc: Document, texto: string, acao: AcaoAviso | undefined, ms: number): HTMLElement {
  const raiz = doc.body ?? doc.documentElement;
  for (const velho of [...raiz.children]) if (velho.classList.contains("spro-aviso")) velho.remove();
  const el: HTMLElement = h(
    "div",
    { class: "spro-aviso", role: "status" },
    icone("check", 16),
    h("span", {}, texto),
    acao
      ? h(
          "button",
          {
            type: "button",
            onclick: () => {
              el.remove();
              acao.fazer();
            },
          },
          acao.rotulo,
        )
      : null,
  );
  // Camada de cima (popover): por cima do véu de um diálogo aberto, e não escondido atrás dele.
  el.setAttribute("popover", "manual");
  raiz.append(el);
  try {
    (el as HTMLElement & { showPopover?: () => void }).showPopover?.();
  } catch {
    /* navegador sem popover: fica como elemento fixo comum */
  }
  setTimeout(() => el.remove(), ms);
  return el;
}
