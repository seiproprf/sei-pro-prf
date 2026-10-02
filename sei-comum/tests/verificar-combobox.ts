import { criarCombo, filtrarOpcoes, partesDestacadas } from "../src/ui/combobox";
import { checar, disparar, instalarDom, secao } from "./util";

const tique = (ms = 5) => new Promise((r) => setTimeout(r, ms));

/** Tecla do linkedom (o KeyboardEvent do Node não serve aos elementos dele). */
function tecla(el: Element, key: string): void {
  const Ev = (el.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  const ev = new Ev("keydown", { bubbles: true, cancelable: true });
  Object.defineProperty(ev, "key", { value: key });
  el.dispatchEvent(ev);
}

const PASTAS = [
  { valor: "a", rotulo: "Licitações", contagem: 3 },
  { valor: "b", rotulo: "Fiscalização", contagem: 4 },
  { valor: "c", rotulo: "Contratos", contagem: 2 },
  { valor: "d", rotulo: "Ação Civil Pública", contagem: 1 },
];

export async function verificarCombobox(): Promise<void> {
  secao("combobox: filtro sem acento nem caixa");
  checar(
    "'licitacoes' acha 'Licitações'",
    filtrarOpcoes(PASTAS, "licitacoes")
      .map((o) => o.valor)
      .join() === "a",
  );
  checar(
    "'ACAO civil' acha 'Ação Civil Pública' (palavras em qualquer parte)",
    filtrarOpcoes(PASTAS, "ACAO civil")
      .map((o) => o.valor)
      .join() === "d",
  );
  checar(
    "'co' poe primeiro quem comeca com o termo",
    filtrarOpcoes(PASTAS, "co")[0]?.valor === "c",
    filtrarOpcoes(PASTAS, "co").map((o) => o.rotulo),
  );
  checar("termo vazio devolve tudo na ordem", filtrarOpcoes(PASTAS, "  ").length === 4);
  const partes = partesDestacadas("Fiscalização", "zacao");
  checar(
    "destaca o trecho achado no texto ORIGINAL (com acento)",
    partes.map((p) => (p.marcado ? `[${p.texto}]` : p.texto)).join("") === "Fiscali[zação]",
    partes,
  );

  secao("combobox: multipla escolha");
  const doc = instalarDom('<html><body><div id="r"></div></body></html>');
  let mudou: string[] = [];
  const combo = criarCombo({ rotulo: "Pasta", multiplo: true, opcoes: PASTAS, vazio: "Todas as pastas", aoMudar: (v) => (mudou = v) });
  doc.getElementById("r")!.append(combo.el);
  checar("botao mostra o texto de vazio", (combo.el.textContent ?? "").includes("Todas as pastas"));
  checar("acessivel como combobox", combo.el.getAttribute("role") === "combobox" && combo.el.getAttribute("aria-expanded") === "false");
  combo.el.click();
  await tique();
  const pop = () => doc.querySelector(".spro-combo-pop");
  checar(
    "abre a lista com a busca",
    !!pop() && !!pop()!.querySelector("input.spro-combo-busca") && combo.el.getAttribute("aria-expanded") === "true",
  );
  checar("mostra a contagem de cada opcao", pop()!.querySelector('[data-valor="b"] .spro-combo-conta')?.textContent === "4");
  const busca = pop()!.querySelector("input.spro-combo-busca") as HTMLInputElement;
  busca.value = "fiscalizacao";
  disparar(busca, "input");
  await tique();
  const visiveis = () => [...pop()!.querySelectorAll('[role="option"]')].map((o) => o.getAttribute("data-valor"));
  checar("digitar filtra (sem acento)", visiveis().join() === "b", visiveis());
  tecla(busca, "Enter");
  await tique();
  checar("Enter marca a opcao em destaque e mantem aberto (multiplo)", mudou.join() === "b" && !!pop());
  busca.value = "";
  disparar(busca, "input");
  await tique();
  (pop()!.querySelector('[data-valor="c"]') as HTMLElement).click();
  await tique();
  checar("clicar acrescenta", mudou.join() === "b,c", mudou);
  checar("opcao marcada fica aria-selected", pop()!.querySelector('[data-valor="c"]')?.getAttribute("aria-selected") === "true");
  tecla(busca, "Backspace");
  await tique();
  checar("Backspace com a busca vazia tira a ultima", mudou.join() === "b", mudou);
  tecla(busca, "Escape");
  await tique();
  checar("Esc fecha", !pop() && combo.el.getAttribute("aria-expanded") === "false");
  checar("botao resume a escolha", (combo.el.textContent ?? "").includes("Fiscalização"), combo.el.textContent);
  combo.el.click();
  await tique();
  (pop()!.querySelector(".spro-combo-limpar") as HTMLElement).click();
  await tique();
  checar("Limpar zera", mudou.length === 0);
  disparar(doc.body, "pointerdown");
  await tique();
  checar("clicar fora fecha", !pop());

  secao("combobox: escolha simples, teclado e criar");
  let simples: string[] = [];
  const criados: string[] = [];
  const unico = criarCombo({
    rotulo: "Pasta",
    opcoes: () => PASTAS,
    vazio: "(sem pasta)",
    aoMudar: (v) => (simples = v),
    criar: async (t) => {
      criados.push(t);
      return { valor: "novo", rotulo: t };
    },
    rotuloCriar: (t) => `Criar pasta “${t}”`,
  });
  doc.getElementById("r")!.append(unico.el);
  tecla(unico.el, "ArrowDown");
  await tique();
  const b2 = pop()!.querySelector("input.spro-combo-busca") as HTMLInputElement;
  tecla(b2, "ArrowDown");
  tecla(b2, "Enter");
  await tique();
  checar("setas e Enter escolhem e fecham (simples)", simples.join() === "b" && !pop(), simples);
  unico.el.click();
  await tique();
  const b3 = pop()!.querySelector("input.spro-combo-busca") as HTMLInputElement;
  b3.value = "Convênios";
  disparar(b3, "input");
  await tique();
  const criar = pop()!.querySelector(".spro-combo-criar") as HTMLElement | null;
  checar("sem achar, oferece criar", criar?.textContent?.includes("Criar pasta “Convênios”") === true, criar?.textContent);
  criar!.click();
  await tique(20);
  checar("criar chama o criador e ja escolhe", criados.join() === "Convênios" && simples.join() === "novo");
}
