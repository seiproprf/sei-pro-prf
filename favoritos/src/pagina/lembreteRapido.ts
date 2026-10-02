/** Lembrete rápido (balão ao favoritar e Enviar Processo): sem, amanhã, 1 semana, 1 mês. */

import { type DataISO, formatarData, somarDias } from "@comum/datas/dias";
import { type Combo, criarCombo } from "@comum/ui/combobox";
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

/** O mesmo lembrete rápido como seletor inteligente (balão ao favoritar, no Shadow DOM). */
export function comboLembrete(hoje: DataISO, atual: Lembrete | undefined, mudar: (l: Lembrete | undefined) => void): HTMLElement {
  let corrente = atual;
  const dia = (n: number) => formatarData(somarDias(hoje, n));
  const c: Combo = criarCombo({
    rotulo: "Lembrete",
    icone: "sino",
    vazio: "Sem lembrete",
    busca: false,
    larguraLista: 240,
    opcoes: () => [
      ...(corrente ? [{ valor: "atual", rotulo: `Lembrete em ${formatarData(corrente.em)}`, icone: "sino" as const }] : []),
      { valor: "1", rotulo: "Amanhã", descricao: dia(1), icone: "calendario" },
      { valor: "7", rotulo: "Em 1 semana", descricao: dia(7), icone: "calendario" },
      { valor: "30", rotulo: "Em 1 mês", descricao: dia(30), icone: "calendario" },
      ...(corrente ? [{ valor: "0", rotulo: "Tirar o lembrete", icone: "fechar" as const }] : []),
    ],
    valor: corrente ? ["atual"] : [],
    aoMudar: (v) => {
      const escolha = v[0];
      if (!escolha || escolha === "atual") return;
      corrente = escolha === "0" ? undefined : { ...corrente, em: somarDias(hoje, Number(escolha)) };
      c.definir(corrente ? ["atual"] : []);
      mudar(corrente);
    },
  });
  return c.el;
}
