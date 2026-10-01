/** Sem acento, sem caixa, espaços únicos: para busca e para comparar nomes. */
export function normalizarTexto(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * FNV-1a de 32 bits em hexadecimal. Serve para ids estáveis derivados de nome
 * (a migração gera a mesma pasta em qualquer máquina), não para segurança.
 */
export function hashCurto(texto: string): string {
  let h = 0x811c9dc5;
  for (const ch of texto) {
    h ^= ch.codePointAt(0) ?? 0;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}
