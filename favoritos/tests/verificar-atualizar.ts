import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { atualizarForaDaUnidade, type ProgressoAtualizacao } from "../src/pagina/atualizar";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, secao } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarAtualizar(): Promise<void> {
  secao("atualizar fora da unidade (so por pedido)");
  const area = areaMemoria();
  let t = 1;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const esc = escoposDoContexto(CTX);
  const unidade = new RepositorioFavoritos(area, esc.unidade!, carimbo);
  const pessoal = new RepositorioFavoritos(area, esc.pessoal, carimbo);
  await unidade.adicionar({ id: "1", protocolo: "P1" });
  await unidade.adicionar({ id: "2", protocolo: "P2" });
  await unidade.adicionar({ id: "3", protocolo: "P3", sigiloso: true });
  await pessoal.adicionar({ id: "4", protocolo: "P4" });
  await pessoal.adicionar({ id: "2", protocolo: "P2" });
  const lidos: string[] = [];
  const progresso: ProgressoAtualizacao[] = [];
  const deps = {
    repos: [unidade, pessoal],
    listarCaixa: async () => new Set(["1"]),
    lerProcesso: async (protocolo: string) => {
      lidos.push(protocolo);
      return {
        qtdDocumentos: 7,
        abertoNaUnidade: protocolo === "P4",
        ultimoAndamento: { data: "01/10/2026 09:00", unidade: "SFC", descricao: "Recebido" },
      };
    },
    progresso: async (p: ProgressoAtualizacao) => void progresso.push(p),
    esperar: async () => undefined,
  };
  const r = await atualizarForaDaUnidade(deps, new AbortController().signal);
  checar("le a caixa inteira antes e descarta o que esta nela", !lidos.includes("P1"));
  checar("descarta os sigilosos", !lidos.includes("P3"));
  checar("le cada processo uma vez so (mesmo em duas listas)", lidos.sort().join() === "P2,P4", lidos);
  checar(
    "grava a leitura nas listas onde o processo esta",
    (await unidade.atuais()).get("2")?.qtdDocumentos === 7 && (await pessoal.atuais()).get("2")?.fonte === "atualizar",
  );
  checar(
    "corrida: chegou a unidade durante a leitura vira aviso",
    (await pessoal.atuais()).get("4")?.recebidoNaLeitura === true && r.chegaram === 1,
    r,
  );
  checar(
    "progresso do inicio ao fim",
    progresso[0]?.total === 2 && progresso.at(-1)?.fim === true && progresso.at(-1)?.feitos === 2,
    progresso,
  );

  const ctl = new AbortController();
  const lidos2: string[] = [];
  await atualizarForaDaUnidade(
    {
      ...deps,
      lerProcesso: async (p: string) => {
        lidos2.push(p);
        ctl.abort();
        return { qtdDocumentos: 1, abertoNaUnidade: false };
      },
    },
    ctl.signal,
  );
  checar("cancelado no meio: para de ler", lidos2.length === 1);
}
