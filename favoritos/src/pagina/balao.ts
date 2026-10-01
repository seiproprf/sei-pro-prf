/**
 * Cadastro rápido ao favoritar (sugestões #651 e #656): pasta, etiquetas, nota
 * e a escolha da lista, sem bloquear a tela. Cada mudança grava na hora.
 * Shadow DOM: o CSS do SEI (e o do legado) não alcança o balão.
 */

import { h, icone } from "@comum/ui/dom";
import { MAX_NOTA } from "../modelo/constantes";
import type { Etiqueta, Favorito, MudancasFavorito, Pasta, TipoLista } from "../modelo/tipos";

export interface DepsBalao {
  favorito: Favorito;
  lista: TipoLista;
  /** Sigla da unidade; null quando só existe a Pessoal. */
  siglaUnidade: string | null;
  pastas: Pasta[];
  etiquetas: Etiqueta[];
  temaEscuro: boolean;
  editar(m: MudancasFavorito): Promise<Favorito>;
  criarPasta(nome: string): Promise<Pasta>;
  criarEtiqueta(nome: string): Promise<Etiqueta>;
  /** Quem chama fecha este balão e abre outro, já na outra lista. */
  moverPara(lista: TipoLista): Promise<void>;
  fechar(): void;
}

const ESTILO_BALAO = `:host{all:initial}
.fav-balao{box-sizing:border-box;width:320px;display:grid;gap:6px;padding:10px 12px;font:13px/1.4 var(--spro-fonte);color:var(--spro-texto);background:var(--spro-fundo);border:1px solid var(--spro-borda);border-radius:10px;box-shadow:0 8px 24px rgb(0 0 0 / 18%)}
.fav-balao label{font-size:12px;color:var(--spro-suave)}
.fav-balao-topo{display:flex;align-items:center;gap:6px;color:var(--spro-estrela)}
.fav-balao-topo strong{color:var(--spro-texto);flex:1}
.fav-balao-linha,.fav-balao-chips,.fav-balao-listas{display:flex;flex-wrap:wrap;gap:6px}
.fav-balao-linha .spro-campo{flex:1}
.fav-balao-rodape{display:flex;justify-content:flex-end}
textarea.spro-campo{resize:vertical}`;

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
        class: "spro-chip",
        "aria-pressed": String(d.lista === lista),
        onclick: () => {
          if (d.lista !== lista) void d.moverPara(lista);
        },
      },
      rotulo,
    );
  const listas = d.siglaUnidade
    ? h(
        "div",
        { class: "fav-balao-listas", role: "group", "aria-label": "Lista" },
        escolherLista(d.siglaUnidade, "unidade"),
        escolherLista("Pessoal", "pessoal"),
      )
    : null;

  const pasta = h(
    "select",
    { class: "spro-campo", "aria-label": "Pasta", onchange: () => void salvar({ pasta: pasta.value || undefined }) },
    h("option", { value: "", selected: !fav.pasta }, "(sem pasta)"),
    ...d.pastas.map((p) => h("option", { value: p.id, selected: p.id === fav.pasta }, p.nome)),
  );
  const novaPasta = h("input", { class: "spro-campo", placeholder: "Nova pasta", "aria-label": "Nova pasta", maxlength: "60" });
  const criarPasta = h(
    "button",
    {
      type: "button",
      class: "spro-botao",
      onclick: async () => {
        const nome = novaPasta.value.trim();
        if (!nome) return;
        const p = await d.criarPasta(nome);
        for (const o of pasta.querySelectorAll("option")) o.removeAttribute("selected");
        pasta.append(h("option", { value: p.id, selected: true }, p.nome));
        novaPasta.value = "";
        await salvar({ pasta: p.id });
      },
    },
    "Criar",
  );

  const chips = h("div", { class: "fav-balao-chips" });
  const desenharChips = () =>
    chips.replaceChildren(
      ...etiquetas.map((e) =>
        h(
          "button",
          {
            type: "button",
            class: "spro-chip",
            style: `--cor:${e.cor}`,
            "aria-pressed": String(fav.etiquetas.includes(e.id)),
            onclick: async () => {
              const marcada = fav.etiquetas.includes(e.id);
              await salvar({ etiquetas: marcada ? fav.etiquetas.filter((x) => x !== e.id) : [...fav.etiquetas, e.id] });
              desenharChips();
            },
          },
          e.nome,
        ),
      ),
    );
  desenharChips();
  const novaEtiqueta = h("input", { class: "spro-campo", placeholder: "Nova etiqueta", "aria-label": "Nova etiqueta", maxlength: "40" });
  const criarEtiqueta = h(
    "button",
    {
      type: "button",
      class: "spro-botao",
      onclick: async () => {
        const nome = novaEtiqueta.value.trim();
        if (!nome) return;
        const e = await d.criarEtiqueta(nome);
        etiquetas = [...etiquetas.filter((x) => x.id !== e.id), e];
        novaEtiqueta.value = "";
        await salvar({ etiquetas: [...new Set([...fav.etiquetas, e.id])] });
        desenharChips();
      },
    },
    "Adicionar",
  );

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
      icone("estrelaCheia", 16),
      h("strong", {}, "Favoritado"),
      listas,
      h("button", { type: "button", class: "spro-botao-icone", "aria-label": "Fechar", onclick: () => d.fechar() }, icone("fechar", 14)),
    ),
    h("label", {}, "Pasta"),
    h("div", { class: "fav-balao-linha" }, pasta),
    h("div", { class: "fav-balao-linha" }, novaPasta, criarPasta),
    h("label", {}, "Etiquetas"),
    chips,
    h("div", { class: "fav-balao-linha" }, novaEtiqueta, criarEtiqueta),
    h("label", {}, "Nota"),
    nota,
    h(
      "div",
      { class: "fav-balao-rodape" },
      h("button", { type: "button", class: "spro-botao primario", onclick: () => d.fechar() }, "Pronto"),
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
  if (d.temaEscuro) host.setAttribute("data-tema", "escuro");
  const raiz: ParentNode = host.attachShadow({ mode: "open" });
  const estilo = doc.createElement("style");
  estilo.textContent = `${cssBase}\n${ESTILO_BALAO}`;
  const fora = (ev: Event) => {
    if (!ev.composedPath().includes(host)) fechar();
  };
  const tecla = (ev: KeyboardEvent) => {
    if (ev.key === "Escape") fechar();
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
  caixa.querySelector("select")?.focus();
  aberto = fechar;
  return fechar;
}
