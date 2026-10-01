/**
 * RPC sobre uma porta (`chrome.runtime.Port` ou o par em memória dos testes).
 * Os dois lados podem chamar e atender. Cada chamada tem prazo, e o erro
 * atravessa com o `codigo` (por exemplo os de ErroSei do núcleo), porque quem
 * chama decide pelo código, nunca pelo texto.
 */

export interface PortaRpc {
  postMessage(m: unknown): void;
  onMessage: { addListener(cb: (m: unknown) => void): void };
  onDisconnect: { addListener(cb: () => void): void };
  disconnect(): void;
}

export type Tratador = (args: unknown) => unknown | Promise<unknown>;

export class ErroRpc extends Error {
  constructor(
    readonly codigo: string,
    mensagem: string,
  ) {
    super(mensagem);
    this.name = "ErroRpc";
  }
}

export interface Rpc {
  chamar<T = unknown>(op: string, args?: unknown, prazoMs?: number): Promise<T>;
  aoFechar(cb: () => void): void;
  fechar(): void;
  readonly aberta: boolean;
}

interface Pedido {
  rpc: "pedido";
  id: number;
  op: string;
  args: unknown;
}
interface Resposta {
  rpc: "resposta";
  id: number;
  ok: boolean;
  valor?: unknown;
  erro?: { codigo: string; mensagem: string };
}

export function criarRpc(porta: PortaRpc, tratadores: Record<string, Tratador> = {}): Rpc {
  let seq = 0;
  let aberta = true;
  const pendentes = new Map<number, { ok: (v: unknown) => void; erro: (e: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  const aoFechar: Array<() => void> = [];

  const encerrar = () => {
    if (!aberta) return;
    aberta = false;
    for (const [, p] of pendentes) {
      clearTimeout(p.timer);
      p.erro(new ErroRpc("DESCONECTADO", "A conexão com a aba do SEI caiu."));
    }
    pendentes.clear();
    for (const cb of aoFechar) cb();
  };

  const responder = (r: Resposta) => {
    if (aberta) porta.postMessage(r);
  };

  porta.onMessage.addListener((m) => {
    // Forma solta: a mensagem vem de fora e é conferida campo a campo.
    // (`Partial<Pedido & Resposta>` vira `never`, porque rpc não pode ser "pedido" e "resposta".)
    const msg = m as {
      rpc?: unknown;
      id?: unknown;
      op?: unknown;
      args?: unknown;
      ok?: unknown;
      valor?: unknown;
      erro?: Resposta["erro"];
    } | null;
    if (msg?.rpc === "resposta" && typeof msg.id === "number") {
      const p = pendentes.get(msg.id);
      if (!p) return;
      pendentes.delete(msg.id);
      clearTimeout(p.timer);
      if (msg.ok) p.ok(msg.valor);
      else p.erro(new ErroRpc(msg.erro?.codigo ?? "ERRO", msg.erro?.mensagem ?? "Falha."));
      return;
    }
    if (msg?.rpc !== "pedido" || typeof msg.id !== "number" || typeof msg.op !== "string") return;
    const id = msg.id;
    const op = msg.op;
    void (async () => {
      try {
        const t = tratadores[op];
        if (!t) throw new ErroRpc("OP_DESCONHECIDA", `Operação desconhecida: ${op}`);
        responder({ rpc: "resposta", id, ok: true, valor: await t(msg.args) });
      } catch (e) {
        const codigo = (e as { codigo?: unknown }).codigo;
        responder({
          rpc: "resposta",
          id,
          ok: false,
          erro: { codigo: typeof codigo === "string" ? codigo : "ERRO", mensagem: e instanceof Error ? e.message : String(e) },
        });
      }
    })();
  });
  porta.onDisconnect.addListener(encerrar);

  return {
    get aberta() {
      return aberta;
    },
    chamar<T>(op: string, args?: unknown, prazoMs = 15_000): Promise<T> {
      if (!aberta) return Promise.reject(new ErroRpc("DESCONECTADO", "A conexão com a aba do SEI caiu."));
      const id = ++seq;
      return new Promise<T>((ok, erro) => {
        const timer = setTimeout(() => {
          pendentes.delete(id);
          erro(new ErroRpc("PRAZO", `A aba do SEI não respondeu a tempo (${op}).`));
        }, prazoMs);
        pendentes.set(id, { ok: ok as (v: unknown) => void, erro, timer });
        porta.postMessage({ rpc: "pedido", id, op, args } satisfies Pedido);
      });
    },
    aoFechar(cb) {
      aoFechar.push(cb);
    },
    fechar() {
      if (!aberta) return;
      porta.disconnect();
      encerrar();
    },
  };
}
