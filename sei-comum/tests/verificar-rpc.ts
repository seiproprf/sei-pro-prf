import { parDePortas } from "../src/ponte/parDePortas";
import { criarRpc, ErroRpc } from "../src/ponte/rpc";
import { checar, lanca, secao } from "./util";

export async function verificarRpc(): Promise<void> {
  secao("rpc: pedido e resposta");
  const [pa, pb] = parDePortas();
  const lado = criarRpc(pb, {
    soma: (a) => {
      const { x, y } = a as { x: number; y: number };
      return x + y;
    },
    lenta: () => new Promise(() => undefined),
    falha: () => {
      throw Object.assign(new Error("sessao acabou"), { codigo: "SEI_SESSAO_EXPIRADA" });
    },
  });
  const cliente = criarRpc(pa);
  checar("resposta", (await cliente.chamar<number>("soma", { x: 2, y: 3 })) === 5);
  const e1 = await lanca(() => cliente.chamar("nao_existe"));
  checar("operacao desconhecida", e1?.codigo === "OP_DESCONHECIDA", e1);
  const e2 = await lanca(() => cliente.chamar("falha"));
  checar("codigo do erro atravessa a ponte", e2?.codigo === "SEI_SESSAO_EXPIRADA" && e2?.message === "sessao acabou", e2);
  const e3 = await lanca(() => cliente.chamar("lenta", undefined, 20));
  checar("prazo esgotado", e3?.codigo === "PRAZO", e3);

  secao("rpc: queda da conexao");
  let fechou = false;
  lado.aoFechar(() => (fechou = true));
  const pendente = cliente.chamar("lenta", undefined, 5_000);
  cliente.fechar();
  const e4 = await lanca(() => pendente);
  checar("fechar rejeita o que estava pendente", e4?.codigo === "DESCONECTADO", e4);
  await new Promise((r) => setTimeout(r, 0));
  checar("o outro lado e avisado", fechou && !lado.aberta);
  const e5 = await lanca(() => cliente.chamar("soma", { x: 1, y: 1 }));
  checar("chamar depois de fechado falha na hora", e5 instanceof ErroRpc && e5.codigo === "DESCONECTADO");
}
