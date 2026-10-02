import { gerarCsv } from "@comum/csv";
import { linhasCsv } from "../src/modelo/csv";
import { agrupar, casaBusca, contar, filtrar, ordenar } from "../src/modelo/operacoes";
import type { Visita } from "../src/modelo/tipos";
import { checar, secao } from "./util";

const agora = new Date(2026, 9, 2, 15).getTime();
const dia = (d: number, m = 9) => new Date(2026, m, d, 10).getTime();
const base = (id: string, x: Partial<Visita>): Visita => ({
  id,
  protocolo: "",
  unidades: [],
  primeira: dia(1),
  ultima: dia(1),
  vezes: 1,
  ...x,
});
const V = [
  base("1", {
    protocolo: "50300.018905/2018-67",
    tipo: "Licitação",
    especificacao: "Pregão eletrônico 12/2024",
    interessados: ["ACME Ltda"],
    assuntos: ["Compras"],
    nivel: "publico",
    unidades: [{ id: "u1", sigla: "GPF" }],
    ultima: dia(2),
    vezes: 3,
  }),
  base("2", {
    protocolo: "50300.000111/2024-01",
    tipo: "Ofício",
    especificacao: "Resposta à CGU",
    nivel: "restrito",
    unidades: [
      { id: "u2", sigla: "SEAD" },
      { id: "u1", sigla: "GPF" },
    ],
    ultima: dia(1),
  }),
  base("3", {
    protocolo: "50300.000222/2023-99",
    tipo: "Licitação",
    nivel: "sigiloso",
    unidades: [{ id: "u1", sigla: "GPF" }],
    ultima: dia(20, 8),
  }),
  base("4", { protocolo: "50300.000333/2025-10", tipo: "Processo Seletivo", interessados: ["Maria"], ultima: dia(1, 7) }),
];
const ap = { agora, favoritos: new Set(["2"]) };

export function verificarOperacoes(): void {
  secao("historico: busca");
  checar("numero formatado", casaBusca(V[0]!, "50300.018905/2018-67"));
  checar("so os digitos", casaBusca(V[0]!, "50300018905201867"));
  checar("pedaco do numero", casaBusca(V[0]!, "018905/2018"));
  checar("sem acento e sem caixa", casaBusca(V[0]!, "PREGAO eletronico"));
  checar("interessado", casaBusca(V[0]!, "acme"));
  checar("sigla da unidade", casaBusca(V[1]!, "sead"));
  checar("todas as palavras", !casaBusca(V[0]!, "pregao cgu"));
  checar("texto com ano nao casa so pelo numero", !casaBusca(V[3]!, "licitação 2025"));
  checar("numerica tambem acha na especificacao", casaBusca(V[0]!, "12/2024"));
  checar("numerica acha pelos digitos do protocolo", casaBusca(V[3]!, "2025"));
  checar("numerica que nao esta em lugar nenhum nao casa", !casaBusca(V[3]!, "99/9999"));
  checar("busca vazia casa tudo", casaBusca(V[3]!, "  "));

  secao("historico: filtros (OU no campo, E entre campos)");
  const ids = (l: Visita[]) => l.map((v) => v.id).join();
  checar("tipo", ids(filtrar(V, { tipos: ["Licitação"] }, ap)) === "1,3");
  checar("tipo OU tipo", ids(filtrar(V, { tipos: ["Licitação", "Ofício"] }, ap)) === "1,2,3");
  checar("tipo E unidade", ids(filtrar(V, { tipos: ["Licitação"], unidades: ["SEAD"] }, ap)) === "");
  checar("unidade casa qualquer das unidades", ids(filtrar(V, { unidades: ["GPF"] }, ap)) === "1,2,3");
  checar("hoje", ids(filtrar(V, { periodos: ["hoje"] }, ap)) === "1");
  checar("ultimos 7 dias inclui hoje e ontem", ids(filtrar(V, { periodos: ["7dias"] }, ap)) === "1,2");
  checar("mais antigos", ids(filtrar(V, { periodos: ["antigos"] }, ap)) === "4");
  checar("nos favoritos", ids(filtrar(V, { situacoes: ["favoritos"] }, ap)) === "2");
  checar("fora dos favoritos", ids(filtrar(V, { situacoes: ["foraFavoritos"] }, ap)) === "1,3,4");
  checar(
    "sem favoritos ativos, foraFavoritos nao casa nenhum",
    filtrar(V, { situacoes: ["foraFavoritos"] }, { agora, favoritos: null }).length === 0,
  );
  checar("visitados mais de uma vez", ids(filtrar(V, { situacoes: ["repetidos"] }, ap)) === "1");
  checar("sigilosos", ids(filtrar(V, { situacoes: ["sigiloso"] }, ap)) === "3");
  checar("interessado", ids(filtrar(V, { interessados: ["Maria"] }, ap)) === "4");

  secao("historico: ordem, contagens e grupos");
  checar("recentes", ids(ordenar(V, "recentes")) === "1,2,3,4");
  checar("mais visitados", ordenar(V, "visitados")[0]?.id === "1");
  checar("por numero", ids(ordenar(V, "protocolo")) === "2,3,4,1");
  const c = contar(V, ap);
  checar("contagem por tipo", c.tipos.get("Licitação") === 2);
  checar("contagem por unidade conta o processo uma vez", c.unidades.get("GPF") === 3);
  checar("contagem de periodo cumulativa", c.periodos.get("7dias") === 2 && c.periodos.get("hoje") === 1);
  checar("contagem de situacao", c.situacoes.get("favoritos") === 1 && c.situacoes.get("foraFavoritos") === 3);
  const g = agrupar(ordenar(V, "recentes"), agora);
  checar("grupos disjuntos na ordem", g.map((x) => `${x.grupo}:${x.itens.length}`).join() === "hoje:1,ontem:1,30dias:1,antigos:1");

  secao("historico: CSV");
  const csv = gerarCsv(linhasCsv([V[0]!]));
  checar(
    "cabecalho e linha",
    csv.includes("Processo;Tipo;Especificação;Interessados;Assuntos;Nível de acesso;Última visita;Primeira visita;Visitas;Unidades"),
  );
  checar(
    "dados",
    csv.includes(
      "50300.018905/2018-67;Licitação;Pregão eletrônico 12/2024;ACME Ltda;Compras;Público;02/10/2026 10:00;01/10/2026 10:00;3;GPF",
    ),
  );
}
