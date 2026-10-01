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

/** O consentimento é de cada unidade: o texto fica visível para ELA, e ligar numa não liga nas outras. */
export function estadoTextoPadrao(p: Preferencias, host: string, idUnidade: string): "nao-perguntado" | "ligado" | "desligado" {
  return p.textoPadraoUnidades?.[`${host}|${idUnidade}`] ?? "nao-perguntado";
}

export async function definirTextoPadrao(
  sync: Area,
  host: string,
  idUnidade: string,
  valor: "ligado" | "desligado",
): Promise<Preferencias> {
  const p = await lerPreferencias(sync);
  return gravarPreferencias(sync, { textoPadraoUnidades: { ...(p.textoPadraoUnidades ?? {}), [`${host}|${idUnidade}`]: valor } });
}
