/**
 * O agente lê o histórico de processos visitados do SEI Pro. SOMENTE LEITURA.
 *
 * O painel do agente é página da extensão: lê o `chrome.storage.local` direto,
 * pelo repositório do histórico, sem ponte. Da aba vem só o escopo (SEI e
 * usuário). Processo sigiloso nunca sai daqui: nem o número.
 */

import { type Area, areaChrome } from "@comum/armazenamento/area";
import { normalizarTexto } from "@comum/texto";
import { chaveEscopo } from "@historico/modelo/constantes";
import { dataHora } from "@historico/modelo/dias";
import { filtrar, ordenar } from "@historico/modelo/operacoes";
import type { Periodo } from "@historico/modelo/tipos";
import { RepositorioHistorico } from "@historico/repositorio";
import { s } from "../motor/esquema";
import { definirTool, type DefTool } from "../motor/tools";

let fonteArea: () => Area = () => areaChrome(chrome.storage.local, "local");

/** Para os testes: a área em memória no lugar do chrome.storage. */
export function definirAreaHistorico(f: () => Area): void {
  fonteArea = f;
}

/** O manifest da extensão traz o histórico (false sem `chrome`, como nos testes). */
export function historicoInstalado(): boolean {
  try {
    return (chrome.runtime.getManifest().content_scripts ?? []).some((c) => c.js?.includes("js/init_historico.js"));
  } catch {
    return false;
  }
}

const LIMITE_PADRAO = 30;
const LIMITE_MAX = 200;

export const TOOL_HISTORICO: DefTool = definirTool({
  nome: "historico_listar",
  descricao:
    "Lista os processos que o usuário VISITOU no SEI (histórico do SEI Pro): número, tipo, especificação, interessados, assuntos, quando abriu pela última vez, quantas vezes e em qual unidade. Use para 'que processos eu vi ontem', 'retome o processo de licitação que abri semana passada', 'quais processos mais consultei'. Somente leitura; não abre nada no SEI. Processos sigilosos ficam de fora.",
  parametros: s.objeto({
    "busca?": s.texto({ descricao: "Parte do número, tipo, especificação, interessado, assunto ou unidade (sem acento/caixa)." }),
    "periodo?": s.texto({ enum: ["hoje", "ontem", "7dias", "30dias", "todos"], descricao: "Padrão: todos." }),
    "tipo?": s.texto({ descricao: "Parte do tipo do processo (sem acento/caixa)." }),
    "unidade?": s.texto({ descricao: "Sigla da unidade (sem diferenciar caixa)." }),
    "ordem?": s.texto({ enum: ["recentes", "visitados"], descricao: "recentes = última visita primeiro; visitados = mais abertos primeiro. Padrão: recentes." }),
    "limite?": s.inteiro({ descricao: `Quantos devolver. Padrão ${LIMITE_PADRAO}, máximo ${LIMITE_MAX}.` }),
  }),
  efeito: "leitura",
  rotulo: () => "Ler o histórico de processos",
  executar: async (a, ctx) => {
    const e = await ctx.sei<{ host: string; login: string }>("favoritos.escopo");
    const todas = await new RepositorioHistorico(fonteArea(), chaveEscopo(e.host, e.login)).listar();
    // Sigiloso sai antes de qualquer outra coisa: só entra na contagem.
    const sigilosos = todas.filter((v) => v.nivel === "sigiloso").length;
    const agora = Date.now();
    const periodo = String(a.periodo ?? "todos");
    const sigla = a.unidade ? String(a.unidade).trim().toLowerCase() : "";
    const tipo = a.tipo ? normalizarTexto(String(a.tipo)) : "";
    let lista = filtrar(
      todas.filter((v) => v.nivel !== "sigiloso"),
      {
        busca: a.busca ? String(a.busca) : undefined,
        periodos: periodo !== "todos" ? [periodo as Periodo] : undefined,
      },
      { agora, favoritos: null },
    );
    if (tipo) lista = lista.filter((v) => normalizarTexto(v.tipo ?? "").includes(tipo));
    if (sigla) lista = lista.filter((v) => v.unidades.some((u) => u.sigla.toLowerCase() === sigla));
    lista = ordenar(lista, a.ordem === "visitados" ? "visitados" : "recentes");
    const pedido = Number(a.limite);
    const limite = Number.isFinite(pedido) ? Math.min(LIMITE_MAX, Math.max(1, Math.floor(pedido))) : LIMITE_PADRAO;
    const itens = lista.slice(0, limite).map((v) => ({
      protocolo: v.protocolo,
      ...(v.tipo ? { tipo: v.tipo } : {}),
      ...(v.especificacao ? { especificacao: v.especificacao } : {}),
      ...(v.interessados?.length ? { interessados: v.interessados } : {}),
      ...(v.assuntos?.length ? { assuntos: v.assuntos } : {}),
      ultimaVisita: dataHora(v.ultima),
      vezes: v.vezes,
      unidade: v.unidades.length ? v.unidades.map((u) => u.sigla).join(", ") : "",
    }));
    return {
      total: lista.length,
      itens,
      ...(lista.length > limite ? { cortados: lista.length - limite } : {}),
      sigilososOmitidos: sigilosos,
    };
  },
});
