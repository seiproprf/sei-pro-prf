/**
 * Datas civis ("AAAA-MM-DD") no fuso LOCAL do navegador.
 *
 * Prazo de servidor público é contado em dias do calendário de Brasília, não em
 * instantes UTC. `toISOString()` devolve o dia seguinte a partir das 21h, e o
 * prazo "vence hoje" viraria "vencido" à noite. Por isso tudo aqui passa por
 * `getFullYear/getMonth/getDate`, e as contas usam o meio-dia, que não sofre
 * com horário de verão.
 */

export type DataISO = string;

const dois = (n: number) => String(n).padStart(2, "0");

export function hojeISO(agora: Date = new Date()): DataISO {
  return `${agora.getFullYear()}-${dois(agora.getMonth() + 1)}-${dois(agora.getDate())}`;
}

export function deISO(iso: DataISO): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error(`Data inválida: ${iso}`);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12);
}

export function somarDias(iso: DataISO, n: number): DataISO {
  const d = deISO(iso);
  d.setDate(d.getDate() + n);
  return hojeISO(d);
}

/** b − a, em dias corridos. */
export function diferencaDias(a: DataISO, b: DataISO): number {
  return Math.round((deISO(b).getTime() - deISO(a).getTime()) / 86_400_000);
}

export function ehDiaUtil(iso: DataISO, feriados: ReadonlySet<DataISO>): boolean {
  const dia = deISO(iso).getDay();
  return dia !== 0 && dia !== 6 && !feriados.has(iso);
}

/** Soma n dias úteis (n negativo volta). A própria data não conta. */
export function somarDiasUteis(iso: DataISO, n: number, feriados: ReadonlySet<DataISO>): DataISO {
  const passo = n < 0 ? -1 : 1;
  let atual = iso;
  let faltam = Math.abs(n);
  while (faltam > 0) {
    atual = somarDias(atual, passo);
    if (ehDiaUtil(atual, feriados)) faltam -= 1;
  }
  return atual;
}

/** Dias úteis depois de `a` até `b` (inclusive); negativo quando b < a. */
export function diasUteisEntre(a: DataISO, b: DataISO, feriados: ReadonlySet<DataISO>): number {
  if (a === b) return 0;
  const sinal = b > a ? 1 : -1;
  let atual = a;
  let conta = 0;
  while (atual !== b) {
    atual = somarDias(atual, sinal);
    if (ehDiaUtil(sinal > 0 ? atual : somarDias(atual, 1), feriados)) conta += 1;
  }
  return conta * sinal;
}

export function formatarData(iso: DataISO): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}
