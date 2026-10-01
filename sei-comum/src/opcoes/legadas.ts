/**
 * Opções da página de opções antiga (`chrome.storage.sync.dataValues`): uma
 * STRING JSON com a lista de perfis, e um deles traz
 * `configGeral: [{name, value}]`. O módulo novo tem de respeitar o liga/desliga
 * do usuário exatamente como `checkConfigValue` (sei-functions-pro.js): opção
 * ausente conta como LIGADA, e só `value == false` desliga.
 */

export function opcaoLegadaLigada(dataValues: unknown, nome: string): boolean {
  let perfis: unknown = dataValues;
  if (typeof dataValues === "string") {
    if (!dataValues.trim()) return true;
    try {
      perfis = JSON.parse(dataValues);
    } catch {
      return true;
    }
  }
  if (!Array.isArray(perfis) || perfis.length === 0) return true;
  const geral = perfis.map((p) => (p as { configGeral?: unknown } | null)?.configGeral).find(Array.isArray) as
    | Array<{ name?: unknown; value?: unknown }>
    | undefined;
  const valor = geral?.find((o) => o?.name === nome)?.value;
  return !(valor === false || valor === 0 || valor === "");
}

export async function lerOpcaoLegada(nome: string, sync: Pick<chrome.storage.StorageArea, "get"> = chrome.storage.sync): Promise<boolean> {
  const itens = (await sync.get("dataValues")) as { dataValues?: unknown };
  return opcaoLegadaLigada(itens.dataValues, nome);
}
