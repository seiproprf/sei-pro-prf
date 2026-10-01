/**
 * Onde os favoritos aparecem. O painel lateral só existe onde o manifest
 * declara um (`side_panel` no Chrome, `sidebar_action` no Firefox); os pacotes
 * dos órgãos não têm, e para eles a preferência "lateral" cai no lugar de hoje.
 */

import type { Preferencias } from "./tipos";

export function temPainelLateral(manifesto: object): boolean {
  const m = manifesto as { side_panel?: unknown; sidebar_action?: unknown };
  return Boolean(m.side_panel || m.sidebar_action);
}

export function ondeMostrar(exibir: Preferencias["exibir"], lateral: boolean): { abaixo: boolean; lateral: boolean } {
  if (!lateral) return { abaixo: true, lateral: false };
  return { abaixo: exibir !== "lateral", lateral: exibir !== "abaixo" };
}

export const ROTULOS_EXIBIR: Record<Preferencias["exibir"], string> = {
  abaixo: "Abaixo da lista de processos",
  lateral: "No painel lateral",
  ambos: "Nos dois lugares",
};
