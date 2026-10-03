import { mostrarAviso } from "../src/ui/aviso";
import { checar, disparar, instalarDom, secao } from "./util";

/** O `:modal` do navegador: o linkedom não conhece a pseudo-classe (lança), então a prova finge a resposta. */
function fingirModal(el: Element, modal: boolean): void {
  const original = el.matches.bind(el);
  el.matches = (sel: string) => (sel === ":modal" ? modal : original(sel));
}

export function verificarAviso(): void {
  secao("aviso: sem dialogo aberto, no body (como sempre foi)");
  const doc = instalarDom('<html><body><div id="r"></div><dialog id="fechado"></dialog></body></html>');
  const a1 = mostrarAviso(doc, "Feito", undefined, 50);
  checar("filho direto do body", a1.parentElement === doc.body);
  checar("popover manual", a1.getAttribute("popover") === "manual");

  secao("aviso: com <dialog open>, dentro do dialogo (fora dele, tudo fica inerte)");
  const docD = instalarDom('<html><body><dialog open id="d"><div id="app"></div></dialog></body></html>');
  const dlg = docD.getElementById("d")!;
  let desfeito = 0;
  const a2 = mostrarAviso(docD, "Removido do histórico", { rotulo: "Desfazer", fazer: () => (desfeito += 1) }, 50);
  checar("descendente do dialogo aberto", dlg.contains(a2) && a2.parentElement === dlg);
  checar("nao fica no body", a2.parentElement !== docD.body);
  [...a2.querySelectorAll("button")].find((b) => b.textContent === "Desfazer")!.click();
  checar("o Desfazer de dentro do dialogo funciona e o aviso sai", desfeito === 1 && !a2.isConnected);

  secao("aviso: um so por vez, entre o body e os dialogos");
  const docU = instalarDom('<html><body><div id="r"></div></body></html>');
  const velho = mostrarAviso(docU, "Antes", undefined, 50);
  const d2 = docU.createElement("dialog");
  d2.setAttribute("open", "");
  docU.body.append(d2);
  const novo = mostrarAviso(docU, "Depois", undefined, 50);
  checar("o do body sai quando o novo vai para o dialogo", !velho.isConnected && d2.contains(novo));
  checar("so um aviso na pagina", docU.querySelectorAll(".spro-aviso").length === 1);

  secao("aviso: varios dialogos, no de cima");
  const docV = instalarDom('<html><body><dialog open id="modal"></dialog><dialog open id="solto"></dialog></body></html>');
  const modal = docV.getElementById("modal")!;
  const solto = docV.getElementById("solto")!;
  const a3 = mostrarAviso(docV, "Sem :modal", undefined, 50);
  checar("sem :modal no navegador: o ultimo aberto", a3.parentElement === solto);
  fingirModal(modal, true);
  fingirModal(solto, false);
  const a4 = mostrarAviso(docV, "Com :modal", undefined, 50);
  checar("com :modal: o modal de cima, nao o aberto com show()", a4.parentElement === modal);
  fingirModal(modal, false);
  const a5 = mostrarAviso(docV, "Nenhum modal", undefined, 50);
  checar("abertos com show() (nada inerte): no body", a5.parentElement === docV.body);

  secao("aviso: o dialogo fecha com o aviso na tela");
  const docF = instalarDom('<html><body><dialog open id="d"></dialog></body></html>');
  const dF = docF.getElementById("d")!;
  // Como o abrirModal dos apps: fechar tira o diálogo da página.
  dF.addEventListener("close", () => dF.remove());
  const a6 = mostrarAviso(docF, "Favoritado em GPF", { rotulo: "Desfazer", fazer: () => undefined }, 50);
  dF.removeAttribute("open");
  disparar(dF, "close");
  checar("o aviso volta para o body e continua na tela", a6.isConnected && a6.parentElement === docF.body);
}
