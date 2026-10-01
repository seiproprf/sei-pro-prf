import { areaMemoria } from "@comum/armazenamento/area";
import { exportarTudo } from "../src/arquivo";
import { escoposDoContexto } from "../src/modelo/escopo";
import { adiarLembrete, lembreteVencido, textoLembrete } from "../src/modelo/lembrete";
import { compararInstantaneos, resumoNovidade } from "../src/modelo/novidades";
import { filtrar, ordenar } from "../src/modelo/operacoes";
import type { Favorito, Instantaneo } from "../src/modelo/tipos";
import { contarPendencias, pintarContador } from "../src/pagina/botao";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, instalarDom, secao } from "./util";
import { CTX } from "./verificar-modelo";

const I = (x: Partial<Instantaneo>): Instantaneo => ({ quando: 1, fonte: "caixa", ...x });

export async function verificarNovidades(): Promise<void> {
  secao("novidades: visto x atual");
  const tipos = (v?: Instantaneo, a?: Instantaneo) =>
    compararInstantaneos(v, a)
      .map((m) => m.tipo)
      .join();
  checar("sem atual, nada", tipos(I({}), undefined) === "");
  checar("sem visto (primeira leitura), nada", tipos(undefined, I({ qtdDocumentos: 9 })) === "");
  checar("documentos a mais", tipos(I({ qtdDocumentos: 3 }), I({ qtdDocumentos: 5 })) === "documentos");
  checar("documento a menos nao e novidade", tipos(I({ qtdDocumentos: 5 }), I({ qtdDocumentos: 4 })) === "");
  const andamento = { data: "01/10/2026 10:00", unidade: "SFC", descricao: "Processo remetido pela unidade GPF" };
  checar(
    "andamento novo",
    tipos(I({ ultimoAndamento: { ...andamento, data: "30/09/2026 09:00" } }), I({ ultimoAndamento: andamento })) === "andamento",
  );
  checar("saiu da unidade", tipos(I({ abertoNaUnidade: true }), I({ abertoNaUnidade: false })) === "saiu");
  checar("voltou para a unidade", tipos(I({ abertoNaUnidade: false }), I({ abertoNaUnidade: true })) === "voltou");
  checar(
    "nao visualizado e documento novo vindos da caixa",
    tipos(I({}), I({ naoVisualizado: true, documentoNovo: true })) === "naoVisualizado,documentoNovo",
  );
  checar("sinal da caixa que ja estava no visto nao repete", tipos(I({ documentoNovo: true }), I({ documentoNovo: true })) === "");
  checar("concluido", tipos(I({ concluido: false }), I({ concluido: true })) === "concluido");
  checar("aviso da corrida do Atualizar", tipos(I({}), I({ recebidoNaLeitura: true })) === "recebido");
  const resumo = resumoNovidade(
    compararInstantaneos(
      I({ qtdDocumentos: 3, abertoNaUnidade: true }),
      I({ qtdDocumentos: 5, abertoNaUnidade: false, ultimoAndamento: andamento }),
    ),
  );
  checar("resumo legivel", resumo === "2 documentos novos · saiu da sua unidade", resumo);

  secao("lembretes");
  const f = (x: Partial<Favorito>): Favorito => ({
    id: "1",
    protocolo: "x",
    etiquetas: [],
    ordem: "a0",
    criadoEm: 1,
    atualizadoEm: 1,
    dispositivo: "D",
    ...x,
  });
  checar("lembrete de hoje vence", lembreteVencido(f({ lembrete: { em: "2026-10-01" } }), "2026-10-01"));
  checar("lembrete de dias atras continua vencido", lembreteVencido(f({ lembrete: { em: "2026-09-20" } }), "2026-10-01"));
  checar("lembrete futuro nao", !lembreteVencido(f({ lembrete: { em: "2026-10-02" } }), "2026-10-01"));
  checar("adiar uma semana conta de hoje", adiarLembrete({ em: "2026-09-20", texto: "ligar" }, "2026-10-01", 7).em === "2026-10-08");
  checar(
    "textos",
    textoLembrete({ em: "2026-10-01" }, "2026-10-01") === "hoje" &&
      textoLembrete({ em: "2026-10-02" }, "2026-10-01") === "amanhã" &&
      textoLembrete({ em: "2026-09-28" }, "2026-10-01") === "desde 28/09/2026",
  );

  secao("filtros e ordem por novidade e lembrete");
  const lista = [
    f({ id: "1", ordem: "a1" }),
    f({ id: "2", ordem: "a2", lembrete: { em: "2026-10-01" } }),
    f({ id: "3", ordem: "a3", documentos: [{ id: "9", numero: "0104019", titulo: "Despacho", criadoEm: 1 }] }),
  ];
  const atuais = new Map<string, Instantaneo>([["1", I({ qtdDocumentos: 2, quando: 50 })]]);
  const vistos: Record<string, Instantaneo> = { "1": I({ qtdDocumentos: 1 }) };
  const apoio = {
    etiquetas: new Map(),
    resumo: () => undefined,
    hoje: "2026-10-01" as const,
    novidades: (x: Favorito) => compararInstantaneos(vistos[x.id], atuais.get(x.id)),
  };
  checar(
    "filtro com novidade",
    filtrar(lista, { novidade: true }, apoio)
      .map((x) => x.id)
      .join() === "1",
  );
  checar(
    "filtro lembrete para hoje",
    filtrar(lista, { lembrete: true }, apoio)
      .map((x) => x.id)
      .join() === "2",
  );
  checar(
    "busca pelo numero do documento favorito",
    filtrar(lista, { busca: "0104019" }, apoio)
      .map((x) => x.id)
      .join() === "3",
  );
  checar("ordem por novidade poe as novidades primeiro", ordenar(lista, "novidade", () => undefined, apoio.novidades)[0]?.id === "1");

  secao("repositorio: atual local e visto");
  const area = areaMemoria();
  let t = 1;
  const repo = new RepositorioFavoritos(area, escoposDoContexto(CTX).unidade!, () => ({ agora: ++t, dispositivo: "A" }));
  await repo.registrar();
  await repo.adicionar({ id: "5", protocolo: "50300.000005/2026-05" });
  await repo.gravarAtual("5", I({ qtdDocumentos: 4 }));
  checar("le o atual", (await repo.atuais()).get("5")?.qtdDocumentos === 4);
  await repo.marcarVisto(["5"]);
  checar("marcar visto copia o atual", (await repo.obter("5"))?.visto?.qtdDocumentos === 4);
  await repo.gravarAtual("5", I({ qtdDocumentos: 777 }));
  const env = await exportarTudo(area, CTX.host, CTX.login, { agora: 99, dispositivo: "A" });
  checar(
    "o atual nao vai para o envelope (arquivo/Texto Padrao)",
    !JSON.stringify(env).includes("777") && env.escopos[0]!.favoritos.length === 1,
  );
}

