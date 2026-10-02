import { lerContexto } from "@nucleo/sei";
import { paginaDe } from "@nucleo/sessao/pagina";
import type { ContextoHistorico } from "../modelo/tipos";

export interface OpcoesContexto {
  temaEscuro: boolean;
  favoritosAtivo: boolean;
  lateralDisponivel: boolean;
  corTema?: string;
}

export function contextoHistorico(doc: Document, o: OpcoesContexto, url?: string): ContextoHistorico | null {
  const c = lerContexto(paginaDe(doc, url));
  if (!c.usuario.login) return null;
  const ctx: ContextoHistorico = {
    host: c.host,
    login: c.usuario.login.toLowerCase(),
    nome: c.usuario.nome,
    unidade: c.unidade.id ? { id: c.unidade.id, sigla: c.unidade.sigla, nome: c.unidade.nome } : null,
    versao: c.versao,
    temaEscuro: o.temaEscuro,
    favoritosAtivo: o.favoritosAtivo,
    lateralDisponivel: o.lateralDisponivel,
  };
  if (o.corTema) ctx.corTema = o.corTema;
  return ctx;
}
