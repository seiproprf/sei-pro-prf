import type { Area } from "@comum/armazenamento/area";
import { CHAVE_PREFERENCIAS } from "./modelo/constantes";
import { LIMITES, ORDENS, PREFERENCIAS_PADRAO, type Preferencias } from "./modelo/tipos";

/** Completa com o padrão e descarta valor inválido, pela mesma regra na leitura e na gravação. */
export function normalizar(entrada: Partial<Preferencias>): Preferencias {
  const p = { ...PREFERENCIAS_PADRAO, ...entrada };
  return {
    registrar: p.registrar !== false,
    limite: LIMITES.includes(p.limite) ? p.limite : PREFERENCIAS_PADRAO.limite,
    ordem: ORDENS.includes(p.ordem) ? p.ordem : PREFERENCIAS_PADRAO.ordem,
    agruparPorDia: p.agruparPorDia !== false,
  };
}

export async function lerPreferencias(area: Area): Promise<Preferencias> {
  const v = (await area.obter(CHAVE_PREFERENCIAS))[CHAVE_PREFERENCIAS];
  return normalizar(v && typeof v === "object" ? (v as Partial<Preferencias>) : {});
}

export async function gravarPreferencias(area: Area, m: Partial<Preferencias>): Promise<Preferencias> {
  const nova = normalizar({ ...(await lerPreferencias(area)), ...m });
  await area.gravar({ [CHAVE_PREFERENCIAS]: nova });
  return nova;
}
