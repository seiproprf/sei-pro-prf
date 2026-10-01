import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { alternarDocumento, instalarEstrelasDocumentos } from "../src/pagina/documentosArvore";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, instalarDom, secao, tique } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarDocumentosFavoritos(): Promise<void> {
  secao("documentos favoritos: alternar");
  const area = areaMemoria();
  let t = 1;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const esc = escoposDoContexto(CTX);
  const repos = {
    unidade: new RepositorioFavoritos(area, esc.unidade!, carimbo),
    pessoal: new RepositorioFavoritos(area, esc.pessoal, carimbo),
  };
  const proc = { id: "148265", protocolo: "99906.713-630.000032/2025-82", tipo: "Contratação" };
  const d1 = { id: "160288", numero: "0104019", titulo: "Despacho 12" };
  checar(
    "documento de processo que nao e favorito: o processo entra na unidade",
    (await alternarDocumento(repos, proc, d1)) && (await repos.unidade.contem("148265")),
  );
  checar("e o documento fica guardado", (await repos.unidade.obter("148265"))?.documentos?.[0]?.numero === "0104019");
  checar(
    "de novo: tira o documento (o processo continua)",
    !(await alternarDocumento(repos, proc, d1)) &&
      (await repos.unidade.contem("148265")) &&
      !(await repos.unidade.obter("148265"))?.documentos?.length,
  );
  await repos.pessoal.adicionar({ id: "5", protocolo: "P5" });
  await alternarDocumento(repos, { id: "5", protocolo: "P5" }, { id: "9", numero: "0000009", titulo: "Ofício" });
  checar(
    "processo na Pessoal: o documento vai para la",
    (await repos.pessoal.obter("5"))?.documentos?.length === 1 && !(await repos.unidade.contem("5")),
  );

  secao("documentos favoritos: estrelas na arvore");
  const doc = instalarDom(
    '<html><body><div id="divArvore"><a id="anchor160288">Despacho 12 (0104019)</a><a id="anchor160290">Nota (0104020)</a></div></body></html>',
  );
  const marcados = new Set<string>(["160290"]);
  const cliques: string[] = [];
  const { parar } = instalarEstrelasDocumentos(
    doc,
    [
      { id: "160288", numero: "0104019", titulo: "Despacho 12" },
      { id: "160290", numero: "0104020", titulo: "Nota" },
    ],
    {
      marcado: (id) => marcados.has(id),
      alternar: async (d) => void cliques.push(d.id),
    },
  );
  const estrelas = doc.querySelectorAll(".spro-fav-doc");
  checar("uma estrela por documento, depois do nome", estrelas.length === 2 && estrelas[0]!.previousElementSibling?.id === "anchor160288");
  checar(
    "documento favorito ja vem marcado",
    estrelas[1]!.getAttribute("aria-pressed") === "true" && estrelas[0]!.getAttribute("aria-pressed") === "false",
  );
  (estrelas[0] as HTMLElement).click();
  await tique();
  checar("clique alterna aquele documento", cliques.join() === "160288");
  checar("nao e a estrela do processo (delegacao separada)", !estrelas[0]!.classList.contains("spro-fav-estrela"));
  parar();
}
