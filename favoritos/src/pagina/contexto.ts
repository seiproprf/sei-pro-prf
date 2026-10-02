import { lerContexto } from "@nucleo/sei";
import { paginaDe } from "@nucleo/sessao/pagina";
import type { ContextoAba } from "../modelo/tipos";

export function contextoDe(doc: Document, temaEscuro: boolean, url?: string): ContextoAba | null {
  const c = lerContexto(paginaDe(doc, url));
  if (!c.usuario.login) return null;
  return {
    host: c.host,
    login: c.usuario.login.toLowerCase(),
    nome: c.usuario.nome,
    unidade: c.unidade.id ? { id: c.unidade.id, sigla: c.unidade.sigla, nome: c.unidade.nome } : null,
    versao: c.versao,
    temaEscuro,
  };
}

export { corDoTemaSei, temaEscuroLegado } from "@comum/pagina/tema";
export { documentoTopo, paginaDe } from "@nucleo/sessao/pagina";
