/**
 * Sinal para o legado: com este atributo no <html>, o `init.js` não carrega o
 * código antigo do histórico. O content script roda no document_start, então o
 * atributo existe antes do `$(document).ready` do legado.
 */
import { ATRIBUTO_ATIVO } from "../modelo/constantes";

export function marcarAtivo(doc: Document): void {
  doc.documentElement?.setAttribute(ATRIBUTO_ATIVO, "1");
}
