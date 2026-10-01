/**
 * Escopo = de quem e de qual lista. A chave entra no nome de cada entrada do
 * `chrome.storage` (`favoritos/<chave>/f/<id>`). O login vai em minúsculas,
 * porque é o mesmo usuário com ou sem caixa, e o SEI 4.1.5+ mexe no prefixo do
 * cookie, não no título do usuário (memória "login_sei_prefixo_cookie").
 */

import type { ContextoAba, Escopo } from "./tipos";

export function chaveEscopo(e: Escopo): string {
  const login = e.login.trim().toLowerCase();
  return `${e.host}|${login}|${e.lista === "pessoal" ? "pessoal" : `u:${e.unidade?.id ?? ""}`}`;
}

export function escoposDoContexto(ctx: ContextoAba): { unidade: Escopo | null; pessoal: Escopo } {
  const base = { host: ctx.host, login: ctx.login.trim().toLowerCase() };
  return {
    unidade: ctx.unidade?.id ? { ...base, lista: "unidade", unidade: { id: ctx.unidade.id, sigla: ctx.unidade.sigla } } : null,
    pessoal: { ...base, lista: "pessoal" },
  };
}

export function rotuloDaLista(e: Escopo): string {
  return e.lista === "pessoal" ? "Pessoal" : e.unidade?.sigla || "Unidade";
}

/** Identidade do contexto (SEI, usuário, unidade): o painel lateral remonta a lista quando ela muda. */
export function chaveDoContexto(ctx: Pick<ContextoAba, "host" | "login" | "unidade">): string {
  return [ctx.host, ctx.login.trim().toLowerCase(), ctx.unidade?.id ?? ""].join("|");
}
