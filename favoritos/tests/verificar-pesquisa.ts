import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { dadosDaLinhaPesquisa, instalarEstrelasPesquisa } from "../src/pagina/estrelasPesquisa";
import { ServicoFavoritosPagina } from "../src/pagina/servico";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, secao, telaSei, tique } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarPesquisa(): Promise<void> {
  secao("estrela nos resultados da Pesquisa");
  const { doc } = telaSei("sei41/pesquisa_resultado.html");
  const primeira = doc.querySelector("table.pesquisaResultado tr.pesquisaTituloRegistro")!;
  const d = dadosDaLinhaPesquisa(primeira);
  checar(
    "le id, numero e tipo do resultado",
    d?.id === "148265" &&
      d.protocolo === "99906.713-630.000032/2025-82" &&
      d.tipo === "Processo de contratação de serviços de informática e automação",
    d,
  );
  const area = areaMemoria();
  let t = 1;
  const esc = escoposDoContexto(CTX);
  const unidade = new RepositorioFavoritos(area, esc.unidade!, () => ({ agora: ++t, dispositivo: "A" }));
  const servico = new ServicoFavoritosPagina({
    unidade,
    pessoal: new RepositorioFavoritos(area, esc.pessoal, () => ({ agora: ++t, dispositivo: "A" })),
  });
  await servico.carregar();
  instalarEstrelasPesquisa(doc, servico);
  const estrelas = doc.querySelectorAll("table.pesquisaResultado .spro-fav-estrela");
  checar("na pesquisa a estrela segue o texto (sem a classe de icone)", ![...estrelas].some((e) => e.classList.contains("spro-fav-icone")));
  const linhas = doc.querySelectorAll("table.pesquisaResultado tr.pesquisaTituloRegistro").length;
  checar("uma estrela por resultado", estrelas.length === linhas && linhas > 0, { estrelas: estrelas.length, linhas });
  (estrelas[0] as HTMLElement).click();
  await tique(40);
  checar("clicar favorita sem requisicao", await unidade.contem("148265"));
  checar(
    "estrelas do mesmo processo acendem juntas",
    [...doc.querySelectorAll("table.pesquisaResultado .spro-fav-estrela")]
      .filter((e) => e.closest("tr")?.querySelector('a[href*="id_procedimento=148265"]'))
      .every((e) => e.getAttribute("aria-pressed") === "true"),
  );
}
