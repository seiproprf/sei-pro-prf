import type { Pagina } from "./http";

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
