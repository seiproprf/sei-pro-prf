import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { atualizarForaDaUnidade, ControleAtualizar, type ProgressoAtualizacao, pedirCancelamento } from "../src/pagina/atualizar";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, secao, tique } from "./util";
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
    // A pesquisa rápida pelo número devolve o id do processo achado.
    localizar: async (protocolo: string) => ({ P2: "2", P4: "4", P3: "3", P1: "1" })[protocolo] ?? "x",
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

  secao("atualizar: o numero precisa levar ao mesmo processo da trava");
  await unidade.adicionar({ id: "8", protocolo: "P8" });
  const lidos3: string[] = [];
  const r3 = await atualizarForaDaUnidade(
    {
      ...deps,
      repos: [unidade],
      // P8 leva a OUTRO processo (id 1), que esta na caixa: abrir a arvore dele furaria a trava.
      localizar: async (p: string) => (p === "P8" ? "1" : (({ P2: "2" } as Record<string, string>)[p] ?? "x")),
      lerProcesso: async (p: string) => {
        lidos3.push(p);
        return { qtdDocumentos: 1, abertoNaUnidade: false };
      },
    },
    new AbortController().signal,
  );
  checar("numero que leva a outro processo nao e lido", !lidos3.includes("P8") && r3.erros >= 1, { lidos3, r3 });

  secao("atualizar: cancelar de qualquer app (pelo storage)");
  const areaC = areaMemoria();
  const lidos4: string[] = [];
  const ctlA = new ControleAtualizar(
    () => ({
      ...deps,
      repos: [unidade],
      localizar: async (p: string) => (({ P2: "2", P8: "8" }) as Record<string, string>)[p] ?? "x",
      lerProcesso: async (p: string) => {
        lidos4.push(p);
        // Outro app (outra aba, mesma unidade) pede para cancelar no meio da leitura.
        await pedirCancelamento(areaC, "sei.exemplo", "ana");
        await tique(5);
        return { qtdDocumentos: 1, abertoNaUnidade: false };
      },
    }),
    async () => undefined,
    { area: areaC, host: "sei.exemplo", login: "ana" },
  );
  await ctlA.iniciar();
  checar("o pedido de cancelar chega a aba que roda, por onde quer que tenha sido feito", lidos4.length === 1, lidos4);
}
