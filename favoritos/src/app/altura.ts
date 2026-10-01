import type { Rpc } from "@comum/ponte/rpc";

/**
 * O iframe abaixo da lista cresce com o conteúdo (a página do SEI rola, não o
 * iframe). Enquanto um <dialog> está aberto, pede-se uma altura mínima: o
 * diálogo vive dentro do iframe e seria cortado.
 */
export function observarAltura(rpc: Pick<Rpc, "chamar">): { minimo(px: number): void; medir(): void } {
  const app = document.getElementById("app") ?? document.body;
  let minimo = 0;
  let ultima = 0;
  const enviar = () => {
    const px = Math.max(Math.ceil(app.getBoundingClientRect().height) + 4, minimo);
    if (px === ultima) return;
    ultima = px;
    void rpc.chamar("altura", { px }).catch(() => undefined);
  };
  new ResizeObserver(enviar).observe(app);
  enviar();
  return {
    minimo(px) {
      minimo = px;
      enviar();
    },
    // Ler a geometria força o layout mesmo com a renderização do iframe suspensa.
    medir: enviar,
  };
}
