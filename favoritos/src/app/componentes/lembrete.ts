/** Diálogo "Lembrete" (spec 7.4): atalhos de data, data livre, texto; adiar e concluir. */

import { type DataISO, somarDias } from "@comum/datas/dias";
import { h } from "@comum/ui/dom";
import { adiarLembrete, lembreteVencido } from "../../modelo/lembrete";
import type { Lembrete } from "../../modelo/tipos";

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
  const atalho = (rotulo: string, f: () => void) => h("button", { type: "button", class: "spro-botao", onclick: f }, rotulo);
  const vencido = !!d.lembrete && lembreteVencido({ lembrete: d.lembrete }, d.hoje);
  return h(
    "div",
    { class: "fav-form" },
    h("label", {}, "Texto", texto),
    h("div", { class: "linha" }, atalho("Amanhã", em(1)), atalho("Em 1 semana", em(7)), atalho("Em 1 mês", em(30))),
    h("div", { class: "linha" }, h("label", {}, "Ou numa data", data)),
    vencido && d.lembrete
      ? h(
          "div",
          { class: "linha" },
          atalho("Adiar 1 dia", () => void gravar(adiarLembrete({ ...d.lembrete!, texto: texto.value.trim() || undefined }, d.hoje, 1))),
          atalho("Adiar 1 semana", () => void gravar(adiarLembrete({ ...d.lembrete!, texto: texto.value.trim() || undefined }, d.hoje, 7))),
        )
      : null,
    h(
      "div",
      { class: "spro-dialogo-rodape" },
      d.lembrete ? h("button", { type: "button", class: "spro-botao", onclick: () => void gravar(undefined) }, "Concluir") : null,
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
