import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { contextoDe, temaEscuroLegado } from "../src/pagina/contexto";
import { dadosDaArvore, instalarEstrelaArvore } from "../src/pagina/estrelaArvore";
import { instalarEstrelasCaixa } from "../src/pagina/estrelasCaixa";
import { dadosDaLinhaLista, instalarEstrelasListas } from "../src/pagina/estrelasListas";
import { ATRIBUTO_ATIVO, marcarAtivo } from "../src/pagina/marca";
import { ServicoFavoritosPagina } from "../src/pagina/servico";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, instalarDom, secao, telaSei, tique } from "./util";

const URL_CAIXA = "https://treinamento.sei.sp.gov.br/sei/controlador.php?acao=procedimento_controlar&infra_unidade_atual=110000001";

export async function verificarPagina(): Promise<void> {
  secao("pagina: contexto e marca");
  const { doc: caixa } = telaSei("sei41/caixa.html");
  const ctx = contextoDe(caixa, false, URL_CAIXA);
  checar(
    "contexto lido do cabecalho",
    ctx?.login === "pedro.soares" &&
      ctx.unidade?.id === "110000001" &&
      ctx.unidade.sigla === "TESTE" &&
      ctx.host === "treinamento.sei.sp.gov.br",
    ctx,
  );
  marcarAtivo(caixa);
  checar("marca o documento para o legado se desligar", caixa.documentElement.getAttribute(ATRIBUTO_ATIVO) === "1");
  checar(
    "tema escuro do legado",
    temaEscuroLegado({ getItem: (k) => (k === "darkModePro" ? "1" : null) }) && !temaEscuroLegado({ getItem: () => null }),
  );

  secao("pagina: servico");
  const area = areaMemoria();
  const esc = escoposDoContexto(ctx!);
  let relogio = 1;
  const carimbo = () => ({ agora: ++relogio, dispositivo: "T" });
  const repos = {
    unidade: new RepositorioFavoritos(area, esc.unidade!, carimbo),
    pessoal: new RepositorioFavoritos(area, esc.pessoal, carimbo),
  };
  const adicionados: string[] = [];
  const servico = new ServicoFavoritosPagina({ ...repos, aoAdicionar: (f) => adicionados.push(f.id) });
  await servico.carregar();
  const ancora = caixa.createElement("span");
  const ligou = await servico.alternar({ id: "77", protocolo: "77/2026" }, ancora);
  checar(
    "alternar adiciona na lista da unidade e avisa",
    ligou && (await repos.unidade.contem("77")) && servico.ativo("77") && adicionados.join() === "77",
  );
  const desligou = !(await servico.alternar({ id: "77", protocolo: "77/2026" }, ancora));
  checar("alternar de novo remove", desligou && !(await repos.unidade.contem("77")) && !servico.ativo("77"));
  await repos.pessoal.adicionar({ id: "55", protocolo: "55/2026" });
  await servico.carregar();
  checar("estrela acesa se esta em qualquer das duas listas", servico.ativo("55"));
  await servico.alternar({ id: "55", protocolo: "55/2026" }, ancora);
  checar("apagar a estrela tira de qualquer lista", !(await repos.pessoal.contem("55")));
  const soPessoal = new ServicoFavoritosPagina({ unidade: null, pessoal: repos.pessoal });
  await soPessoal.alternar({ id: "88", protocolo: "88/2026" }, ancora);
  checar("sem unidade vai para a Pessoal", await repos.pessoal.contem("88"));

  secao("pagina: estrelas na caixa (Review Focus 5)");
  const servicoCaixa = new ServicoFavoritosPagina(repos);
  await servicoCaixa.carregar();
  const caixaUI = instalarEstrelasCaixa(caixa, servicoCaixa);
  const linhas = [...caixa.querySelectorAll("#tblProcessosRecebidos tr[id^='P'], #tblProcessosGerados tr[id^='P']")];
  const comEstrela = linhas.filter((tr) => tr.querySelectorAll("td")[1]?.querySelector(".spro-fav-estrela"));
  checar("toda linha da caixa ganha estrela na 2a coluna", linhas.length > 0 && comEstrela.length === linhas.length, [
    linhas.length,
    comEstrela.length,
  ]);
  const estrelaSigilosa = caixa.querySelector("tr#P157584 .spro-fav-estrela") as HTMLButtonElement;
  estrelaSigilosa.click();
  await tique();
  const favSig = await repos.unidade.obter("157584");
  checar(
    "linha sigilosa favorita sem especificacao e sem requisicao",
    favSig?.sigiloso === true && favSig.especificacao === undefined && favSig.protocolo === "034.00000265/2026-31",
    favSig,
  );
  caixaUI.atualizar();
  checar("a estrela acende", estrelaSigilosa.getAttribute("aria-pressed") === "true");
  const modelo = caixa.querySelector("tr#P157584")!;
  const nova = modelo.cloneNode(true) as Element;
  nova.id = "P999";
  nova.querySelector(".spro-fav-estrela")?.remove();
  nova.querySelector("input[type=checkbox]")?.setAttribute("value", "999");
  modelo.parentElement!.append(nova);
  caixaUI.atualizar();
  caixaUI.atualizar();
  checar("linha que chega depois ganha UMA estrela", nova.querySelectorAll(".spro-fav-estrela").length === 1);
  caixaUI.desligar();

  secao("pagina: estrelas em blocos, acompanhamento e sobrestados");
  const docLista = instalarDom(
    '<html><body><form id="frmRelBlocoProtocoloLista"><table class="infraTable"><tr><th>a</th></tr><tr><td></td><td></td><td><a class="protocoloNormal" href="controlador.php?acao=procedimento_trabalhar&id_procedimento=4321&infra_hash=0">50300.000001/2026-01</a></td></tr></table></form></body></html>',
  );
  const linhaBloco = docLista.querySelectorAll("tr")[1]!;
  const dl = dadosDaLinhaLista(linhaBloco);
  checar("dados da linha do bloco", dl?.id === "4321" && dl.protocolo === "50300.000001/2026-01" && dl.sigiloso === false, dl);
  instalarEstrelasListas(docLista, servicoCaixa).atualizar();
  checar("estrela na 3a coluna", !!linhaBloco.querySelectorAll("td")[2]?.querySelector(".spro-fav-estrela"));

  secao("pagina: estrela na arvore");
  const urlArvore = "https://treinamento.sei.sp.gov.br/sei/controlador.php?acao=procedimento_visualizar&id_procedimento=148265";
  const { doc: arvore } = telaSei("sei41/arvore.html");
  const da = dadosDaArvore(arvore, urlArvore);
  checar("dados do processo lidos da arvore ja carregada", da?.id === "148265" && !!da.protocolo && da.sigiloso === false, da);
  // O SEI desenha o nó do processo no #topmenu por JavaScript; aqui ele é montado à mão.
  const no = arvore.createElement("a");
  no.setAttribute("target", "ifrVisualizacao");
  no.textContent = da?.protocolo ?? "";
  arvore.querySelector("#topmenu")!.append(no);
  checar(
    "estrela ao lado do numero",
    (await instalarEstrelaArvore(arvore, servicoCaixa, urlArvore)) &&
      no.nextElementSibling?.classList.contains("spro-fav-estrela") === true,
  );
  checar("nao duplica", !(await instalarEstrelaArvore(arvore, servicoCaixa, urlArvore)));
}
