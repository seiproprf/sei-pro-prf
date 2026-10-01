/**
 * Situação de um prazo num dia (`hoje`, no fuso local). Reproduz o que o
 * legado mostrava (getDateSemantic/getDatesPreview), com nomes legíveis e
 * sem moment.js. Diferença proposital: dias úteis SEMPRE descontam feriados.
 */

import { type DataISO, diasUteisEntre, diferencaDias, formatarData, somarDias, somarDiasUteis } from "@comum/datas/dias";
import { conjuntoDeFeriados } from "@comum/datas/feriados";
import type { Prazo, ResumoPrazo } from "./tipos";

const unidade = (n: number, uteis: boolean) => {
  const um = Math.abs(n) === 1;
  if (uteis) return um ? "dia útil" : "dias úteis";
  return um ? "dia" : "dias";
};

export function vencimentoDe(p: Prazo, feriados: ReadonlySet<DataISO>): DataISO | undefined {
  if (!p.vencimento || p.referencia.de === "novoDocumento") return undefined;
  if (p.vencimento.em === "data") return p.vencimento.data;
  return p.vencimento.contagem === "uteis"
    ? somarDiasUteis(p.referencia.data, p.vencimento.n, feriados)
    : somarDias(p.referencia.data, p.vencimento.n);
}

/** Feriados de todos os anos que a conta atravessa, com um ano de folga. */
export function feriadosPara(p: Prazo, hoje: DataISO): Set<DataISO> {
  const inicio = p.referencia.de === "novoDocumento" ? p.referencia.desde : p.referencia.data;
  const anos = [inicio, hoje, p.vencimento?.em === "data" ? p.vencimento.data : hoje].map((d) => Number(d.slice(0, 4)));
  const de = Math.min(...anos);
  const ate = Math.max(...anos) + 1;
  return conjuntoDeFeriados(Array.from({ length: ate - de + 1 }, (_, i) => de + i));
}

export function calcularPrazo(p: Prazo, hoje: DataISO, feriados: ReadonlySet<DataISO> = feriadosPara(p, hoje)): ResumoPrazo {
  if (p.referencia.de === "novoDocumento") {
    return {
      situacao: "aguardando",
      texto: "aguardando documento",
      dica: `A contagem começa no próximo documento assinado: ${p.referencia.tipos.join(", ")}.`,
      ordem: Number.MAX_SAFE_INTEGER,
    };
  }
  const inicio = p.referencia.data;
  const venc = vencimentoDe(p, feriados);
  if (venc) {
    const uteis = p.vencimento?.em === "dias" && p.vencimento.contagem === "uteis";
    const dica = `Vence em ${formatarData(venc)} (contagem a partir de ${formatarData(inicio)}).`;
    if (venc === hoje) return { situacao: "hoje", vencimento: venc, texto: "vence hoje", dica, ordem: 0 };
    if (venc < hoje) {
      // Vencimento no sábado lido no domingo daria "0 dias úteis de atraso": mínimo de 1.
      const atraso = Math.max(1, Math.abs(uteis ? diasUteisEntre(venc, hoje, feriados) : diferencaDias(venc, hoje)));
      return {
        situacao: "atrasado",
        vencimento: venc,
        texto: `${atraso} ${unidade(atraso, uteis)} de atraso`,
        dica,
        ordem: -diferencaDias(venc, hoje),
      };
    }
    const faltam = uteis ? diasUteisEntre(hoje, venc, feriados) : diferencaDias(hoje, venc);
    return {
      situacao: "noPrazo",
      vencimento: venc,
      texto: `vence em ${faltam} ${unidade(faltam, uteis)}`,
      dica,
      ordem: diferencaDias(hoje, venc),
    };
  }
  if (p.exibicao === "ate") {
    const d = diferencaDias(hoje, inicio);
    const dica = `Data: ${formatarData(inicio)}.`;
    if (d === 0) return { situacao: "hoje", vencimento: inicio, texto: "hoje", dica, ordem: 0 };
    if (d < 0) return { situacao: "atrasado", vencimento: inicio, texto: `há ${-d} ${unidade(d, false)}`, dica, ordem: d };
    return { situacao: "noPrazo", vencimento: inicio, texto: `em ${d} ${unidade(d, false)}`, dica, ordem: d };
  }
  const uteis = p.exibicao === "desdeUteis";
  const passados = uteis ? diasUteisEntre(inicio, hoje, feriados) : diferencaDias(inicio, hoje);
  return {
    situacao: "semVencimento",
    texto: `${passados} ${unidade(passados, uteis)} desde ${formatarData(inicio)}`,
    dica: `Contando desde ${formatarData(inicio)}.`,
    ordem: Number.MAX_SAFE_INTEGER - 1,
  };
}
