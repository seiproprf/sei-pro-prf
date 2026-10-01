import type { DataISO } from "@comum/datas/dias";
import { h } from "@comum/ui/dom";
import { MAX_NOTA } from "../../modelo/constantes";
import { calcularPrazo } from "../../modelo/prazo";
import type { Etiqueta, Favorito, MudancasFavorito, Pasta } from "../../modelo/tipos";
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

  // Prazo: só é regravado se o usuário mexer nele. Assim o prazo "a partir do
  // documento X" ou "do próximo documento" que veio do legado não se perde ao
  // editar só a nota.
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
  const grupoRef = campo("A partir de", referencia);
  const grupoVenc = campo("Vence em", vencimento);
  const grupoDias = h("div", { class: "linha" }, n, sentido);
  const grupoContagem = campo("Contar em", contagem);
  const previa = h("p", { class: "fav-previa", "aria-live": "polite" });
  const ler = (): ValoresPrazo => ({
    modo: (modo.value ?? "nenhum") as ModoPrazo,
    referencia: referencia.value,
    vencimento: vencimento.value,
    n: Number(n.value),
    contagem: (contagem.value ?? "corridos") as ValoresPrazo["contagem"],
    sentido: (sentido.value ?? "depois") as ValoresPrazo["sentido"],
  });
  const atualizar = () => {
    const m = ler().modo;
    grupoRef.hidden = m === "nenhum";
    grupoVenc.hidden = m !== "data";
    grupoDias.hidden = m !== "dias";
    grupoContagem.hidden = m !== "dias" && m !== "contagem";
    const p = prazoDosValores(ler());
    previa.textContent = p
      ? `${calcularPrazo(p, d.hoje).texto}. ${calcularPrazo(p, d.hoje).dica}`
      : m === "nenhum"
        ? "Sem prazo."
        : "Preencha as datas.";
  };
  for (const el of [modo, referencia, vencimento, n, contagem, sentido]) {
    el.addEventListener("change", () => {
      prazoAlterado = true;
      atualizar();
    });
  }
  atualizar();
  const avisoLegado =
    f.prazo && f.prazo.referencia.de !== "data"
      ? h(
          "p",
          { class: "fav-previa" },
          "Este prazo foi configurado na versão anterior a partir de um documento. Ele é mantido enquanto você não mexer no prazo.",
        )
      : null;

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
      avisoLegado,
      modo,
      grupoRef,
      grupoVenc,
      grupoDias,
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
