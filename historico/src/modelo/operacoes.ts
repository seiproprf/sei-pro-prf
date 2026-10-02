import { normalizarTexto } from "@comum/texto";
import { GRUPOS, type Grupo, grupoDe, periodosDe } from "./dias";
import { type Filtro, type Ordem, SITUACOES, type Situacao, type Visita } from "./tipos";

export interface ApoioFiltro {
  agora: number;
  favoritos: ReadonlySet<string> | null;
}
export const digitos = (s: string): string => s.replace(/\D/g, "");
const NUMERICA = /^[\d.\-/\s]+$/;

function textoDeBusca(v: Visita): string {
  return normalizarTexto(
    [v.protocolo, v.tipo, v.especificacao, ...(v.interessados ?? []), ...(v.assuntos ?? []), ...v.unidades.map((u) => u.sigla)]
      .filter(Boolean)
      .join(" "),
  );
}

export function casaBusca(v: Visita, busca: string): boolean {
  const t = normalizarTexto(busca);
  if (!t) return true;
  const d = digitos(busca);
  if (NUMERICA.test(busca.trim()) && d.length >= 4 && digitos(v.protocolo).includes(d)) return true;
  const texto = textoDeBusca(v);
  return t.split(" ").every((p) => texto.includes(p));
}

export function temSituacao(v: Visita, s: Situacao, a: ApoioFiltro): boolean {
  switch (s) {
    case "favoritos":
      return !!a.favoritos?.has(v.id);
    case "foraFavoritos":
      return !!a.favoritos && !a.favoritos.has(v.id);
    case "repetidos":
      return v.vezes > 1;
    default:
      return v.nivel === s;
  }
}

const algum = <T>(sel: T[] | undefined, teste: (x: T) => boolean) => !sel?.length || sel.some(teste);

export function filtrar(visitas: Visita[], f: Filtro, a: ApoioFiltro): Visita[] {
  return visitas.filter((v) => {
    if (f.busca && !casaBusca(v, f.busca)) return false;
    if (f.periodos?.length) {
      const p = periodosDe(v.ultima, a.agora);
      if (!f.periodos.some((x) => p.includes(x))) return false;
    }
    return (
      algum(f.tipos, (t) => v.tipo === t) &&
      algum(f.unidades, (s) => v.unidades.some((u) => u.sigla === s)) &&
      algum(f.interessados, (i) => !!v.interessados?.includes(i)) &&
      algum(f.assuntos, (x) => !!v.assuntos?.includes(x)) &&
      algum(f.situacoes, (s) => temSituacao(v, s, a))
    );
  });
}

export function ordenar(visitas: Visita[], ordem: Ordem): Visita[] {
  const l = [...visitas];
  if (ordem === "visitados") return l.sort((a, b) => b.vezes - a.vezes || b.ultima - a.ultima);
  if (ordem === "protocolo") return l.sort((a, b) => a.protocolo.localeCompare(b.protocolo, "pt-BR", { numeric: true }));
  return l.sort((a, b) => b.ultima - a.ultima);
}

export interface Contagens {
  periodos: Map<string, number>;
  tipos: Map<string, number>;
  unidades: Map<string, number>;
  interessados: Map<string, number>;
  assuntos: Map<string, number>;
  situacoes: Map<string, number>;
}

export function contar(visitas: Visita[], a: ApoioFiltro): Contagens {
  const c: Contagens = {
    periodos: new Map(),
    tipos: new Map(),
    unidades: new Map(),
    interessados: new Map(),
    assuntos: new Map(),
    situacoes: new Map(),
  };
  const mais = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
  for (const v of visitas) {
    for (const p of periodosDe(v.ultima, a.agora)) mais(c.periodos, p);
    if (v.tipo) mais(c.tipos, v.tipo);
    for (const s of new Set(v.unidades.map((u) => u.sigla))) mais(c.unidades, s);
    for (const i of new Set(v.interessados ?? [])) mais(c.interessados, i);
    for (const x of new Set(v.assuntos ?? [])) mais(c.assuntos, x);
    for (const s of SITUACOES) if (temSituacao(v, s, a)) mais(c.situacoes, s);
  }
  return c;
}

export function agrupar(visitas: Visita[], agora: number): Array<{ grupo: Grupo; itens: Visita[] }> {
  const m = new Map<Grupo, Visita[]>();
  for (const v of visitas) {
    const g = grupoDe(v.ultima, agora);
    const l = m.get(g);
    if (l) l.push(v);
    else m.set(g, [v]);
  }
  return GRUPOS.filter((g) => m.has(g)).map((g) => ({ grupo: g, itens: m.get(g) ?? [] }));
}
