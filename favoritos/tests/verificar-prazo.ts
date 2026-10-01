import { calcularPrazo, feriadosPara, vencimentoDe } from "../src/modelo/prazo";
import type { Prazo } from "../src/modelo/tipos";
import { checar, secao } from "./util";

const HOJE = "2026-10-01"; // quinta-feira
const P = (x: Omit<Prazo, "exibicao"> & Partial<Pick<Prazo, "exibicao">>): Prazo => ({ exibicao: "ate", ...x });

export function verificarPrazo(): void {
  secao("prazo: com vencimento");
  const corridos = calcularPrazo(
    P({ referencia: { de: "data", data: "2026-09-28" }, vencimento: { em: "dias", n: 5, contagem: "corridos" } }),
    HOJE,
  );
  checar(
    "corridos: vence em 2 dias",
    corridos.texto === "vence em 2 dias" && corridos.situacao === "noPrazo" && corridos.vencimento === "2026-10-03",
    corridos,
  );
  const uteis = calcularPrazo(
    P({ referencia: { de: "data", data: "2026-10-09" }, vencimento: { em: "dias", n: 1, contagem: "uteis" } }),
    HOJE,
  );
  checar("uteis pula o feriado de 12/10", uteis.vencimento === "2026-10-13" && uteis.texto === "vence em 7 dias úteis", uteis);
  const atrasado = calcularPrazo(
    P({ referencia: { de: "data", data: "2026-09-01" }, vencimento: { em: "data", data: "2026-09-29" } }),
    HOJE,
  );
  checar("atrasado", atrasado.situacao === "atrasado" && atrasado.texto === "2 dias de atraso" && atrasado.ordem < 0, atrasado);
  const hoje = calcularPrazo(P({ referencia: { de: "data", data: "2026-09-01" }, vencimento: { em: "data", data: HOJE } }), HOJE);
  checar("vence hoje", hoje.situacao === "hoje" && hoje.texto === "vence hoje" && hoje.ordem === 0, hoje);
  const antes = P({ referencia: { de: "data", data: "2026-10-20" }, vencimento: { em: "dias", n: -3, contagem: "corridos" } });
  checar("n negativo conta para tras", vencimentoDe(antes, new Set()) === "2026-10-17");

  secao("prazo: so a data (prazo simples do legado)");
  const futura = calcularPrazo(P({ referencia: { de: "data", data: "2026-10-04" } }), HOJE);
  checar("data futura", futura.texto === "em 3 dias" && futura.situacao === "noPrazo", futura);
  const passada = calcularPrazo(P({ referencia: { de: "data", data: "2026-09-30" } }), HOJE);
  checar("data passada", passada.texto === "há 1 dia" && passada.situacao === "atrasado", passada);

  secao("prazo: contagem desde");
  const desde = calcularPrazo(P({ referencia: { de: "data", data: "2026-09-21" }, exibicao: "desde" }), HOJE);
  checar("dias corridos desde", desde.texto === "10 dias desde 21/09/2026" && desde.situacao === "semVencimento", desde);
  const desdeUteis = calcularPrazo(P({ referencia: { de: "data", data: "2026-09-24" }, exibicao: "desdeUteis" }), HOJE);
  checar("dias uteis desde", desdeUteis.texto === "5 dias úteis desde 24/09/2026", desdeUteis);

  secao("prazo: casos especiais");
  const aguardando = calcularPrazo(P({ referencia: { de: "novoDocumento", tipos: ["Ofício"], desde: "2026-09-01" } }), HOJE);
  checar("aguardando novo documento", aguardando.situacao === "aguardando" && aguardando.dica.includes("Ofício"), aguardando);
  const virada = P({ referencia: { de: "data", data: "2026-12-30" }, vencimento: { em: "dias", n: 3, contagem: "uteis" } });
  checar("virada de ano usa os feriados do ano seguinte", vencimentoDe(virada, feriadosPara(virada, "2026-12-30")) === "2027-01-05");
  const ordem = [atrasado, hoje, corridos, desde].map((r) => r.ordem);
  checar(
    "ordem: atrasado, hoje, no prazo, sem vencimento",
    ordem.every((o, i) => i === 0 || (ordem[i - 1] ?? 0) < o),
    ordem,
  );
}
