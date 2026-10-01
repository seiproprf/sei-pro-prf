/**
 * Ordem manual por índice fracionário: mover um favorito grava SÓ ele, com uma
 * chave entre as dos vizinhos, e a ordem mescla como qualquer campo. O legado
 * renumerava a lista toda a cada arraste, e numa sincronia isso gera conflito
 * em todos os itens.
 *
 * Compare as chaves com `<` e `>`. `localeCompare` usa colação de idioma e
 * embaralha maiúsculas e minúsculas.
 */

import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

export function indiceEntre(antes?: string | null, depois?: string | null): string {
  return generateKeyBetween(antes ?? null, depois ?? null);
}

/** Chave que o algoritmo aceita como vizinha (um arquivo editado à mão pode trazer qualquer texto). */
export function indiceValido(chave: string): boolean {
  try {
    generateKeyBetween(chave, null);
    return true;
  } catch {
    return false;
  }
}

export function indicesEntre(antes: string | null, depois: string | null, n: number): string[] {
  return generateNKeysBetween(antes, depois, n);
}