export async function verificarContador(): Promise<void> {
  secao("contador de pendencias (botao da barra)");
  const area = areaMemoria();
  let t = 1;
  const esc = escoposDoContexto(CTX);
  const u = new RepositorioFavoritos(area, esc.unidade!, () => ({ agora: ++t, dispositivo: "A" }));
  const p = new RepositorioFavoritos(area, esc.pessoal, () => ({ agora: ++t, dispositivo: "A" }));
  await u.adicionar({ id: "1", protocolo: "a" });
  await u.adicionar({ id: "2", protocolo: "b" });
  await p.adicionar({ id: "3", protocolo: "c" });
  await u.editar("1", { lembrete: { em: "2026-09-30" } });
  await p.editar("3", { visto: I({ qtdDocumentos: 1 }) });
  await p.gravarAtual("3", I({ qtdDocumentos: 2 }));
  checar("lembrete vencido + novidade, nas duas listas", (await contarPendencias([u, p], "2026-10-01")) === 2);
  const b = instalarDom('<html><body><a class="spro-fav-botao"><img></a></body></html>').querySelector(".spro-fav-botao") as HTMLElement;
  pintarContador(b, 2);
  checar("selo no botao com o numero", b.querySelector(".spro-fav-contador")?.textContent === "2" && /2 favoritos/.test(b.title));
  pintarContador(b, 0);
  checar("zerado: sem selo", !b.querySelector(".spro-fav-contador"));
}
