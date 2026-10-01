/**
 * Converte o `configDataFavoritesPro` do legado (localStorage da página do SEI)
 * para o modelo novo. O legado tolerava quase tudo (id número ou texto, ordem
 * nula, categoria com aspas, configdate ausente), e a conversão também precisa
 * tolerar. Nada daqui grava: quem chama decide para qual lista levar.
 *
 * Versão "mais velha possível" (atualizadoEm 1): repetir a migração nunca
 * desfaz o que o usuário editou ou removeu depois no favoritos novo.
 */

import { indicesEntre } from "@comum/ordem/indice";
import { hashCurto, normalizarTexto } from "@comum/texto";
import { MAX_ETIQUETAS } from "../modelo/constantes";
import { corPadrao } from "../modelo/cores";
import type { Etiqueta, Favorito, Pasta, Prazo } from "../modelo/tipos";

export interface ResultadoMigracao {
  favoritos: Favorito[];
  pastas: Pasta[];
  etiquetas: Etiqueta[];
  ignorados: number;
  total: number;
}

const VERSAO_LEGADO = { atualizadoEm: 1, dispositivo: "legado" } as const;
const ISO = /^\d{4}-\d{2}-\d{2}/;

type Obj = Record<string, unknown>;
const objeto = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const lista = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const texto = (v: unknown): string => (typeof v === "string" ? v.trim() : typeof v === "number" && Number.isFinite(v) ? String(v) : "");
const corValida = (v: unknown): string | undefined => (typeof v === "string" && /^#[0-9a-f]{3,8}$/i.test(v) ? v : undefined);
const dataDe = (v: unknown): string | undefined => {
  const t = texto(v);
  return ISO.test(t) ? t.slice(0, 10) : undefined;
};

function analisar(bruto: unknown): Obj | null {
  if (typeof bruto !== "string") return objeto(bruto);
  try {
    return objeto(JSON.parse(bruto.replace(/^\uFEFF/, "")));
  } catch {
    return null;
  }
}

export function converterConfigDate(bruto: unknown): Prazo | undefined {
  const cd = objeto(bruto);
  const data = cd ? dataDe(cd.date) : undefined;
  if (!cd || !data) return undefined;
  const tipos = lista(cd.newdoclist).map(texto).filter(Boolean);
  const referencia: Prazo["referencia"] =
    cd.newdoc && tipos.length
      ? { de: "novoDocumento", tipos, desde: data }
      : cd.selectdoc && texto(cd.listdocs)
        ? { de: "documento", idDocumento: texto(cd.listdocs), data }
        : { de: "data", data };
  let vencimento: Prazo["vencimento"];
  const dataFixa = dataDe(cd.dateDue);
  const n = Number(cd.duenumber);
  if (cd.duesetdate && dataFixa) vencimento = { em: "data", data: dataFixa };
  else if (cd.duedate && Number.isFinite(n)) {
    vencimento = { em: "dias", n: cd.duemode === "antes" ? -Math.abs(n) : n, contagem: cd.duecounter === "util" ? "uteis" : "corridos" };
  }
  const exibicao: Prazo["exibicao"] = cd.countdays ? (cd.workday ? "desdeUteis" : "desde") : "ate";
  return vencimento ? { referencia, vencimento, exibicao } : { referencia, exibicao };
}

export function converterLegado(bruto: unknown, opcoes: { agora: number }): ResultadoMigracao {
  const raiz = analisar(bruto);
  const itens = lista(raiz?.favorites);
  const cores = new Map<string, { cor?: string; icone?: string }>();
  for (const t of lista(objeto(raiz?.config)?.colortags)) {
    const o = objeto(t);
    const nome = texto(o?.name);
    if (nome) cores.set(normalizarTexto(nome), { cor: corValida(o?.value), icone: texto(o?.icon) || undefined });
  }

  let ignorados = 0;
  const porId = new Map<string, Obj>();
  for (const item of itens) {
    const o = objeto(item);
    const id = texto(o?.id_procedimento);
    if (!o || !id || !texto(o.processo)) {
      ignorados += 1;
      continue;
    }
    porId.delete(id);
    porId.set(id, o);
  }

  const ordemLegada = (o: Obj) => {
    const n = Number(o.order);
    return o.order !== null && Number.isFinite(n) && n >= 0 ? n : Number.MAX_SAFE_INTEGER;
  };
  const ordenados = [...porId.entries()]
    .map(([id, o], i) => ({ id, o, i }))
    .sort((a, b) => ordemLegada(a.o) - ordemLegada(b.o) || a.i - b.i);
  const ordens = indicesEntre(null, null, ordenados.length);

  const pastas = new Map<string, Pasta>();
  const etiquetas = new Map<string, Etiqueta>();
  const idPasta = (nome: string): string | undefined => {
    const chave = normalizarTexto(nome);
    if (!chave) return undefined;
    if (!pastas.has(chave)) pastas.set(chave, { id: `leg-${hashCurto(chave)}`, nome: nome.trim(), ordem: "", ...VERSAO_LEGADO });
    return pastas.get(chave)?.id;
  };
  const idEtiqueta = (nome: string): string | undefined => {
    const chave = normalizarTexto(nome);
    if (!chave) return undefined;
    if (!etiquetas.has(chave)) {
      const c = cores.get(chave);
      const e: Etiqueta = { id: `leg-${hashCurto(chave)}`, nome: nome.trim(), cor: c?.cor ?? corPadrao(chave), ...VERSAO_LEGADO };
      if (c?.icone) e.icone = c.icone;
      etiquetas.set(chave, e);
    }
    return etiquetas.get(chave)?.id;
  };

  const favoritos = ordenados.map(({ id, o }, i): Favorito => {
    const f: Favorito = {
      id,
      protocolo: texto(o.processo),
      etiquetas: [...new Set(lista(o.etiquetas).map(texto).filter(Boolean).map(idEtiqueta))]
        .filter((x): x is string => !!x)
        .slice(0, MAX_ETIQUETAS),
      ordem: ordens[i] ?? "",
      criadoEm: opcoes.agora,
      ...VERSAO_LEGADO,
    };
    const tipo = texto(o.tipo_procedimento);
    const espec = texto(o.descricao);
    const pasta = idPasta(texto(o.categoria));
    const prazo = converterConfigDate(o.configdate);
    const ll = lista(o.latlng).map(Number);
    if (tipo) f.tipo = tipo;
    if (espec) f.especificacao = espec;
    if (pasta) f.pasta = pasta;
    if (prazo) f.prazo = prazo;
    if (ll.length === 2 && ll.every(Number.isFinite)) f.local = { lat: ll[0]!, lng: ll[1]! };
    return f;
  });

  const ordensPastas = indicesEntre(null, null, pastas.size);
  const listaPastas = [...pastas.values()]
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))
    .map((p, i) => ({ ...p, ordem: ordensPastas[i] ?? "" }));
  return { favoritos, pastas: listaPastas, etiquetas: [...etiquetas.values()], ignorados, total: itens.length };
}
