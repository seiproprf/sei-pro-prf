/**
 * Impressão digital do conteúdo de um envelope, igual em qualquer computador
 * para o mesmo dado: entidades e listas em ordem, chaves do JSON em ordem, sem
 * os campos de quem gravou e quando. Serve para não regravar o que já está igual.
 */

import { hashCurto } from "@comum/texto";
import type { Envelope } from "../arquivo";
import { chaveEscopo } from "../modelo/escopo";

function estavel(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(estavel).join(",")}]`;
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return `{${Object.keys(o)
      .sort()
      .filter((k) => o[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${estavel(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(v);
}

const porId = <T extends { id: string }>(l: T[]) => [...l].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

export function assinaturaEnvelope(env: Envelope): string {
  const escopos = [...env.escopos]
    .map((e) => ({ k: chaveEscopo(e.escopo), f: porId(e.favoritos), p: porId(e.pastas), e: porId(e.etiquetas) }))
    .sort((a, b) => (a.k < b.k ? -1 : a.k > b.k ? 1 : 0));
  return `${hashCurto(estavel(escopos))}${hashCurto(estavel(escopos).split("").reverse().join(""))}`;
}
