import { type DataISO, formatarData } from "@comum/datas/dias";
import { type Combo, criarCombo } from "@comum/ui/combobox";
import { h, icone, type NomeIcone } from "@comum/ui/dom";
import { MAX_NOTA } from "../../modelo/constantes";
import { calcularPrazo } from "../../modelo/prazo";
import type { Etiqueta, Favorito, MudancasFavorito, Pasta } from "../../modelo/tipos";
import type { DocumentoAssinado } from "../../pagina/documentos";
import { type ModoPrazo, prazoDosValores, type ValoresPrazo, valoresDoPrazo } from "../prazoForm";

export interface DepsEditor {
  favorito: Favorito;
  pastas: Pasta[];
  etiquetas: Etiqueta[];
  hoje: DataISO;
  salvar(m: MudancasFavorito): Promise<void>;
  criarPasta(nome: string): Promise<Pasta>;
  criarEtiqueta(nome: string): Promise<Etiqueta>;
  fechar(): void;
  /**
   * Documentos assinados do processo, para contar o prazo a partir de um deles.
   * `buscar` = o usuário aceitou abrir a árvore (ver pagina/documentos.ts).
   * Ausente quando não há aba do SEI para perguntar.
   */
  listarDocumentos?: (buscar: boolean) => Promise<DocumentoAssinado[]>;
}

const campo = (rotulo: string, ...filhos: Array<Node | null>) =>
  h("label", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, rotulo), ...filhos);

const MODOS: ReadonlyArray<{ valor: ModoPrazo; rotulo: string; descricao: string; icone: NomeIcone }> = [
  { valor: "nenhum", rotulo: "Sem prazo", descricao: "Só acompanhar, sem contar dias", icone: "fechar" },
  { valor: "data", rotulo: "Até uma data", descricao: "Vence num dia certo", icone: "calendario" },
  { valor: "dias", rotulo: "N dias a partir de uma data", descricao: "Ex.: 15 dias úteis depois da intimação", icone: "relogio" },
  { valor: "contagem", rotulo: "Contar os dias desde uma data", descricao: "Mostra há quantos dias, sem vencimento", icone: "historico" },
  {
    valor: "proximo",
    rotulo: "N dias a partir do próximo documento",
    descricao: "A contagem começa quando chegar um documento do tipo escolhido",
    icone: "documento",
  },
];

/** Dois ou três botões que valem como um rádio (corridos/úteis, depois/antes). */
function segmentado<T extends string>(rotulo: string, opcoes: ReadonlyArray<[T, string]>, inicial: T, mudar: (v: T) => void) {
  let atual = inicial;
  const pintar = () => {
    for (const [i, b] of botoes.entries()) {
      const marcado = opcoes[i]?.[0] === atual;
      b.setAttribute("aria-checked", String(marcado));
      // Um só no Tab; as setas andam entre eles (padrão ARIA de radiogroup).
      b.setAttribute("tabindex", marcado ? "0" : "-1");
    }
  };
  const escolher = (v: T) => {
    if (v === atual) return;
    atual = v;
    pintar();
    mudar(v);
  };
  const botoes = opcoes.map(([v, texto]) => h("button", { type: "button", role: "radio", onclick: () => escolher(v) }, texto));
  const grupo = h("div", { class: "spro-segmentado", role: "radiogroup", "aria-label": rotulo }, ...botoes);
  grupo.addEventListener("keydown", (ev) => {
    const passo = ev.key === "ArrowRight" || ev.key === "ArrowDown" ? 1 : ev.key === "ArrowLeft" || ev.key === "ArrowUp" ? -1 : 0;
    if (!passo) return;
    ev.preventDefault();
    const i = opcoes.findIndex(([v]) => v === atual);
    const proximo = (i + passo + opcoes.length) % opcoes.length;
    escolher(opcoes[proximo]![0]);
    botoes[proximo]?.focus();
  });
  pintar();
  return { el: grupo, valor: () => atual };
}

