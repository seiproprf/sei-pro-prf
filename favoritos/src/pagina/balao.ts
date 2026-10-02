/**
 * Cadastro rápido ao favoritar (sugestões #651 e #656): pasta, etiquetas, nota
 * e a escolha da lista, sem bloquear a tela. Cada mudança grava na hora.
 * Shadow DOM: o CSS do SEI (e o do legado) não alcança o balão.
 */

import type { DataISO } from "@comum/datas/dias";
import { type Combo, criarCombo } from "@comum/ui/combobox";
import { h, icone } from "@comum/ui/dom";
import { MAX_NOTA } from "../modelo/constantes";
import type { Etiqueta, Favorito, MudancasFavorito, Pasta, TipoLista } from "../modelo/tipos";
import { comboLembrete } from "./lembreteRapido";

export interface DepsBalao {
  favorito: Favorito;
  lista: TipoLista;
  /** Sigla da unidade; null quando só existe a Pessoal. */
  siglaUnidade: string | null;
  pastas: Pasta[];
  etiquetas: Etiqueta[];
  temaEscuro: boolean;
  /** Para o lembrete rápido; ausente, o balão não oferece lembrete. */
  hoje?: DataISO;
  editar(m: MudancasFavorito): Promise<Favorito>;
  criarPasta(nome: string): Promise<Pasta>;
  criarEtiqueta(nome: string): Promise<Etiqueta>;
  /** Quem chama fecha este balão e abre outro, já na outra lista. */
  moverPara(lista: TipoLista): Promise<void>;
  fechar(): void;
}

const ESTILO_BALAO = `:host{all:initial}
.fav-balao{box-sizing:border-box;width:340px;display:grid;gap:10px;padding:14px;font:13px/1.4 var(--spro-fonte);color:var(--spro-texto);background:var(--spro-fundo);border:1px solid var(--spro-borda);border-radius:var(--spro-raio-xg);box-shadow:var(--spro-sombra-3);animation:spro-surgir 160ms var(--spro-curva)}
.fav-balao-topo{display:flex;align-items:center;gap:10px}
.fav-balao-estrela{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:var(--spro-raio);color:var(--spro-estrela);background:color-mix(in srgb,var(--spro-estrela) 16%,transparent)}
.fav-balao-titulo{flex:1;min-width:0;display:grid;line-height:1.25}
.fav-balao-titulo strong{font-size:14px}
.fav-balao-titulo span{font-size:11.5px;color:var(--spro-suave);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fav-campo{display:grid;gap:5px}
.fav-rotulo{font-size:11.5px;font-weight:600;color:var(--spro-suave);letter-spacing:.01em}
.fav-campo .spro-combo{width:100%}
.fav-campo .spro-combo-ativo{color:var(--spro-texto);background:var(--spro-fundo);border-color:var(--spro-borda-forte)}
.fav-chips-sel{display:flex;flex-wrap:wrap;gap:5px}
.fav-chips-sel:empty{display:none}
.fav-chips-sel .spro-chip .spro-icone{opacity:.6}
.fav-balao-rodape{display:flex;justify-content:flex-end;padding-top:2px}
textarea.spro-campo{resize:vertical;width:100%}`;

