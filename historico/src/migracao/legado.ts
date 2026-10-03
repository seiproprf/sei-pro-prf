import { MAX_ESPECIFICACAO } from "../modelo/constantes";
import type { Nivel, Visita } from "../modelo/tipos";
import { cortar, limparLista, semDadosSensiveis } from "../modelo/visita";

export interface ResultadoMigracao {
  visitas: Visita[];
  ignorados: number;
  total: number;
}
const DATA = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/;
const NIVEIS: Record<string, Nivel> = { "0": "publico", "1": "restrito", "2": "sigiloso" };

function data(v: unknown): number | null {
  const m = DATA.exec(String(v ?? ""));
  if (!m) return null;
  const [ano, mes, dia, hora, min, seg] = [+m[1]!, +m[2]!, +m[3]!, +m[4]!, +m[5]!, +(m[6] ?? 0)];
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31 || hora > 23 || min > 59 || seg > 59) return null;
  const d = new Date(ano, mes - 1, dia, hora, min, seg);
  if (d.getFullYear() !== ano || d.getMonth() !== mes - 1 || d.getDate() !== dia) return null;
  const t = d.getTime();
  return Number.isFinite(t) ? t : null;
}

export function converterLegado(bruto: unknown): ResultadoMigracao {
  let lista: unknown = bruto;
  if (typeof bruto === "string") {
    try {
      lista = JSON.parse(bruto);
    } catch {
      return { visitas: [], ignorados: 0, total: 0 };
    }
  }
  if (!Array.isArray(lista)) return { visitas: [], ignorados: 0, total: 0 };
  const porId = new Map<string, Visita>();
  let ignorados = 0;
  for (const x of lista) {
    const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
    const id = String(o.id_procedimento ?? "").trim();
    const protocolo = String(o.protocolo ?? "").trim();
    const quando = data(o.datetime);
    if (!/^\d+$/.test(id) || !protocolo || quando === null) {
      ignorados++;
      continue;
    }
    const nivel = NIVEIS[String(o.nivel_acesso ?? "")];
    let v: Visita = { id, protocolo, unidades: [], primeira: quando, ultima: quando, vezes: 1, origem: "legado" };
    const tipo = typeof o.tipo_processo === "string" ? o.tipo_processo.trim() : "";
    if (tipo) v.tipo = tipo;
    if (nivel) v.nivel = nivel;
    const esp = typeof o.descricao === "string" ? o.descricao.trim() : "";
    if (esp) v.especificacao = cortar(esp, MAX_ESPECIFICACAO);
    // Mesma regra do completar: sem vazios nem repetidos, textos e lista curtos (cota do storage).
    const assuntos = limparLista(Array.isArray(o.assuntos) ? o.assuntos.map((a) => String(a)) : []);
    if (assuntos) v.assuntos = assuntos;
    if (nivel === "sigiloso") v = semDadosSensiveis(v);
    const ja = porId.get(id);
    porId.set(
      id,
      ja ? { ...(quando >= ja.ultima ? v : ja), primeira: Math.min(ja.primeira, quando), ultima: Math.max(ja.ultima, quando) } : v,
    );
  }
  return { visitas: [...porId.values()], ignorados, total: lista.length };
}
