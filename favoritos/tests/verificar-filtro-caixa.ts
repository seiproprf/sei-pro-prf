import { filtroAtivoNaCaixa } from "../src/pagina/filtroCaixa";
import { capturarDaCaixa } from "../src/pagina/novidades";
import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, secao, telaSei } from "./util";
import { CTX } from "./verificar-modelo";

const caixa = () => telaSei("sei41/caixa.html").doc;
const valor = (doc: Document, id: string, v: string) => doc.getElementById(id)!.setAttribute("value", v);

export async function verificarFiltroCaixa(): Promise<void> {
  secao("caixa com filtro salvo nao serve de trava");
  checar("caixa do 4.1.5 sem filtro", filtroAtivoNaCaixa(caixa()) === null, filtroAtivoNaCaixa(caixa()));
  const meus = caixa();
  valor(meus, "hdnMeusProcessos", "M");
  checar("'atribuidos a mim'", /atribu/i.test(filtroAtivoNaCaixa(meus) ?? ""));
  const marc = caixa();
  valor(marc, "hdnIdMarcador110000001", "12");
  checar("filtro por marcador", /marcador/i.test(filtroAtivoNaCaixa(marc) ?? ""));
  const det = caixa();
  valor(det, "hdnTipoVisualizacao", "D");
  checar("visualizacao detalhada", /detalhada/i.test(filtroAtivoNaCaixa(det) ?? ""));
  const painel = caixa();
  painel.querySelector("#tblProcessosRecebidos caption")!.insertAdjacentHTML("afterbegin", "<b>não Visualizados</b>");
  checar("filtro do painel (no titulo da tabela)", /painel|visualizados/i.test(filtroAtivoNaCaixa(painel) ?? ""));
  const semOpcoes = caixa();
  semOpcoes.getElementById("lnkAtribuidosMim")?.remove();
  checar("SEI 4+/5 sem as opcoes de filtro (o SEI as esconde com filtro do painel)", filtroAtivoNaCaixa(semOpcoes) !== null);
  const chip = caixa();
  chip.querySelector("#frmProcedimentoControlar")!.insertAdjacentHTML("afterbegin", '<div id="divFiltroTipoProcesso" class="caixaFiltroControle"><p>Contrato</p></div>');
  checar("caixinha de filtro (tipo, prioridade, marcador)", /Contrato/.test(filtroAtivoNaCaixa(chip) ?? ""));

  secao("captura: caixa filtrada nao conclui 'saiu da unidade'");
  const area = areaMemoria();
  let t = 1;
  const repo = new RepositorioFavoritos(area, escoposDoContexto(CTX).unidade!, () => ({ agora: ++t, dispositivo: "A" }));
  await repo.adicionar({ id: "999999", protocolo: "fora" });
  const f = caixa();
  for (const id of ["#tblProcessosRecebidos", "#tblProcessosGerados"]) {
    const tab = f.querySelector(id)!;
    tab.querySelector("caption")!.textContent = `Processos (${tab.querySelectorAll("tr[id^='P']").length} registros):`;
  }
  valor(f, "hdnMeusProcessos", "M");
  await capturarDaCaixa(f, repo, 1000);
  checar("com 'atribuidos a mim' o ausente nao vira 'fora'", !(await repo.atuais()).has("999999"));
}
