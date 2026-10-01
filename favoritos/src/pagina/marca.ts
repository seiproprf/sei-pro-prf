/**
 * Sinal para o legado: com este atributo no <html>, o `init.js` não carrega o
 * `sei-pro-favoritos.js`. O content script novo roda no document_start, então o
 * atributo existe antes do `$(document).ready` do legado. Só o manifest Lab traz
 * o content script novo; no pacote oficial nada muda até o lançamento.
 */
export const ATRIBUTO_ATIVO = "data-seipro-favoritos";

export function marcarAtivo(doc: Document): void {
  doc.documentElement?.setAttribute(ATRIBUTO_ATIVO, "1");
}
