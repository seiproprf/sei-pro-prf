/**
 * Casca genérica do painel lateral da extensão (html/painel.html). O Chrome tem
 * UM painel lateral por extensão, e as ferramentas (favoritos, histórico,
 * agente) precisam dividi-lo: a casca mostra abas, e cada aba é a página da
 * própria ferramenta num iframe.
 *
 * Os iframes são preguiçosos (só carrega a aba aberta) e, uma vez carregados,
 * ficam vivos escondidos: trocar de aba não perde a conversa do agente nem a
 * rolagem dos favoritos.
 *
 * Quem pede o painel manda o background gravar `painelAba` no
 * `chrome.storage.session`: a casca lê ao abrir e segue as mudanças com o
 * painel já aberto.
 */

import type { Area } from "../armazenamento/area";
import { h, icone, type NomeIcone } from "../ui/dom";

export const CHAVE_ABA = "painelAba";

export interface DefAba {
  id: string;
  rotulo: string;
  icone: NomeIcone;
  caminho: string;
  titulo: string;
  /** Selo de pendências: chave no storage.local com um número; `dica(n)` vira o title do botão. */
  contador?: { chave: string; dica(n: number): string };
}

export interface DepsAbas {
  sessao: Area;
  /** chrome.storage.local: de onde saem os contadores das abas. */
  local?: Area;
  abas: DefAba[];
  url(caminho: string): string;
  /** Aba pedida pelo endereço (`#aba=agente`), quando o painel abre numa janela comum (Firefox). */
  abaDoEndereco?: string | null;
}

export async function montarAbas(raiz: HTMLElement, d: DepsAbas): Promise<{ mostrar(aba: string): void; atual(): string }> {
  const defs = d.abas;
  const frames = new Map<string, HTMLIFrameElement>();
  const botoes = new Map<string, HTMLButtonElement>();
  const corpo = h("div", { class: "painel-corpo" });
  let atual: string = defs[0]?.id ?? "";

  const valida = (v: unknown): string | null => (defs.some((x) => x.id === v) ? (v as string) : null);

  const mostrar = (aba: string) => {
    const def = defs.find((x) => x.id === aba) ?? defs[0];
    if (!def) return;
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
          "aria-label": def.rotulo,
          title: def.rotulo,
          onclick: () => {
            mostrar(def.id);
            void d.sessao.gravar({ [CHAVE_ABA]: def.id }).catch(() => undefined);
          },
        },
        icone(def.icone, 15),
        h("span", {}, def.rotulo),
        h("span", { class: "painel-conta", hidden: true }),
      );
      botoes.set(def.id, b);
      barra.append(b);
    }
    raiz.replaceChildren(barra, corpo);
  } else {
    raiz.replaceChildren(corpo);
  }

  if (d.local) {
    const local = d.local;
    for (const def of defs) {
      const c = def.contador;
      const b = botoes.get(def.id);
      if (!c || !b) continue;
      const pintar = (v: unknown) => {
        const n = typeof v === "number" && v > 0 ? v : 0;
        const conta = b.querySelector<HTMLElement>(".painel-conta");
        if (conta) {
          conta.textContent = String(n);
          conta.hidden = !n;
        }
        b.setAttribute("aria-label", n ? `${def.rotulo} (${n})` : def.rotulo);
        b.title = n ? c.dica(n) : def.rotulo;
      };
      pintar((await local.obter(c.chave).catch(() => ({}) as Record<string, unknown>))[c.chave]);
      local.aoMudar((m) => {
        if (c.chave in m) pintar(m[c.chave]?.novo);
      });
    }
  }
  const gravada = (await d.sessao.obter(CHAVE_ABA).catch(() => ({}) as Record<string, unknown>))[CHAVE_ABA];
  mostrar(valida(d.abaDoEndereco) ?? valida(gravada) ?? defs[0]?.id ?? "");
  d.sessao.aoMudar((m) => {
    const nova = valida(m[CHAVE_ABA]?.novo);
    if (nova && nova !== atual) mostrar(nova);
  });
  return { mostrar, atual: () => atual };
}
