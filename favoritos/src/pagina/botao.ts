/**
 * Botão "Favoritos" na barra do Controle de Processos e no topo da árvore.
 *
 * Na barra, o ícone é um SVG com COR PRÓPRIA, como os do agente e das
 * Ferramentas de PDF no legado (sei-pro.js): os botões vizinhos usam um <i>
 * com `color: #fff` inline, que some na barra branca do SEI 4.1+/5.
 *
 * O painel lateral só abre a partir do service worker (sidePanel.open exige o
 * gesto do usuário, que o clique leva junto na mensagem). Sem service worker
 * (Firefox, pacotes sem background), o painel abre numa janela comum.
 */

import { h, icone } from "@comum/ui/dom";

export interface AcoesBotao {
  abrirLateral(): void;
  rolarAtePainel(): void;
}

export function instalarBotaoCaixa(
  doc: Document,
  o: { url: (c: string) => string; destino: () => "lateral" | "abaixo" } & AcoesBotao,
): HTMLElement | null {
  const barra = doc.querySelector("#divBotoesControleProcessos, #divComandos");
  if (!barra || barra.querySelector(".spro-fav-botao")) return null;
  const b = h(
    "a",
    {
      href: "#",
      role: "button",
      class: "botaoSEI spro-fav-botao",
      title: "Favoritos",
      "aria-label": "Favoritos",
      tabindex: "452",
      style: "cursor: pointer;",
    },
    h("img", { class: "infraCorBarraSistema", src: o.url("icons/menu/favoritos.svg"), alt: "Favoritos", title: "Favoritos" }),
  );
  b.addEventListener("click", (ev) => {
    ev.preventDefault();
    if (o.destino() === "lateral") o.abrirLateral();
    else o.rolarAtePainel();
  });
  barra.append(b);
  return b;
}

export function instalarBotaoArvore(doc: Document, o: { url: (c: string) => string; abrirLateral(): void }): HTMLElement | null {
  const estrela = doc.querySelector("#topmenu .spro-fav-estrela");
  if (!estrela || estrela.parentElement?.querySelector(".spro-fav-abrir")) return null;
  const rotulo = "Abrir a lista de favoritos no painel lateral";
  // Classe própria: `.spro-fav-estrela` seria capturada pela delegação das estrelas e alternaria o favorito.
  const b = h("button", { type: "button", class: "spro-fav-abrir", title: rotulo, "aria-label": rotulo }, icone("painel", 16));
  b.addEventListener("click", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();
    o.abrirLateral();
  });
  estrela.after(b);
  return b;
}

export function pedirPainelLateral(enviar: (m: unknown) => Promise<unknown>, abrirJanela: (url: string) => void, url: string): void {
  void enviar({ tipo: "abrirPainel", aba: "favoritos" }).catch(() => abrirJanela(url));
}
