/** Espera um elemento que o SEI desenha por JavaScript depois do carregamento (o topo da árvore). */
export function esperar<T>(achar: () => T | null | undefined, prazoMs: number, intervaloMs = 200): Promise<T | null> {
  const inicio = Date.now();
  return new Promise((ok) => {
    const tentar = () => {
      const v = achar();
      if (v) return ok(v);
      if (Date.now() - inicio >= prazoMs) return ok(null);
      setTimeout(tentar, intervaloMs);
    };
    tentar();
  });
}
