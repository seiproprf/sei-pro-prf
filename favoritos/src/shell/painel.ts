/**
 * O painel lateral da extensão (html/painel.html). O Chrome tem UM painel
 * lateral por extensão, e o agente e os favoritos precisam dividi-lo: o shell
 * mostra abas, e cada aba é a página da própria ferramenta num iframe.
 *
 * Os iframes são preguiçosos (o agente só carrega se a aba dele for aberta) e,
 * uma vez carregados, ficam vivos escondidos: trocar de aba não perde a
 * conversa do agente nem a rolagem dos favoritos.
 *
 * Quem pede o painel (botão Favoritos, item "Agente de IA") manda o
 * background gravar `painelAba` no `chrome.storage.session`: o shell lê ao
 * abrir e segue as mudanças com o painel já aberto.
 */

import type { Area } from "@comum/armazenamento/area";
import { h } from "@comum/ui/dom";

export type AbaPainel = "favoritos" | "agente";
export const CHAVE_ABA = "painelAba";

export interface DepsShell {
  sessao: Area;
  temAgente: boolean;
  /** O favoritos novo está no manifest (no pacote oficial ainda com o antigo, a aba nunca conectaria). Padrão: true. */
  temFavoritos?: boolean;
  url(caminho: string): string;
  /** Aba pedida pelo endereço (`#aba=agente`), quando o painel abre numa janela comum (Firefox). */
  abaDoEndereco?: AbaPainel | null;
  /** chrome.storage.local: o app grava as pendências (lembretes + novidades) em `favoritos/contadorPainel`. */
  local?: Area;
}

export const CHAVE_CONTADOR = "favoritos/contadorPainel";

interface DefAba {
  id: AbaPainel;
  rotulo: string;
  caminho: string;
  titulo: string;
}

export async function montarShell(raiz: HTMLElement, d: DepsShell): Promise<{ mostrar(aba: AbaPainel): void; atual(): AbaPainel }> {
  const defs: DefAba[] = [
    ...(d.temFavoritos !== false
      ? [{ id: "favoritos", rotulo: "Favoritos", caminho: "html/favoritos.html#modo=lateral", titulo: "Favoritos do SEI Pro" } as const]
      : []),
    ...(d.temAgente
      ? [{ id: "agente", rotulo: "Agente de IA", caminho: "html/agente.html", titulo: "Agente de IA do SEI Pro" } as const]
      : []),
  ];
  const frames = new Map<AbaPainel, HTMLIFrameElement>();
  const botoes = new Map<AbaPainel, HTMLButtonElement>();
  const corpo = h("div", { class: "painel-corpo" });
  let atual: AbaPainel = defs[0]?.id ?? "agente";

  const valida = (v: unknown): AbaPainel | null => (defs.some((x) => x.id === v) ? (v as AbaPainel) : null);

  const mostrar = (aba: AbaPainel) => {
    const def = defs.find((x) => x.id === aba) ?? defs[0]!;
    atual = def.id;
    if (!frames.has(def.id)) {
      const f = h("iframe", { src: d.url(def.caminho), title: def.titulo, allow: "clipboard-write" });
      frames.set(def.id, f);
      corpo.append(f);
    }
    for (const [id, f] of frames) f.hidden = id !== def.id;
    for (const [id, b] of botoes) b.setAttribute("aria-selected", String(id === def.id));
  };

  if (defs.length > 1) {
    const barra = h("nav", { class: "painel-abas", role: "tablist", "aria-label": "Ferramentas do painel" });
    for (const def of defs) {
      const b = h(
        "button",
        {
          type: "button",
          role: "tab",
          "aria-selected": "false",
          onclick: () => {
            mostrar(def.id);
            void d.sessao.gravar({ [CHAVE_ABA]: def.id }).catch(() => undefined);
          },
        },
        def.rotulo,
      );
      botoes.set(def.id, b);
      barra.append(b);
    }
    raiz.replaceChildren(barra, corpo);
  } else {
    raiz.replaceChildren(corpo);
  }

  const fav = botoes.get("favoritos");
  if (fav && d.local) {
    const pintar = (v: unknown) => {
      const n = typeof v === "number" && v > 0 ? v : 0;
      fav.textContent = n ? `Favoritos (${n})` : "Favoritos";
      fav.title = n ? `${n} ${n === 1 ? "favorito pede" : "favoritos pedem"} atenção (lembrete ou novidade)` : "";
    };
    pintar((await d.local.obter(CHAVE_CONTADOR).catch(() => ({}) as Record<string, unknown>))[CHAVE_CONTADOR]);
    d.local.aoMudar((m) => {
      if (CHAVE_CONTADOR in m) pintar(m[CHAVE_CONTADOR]?.novo);
    });
  }
  const gravada = (await d.sessao.obter(CHAVE_ABA).catch(() => ({}) as Record<string, unknown>))[CHAVE_ABA];
  mostrar(valida(d.abaDoEndereco) ?? valida(gravada) ?? defs[0]?.id ?? "agente");
  d.sessao.aoMudar((m) => {
    const nova = valida(m[CHAVE_ABA]?.novo);
    if (nova && nova !== atual) mostrar(nova);
  });
  return { mostrar, atual: () => atual };
}
