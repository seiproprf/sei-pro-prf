import { buscarDocumentosAssinados, lerDocumentosGerarPdf } from "../src/pagina/documentos";
import { checar, instalarDom, lanca, secao } from "./util";

/** Forma do "Gerar Arquivo PDF do Processo" que o legado lia (ajaxDadosDocumentosPro). */
const GERAR_PDF = `<html><body><table id="tblDocumentos"><tbody>
<tr><th></th><th>Nº SEI</th><th>Documento</th><th>Data</th></tr>
<tr class="infraTrClara"><td><input type="checkbox"></td><td><a href="controlador.php?acao=documento_visualizar&id_documento=901&infra_hash=x">0103947</a></td><td>Despacho 12</td><td>05/09/2026</td></tr>
<tr class="infraTrEscura"><td><input type="checkbox"></td><td><a href="controlador.php?acao=documento_visualizar&amp;id_documento=902&infra_hash=y">0103950</a></td><td>Nota Técnica 3</td><td>12/09/2026</td></tr>
<tr class="infraTrClara"><td><input type="checkbox"></td><td><a href="controlador.php?acao=documento_visualizar&id_documento=903">0103951</a></td><td>Minuta</td><td></td></tr>
</tbody></table></body></html>`;

export async function verificarDocumentos(): Promise<void> {
  secao("prazo a partir de documento: documentos do processo");
  const doc = instalarDom(GERAR_PDF);
  const docs = lerDocumentosGerarPdf(doc);
  checar(
    "le numero, nome e data (ISO) das linhas",
    docs.length === 2 && docs[0]!.numero === "0103947" && docs[0]!.nome === "Despacho 12" && docs[0]!.data === "2026-09-05",
    docs,
  );
  checar("id do documento pelo link (com &amp;)", docs[1]!.id === "902");
  checar("linha sem data (nao assinado) fica de fora", !docs.some((d) => d.id === "903"));

  const obtidos: string[] = [];
  const deps = {
    arvoreAberta: (id: string) =>
      id === "148265" ? { acaoGerarPdf: "controlador.php?acao=procedimento_gerar_pdf&id_procedimento=148265&infra_hash=z" } : null,
    arvoreBuscada: async () => ({ acaoGerarPdf: "controlador.php?acao=procedimento_gerar_pdf&id_procedimento=7&infra_hash=w" }),
    obter: async (url: string) => {
      obtidos.push(url);
      return instalarDom(GERAR_PDF);
    },
  };
  const r1 = await buscarDocumentosAssinados({ id: "148265", protocolo: "x", buscar: false }, deps);
  checar(
    "com a arvore aberta na aba, usa o link dela (sem abrir arvore nenhuma)",
    r1.origem === "arvore-aberta" && r1.documentos.length === 2 && obtidos.length === 1,
  );
  const e = await lanca(() => buscarDocumentosAssinados({ id: "7", protocolo: "50300.000007/2026-07", buscar: false }, deps));
  checar("sem arvore aberta e sem pedido: precisa buscar (o usuario decide)", e?.codigo === "PRECISA_BUSCAR", e);
  const r2 = await buscarDocumentosAssinados({ id: "7", protocolo: "50300.000007/2026-07", buscar: true }, deps);
  checar("com o pedido, busca", r2.origem === "busca" && obtidos.length === 2);
  const sem = { ...deps, arvoreAberta: () => ({ acaoGerarPdf: null }) };
  const e2 = await lanca(() => buscarDocumentosAssinados({ id: "148265", protocolo: "x", buscar: false }, sem));
  checar("sem 'Gerar PDF' para o usuario: erro claro", e2?.codigo === "SEM_LISTA_DOCUMENTOS", e2);
}
