import { areaMemoria } from "@comum/armazenamento/area";
import { parDePortas } from "@comum/ponte/parDePortas";
import type { PortaRpc } from "@comum/ponte/rpc";
import { criarRpc } from "@comum/ponte/rpc";
import { CHAVE_LATERAL } from "../src/modelo/constantes";
import { ligarLadoAba } from "../src/pagina/lateral";
import { checar, secao, tique } from "./util";

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
