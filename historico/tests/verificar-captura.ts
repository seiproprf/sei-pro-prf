import { areaMemoria } from "@comum/armazenamento/area";
import { type Arvore, lerArvore } from "@nucleo/dominio/arvore";
import { DOMParser } from "linkedom";
import { LEGADO_CHAVE } from "../src/modelo/constantes";
import { capturarVisita, type DepsCaptura } from "../src/pagina/captura";
import { contextoHistorico } from "../src/pagina/contexto";
import { migrarSeNecessario } from "../src/pagina/migrar";
import { RepositorioHistorico } from "../src/repositorio";
import { checar, secao, telaSei } from "./util";

const MIN = 60_000;
const UNI = { id: "110000001", sigla: "GESP" };
const opcoes = { temaEscuro: false, favoritosAtivo: true, lateralDisponivel: true };

function armazenamentoFalso(inicial: Record<string, string> = {}) {
  const m = new Map(Object.entries(inicial));
  return { getItem: (k: string) => m.get(k) ?? null, removeItem: (k: string) => void m.delete(k), tem: (k: string) => m.has(k) };
}

export async function verificarCaptura(): Promise<void> {
  secao("historico: captura na arvore");
  const { pagina } = telaSei("sei41/arvore.html");
  const arv = lerArvore(pagina);
  let consultas = 0;
  let falha = false;
  let t = 1_000_000_000_000;
  let limite = 1000;
  let ligado = true;
  const montar = () => {
    const repo = new RepositorioHistorico(areaMemoria(), "h|u");
    const d: DepsCaptura = {
      repo,
      ligado: async () => ligado,
      limite: async () => limite,
      consultar: async () => {
        consultas++;
        if (falha) throw new Error("rede");
        return { especificacao: "Esp", interessados: ["X"], assuntos: ["Y"] };
      },
      agora: () => t,
    };
    return { repo, d };
  };
  let { repo, d } = montar();
  const v = await capturarVisita(arv, UNI, d);
  checar(
    "grava protocolo, tipo e nivel da arvore",
    v?.protocolo === arv.protocolo && v.tipo === (arv.tipo || undefined) && v.nivel === arv.nivel,
  );
  checar("grava a unidade passada", v?.unidades[0]?.sigla === "GESP");
  checar("faz 1 consulta e completa", consultas === 1 && v?.especificacao === "Esp" && v.interessados?.join() === "X");
  t += MIN;
  const v2 = await capturarVisita(arv, UNI, d);
  checar("segunda captura 1 min depois: vezes 1 e sem consulta", v2?.vezes === 1 && consultas === 1);

  ({ repo, d } = montar());
  consultas = 0;
  falha = true;
  const f = await capturarVisita(arv, UNI, d);
  checar("consulta que falha: visita gravada com tentouEm", !!f && (await repo.obter(arv.idProcedimento))?.tentouEm === t);
  t += MIN;
  await capturarVisita(arv, UNI, d);
  checar("nova captura em 1 min nao consulta (espera de 2 min)", consultas === 1);
  falha = false;

  ({ repo, d } = montar());
  consultas = 0;
  const sig = await capturarVisita({ ...arv, nivel: "sigiloso" } as Arvore, UNI, d);
  checar("sigiloso grava sem consultar e sem dados", consultas === 0 && sig?.nivel === "sigiloso" && !sig.especificacao);

  ({ repo, d } = montar());
  ligado = false;
  checar("desligado devolve null e nao grava", (await capturarVisita(arv, UNI, d)) === null && (await repo.contar()) === 0);
  ligado = true;
  checar(
    "arvore sem id devolve null",
    (await capturarVisita({ ...arv, idProcedimento: "" } as Arvore, UNI, d)) === null && (await repo.contar()) === 0,
  );

  ({ repo, d } = montar());
  await repo.registrarVisita({ id: "antiga", protocolo: "1", unidade: null }, t - 60 * MIN);
  limite = 1;
  await capturarVisita(arv, UNI, d);
  const ids = (await repo.listar()).map((x) => x.id);
  checar("limite 1: a mais antiga sai", ids.length === 1 && ids[0] === arv.idProcedimento);
  limite = 1000;

  secao("historico: migracao no content script");
  const lista = JSON.stringify([
    { datetime: "2024-03-05 14:07:09", id_procedimento: "11", protocolo: "50300.000011/2024-00", nivel_acesso: "0" },
    { datetime: "2024-03-06 14:07:09", id_procedimento: "12", protocolo: "50300.000012/2024-00", nivel_acesso: "0" },
  ]);
  let r = new RepositorioHistorico(areaMemoria(), "h|u");
  let s = armazenamentoFalso();
  checar(
    "sem chave antiga grava migradoEm e devolve null",
    (await migrarSeNecessario(r, s, 5)) === null && (await r.meta()).migradoEm === 5,
  );
  r = new RepositorioHistorico(areaMemoria(), "h|u");
  s = armazenamentoFalso({ [LEGADO_CHAVE]: lista });
  checar("com 2 itens importa 2", (await migrarSeNecessario(r, s, 7)) === 2 && (await r.contar()) === 2);
  checar(
    "grava migradoEm e migrados e mantem a chave antiga",
    (await r.meta()).migrados === 2 && (await r.meta()).migradoEm === 7 && s.tem(LEGADO_CHAVE),
  );
  checar("segunda chamada devolve null sem reimportar", (await migrarSeNecessario(r, s, 9)) === null && (await r.meta()).migradoEm === 7);
  await r.gravarMeta({ apagarLegado: true });
  await migrarSeNecessario(r, s, 9);
  checar("apagarLegado remove a chave e limpa a flag", !s.tem(LEGADO_CHAVE) && !(await r.meta()).apagarLegado);

  secao("historico: contexto");
  const caixa = telaSei("sei41/caixa.html");
  const ctx = contextoHistorico(caixa.doc, { ...opcoes, corTema: "#123456" }, caixa.pagina.url);
  checar("host, login em minusculas e unidade", !!ctx?.host && ctx.login === "pedro.soares" && !!ctx.unidade?.sigla);
  checar("soma os campos novos", ctx?.favoritosAtivo === true && ctx.lateralDisponivel === true && ctx.corTema === "#123456");
  const semUsuario = new DOMParser().parseFromString("<html><body></body></html>", "text/html") as unknown as Document;
  checar("pagina sem usuario devolve null", contextoHistorico(semUsuario, opcoes, "https://sei.x.gov.br/sei/controlador.php") === null);
}
