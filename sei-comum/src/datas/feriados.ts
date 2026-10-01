/**
 * Feriados nacionais, os mesmos de `getHolidaysBr` do legado
 * (sei-functions-pro.js): os prazos migrados não mudam de data. Carnaval e
 * Corpus Christi são ponto facultativo federal, mas o legado sempre os contou
 * como feriado, e quem tinha prazo em dias úteis se acostumou a isso.
 */

import { type DataISO, somarDias } from "./dias";

export interface Feriado {
  data: DataISO;
  nome: string;
}

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): DataISO {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

export function feriadosNacionais(ano: number): Feriado[] {
  const p = pascoa(ano);
  const fixo = (mmdd: string, nome: string): Feriado => ({ data: `${ano}-${mmdd}`, nome });
  return [
    fixo("01-01", "Confraternização Universal"),
    { data: somarDias(p, -48), nome: "Carnaval" },
    { data: somarDias(p, -47), nome: "Carnaval" },
    { data: somarDias(p, -2), nome: "Paixão de Cristo" },
    { data: p, nome: "Páscoa" },
    fixo("04-21", "Tiradentes"),
    fixo("05-01", "Dia do Trabalho"),
    { data: somarDias(p, 60), nome: "Corpus Christi" },
    fixo("09-07", "Independência do Brasil"),
    fixo("10-12", "Nossa Senhora Aparecida"),
    fixo("11-02", "Finados"),
    fixo("11-15", "Proclamação da República"),
    fixo("11-20", "Dia Nacional de Zumbi e da Consciência Negra"),
    fixo("12-25", "Natal"),
  ].sort((x, y) => (x.data < y.data ? -1 : 1));
}

export function conjuntoDeFeriados(anos: Iterable<number>, extras: Feriado[] = []): Set<DataISO> {
  const s = new Set<DataISO>();
  for (const ano of anos) for (const f of feriadosNacionais(ano)) s.add(f.data);
  for (const f of extras) s.add(f.data);
  return s;
}
