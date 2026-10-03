import { converterLegado } from "../src/migracao/legado";
import { checar, secao } from "./util";

const item = (id: string, data: string, x: Record<string, unknown> = {}) => ({
  datetime: data,
  data_geracao: "01/02/2024",
  id_procedimento: id,
  tipo_processo: "Licitação",
  protocolo: `50300.0000${id}/2024-00`,
  nivel_acesso: "0",
  assuntos: ["Compras", "Pregão"],
  observacoes: "anotacao interna",
  descricao: "Pregão 12",
  ...x,
});

export function verificarMigracao(): void {
  secao("historico: migracao do legado");
  const lista = [item("11", "2024-03-05 14:07:09")];
  const a = converterLegado(JSON.stringify(lista));
  const b = converterLegado(lista);
  checar("string JSON e array dao o mesmo resultado", JSON.stringify(a) === JSON.stringify(b) && a.visitas.length === 1);
  const v = a.visitas[0];
  const t = new Date(2024, 2, 5, 14, 7, 9).getTime();
  checar("datetime vira primeira e ultima", v?.primeira === t && v.ultima === t);
  checar("vezes 1, sem unidades, origem legado", v?.vezes === 1 && v.unidades.length === 0 && v.origem === "legado");
  checar(
    "campos copiados",
    v?.id === "11" && v.protocolo === "50300.000011/2024-00" && v.tipo === "Licitação" && v.especificacao === "Pregão 12",
  );
  checar("assuntos copiados", v?.assuntos?.join() === "Compras,Pregão" && v.nivel === "publico");
  checar("observacoes nao aparece em lugar nenhum", !JSON.stringify(a).includes("anotacao interna"));
  checar("total e ignorados", a.total === 1 && a.ignorados === 0);

  secao("historico: migracao, cota (listas e textos curtos)");
  const grande = converterLegado([
    item("17", "2024-03-05 14:07:09", {
      descricao: "d".repeat(700),
      assuntos: [...Array.from({ length: 14 }, (_, i) => `Assunto ${i + 1}`), "x".repeat(200)],
    }),
  ]).visitas[0];
  checar("assuntos: no maximo 10", grande?.assuntos?.length === 10 && grande.assuntos[9] === "Assunto 10", grande?.assuntos);
  checar("descricao (especificacao) corta em 500", grande?.especificacao?.length === 500, grande?.especificacao?.length);
  const assuntoLongo = converterLegado([item("18", "2024-03-05 14:07:09", { assuntos: ["y".repeat(200)] })]).visitas[0];
  checar("assunto longo corta em 120", assuntoLongo?.assuntos?.[0]?.length === 120, assuntoLongo?.assuntos?.[0]?.length);

  secao("historico: migracao, nivel de acesso");
  const sig = converterLegado([item("12", "2024-03-05 14:07:09", { nivel_acesso: "2" })]).visitas[0];
  checar(
    "nivel 2 vira sigiloso sem especificacao nem assuntos",
    sig?.nivel === "sigiloso" && !sig.especificacao && !sig.assuntos && !sig.interessados,
  );
  checar("sigiloso mantem numero e tipo", sig?.protocolo === "50300.000012/2024-00" && sig.tipo === "Licitação");
  checar(
    "nivel 1 vira restrito",
    converterLegado([item("13", "2024-03-05 14:07", { nivel_acesso: "1" })]).visitas[0]?.nivel === "restrito",
  );
  checar(
    "nivel numerico 0 vira publico",
    converterLegado([item("14", "2024-03-05 14:07:09", { nivel_acesso: 0 })]).visitas[0]?.nivel === "publico",
  );
  checar(
    "nivel ausente fica sem nivel",
    converterLegado([item("15", "2024-03-05 14:07:09", { nivel_acesso: undefined })]).visitas[0]?.nivel === undefined,
  );
  checar(
    "sigiloso numerico (2) tambem",
    converterLegado([item("16", "2024-03-05 14:07:09", { nivel_acesso: 2 })]).visitas[0]?.nivel === "sigiloso",
  );

  secao("historico: migracao, itens com defeito");
  const ruins = converterLegado([
    item("", "2024-03-05 14:07:09"),
    item("abc", "2024-03-05 14:07:09"),
    item("21", "2024-03-05 14:07:09", { protocolo: "" }),
    item("22", "data ruim"),
    item("23", "2024-03-05 14:07:09"),
    null,
    "texto",
  ]);
  checar("conta os ignorados e mantem o bom", ruins.ignorados === 6 && ruins.visitas.length === 1 && ruins.visitas[0]?.id === "23");
  const foraFaixa = converterLegado([item("24", "2024-13-45 99:99"), item("25", "2024-02-31 10:00:00"), item("26", "2024-03-05 24:00:00")]);
  checar("data fora da faixa e ignorada, sem rolar", foraFaixa.ignorados === 3 && foraFaixa.visitas.length === 0);
  checar("total e o numero de itens do array", ruins.total === 7);
  checar(
    "sem id_procedimento ignora",
    converterLegado([{ ...item("1", "2024-03-05 14:07:09"), id_procedimento: undefined }]).ignorados === 1,
  );

  secao("historico: migracao, repetidos e entradas invalidas");
  const dup = converterLegado([
    item("31", "2024-05-01 10:00:00"),
    item("31", "2024-03-01 09:00:00"),
    item("31", "2024-04-01 08:00:00", { descricao: "meio" }),
  ]);
  const d = dup.visitas[0];
  checar("mesmo id vira uma visita", dup.visitas.length === 1 && dup.total === 3);
  checar(
    "primeira a mais antiga e ultima a mais recente",
    d?.primeira === new Date(2024, 2, 1, 9).getTime() && d.ultima === new Date(2024, 4, 1, 10).getTime(),
  );
  checar("o resto vem do item mais recente", d?.especificacao === "Pregão 12");
  const sigTexto = { nivel_acesso: "2" };
  for (const ordem of [
    [0, 1],
    [1, 0],
  ]) {
    const itens = [item("33", "2024-01-01 10:00:00"), item("33", "2024-05-01 10:00:00", sigTexto)];
    const s = converterLegado(ordem.map((i) => itens[i])).visitas[0];
    checar(
      `duplicado com sigiloso mais recente nao guarda texto (ordem ${ordem})`,
      s?.nivel === "sigiloso" && !s.especificacao && !s.assuntos,
    );
  }
  const dupInv = converterLegado([
    item("32", "2024-03-01 09:00:00", { descricao: "antigo" }),
    item("32", "2024-05-01 10:00:00", { descricao: "novo" }),
  ]);
  checar("ordem da lista nao muda quem e o mais recente", dupInv.visitas[0]?.especificacao === "novo");
  const vazio = JSON.stringify({ visitas: [], ignorados: 0, total: 0 });
  for (const e of ["{}", null, "lixo", undefined, 5, "[]"]) {
    checar(`entrada invalida ${JSON.stringify(e)}`, JSON.stringify(converterLegado(e)) === vazio);
  }
}
