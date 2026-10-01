/**
 * Ponte entre o formulário de prazo (quatro modos simples) e o `Prazo` do
 * modelo. O prazo simples do legado (só uma data) abre como "Até uma data".
 */

import type { DataISO } from "@comum/datas/dias";
import type { Prazo } from "../modelo/tipos";

export type ModoPrazo = "nenhum" | "data" | "dias" | "contagem";

export interface ValoresPrazo {
  modo: ModoPrazo;
  referencia: DataISO;
  vencimento: DataISO;
  n: number;
  contagem: "corridos" | "uteis";
  sentido: "depois" | "antes";
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export function valoresDoPrazo(p: Prazo | undefined, hoje: DataISO): ValoresPrazo {
  const base: ValoresPrazo = { modo: "nenhum", referencia: hoje, vencimento: hoje, n: 5, contagem: "corridos", sentido: "depois" };
  if (!p) return base;
  const ref = p.referencia.de === "novoDocumento" ? p.referencia.desde : p.referencia.data;
  if (p.vencimento?.em === "data") return { ...base, modo: "data", referencia: ref, vencimento: p.vencimento.data };
  if (p.vencimento?.em === "dias") {
    return {
      ...base,
      modo: "dias",
      referencia: ref,
      n: Math.abs(p.vencimento.n),
      contagem: p.vencimento.contagem,
      sentido: p.vencimento.n < 0 ? "antes" : "depois",
    };
  }
  if (p.exibicao === "ate") return { ...base, modo: "data", referencia: ref, vencimento: ref };
  return { ...base, modo: "contagem", referencia: ref, contagem: p.exibicao === "desdeUteis" ? "uteis" : "corridos" };
}

export function prazoDosValores(v: ValoresPrazo): Prazo | undefined {
  if (v.modo === "nenhum" || !ISO.test(v.referencia)) return undefined;
  const referencia = { de: "data" as const, data: v.referencia };
  if (v.modo === "data")
    return ISO.test(v.vencimento) ? { referencia, vencimento: { em: "data", data: v.vencimento }, exibicao: "ate" } : undefined;
  if (v.modo === "dias") {
    const n = Math.trunc(Math.abs(v.n));
    if (!Number.isFinite(n) || n === 0) return undefined;
    return { referencia, vencimento: { em: "dias", n: v.sentido === "antes" ? -n : n, contagem: v.contagem }, exibicao: "ate" };
  }
  return { referencia, exibicao: v.contagem === "uteis" ? "desdeUteis" : "desde" };
}
