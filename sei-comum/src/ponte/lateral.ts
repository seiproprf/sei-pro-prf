/**
 * Ponte do painel lateral (genérica: a chave do anúncio vem por parâmetro).
 * Lado do app: o painel é um só por janela e não pertence a aba nenhuma. Ele
 * anuncia que abriu, as abas do SEI conectam (`ligarLadoAba`) e se apresentam,
 * e o painel usa a aba visível mais recente DESTA janela. As portas chegam a
 * todas as páginas da extensão que escutam `onConnect`; as de outra janela e
 * as de frames internos são recusadas aqui.
 */

import type { Area } from "../armazenamento/area";
import { type AbaCandidata, abridorDe, escolherAba, precisaConectar } from "./abertura";
import { criarRpc, type PortaRpc, type Rpc, type Tratador } from "./rpc";

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
  /** Chave do anúncio no storage: cada painel (favoritos, histórico) usa a sua. */
  chave: string;
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
    return this.d.area.gravar({ [this.d.chave]: { id: this.id, quando: Date.now() } }).catch(() => undefined);
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
    const lido: Record<string, unknown> = await this.d.area.obter(this.d.chave).catch(() => ({}));
    const atual = lido[this.d.chave];
    // Outro painel (outra janela) pode ter anunciado depois: só retira o próprio anúncio.
    if (abridorDe(atual) === this.id) await this.d.area.remover(this.d.chave).catch(() => undefined);
  }
}

/*
 * Lado da aba do SEI na ponte com o app do painel lateral. O app não pode abrir
 * porta para a aba sem a permissão `tabs`; então ele anuncia que abriu (`chave`
 * no storage) e a aba conecta. A aba se apresenta (visível, foco, chave do
 * contexto) ao conectar e quando ganha foco.
 */

export interface EstadoAba {
  visivel: boolean;
  foco: number;
  /**
   * Chave de roteamento do contexto da aba; o painel remonta a lista quando ela muda. Favoritos:
   * host|login|id da unidade. Histórico: host|login (ao trocar de unidade, o painel relê o
   * contexto e remonta, para os Favoritos irem para a lista da unidade certa).
   */
  chave: string;
}

export interface DepsLadoAba {
  area: Area;
  /** Chave do anúncio do painel no storage. */
  chave: string;
  conectar(): PortaRpc;
  tratadores: Record<string, Tratador>;
  estado(): EstadoAba;
}

export function ligarLadoAba(d: DepsLadoAba): { apresentar(): void; verificar(): void; parar(): void } {
  let rpc: Rpc | null = null;
  let parado = false;
  const servidos = new Set<string>();

  const apresentar = () => {
    if (rpc?.aberta) void rpc.chamar("ola", d.estado(), 5000).catch(() => undefined);
  };

  const atender = (valor: unknown) => {
    if (parado || !precisaConectar(valor, Boolean(rpc?.aberta), servidos)) return;
    rpc?.fechar();
    let novo: Rpc;
    try {
      novo = criarRpc(d.conectar(), d.tratadores);
    } catch {
      // Extensão recarregada: o contexto do content script morreu, nada a fazer.
      rpc = null;
      return;
    }
    rpc = novo;
    novo.aoFechar(() => {
      if (rpc === novo) rpc = null;
    });
    const quem = abridorDe(valor);
    if (quem) servidos.add(quem);
    apresentar();
  };

  const verificar = () => {
    if (parado) return;
    void d.area
      .obter(d.chave)
      .then((v) => atender(v[d.chave]))
      .catch(() => undefined);
  };

  const pararDeOuvir = d.area.aoMudar((m) => {
    if (d.chave in m) atender(m[d.chave]?.novo);
  });
  verificar();

  return {
    apresentar,
    verificar,
    parar() {
      parado = true;
      pararDeOuvir();
      rpc?.fechar();
      rpc = null;
    },
  };
}
