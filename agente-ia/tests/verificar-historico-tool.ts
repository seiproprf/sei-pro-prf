/**
 * O agente lê o histórico de processos visitados: somente leitura, sem sigilosos
 * (nem o número deles).
 */

import { areaMemoria } from "@comum/armazenamento/area";
import { chaveEscopo } from "@historico/modelo/constantes";
import { RepositorioHistorico } from "@historico/repositorio";
import { definirAreaHistorico, TOOL_HISTORICO } from "../src/tools/historico";
import { checar, secao } from "./util";

type Saida = { total: number; itens: Array<Record<string, unknown>>; cortados?: number; sigilososOmitidos: number };

export async function verificarHistoricoTool(): Promise<void> {
  secao("agente: historico_listar");
  const area = areaMemoria();
  const agora = Date.now();
  const repo = new RepositorioHistorico(area, chaveEscopo("sei.exemplo.gov.br", "Ana.Souza"));
  const un = { id: "110000001", sigla: "GPF" };
  await repo.registrarVisita({ id: "1", protocolo: "50300.000001/2026-01", tipo: "Licitação", unidade: un }, agora - 3_600_000);
  await repo.completar("1", { especificacao: "Pregão do porto", interessados: ["Empresa X"], assuntos: ["Licitação"] }, agora - 3_600_000);
  await repo.registrarVisita({ id: "2", protocolo: "50300.000002/2026-02", tipo: "Reservado", nivel: "sigiloso", unidade: un }, agora - 1_000);
  await repo.registrarVisita({ id: "3", protocolo: "50300.000003/2026-03", tipo: "Contrato", unidade: un }, agora - 10 * 86_400_000);
  for (const dt of [5 * 3_600_000, 4 * 3_600_000, 2 * 3_600_000]) await repo.registrarVisita({ id: "4", protocolo: "50300.000004/2026-04", tipo: "Fiscalização", unidade: un }, agora - dt);
  definirAreaHistorico(() => area);
  const pedidos: string[] = [];
  const ctx = {
    sinal: new AbortController().signal,
    sei: async (op: string) => {
      pedidos.push(op);
      return { host: "sei.exemplo.gov.br", login: "ana.souza", unidade: un };
    },
  } as never;
  const rodar = (a: Record<string, unknown>) => TOOL_HISTORICO.executar(a, ctx) as Promise<Saida>;
  checar("e de leitura", TOOL_HISTORICO.efeito === "leitura" && TOOL_HISTORICO.nome === "historico_listar");
  const tudo = await rodar({});
  checar("le o escopo da aba", pedidos[0] === "favoritos.escopo");
  checar("3 visiveis, sigiloso omitido", tudo.total === 3 && tudo.itens.length === 3 && tudo.sigilososOmitidos === 1, tudo);
  checar("nada do sigiloso na saida", !JSON.stringify(tudo).includes("50300.000002") && !JSON.stringify(tudo).includes("Reservado"));
  checar("mais recente primeiro", tudo.itens.map((i) => i.protocolo).join() === "50300.000001/2026-01,50300.000004/2026-04,50300.000003/2026-03", tudo.itens.map((i) => i.protocolo));
  const i1 = tudo.itens[0]!;
  checar(
    "campos do item",
    i1.tipo === "Licitação" && i1.especificacao === "Pregão do porto" && /^\d\d\/\d\d\/\d{4} \d\d:\d\d$/.test(String(i1.ultimaVisita)) && i1.vezes === 1 && i1.unidade === "GPF" && (i1.interessados as string[])[0] === "Empresa X" && (i1.assuntos as string[])[0] === "Licitação",
    i1,
  );
  checar("sem interessados/assuntos quando nao ha", !("interessados" in tudo.itens[2]!) && !("assuntos" in tudo.itens[2]!));
  const sete = await rodar({ periodo: "7dias" });
  checar("periodo 7dias", sete.itens.length === 2 && !sete.itens.some((i) => i.protocolo === "50300.000003/2026-03"), sete.itens);
  const busca = await rodar({ busca: "licitacao" });
  checar("busca sem acento", busca.itens.length === 1 && busca.itens[0]!.protocolo === "50300.000001/2026-01", busca.itens);
  const vis = await rodar({ ordem: "visitados" });
  checar("visitados: a de 3 vezes primeiro", vis.itens[0]!.protocolo === "50300.000004/2026-04" && vis.itens[0]!.vezes === 3, vis.itens[0]);
  const tipo = await rodar({ tipo: "contrat" });
  checar("filtro por tipo", tipo.itens.length === 1 && tipo.itens[0]!.protocolo === "50300.000003/2026-03");
  const uni = await rodar({ unidade: "gpf" });
  checar("filtro por unidade sem caixa", uni.itens.length === 3);
  const um = await rodar({ limite: 1 });
  checar("limite 1: cortados 2", um.itens.length === 1 && um.cortados === 2 && um.total === 3, um);
  checar("sem cortados quando cabe", !("cortados" in tudo));
  const mil = await rodar({ limite: 999 });
  checar("limite 999 com poucas visitas: nada cortado", mil.itens.length === 3 && !("cortados" in mil));

  // Escopo novo: 205 visitas exercitam o teto de 200, e a borda do periodo "7dias" (n <= 6 dias).
  const area2 = areaMemoria();
  const repo2 = new RepositorioHistorico(area2, chaveEscopo("sei.exemplo.gov.br", "Ana.Souza"));
  const DIA = 86_400_000;
  for (let n = 1; n <= 205; n++)
    await repo2.registrarVisita({ id: String(n), protocolo: `50300.${String(n).padStart(6, "0")}/2026-01`, tipo: "Contrato", unidade: un }, agora - n * 1000);
  definirAreaHistorico(() => area2);
  const teto = await rodar({ limite: 999 });
  checar("limite maximo 200: 205 visitas, 200 itens", teto.total === 205 && teto.itens.length === 200, [teto.total, teto.itens.length]);
  checar("limite maximo 200: cortados = 5", teto.cortados === 5, teto.cortados);
  const area3 = areaMemoria();
  const repo3 = new RepositorioHistorico(area3, chaveEscopo("sei.exemplo.gov.br", "Ana.Souza"));
  await repo3.registrarVisita({ id: "a", protocolo: "50300.000101/2026-01", tipo: "Contrato", unidade: un }, agora - 6 * DIA);
  await repo3.registrarVisita({ id: "b", protocolo: "50300.000102/2026-01", tipo: "Contrato", unidade: un }, agora - 7 * DIA);
  definirAreaHistorico(() => area3);
  const borda = await rodar({ periodo: "7dias" });
  checar(
    "periodo 7dias: 6 dias atras entra, exatamente 7 dias atras nao",
    borda.itens.length === 1 && borda.itens[0]!.protocolo === "50300.000101/2026-01",
    borda.itens,
  );
  definirAreaHistorico(() => area);
}
