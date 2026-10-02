/**
 * Seletor inteligente no lugar do `<select>` nativo: escolha simples ou
 * múltipla, filtro ao digitar sem diferenciar acento nem caixa ("licitacao"
 * acha "Licitação"), trecho achado em destaque, contagem por opção, "Marcar os
 * filtrados", "Limpar" e "Criar “…”" quando nada bate. Teclado completo
 * (↑ ↓ Home End Enter Esc Backspace Tab) e ARIA de combobox/listbox.
 *
 * A lista é uma camada flutuante (ui/flutuante.ts): fica no diálogo aberto, na
 * Shadow Root do balão ou no `body`, abre para cima quando falta espaço e avisa
 * até onde desce (o iframe abaixo da lista de processos cresce para não cortá-la).
 *
 * Sem innerHTML: rótulos vêm do usuário (nome de pasta) e entram como texto.
 */

import { normalizarTexto } from "../texto";
import { h, icone, type NomeIcone } from "./dom";
import { abrirFlutuante, type Flutuante } from "./flutuante";

export interface OpcaoCombo {
  valor: string;
  rotulo: string;
  /** Linha secundária, menor (ex.: o que o modo de prazo faz). */
  descricao?: string;
  /** Quantos itens têm esta opção (aparece à direita). */
  contagem?: number;
  /** Bolinha de cor (etiquetas). */
  cor?: string;
  icone?: NomeIcone;
}

export interface ConfigCombo {
  /** Nome do campo: rótulo acessível e título do botão. */
  rotulo: string;
  opcoes: OpcaoCombo[] | (() => OpcaoCombo[]);
  valor?: string[];
  multiplo?: boolean;
  /** Texto do botão sem nada escolhido. */
  vazio?: string;
  /** Ícone à esquerda do texto do botão. */
  icone?: NomeIcone;
  /** Caixa de busca: padrão é mostrar com mais de 7 opções, na múltipla ou com `criar`. */
  busca?: boolean;
  aoMudar?: (valores: string[]) => void;
  /** Cria a opção com o texto digitado e já a escolhe. Devolver null cancela. */
  criar?: (texto: string) => Promise<OpcaoCombo | null> | OpcaoCombo | null;
  rotuloCriar?: (texto: string) => string;
  /** Classe extra no botão (ex.: `spro-combo-compacto`). */
  classe?: string;
  /** Largura mínima da lista, em px. */
  larguraLista?: number;
}

export interface Combo {
  el: HTMLButtonElement;
  valor(): string[];
  /** Troca a escolha; só chama `aoMudar` se `avisar`. */
  definir(valores: string[], avisar?: boolean): void;
  /** Redesenha o botão (as opções ou as contagens mudaram). */
  atualizar(): void;
  abrir(termo?: string): void;
  fechar(): void;
}

/** Trecho de texto, marcado se é o que a busca achou. */
export interface Parte {
  texto: string;
  marcado: boolean;
}

/**
 * Filtra pelas palavras do termo (todas precisam aparecer, em qualquer ordem e
 * posição), sem acento nem caixa. Quem começa com o termo vem antes; depois,
 * quem tem uma palavra que começa com ele; o resto mantém a ordem original.
 */
export function filtrarOpcoes<T extends Pick<OpcaoCombo, "rotulo" | "descricao">>(opcoes: T[], termo: string): T[] {
  const t = normalizarTexto(termo);
  if (!t) return [...opcoes];
  const palavras = t.split(" ");
  const pontuadas: Array<{ o: T; nota: number; i: number }> = [];
  opcoes.forEach((o, i) => {
    const rotulo = normalizarTexto(o.rotulo);
    const tudo = `${rotulo} ${normalizarTexto(o.descricao ?? "")}`;
    if (!palavras.every((p) => tudo.includes(p))) return;
    const nota = rotulo.startsWith(t) ? 0 : rotulo.split(" ").some((w) => w.startsWith(palavras[0]!)) ? 1 : 2;
    pontuadas.push({ o, nota, i });
  });
  return pontuadas.sort((a, b) => a.nota - b.nota || a.i - b.i).map((x) => x.o);
}

/**
 * Corta o texto ORIGINAL (com acento) nos trechos que a busca achou. A busca
 * compara sem acento: cada caractere do texto normalizado aponta para o
 * caractere original de onde veio.
 */
