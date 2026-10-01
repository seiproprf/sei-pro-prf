import { deISO, diasUteisEntre, diferencaDias, ehDiaUtil, formatarData, hojeISO, somarDias, somarDiasUteis } from "../src/datas/dias";
import { conjuntoDeFeriados, feriadosNacionais, pascoa } from "../src/datas/feriados";
import { hashCurto, normalizarTexto } from "../src/texto";
import { checar, secao } from "./util";

export function verificarDatas(): void {
  secao("datas: fuso local");
  // 22h30 em Brasília já é dia 02 em UTC: toISOString() erraria o "hoje".
  checar(
    "hoje as 22h30 continua sendo o dia local",
    hojeISO(new Date(2026, 9, 1, 22, 30)) === "2026-10-01",
    hojeISO(new Date(2026, 9, 1, 22, 30)),
  );
  checar("hoje logo depois da meia-noite", hojeISO(new Date(2026, 0, 5, 0, 5)) === "2026-01-05");
  checar("deISO cai ao meio-dia local", deISO("2026-10-01").getHours() === 12);
  checar("formatar", formatarData("2026-10-01") === "01/10/2026");

  secao("datas: aritmetica");
  checar("virada de mes", somarDias("2026-02-28", 1) === "2026-03-01");
  checar("virada de ano para tras", somarDias("2026-01-01", -1) === "2025-12-31");
  checar("diferenca", diferencaDias("2026-10-01", "2026-10-11") === 10);
  checar("diferenca negativa", diferencaDias("2026-10-11", "2026-10-01") === -10);

  secao("feriados");
  checar("pascoa 2026", pascoa(2026) === "2026-04-05", pascoa(2026));
  checar("pascoa 2027", pascoa(2027) === "2027-03-28", pascoa(2027));
  const f26 = feriadosNacionais(2026).map((f) => f.data);
  for (const d of ["2026-02-16", "2026-02-17", "2026-04-03", "2026-06-04", "2026-10-12", "2026-11-20"]) {
    checar(`2026 tem ${d}`, f26.includes(d));
  }
  const f27 = feriadosNacionais(2027).map((f) => f.data);
  checar("carnaval e corpus christi 2027", f27.includes("2027-02-08") && f27.includes("2027-02-09") && f27.includes("2027-05-27"));
  const feriados = conjuntoDeFeriados([2026, 2027]);
  checar("conjunto inclui 20/11", feriados.has("2026-11-20"));

  secao("dias uteis");
  checar("sabado nao e util", !ehDiaUtil("2026-10-03", feriados));
  checar("12/10 nao e util", !ehDiaUtil("2026-10-12", feriados));
  checar("quinta e util", ehDiaUtil("2026-10-01", feriados));
  checar(
    "sexta antes do carnaval + 1 util = quarta de cinzas",
    somarDiasUteis("2026-02-13", 1, feriados) === "2026-02-18",
    somarDiasUteis("2026-02-13", 1, feriados),
  );
  checar("sexta 09/10 + 1 util pula o feriado de segunda", somarDiasUteis("2026-10-09", 1, feriados) === "2026-10-13");
  checar(
    "virada de ano com feriado",
    somarDiasUteis("2026-12-30", 3, feriados) === "2027-01-05",
    somarDiasUteis("2026-12-30", 3, feriados),
  );
  checar("zero dias uteis devolve a data", somarDiasUteis("2026-10-01", 0, feriados) === "2026-10-01");
  checar("menos 1 util na segunda volta para sexta", somarDiasUteis("2026-10-05", -1, feriados) === "2026-10-02");
  checar("uteis entre (exclusivo, inclusivo)", diasUteisEntre("2026-02-13", "2026-02-18", feriados) === 1);
  checar("uteis entre ao contrario e negativo", diasUteisEntre("2026-02-18", "2026-02-13", feriados) === -1);
  checar(
    "uteis de 01/10 a 13/10",
    diasUteisEntre("2026-10-01", "2026-10-13", feriados) === 7,
    diasUteisEntre("2026-10-01", "2026-10-13", feriados),
  );

  secao("texto");
  checar(
    "normaliza acento, caixa e espacos",
    normalizarTexto("  Fiscalização   Ágil ") === "fiscalizacao agil",
    normalizarTexto("  Fiscalização   Ágil "),
  );
  checar("hash FNV-1a conhecido", hashCurto("a") === "e40c292c", hashCurto("a"));
  checar("hash distingue", hashCurto("a") !== hashCurto("b"));
}
