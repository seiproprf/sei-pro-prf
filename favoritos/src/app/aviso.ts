import { h } from "@comum/ui/dom";

/** Aviso curto no topo do app (dentro do iframe, um aviso preso embaixo ficaria fora da vista). */
export function avisar(texto: string, acao?: { rotulo: string; fazer(): void }, ms = 7000): void {
  const raiz = document.getElementById("app") ?? document.body;
  raiz.querySelector(".spro-aviso")?.remove();
  const el: HTMLElement = h(
    "div",
    { class: "spro-aviso", role: "status" },
    texto,
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
  raiz.prepend(el);
  setTimeout(() => el.remove(), ms);
}
