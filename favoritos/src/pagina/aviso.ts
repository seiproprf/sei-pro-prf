/**
 * Aviso (toast) do painel embutido no rodapé da TELA do SEI: dentro do iframe,
 * que cresce com a lista, um aviso preso embaixo ficaria fora da vista. Estilo
 * em linha (a página do SEI não tem a base visual) e cores fixas, legíveis nos
 * dois temas. A promessa diz se o usuário clicou a ação ("Desfazer").
 */

import { h } from "@comum/ui/dom";

export type AvisarNaPagina = (texto: string, acao: string | undefined, ms: number) => Promise<boolean>;

const CAIXA =
  "position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483646;display:flex;align-items:center;gap:12px;" +
  "max-width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:10px 10px 10px 16px;" +
  "font:13px/1.35 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#f3f5f8;background:#1f2329;" +
  "border:1px solid rgb(255 255 255 / 8%);border-radius:12px;box-shadow:0 10px 24px -6px rgb(16 24 40 / 30%),0 24px 56px -12px rgb(16 24 40 / 35%);" +
  "animation:spro-fav-aviso 220ms cubic-bezier(.2,.8,.2,1)";
const BOTAO =
  "flex:none;padding:5px 10px;font:inherit;font-weight:600;color:#9cc3ff;background:rgb(255 255 255 / 7%);border:0;border-radius:6px;cursor:pointer";

export function avisoNaPagina(doc: Document, temaEscuro: boolean): AvisarNaPagina {
  return (texto, acao, ms) =>
    new Promise<boolean>((resolver) => {
      for (const velho of doc.querySelectorAll(".spro-fav-aviso")) velho.remove();
      let feito = false;
      const terminar = (acionado: boolean) => {
        if (feito) return;
        feito = true;
        caixa.remove();
        resolver(acionado);
      };
      const caixa = h(
        "div",
        { class: "spro-fav-aviso", role: "status", style: CAIXA + (temaEscuro ? ";background:#2b3036" : "") },
        h("span", { style: "flex:1" }, texto),
        acao ? h("button", { type: "button", style: BOTAO, onclick: () => terminar(true) }, acao) : null,
      );
      (doc.body ?? doc.documentElement).append(caixa);
      setTimeout(() => terminar(false), Math.max(10, Math.min(ms, 60_000)));
    });
}