export function partesDestacadas(texto: string, termo: string): Parte[] {
  const palavras = normalizarTexto(termo).split(" ").filter(Boolean);
  if (!palavras.length) return [{ texto, marcado: false }];
  const chars = [...texto];
  let normal = "";
  const origem: number[] = [];
  chars.forEach((c, i) => {
    const n = c
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
    for (const x of n) {
      normal += x;
      origem.push(i);
    }
  });
  const marcado = new Array<boolean>(chars.length).fill(false);
  for (const p of palavras) {
    const ini = normal.indexOf(p);
    if (ini < 0) continue;
    for (let k = ini; k < ini + p.length; k++) marcado[origem[k]!] = true;
  }
  const partes: Parte[] = [];
  chars.forEach((c, i) => {
    const ultima = partes[partes.length - 1];
    if (ultima && ultima.marcado === marcado[i]) ultima.texto += c;
    else partes.push({ texto: c, marcado: marcado[i]! });
  });
  return partes;
}

let sequencia = 0;

export function criarCombo(cfg: ConfigCombo): Combo {
  const id = `spro-combo-${++sequencia}`;
  const lerOpcoes = () => (typeof cfg.opcoes === "function" ? cfg.opcoes() : cfg.opcoes);
  const criadas = new Map<string, OpcaoCombo>();
  const conhecida = (v: string) => lerOpcoes().find((o) => o.valor === v) ?? criadas.get(v);
  let escolhidos: string[] = [...(cfg.valor ?? [])];
  let pop: HTMLDivElement | null = null;
  let termo = "";
  let ativo = 0;
  let visiveis: OpcaoCombo[] = [];
  let flut: Flutuante | null = null;

  const botao = h("button", {
    type: "button",
    class: `spro-combo${cfg.classe ? ` ${cfg.classe}` : ""}`,
    role: "combobox",
    "aria-haspopup": "listbox",
    "aria-expanded": "false",
    "aria-label": cfg.rotulo,
    title: cfg.rotulo,
  });

  const avisar = () => cfg.aoMudar?.([...escolhidos]);

  function desenharBotao(): void {
    const filhos: Node[] = [];
    if (cfg.icone) filhos.push(icone(cfg.icone, 15));
    const nomes = escolhidos.map((v) => conhecida(v)).filter((o): o is OpcaoCombo => !!o);
    const texto = h("span", { class: "spro-combo-texto" });
    if (!nomes.length) {
      texto.classList.add("spro-combo-vazio");
      texto.append(cfg.vazio ?? "Escolher…");
    } else {
      const primeira = nomes[0]!;
      if (primeira.cor) texto.append(h("span", { class: "spro-combo-cor", style: `background:${primeira.cor}` }));
      texto.append(h("span", { class: "spro-combo-rotulo" }, primeira.rotulo));
      if (nomes.length > 1) texto.append(h("span", { class: "spro-combo-mais" }, `+${nomes.length - 1}`));
    }
    filhos.push(texto, icone("chevron", 14));
    botao.classList.toggle("spro-combo-ativo", cfg.multiplo === true && nomes.length > 0);
    botao.replaceChildren(...filhos);
  }

  const temBusca = () => cfg.busca ?? (lerOpcoes().length > 7 || !!cfg.multiplo || !!cfg.criar);

  function escolher(o: OpcaoCombo): void {
    if (cfg.multiplo) {
      escolhidos = escolhidos.includes(o.valor) ? escolhidos.filter((v) => v !== o.valor) : [...escolhidos, o.valor];
      avisar();
      desenharBotao();
      desenharLista();
      return;
    }
    const mudou = escolhidos.length !== 1 || escolhidos[0] !== o.valor;
    escolhidos = [o.valor];
    desenharBotao();
    fechar(true);
    if (mudou) avisar();
  }

  async function criarDoTermo(): Promise<void> {
    if (!cfg.criar) return;
    const texto = termo.trim();
    if (!texto) return;
    const nova = await cfg.criar(texto);
    if (!nova) return;
    criadas.set(nova.valor, nova);
    termo = "";
    if (pop) {
      const busca = pop.querySelector<HTMLInputElement>(".spro-combo-busca");
      if (busca) busca.value = "";
    }
    if (cfg.multiplo && escolhidos.includes(nova.valor)) desenharLista();
    else escolher(nova);
  }

  function linhaDaOpcao(o: OpcaoCombo, i: number): HTMLLIElement {
    const marcada = escolhidos.includes(o.valor);
    const rotulo = h("span", { class: "spro-combo-op-rotulo" });
    for (const p of partesDestacadas(o.rotulo, termo)) rotulo.append(p.marcado ? h("mark", {}, p.texto) : p.texto);
    const li = h(
      "li",
      {
        role: "option",
        id: `${id}-op-${i}`,
        class: `spro-combo-op${i === ativo ? " spro-combo-op-ativa" : ""}`,
        "data-valor": o.valor,
        "aria-selected": marcada ? "true" : "false",
      },
      cfg.multiplo ? h("span", { class: "spro-combo-caixa", "aria-hidden": "true" }, marcada ? icone("check", 12) : null) : null,
      o.cor ? h("span", { class: "spro-combo-cor", style: `background:${o.cor}` }) : null,
      o.icone ? icone(o.icone, 15) : null,
      h("span", { class: "spro-combo-op-textos" }, rotulo, o.descricao ? h("span", { class: "spro-combo-op-desc" }, o.descricao) : null),
      o.contagem !== undefined ? h("span", { class: "spro-combo-conta" }, String(o.contagem)) : null,
      !cfg.multiplo && marcada ? h("span", { class: "spro-combo-marca" }, icone("check", 14)) : null,
    );
    li.addEventListener("pointerdown", (ev) => ev.preventDefault()); // não tira o foco da busca
    li.addEventListener("click", () => {
      ativo = i;
      escolher(o);
    });
    li.addEventListener("pointermove", () => {
      if (ativo === i) return;
      ativo = i;
      marcarAtiva();
    });
    return li;
  }

  function marcarAtiva(): void {
    if (!pop) return;
    const itens = [...pop.querySelectorAll<HTMLElement>('[role="option"]')];
    itens.forEach((li, i) => {
      li.classList.toggle("spro-combo-op-ativa", i === ativo);
    });
    const atual = itens[ativo];
    const busca = pop.querySelector(".spro-combo-busca");
    const alvo = busca ?? pop.querySelector('[role="listbox"]');
    if (atual) {
      alvo?.setAttribute("aria-activedescendant", atual.id);
      atual.scrollIntoView?.({ block: "nearest" });
    } else alvo?.removeAttribute("aria-activedescendant");
  }

  function desenharLista(): void {
    if (!pop) return;
    visiveis = filtrarOpcoes(lerOpcoes(), termo);
    if (ativo >= visiveis.length) ativo = Math.max(0, visiveis.length - 1);
    const lista = pop.querySelector<HTMLElement>('[role="listbox"]')!;
    lista.replaceChildren(...visiveis.map(linhaDaOpcao));
    const extras = pop.querySelector<HTMLElement>(".spro-combo-extras")!;
    extras.replaceChildren();
    const t = termo.trim();
    if (!visiveis.length) extras.append(h("p", { class: "spro-combo-nada" }, t ? "Nada encontrado." : "Nenhuma opção."));
    const exata = lerOpcoes().some((o) => normalizarTexto(o.rotulo) === normalizarTexto(t));
    if (cfg.criar && t && !exata) {
      const criar = h(
        "button",
        { type: "button", class: "spro-combo-criar" },
        icone("mais", 14),
        h("span", {}, cfg.rotuloCriar ? cfg.rotuloCriar(t) : `Criar “${t}”`),
      );
      criar.addEventListener("pointerdown", (ev) => ev.preventDefault());
      criar.addEventListener("click", () => void criarDoTermo());
      extras.append(criar);
    }
    const rodape = pop.querySelector<HTMLElement>(".spro-combo-rodape");
    if (rodape) {
      const faltam = visiveis.filter((o) => !escolhidos.includes(o.valor));
      const marcarFiltrados = h(
        "button",
        { type: "button", class: "spro-combo-acao", disabled: !t || !faltam.length },
        `Marcar os filtrados${t && faltam.length ? ` (${faltam.length})` : ""}`,
      );
      marcarFiltrados.addEventListener("click", () => {
        escolhidos = [...escolhidos, ...faltam.map((o) => o.valor)];
        avisar();
        desenharBotao();
        desenharLista();
      });
      const limpar = h("button", { type: "button", class: "spro-combo-acao spro-combo-limpar", disabled: !escolhidos.length }, "Limpar");
      limpar.addEventListener("click", () => {
        escolhidos = [];
        avisar();
        desenharBotao();
        desenharLista();
      });
      rodape.replaceChildren(
        h(
          "span",
          { class: "spro-combo-total" },
          escolhidos.length ? `${escolhidos.length} marcado${escolhidos.length > 1 ? "s" : ""}` : "",
        ),
        marcarFiltrados,
        limpar,
      );
    }
    marcarAtiva();
  }

  const posicionar = () => flut?.posicionar();

  function teclado(ev: KeyboardEvent): void {
    const n = visiveis.length;
    switch (ev.key) {
      case "ArrowDown":
        ativo = n ? (ativo + 1) % n : 0;
        marcarAtiva();
        break;
      case "ArrowUp":
        ativo = n ? (ativo - 1 + n) % n : 0;
        marcarAtiva();
        break;
      case "Home":
        if ((ev.target as HTMLElement)?.classList?.contains("spro-combo-busca") && termo) return;
        ativo = 0;
        marcarAtiva();
        break;
      case "End":
        if ((ev.target as HTMLElement)?.classList?.contains("spro-combo-busca") && termo) return;
        ativo = Math.max(0, n - 1);
        marcarAtiva();
        break;
      case "Enter": {
        const o = visiveis[ativo];
        if (o) escolher(o);
        else void criarDoTermo();
        break;
      }
      case "Escape":
        fechar(true);
        break;
      case "Tab":
        fechar(false);
        return;
      case "Backspace":
        if (!cfg.multiplo || termo || !escolhidos.length) return;
        escolhidos = escolhidos.slice(0, -1);
        avisar();
        desenharBotao();
        desenharLista();
        break;
      default:
        return;
    }
    ev.preventDefault();
    ev.stopPropagation();
  }

  function abrir(semente = ""): void {
    if (pop) return;
    termo = semente;
    const lerIndice = () => {
      const i = filtrarOpcoes(lerOpcoes(), termo).findIndex((o) => o.valor === escolhidos[escolhidos.length - 1]);
      return i < 0 ? 0 : i;
    };
    ativo = semente ? 0 : lerIndice();
    const busca = temBusca()
      ? h("input", {
          type: "text",
          class: "spro-combo-busca",
          placeholder: cfg.criar ? "Buscar ou criar…" : "Buscar…",
          "aria-label": `Filtrar ${cfg.rotulo.toLowerCase()}`,
          "aria-controls": `${id}-lista`,
          "aria-autocomplete": "list",
          autocomplete: "off",
          spellcheck: "false",
          value: semente,
        })
      : null;
    if (busca) {
      busca.value = semente;
      busca.addEventListener("input", () => {
        termo = busca.value;
        ativo = 0;
        desenharLista();
        posicionar();
      });
    }
    pop = h(
      "div",
      { class: `spro-combo-pop${cfg.multiplo ? " spro-combo-pop-multi" : ""}` },
      busca ? h("div", { class: "spro-combo-cabeca" }, icone("busca", 15), busca) : null,
      h("ul", {
        role: "listbox",
        id: `${id}-lista`,
        class: "spro-combo-lista",
        tabindex: busca ? undefined : "-1",
        "aria-label": cfg.rotulo,
        "aria-multiselectable": cfg.multiplo ? "true" : undefined,
      }),
      h("div", { class: "spro-combo-extras" }),
      cfg.multiplo ? h("div", { class: "spro-combo-rodape" }) : null,
    );
    pop.addEventListener("keydown", teclado);
    flut = abrirFlutuante(botao, pop, {
      larguraMinima: cfg.larguraLista ?? 220,
      alturaMaxima: 360,
      aoFechar: () => fechar(false),
    });
    botao.setAttribute("aria-expanded", "true");
    botao.setAttribute("aria-controls", `${id}-lista`);
    botao.classList.add("spro-combo-aberto");
    desenharLista();
    posicionar();
    const foco = busca ?? pop.querySelector<HTMLElement>('[role="listbox"]');
    foco?.focus?.({ preventScroll: true });
    if (busca && semente) busca.setSelectionRange?.(semente.length, semente.length);
  }

  function fechar(devolverFoco = false): void {
    if (!pop) return;
    flut?.fechar();
    flut = null;
    pop = null;
    termo = "";
    botao.setAttribute("aria-expanded", "false");
    botao.removeAttribute("aria-controls");
    botao.classList.remove("spro-combo-aberto");
    if (devolverFoco) botao.focus?.({ preventScroll: true });
  }

  botao.addEventListener("click", () => (pop ? fechar(true) : abrir()));
  botao.addEventListener("keydown", (ev) => {
    if (pop) return;
    // Enter e Espaço ficam com o clique nativo do botão (que abre).
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      abrir();
    } else if (ev.key.length === 1 && ev.key !== " " && !ev.ctrlKey && !ev.metaKey && !ev.altKey && temBusca()) {
      ev.preventDefault();
      abrir(ev.key);
    }
  });

  desenharBotao();
  return {
    el: botao,
    valor: () => [...escolhidos],
    definir(valores, avisarMudanca = false) {
      escolhidos = [...valores];
      desenharBotao();
      desenharLista();
      if (avisarMudanca) avisar();
    },
    atualizar() {
      desenharBotao();
      desenharLista();
    },
    abrir,
    fechar: () => fechar(false),
  };
}
