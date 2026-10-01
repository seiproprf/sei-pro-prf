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

  secao("painel lateral: pacote sem o agente");
  const doc2 = instalarDom('<html><body><div id="painel"></div></body></html>');
  const raiz2 = doc2.getElementById("painel")!;
  const s2 = await montarShell(raiz2, { sessao: areaMemoria({ painelAba: "agente" }), temAgente: false, url });
  checar("sem agente, so favoritos", s2.atual() === "favoritos" && raiz2.querySelectorAll("iframe").length === 1);
  checar("e sem barra de abas", !raiz2.querySelector('[role="tablist"]'));
}
