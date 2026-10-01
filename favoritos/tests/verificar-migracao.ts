import { lerLegadoLocal } from "../src/migracao/fontes";
import { converterConfigDate, converterLegado } from "../src/migracao/legado";
import { PALETA } from "../src/modelo/cores";
import { porOrdem } from "../src/modelo/operacoes";
import { checar, secao } from "./util";

const LEGADO = {
  favorites: [
    {
      id_procedimento: "150098",
      processo: "012.00000178/2025-23",
      tipo_procedimento: "Expediente",
      descricao: "Dilação de prazo",
      order: 2,
      categoria: "Contratos 'urgentes'",
      etiquetas: ["urgente"],
      andamento: [{ datahora: "2026-09-01 10:00:00" }],
    },
    { id_procedimento: 150099, processo: "012.00000179/2025-23", order: null, categoria: "", etiquetas: null, configdate: null },
    {
      id_procedimento: "150100",
      processo: "012.00000180/2025-23",
      order: 1,
      categoria: "contratos 'URGENTES'",
      configdate: { date: "2026-10-04", setdate: true, newdoc: true, newdoclist: [] },
    },
    {
      id_procedimento: "150098",
      processo: "012.00000178/2025-23",
      tipo_procedimento: "Expediente",
      descricao: "Versão repetida mais nova",
      order: 2,
      categoria: "Contratos 'urgentes'",
      etiquetas: ["urgente", "Fiscalização"],
      latlng: [-15.8, -47.86],
    },
    { processo: "sem id" },
    "lixo",
  ],
  config: {
    colortags: [
      { name: "fiscalizacao", value: "#bfd5e8", icon: "tag" },
      { name: "urgente", value: "nao-e-cor" },
    ],
  },
};

export function verificarMigracao(): void {
  secao("migracao: dados reais e malformados (Review Focus 2)");
  const r = converterLegado(LEGADO, { agora: 5000 });
  checar("conta e ignora o que nao tem id ou protocolo", r.total === 6 && r.ignorados === 2, { total: r.total, ignorados: r.ignorados });
  checar("deduplica pelo id (a ultima ocorrencia vence)", r.favoritos.length === 3);
  const f98 = r.favoritos.find((f) => f.id === "150098");
  checar(
    "id numerico vira texto",
    r.favoritos.some((f) => f.id === "150099"),
  );
  checar(
    "descricao vira especificacao e tipo e mantido",
    f98?.especificacao === "Versão repetida mais nova" && f98.tipo === "Expediente",
    f98,
  );
  checar("andamento e outros caches nao entram", f98 !== undefined && !("andamento" in f98));
  checar("mapa preservado", f98?.local?.lat === -15.8 && f98.local.lng === -47.86);
  const ordem = [...r.favoritos]
    .sort(porOrdem)
    .map((f) => f.id)
    .join();
  checar("ordem do legado; sem ordem vai para o fim", ordem === "150100,150098,150099", ordem);
  checar(
    "categoria com aspas e caixa diferente vira UMA pasta",
    r.pastas.length === 1 && r.favoritos.filter((f) => f.pasta === r.pastas[0]?.id).length === 2,
  );
  const fisc = r.etiquetas.find((e) => e.nome === "Fiscalização");
  const urg = r.etiquetas.find((e) => e.nome === "urgente");
  checar("cor da etiqueta vem do colortags pelo nome normalizado", fisc?.cor === "#bfd5e8" && fisc.icone === "tag", fisc);
  checar("cor invalida no legado cai na paleta", !!urg && PALETA.includes(urg.cor), urg);
  checar("etiquetas nulas viram lista vazia", r.favoritos.find((f) => f.id === "150099")?.etiquetas.length === 0);
  checar(
    "versao mais velha possivel",
    r.favoritos.every((f) => f.atualizadoEm === 1 && f.dispositivo === "legado" && f.criadoEm === 5000),
  );
  const r2 = converterLegado(LEGADO, { agora: 9999 });
  checar(
    "ids de pasta e etiqueta estaveis entre computadores",
    r2.pastas[0]?.id === r.pastas[0]?.id && r2.etiquetas.map((e) => e.id).join() === r.etiquetas.map((e) => e.id).join(),
  );
  checar(
    "o EM BREVE de fabrica vira prazo pela data",
    JSON.stringify(r.favoritos.find((f) => f.id === "150100")?.prazo) ===
      JSON.stringify({ referencia: { de: "data", data: "2026-10-04" }, exibicao: "ate" }),
  );
  checar("aceita texto com BOM", converterLegado(`﻿${JSON.stringify(LEGADO)}`, { agora: 1 }).favoritos.length === 3);
  checar("JSON invalido nao quebra", converterLegado("{quebrado", { agora: 1 }).favoritos.length === 0);
  checar("nulo nao quebra", converterLegado(null, { agora: 1 }).total === 0);

  secao("migracao: configdate -> prazo");
  const base = {
    date: "2026-09-01 10:00:00",
    dateDue: "2026-09-06",
    countdown: true,
    countdays: false,
    workday: false,
    duenumber: 5,
    duecounter: "util",
    duemode: "depois",
  };
  checar(
    "N dias uteis",
    JSON.stringify(converterConfigDate({ ...base, setdate: true, duedate: true })) ===
      JSON.stringify({
        referencia: { de: "data", data: "2026-09-01" },
        vencimento: { em: "dias", n: 5, contagem: "uteis" },
        exibicao: "ate",
      }),
    converterConfigDate({ ...base, setdate: true, duedate: true }),
  );
  checar(
    "vencimento em data fixa",
    JSON.stringify(converterConfigDate({ ...base, duesetdate: true })?.vencimento) === JSON.stringify({ em: "data", data: "2026-09-06" }),
  );
  checar(
    "a partir de documento",
    JSON.stringify(converterConfigDate({ ...base, selectdoc: true, listdocs: 160223 })?.referencia) ===
      JSON.stringify({ de: "documento", idDocumento: "160223", data: "2026-09-01" }),
  );
  checar(
    "a partir de novo documento",
    converterConfigDate({ ...base, newdoc: true, newdoclist: ["Ofício"] })?.referencia.de === "novoDocumento",
  );
  checar(
    "antes com numero positivo vira negativo",
    (converterConfigDate({ ...base, duedate: true, duemode: "antes", duenumber: 3 })?.vencimento as { n: number } | undefined)?.n === -3,
  );
  checar("contagem em dias uteis desde", converterConfigDate({ ...base, countdays: true, workday: true })?.exibicao === "desdeUteis");
  checar("data invalida nao vira prazo", converterConfigDate({ date: "ontem" }) === undefined && converterConfigDate(null) === undefined);

  secao("migracao: leitura do localStorage antigo");
  const loja = (v: string | null) => ({ getItem: (k: string) => (k === "configDataFavoritesPro" ? v : null) });
  checar("le e analisa", (lerLegadoLocal(loja(JSON.stringify(LEGADO))) as typeof LEGADO).favorites.length === 6);
  checar("ausente ou quebrado devolve null", lerLegadoLocal(loja(null)) === null && lerLegadoLocal(loja("{x")) === null);
}
