/**
 * A regra de toda sincronia do SEI Pro: por ENTIDADE, vence a gravação mais
 * recente. O empate se decide pelo id do dispositivo e, no limite, pelo
 * conteúdo, sempre na mesma direção. Remoção é uma lápide (`removidoEm`), que
 * mescla como qualquer edição: assim a remoção feita num computador não
 * "ressuscita" quando o outro, que ainda tinha o item, sincroniza.
 *
 * Comutativa, associativa e idempotente: "puxar, mesclar, empurrar" pode se
 * repetir quantas vezes for preciso, em qualquer ordem.
 */

export interface Versionada {
  id: string;
  atualizadoEm: number;
  dispositivo: string;
  removidoEm?: number;
}

export function vence(a: Versionada, b: Versionada): boolean {
  if (a.atualizadoEm !== b.atualizadoEm) return a.atualizadoEm > b.atualizadoEm;
  if (a.dispositivo !== b.dispositivo) return a.dispositivo > b.dispositivo;
  return JSON.stringify(a) > JSON.stringify(b);
}

export function mesclar<T extends Versionada>(...listas: T[][]): T[] {
  const porId = new Map<string, T>();
  for (const lista of listas) {
    for (const item of lista) {
      const atual = porId.get(item.id);
      if (!atual || vence(item, atual)) porId.set(item.id, item);
    }
  }
  return [...porId.values()].sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
}

export function purgarLapides<T extends Versionada>(lista: T[], agora: number, dias = 90): T[] {
  const limite = agora - dias * 86_400_000;
  return lista.filter((i) => i.removidoEm === undefined || i.removidoEm >= limite);
}
