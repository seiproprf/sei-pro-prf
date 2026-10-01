/**
 * Utilitários dos testes, na mesma forma dos `verificar-*.ts` do agente e do
 * núcleo: sem framework, um `checar()` por expectativa e saída 1 se algo falhar.
 */

import { DOMParser } from "linkedom";

let passou = 0;
let falhou = 0;

export function secao(nome: string): void {
  console.log(`\n== ${nome} ==`);
}

export function checar(nome: string, condicao: boolean, detalhe?: unknown): void {
  if (condicao) {
    passou += 1;
    console.log(`  ok    ${nome}`);
    return;
  }
  falhou += 1;
  const extra = detalhe === undefined ? "" : ` -- ${typeof detalhe === "string" ? detalhe : JSON.stringify(detalhe)}`;
  console.log(`  FALHA ${nome}${extra}`);
}

export async function lanca(fn: () => unknown | Promise<unknown>): Promise<{ codigo?: string; message?: string } | null> {
  try {
    await fn();
    return null;
  } catch (e) {
    return e as { codigo?: string; message?: string };
  }
}

/** `h()` e `icone()` usam o `document` global; nos testes ele vem do linkedom. */
export function instalarDom(html = "<html><body></body></html>"): Document {
  const doc = new DOMParser().parseFromString(html, "text/html") as unknown as Document;
  (globalThis as { document?: Document }).document = doc;
  return doc;
}

/** Evento do próprio linkedom (o `Event` do Node não serve aos elementos dele). */
export function disparar(el: Element, tipo: string): void {
  const Ev = (el.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  el.dispatchEvent(new Ev(tipo, { bubbles: true }));
}

/** `select.value` é só leitura no linkedom: marcar a opção é o equivalente à escolha do usuário. */
export function escolher(sel: HTMLSelectElement, valor: string): void {
  for (const o of sel.querySelectorAll("option")) {
    if (o.getAttribute("value") === valor) o.setAttribute("selected", "");
    else o.removeAttribute("selected");
  }
  disparar(sel, "change");
}

export function botao(raiz: ParentNode, texto: string): HTMLButtonElement | undefined {
  return [...raiz.querySelectorAll("button")].find(
    (b) => (b.textContent ?? "").trim() === texto || b.getAttribute("aria-label") === texto,
  ) as HTMLButtonElement | undefined;
}

export function resumo(): void {
  console.log(`\n${passou} ok, ${falhou} falha(s)\n`);
  if (falhou > 0) process.exit(1);
}
