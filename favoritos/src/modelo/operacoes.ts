/**
 * Operações puras sobre favoritos: nada aqui toca o armazenamento nem o DOM.
 * Toda edição recebe o carimbo (quando, de onde), que é o que a mesclagem usa.
 */

import type { DataISO } from "@comum/datas/dias";
import type { Versionada } from "@comum/sincronia/entidade";
import { normalizarTexto } from "@comum/texto";
import { SEM_PASTA } from "./constantes";
import { lembreteVencido } from "./lembrete";
import type { Mudanca } from "./novidades";
import type { Carimbo, DadosProcesso, Etiqueta, Favorito, Filtro, Instantaneo, ModoOrdem, ResumoPrazo, SituacaoFiltro } from "./tipos";

/** Chaves com `undefined` saem do objeto: o storage guarda menos e o "apagar campo" fica explícito. */
function semVazios<T extends object>(o: T): T {
  for (const k of Object.keys(o)) if ((o as Record<string, unknown>)[k] === undefined) delete (o as Record<string, unknown>)[k];
  return o;
}

export function novoFavorito(d: DadosProcesso, ordem: string, c: Carimbo): Favorito {
  return semVazios({
    id: d.id,
    protocolo: d.protocolo,
    tipo: d.tipo || undefined,
    especificacao: d.sigiloso ? undefined : d.especificacao || undefined,
    sigiloso: d.sigiloso ? (true as const) : undefined,
    sigiloAConfirmar: d.sigiloAConfirmar && d.sigiloso === undefined ? (true as const) : undefined,
    etiquetas: [],
    ordem,
    criadoEm: c.agora,
    atualizadoEm: c.agora,
    dispositivo: c.dispositivo,
  });
}

export function editar<T extends Versionada>(item: T, mudancas: Partial<Omit<T, "id" | "atualizadoEm" | "dispositivo">>, c: Carimbo): T {
  return semVazios({ ...item, ...mudancas, atualizadoEm: c.agora, dispositivo: c.dispositivo } as T);
}

export function remover<T extends Versionada>(item: T, c: Carimbo): T {
  return editar(item, { removidoEm: c.agora } as Partial<Omit<T, "id" | "atualizadoEm" | "dispositivo">>, c);
}

export function restaurar<T extends Versionada>(item: T, c: Carimbo): T {
  return editar(item, { removidoEm: undefined } as Partial<Omit<T, "id" | "atualizadoEm" | "dispositivo">>, c);
}

/** Ordem manual: chave fracionária com < e >, desempate pelo id. */
export function porOrdem(a: { ordem: string; id: string }, b: { ordem: string; id: string }): number {
  if (a.ordem !== b.ordem) return a.ordem < b.ordem ? -1 : 1;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

export interface ApoioFiltro {
  etiquetas: ReadonlyMap<string, Etiqueta>;
  resumo: (f: Favorito) => ResumoPrazo | undefined;
  /** Para os filtros "com novidade" e "lembrete para hoje". */
  novidades?: (f: Favorito) => Mudanca[];
  hoje?: DataISO;
  /** A última leitura do processo (filtro "fora da unidade"). */
  atual?: (f: Favorito) => Instantaneo | undefined;
  /** Ids das pastas que existem: favorito numa pasta apagada conta como "sem pasta" (como na contagem e no agrupamento). */
  pastas?: ReadonlySet<string>;
}

function temSituacao(fav: Favorito, s: SituacaoFiltro, apoio: ApoioFiltro): boolean {
  switch (s) {
    case "novidade":
      return !!apoio.novidades?.(fav).length;
    case "lembrete":
      return !!apoio.hoje && lembreteVencido(fav, apoio.hoje);
    case "nota":
      return !!fav.nota?.trim();
    case "documentos":
      return !!fav.documentos?.length;
    case "local":
      return !!fav.local;
    case "fora":
      return apoio.atual?.(fav)?.abertoNaUnidade === false;
    case "sigiloso":
      return !!fav.sigiloso || !!fav.sigiloAConfirmar;
  }
}

export function filtrar(lista: Favorito[], f: Filtro, apoio: ApoioFiltro): Favorito[] {
  const termos = normalizarTexto(f.busca ?? "")
    .split(" ")
    .filter(Boolean);
  return lista.filter((fav) => {
    if (fav.removidoEm !== undefined) return false;
    // Registro mínimo sem a cópia local (veio do Texto Padrão de outro computador): não há o que mostrar.
    if (fav.resumido && !fav.protocolo) return false;
    if (f.pastas?.length) {
      const pasta = fav.pasta && (!apoio.pastas || apoio.pastas.has(fav.pasta)) ? fav.pasta : SEM_PASTA;
      if (!f.pastas.includes(pasta)) return false;
    }
    if (f.etiquetas?.length && !f.etiquetas.some((e) => fav.etiquetas.includes(e))) return false;
    if (f.prazos?.length) {
      const r = apoio.resumo(fav);
      if (!f.prazos.includes(r ? r.situacao : "semPrazo")) return false;
    }
    if (f.situacoes?.length && !f.situacoes.some((s) => temSituacao(fav, s, apoio))) return false;
    if (!termos.length) return true;
    const alvo = normalizarTexto(
      [
        fav.protocolo,
        fav.protocolo.replace(/\D/g, ""),
        fav.titulo,
        fav.tipo,
        fav.especificacao,
        fav.nota,
        fav.lembrete?.texto,
        ...fav.etiquetas.map((id) => apoio.etiquetas.get(id)?.nome),
        ...(fav.documentos ?? []).flatMap((d) => [d.numero, d.titulo]),
      ]
        .filter(Boolean)
        .join(" "),
    );
    return termos.every((t) => alvo.includes(t));
  });
}

export function ordenar(
  lista: Favorito[],
  modo: ModoOrdem,
  resumo: (f: Favorito) => ResumoPrazo | undefined,
  novidades?: (f: Favorito) => Mudanca[],
): Favorito[] {
  const copia = [...lista];
  if (modo === "manual") return copia.sort(porOrdem);
  if (modo === "novidade") {
    const tem = (f: Favorito) => (novidades?.(f).length ? 0 : 1);
    return copia.sort((a, b) => tem(a) - tem(b) || porOrdem(a, b));
  }
  if (modo === "inclusao") return copia.sort((a, b) => b.criadoEm - a.criadoEm || porOrdem(a, b));
  if (modo === "protocolo")
    return copia.sort((a, b) => a.protocolo.localeCompare(b.protocolo, "pt-BR", { numeric: true }) || porOrdem(a, b));
  const chave = (f: Favorito) => resumo(f)?.ordem ?? Number.POSITIVE_INFINITY;
  return copia.sort((a, b) => {
    const d = chave(a) - chave(b);
    return Number.isNaN(d) || d === 0 ? porOrdem(a, b) : d;
  });
}
