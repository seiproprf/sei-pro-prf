/**
 * Arquivo de favoritos (.json): o backup manual da F1 e, na F3, o formato da
 * sincronia por arquivo (spec 6.4). Leva TODAS as listas do usuário (cada
 * unidade e a Pessoal), legível e indentado, para quem quiser conferir.
 * Importar sempre MESCLA (vence a versão mais recente), nunca substitui. O
 * legado substituía tudo e sem validar.
 */

import type { Area } from "@comum/armazenamento/area";
import { indiceValido } from "@comum/ordem/indice";
import { corPadrao } from "./modelo/cores";
import type { Carimbo, Escopo, Etiqueta, Favorito, Pasta } from "./modelo/tipos";
import { type RegistroVisto, RepositorioFavoritos } from "./repositorio";

export interface EscopoExportado {
  escopo: Escopo;
  favoritos: Favorito[];
  pastas: Pasta[];
  etiquetas: Etiqueta[];
  /** O "visto" de cada favorito (entidade própria; arquivos antigos não têm). */
  vistos?: RegistroVisto[];
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
      vistos: pegar("v/") as RegistroVisto[],
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
  if (r.de === "novoDocumento" && !(Array.isArray(r.tipos) && r.tipos.length && r.tipos.every(ehTexto))) return false;
  const venc = objeto(p.vencimento);
  // |n| <= 3650: dez anos. Um n absurdo deixaria a soma de dias úteis rodando por bilhões de voltas.
  return (
    p.vencimento === undefined ||
    (venc?.em === "data" && ehTexto(venc.data) && ISO.test(venc.data)) ||
    (venc?.em === "dias" && ehNumero(venc.n) && Math.abs(venc.n) <= 3650 && (venc.contagem === "corridos" || venc.contagem === "uteis"))
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
  // Ordem que o algoritmo não aceita travaria o próximo favorito: vira uma chave válida.
  if (!indiceValido(f.ordem as string)) f.ordem = "a0";
  if (f.fixado !== true) delete f.fixado;
  if (f.sigiloso !== true) delete f.sigiloso;
  else delete f.especificacao;
  // Campos da F4: quebrados (arquivo editado à mão, formato futuro) saem; o favorito fica.
  const lem = objeto(f.lembrete);
  if (f.lembrete !== undefined) {
    if (lem && ehTexto(lem.em) && ISO.test(lem.em)) f.lembrete = ehTexto(lem.texto) ? { em: lem.em, texto: lem.texto } : { em: lem.em };
    else delete f.lembrete;
  }
  if (f.documentos !== undefined) {
    const docs = Array.isArray(f.documentos)
      ? f.documentos
          .map(objeto)
          .filter((d): d is Obj => !!d && ehTexto(d.id) && ehTexto(d.numero) && ehTexto(d.titulo))
          .map((d) => ({
            id: d.id,
            numero: d.numero,
            titulo: d.titulo,
            criadoEm: ehNumero(d.criadoEm) ? d.criadoEm : 0,
            ...(ehTexto(d.nota) ? { nota: d.nota } : {}),
          }))
      : [];
    if (docs.length) f.documentos = docs;
    else delete f.documentos;
  }
  if (f.visto !== undefined && !(objeto(f.visto) && ehNumero(objeto(f.visto)!.quando))) delete f.visto;
  const loc = objeto(f.local);
  if (f.local !== undefined && !(loc && ehNumero(loc.lat) && ehNumero(loc.lng) && Math.abs(loc.lat) <= 90 && Math.abs(loc.lng) <= 180))
    delete f.local;
  if (f.sigiloAConfirmar !== true) delete f.sigiloAConfirmar;
  if (f.resumido !== true) delete f.resumido;
  return f as unknown as Favorito;
}

// A cor entra em style="--cor:..." na lista: só cor hexadecimal, nada de CSS arbitrário.
const COR = /^#[0-9a-f]{3,8}$/i;
const pasta = (v: unknown): Pasta | null => {
  const o = objeto(v);
  if (!o || !versionada(o) || !ehTexto(o.nome) || !ehTexto(o.ordem)) return null;
  const p = { ...o, ordem: indiceValido(o.ordem) ? o.ordem : "a0" } as Obj;
  if (p.cor !== undefined && !(ehTexto(p.cor) && COR.test(p.cor))) delete p.cor;
  return p as unknown as Pasta;
};
const etiqueta = (v: unknown): Etiqueta | null => {
  const o = objeto(v);
  if (!o || !versionada(o) || !ehTexto(o.nome)) return null;
  return { ...o, cor: ehTexto(o.cor) && COR.test(o.cor) ? o.cor : corPadrao(o.nome) } as unknown as Etiqueta;
};
const registroVisto = (v: unknown): RegistroVisto | null => {
  const o = objeto(v);
  return o && versionada(o) && objeto(o.visto) && ehNumero(objeto(o.visto)!.quando) ? (o as unknown as RegistroVisto) : null;
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
      vistos: filtrar(eo.vistos, registroVisto),
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
