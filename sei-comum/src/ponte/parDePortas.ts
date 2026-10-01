/**
 * Duas portas ligadas, em memória, com a semântica do `chrome.runtime.Port`:
 * entrega assíncrona, cópia estruturada, e `disconnect()` avisa SÓ o outro
 * lado. Existe para os testes dos módulos que usam `criarRpc`.
 */

import type { PortaRpc } from "./rpc";

export function parDePortas(): [PortaRpc, PortaRpc] {
  type Lado = { msg: Set<(m: unknown) => void>; fim: Set<() => void>; aberta: boolean };
  const novo = (): Lado => ({ msg: new Set(), fim: new Set(), aberta: true });
  const a = novo();
  const b = novo();
  const porta = (eu: Lado, outro: Lado): PortaRpc => ({
    postMessage(m) {
      if (!eu.aberta || !outro.aberta) return;
      const copia = structuredClone(m);
      queueMicrotask(() => {
        if (outro.aberta) for (const o of outro.msg) o(copia);
      });
    },
    onMessage: { addListener: (cb) => void eu.msg.add(cb) },
    onDisconnect: { addListener: (cb) => void eu.fim.add(cb) },
    disconnect() {
      if (!eu.aberta) return;
      eu.aberta = false;
      if (!outro.aberta) return;
      outro.aberta = false;
      queueMicrotask(() => {
        for (const f of outro.fim) f();
      });
    },
  });
  return [porta(a, b), porta(b, a)];
}
