import { h } from "@comum/ui/dom";
import type { TipoLista } from "../../modelo/tipos";

export interface DepsMigracao {
  quantidade: number;
  amostra: string[];
  siglaUnidade: string | null;
  trazer(destino: TipoLista): Promise<void>;
  adiar(): Promise<void>;
}

export function montarMigracao(d: DepsMigracao): HTMLElement {
  return h(
    "div",
    { class: "fav-form" },
    h(
      "p",
      {},
      `Encontramos ${d.quantidade} favoritos da versão anterior do SEI Pro neste navegador (por exemplo: ${d.amostra.join(", ")}).`,
    ),
    h(
      "p",
      { class: "fav-previa" },
      "Na versão nova, cada unidade tem a sua lista e há uma lista Pessoal, que aparece em todas. Os dados antigos continuam guardados: nada é apagado.",
    ),
    h(
      "div",
      { class: "spro-dialogo-rodape" },
      h("button", { type: "button", class: "spro-botao", onclick: () => void d.adiar() }, "Agora não"),
      h("button", { type: "button", class: "spro-botao", onclick: () => void d.trazer("pessoal") }, "Trazer para Pessoal"),
      d.siglaUnidade
        ? h(
            "button",
            { type: "button", class: "spro-botao primario", onclick: () => void d.trazer("unidade") },
            `Trazer para ${d.siglaUnidade}`,
          )
        : null,
    ),
  );
}