export function montarBalao(d: DepsBalao): HTMLElement {
  let fav = d.favorito;
  let etiquetas = [...d.etiquetas];
  const salvar = async (m: MudancasFavorito) => {
    fav = await d.editar(m);
  };

  const escolherLista = (rotulo: string, lista: TipoLista) =>
    h(
      "button",
      {
        type: "button",
        "aria-pressed": String(d.lista === lista),
        title: lista === "pessoal" ? "Mover para a sua lista Pessoal" : `Mover para a lista da ${rotulo}`,
        onclick: () => {
          if (d.lista !== lista) void d.moverPara(lista);
        },
      },
      rotulo,
    );
  const listas = d.siglaUnidade
    ? h(
        "div",
        { class: "spro-segmentado fav-balao-listas", role: "group", "aria-label": "Lista" },
        escolherLista(d.siglaUnidade, "unidade"),
        escolherLista("Pessoal", "pessoal"),
      )
    : null;

  let pastas = [...d.pastas];
  const pasta: Combo = criarCombo({
    rotulo: "Pasta",
    icone: "pasta",
    vazio: "(sem pasta)",
    busca: true,
    opcoes: () => [{ valor: "", rotulo: "(sem pasta)" }, ...pastas.map((p) => ({ valor: p.id, rotulo: p.nome, cor: p.cor }))],
    valor: fav.pasta ? [fav.pasta] : [],
    criar: async (nome) => {
      const p = await d.criarPasta(nome.slice(0, 60));
      pastas = [...pastas.filter((x) => x.id !== p.id), p];
      return { valor: p.id, rotulo: p.nome, cor: p.cor };
    },
    rotuloCriar: (t) => `Criar a pasta “${t}”`,
    aoMudar: (v) => void salvar({ pasta: v[0] || undefined }),
    larguraLista: 260,
  });

  const chips = h("div", { class: "fav-chips-sel" });
  const etiqueta: Combo = criarCombo({
    rotulo: "Etiquetas",
    icone: "etiqueta",
    vazio: "Nenhuma",
    multiplo: true,
    opcoes: () => etiquetas.map((e) => ({ valor: e.id, rotulo: e.nome, cor: e.cor })),
    valor: fav.etiquetas,
    criar: async (nome) => {
      const e = await d.criarEtiqueta(nome.slice(0, 40));
      etiquetas = [...etiquetas.filter((x) => x.id !== e.id), e];
      return { valor: e.id, rotulo: e.nome, cor: e.cor };
    },
    rotuloCriar: (t) => `Criar a etiqueta “${t}”`,
    aoMudar: (v) => {
      desenharChips();
      void salvar({ etiquetas: v });
    },
    larguraLista: 260,
  });
  const desenharChips = () =>
    chips.replaceChildren(
      ...etiqueta.valor().map((id) => {
        const e = etiquetas.find((x) => x.id === id);
        return h(
          "button",
          {
            type: "button",
            class: "spro-chip",
            style: `--cor:${e?.cor ?? "#ccc"}`,
            title: "Tirar esta etiqueta",
            "aria-label": `Tirar a etiqueta ${e?.nome ?? ""}`,
            onclick: () =>
              etiqueta.definir(
                etiqueta.valor().filter((x) => x !== id),
                true,
              ),
          },
          e?.nome ?? "",
          icone("fechar", 11),
        );
      }),
    );
  desenharChips();

  const nota = h("textarea", {
    class: "spro-campo",
    rows: "2",
    maxlength: String(MAX_NOTA),
    placeholder: "Nota pessoal",
    "aria-label": "Nota",
    value: fav.nota ?? "",
  });
  nota.addEventListener("change", () => void salvar({ nota: nota.value }));

  return h(
    "div",
    { class: "fav-balao", role: "dialog", "aria-label": `Favorito ${fav.protocolo}` },
    h(
      "div",
      { class: "fav-balao-topo" },
      h("span", { class: "fav-balao-estrela" }, icone("estrelaCheia", 16)),
      h("span", { class: "fav-balao-titulo" }, h("strong", {}, "Favoritado"), h("span", {}, fav.protocolo)),
      listas,
      h(
        "button",
        { type: "button", class: "spro-botao-icone pequeno", "aria-label": "Fechar", onclick: () => d.fechar() },
        icone("fechar", 14),
      ),
    ),
    h("div", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "Pasta"), pasta.el),
    h("div", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "Etiquetas"), etiqueta.el, chips),
    h("label", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "Nota"), nota),
    d.hoje
      ? h(
          "div",
          { class: "fav-campo" },
          h("span", { class: "fav-rotulo" }, "Lembrete"),
          comboLembrete(d.hoje, fav.lembrete, (l) => void salvar({ lembrete: l })),
        )
      : null,
    h(
      "div",
      { class: "fav-balao-rodape" },
      h("button", { type: "button", class: "spro-botao primario", onclick: () => d.fechar() }, icone("check", 14), "Pronto"),
    ),
  );
}

let aberto: (() => void) | null = null;

/**
 * `cssBase` é o texto de `sei-comum/src/ui/base.css`. Ele chega como parâmetro
 * porque só o `pagina/main.ts` importa `.css` (loader "text" do esbuild): assim
 * os testes, que rodam o código-fonte no tsx, nunca tropeçam num import de CSS.
 */
export function abrirBalao(ancora: HTMLElement, d: Omit<DepsBalao, "fechar">, cssBase: string): () => void {
  aberto?.();
  const doc = ancora.ownerDocument;
  const v = doc.defaultView;
  const host = doc.createElement("div");
  // Explícito nos dois sentidos: sem data-tema, o balão seguiria o sistema, e não o SEI.
  host.setAttribute("data-tema", d.temaEscuro ? "escuro" : "claro");
  const raiz: ParentNode = host.attachShadow({ mode: "open" });
  const estilo = doc.createElement("style");
  estilo.textContent = `${cssBase}\n${ESTILO_BALAO}`;
  const fora = (ev: Event) => {
    if (!ev.composedPath().includes(host)) fechar();
  };
  const tecla = (ev: KeyboardEvent) => {
    // Esc com uma lista aberta fecha só a lista (o seletor cuida disso).
    if (ev.key === "Escape" && !(raiz as ShadowRoot).querySelector(".spro-combo-pop")) fechar();
  };
  function fechar() {
    host.remove();
    doc.removeEventListener("pointerdown", fora, true);
    doc.removeEventListener("keydown", tecla, true);
    if (aberto === fechar) aberto = null;
  }
  const caixa = montarBalao({ ...d, fechar });
  raiz.append(estilo, caixa);
  const r = ancora.getBoundingClientRect();
  const esquerda = Math.max(8, Math.min(r.left, (v?.innerWidth ?? 1024) - 340)) + (v?.scrollX ?? 0);
  host.style.cssText = `position:absolute;z-index:2147483000;left:${Math.round(esquerda)}px;top:${Math.round(r.bottom + (v?.scrollY ?? 0) + 4)}px`;
  doc.body.append(host);
  doc.addEventListener("pointerdown", fora, true);
  doc.addEventListener("keydown", tecla, true);
  caixa.querySelector<HTMLElement>(".spro-combo")?.focus();
  aberto = fechar;
  return fechar;
}
