import { areaMemoria } from "@comum/armazenamento/area";
import { naLixeira } from "../src/app/componentes/lixeira";
import { escoposDoContexto } from "../src/modelo/escopo";
import { filtrar } from "../src/modelo/operacoes";
import { atualizarForaDaUnidade } from "../src/pagina/atualizar";
import { dadosDaLinhaPesquisa } from "../src/pagina/estrelasPesquisa";
import { capturarDaCaixa } from "../src/pagina/novidades";
import { RepositorioFavoritos } from "../src/repositorio";
import { envelopeDaUnidade } from "../src/sincronia/textoPadrao";
import { checar, secao, telaSei } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarSigilo(): Promise<void> {
  const esc = escoposDoContexto(CTX).unidade!;
  let t = 1;
  const novoRepo = (d = "A") => new RepositorioFavoritos(areaMemoria(), esc, () => ({ agora: ++t, dispositivo: d }));

  secao("sigilo: item da Pesquisa fica 'a confirmar'");
  const { doc } = telaSei("sei41/pesquisa_resultado.html");
  const dados = dadosDaLinhaPesquisa(doc.querySelector("table.pesquisaResultado tr.pesquisaTituloRegistro")!)!;
  checar("a Pesquisa nao diz se e sigiloso", dados.sigiloAConfirmar === true, dados);
  const repo = novoRepo();
  await repo.adicionar(dados);
  await repo.adicionar({ id: "2", protocolo: "P2" });
  const env = await envelopeDaUnidade(repo, esc, { agora: 99, dispositivo: "A" });
  checar(
    "sigilo a confirmar nao vai para o Texto Padrao",
    !JSON.stringify(env).includes(dados.protocolo) && env.escopos[0]!.favoritos.some((f) => f.id === "2"),
  );
  const lidos: string[] = [];
  await atualizarForaDaUnidade(
    {
      repos: [repo],
      listarCaixa: async () => new Set(),
      localizar: async (p) => (p === dados.protocolo ? dados.id : "2"),
      lerProcesso: async (p) => {
        lidos.push(p);
        return { qtdDocumentos: 1, abertoNaUnidade: false };
      },
      progresso: async () => undefined,
      esperar: async () => undefined,
    },
    new AbortController().signal,
  );
  checar("nem para o Atualizar (que leria a arvore)", !lidos.includes(dados.protocolo) && lidos.includes("P2"), lidos);

  secao("sigilo: a caixa confirma");
  const { doc: caixa } = telaSei("sei41/caixa.html");
  const tr = caixa.querySelector("#tblProcessosRecebidos tr[id^='P']")!;
  const id = tr.id.slice(1);
  tr.querySelector("input[type=checkbox]")!.setAttribute(
    "aria-label",
    `Sigiloso ${tr.querySelector("input[type=checkbox]")!.getAttribute("aria-label") ?? ""}`,
  );
  const r2 = novoRepo();
  await r2.adicionar({ id, protocolo: "x", especificacao: "segredo", sigiloAConfirmar: true });
  await capturarDaCaixa(caixa, r2, 1000);
  const f2 = await r2.obter(id);
  checar(
    "linha sigilosa na caixa marca o favorito como sigiloso e apaga a especificacao",
    f2?.sigiloso === true && !f2.especificacao && !f2.sigiloAConfirmar,
    f2,
  );
  const { doc: caixa2 } = telaSei("sei41/caixa.html");
  const r3 = novoRepo();
  await r3.adicionar({
    id: caixa2.querySelector("#tblProcessosRecebidos tr[id^='P']")!.id.slice(1),
    protocolo: "y",
    sigiloAConfirmar: true,
  });
  await capturarDaCaixa(caixa2, r3, 1000);
  checar("linha publica confirma que nao e sigiloso", !(await r3.ativos())[0]!.sigiloAConfirmar);

  secao("Texto Padrao: lapides e sigilosos viram registro minimo");
  const r4 = novoRepo();
  await r4.adicionar({ id: "7", protocolo: "P7" });
  await r4.editar("7", { nota: "nota que eu tirei da unidade" });
  await r4.remover(["7"]);
  await r4.adicionar({ id: "9", protocolo: "P9", sigiloso: true });
  await r4.adicionar({ id: "10", protocolo: "P10", sigiloso: true });
  const env4 = await envelopeDaUnidade(r4, esc, { agora: 99, dispositivo: "A" }, new Set(["9"]));
  const texto = JSON.stringify(env4);
  checar(
    "a lapide nao leva nota nem numero",
    !texto.includes("nota que eu tirei") &&
      !texto.includes("P7") &&
      env4.escopos[0]!.favoritos.some((f) => f.id === "7" && f.removidoEm !== undefined),
  );
  checar(
    "sigiloso que ja estava no texto vira so o aviso de sigilo (sem numero)",
    env4.escopos[0]!.favoritos.some((f) => f.id === "9" && f.sigiloso && !f.protocolo) && !texto.includes("P9"),
  );
  checar("sigiloso que nunca foi ao texto nao vai", !env4.escopos[0]!.favoritos.some((f) => f.id === "10"));

  secao("mesclagem: o registro minimo nao apaga os dados locais");
  // As cópias de B são de ANTES da remoção e do sigilo feitos em A (relógio mais antigo).
  let tb = 0;
  const b = new RepositorioFavoritos(areaMemoria(), esc, () => ({ agora: ++tb, dispositivo: "B" }));
  await b.adicionar({ id: "7", protocolo: "P7", especificacao: "Obra" });
  await b.editar("7", { nota: "minha nota" });
  await b.adicionar({ id: "9", protocolo: "P9", especificacao: "Inquerito" });
  await b.importar(env4.escopos[0]!);
  const f7 = await b.obter("7");
  checar(
    "lapide minima remove e mantem numero e nota para a Lixeira",
    f7?.removidoEm !== undefined && f7.protocolo === "P7" && f7.nota === "minha nota" && !f7.resumido,
    f7,
  );
  const f9 = await b.obter("9");
  checar(
    "aviso de sigilo marca o local como sigiloso, mantem o numero e apaga a especificacao",
    f9?.sigiloso === true && f9.protocolo === "P9" && !f9.especificacao,
    f9,
  );
  const so = novoRepo("C");
  await so.importar(env4.escopos[0]!);
  const apoio = { etiquetas: new Map(), resumo: () => undefined };
  checar("registro minimo sem copia local nao aparece na lista", filtrar(await so.todos(), {}, apoio).length === 0);
  const agora = Date.now();
  const lixo = novoRepo("D");
  await lixo.importar({
    favoritos: [
      {
        id: "x",
        protocolo: "",
        etiquetas: [],
        ordem: "a0",
        criadoEm: 1,
        atualizadoEm: agora,
        dispositivo: "A",
        removidoEm: agora,
        resumido: true,
      },
    ],
  });
  checar("nem na Lixeira (nao ha o que restaurar)", naLixeira(await lixo.todos(), agora).length === 0);
}
