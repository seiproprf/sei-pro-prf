import { novoId } from "../src/id";
import { checar, secao } from "./util";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

export function verificarId(): void {
  secao("id aleatorio");
  // Em SEI servido por HTTP o content script nao tem crypto.randomUUID (so existe em contexto seguro).
  const semUuid = {
    getRandomValues: <T extends ArrayBufferView>(a: T) => crypto.getRandomValues(a as unknown as Uint8Array) as unknown as T,
  };
  const a = novoId(semUuid);
  const b = novoId(semUuid);
  checar("sem randomUUID ainda gera UUID v4", UUID.test(a) && UUID.test(b), [a, b]);
  checar("ids diferentes", a !== b);
  checar("com randomUUID usa o nativo", novoId({ ...semUuid, randomUUID: () => "nativo" }) === "nativo");
}
