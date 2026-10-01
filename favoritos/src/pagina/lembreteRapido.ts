/** Lembrete rápido (balão ao favoritar e Enviar Processo): sem, amanhã, 1 semana, 1 mês. */

import { type DataISO, somarDias } from "@comum/datas/dias";
import { h } from "@comum/ui/dom";
import type { Lembrete } from "../modelo/tipos";

export function seletorLembrete(
  hoje: DataISO,
  atual: Lembrete | undefined,
  mudar: (l: Lembrete | undefined) => void,
  classe = "spro-campo",
): HTMLSelectElement {
  const opcoes: Array<[string, string]> = [
    ["", atual ? `Lembrete em ${atual.em.split("-").reverse().join("/")}` : "Sem lembrete"],
    ["1", "Lembrar amanhã"],
    ["7", "Lembrar em 1 semana"],
    ["30", "Lembrar em 1 mês"],
    ...(atual ? [["0", "Tirar o lembrete"] as [string, string]] : []),
  ];
  const s: HTMLSelectElement = h(
    "select",
    { class: classe, "aria-label": "Lembrete" },
    ...opcoes.map(([v, t]) => h("option", { value: v }, t)),
  );
  s.addEventListener("change", () => {
    const v = s.value;
    if (v === "") return;
    mudar(v === "0" ? undefined : { ...atual, em: somarDias(hoje, Number(v)) });
  });
  return s;
}
