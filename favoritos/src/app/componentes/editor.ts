import { type DataISO, formatarData } from "@comum/datas/dias";
import { h } from "@comum/ui/dom";
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

const campo = (rotulo: string, ...filhos: Array<Node | null>) => h("label", {}, rotulo, ...filhos);

export function montarEditor(d: DepsEditor): HTMLElement {
  const f = d.favorito;
  const titulo = h("input", {
    class: "spro-campo",
    value: f.titulo ?? "",
    maxlength: "200",
    "aria-label": "Título",
    placeholder: [f.tipo, f.especificacao].filter(Boolean).join(" · ") || "Como você quer chamar este processo",
  });

  const pasta: HTMLSelectElement = h(
    "select",
    { class: "spro-campo", "aria-label": "Pasta" },
    h("option", { value: "", selected: !f.pasta }, "(sem pasta)"),
    ...d.pastas.map((p) => h("option", { value: p.id, selected: p.id === f.pasta }, p.nome)),
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
      },
    },
    "Criar pasta",
  );

  const marcadas = new Set(f.etiquetas);
  let etiquetas = [...d.etiquetas];
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
            "aria-pressed": String(marcadas.has(e.id)),
            onclick: () => {
              if (marcadas.has(e.id)) marcadas.delete(e.id);
              else marcadas.add(e.id);
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
        marcadas.add(e.id);
        novaEtiqueta.value = "";
        desenharChips();
      },
    },
    "Adicionar etiqueta",
  );

  const nota = h("textarea", { class: "spro-campo", rows: "4", maxlength: String(MAX_NOTA), "aria-label": "Nota", value: f.nota ?? "" });

  // Prazo: só é regravado se o usuário mexer nele (editar só a nota não reescreve o prazo).
  const v = valoresDoPrazo(f.prazo, d.hoje);
  let prazoAlterado = false;
  const opcoes = (valor: string, lista: Array<[string, string]>) =>
    lista.map(([val, t]) => h("option", { value: val, selected: val === valor }, t));
  const modo: HTMLSelectElement = h(
    "select",
    { class: "spro-campo", "aria-label": "Prazo" },
    ...opcoes(v.modo, [
      ["nenhum", "Sem prazo"],
      ["data", "Até uma data"],
      ["dias", "N dias a partir de uma data"],
      ["contagem", "Só contar os dias desde uma data"],
      ["proximo", "N dias a partir do próximo documento de um tipo"],
    ]),
  );
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
  const contagem: HTMLSelectElement = h(
    "select",
    { class: "spro-campo", "aria-label": "Contagem" },
    ...opcoes(v.contagem, [
      ["corridos", "dias corridos"],
      ["uteis", "dias úteis"],
    ]),
  );
  const sentido: HTMLSelectElement = h(
    "select",
    { class: "spro-campo", "aria-label": "Sentido" },
    ...opcoes(v.sentido, [
      ["depois", "depois"],
      ["antes", "antes"],
    ]),
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
                class: "spro-botao",
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
      const sel: HTMLSelectElement = h(
        "select",
        { class: "spro-campo", "aria-label": "Documento" },
        h("option", { value: "" }, "Escolha o documento"),
        ...docs.map((x) => h("option", { value: x.id }, `${x.nome} (SEI nº ${x.numero}) — assinado em ${formatarData(x.data)}`)),
      );
      sel.addEventListener("change", () => {
        const x = docs.find((y) => y.id === sel.value);
        if (!x) return;
        documento = { id: x.id, rotulo: `${x.nome} (SEI nº ${x.numero})` };
        referencia.value = x.data;
        prazoAlterado = true;
        areaDocs.replaceChildren();
        pintarDoc();
        atualizar();
      });
      areaDocs.replaceChildren(sel);
    } catch (e) {
      const codigo = (e as { codigo?: string }).codigo;
      // O aviso do efeito colateral é do app, e não da mensagem que veio da aba.
      const texto =
        codigo === "PRECISA_BUSCAR"
          ? "Para listar os documentos, o SEI Pro precisa abrir a árvore deste processo. Se ele estiver aberto na sua unidade, o SEI vai registrá-lo como visualizado, como se você o abrisse."
          : e instanceof Error
            ? e.message
            : String(e);
      areaDocs.replaceChildren(h("p", { class: "fav-dica" }, texto));
      if (codigo === "PRECISA_BUSCAR") {
        areaDocs.append(h("button", { type: "button", class: "spro-botao", onclick: () => void escolherDocumento(true) }, "Buscar no SEI"));
      }
    }
  };
  const botaoDoc = d.listarDocumentos
    ? h("button", { type: "button", class: "spro-botao", onclick: () => void escolherDocumento(false) }, "Usar a data de um documento…")
    : null;
  const grupoRef = h("div", {}, h("div", { class: "linha" }, campo("A partir de", referencia), botaoDoc), docInfo, areaDocs);
  const grupoVenc = campo("Vence em", vencimento);
  const grupoDias = h("div", { class: "linha" }, n, sentido);
  const grupoContagem = campo("Contar em", contagem);
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
    modo: (modo.value ?? "nenhum") as ModoPrazo,
    referencia: referencia.value,
    vencimento: vencimento.value,
    n: Number(n.value),
    contagem: (contagem.value ?? "corridos") as ValoresPrazo["contagem"],
    sentido: (sentido.value ?? "depois") as ValoresPrazo["sentido"],
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
    previa.textContent = p
      ? `${calcularPrazo(p, d.hoje).texto}. ${calcularPrazo(p, d.hoje).dica}`
      : m === "nenhum"
        ? "Sem prazo."
        : "Preencha as datas.";
  };
  for (const el of [modo, referencia, vencimento, n, contagem, sentido, tiposDoc]) {
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
    { class: "fav-form" },
    campo("Título", titulo),
    h("div", { class: "linha" }, campo("Pasta", pasta), novaPasta, criarPasta),
    h("div", {}, h("span", { class: "fav-rotulo" }, "Etiquetas"), chips, h("div", { class: "linha" }, novaEtiqueta, criarEtiqueta)),
    campo("Nota pessoal", nota),
    h(
      "fieldset",
      { class: "fav-prazo-campos" },
      h("legend", {}, "Prazo"),
      modo,
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
              pasta: pasta.value || undefined,
              etiquetas: [...marcadas],
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
