import {
  ESPERA_TENTATIVA_MS,
  INTERVALO_VISITA_MS,
  MAX_ESPECIFICACAO,
  MAX_LISTA,
  MAX_TEXTO,
  MAX_UNIDADES,
  VALIDADE_COMPLETAR_MS,
} from "./constantes";
import type { DadosCompletos, DadosVisita, UnidadeVisita, Visita } from "./tipos";

export function semDadosSensiveis(v: Visita): Visita {
  const { especificacao: _e, interessados: _i, assuntos: _a, ...resto } = v;
  return resto;
}

function unirUnidades(nova: UnidadeVisita | null | undefined, atuais: UnidadeVisita[]): UnidadeVisita[] {
  if (!nova?.id) return atuais.slice(0, MAX_UNIDADES);
  return [{ id: nova.id, sigla: nova.sigla }, ...atuais.filter((u) => u.id !== nova.id)].slice(0, MAX_UNIDADES);
}

export function registrar(anterior: Visita | undefined, d: DadosVisita, agora: number): Visita {
  const v: Visita = anterior
    ? {
        ...anterior,
        protocolo: d.protocolo || anterior.protocolo,
        unidades: unirUnidades(d.unidade, anterior.unidades ?? []),
        primeira: Math.min(anterior.primeira, agora),
        ultima: Math.max(anterior.ultima, agora),
        vezes: (anterior.vezes || 1) + (agora - anterior.ultima > INTERVALO_VISITA_MS ? 1 : 0),
      }
    : { id: d.id, protocolo: d.protocolo, unidades: unirUnidades(d.unidade, []), primeira: agora, ultima: agora, vezes: 1 };
  if (d.tipo) v.tipo = d.tipo;
  if (d.nivel) v.nivel = d.nivel;
  return v.nivel === "sigiloso" ? semDadosSensiveis(v) : v;
}

/** Corta em `max` caracteres sem partir um caractere fora do plano básico (emoji, por exemplo). */
export const cortar = (s: string, max: number): string => (s.length <= max ? s : Array.from(s).slice(0, max).join("").trimEnd());

/** Sem vazios nem repetidos, cada item com até MAX_TEXTO caracteres e no máximo MAX_LISTA itens. */
export const limparLista = (l?: string[]): string[] | undefined => {
  const r = [...new Set((l ?? []).map((s) => cortar(s.trim(), MAX_TEXTO)).filter(Boolean))].slice(0, MAX_LISTA);
  return r.length ? r : undefined;
};

export function completar(v: Visita, c: DadosCompletos, agora: number): Visita {
  const base: Visita = semDadosSensiveis({ ...v, completadoEm: agora });
  delete base.tentouEm;
  const nivel = c.nivel ?? v.nivel;
  if (nivel) base.nivel = nivel;
  if (c.tipo?.trim()) base.tipo = c.tipo.trim();
  if (nivel === "sigiloso") return base;
  const esp = c.especificacao?.trim();
  if (esp) base.especificacao = cortar(esp, MAX_ESPECIFICACAO);
  const i = limparLista(c.interessados);
  if (i) base.interessados = i;
  const a = limparLista(c.assuntos);
  if (a) base.assuntos = a;
  return base;
}

export function precisaCompletar(v: Visita | undefined, agora: number): boolean {
  if (!v || v.nivel === "sigiloso") return false;
  if (v.tentouEm && agora - v.tentouEm < ESPERA_TENTATIVA_MS) return false;
  return !v.completadoEm || agora - v.completadoEm > VALIDADE_COMPLETAR_MS;
}

export function mesclarMigrada(atual: Visita | undefined, migrada: Visita): Visita {
  if (!atual) return migrada;
  const v: Visita = {
    ...migrada,
    ...atual,
    primeira: Math.min(atual.primeira, migrada.primeira),
    ultima: Math.max(atual.ultima, migrada.ultima),
  };
  if (!atual.origem) delete v.origem;
  return v.nivel === "sigiloso" ? semDadosSensiveis(v) : v;
}

export function aPodar(visitas: Visita[], limite: number): string[] {
  if (visitas.length <= limite) return [];
  return [...visitas]
    .sort((a, b) => b.ultima - a.ultima || a.id.localeCompare(b.id))
    .slice(limite)
    .map((v) => v.id);
}

export function visitaValida(v: unknown): v is Visita {
  const x = v as Partial<Visita> | null;
  return (
    !!x &&
    typeof x.id === "string" &&
    !!x.id &&
    typeof x.protocolo === "string" &&
    typeof x.ultima === "number" &&
    typeof x.primeira === "number"
  );
}
