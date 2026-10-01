/**
 * O que as estrelas da página precisam: saber se um processo é favorito (em
 * qualquer das duas listas) e alternar. Favoritar NÃO faz requisição ao SEI:
 * os dados vêm da tela. O legado abria um iframe oculto, esperava até 45 s e
 * desistia em silêncio (sugestão #1397), e abrir a árvore de processo da caixa
 * faz o SEI registrar o recebimento (arvore_montar.php:420).
 */

import type { DadosProcesso, Favorito } from "../modelo/tipos";
import type { RepositorioFavoritos } from "../repositorio";

export interface DepsServico {
  unidade: RepositorioFavoritos | null;
  pessoal: RepositorioFavoritos;
  aoAdicionar?: (f: Favorito, repo: RepositorioFavoritos, ancora: HTMLElement) => void;
}

export class ServicoFavoritosPagina {
  private ids = new Set<string>();
  private readonly ouvintes = new Set<() => void>();
  private agendado = false;

  constructor(private readonly d: DepsServico) {
    for (const r of [d.unidade, d.pessoal]) r?.aoMudar(() => this.agendarRecarga());
  }

  async carregar(): Promise<void> {
    const listas = await Promise.all([this.d.unidade ? this.d.unidade.ativos() : Promise.resolve([]), this.d.pessoal.ativos()]);
    this.ids = new Set(listas.flat().map((f) => f.id));
    this.avisar();
  }

  ativo(id: string): boolean {
    return this.ids.has(id);
  }

  aoMudar(cb: () => void): () => void {
    this.ouvintes.add(cb);
    return () => this.ouvintes.delete(cb);
  }

  async alternar(d: DadosProcesso, ancora: HTMLElement): Promise<boolean> {
    if (this.ids.has(d.id)) {
      await Promise.all([this.d.unidade?.remover([d.id]), this.d.pessoal.remover([d.id])]);
      this.ids.delete(d.id);
      this.avisar();
      return false;
    }
    const repo = this.d.unidade ?? this.d.pessoal;
    const f = await repo.adicionar(d);
    this.ids.add(d.id);
    this.avisar();
    this.d.aoAdicionar?.(f, repo, ancora);
    return true;
  }

  private avisar(): void {
    for (const o of [...this.ouvintes]) o();
  }

  /** Uma operação dispara vários avisos do storage (favorito, pasta...): recarrega uma vez só. */
  private agendarRecarga(): void {
    if (this.agendado) return;
    this.agendado = true;
    setTimeout(() => {
      this.agendado = false;
      void this.carregar();
    }, 30);
  }
}
