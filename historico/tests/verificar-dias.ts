import { dataHora, diasAtras, grupoDe, periodosDe, quando } from "../src/modelo/dias";
import { checar, secao } from "./util";

const t = (d: number, h = 12, mi = 0) => new Date(2026, 9, d, h, mi).getTime(); // outubro/2026
export function verificarDias(): void {
  secao("historico: dias de calendario");
  const agora = t(2, 0, 5); // 02/10 00:05
  checar("23:59 de ontem e ontem, nao hoje", diasAtras(t(1, 23, 59), agora) === 1 && grupoDe(t(1, 23, 59), agora) === "ontem");
  checar("00:01 de hoje e hoje", grupoDe(t(2, 0, 1), agora) === "hoje");
  checar("futuro (relogio adiantado) conta como hoje", diasAtras(t(3), agora) === 0);
  checar("6 dias atras cai em 7dias", grupoDe(new Date(2026, 8, 26, 9).getTime(), agora) === "7dias");
  checar("7 dias atras cai em 30dias", grupoDe(new Date(2026, 8, 25, 9).getTime(), agora) === "30dias");
  checar("30 dias atras e antigos", grupoDe(new Date(2026, 8, 2, 9).getTime(), agora) === "antigos");
  checar("periodos de hoje sao cumulativos", JSON.stringify(periodosDe(t(2, 0, 1), agora)) === JSON.stringify(["hoje", "7dias", "30dias"]));
  checar("periodos de ontem", JSON.stringify(periodosDe(t(1), agora)) === JSON.stringify(["ontem", "7dias", "30dias"]));
  checar("periodos de 10 dias atras", JSON.stringify(periodosDe(new Date(2026, 8, 22).getTime(), agora)) === JSON.stringify(["30dias"]));
  checar("antigos nao entra em 30dias", JSON.stringify(periodosDe(new Date(2026, 7, 1).getTime(), agora)) === JSON.stringify(["antigos"]));
  checar("dataHora", dataHora(new Date(2026, 8, 12, 10, 5).getTime()) === "12/09/2026 10:05");
  checar("quando hoje", quando(t(2, 0, 1), agora) === "hoje às 00:01");
  checar("quando ontem", quando(t(1, 9, 10), agora) === "ontem às 09:10");
  checar("quando antes", quando(new Date(2026, 8, 12, 10, 0).getTime(), agora) === "12/09/2026 às 10:00");
  checar("virada de mes: 1o de outubro visto em 2 de outubro e ontem", grupoDe(t(1, 8), t(2, 8)) === "ontem");
}
