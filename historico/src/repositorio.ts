import type { Area } from "@comum/armazenamento/area";
import { Colecao } from "@comum/armazenamento/colecao";
import { chaveMeta, escopoValido, prefixoVisitas } from "./modelo/constantes";
import { inicioDoDia } from "./modelo/dias";
import type { DadosCompletos, DadosVisita, MetaHistorico, PeriodoApagar, Visita } from "./modelo/tipos";
import { aPodar, completar, mesclarMigrada, registrar, semDadosSensiveis, visitaValida } from "./modelo/visita";

/** Início do período, no calendário local (dias por Date, não por 24 h fixas). */
export function corteDoPeriodo(p: PeriodoApagar, agora: number): number {
  if (p === "tudo") return Number.NEGATIVE_INFINITY;
  if (p === "hora") return agora - 3_600_000;
  const d = new Date(inicioDoDia(agora));
  if (p === "7dias") d.setDate(d.getDate() - 6);
  if (p === "30dias") d.setDate(d.getDate() - 29);
  return d.getTime();
}

export class RepositorioHistorico {
  private readonly col: Colecao<Visita>;
  private readonly kMeta: string;
  constructor(
    private readonly area: Area,
    readonly escopo: string,
  ) {
    this.col = new Colecao<Visita>(area, prefixoVisitas(escopo));
    this.kMeta = chaveMeta(escopo);
  }
  /** Escopo com SEI e login: só com ele a meta é gravada. */
  get valido(): boolean {
    return escopoValido(this.escopo);
  }
  async listar(): Promise<Visita[]> {
    return (await this.col.listar()).filter(visitaValida).map((v) => ({ ...v, unidades: Array.isArray(v.unidades) ? v.unidades : [] }));
  }
  async obter(id: string): Promise<Visita | undefined> {
    const v = await this.col.obter(id);
    return visitaValida(v) ? { ...v, unidades: Array.isArray(v.unidades) ? v.unidades : [] } : undefined;
  }
  async registrarVisita(d: DadosVisita, agora = Date.now()): Promise<Visita> {
    const v = registrar(await this.obter(d.id), d, agora);
    await this.col.gravar(d.id, v);
    return v;
  }
  async completar(id: string, c: DadosCompletos, agora = Date.now()): Promise<Visita | undefined> {
    const atual = await this.obter(id);
    if (!atual) return undefined;
    const v = completar(atual, c, agora);
    await this.col.gravar(id, v);
    return v;
  }
  async marcarTentativa(id: string, agora = Date.now()): Promise<void> {
    const atual = await this.obter(id);
    if (atual) await this.col.gravar(id, { ...atual, tentouEm: agora });
  }
  async remover(ids: string[]): Promise<number> {
    const unicos = [...new Set(ids)];
    await this.col.apagar(unicos);
    return unicos.length;
  }
  async apagarPeriodo(p: PeriodoApagar, agora = Date.now()): Promise<number> {
    const corte = corteDoPeriodo(p, agora);
    const ids = (await this.listar()).filter((v) => v.ultima >= corte).map((v) => v.id);
    await this.col.apagar(ids);
    return ids.length;
  }
  async contar(): Promise<number> {
    if (this.area.chaves) return (await this.area.chaves()).filter((k) => k.startsWith(this.col.prefixo)).length;
    return (await this.listar()).length;
  }
  async podar(limite: number): Promise<number> {
    if ((await this.contar()) <= limite) return 0;
    const ids = aPodar(await this.listar(), limite);
    await this.col.apagar(ids);
    return ids.length;
  }
  async importar(visitas: Visita[]): Promise<number> {
    if (!visitas.length) return 0;
    const atuais = new Map((await this.listar()).map((v) => [v.id, v]));
    await this.col.gravarVarios(
      visitas.map((m) => {
        const v = mesclarMigrada(atuais.get(m.id), m);
        return [m.id, v.nivel === "sigiloso" ? semDadosSensiveis(v) : v];
      }),
    );
    return visitas.length;
  }
  async meta(): Promise<MetaHistorico> {
    const v = (await this.area.obter(this.kMeta))[this.kMeta];
    return v && typeof v === "object" ? { ...(v as MetaHistorico) } : {};
  }
  async gravarMeta(m: Partial<MetaHistorico>): Promise<MetaHistorico> {
    // Sem SEI ou sem login (painel com o histórico desligado), a chave seria "historico/|/meta": recusa.
    if (!this.valido) {
      console.warn("[SEI Pro] histórico: meta não gravada, escopo inválido", JSON.stringify(this.escopo));
      return {};
    }
    const nova: Record<string, unknown> = { ...(await this.meta()), ...m };
    for (const k of Object.keys(nova)) if (nova[k] === undefined) delete nova[k];
    await this.area.gravar({ [this.kMeta]: nova });
    return nova as MetaHistorico;
  }
  aoMudar(cb: () => void): () => void {
    return this.area.aoMudar((m) => {
      if (Object.keys(m).some((k) => k.startsWith(this.col.prefixo) || k === this.kMeta)) cb();
    });
  }
}
