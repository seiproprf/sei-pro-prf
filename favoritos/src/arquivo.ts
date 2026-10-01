/**
 * Arquivo de favoritos (.json): o backup manual da F1 e, na F3, o formato da
 * sincronia por arquivo (spec 6.4). Leva TODAS as listas do usuário (cada
 * unidade e a Pessoal), legível e indentado, para quem quiser conferir.
 * Importar sempre MESCLA (vence a versão mais recente), nunca substitui. O
 * legado substituía tudo e sem validar.
 */

import type { Area } from "@comum/armazenamento/area";
import type { Carimbo, Escopo, Etiqueta, Favorito, Pasta } from "./modelo/tipos";
import { RepositorioFavoritos } from "./repositorio";

export interface EscopoExportado {
  escopo: Escopo;
  favoritos: Favorito[];
  pastas: Pasta[];
  etiquetas: Etiqueta[];
}

export interface Envelope {
  formato: "seipro-favoritos";
  versao: 1;
  escopos: EscopoExportado[];
  gravadoEm: number;
  dispositivo: string;
  revisao: number;
}

type Obj = Record<string, unknown>;
const objeto = (v: unknown): Obj | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Obj) : null);
const ehTexto = (v: unknown): v is string => typeof v === "string";
const ehNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function exportarTudo(area: Area, host: string, login: string, c: Carimbo): Promise<Envelope> {
  const tudo = await area.obter(null);
  const prefixo = `favoritos/${host}|${login.toLowerCase()}|`;
  const escopos: EscopoExportado[] = [];
  for (const [chave, valor] of Object.entries(tudo)) {
    const escopo = objeto(valor)?.escopo;
    if (!chave.startsWith(prefixo) || !chave.endsWith("/meta") || !escopo) continue;
    const base = chave.slice(0, -"meta".length);
    const pegar = (sub: string) =>
      Object.entries(tudo)
        .filter(([k]) => k.startsWith(base + sub))
        .map(([, v]) => v);
    escopos.push({
      escopo: escopo as Escopo,
      favoritos: pegar("f/") as Favorito[],
      pastas: pegar("p/") as Pasta[],
      etiquetas: pegar("e/") as Etiqueta[],
    });
  }
  return { formato: "seipro-favoritos", versao: 1, escopos, gravadoEm: c.agora, dispositivo: c.dispositivo, revisao: 0 };
}

const versionada = (o: Obj) =>
  ehTexto(o.id) &&
  o.id !== "" &&
  ehNumero(o.atualizadoEm) &&
  ehTexto(o.dispositivo) &&
  (o.removidoEm === undefined || ehNumero(o.removidoEm));

function prazoValido(v: unknown): boolean {
  const p = objeto(v);
  const r = objeto(p?.referencia);
  if (!p || !r || !["ate", "desde", "desdeUteis"].includes(String(p.exibicao))) return false;
  const datas = r.de === "novoDocumento" ? [r.desde] : r.de === "data" || r.de === "documento" ? [r.data] : [];
  if (!datas.length || !datas.every((d) => ehTexto(d) && ISO.test(d))) return false;
  const venc = objeto(p.vencimento);
  return (
    p.vencimento === undefined ||
    (venc?.em === "data" && ehTexto(venc.data) && ISO.test(venc.data)) ||
    (venc?.em === "dias" && ehNumero(venc.n))
  );
}

/** Favorito utilizável, ou null. Campos opcionais quebrados são descartados, não o favorito inteiro. */
function favorito(v: unknown): Favorito | null {
  const o = objeto(v);
  if (!o || !versionada(o) || !ehTexto(o.protocolo) || !ehTexto(o.ordem) || !ehNumero(o.criadoEm) || !Array.isArray(o.etiquetas))
    return null;
  const f = { ...o, etiquetas: o.etiquetas.filter(ehTexto) } as Obj;
  if (f.prazo !== undefined && !prazoValido(f.prazo)) delete f.prazo;
  for (const k of ["titulo", "tipo", "especificacao", "pasta", "nota"]) if (f[k] !== undefined && !ehTexto(f[k])) delete f[k];
  return f as unknown as Favorito;
}

const pasta = (v: unknown): Pasta | null => {
  const o = objeto(v);
  return o && versionada(o) && ehTexto(o.nome) && ehTexto(o.ordem) ? (o as unknown as Pasta) : null;
};
const etiqueta = (v: unknown): Etiqueta | null => {
  const o = objeto(v);
  return o && versionada(o) && ehTexto(o.nome) && ehTexto(o.cor) ? (o as unknown as Etiqueta) : null;
};
const escopoValido = (v: unknown): v is Escopo => {
  const o = objeto(v);
  if (!o || !ehTexto(o.host) || !ehTexto(o.login)) return false;
  return o.lista === "pessoal" || (o.lista === "unidade" && ehTexto(objeto(o.unidade)?.id) && objeto(o.unidade)?.id !== "");
};

export function lerEnvelope(bruto: unknown): { envelope: Envelope; descartados: number } | null {
  const o = objeto(bruto);
  if (!o || o.formato !== "seipro-favoritos" || o.versao !== 1 || !Array.isArray(o.escopos)) return null;
  let descartados = 0;
  const filtrar = <T>(lista: unknown, ler: (v: unknown) => T | null): T[] => {
    const l = Array.isArray(lista) ? lista : [];
    const bons = l.map(ler).filter((x): x is T => x !== null);
    descartados += l.length - bons.length;
    return bons;
  };
  const escopos: EscopoExportado[] = [];
  for (const e of o.escopos) {
    const eo = objeto(e);
    if (!eo || !escopoValido(eo.escopo)) {
      descartados += 1;
      continue;
    }
    escopos.push({
      escopo: eo.escopo,
      favoritos: filtrar(eo.favoritos, favorito),
      pastas: filtrar(eo.pastas, pasta),
      etiquetas: filtrar(eo.etiquetas, etiqueta),
    });
  }
  return {
    envelope: {
      formato: "seipro-favoritos",
      versao: 1,
      escopos,
      gravadoEm: ehNumero(o.gravadoEm) ? o.gravadoEm : 0,
      dispositivo: ehTexto(o.dispositivo) ? o.dispositivo : "",
      revisao: ehNumero(o.revisao) ? o.revisao : 0,
    },
    descartados,
  };
}

/** Só entram as listas DO PRÓPRIO usuário: o arquivo de um colega não vira favoritos invisíveis. */
export async function importarEnvelope(
  area: Area,
  env: Envelope,
  carimbo: () => Carimbo,
  dono: { host: string; login: string },
): Promise<{ novos: number; atualizados: number; deOutro: number }> {
  let novos = 0;
  let atualizados = 0;
  let deOutro = 0;
  for (const e of env.escopos) {
    if (e.escopo.host !== dono.host || e.escopo.login.toLowerCase() !== dono.login.toLowerCase()) {
      deOutro += 1;
      continue;
    }
    const repo = new RepositorioFavoritos(area, e.escopo, carimbo);
    await repo.registrar();
    const r = await repo.importar(e);
    novos += r.novos;
    atualizados += r.atualizados;
  }
  return { novos, atualizados, deOutro };
}
