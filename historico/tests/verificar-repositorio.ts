import { areaMemoria } from "@comum/armazenamento/area";
import { CHAVE_PREFERENCIAS, chaveMeta, prefixoVisitas } from "../src/modelo/constantes";
import { PREFERENCIAS_PADRAO } from "../src/modelo/tipos";
import { gravarPreferencias, lerPreferencias } from "../src/preferencias";
import { corteDoPeriodo, RepositorioHistorico } from "../src/repositorio";
import { checar, secao } from "./util";

const ESCOPO = "sei.x.gov.br|ana";
const OUTRO = "sei.x.gov.br|bia";
const MIN = 60_000;
const agora = new Date(2026, 9, 2, 15).getTime();
const dados = (id: string, unidade = "GPF") => ({
  id,
  protocolo: `50300.0000${id}/2024-00`,
  unidade: { id: `u-${unidade}`, sigla: unidade },
});

export async function verificarRepositorio(): Promise<void> {
  secao("historico: repositorio");
  const area = areaMemoria();
  const repo = new RepositorioHistorico(area, ESCOPO);
  await repo.registrarVisita(dados("1"), agora - 120 * MIN);
  await repo.registrarVisita(dados("1"), agora - 100 * MIN);
  checar("o mesmo processo duas vezes e um item so", (await repo.listar()).length === 1);
  checar("contar pelas chaves", (await repo.contar()) === 1);
  checar("obter devolve a visita", (await repo.obter("1"))?.protocolo === "50300.00001/2024-00");
  checar("obter de id inexistente e undefined", (await repo.obter("zzz")) === undefined);
  checar("completar de id inexistente devolve undefined", (await repo.completar("zzz", { especificacao: "x" }, agora)) === undefined);
  checar("nada foi criado pelo completar inexistente", (await repo.contar()) === 1);
  const comp = await repo.completar("1", { especificacao: "Pregão", interessados: ["ACME"] }, agora);
  checar("completar grava", comp?.especificacao === "Pregão" && (await repo.obter("1"))?.interessados?.join() === "ACME");
  await repo.marcarTentativa("1", agora + 5);
  checar("marcarTentativa grava tentouEm", (await repo.obter("1"))?.tentouEm === agora + 5);
  await repo.marcarTentativa("zzz", agora);
  checar("marcarTentativa de id inexistente nao cria", (await repo.contar()) === 1);
  checar("remover devolve a quantidade sem repetir ids", (await repo.remover(["1", "1"])) === 1 && (await repo.contar()) === 0);

  secao("historico: apagar por periodo");
  const ap = areaMemoria();
  const r = new RepositorioHistorico(ap, ESCOPO);
  const outro = new RepositorioHistorico(ap, OUTRO);
  const montar = async () => {
    await r.registrarVisita(dados("1"), agora - 30 * MIN); // ha 30 min
    await r.registrarVisita(dados("2"), new Date(2026, 9, 2, 8).getTime()); // hoje cedo
    await r.registrarVisita(dados("3"), new Date(2026, 9, 1, 23).getTime()); // ontem
    await r.registrarVisita(dados("4"), new Date(2026, 8, 20, 10).getTime()); // 12 dias atras
    await r.registrarVisita(dados("5"), new Date(2026, 7, 1, 10).getTime()); // 2 meses atras
  };
  const ids = async () =>
    (await r.listar())
      .map((v) => v.id)
      .sort()
      .join();
  await montar();
  checar("hora tira so a de menos de 1 h", (await r.apagarPeriodo("hora", agora)) === 1 && (await ids()) === "2,3,4,5");
  checar("hoje usa o inicio do dia local", (await r.apagarPeriodo("hoje", agora)) === 1 && (await ids()) === "3,4,5");
  checar("7 dias inclui ontem e nao os 12 dias", (await r.apagarPeriodo("7dias", agora)) === 1 && (await ids()) === "4,5");
  checar("30 dias tira a de 12 dias", (await r.apagarPeriodo("30dias", agora)) === 1 && (await ids()) === "5");
  await montar();
  await outro.registrarVisita(dados("9"), agora - 10 * MIN);
  await r.gravarMeta({ migradoEm: 7 });
  checar("tudo devolve o total apagado", (await r.apagarPeriodo("tudo", agora)) === 5 && (await ids()) === "");
  checar("tudo nao toca nas visitas de outro escopo", (await outro.listar()).length === 1);
  checar("tudo nao toca na meta", (await r.meta()).migradoEm === 7 && (await ap.obter(chaveMeta(ESCOPO)))[chaveMeta(ESCOPO)] !== undefined);
  checar("corte de 'tudo' e infinito negativo", corteDoPeriodo("tudo", agora) === Number.NEGATIVE_INFINITY);
  checar("corte de 7 dias e o inicio do 7o dia local", corteDoPeriodo("7dias", agora) === new Date(2026, 8, 26).getTime());
  checar("corte de 30 dias e o inicio do 30o dia local", corteDoPeriodo("30dias", agora) === new Date(2026, 8, 3).getTime());

  secao("historico: poda e importacao");
  const ar = areaMemoria();
  const rp = new RepositorioHistorico(ar, ESCOPO);
  for (let i = 1; i <= 4; i++) await rp.registrarVisita(dados(String(i)), agora - (5 - i) * 60 * MIN);
  checar("podar dentro do limite nao apaga nada", (await rp.podar(4)) === 0 && (await rp.contar()) === 4);
  checar("podar(2) devolve 2", (await rp.podar(2)) === 2);
  checar(
    "podar deixa as 2 mais recentes",
    (await rp.listar())
      .map((v) => v.id)
      .sort()
      .join() === "3,4",
  );
  const antiga = {
    id: "3",
    protocolo: "50300.00003/2024-00",
    unidades: [],
    primeira: 1_000,
    ultima: 2_000,
    vezes: 1,
    origem: "legado" as const,
  };
  checar("importar devolve a quantidade", (await rp.importar([antiga, { ...antiga, id: "77" }])) === 2);
  const mesclada = await rp.obter("3");
  checar(
    "importar mescla: primeira mais antiga, ultima da atual",
    mesclada?.primeira === 1_000 && mesclada.ultima === agora - 2 * 60 * MIN,
  );
  checar("importar mescla: unidades da atual e sem origem", mesclada?.unidades[0]?.sigla === "GPF" && mesclada.origem === undefined);
  checar("importar cria a que nao existia", (await rp.obter("77"))?.origem === "legado");
  const sigilosa = { ...antiga, id: "88", nivel: "sigiloso" as const, especificacao: "segredo", interessados: ["X"], assuntos: ["Y"] };
  await rp.importar([sigilosa]);
  const gs = await rp.obter("88");
  checar("importar sigiloso novo nao guarda texto", gs?.nivel === "sigiloso" && !gs.especificacao && !gs.interessados && !gs.assuntos);
  await rp.registrarVisita({ ...dados("4"), nivel: "sigiloso" }, agora);
  await rp.importar([{ ...sigilosa, id: "4" }]);
  const g4 = await rp.obter("4");
  checar(
    "importar sobre sigiloso existente nao guarda texto",
    g4?.nivel === "sigiloso" && !g4.especificacao && !g4.interessados && !g4.assuntos,
  );
  checar("importar lista vazia nao faz nada", (await rp.importar([])) === 0);

  secao("historico: meta");
  const am = areaMemoria();
  const rm = new RepositorioHistorico(am, ESCOPO);
  checar("meta vazia", Object.keys(await rm.meta()).length === 0);
  await rm.gravarMeta({ migradoEm: 1 });
  const m2 = await rm.gravarMeta({ apagarLegado: true });
  checar("gravarMeta mantem os campos anteriores", m2.migradoEm === 1 && m2.apagarLegado === true);
  checar("o que foi gravado e relido", (await rm.meta()).migradoEm === 1 && (await rm.meta()).apagarLegado === true);
  const m3 = await rm.gravarMeta({ apagarLegado: undefined });
  checar("undefined apaga o campo", !("apagarLegado" in m3) && !("apagarLegado" in (await rm.meta())) && m3.migradoEm === 1);

  secao("historico: escopo invalido (host ou login vazio) nunca grava meta");
  checar("escopo com host e login e valido", new RepositorioHistorico(areaMemoria(), ESCOPO).valido);
  for (const ruim of ["|", "sei.x.gov.br|", "|ana", ""]) {
    const ai = areaMemoria();
    const ri = new RepositorioHistorico(ai, ruim);
    const avisos: string[] = [];
    const original = console.warn;
    console.warn = (...a: unknown[]) => void avisos.push(a.map(String).join(" "));
    let erro: unknown = null;
    try {
      await ri.gravarMeta({ apagarLegado: true });
    } catch (e) {
      erro = e;
    } finally {
      console.warn = original;
    }
    checar(
      `"${ruim}": invalido, recusa em silencio (sem lancar) e nada gravado`,
      !ri.valido && erro === null && Object.keys(await ai.obter(null)).length === 0,
      await ai.obter(null),
    );
    checar(
      `"${ruim}": deixa o motivo no console`,
      avisos.some((a) => a.includes("escopo")),
      avisos,
    );
  }

  secao("historico: aoMudar e valores invalidos");
  const aa = areaMemoria();
  const ra = new RepositorioHistorico(aa, ESCOPO);
  let n = 0;
  const parar = ra.aoMudar(() => n++);
  await ra.registrarVisita(dados("1"), agora);
  checar("dispara na gravacao de visita", n === 1);
  await ra.gravarMeta({ migradoEm: 1 });
  checar("dispara na gravacao de meta", n === 2);
  await aa.gravar({ "favoritos/x": { a: 1 } });
  checar("nao dispara para outra chave", n === 2);
  await aa.gravar({ [`${prefixoVisitas(OUTRO)}1`]: { id: "1" } });
  checar("nao dispara para outro escopo", n === 2);
  parar();
  await ra.registrarVisita(dados("2"), agora);
  checar("cancelar a assinatura para de avisar", n === 2);
  await aa.gravar({ [`${prefixoVisitas(ESCOPO)}lixo`]: { id: 5 } });
  checar(
    "valor invalido na area nao aparece em listar",
    (await ra.listar())
      .map((v) => v.id)
      .sort()
      .join() === "1,2",
  );
  await aa.gravar({ [`${prefixoVisitas(ESCOPO)}semunidades`]: { id: "s", protocolo: "p", primeira: 1, ultima: 1, vezes: 1 } });
  checar("visita sem unidades vem com lista vazia", (await ra.listar()).find((v) => v.id === "s")?.unidades.length === 0);

  secao("historico: preferencias");
  const ap2 = areaMemoria();
  checar("padrao quando vazio", JSON.stringify(await lerPreferencias(ap2)) === JSON.stringify(PREFERENCIAS_PADRAO));
  await ap2.gravar({ [CHAVE_PREFERENCIAS]: { limite: 300, registrar: false, ordem: "xis", agruparPorDia: false } });
  const lida = await lerPreferencias(ap2);
  checar("limite invalido volta para 1000", lida.limite === 1000);
  checar("registrar false e lido", lida.registrar === false);
  checar("ordem invalida volta para o padrao", lida.ordem === "recentes");
  checar("agruparPorDia false e lido", lida.agruparPorDia === false);
  const ap3 = areaMemoria();
  await gravarPreferencias(ap3, { ordem: "visitados" });
  const g2 = await gravarPreferencias(ap3, { limite: 2000 });
  checar("gravarPreferencias mescla", g2.ordem === "visitados" && g2.limite === 2000 && g2.registrar === true);
  checar("o gravado e relido", (await lerPreferencias(ap3)).limite === 2000 && (await lerPreferencias(ap3)).ordem === "visitados");
  const g3 = await gravarPreferencias(ap3, { limite: 7 as never });
  checar("gravarPreferencias normaliza valor invalido", g3.limite === 1000 && (await lerPreferencias(ap3)).limite === 1000);
}
