/** Lembretes pessoais (spec 7.4): uma data e um texto; vencido até concluir ou adiar. */

import { type DataISO, formatarData, somarDias } from "@comum/datas/dias";
import type { Favorito, Lembrete } from "./tipos";

export function lembreteVencido(f: Pick<Favorito, "lembrete">, hoje: DataISO): boolean {
  return !!f.lembrete && f.lembrete.em <= hoje;
}

/** Adiar conta a partir de HOJE (adiar um lembrete atrasado não o deixa atrasado de novo). */
export function adiarLembrete(l: Lembrete, hoje: DataISO, dias: number): Lembrete {
  return { ...l, em: somarDias(hoje, dias) };
}

export function textoLembrete(l: Lembrete, hoje: DataISO): string {
  if (l.em === hoje) return "hoje";
  if (l.em === somarDias(hoje, 1)) return "amanhã";
  return l.em < hoje ? `desde ${formatarData(l.em)}` : `em ${formatarData(l.em)}`;
}
