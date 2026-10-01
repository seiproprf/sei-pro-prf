import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { capturarDaArvore, capturarDaCaixa, resolverProximoDocumento } from "../src/pagina/novidades";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, secao, telaSei } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarCaptura(): Promise<void> {
  const area = areaMemoria();
  let t = 1;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const esc = escoposDoContexto(CTX);
  const repo = new RepositorioFavoritos(area, esc.unidade!, carimbo);
  const pessoal = new RepositorioFavoritos(area, esc.pessoal, carimbo);
  const { doc: caixa } = telaSei("sei41/caixa.html");
  const primeira = caixa.querySelector("#tblProcessosRecebidos tr[id^='P']")!;
  const idNaCaixa = primeira.id.slice(1);
  await repo.adicionar({ id: idNaCaixa, protocolo: "x" });
  await repo.adicionar({ id: "999999", protocolo: "fora" });

  secao("captura: sinais da caixa");
  await capturarDaCaixa(caixa, repo, 1000);
  const a1 = (await repo.atuais()).get(idNaCaixa);
  checar(
    "favorito na caixa: aberto na unidade, com os sinais da linha",
    a1?.abertoNaUnidade === true && a1.fonte === "caixa" && typeof a1.naoVisualizado === "boolean",
    a1,
  );
  checar("caixa paginada: o que nao esta na pagina NAO vira 'saiu'", !(await repo.atuais()).has("999999"));
  checar("primeira leitura vira o visto (sem novidade falsa)", (await repo.vistos()).get(idNaCaixa)?.abertoNaUnidade === true);
  const { doc: inteira } = telaSei("sei41/caixa.html");
  for (const id of ["#tblProcessosRecebidos", "#tblProcessosGerados"]) {
    const tab = inteira.querySelector(id)!;
    const n = tab.querySelectorAll("tr[id^='P']").length;
    tab.querySelector("caption")!.textContent = `Processos (${n} registros):`;
  }
  await capturarDaCaixa(inteira, repo, 2000);
  checar("caixa inteira na tela: o ausente esta fora da unidade", (await repo.atuais()).get("999999")?.abertoNaUnidade === false);
  await pessoal.adicionar({ id: "777", protocolo: "p" });
  await capturarDaCaixa(inteira, pessoal, 2000);
  checar("lista Pessoal nao recebe 'fora da unidade' (a unidade muda)", !(await pessoal.atuais()).has("777"));

  secao("captura: arvore aberta pelo usuario");
  const { doc: arv, pagina } = telaSei("sei41/arvore_completa.html");
  await repo.adicionar({ id: "148265", protocolo: "99906.713-630.000032/2025-82" });
  const historico = telaSei("sei41/historico.html");
  const pedidos: string[] = [];
  const n = await capturarDaArvore(arv, pagina.url, [repo, pessoal], async (url) => {
    pedidos.push(url);
    return historico.pagina;
  });
  const a2 = (await repo.atuais()).get("148265");
  checar("conta os documentos da arvore", n === 1 && (a2?.qtdDocumentos ?? 0) > 0, a2);
  checar(
    "le o ultimo andamento pelo link do historico da propria arvore",
    pedidos.length === 1 && /procedimento_consultar_historico/.test(pedidos[0]!) && !!a2?.ultimoAndamento?.data,
    a2?.ultimoAndamento,
  );
  checar("abrir o processo marca como visto", (await repo.vistos()).get("148265")?.qtdDocumentos === a2?.qtdDocumentos);
  const nada = await capturarDaArvore(arv, pagina.url, [pessoal], async () => historico.pagina);
  checar("processo que nao e favorito: nada lido", nada === 0);

  secao("prazo do proximo documento: comeca a contar quando o documento aparece");
  const docs = [
    { id: "1", numero: "01", nome: "Ofício 3", data: "2026-09-20" as const },
    { id: "2", numero: "02", nome: "Despacho 7", data: "2026-09-25" as const },
    { id: "3", numero: "03", nome: "Despacho 9", data: "2026-10-01" as const },
    { id: "4", numero: "04", nome: "Nota Tecnica 1", data: "2026-10-02" as const },
  ];
  const prazo = {
    referencia: { de: "novoDocumento" as const, tipos: ["despacho", "Nota Técnica"], desde: "2026-09-28" as const },
    vencimento: { em: "dias" as const, n: 5, contagem: "uteis" as const },
    exibicao: "ate" as const,
  };
  const r = resolverProximoDocumento(prazo, docs);
  checar(
    "o primeiro documento de um dos tipos depois de 'desde' (sem acento e sem caixa)",
    r?.referencia.de === "documento" && r.referencia.idDocumento === "3" && r.referencia.data === "2026-10-01",
    r,
  );
  checar("mantem o vencimento", r?.vencimento?.em === "dias" && r.vencimento.n === 5);
  checar(
    "nenhum documento novo do tipo: continua aguardando",
    resolverProximoDocumento({ ...prazo, referencia: { ...prazo.referencia, desde: "2026-10-05" } }, docs) === null,
  );
}
