/**
 * Lado do app na ponte do painel lateral. O painel é um só por janela e não
 * pertence a aba nenhuma: ele anuncia que abriu, as abas do SEI conectam
 * (`pagina/lateral.ts`) e se apresentam, e o painel usa a aba visível mais
 * recente DESTA janela. As portas chegam a todas as páginas da extensão que
 * escutam `onConnect`; as de outra janela e as de frames internos são
 * recusadas aqui, como faz o app embutido com as portas de outras abas.
 */

import type { Area } from "@comum/armazenamento/area";
import { type AbaCandidata, abridorDe, escolherAba } from "@comum/ponte/abertura";
import { criarRpc, type PortaRpc, type Rpc } from "@comum/ponte/rpc";
import { CHAVE_LATERAL } from "../modelo/constantes";

export { chaveDoContexto } from "../modelo/escopo";

import type { EstadoAba } from "../pagina/lateral";

export interface AbaLateral extends AbaCandidata {
  rpc: Rpc;
  /** Vazia até a aba se apresentar. */
  chave: string;
}

export interface Remetente {
  tab?: { id?: number; windowId?: number };
  frameId?: number;
}

export interface DepsLadoApp {
  area: Area;
  ouvirConexoes(cb: (porta: PortaRpc, remetente: Remetente) => void): void;
  /** Janela deste painel; -1 quando o navegador não informa (aceita todas). */
  janela: number;
  novoId(): string;
}

export class PonteLateral {
  private readonly abas = new Map<number, AbaLateral>();
  private readonly ouvintes = new Set<() => void>();
  private readonly id: string;
  private renovacao: ReturnType<typeof setInterval> | undefined;

  constructor(private readonly d: DepsLadoApp) {
    this.id = d.novoId();
  }

  async iniciar(): Promise<void> {
    this.d.ouvirConexoes((porta, r) => this.aceitar(porta, r));
    await this.anunciar();
    // Abas que carregarem depois também precisam ver o anúncio (e o storage não guarda "quem já leu").
    this.renovacao = setInterval(() => void this.anunciar(), 60_000);
  }

  private anunciar(): Promise<void> {
    return this.d.area.gravar({ [CHAVE_LATERAL]: { id: this.id, quando: Date.now() } }).catch(() => undefined);
  }

  private aceitar(porta: PortaRpc, r: Remetente): void {
    const id = r.tab?.id;
    const janela = r.tab?.windowId ?? -1;
    if (id === undefined || (r.frameId ?? 0) !== 0 || (this.d.janela >= 0 && janela !== this.d.janela)) {
      porta.disconnect();
      return;
    }
    const aba: AbaLateral = { id, janela, visivel: false, foco: 0, chave: "", rpc: null as unknown as Rpc };
    aba.rpc = criarRpc(porta, {
      ola: (e) => {
        const est = (e ?? {}) as Partial<EstadoAba>;
        aba.visivel = est.visivel === true;
        aba.foco = typeof est.foco === "number" ? est.foco : 0;
        aba.chave = typeof est.chave === "string" ? est.chave : "";
        this.avisar();
        return true;
      },
    });
    aba.rpc.aoFechar(() => {
      if (this.abas.get(id) !== aba) return;
      this.abas.delete(id);
      this.avisar();
    });
    const velha = this.abas.get(id);
    this.abas.set(id, aba);
    velha?.rpc.fechar();
    this.avisar();
  }

  atual(): AbaLateral | null {
    return escolherAba(
      [...this.abas.values()].filter((a) => a.chave),
      this.d.janela,
    );
  }

  /**
   * A aba que atende a lista ABERTA no painel (mesmo SEI, usuário e unidade).
   * A "da frente" pode ser de outro SEI: um pedido feito na lista da GPF não
   * pode ir parar na aba de outra unidade só porque ela ganhou o foco.
   */
  daChave(chave: string): AbaLateral | null {
    if (!chave) return null;
    return escolherAba(
      [...this.abas.values()].filter((a) => a.chave === chave),
      this.d.janela,
    );
  }

  aoMudar(cb: () => void): () => void {
    this.ouvintes.add(cb);
    return () => this.ouvintes.delete(cb);
  }

  private avisar(): void {
    for (const o of [...this.ouvintes]) o();
  }

  async encerrar(): Promise<void> {
    clearInterval(this.renovacao);
    const lido: Record<string, unknown> = await this.d.area.obter(CHAVE_LATERAL).catch(() => ({}));
    const atual = lido[CHAVE_LATERAL];
    // Outro painel (outra janela) pode ter anunciado depois: só retira o próprio anúncio.
    if (abridorDe(atual) === this.id) await this.d.area.remover(CHAVE_LATERAL).catch(() => undefined);
  }
}
