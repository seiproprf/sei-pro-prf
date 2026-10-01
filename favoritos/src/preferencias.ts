import type { Area } from "@comum/armazenamento/area";
import { CHAVE_PREFERENCIAS } from "./modelo/constantes";
import { PREFERENCIAS_PADRAO, type Preferencias } from "./modelo/tipos";

export async function lerPreferencias(sync: Area): Promise<Preferencias> {
  const v = (await sync.obter(CHAVE_PREFERENCIAS))[CHAVE_PREFERENCIAS];
  return { ...PREFERENCIAS_PADRAO, ...(v && typeof v === "object" ? (v as Partial<Preferencias>) : {}) };
}

export async function gravarPreferencias(sync: Area, m: Partial<Preferencias>): Promise<Preferencias> {
  const nova = { ...(await lerPreferencias(sync)), ...m };
  await sync.gravar({ [CHAVE_PREFERENCIAS]: nova });
  return nova;
}
