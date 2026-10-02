import { h, icone } from "@comum/ui/dom";

export interface AcaoAviso {
  rotulo: string;
  fazer(): void;
}

/**
 * Quem mostra o aviso fora do app. No painel abaixo da lista, o iframe cresce
 * com o conteúdo e um aviso preso ao rodapé dele ficaria fora da vista: a aba
 * do SEI o mostra no rodapé da tela visível (pagina/aviso.ts). Devolve false
 * para o app mostrar ele mesmo.
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
  raiz.append(el);
  setTimeout(() => el.remove(), ms);
  return el;
}
