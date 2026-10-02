/** Diálogo "Lembrete" (spec 7.4): atalhos de data, data livre, texto; adiar e concluir. */

import { type DataISO, formatarData, somarDias } from "@comum/datas/dias";
import { h, icone } from "@comum/ui/dom";
import { adiarLembrete, lembreteVencido } from "../../modelo/lembrete";
import type { Lembrete } from "../../modelo/tipos";

/** "sex., 03/10" — o dia do atalho, para o usuário saber onde cai. */
function diaCurto(iso: DataISO): string {
  try {
    return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
  } catch {
    return formatarData(iso);
  }
}

export function montarLembrete(d: {
  lembrete?: Lembrete;
  hoje: DataISO;
  salvar(l: Lembrete | undefined): Promise<void>;
  fechar(): void;
}): HTMLElement {
  const texto = h("input", {
    class: "spro-campo",
    maxlength: "200",
    placeholder: "O que lembrar (opcional)",
    "aria-label": "Texto do lembrete",
    value: d.lembrete?.texto ?? "",
  });
  const data = h("input", {
    type: "date",
    class: "spro-campo",
    "aria-label": "Data do lembrete",
    value: d.lembrete?.em ?? somarDias(d.hoje, 1),
  });
  const gravar = async (l: Lembrete | undefined) => {
    await d.salvar(l);
    d.fechar();
  };
  const em = (dias: number) => () => void gravar({ em: somarDias(d.hoje, dias), texto: texto.value.trim() || undefined });
  const atalho = (rotulo: string, dias: number) => {
    const dia = somarDias(d.hoje, dias);
    return h(
      "button",
      { type: "button", class: "fav-atalho-data", "aria-label": rotulo, title: formatarData(dia), onclick: em(dias) },
      h("strong", {}, rotulo),
      h("span", {}, diaCurto(dia)),
    );
  };
  const adiar = (rotulo: string, dias: number) =>
    h(
      "button",
      {
        type: "button",
        class: "spro-botao pequeno",
        onclick: () => void gravar(adiarLembrete({ ...d.lembrete!, texto: texto.value.trim() || undefined }, d.hoje, dias)),
      },
      icone("relogio", 13),
      rotulo,
    );
  const vencido = !!d.lembrete && lembreteVencido({ lembrete: d.lembrete }, d.hoje);
  return h(
    "div",
    { class: "fav-form fav-lembrete-form" },
    vencido && d.lembrete
      ? h(
          "div",
          { class: "fav-aviso-lembrete", role: "note" },
          icone("sino", 15),
          h(
            "span",
            {},
            d.lembrete.em === d.hoje ? "Este lembrete é para hoje." : `Este lembrete venceu em ${formatarData(d.lembrete.em)}.`,
          ),
          adiar("Adiar 1 dia", 1),
          adiar("Adiar 1 semana", 7),
        )
      : null,
    h("label", { class: "fav-campo" }, h("span", { class: "fav-rotulo" }, "O que lembrar"), texto),
    h(
      "div",
      { class: "fav-campo" },
      h("span", { class: "fav-rotulo" }, "Quando"),
      h("div", { class: "fav-atalhos" }, atalho("Amanhã", 1), atalho("Em 1 semana", 7), atalho("Em 1 mês", 30)),
    ),
    h("label", { class: "fav-campo fav-campo-data" }, h("span", { class: "fav-rotulo" }, "Ou escolha a data"), data),
    h(
      "div",
      { class: "spro-dialogo-rodape" },
      d.lembrete
        ? h(
            "button",
            { type: "button", class: "spro-botao fantasma spro-esquerda", onclick: () => void gravar(undefined) },
            icone("check", 14),
            "Concluir",
          )
        : null,
      h("button", { type: "button", class: "spro-botao", onclick: () => d.fechar() }, "Cancelar"),
      h(
        "button",
        {
          type: "button",
          class: "spro-botao primario",
          onclick: () => {
            if (/^\d{4}-\d{2}-\d{2}$/.test(data.value)) void gravar({ em: data.value as DataISO, texto: texto.value.trim() || undefined });
          },
        },
        "Salvar",
      ),
    ),
  );
}
