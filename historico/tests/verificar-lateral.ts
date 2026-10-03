import { areaMemoria } from "@comum/armazenamento/area";
import { PonteLateral, type Remetente } from "@comum/ponte/lateral";
import { parDePortas } from "@comum/ponte/parDePortas";
import { criarRpc, type PortaRpc } from "@comum/ponte/rpc";
import { CHAVE_LATERAL, chaveEscopo } from "../src/modelo/constantes";
import type { ContextoHistorico } from "../src/modelo/tipos";
import { chaveDaAba } from "../src/pagina/lateral";
import { checar, secao } from "./util";

const ctx = (unidade: string, login = "Ana"): ContextoHistorico => ({
  host: "sei",
  login,
  nome: "Ana",
  unidade: { id: unidade, sigla: `U${unidade}`, nome: `Unidade ${unidade}` },
  versao: "4.1.5",
  temaEscuro: false,
  favoritosAtivo: false,
  lateralDisponivel: true,
});

export async function verificarLateral(): Promise<void> {
  secao("lateral: a chave da aba e host|login, sem a unidade");
  checar("mesma pessoa, unidades diferentes: mesma chave", chaveDaAba(ctx("1")) === chaveDaAba(ctx("2")));
  checar(
    "a chave e a do escopo (login em minusculas)",
    chaveDaAba(ctx("1")) === chaveEscopo("sei", "ana") && chaveDaAba(ctx("1")) === "sei|ana",
  );
  checar("outro login: outra chave", chaveDaAba(ctx("1", "bia")) !== chaveDaAba(ctx("1")));

  secao("lateral: ponte do painel com abas do historico");
  const area = areaMemoria();
  let conectar: ((p: PortaRpc, r: Remetente) => void) | null = null;
  const ponte = new PonteLateral({
    chave: CHAVE_LATERAL,
    area,
    janela: 10,
    novoId: () => "inst",
    ouvirConexoes: (cb) => {
      conectar = cb;
    },
  });
  await ponte.iniciar();
  const chamadas: string[] = [];
  const [daAbaA, doAppA] = parDePortas();
  const rpcA = criarRpc(daAbaA, { abrirProcesso: () => void chamadas.push("ana1") });
  conectar!(doAppA, { tab: { id: 1, windowId: 10 }, frameId: 0 });
  await rpcA.chamar("ola", { visivel: false, foco: 1, chave: chaveDaAba(ctx("1")) });
  const [daAbaB, doAppB] = parDePortas();
  const rpcB = criarRpc(daAbaB, { abrirProcesso: () => void chamadas.push("ana2") });
  conectar!(doAppB, { tab: { id: 2, windowId: 10 }, frameId: 0 });
  await rpcB.chamar("ola", { visivel: true, foco: 2, chave: chaveDaAba(ctx("2")) });
  const [daAbaC, doAppC] = parDePortas();
  const rpcC = criarRpc(daAbaC, { abrirProcesso: () => void chamadas.push("bia") });
  conectar!(doAppC, { tab: { id: 3, windowId: 10 }, frameId: 0 });
  await rpcC.chamar("ola", { visivel: false, foco: 3, chave: chaveDaAba(ctx("1", "bia")) });
  checar("a aba da frente apresenta host|login", ponte.atual()?.chave === "sei|ana");
  await ponte.daChave("sei|ana")!.rpc.chamar("abrirProcesso", { id: "1" });
  checar("daChave(sei|ana) encaminha para a aba certa", chamadas.length === 1 && chamadas[0] === "ana2", chamadas);
  chamadas.length = 0;
  await ponte.daChave("sei|bia")!.rpc.chamar("abrirProcesso", { id: "1" });
  checar("aba de outro login so recebe o proprio pedido", chamadas.length === 1 && chamadas[0] === "bia", chamadas);
  checar("login sem aba: nenhuma", ponte.daChave("sei|caio") === null);
  await ponte.encerrar();
}
