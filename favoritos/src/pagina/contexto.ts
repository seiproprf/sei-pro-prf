import { lerContexto } from "@nucleo/sei";
import type { Pagina } from "@nucleo/sessao/http";
import type { ContextoAba } from "../modelo/tipos";

/** A tela que o usuário já tem aberta, no formato que o núcleo lê, sem requisição. */
export function paginaDe(doc: Document, url = doc.location?.href ?? "https://sei.invalido/sei/controlador.php"): Pagina {
  return {
    url,
    status: 200,
    get html() {
      return doc.documentElement.outerHTML;
    },
    doc,
  };
}

/** O cabeçalho (usuário, unidade) está na janela de topo; os iframes do SEI são da mesma origem. */
export function documentoTopo(): Document {
  try {
    return window.top?.document ?? document;
  } catch {
    return document;
  }
}

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

/** Modo noturno do SEI Pro: o legado guarda no localStorage da origem do SEI. */
export function temaEscuroLegado(armazenamento: Pick<Storage, "getItem">): boolean {
  try {
    return !!armazenamento.getItem("darkModePro");
  } catch {
    return false;
  }
}