export function montarEditor(d: DepsEditor): HTMLElement {
  const f = d.favorito;
  const titulo = h("input", {
    class: "spro-campo",
    value: f.titulo ?? "",
    maxlength: "200",
    "aria-label": "Título",
    placeholder: [f.tipo, f.especificacao].filter(Boolean).join(" · ") || "Como você quer chamar este processo",
  });

  let pastas = [...d.pastas];
  const pasta: Combo = criarCombo({
    rotulo: "Pasta",
    icone: "pasta",
    vazio: "(sem pasta)",
    opcoes: () => [{ valor: "", rotulo: "(sem pasta)" }, ...pastas.map((p) => ({ valor: p.id, rotulo: p.nome, cor: p.cor }))],
    valor: f.pasta ? [f.pasta] : [],
    busca: true,
    criar: async (nome) => {
      const p = await d.criarPasta(nome.slice(0, 60));
      pastas = [...pastas.filter((x) => x.id !== p.id), p];
      return { valor: p.id, rotulo: p.nome, cor: p.cor };
    },
    rotuloCriar: (t) => `Criar a pasta “${t}”`,
    larguraLista: 260,
  });

  let etiquetas = [...d.etiquetas];
  const chips = h("div", { class: "fav-chips-sel" });
  const etiqueta: Combo = criarCombo({
    rotulo: "Etiquetas",
    icone: "etiqueta",
    vazio: "Nenhuma",
    multiplo: true,
    opcoes: () => etiquetas.map((e) => ({ valor: e.id, rotulo: e.nome, cor: e.cor })),
    valor: f.etiquetas.filter((id) => d.etiquetas.some((e) => e.id === id)),
    criar: async (nome) => {
      const e = await d.criarEtiqueta(nome.slice(0, 40));
      etiquetas = [...etiquetas.filter((x) => x.id !== e.id), e];
      return { valor: e.id, rotulo: e.nome, cor: e.cor };
    },
    rotuloCriar: (t) => `Criar a etiqueta “${t}”`,
    aoMudar: () => desenharChips(),
    larguraLista: 260,
  });
  // As escolhidas ficam à vista, como fichas na cor da etiqueta; clicar tira.
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
            onclick: () => {
              etiqueta.definir(etiqueta.valor().filter((x) => x !== id));
              desenharChips();
            },
          },
          e?.nome ?? "",
          icone("fechar", 11),
        );
      }),
    );
  desenharChips();

  const nota = h("textarea", { class: "spro-campo", rows: "4", maxlength: String(MAX_NOTA), "aria-label": "Nota", value: f.nota ?? "" });

  // Prazo: só é regravado se o usuário mexer nele (editar só a nota não reescreve o prazo).
  const v = valoresDoPrazo(f.prazo, d.hoje);
  let prazoAlterado = false;
  let modoAtual: ModoPrazo = v.modo;
  const mexeu = () => {
    prazoAlterado = true;
    atualizar();
  };
  const modo: Combo = criarCombo({
    rotulo: "Prazo",
    icone: "relogio",
    busca: false,
    opcoes: MODOS.map((m) => ({ valor: m.valor, rotulo: m.rotulo, descricao: m.descricao, icone: m.icone })),
    valor: [v.modo],
    aoMudar: (x) => {
      modoAtual = (x[0] ?? "nenhum") as ModoPrazo;
      mexeu();
    },
    larguraLista: 320,
    classe: "fav-modo-prazo",
  });
  const referencia = h("input", { type: "date", class: "spro-campo", "aria-label": "A partir de", value: v.referencia });
  const vencimento = h("input", { type: "date", class: "spro-campo", "aria-label": "Vence em", value: v.vencimento });
  const n = h("input", {
    type: "number",
    min: "1",
    max: "3650",
    class: "spro-campo",
    "aria-label": "Quantidade de dias",
    value: String(v.n),
  });
  const contagem = segmentado<ValoresPrazo["contagem"]>(
    "Contagem",
    [
      ["corridos", "dias corridos"],
      ["uteis", "dias úteis"],
    ],
    v.contagem,
    mexeu,
  );
  const sentido = segmentado<ValoresPrazo["sentido"]>(
    "Sentido",
    [
      ["depois", "depois"],
      ["antes", "antes"],
    ],
    v.sentido,
    mexeu,
  );
  // Prazo a partir da assinatura de um documento do processo (paridade com o legado).
  let documento = v.documento;
  const docInfo = h("p", { class: "fav-dica" });
  const areaDocs = h("div", { class: "fav-docs" });
  const pintarDoc = () => {
    docInfo.hidden = !documento;
    docInfo.replaceChildren(
      ...(documento
        ? [
            `Conta a partir da assinatura de ${documento.rotulo ?? "um documento do processo"}, em ${formatarData(referencia.value as DataISO)}. `,
            h(
              "button",
              {
                type: "button",
                class: "spro-botao pequeno",
                onclick: () => {
                  documento = undefined;
                  prazoAlterado = true;
                  pintarDoc();
                  atualizar();
                },
              },
              "Usar uma data",
            ),
          ]
        : []),
    );
  };
  const escolherDocumento = async (buscar: boolean) => {
    if (!d.listarDocumentos) return;
    areaDocs.replaceChildren(h("p", { class: "fav-dica" }, "Lendo os documentos do processo…"));
    try {
      const docs = await d.listarDocumentos(buscar);
      if (!docs.length) {
        areaDocs.replaceChildren(h("p", { class: "fav-dica" }, "Nenhum documento assinado neste processo."));
        return;
      }
      const sel = criarCombo({
        rotulo: "Documento",
        icone: "documento",
        vazio: "Escolha o documento",
        opcoes: docs.map((x) => ({
          valor: x.id,
          rotulo: x.nome,
          descricao: `SEI nº ${x.numero} · assinado em ${formatarData(x.data)}`,
        })),
        larguraLista: 340,
        aoMudar: (escolha) => {
          const x = docs.find((y) => y.id === escolha[0]);
          if (!x) return;
          documento = { id: x.id, rotulo: `${x.nome} (SEI nº ${x.numero})` };
          referencia.value = x.data;
          prazoAlterado = true;
          areaDocs.replaceChildren();
          pintarDoc();
          atualizar();
        },
      });
      areaDocs.replaceChildren(sel.el);
    } catch (e) {
      const codigo = (e as { codigo?: string }).codigo;
      // O aviso do efeito colateral é do app, e não da mensagem que veio da aba.
      const texto =
        codigo === "PRECISA_BUSCAR"
          ? "Para listar os documentos, o SEI Pro precisa abrir a árvore deste processo. Se ele estiver aberto na sua unidade, o SEI pode registrar o andamento “Processo recebido” em seu nome, ou marcá-lo como visualizado, como se você o abrisse."
          : e instanceof Error
            ? e.message
            : String(e);
      areaDocs.replaceChildren(h("p", { class: "fav-dica" }, texto));
      if (codigo === "PRECISA_BUSCAR") {
        areaDocs.append(
          h(
            "button",
            { type: "button", class: "spro-botao pequeno", onclick: () => void escolherDocumento(true) },
            icone("busca", 14),
            "Buscar no SEI",
          ),
        );
      }
    }
  };
  const botaoDoc = d.listarDocumentos
    ? h(
        "button",
        { type: "button", class: "spro-botao pequeno fantasma", onclick: () => void escolherDocumento(false) },
        icone("documento", 14),
        "Usar a data de um documento…",
      )
    : null;
  const grupoRef = h("div", {}, h("div", { class: "linha" }, campo("A partir de", referencia), botaoDoc), docInfo, areaDocs);
  const grupoVenc = campo("Vence em", vencimento);
  const grupoDias = h(
    "div",
    { class: "linha" },
    campo("Dias", n),
    h("div", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "Sentido"), sentido.el),
  );
  const grupoContagem = h("div", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "Contar em"), contagem.el);
  const tiposDoc = h("input", {
    class: "spro-campo",
    "aria-label": "Tipos de documento",
    placeholder: "Ex.: Despacho, Nota Técnica",
    value: v.tipos ?? "",
  });
  const grupoTipos = h(
    "div",
    {},
    campo("Tipos de documento (separe por vírgula)", tiposDoc),
    h(
      "p",
      { class: "fav-dica" },
      "A contagem começa no primeiro documento de um desses tipos com data a partir da data acima. O SEI Pro confere quando você abre o processo.",
    ),
  );
  const previa = h("p", { class: "fav-previa", "aria-live": "polite" });
  const ler = (): ValoresPrazo => ({
    modo: modoAtual,
    referencia: referencia.value,
    vencimento: vencimento.value,
    n: Number(n.value),
    contagem: contagem.valor(),
    sentido: sentido.valor(),
    documento,
    tipos: tiposDoc.value,
  });
  const atualizar = () => {
    const m = ler().modo;
    grupoRef.hidden = m === "nenhum";
    grupoVenc.hidden = m !== "data";
    grupoDias.hidden = m !== "dias" && m !== "proximo";
    grupoContagem.hidden = m !== "dias" && m !== "contagem" && m !== "proximo";
    grupoTipos.hidden = m !== "proximo";
    const p = prazoDosValores(ler());
    const r = p ? calcularPrazo(p, d.hoje) : undefined;
    previa.dataset.situacao = r?.situacao ?? "";
    previa.replaceChildren(
      icone("relogio", 14),
      h("span", {}, r ? `${r.texto}. ${r.dica}` : m === "nenhum" ? "Sem prazo." : "Preencha as datas."),
    );
    previa.hidden = m === "nenhum";
  };
  for (const el of [referencia, vencimento, n, tiposDoc]) {
    el.addEventListener("change", () => {
      prazoAlterado = true;
      // Data digitada à mão: deixa de ser a do documento.
      if (el === referencia && documento) {
        documento = undefined;
        pintarDoc();
      }
      atualizar();
    });
  }
  atualizar();
  pintarDoc();
  return h(
    "div",
    { class: "fav-form fav-editor" },
    campo("Título", titulo),
    h(
      "div",
      { class: "fav-grade2" },
      h("div", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "Pasta"), pasta.el),
      h("div", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "Etiquetas"), etiqueta.el),
    ),
    chips,
    campo("Nota pessoal", nota),
    h(
      "section",
      { class: "fav-cartao fav-prazo-campos", "aria-label": "Prazo" },
      h("h3", { class: "fav-cartao-titulo" }, icone("relogio", 15), "Prazo"),
      modo.el,
      grupoRef,
      grupoVenc,
      grupoDias,
      grupoTipos,
      grupoContagem,
      previa,
    ),
    h(
      "div",
      { class: "spro-dialogo-rodape" },
      h("button", { type: "button", class: "spro-botao", onclick: () => d.fechar() }, "Cancelar"),
      h(
        "button",
        {
          type: "button",
          class: "spro-botao primario",
          onclick: async () => {
            const m: MudancasFavorito = {
              titulo: titulo.value,
              pasta: pasta.valor()[0] || undefined,
              etiquetas: [
                ...etiqueta.valor(),
                // Etiquetas que o editor não lista (removidas em outro lugar) continuam como estavam.
                ...f.etiquetas.filter((id) => !d.etiquetas.some((e) => e.id === id) && !etiquetas.some((e) => e.id === id)),
              ],
              nota: nota.value,
            };
            if (prazoAlterado) m.prazo = prazoDosValores(ler());
            await d.salvar(m);
            d.fechar();
          },
        },
        "Salvar",
      ),
    ),
  );
}
