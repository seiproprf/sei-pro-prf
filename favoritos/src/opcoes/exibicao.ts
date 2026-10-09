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
  const valores = d.lateralDisponivel ? ["acima", "abaixo", "lateral"] : ["acima", "abaixo"];
  const caixas = valores.map((v) => {
    const r = h("input", { type: "checkbox", value: v });
    r.addEventListener("change", () => {
      if (r.checked && v !== "lateral") {
        for (const outra of caixas) if (outra.value !== "lateral" && outra !== r) outra.checked = false;
      }
      const marcada = (valor: string) => caixas.some((c) => c.value === valor && c.checked);
      const lateral = marcada("lateral");
      const exibir: Preferencias["exibir"] = marcada("acima")
        ? lateral
          ? "acimaLateral"
          : "acima"
        : marcada("abaixo")
          ? lateral
            ? "ambos"
            : "abaixo"
          : lateral
            ? "lateral"
            : "nenhum";
      void gravarPreferencias(d.sync, { exibir });
    });
    return r;
  });
  const perguntar = h("input", { type: "checkbox", "data-perguntar": "" });
  perguntar.addEventListener("change", () => void gravarPreferencias(d.sync, { perguntarAoFavoritar: perguntar.checked }));
  const pintar = (p: Preferencias) => {
    const acima = p.exibir === "acima" || p.exibir === "acimaLateral";
    const abaixo = p.exibir === "abaixo" || p.exibir === "ambos" || (!d.lateralDisponivel && p.exibir === "lateral");
    const lateral = p.exibir === "lateral" || p.exibir === "ambos" || p.exibir === "acimaLateral";
    for (const c of caixas) c.checked = c.value === "acima" ? acima : c.value === "abaixo" ? abaixo : lateral;
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
      ...caixas.map((r) => h("label", {}, r, ` ${ROTULOS_EXIBIR[r.value as Preferencias["exibir"]]}`)),
      h("p", { class: "spro-fav-opcoes-nota" }, "Escolha no máximo uma posição na página. O painel lateral é independente."),
      d.lateralDisponivel
        ? null
        : h(
            "p",
            { class: "spro-fav-opcoes-nota" },
            "Esta instalação não tem o painel lateral: escolha acima ou abaixo da lista de processos.",
          ),
    ),
    h("label", {}, perguntar, " Perguntar pasta e etiquetas ao favoritar"),
  );
}
