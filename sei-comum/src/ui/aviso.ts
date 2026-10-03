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

/**
 * Onde o aviso mora: dentro do `<dialog>` modal aberto de cima, quando há um.
 * Com `showModal()`, tudo fora do diálogo fica inerte: preso ao `body`, o
 * "Desfazer" não recebe o clique (que atravessa para a linha de baixo ou cai
 * no véu e fecha o modal). Mesma regra das listas flutuantes (flutuante.ts).
 * Diálogo aberto com `show()` não torna nada inerte: aí o aviso fica no `body`.
 * Sem `:modal` no navegador, vale o último `dialog[open]`.
 */
export function destinoDoAviso(doc: Document): HTMLElement {
  const abertos = [...doc.querySelectorAll<HTMLDialogElement>("dialog[open]")];
  let conheceModal = true;
  const modais = abertos.filter((d) => {
    try {
      return d.matches(":modal");
    } catch {
      conheceModal = false;
      return false;
    }
  });
  const dialogo = modais.at(-1) ?? (conheceModal ? undefined : abertos.at(-1));
  return dialogo ?? doc.body ?? doc.documentElement;
}

export function mostrarAviso(doc: Document, texto: string, acao: AcaoAviso | undefined, ms: number): HTMLElement {
  const fundo = doc.body ?? doc.documentElement;
  // Um aviso por vez, esteja o anterior no body ou num diálogo.
  for (const lugar of [fundo, ...doc.querySelectorAll("dialog")])
    for (const velho of [...lugar.children]) if (velho.classList.contains("spro-aviso")) velho.remove();
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
  const mostrar = () => {
    try {
      (el as HTMLElement & { showPopover?: () => void }).showPopover?.();
    } catch {
      /* navegador sem popover: fica como elemento fixo comum */
    }
  };
  const anexar = () => {
    const destino = destinoDoAviso(doc);
    destino.append(el);
    mostrar();
    // O diálogo fecha com o aviso na tela (o "Desfazer" ainda vale): o aviso desce para o próximo lugar.
    if (destino.localName === "dialog")
      destino.addEventListener(
        "close",
        () => {
          if (vivo && destino.contains(el)) anexar();
        },
        { once: true },
      );
  };
  let vivo = true;
  anexar();
  setTimeout(() => {
    vivo = false;
    el.remove();
  }, ms);
  return el;
}
