/**
 * Lado da aba do SEI na ponte com o app do painel lateral. O app não pode abrir
 * porta para a aba sem a permissão `tabs`; então ele anuncia que abriu
 * (`CHAVE_LATERAL` no storage) e a aba conecta. Mesma técnica do agente, com a
 * regra em `sei-comum/ponte/abertura`.
 *
 * A aba se apresenta (visível, foco, chave do contexto) ao conectar e quando
 * ganha foco: é assim que o painel sabe qual aba desta janela está na frente.
 */

import type { Area } from "@comum/armazenamento/area";
import { abridorDe, precisaConectar } from "@comum/ponte/abertura";
import { criarRpc, type PortaRpc, type Rpc, type Tratador } from "@comum/ponte/rpc";
import { CHAVE_LATERAL } from "../modelo/constantes";

export interface EstadoAba {
  visivel: boolean;
  foco: number;
  /** host|login|id da unidade: o painel remonta a lista quando muda. */
  chave: string;
}

export interface DepsLadoAba {
  area: Area;
  conectar(): PortaRpc;
  tratadores: Record<string, Tratador>;
  estado(): EstadoAba;
}

export function ligarLadoAba(d: DepsLadoAba): { apresentar(): void; verificar(): void; parar(): void } {
  let rpc: Rpc | null = null;
  let parado = false;
  const servidos = new Set<string>();

  const apresentar = () => {
    if (rpc?.aberta) void rpc.chamar("ola", d.estado(), 5000).catch(() => undefined);
  };

  const atender = (valor: unknown) => {
    if (parado || !precisaConectar(valor, Boolean(rpc?.aberta), servidos)) return;
    rpc?.fechar();
    let novo: Rpc;
    try {
      novo = criarRpc(d.conectar(), d.tratadores);
    } catch {
      // Extensão recarregada: o contexto do content script morreu, nada a fazer.
      rpc = null;
      return;
    }
    rpc = novo;
    novo.aoFechar(() => {
      if (rpc === novo) rpc = null;
    });
    const quem = abridorDe(valor);
    if (quem) servidos.add(quem);
    apresentar();
  };

  const verificar = () => {
    if (parado) return;
    void d.area
      .obter(CHAVE_LATERAL)
      .then((v) => atender(v[CHAVE_LATERAL]))
      .catch(() => undefined);
  };

  const pararDeOuvir = d.area.aoMudar((m) => {
    if (CHAVE_LATERAL in m) atender(m[CHAVE_LATERAL]?.novo);
  });
  verificar();

  return {
    apresentar,
    verificar,
    parar() {
      parado = true;
      pararDeOuvir();
      rpc?.fechar();
      rpc = null;
    },
  };
}
