import { areaMemoria } from "@comum/armazenamento/area";
import { montarShell } from "../src/shell/painel";
import { botao, checar, instalarDom, secao, tique } from "./util";

const url = (c: string) => `chrome-extension://x/${c}`;

export async function verificarShell(): Promise<void> {
  secao("painel lateral: abas Favoritos | Agente");
  const doc = instalarDom('<html><body><div id="painel"></div></body></html>');
  const sessao = areaMemoria({ painelAba: "agente" });
  const raiz = doc.getElementById("painel")!;
  const shell = await montarShell(raiz, { sessao, temAgente: true, url });
  const frames = () => [...raiz.querySelectorAll("iframe")] as HTMLIFrameElement[];
  checar("abre na aba pedida pelo background", shell.atual() === "agente");
  checar("so a aba aberta tem iframe (preguicoso)", frames().length === 1 && frames()[0]!.src.endsWith("html/agente.html"));
  botao(raiz, "Favoritos")!.click();
  await tique();
  checar(
    "trocar cria o iframe do favoritos, em modo lateral",
    frames().length === 2 && frames().some((f) => f.src.endsWith("favoritos.html#modo=lateral")),
  );
  const agente = frames().find((f) => f.src.endsWith("agente.html"))!;
  checar("o agente fica vivo, so escondido", agente.hidden && raiz.contains(agente));
  checar("a escolha fica na sessao", (await sessao.obter("painelAba")).painelAba === "favoritos");
  botao(raiz, "Agente de IA")!.click();
  await tique();
  checar("voltar nao recria o iframe", frames().length === 2 && !agente.hidden);
  await sessao.gravar({ painelAba: "favoritos" });
  await tique();
  checar("pedido novo do background com o painel aberto troca a aba", shell.atual() === "favoritos");
  checar("aba marcada", botao(raiz, "Favoritos")!.getAttribute("aria-selected") === "true");

  secao("painel lateral: contador na aba Favoritos");
  const doc3 = instalarDom('<html><body><div id="painel"></div></body></html>');
  const local = areaMemoria({ "favoritos/contadorPainel": 3 });
  const raiz3 = doc3.getElementById("painel")!;
  await montarShell(raiz3, { sessao: areaMemoria(), temAgente: true, url, local });
  await tique();
  checar("mostra as pendencias na aba", botao(raiz3, "Favoritos (3)") !== undefined, raiz3.querySelector('[role="tab"]')?.textContent);
  await local.gravar({ "favoritos/contadorPainel": 0 });
  await tique();
  checar("zerou: sem numero", botao(raiz3, "Favoritos") !== undefined);

  secao("painel lateral: pacote sem o favoritos novo (oficial ainda com o antigo)");
  const doc4 = instalarDom('<html><body><div id="painel"></div></body></html>');
  const raiz4 = doc4.getElementById("painel")!;
  const s4 = await montarShell(raiz4, { sessao: areaMemoria({ painelAba: "favoritos" }), temAgente: true, temFavoritos: false, url });
  checar(
    "so o agente, sem a aba Favoritos que nunca conectaria",
    s4.atual() === "agente" && raiz4.querySelectorAll("iframe").length === 1 && !raiz4.querySelector('[role="tablist"]'),
  );

  secao("painel lateral: pacote sem o agente");
  const doc2 = instalarDom('<html><body><div id="painel"></div></body></html>');
  const raiz2 = doc2.getElementById("painel")!;
  const s2 = await montarShell(raiz2, { sessao: areaMemoria({ painelAba: "agente" }), temAgente: false, url });
  checar("sem agente, so favoritos", s2.atual() === "favoritos" && raiz2.querySelectorAll("iframe").length === 1);
  checar("e sem barra de abas", !raiz2.querySelector('[role="tablist"]'));

  secao("painel lateral: tres abas na ordem Favoritos | Historico | Agente");
  {
    const docH = instalarDom('<html><body><div id="painel"></div></body></html>');
    const raizH = docH.getElementById("painel")!;
    const shellH = await montarShell(raizH, { sessao: areaMemoria({ painelAba: "historico" }), temAgente: true, temHistorico: true, url });
    const rotulos = [...raizH.querySelectorAll('[role="tab"]')].map((b) => b.getAttribute("aria-label"));
    checar("ordem das abas", JSON.stringify(rotulos) === JSON.stringify(["Favoritos", "Hist\u00f3rico", "Agente de IA"]), rotulos);
    checar("abre na aba historico pedida", shellH.atual() === "historico");
    const f = raizH.querySelector("iframe") as HTMLIFrameElement;
    checar("iframe do historico em modo lateral", f.src.endsWith("html/historico.html#modo=lateral"));
  }
  {
    const docS = instalarDom('<html><body><div id="painel"></div></body></html>');
    const raizS = docS.getElementById("painel")!;
    await montarShell(raizS, { sessao: areaMemoria(), temAgente: true, url });
    checar("sem init_historico no manifest, nao ha aba Historico", !botao(raizS, "Hist\u00f3rico"));
  }
}
