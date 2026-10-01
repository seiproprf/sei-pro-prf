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

/**
 * O consentimento é de cada pessoa em cada unidade: o texto fica visível para ELA, ligar numa não liga
 * nas outras, e outro usuário do SEI no mesmo perfil do navegador não herda o "ligado".
 */
const chaveTP = (host: string, login: string, idUnidade: string) => `${host}|${login.trim().toLowerCase()}|${idUnidade}`;

export function estadoTextoPadrao(
  p: Preferencias,
  host: string,
  login: string,
  idUnidade: string,
): "nao-perguntado" | "ligado" | "desligado" {
  return p.textoPadraoUnidades?.[chaveTP(host, login, idUnidade)] ?? "nao-perguntado";
}

export async function definirTextoPadrao(
  sync: Area,
  host: string,
  login: string,
  idUnidade: string,
  valor: "ligado" | "desligado",
): Promise<Preferencias> {
  const p = await lerPreferencias(sync);
  return gravarPreferencias(sync, { textoPadraoUnidades: { ...(p.textoPadraoUnidades ?? {}), [chaveTP(host, login, idUnidade)]: valor } });
}
