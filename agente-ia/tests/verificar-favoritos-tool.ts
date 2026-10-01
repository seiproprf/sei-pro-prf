/**
 * O agente lê os favoritos (spec 7.7): somente leitura, do escopo da aba ligada
 * ao painel, sem sigilosos.
 */

import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "@favoritos/modelo/escopo";
import { RepositorioFavoritos } from "@favoritos/repositorio";
import { definirAreaFavoritos, TOOL_FAVORITOS } from "../src/tools/favoritos";
import { checar, secao } from "./util";

const CTX = { host: "sei.exemplo.gov.br", login: "ana.souza", nome: "Ana", unidade: { id: "110000001", sigla: "GPF", nome: "Gerência" }, versao: "5.0.4", temaEscuro: false };

export async function verificarFavoritosTool(): Promise<void> {
  secao("agente: favoritos_listar");
  const area = areaMemoria();
  let t = 1;
  const esc = escoposDoContexto(CTX);
  const u = new RepositorioFavoritos(area, esc.unidade!, () => ({ agora: ++t, dispositivo: "A" }));
  const p = new RepositorioFavoritos(area, esc.pessoal, () => ({ agora: ++t, dispositivo: "A" }));
  await u.adicionar({ id: "1", protocolo: "50300.000001/2026-01", tipo: "Fiscalização", especificacao: "Porto" });
  await u.adicionar({ id: "2", protocolo: "50300.000002/2026-02", sigiloso: true });
  await u.editar("1", { nota: "cobrar a SFC", lembrete: { em: "2026-01-01" }, visto: { quando: 1, fonte: "caixa", qtdDocumentos: 1 } });
  await u.gravarAtual("1", { quando: 2, fonte: "caixa", qtdDocumentos: 3 });
  await p.adicionar({ id: "3", protocolo: "50300.000003/2026-03", tipo: "Contrato" });
  definirAreaFavoritos(() => area);
  const pedidos: string[] = [];
  const ctx = {
    sinal: new AbortController().signal,
    sei: async (op: string) => {
      pedidos.push(op);
      return { host: CTX.host, login: CTX.login, unidade: { id: CTX.unidade.id, sigla: "GPF" } };
    },
  } as never;
  checar("e de leitura", TOOL_FAVORITOS.efeito === "leitura");
  const tudo = (await TOOL_FAVORITOS.executar({}, ctx)) as { itens: Array<Record<string, unknown>>; sigilososOmitidos: number };
  checar("le o escopo da aba (sem montar nada)", pedidos.join() === "favoritos.escopo");
  checar("as duas listas, sem o sigiloso", tudo.itens.length === 2 && tudo.sigilososOmitidos === 1 && !JSON.stringify(tudo).includes("50300.000002"), tudo);
  const i1 = tudo.itens.find((x) => x.protocolo === "50300.000001/2026-01")!;
  checar("traz nota, lembrete e o que mudou", i1.lista === "GPF" && i1.nota === "cobrar a SFC" && (i1.lembrete as { em: string }).em === "2026-01-01" && i1.novidade === "2 documentos novos", i1);
  const nov = (await TOOL_FAVORITOS.executar({ filtro: "novidades" }, ctx)) as { itens: unknown[] };
  checar("filtro novidades", nov.itens.length === 1);
  const pes = (await TOOL_FAVORITOS.executar({ lista: "pessoal" }, ctx)) as { itens: Array<{ lista: string }> };
  checar("so a Pessoal", pes.itens.length === 1 && pes.itens[0]!.lista === "Pessoal");
  const busca = (await TOOL_FAVORITOS.executar({ busca: "contrato" }, ctx)) as { itens: unknown[] };
  checar("busca", busca.itens.length === 1);
}
