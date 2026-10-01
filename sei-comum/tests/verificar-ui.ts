import { h, icone, NOMES_ICONES } from "../src/ui/dom";
import { checar, disparar, instalarDom, secao } from "./util";

export function verificarUi(): void {
  instalarDom();
  secao("ui: h");
  checar("textarea mostra o valor", h("textarea", { value: "Nota\nlonga" }).value === "Nota\nlonga");
  checar("classe", h("div", { class: "a b" }).className === "a b");
  checar("booleano verdadeiro vira atributo vazio", h("button", { disabled: true }).getAttribute("disabled") === "");
  checar("booleano falso nao entra", !h("button", { disabled: false }).hasAttribute("disabled"));
  checar("undefined nao entra", !h("div", { title: undefined }).hasAttribute("title"));
  checar(
    "texto vira no de texto, nunca HTML",
    h("p", {}, "<b>x</b>").textContent === "<b>x</b>" && h("p", {}, "<b>x</b>").children.length === 0,
  );
  let cliques = 0;
  const b = h("button", { onclick: () => (cliques += 1) }, "ok");
  b.click();
  checar("on* vira ouvinte, nao atributo", cliques === 1 && !b.hasAttribute("onclick"));
  const sel = h("select", { onchange: () => (cliques += 10) }, h("option", { value: "1" }, "um"));
  disparar(sel, "change");
  checar("onchange funciona", cliques === 11);

  secao("ui: icone");
  const svg = icone("estrela", 20);
  checar(
    "svg com viewBox e oculto do leitor de tela",
    svg.getAttribute("viewBox") === "0 0 24 24" && svg.getAttribute("aria-hidden") === "true",
  );
  checar("tamanho", svg.getAttribute("width") === "20");
  checar(
    "todo icone desenha algo",
    NOMES_ICONES.every((n) => icone(n).childNodes.length > 0),
    NOMES_ICONES.filter((n) => icone(n).childNodes.length === 0),
  );
}
