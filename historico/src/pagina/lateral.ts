/**
 * Lado da aba do SEI na barra lateral: a aba conecta ao app do painel quando ele anuncia
 * que abriu e se apresenta (visível, foco, chave). A chave de roteamento é host|login, SEM a
 * unidade: o histórico é da pessoa. Ao trocar de unidade (o SEI recarrega a página e a aba se
 * reapresenta), o painel relê o contexto e remonta, para os Favoritos irem para a lista da
 * unidade certa.
 */
import type { Area } from "@comum/armazenamento/area";
import { ligarLadoAba } from "@comum/ponte/lateral";
import type { PortaRpc, Tratador } from "@comum/ponte/rpc";
import { CANAL_LATERAL, CHAVE_LATERAL, chaveEscopo } from "../modelo/constantes";
import type { ContextoHistorico } from "../modelo/tipos";

export const chaveDaAba = (ctx: ContextoHistorico): string => chaveEscopo(ctx.host, ctx.login);

export function ligarPainelLateral(ctx: ContextoHistorico, area: Area, tratadores: Record<string, Tratador>): void {
  let foco = document.hasFocus() ? Date.now() : 0;
  const lado = ligarLadoAba({
    area,
    chave: CHAVE_LATERAL,
    conectar: () => chrome.runtime.connect({ name: CANAL_LATERAL }) as unknown as PortaRpc,
    tratadores,
    estado: () => ({ visivel: document.visibilityState === "visible", foco, chave: chaveDaAba(ctx) }),
  });
  const marcar = () => {
    foco = Date.now();
    lado.apresentar();
  };
  window.addEventListener("focus", marcar);
  document.addEventListener("visibilitychange", () => (document.visibilityState === "visible" ? marcar() : lado.apresentar()));
  // Rede de segurança para abas abertas antes do painel e portas que caíram sem aviso.
  setInterval(() => lado.verificar(), 5000);
}
