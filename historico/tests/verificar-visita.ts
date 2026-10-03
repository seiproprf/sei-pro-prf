import { aPodar, completar, mesclarMigrada, precisaCompletar, registrar, visitaValida } from "../src/modelo/visita";
import { checar, secao } from "./util";

const MIN = 60_000;
const GPF = { id: "110000001", sigla: "GPF" };
const SEAD = { id: "110000002", sigla: "SEAD" };
const D = { id: "123", protocolo: "50300.018905/2018-67", tipo: "Licitação", nivel: "publico" as const, unidade: GPF };

export function verificarVisita(): void {
  secao("historico: registrar visita");
  const v1 = registrar(undefined, D, 1_000 * MIN);
  checar("primeira visita", v1.vezes === 1 && v1.primeira === v1.ultima && v1.unidades[0]?.sigla === "GPF");
  const v2 = registrar(v1, D, 1_000 * MIN + 29 * MIN);
  checar("dentro de 30 min nao conta visita nova", v2.vezes === 1 && v2.ultima === 1_029 * MIN);
  const v3 = registrar(v2, { ...D, unidade: SEAD }, 1_029 * MIN + 31 * MIN);
  checar("depois de 30 min conta", v3.vezes === 2);
  checar("unidade mais recente primeiro, sem repetir", v3.unidades.map((u) => u.sigla).join() === "SEAD,GPF");
  const v4 = registrar(v3, { ...D, unidade: GPF }, 2_000 * MIN);
  checar("unidade repetida sobe para o inicio", v4.unidades.map((u) => u.sigla).join() === "GPF,SEAD");
  let muitas = v1;
  for (let i = 0; i < 15; i++) muitas = registrar(muitas, { ...D, unidade: { id: `u${i}`, sigla: `U${i}` } }, 3_000 * MIN + i);
  checar("guarda ate 10 unidades", muitas.unidades.length === 10 && muitas.unidades[0]?.sigla === "U14");
  checar(
    "visita antiga recebida depois nao recua ultima",
    registrar(v4, D, 10 * MIN).ultima === v4.ultima && registrar(v4, D, 10 * MIN).primeira === 10 * MIN,
  );
  const completa = completar(v4, { especificacao: "Pregão 12", interessados: ["ACME", "ACME", " "], assuntos: ["Compras"] }, 2_001 * MIN);
  checar(
    "completar grava texto e limpa lista",
    completa.especificacao === "Pregão 12" && completa.interessados?.join() === "ACME" && completa.completadoEm === 2_001 * MIN,
  );
  // Cota do storage.local (10 MB divididos com Favoritos e Agente, até 5.000 visitas): listas e textos curtos.
  const longa = completar(
    v4,
    {
      especificacao: "e".repeat(700),
      interessados: Array.from({ length: 15 }, (_, i) => `Interessado ${i + 1}`),
      assuntos: ["a".repeat(200), "Compras"],
    },
    2_001 * MIN,
  );
  checar(
    "lista com mais de 10: guarda as 10 primeiras",
    longa.interessados?.length === 10 && longa.interessados[9] === "Interessado 10",
    longa.interessados,
  );
  checar(
    "assunto com mais de 120 caracteres: corta em 120",
    longa.assuntos?.[0]?.length === 120 && longa.assuntos[1] === "Compras",
    longa.assuntos?.map((a) => a.length),
  );
  checar("especificacao com mais de 500: corta em 500", longa.especificacao?.length === 500, longa.especificacao?.length);
  checar(
    "interessado longo tambem corta em 120",
    completar(v4, { interessados: ["i".repeat(130)] }, 2_001 * MIN).interessados?.[0]?.length === 120,
  );
  const virou = registrar(completa, { ...D, nivel: "sigiloso" }, 2_002 * MIN);
  checar(
    "virou sigiloso: perde especificacao, interessados e assuntos",
    virou.nivel === "sigiloso" && !virou.especificacao && !virou.interessados && !virou.assuntos,
  );
  const sig = completar(v4, { especificacao: "segredo", nivel: "sigiloso" }, 2_003 * MIN);
  checar("completar sigiloso nao guarda texto", sig.nivel === "sigiloso" && !sig.especificacao);

  const viraSig = completar(completa, { nivel: "sigiloso" }, 2_004 * MIN);
  checar(
    "completar com nivel sigiloso apaga o texto ja guardado",
    viraSig.nivel === "sigiloso" && !viraSig.especificacao && !viraSig.interessados && !viraSig.assuntos,
  );

  secao("historico: quando completar");
  checar("sem completadoEm precisa", precisaCompletar(v4, 2_000 * MIN));
  checar("completado ha 1 h nao precisa", !precisaCompletar(completa, 2_061 * MIN));
  checar("completado ha 13 h precisa", precisaCompletar(completa, 2_001 * MIN + 13 * 60 * MIN));
  checar("sigiloso nunca precisa", !precisaCompletar(virou, 9_999_999 * MIN));
  checar("tentativa ha 1 min segura", !precisaCompletar({ ...v4, tentouEm: 1_999 * MIN }, 2_000 * MIN));
  checar("tentativa ha 3 min libera", precisaCompletar({ ...v4, tentouEm: 1_997 * MIN }, 2_000 * MIN));

  secao("historico: migrada e poda");
  const migrada = { ...registrar(undefined, D, 500 * MIN), especificacao: "Antiga", origem: "legado" as const };
  const m = mesclarMigrada(completa, migrada);
  checar(
    "mescla: primeira mais antiga, ultima mais recente, texto do novo",
    m.primeira === 500 * MIN && m.ultima === completa.ultima && m.especificacao === "Pregão 12" && m.origem === undefined,
  );
  const atualSig = { ...registrar(undefined, { ...D, nivel: "sigiloso" }, 600 * MIN) };
  const comTexto = { ...migrada, interessados: ["ACME"], assuntos: ["Compras"] };
  const ms = mesclarMigrada(atualSig, comTexto);
  checar(
    "mescla com atual sigiloso nao traz texto da migrada",
    ms.nivel === "sigiloso" && !ms.especificacao && !ms.interessados && !ms.assuntos,
  );
  checar("mescla sem atual devolve a migrada", mesclarMigrada(undefined, migrada) === migrada);
  const lista = [1, 5, 3, 4, 2].map((n) => ({ ...v1, id: String(n), ultima: n }));
  checar("poda tira as de ultima mais antiga", aPodar(lista, 3).sort().join() === "1,2");
  checar("abaixo do limite nao poda", aPodar(lista, 5).length === 0);
  checar("valida", visitaValida(v1) && !visitaValida({ id: 1 }) && !visitaValida(null));
}
