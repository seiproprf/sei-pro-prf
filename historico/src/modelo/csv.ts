import { dataHora } from "./dias";
import type { Nivel, Visita } from "./tipos";

export const NOME_NIVEL: Record<Nivel, string> = { publico: "Público", restrito: "Restrito", sigiloso: "Sigiloso" };

export function linhasCsv(visitas: Visita[]): string[][] {
  return [
    [
      "Processo",
      "Tipo",
      "Especificação",
      "Interessados",
      "Assuntos",
      "Nível de acesso",
      "Última visita",
      "Primeira visita",
      "Visitas",
      "Unidades",
    ],
    ...visitas.map((v) => [
      v.protocolo,
      v.tipo ?? "",
      v.especificacao ?? "",
      (v.interessados ?? []).join(", "),
      (v.assuntos ?? []).join(", "),
      v.nivel ? NOME_NIVEL[v.nivel] : "",
      dataHora(v.ultima),
      dataHora(v.primeira),
      String(v.vezes),
      v.unidades.map((u) => u.sigla).join(", "),
    ]),
  ];
}
