import { criarCombo, partesDestacadas } from "../src/ui/combobox";
import { abrirFlutuante, definirJanelaQueCresce, fecharOrfaos } from "../src/ui/flutuante";
import { criarMenu } from "../src/ui/menu";
import { checar, instalarDom, secao } from "./util";

const tique = (ms = 5) => new Promise((r) => setTimeout(r, ms));

function tecla(el: Element, key: string, extra: { shiftKey?: boolean } = {}): Event {
  const Ev = (el.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  const ev = new Ev("keydown", { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "key", { value: key });
  if (extra.shiftKey) Object.defineProperty(ev, "shiftKey", { value: true });
  el.dispatchEvent(ev);
  return ev;
}

export async function verificarFlutuante(): Promise<void> {
  secao("flutuante: camada orfa fecha (lista redesenhada com o menu aberto)");
  const doc = instalarDom('<html><body><div id="r"></div></body></html>');
  const menu = criarMenu({ rotulo: "Mais", itens: () => [{ rotulo: "Um", fazer: () => undefined }] });
  doc.getElementById("r")!.append(menu);
  menu.click();
  await tique();
  checar("menu aberto", !!doc.querySelector(".spro-menu-pop"));
  doc.getElementById("r")!.replaceChildren();
  fecharOrfaos();
  checar("ancora fora da arvore: a camada fecha", !doc.querySelector(".spro-menu-pop"));

  secao("flutuante: na janela que cresce (iframe embutido), abre para baixo e pede a altura toda");
  const docC = instalarDom('<html><body><button id="a">x</button></body></html>');
  const janela = docC.defaultView as unknown as Window & { innerHeight: number; innerWidth: number };
  janela.innerHeight = 300;
  janela.innerWidth = 800;
  const ancora = docC.getElementById("a") as HTMLElement;
  ancora.getBoundingClientRect = () => ({ top: 250, bottom: 280, left: 10, right: 110, width: 100, height: 30, x: 10, y: 250 }) as DOMRect;
  let fundo = -1;
  janela.addEventListener("spro-popover", (ev) => (fundo = Number((ev as CustomEvent<{ fundo: number }>).detail.fundo)));
  const camada = docC.createElement("div");
  const f1 = abrirFlutuante(ancora, camada, { alturaMaxima: 360, aoFechar: () => undefined });
  checar("janela fixa (lateral): sem espaco embaixo, abre para cima", camada.classList.contains("spro-flutuante-cima"));
  f1.fechar();
  definirJanelaQueCresce(() => true);
  const camada2 = docC.createElement("div");
  const f2 = abrirFlutuante(ancora, camada2, { alturaMaxima: 360, aoFechar: () => undefined });
  checar(
    "janela que cresce: abre para baixo e anuncia o fundo inteiro",
    !camada2.classList.contains("spro-flutuante-cima") && camada2.style.maxHeight === "360px" && fundo === 280 + 4 + 360 + 12,
    { cima: camada2.classList.contains("spro-flutuante-cima"), max: camada2.style.maxHeight, fundo },
  );
  f2.fechar();
  definirJanelaQueCresce(null);

  secao("combobox: Tab, Espaco e primeira letra");
  const docT = instalarDom('<html><body><div id="r"></div></body></html>');
  const ops = [
    { valor: "a", rotulo: "Atrasados" },
    { valor: "h", rotulo: "Vencem hoje" },
    { valor: "n", rotulo: "No prazo" },
  ];
  let escolha: string[] = [];
  const simples = criarCombo({ rotulo: "Ordem", opcoes: ops, busca: false, aoMudar: (v) => (escolha = v) });
  docT.getElementById("r")!.append(simples.el);
  simples.el.click();
  await tique();
  const lista = () => docT.querySelector('.spro-combo-pop [role="listbox"]') as HTMLElement;
  tecla(lista(), "n");
  tecla(lista(), "Enter");
  checar("primeira letra pula para a opcao (sem busca)", escolha.join() === "n", escolha);
  simples.el.click();
  await tique();
  const tab = tecla(lista(), "Tab");
  checar("Tab fecha e deixa o Tab nativo seguir (sem impedir)", !docT.querySelector(".spro-combo-pop") && !tab.defaultPrevented);
  let multi: string[] = [];
  const m = criarCombo({ rotulo: "Situação", opcoes: ops, multiplo: true, busca: false, aoMudar: (v) => (multi = v) });
  docT.getElementById("r")!.append(m.el);
  m.el.click();
  await tique();
  tecla(lista(), " ");
  checar("Espaco marca na escolha multipla", multi.join() === "a", multi);
  const tabM = tecla(lista(), "Tab");
  checar("Tab na multipla vai para as acoes do rodape (Limpar)", !!docT.querySelector(".spro-combo-pop") && tabM.defaultPrevented);
  const limpar = docT.querySelector(".spro-combo-limpar") as HTMLElement;
  tecla(limpar, "Enter");
  checar("Enter no botao do rodape nao escolhe opcao", multi.join() === "a", multi);
  const tabFim = tecla(limpar, "Tab");
  checar("Tab no ultimo botao do rodape fecha e segue", !docT.querySelector(".spro-combo-pop") && !tabFim.defaultPrevented);

  secao("combobox: destaque em texto decomposto (NFD)");
  const nfd = "Licitação".normalize("NFD");
  const partes = partesDestacadas(nfd, "licitacao");
  checar("o trecho inteiro fica marcado", partes.length === 1 && partes[0]!.marcado === true, partes);
}
