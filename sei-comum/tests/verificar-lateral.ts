import { areaMemoria } from "../src/armazenamento/area";
import { ligarLadoAba, PonteLateral, type Remetente } from "../src/ponte/lateral";
import { parDePortas } from "../src/ponte/parDePortas";
import type { PortaRpc } from "../src/ponte/rpc";
import { checar, secao } from "./util";

const tique = (ms = 5) => new Promise((r) => setTimeout(r, ms));

export async function verificarPonteLateralGenerica(): Promise<void> {
  secao("ponte lateral: a chave do anuncio e parametro");
  const area = areaMemoria();
  const ouvintes: Array<(p: PortaRpc, r: Remetente) => void> = [];
  const app = new PonteLateral({ area, chave: "x/lateral", janela: 1, novoId: () => "app1", ouvirConexoes: (cb) => ouvintes.push(cb) });
  await app.iniciar();
  checar("anuncia na chave pedida", "x/lateral" in (await area.obter("x/lateral")));
  let conectouY = 0;
  ligarLadoAba({
    area,
    chave: "y/lateral",
    conectar: () => {
      conectouY++;
      return parDePortas()[0];
    },
    tratadores: {},
    estado: () => ({ visivel: true, foco: 1, chave: "k" }),
  });
  await tique();
  checar("aba de outra chave nao conecta", conectouY === 0);
  ligarLadoAba({
    area,
    chave: "x/lateral",
    conectar: () => {
      const [daAba, doApp] = parDePortas();
      for (const o of ouvintes) o(doApp, { tab: { id: 7, windowId: 1 }, frameId: 0 });
      return daAba;
    },
    tratadores: {},
    estado: () => ({ visivel: true, foco: 2, chave: "sei|ana" }),
  });
  await tique(20);
  checar("aba da mesma chave conecta e se apresenta", app.atual()?.chave === "sei|ana");
  await app.encerrar();
  checar("encerrar retira o proprio anuncio", !("x/lateral" in (await area.obter("x/lateral"))));
}
