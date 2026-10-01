import { areaMemoria } from "@comum/armazenamento/area";
import { parDePortas } from "@comum/ponte/parDePortas";
import type { PortaRpc } from "@comum/ponte/rpc";
import { criarRpc } from "@comum/ponte/rpc";
import { chaveDoContexto, PonteLateral, type Remetente } from "../src/app/lateral";
import { CHAVE_LATERAL } from "../src/modelo/constantes";
import { ligarLadoAba } from "../src/pagina/lateral";
import { checar, secao, tique } from "./util";
import { CTX } from "./verificar-modelo";

/** O lado do app, em memória: cada conexão da aba vira um par de portas. */
function appFalso() {
  const conexoes: PortaRpc[] = [];
  const olas: unknown[] = [];
  const conectar = (): PortaRpc => {
    const [daAba, doApp] = parDePortas();
    conexoes.push(doApp);
    criarRpc(doApp, { ola: (e) => void olas.push(e) });
    return daAba;
  };
  return { conexoes, olas, conectar };
}

export async function verificarLateralAba(): Promise<void> {
  secao("lateral, lado da aba: conecta quando o painel anuncia");
  const area = areaMemoria();
  const app = appFalso();
  let pedidos = 0;
  const lado = ligarLadoAba({
    area,
    conectar: app.conectar,
    tratadores: {
      contexto: () => {
        pedidos++;
        return { host: "sei.exemplo" };
      },
    },
    estado: () => ({ visivel: true, foco: 7, chave: "sei.exemplo|ana|1" }),
  });
  await tique(10);
  checar("sem anuncio, nenhuma conexao", app.conexoes.length === 0);
  await area.gravar({ [CHAVE_LATERAL]: { id: "p1", quando: 1 } });
  await tique(10);
  checar("anuncio: conecta uma vez", app.conexoes.length === 1);
  checar("e se apresenta com o estado", (app.olas[0] as { chave?: string })?.chave === "sei.exemplo|ana|1", app.olas);
  await area.gravar({ [CHAVE_LATERAL]: { id: "p1", quando: 2 } });
  await tique(10);
  checar("renovacao do mesmo painel nao reconecta", app.conexoes.length === 1);
  const rpcDoApp = criarRpc(app.conexoes[0]!);
  // O app já tem um rpc nessa porta (o do appFalso); este segundo só chama.
  await rpcDoApp.chamar("contexto").catch(() => undefined);
  checar("pedido do painel chega aos tratadores da aba", pedidos === 1);
  await area.gravar({ [CHAVE_LATERAL]: { id: "p2", quando: 3 } });
  await tique(10);
  checar("painel novo (outra instancia) reconecta", app.conexoes.length === 2);

  secao("lateral, lado da aba: porta caida");
  app.conexoes[1]!.disconnect();
  await tique(10);
  lado.verificar();
  await tique(10);
  checar("porta caida + anuncio vigente: reconecta na conferencia", app.conexoes.length === 3);
  const antes = app.olas.length;
  lado.apresentar();
  await tique(10);
  checar("apresentar manda o estado de novo", app.olas.length === antes + 1);
  lado.parar();
  await area.gravar({ [CHAVE_LATERAL]: { id: "p3", quando: 4 } });
  await tique(10);
  checar("parado, ignora anuncios", app.conexoes.length === 3);
}

export async function verificarLateralApp(): Promise<void> {
  secao("lateral, lado do app: aceita as abas desta janela");
  const area = areaMemoria();
  let conectar: ((p: PortaRpc, r: Remetente) => void) | null = null;
  const ponte = new PonteLateral({
    area,
    janela: 10,
    novoId: () => "inst-1",
    ouvirConexoes: (cb) => {
      conectar = cb;
    },
  });
  await ponte.iniciar();
  checar("anuncia que abriu", (await area.obter(CHAVE_LATERAL))[CHAVE_LATERAL] !== undefined);
  let avisos = 0;
  ponte.aoMudar(() => avisos++);
  const abrirAba = (id: number, janela: number, frameId = 0) => {
    const [daAba, doApp] = parDePortas();
    const rpcAba = criarRpc(daAba, { contexto: () => ({ id }) });
    conectar!(doApp, { tab: { id, windowId: janela }, frameId });
    return { rpcAba, daAba };
  };
  const outra = abrirAba(2, 99);
  await tique(5);
  checar("aba de outra janela e recusada", !outra.rpcAba.aberta && ponte.atual() === null);
  const frame = abrirAba(3, 10, 4);
  await tique(5);
  checar("frame interno e recusado", !frame.rpcAba.aberta);
  const a = abrirAba(5, 10);
  const b = abrirAba(6, 10);
  await tique(5);
  checar("sem apresentacao ainda nao ha aba atual", ponte.atual() === null);
  await a.rpcAba.chamar("ola", { visivel: false, foco: 50, chave: "h|ana|1" });
  await b.rpcAba.chamar("ola", { visivel: true, foco: 10, chave: "h|ana|2" });
  checar("a visivel vence", ponte.atual()?.id === 6 && ponte.atual()?.chave === "h|ana|2");
  checar("avisa as mudancas", avisos >= 2);
  await b.rpcAba.chamar("ola", { visivel: false, foco: 10, chave: "h|ana|2" });
  checar("aba escondida: a de foco mais recente assume", ponte.atual()?.id === 5);
  checar("o rpc da aba atual alcanca a aba", (await ponte.atual()!.rpc.chamar<{ id: number }>("contexto")).id === 5);
  checar(
    "pedido da lista de uma unidade vai para a aba DESSA unidade, mesmo com outra na frente",
    ponte.daChave("h|ana|2")?.id === 6 && ponte.daChave("h|ana|1")?.id === 5,
  );
  checar("unidade sem aba aberta: nenhuma", ponte.daChave("h|ana|9") === null);
  a.rpcAba.fechar();
  await tique(5);
  checar("aba que caiu sai da lista", ponte.atual()?.id === 6);
  await ponte.encerrar();
  checar("encerrar retira o anuncio", (await area.obter(CHAVE_LATERAL))[CHAVE_LATERAL] === undefined);
  checar("chave do contexto", chaveDoContexto(CTX) === `${CTX.host}|pedro.soares|${CTX.unidade!.id}`);
}
