/**
 * "Onde mostrar os favoritos" e "Perguntar ao favoritar": o mesmo controle na
 * página de opções da extensão e no menu do próprio app. Grava em
 * `favoritos/preferencias` (chrome.storage.sync) e acompanha mudanças feitas
 * no outro lugar.
 */

import type { Area } from "@comum/armazenamento/area";
import { h } from "@comum/ui/dom";
import { CHAVE_PREFERENCIAS } from "../modelo/constantes";
import { ROTULOS_EXIBIR } from "../modelo/exibicao";
import type { Preferencias } from "../modelo/tipos";
import { gravarPreferencias, lerPreferencias } from "../preferencias";

export async function montarOpcoesExibicao(d: { sync: Area; lateralDisponivel: boolean }): Promise<HTMLElement> {
  const nome = `spro-fav-exibir-${Math.random().toString(36).slice(2, 8)}`;
  const valores: Array<Preferencias["exibir"]> = d.lateralDisponivel ? ["abaixo", "lateral", "ambos"] : ["abaixo"];
  const radios = valores.map((v) => {
    const r = h("input", { type: "radio", name: nome, value: v });
    r.addEventListener("change", () => {
      if (r.checked) void gravarPreferencias(d.sync, { exibir: v });
    });
    return r;
  });
  const perguntar = h("input", { type: "checkbox" });
  perguntar.addEventListener("change", () => void gravarPreferencias(d.sync, { perguntarAoFavoritar: perguntar.checked }));
  const pintar = (p: Preferencias) => {
    const alvo = d.lateralDisponivel ? p.exibir : "abaixo";
    for (const r of radios) r.checked = r.value === alvo;
    perguntar.checked = p.perguntarAoFavoritar;
  };
  pintar(await lerPreferencias(d.sync));
  d.sync.aoMudar((m) => {
    if (CHAVE_PREFERENCIAS in m) void lerPreferencias(d.sync).then(pintar);
  });
  return h(
    "div",
    { class: "spro-fav-opcoes" },
    h(
      "fieldset",
      {},
      h("legend", {}, "Onde mostrar os favoritos"),
      ...radios.map((r) => h("label", {}, r, ` ${ROTULOS_EXIBIR[r.value as Preferencias["exibir"]]}`)),
      d.lateralDisponivel
        ? null
        : h("p", { class: "spro-fav-opcoes-nota" }, "Esta instalação não tem o painel lateral: a lista fica abaixo dos processos."),
    ),
    h("label", {}, perguntar, " Perguntar pasta e etiquetas ao favoritar"),
  );
}
