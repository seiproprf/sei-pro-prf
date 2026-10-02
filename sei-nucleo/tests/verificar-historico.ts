/** Consulta de metadados pela arvore ja aberta: um GET, sem buscar a arvore de novo. */

import { lerArvore, acaoNaArvore } from "../src/dominio/arvore";
import { consultarDaArvore } from "../src/dominio/processo";
import type { Http, Pagina } from "../src/sessao/http";
import { checar, fixture, lanca, secao } from "./util";

function httpFalso(chamadas: string[]): Http {
  const alterar = fixture("sei41/p_procedimento_alterar.html");
  const base = new URL("https://treinamento.sei.sp.gov.br/sei/");
  return {
    base,
    async obter(url: string): Promise<Pagina> {
      chamadas.push(url);
      if (url.includes("acao=procedimento_alterar")) return alterar;
      throw new Error(`requisicao inesperada: ${url}`);
    },
    async enviar() {
      throw new Error("enviar nao esperado");
    },
    absoluta: (u: string) => new URL(u, base).href,
    async baixar() {
      throw new Error("baixar nao esperado");
    },
  };
}

export async function verificarHistorico(): Promise<void> {
  secao("consultarDaArvore (arvore ja aberta)");
  const arv = lerArvore(fixture("sei41/arvore.html"));
  const chamadas: string[] = [];
  const meta = await consultarDaArvore(httpFalso(chamadas), arv);
  checar("um unico GET", chamadas.length === 1, chamadas);
  checar("GET no link procedimento_alterar da arvore", chamadas[0] === acaoNaArvore(arv, "procedimento_alterar"), chamadas[0]);
  checar("nao pesquisa nem abre o processo", !chamadas.some((c) => c.includes("pesquisa_rapida") || c.includes("procedimento_trabalhar")));
  checar("tipo e especificacao lidos", meta.tipo !== "" && typeof meta.especificacao === "string", meta);
  checar("listas e editavel", Array.isArray(meta.assuntos) && Array.isArray(meta.interessados) && meta.editavel === true, meta);

  const vazia = { ...arv, acoesProcesso: [], links: [] };
  const erro = await lanca(() => consultarDaArvore(httpFalso([]), vazia));
  checar("sem link de alterar nem consultar: SEI_ACAO_INDISPONIVEL", erro?.codigo === "SEI_ACAO_INDISPONIVEL", erro?.codigo);
}
