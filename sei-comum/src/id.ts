/**
 * Id aleatório (UUID v4). `crypto.randomUUID` só existe em contexto seguro: num
 * SEI servido por HTTP o content script não o tem, e o favoritos inteiro
 * falhava já na primeira gravação. `getRandomValues` não exige contexto seguro.
 */
type Gerador = Pick<Crypto, "getRandomValues"> & { randomUUID?: () => string };

export function novoId(c: Gerador = crypto): string {
  if (typeof c.randomUUID === "function") return c.randomUUID();
  const b = c.getRandomValues(new Uint8Array(16));
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
