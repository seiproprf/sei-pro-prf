/** Números e quantidades nos textos do histórico. */

/** "1.234" (milhar com ponto). */
export const numero = (n: number): string => n.toLocaleString("pt-BR");

/** "1 processo", "1.234 processos". */
export const processos = (n: number): string => `${numero(n)} ${n === 1 ? "processo" : "processos"}`;
