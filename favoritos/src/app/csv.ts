/** CSV da lista de favoritos; o gerador genérico vive em `@comum/csv`. */

import { gerarCsv } from "@comum/csv";
import { formatarData } from "@comum/datas/dias";
import type { Etiqueta, Favorito, Pasta, ResumoPrazo } from "../modelo/tipos";

export { gerarCsv };

export interface ApoioCsv {
  pastas: ReadonlyMap<string, Pasta>;
  etiquetas: ReadonlyMap<string, Etiqueta>;
  resumo: (f: Favorito) => ResumoPrazo | undefined;
  lista: string;
}

export function linhasCsv(itens: Favorito[], a: ApoioCsv): string[][] {
  const cabecalho = ["Processo", "Título", "Tipo", "Especificação", "Pasta", "Etiquetas", "Prazo", "Vencimento", "Nota", "Lista"];
  return [
    cabecalho,
    ...itens.map((f) => {
      const r = a.resumo(f);
      return [
        f.protocolo,
        f.titulo ?? "",
        f.tipo ?? "",
        f.especificacao ?? "",
        (f.pasta && a.pastas.get(f.pasta)?.nome) || "",
        f.etiquetas
          .map((id) => a.etiquetas.get(id))
          .filter((e): e is Etiqueta => !!e && e.removidoEm === undefined)
          .map((e) => e.nome)
          .join(", "),
        r?.texto ?? "",
        r?.vencimento ? formatarData(r.vencimento) : "",
        f.nota ?? "",
        a.lista,
      ];
    }),
  ];
}
