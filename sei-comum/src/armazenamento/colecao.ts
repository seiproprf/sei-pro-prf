/**
 * Entidades guardadas UMA POR CHAVE (`<prefixo><id>`). Gravar um favorito não
 * reescreve a lista inteira: o content script (estrela) e o app (edição), ou
 * duas abas, mexendo em itens diferentes ao mesmo tempo não se atropelam. No
 * legado era tudo um objeto só, e quem gravava por último apagava o resto.
 */

import type { Area } from "./area";

/** Valores das chaves que começam com o prefixo, numa leitura. Sem `chaves()`, lê a área inteira. */
export async function obterPorPrefixo(area: Area, prefixo: string): Promise<Record<string, unknown>> {
  if (area.chaves) {
    const chaves = (await area.chaves()).filter((k) => k.startsWith(prefixo));
    return chaves.length ? area.obter(chaves) : {};
  }
  const tudo = await area.obter(null);
  return Object.fromEntries(Object.entries(tudo).filter(([k]) => k.startsWith(prefixo)));
}

export class Colecao<T> {
  constructor(
    private readonly area: Area,
    readonly prefixo: string,
  ) {}

  chave(id: string): string {
    return this.prefixo + id;
  }

  async listar(): Promise<T[]> {
    return Object.values(await obterPorPrefixo(this.area, this.prefixo)) as T[];
  }

  async obter(id: string): Promise<T | undefined> {
    const k = this.chave(id);
    return (await this.area.obter(k))[k] as T | undefined;
  }

  async gravar(id: string, valor: T): Promise<void> {
    await this.area.gravar({ [this.chave(id)]: valor });
  }

  async gravarVarios(itens: Array<[string, T]>): Promise<void> {
    if (!itens.length) return;
    await this.area.gravar(Object.fromEntries(itens.map(([id, v]) => [this.chave(id), v])));
  }

  async apagar(ids: string[]): Promise<void> {
    if (ids.length) await this.area.remover(ids.map((id) => this.chave(id)));
  }

  aoMudar(cb: () => void): () => void {
    return this.area.aoMudar((m) => {
      if (Object.keys(m).some((k) => k.startsWith(this.prefixo))) cb();
    });
  }
}
