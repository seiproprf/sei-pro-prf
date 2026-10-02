/**
 * Menu de ações (o ⚙ das opções, o ⋯ de cada item): ícone em cada item,
 * separadores, dica à direita, item perigoso em vermelho. Teclado do padrão
 * ARIA de menu: setas, Home, End, Enter/Espaço, Esc e Tab; o foco anda pelos
 * itens (roving tabindex) e volta ao botão ao fechar.
 *
 * Os itens são montados a cada abertura (`itens()`): o menu sempre mostra o
 * estado do momento (por exemplo, "Marcar como visto" só com novidade).
 */

import { h, icone, type NomeIcone } from "./dom";
import { abrirFlutuante, type Flutuante } from "./flutuante";

export interface ItemMenu {
  rotulo: string;
  icone?: NomeIcone;
  fazer: () => void;
  perigo?: boolean;
  /** Texto curto à direita (atalho, quantidade). */
  dica?: string;
  desativado?: boolean;
}

/** `"-"` = separador; null/false = item que não se aplica agora. */
export type EntradaMenu = ItemMenu | "-" | null | false | undefined;

export interface ConfigMenu {
  /** Rótulo acessível e título do botão. */
  rotulo: string;
  icone?: NomeIcone;
  /** Texto visível ao lado do ícone (opcional). */
  texto?: string;
  classe?: string;
  itens: () => EntradaMenu[];
  /** Largura mínima da lista. */
  largura?: number;
}

export function criarMenu(cfg: ConfigMenu): HTMLButtonElement {
  let aberto: { camada: HTMLElement; flut: Flutuante } | null = null;
  const botao = h(
    "button",
    {
      type: "button",
      class: cfg.classe ?? "spro-botao-icone",
      "aria-haspopup": "menu",
      "aria-expanded": "false",
      "aria-label": cfg.rotulo,
      title: cfg.rotulo,
    },
    icone(cfg.icone ?? "menu", 18),
    cfg.texto ? h("span", {}, cfg.texto) : null,
  );

  const fechar = (devolverFoco: boolean) => {
    if (!aberto) return;
    aberto.flut.fechar();
    aberto = null;
    botao.setAttribute("aria-expanded", "false");
    botao.classList.remove("spro-menu-aberto");
    if (devolverFoco) botao.focus?.({ preventScroll: true });
  };

  const abrir = (focarUltimo = false) => {
    if (aberto) return;
    const entradas = cfg.itens().filter((e): e is ItemMenu | "-" => !!e);
    // Sem separador sobrando no começo, no fim ou repetido.
    const limpas = entradas.filter((e, i, l) => e !== "-" || (i > 0 && i < l.length - 1 && l[i - 1] !== "-"));
    const itens: HTMLButtonElement[] = [];
    const camada = h("div", { class: "spro-menu-pop", role: "menu", "aria-label": cfg.rotulo });
    for (const e of limpas) {
      if (e === "-") {
        camada.append(h("div", { class: "spro-menu-sep", role: "separator" }));
        continue;
      }
      const item = h(
        "button",
        {
          type: "button",
          role: "menuitem",
          class: `spro-menu-item${e.perigo ? " spro-menu-perigo" : ""}`,
          tabindex: "-1",
          disabled: e.desativado,
        },
        h("span", { class: "spro-menu-icone" }, e.icone ? icone(e.icone, 16) : null),
        h("span", { class: "spro-menu-rotulo" }, e.rotulo),
        e.dica ? h("span", { class: "spro-menu-dica" }, e.dica) : null,
      );
      item.addEventListener("click", () => {
        fechar(true);
        e.fazer();
      });
      item.addEventListener("pointermove", () => focar(itens.indexOf(item)));
      itens.push(item);
      camada.append(item);
    }
    const focar = (i: number) => {
      if (!itens.length) return;
      const n = (i + itens.length) % itens.length;
      itens.forEach((it, k) => {
        it.setAttribute("tabindex", k === n ? "0" : "-1");
      });
      itens[n]!.focus?.({ preventScroll: true });
    };
    camada.addEventListener("keydown", (ev) => {
      const atual = itens.findIndex((it) => it.getAttribute("tabindex") === "0");
      switch (ev.key) {
        case "ArrowDown":
          focar(atual + 1);
          break;
        case "ArrowUp":
          focar(atual - 1);
          break;
        case "Home":
          focar(0);
          break;
        case "End":
          focar(itens.length - 1);
          break;
        case "Enter":
          itens[atual]?.click();
          break;
        case " ":
          return; // o botão faz o clique sozinho (no keyup)
        case "Escape":
          fechar(true);
          break;
        case "Tab":
          fechar(false);
          return;
        default: {
          // Primeira letra: pula para o próximo item que começa com ela.
          if (ev.key.length !== 1) return;
          const l = ev.key.toLowerCase();
          const ordem = [...itens.slice(atual + 1), ...itens.slice(0, atual + 1)];
          const alvo = ordem.find((it) => (it.textContent ?? "").trim().toLowerCase().startsWith(l));
          if (!alvo) return;
          focar(itens.indexOf(alvo));
        }
      }
      ev.preventDefault();
      ev.stopPropagation();
    });
    const flut = abrirFlutuante(botao, camada, {
      alinharDireita: true,
      largura: cfg.largura ?? 248,
      alturaMaxima: 420,
      aoFechar: () => fechar(false),
    });
    aberto = { camada, flut };
    botao.setAttribute("aria-expanded", "true");
    botao.classList.add("spro-menu-aberto");
    focar(focarUltimo ? itens.length - 1 : 0);
  };

  botao.addEventListener("click", () => (aberto ? fechar(true) : abrir()));
  botao.addEventListener("keydown", (ev) => {
    if (aberto) return;
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      abrir(ev.key === "ArrowUp");
    }
  });
  return botao;
}
