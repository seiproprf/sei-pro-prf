import type { Periodo } from "./tipos";

export type Grupo = Periodo;
export const GRUPOS: readonly Grupo[] = ["hoje", "ontem", "7dias", "30dias", "antigos"];
export const ROTULO_PERIODO: Record<Periodo, string> = {
  hoje: "Hoje",
  ontem: "Ontem",
  "7dias": "Últimos 7 dias",
  "30dias": "Últimos 30 dias",
  antigos: "Mais antigos",
};
const DIA = 86_400_000;
export function inicioDoDia(ms: number): number {
  const d = new Date(ms);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
/** Dias de calendário local entre a data de `ms` e a de `agora` (0 = hoje). O futuro conta como hoje. */
export function diasAtras(ms: number, agora: number): number {
  const n = Math.round((inicioDoDia(agora) - inicioDoDia(ms)) / DIA);
  return n < 0 ? 0 : n;
}
export function grupoDe(ms: number, agora: number): Grupo {
  const n = diasAtras(ms, agora);
  return n === 0 ? "hoje" : n === 1 ? "ontem" : n <= 6 ? "7dias" : n <= 29 ? "30dias" : "antigos";
}
/** Filtro: cumulativo ("Últimos 7 dias" inclui hoje e ontem). */
export function periodosDe(ms: number, agora: number): Periodo[] {
  const n = diasAtras(ms, agora);
  if (n >= 30) return ["antigos"];
  const p: Periodo[] = [];
  if (n === 0) p.push("hoje");
  if (n === 1) p.push("ontem");
  if (n <= 6) p.push("7dias");
  p.push("30dias");
  return p;
}
const dois = (n: number) => String(n).padStart(2, "0");
export function dataHora(ms: number): string {
  const d = new Date(ms);
  return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} ${dois(d.getHours())}:${dois(d.getMinutes())}`;
}
export function quando(ms: number, agora: number): string {
  const [data, hora] = dataHora(ms).split(" ");
  const n = diasAtras(ms, agora);
  return n === 0 ? `hoje às ${hora}` : n === 1 ? `ontem às ${hora}` : `${data} às ${hora}`;
}
