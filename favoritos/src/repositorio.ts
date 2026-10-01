/**
 * Favoritos de UM escopo (usuário + unidade, ou a lista Pessoal) no
 * `chrome.storage.local`, uma chave por entidade. Remover grava lápide
 * (Lixeira de 30 dias, e a sincronia da F3 não ressuscita o removido).
 * A ordem manual é fracionária: mover grava só o item movido.
 */

import type { Area } from "@comum/armazenamento/area";
import { Colecao, obterPorPrefixo } from "@comum/armazenamento/colecao";
import { novoId } from "@comum/id";
import { indiceEntre, indiceValido } from "@comum/ordem/indice";
import { purgarLapides, type Versionada, vence } from "@comum/sincronia/entidade";
import { normalizarTexto } from "@comum/texto";
import { DIAS_LAPIDE, MAX_ETIQUETAS, MAX_NOTA } from "./modelo/constantes";
import { corPadrao } from "./modelo/cores";
import { chaveEscopo } from "./modelo/escopo";
import { editar, novoFavorito, remover, restaurar } from "./modelo/operacoes";
import type { Carimbo, DadosProcesso, Escopo, Etiqueta, Favorito, MudancasFavorito, Pasta } from "./modelo/tipos";

// Chave inválida (dado antigo ou editado à mão) não entra na conta: senão nenhum favorito novo grava.
const maiorOrdem = (itens: Array<{ ordem: string }>): string | null =>
  itens.reduce<string | null>((m, i) => (indiceValido(i.ordem) && (m === null || i.ordem > m) ? i.ordem : m), null);

const porNome = (a: { nome: string }, b: { nome: string }) => a.nome.localeCompare(b.nome, "pt-BR");

export class RepositorioFavoritos {
  readonly favoritos: Colecao<Favorito>;
  readonly pastas: Colecao<Pasta>;
  readonly etiquetas: Colecao<Etiqueta>;
  private readonly chaveMeta: string;
  private readonly base: string;

  constructor(
    private readonly area: Area,
    readonly escopo: Escopo,
    private readonly carimbo: () => Carimbo,
  ) {
    const base = `favoritos/${chaveEscopo(escopo)}/`;
    this.favoritos = new Colecao<Favorito>(area, `${base}f/`);
    this.pastas = new Colecao<Pasta>(area, `${base}p/`);
    this.etiquetas = new Colecao<Etiqueta>(area, `${base}e/`);
    this.chaveMeta = `${base}meta`;
    this.base = base;
  }

  /** Guarda o escopo por extenso (com a sigla da unidade) para a exportação montar o arquivo. */
  async registrar(): Promise<void> {
    await this.area.gravar({ [this.chaveMeta]: { escopo: this.escopo } });
  }

  /** Favoritos (com lápides), pastas e etiquetas ativas desta lista numa leitura só (para o app redesenhar). */
  async instantaneo(): Promise<{ todos: Favorito[]; pastas: Pasta[]; etiquetas: Etiqueta[] }> {
    const tudo = Object.entries(await obterPorPrefixo(this.area, this.base));
    const de = <T>(sub: string) => tudo.filter(([k]) => k.startsWith(this.base + sub)).map(([, v]) => v as T);
    return {
      todos: de<Favorito>("f/"),
      pastas: de<Pasta>("p/")
        .filter((p) => p.removidoEm === undefined)
        .sort(porOrdemPasta),
      etiquetas: de<Etiqueta>("e/")
        .filter((e) => e.removidoEm === undefined)
        .sort(porNome),
    };
  }

  /** Tudo desta lista, com as lápides de favoritos, pastas e etiquetas (para sincronizar). */
  async instantaneoCompleto(): Promise<{ todos: Favorito[]; pastas: Pasta[]; etiquetas: Etiqueta[] }> {
    const tudo = Object.entries(await obterPorPrefixo(this.area, this.base));
    const de = <T>(sub: string) => tudo.filter(([k]) => k.startsWith(this.base + sub)).map(([, v]) => v as T);
    return { todos: de<Favorito>("f/"), pastas: de<Pasta>("p/"), etiquetas: de<Etiqueta>("e/") };
  }

  todos(): Promise<Favorito[]> {
    return this.favoritos.listar();
  }

  async ativos(): Promise<Favorito[]> {
    return (await this.todos()).filter((f) => f.removidoEm === undefined);
  }

  obter(id: string): Promise<Favorito | undefined> {
    return this.favoritos.obter(id);
  }

  async contem(id: string): Promise<boolean> {
    const f = await this.obter(id);
    return !!f && f.removidoEm === undefined;
  }

  async proximaOrdem(): Promise<string> {
    return indiceEntre(maiorOrdem(await this.todos()), null);
  }

