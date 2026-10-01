/**
 * Id aleatório deste navegador. Serve só para desempatar duas gravações no
 * mesmo milissegundo, sempre na mesma direção nos dois lados da sincronia. Se
 * dois contextos o criarem juntos, um deles usa o id "perdedor" até recarregar,
 * sem efeito prático.
 */

import type { Area } from "./area";

export async function idDispositivo(area: Area, chave = "seipro/dispositivo"): Promise<string> {
  const atual = (await area.obter(chave))[chave];
  if (typeof atual === "string" && atual) return atual;
  const novo = crypto.randomUUID();
  await area.gravar({ [chave]: novo });
  return novo;
}
