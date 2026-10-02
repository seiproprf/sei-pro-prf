/**
 * O painel lateral da extensão (html/painel.html): abas Favoritos | Histórico |
 * Agente de IA. A casca genérica mora em `@comum/painel/shell`; aqui só se
 * decide quais abas existem neste pacote e como cada uma se chama.
 */

import type { Area } from "@comum/armazenamento/area";
import { CHAVE_ABA, type DefAba, montarAbas } from "@comum/painel/shell";

export { CHAVE_ABA };
export type AbaPainel = "favoritos" | "historico" | "agente";

export interface DepsShell {
  sessao: Area;
  temAgente: boolean;
  /** O favoritos novo está no manifest (no pacote oficial ainda com o antigo, a aba nunca conectaria). Padrão: true. */
  temFavoritos?: boolean;
  /** O histórico está no manifest (js/init_historico.js). Padrão: false. */
  temHistorico?: boolean;
  url(caminho: string): string;
  /** Aba pedida pelo endereço (`#aba=agente`), quando o painel abre numa janela comum (Firefox). */
  abaDoEndereco?: AbaPainel | null;
  /** chrome.storage.local: o app grava as pendências (lembretes + novidades) em `favoritos/contadorPainel`. */
  local?: Area;
}

export const CHAVE_CONTADOR = "favoritos/contadorPainel";

export async function montarShell(raiz: HTMLElement, d: DepsShell): Promise<{ mostrar(aba: AbaPainel): void; atual(): AbaPainel }> {
  const abas: DefAba[] = [
    ...(d.temFavoritos !== false
      ? [
          {
            id: "favoritos",
            rotulo: "Favoritos",
            icone: "estrela",
            caminho: "html/favoritos.html#modo=lateral",
            titulo: "Favoritos do SEI Pro",
            contador: {
              chave: CHAVE_CONTADOR,
              dica: (n: number) => `${n} ${n === 1 ? "favorito pede" : "favoritos pedem"} atenção (lembrete ou novidade)`,
            },
          } satisfies DefAba,
        ]
      : []),
    ...(d.temHistorico === true
      ? [
          {
            id: "historico",
            rotulo: "Histórico",
            icone: "historico",
            caminho: "html/historico.html#modo=lateral",
            titulo: "Histórico de processos visitados",
          } satisfies DefAba,
        ]
      : []),
    ...(d.temAgente
      ? [
          {
            id: "agente",
            rotulo: "Agente de IA",
            icone: "brilho",
            caminho: "html/agente.html",
            titulo: "Agente de IA do SEI Pro",
          } satisfies DefAba,
        ]
      : []),
  ];
  const r = await montarAbas(raiz, { sessao: d.sessao, local: d.local, abas, url: d.url, abaDoEndereco: d.abaDoEndereco });
  return {
    mostrar: (aba) => r.mostrar(aba),
    atual: () => (r.atual() || "agente") as AbaPainel,
  };
}