  async adicionar(d: DadosProcesso): Promise<Favorito> {
    const c = this.carimbo();
    const atual = await this.obter(d.id);
    let f: Favorito;
    if (!atual) {
      f = novoFavorito(d, await this.proximaOrdem(), c);
    } else {
      const sigiloso = d.sigiloso === undefined ? atual.sigiloso : d.sigiloso ? (true as const) : undefined;
      const m: MudancasFavorito = {
        protocolo: d.protocolo || atual.protocolo,
        tipo: d.tipo || atual.tipo,
        sigiloso,
        especificacao: sigiloso ? undefined : d.especificacao || atual.especificacao,
      };
      // Re-favoritar o que estava na lixeira devolve pasta, etiquetas e nota de antes, no fim da lista.
      if (atual.removidoEm !== undefined) Object.assign(m, { removidoEm: undefined, ordem: await this.proximaOrdem() });
      f = editar(atual, m, c);
    }
    await this.favoritos.gravar(f.id, f);
    return f;
  }

  async editar(id: string, mudancas: MudancasFavorito): Promise<Favorito> {
    const atual = await this.obter(id);
    if (!atual) throw new Error(`O favorito ${id} não existe nesta lista.`);
    const m: MudancasFavorito = { ...mudancas };
    if (m.etiquetas) m.etiquetas = [...new Set(m.etiquetas)].slice(0, MAX_ETIQUETAS);
    if (typeof m.nota === "string") m.nota = m.nota.slice(0, MAX_NOTA).trim() ? m.nota.slice(0, MAX_NOTA) : undefined;
    if (typeof m.titulo === "string") m.titulo = m.titulo.trim() || undefined;
    const f = editar(atual, m, this.carimbo());
    await this.favoritos.gravar(id, f);
    return f;
  }

  async remover(ids: string[]): Promise<number> {
    const c = this.carimbo();
    const alvos = (await Promise.all(ids.map((id) => this.obter(id)))).filter((f): f is Favorito => !!f && f.removidoEm === undefined);
    await this.favoritos.gravarVarios(alvos.map((f) => [f.id, remover(f, c)]));
    return alvos.length;
  }

  async restaurar(ids: string[]): Promise<number> {
    const c = this.carimbo();
    const alvos = (await Promise.all(ids.map((id) => this.obter(id)))).filter((f): f is Favorito => !!f && f.removidoEm !== undefined);
    await this.favoritos.gravarVarios(alvos.map((f) => [f.id, restaurar(f, c)]));
    return alvos.length;
  }

  async mover(id: string, anteriorId: string | null, posteriorId: string | null): Promise<void> {
    const a = anteriorId ? await this.obter(anteriorId) : undefined;
    const b = posteriorId ? await this.obter(posteriorId) : undefined;
    let ordem: string;
    try {
      ordem = indiceEntre(a?.ordem ?? null, b?.ordem ?? null);
    } catch {
      // Chaves iguais vindas de dois computadores: o item fica logo depois do anterior.
      ordem = indiceEntre(a?.ordem ?? null, null);
    }
    await this.editar(id, { ordem });
  }

  async pastasAtivas(): Promise<Pasta[]> {
    return (await this.pastas.listar()).filter((p) => p.removidoEm === undefined).sort((x, y) => porOrdemPasta(x, y));
  }

  async criarPasta(nome: string, cor?: string): Promise<Pasta> {
    const limpo = nome.trim();
    if (!limpo) throw new Error("Informe o nome da pasta.");
    const todas = await this.pastas.listar();
    const igual = todas.find((p) => p.removidoEm === undefined && normalizarTexto(p.nome) === normalizarTexto(limpo));
    if (igual) return igual;
    const c = this.carimbo();
    const p: Pasta = {
      id: novoId(),
      nome: limpo,
      ordem: indiceEntre(maiorOrdem(todas), null),
      atualizadoEm: c.agora,
      dispositivo: c.dispositivo,
    };
    if (cor) p.cor = cor;
    await this.pastas.gravar(p.id, p);
    return p;
  }

  async editarPasta(id: string, m: Partial<Pick<Pasta, "nome" | "cor" | "ordem">>): Promise<void> {
    const atual = await this.pastas.obter(id);
    if (atual) await this.pastas.gravar(id, editar(atual, m, this.carimbo()));
  }

  async removerPasta(id: string): Promise<void> {
    const atual = await this.pastas.obter(id);
    if (!atual) return;
    const c = this.carimbo();
    await this.pastas.gravar(id, remover(atual, c));
    const afetados = (await this.todos()).filter((f) => f.pasta === id);
    await this.favoritos.gravarVarios(afetados.map((f) => [f.id, editar(f, { pasta: undefined }, c)]));
  }

