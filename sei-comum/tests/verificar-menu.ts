import { criarMenu } from "../src/ui/menu";
import { checar, disparar, instalarDom, secao } from "./util";

const tique = (ms = 5) => new Promise((r) => setTimeout(r, ms));

function tecla(el: Element, key: string): void {
  const Ev = (el.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  const ev = new Ev("keydown", { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "key", { value: key });
  el.dispatchEvent(ev);
}

export async function verificarMenu(): Promise<void> {
  secao("menu: icones, separadores, teclado e fechar");
  const doc = instalarDom('<html><body><div id="r"></div><dialog id="d" open><div id="dentro"></div></dialog></body></html>');
  const feitos: string[] = [];
  const botao = criarMenu({
    rotulo: "Opções dos favoritos",
    icone: "ajustes",
    itens: () => [
      { rotulo: "Pastas e etiquetas", icone: "etiqueta", fazer: () => feitos.push("pastas") },
      { rotulo: "Mapa dos favoritos", icone: "mapa", fazer: () => feitos.push("mapa") },
      "-",
      { rotulo: "Lixeira", icone: "lixeira", fazer: () => feitos.push("lixeira"), dica: "30 dias" },
      null,
      { rotulo: "Remover", icone: "lixeira", perigo: true, fazer: () => feitos.push("remover") },
    ],
  });
  doc.getElementById("r")!.append(botao);
  checar("botao acessivel", botao.getAttribute("aria-haspopup") === "menu" && botao.getAttribute("aria-expanded") === "false");
  checar("itens so existem com o menu aberto", !doc.querySelector('[role="menuitem"]'));
  botao.click();
  await tique();
  const pop = () => doc.querySelector(".spro-menu-pop");
  const itens = () => [...doc.querySelectorAll<HTMLElement>('[role="menuitem"]')];
  checar("abre com os itens", itens().length === 4 && botao.getAttribute("aria-expanded") === "true", itens().length);
  checar(
    "cada item tem icone",
    itens().every((i) => !!i.querySelector("svg")),
  );
  checar("separador", !!pop()?.querySelector('[role="separator"]'));
  checar("dica aparece", (pop()?.textContent ?? "").includes("30 dias"));
  checar("item perigoso marcado", itens()[3]?.classList.contains("spro-menu-perigo") === true);
  checar("primeiro item com foco (roving)", itens()[0]?.getAttribute("tabindex") === "0" && itens()[1]?.getAttribute("tabindex") === "-1");
  tecla(itens()[0]!, "ArrowDown");
  checar("seta move o foco", itens()[1]?.getAttribute("tabindex") === "0");
  tecla(itens()[1]!, "End");
  checar("End vai ao ultimo", itens()[3]?.getAttribute("tabindex") === "0");
  tecla(itens()[3]!, "ArrowDown");
  checar("seta da a volta", itens()[0]?.getAttribute("tabindex") === "0");
  tecla(itens()[0]!, "Enter");
  await tique();
  checar("Enter faz e fecha", feitos.join() === "pastas" && !pop());
  botao.click();
  await tique();
  itens()[1]!.click();
  await tique();
  checar("clique faz e fecha", feitos.join() === "pastas,mapa" && !pop());
  botao.click();
  await tique();
  tecla(itens()[0]!, "Escape");
  await tique();
  checar("Esc fecha sem fazer", !pop() && feitos.length === 2);
  botao.click();
  await tique();
  disparar(doc.getElementById("r")!, "pointerdown");
  await tique();
  checar("clicar fora fecha", !pop());

  secao("menu: dentro de um dialogo, a lista fica no dialogo (camada de cima)");
  const noDialogo = criarMenu({ rotulo: "Mais", itens: () => [{ rotulo: "Um", fazer: () => undefined }] });
  doc.getElementById("dentro")!.append(noDialogo);
  noDialogo.click();
  await tique();
  checar("lista anexada ao dialogo aberto", pop()?.parentElement?.id === "d", pop()?.parentElement?.tagName);
}