  async etiquetasAtivas(): Promise<Etiqueta[]> {
    return (await this.etiquetas.listar()).filter((e) => e.removidoEm === undefined).sort(porNome);
  }

  async criarEtiqueta(nome: string, cor?: string): Promise<Etiqueta> {
    const limpo = nome.trim();
    if (!limpo) throw new Error("Informe o nome da etiqueta.");
    const igual = (await this.etiquetas.listar()).find(
      (e) => e.removidoEm === undefined && normalizarTexto(e.nome) === normalizarTexto(limpo),
    );
    if (igual) return igual;
    const c = this.carimbo();
    const e: Etiqueta = {
      id: novoId(),
      nome: limpo,
      cor: cor ?? corPadrao(limpo),
      atualizadoEm: c.agora,
      dispositivo: c.dispositivo,
    };
    await this.etiquetas.gravar(e.id, e);
    return e;
  }

  async editarEtiqueta(id: string, m: Partial<Pick<Etiqueta, "nome" | "cor" | "icone">>): Promise<void> {
    const atual = await this.etiquetas.obter(id);
    if (atual) await this.etiquetas.gravar(id, editar(atual, m, this.carimbo()));
  }

  async removerEtiqueta(id: string): Promise<void> {
    const atual = await this.etiquetas.obter(id);
    if (!atual) return;
    const c = this.carimbo();
    await this.etiquetas.gravar(id, remover(atual, c));
    const afetados = (await this.todos()).filter((f) => f.etiquetas.includes(id));
    await this.favoritos.gravarVarios(afetados.map((f) => [f.id, editar(f, { etiquetas: f.etiquetas.filter((x) => x !== id) }, c)]));
  }

  /** Mescla entidades vindas de fora (arquivo, migração): vence a versão mais recente de cada uma. */
  async importar(d: { favoritos?: Favorito[]; pastas?: Pasta[]; etiquetas?: Etiqueta[] }): Promise<{ novos: number; atualizados: number }> {
    const r = await this.mesclarEm(this.favoritos, d.favoritos ?? []);
    await this.mesclarEm(this.pastas, d.pastas ?? []);
    await this.mesclarEm(this.etiquetas, d.etiquetas ?? []);
    return r;
  }

  private async mesclarEm<T extends Versionada>(col: Colecao<T>, itens: T[]): Promise<{ novos: number; atualizados: number }> {
    const atuais = new Map((await col.listar()).map((i) => [i.id, i]));
    const gravar: Array<[string, T]> = [];
    let novos = 0;
    let atualizados = 0;
    for (const item of itens) {
      const atual = atuais.get(item.id);
      if (!atual) {
        novos += 1;
        gravar.push([item.id, item]);
      } else if (vence(item, atual)) {
        atualizados += 1;
        gravar.push([item.id, item]);
      }
    }
    await col.gravarVarios(gravar);
    return { novos, atualizados };
  }

  /** Apaga de vez as lápides com mais de 90 dias (a sincronia da F3 já as terá propagado). */
  async limpar(agora = Date.now()): Promise<void> {
    for (const col of [this.favoritos, this.pastas, this.etiquetas] as Array<Colecao<Versionada>>) {
      const todos = await col.listar();
      const manter = new Set(purgarLapides(todos, agora, DIAS_LAPIDE).map((i) => i.id));
      await col.apagar(todos.filter((i) => !manter.has(i.id)).map((i) => i.id));
    }
  }

  aoMudar(cb: () => void): () => void {
    const parar = [this.favoritos.aoMudar(cb), this.pastas.aoMudar(cb), this.etiquetas.aoMudar(cb)];
    return () => {
      for (const p of parar) p();
    };
  }
}

function porOrdemPasta(a: Pasta, b: Pasta): number {
  if (a.ordem !== b.ordem) return a.ordem < b.ordem ? -1 : 1;
  return porNome(a, b);
}

/**
 * Leva um favorito da lista da unidade para a Pessoal, ou o contrário. Pasta e
 * etiquetas são de cada lista e ficam para trás; título, nota, prazo e mapa vão junto.
 */
export async function moverEntreListas(origem: RepositorioFavoritos, destino: RepositorioFavoritos, id: string): Promise<Favorito | null> {
  const f = await origem.obter(id);
  if (!f || f.removidoEm !== undefined) return null;
  await destino.adicionar({ id: f.id, protocolo: f.protocolo, tipo: f.tipo, especificacao: f.especificacao, sigiloso: f.sigiloso });
  const copiado = await destino.editar(id, {
    titulo: f.titulo,
    nota: f.nota,
    prazo: f.prazo,
    local: f.local,
    pasta: undefined,
    etiquetas: [],
  });
  await origem.remover([id]);
  return copiado;
}
