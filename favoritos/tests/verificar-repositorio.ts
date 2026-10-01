import { areaMemoria } from "@comum/armazenamento/area";
import { PALETA } from "../src/modelo/cores";
import { escoposDoContexto } from "../src/modelo/escopo";
import { porOrdem } from "../src/modelo/operacoes";
import { gravarPreferencias, lerPreferencias } from "../src/preferencias";
import { moverEntreListas, RepositorioFavoritos } from "../src/repositorio";
import { checar, secao } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarRepositorio(): Promise<void> {
  const area = areaMemoria();
  let relogio = 1000;
  const carimboA = () => ({ agora: ++relogio, dispositivo: "A" });
  const esc = escoposDoContexto(CTX);
  const repo = new RepositorioFavoritos(area, esc.unidade!, carimboA);
  const pessoal = new RepositorioFavoritos(area, esc.pessoal, carimboA);

  secao("repositorio: adicionar e remover");
  await repo.adicionar({ id: "1", protocolo: "1/2026", tipo: "T" });
  await repo.adicionar({ id: "2", protocolo: "2/2026" });
  const p1 = await repo.obter("1");
  const p2 = await repo.obter("2");
  checar("o segundo vai para o fim da ordem manual", !!p1 && !!p2 && p1.ordem < p2.ordem, [p1?.ordem, p2?.ordem]);
  checar("listas isoladas por escopo", (await pessoal.ativos()).length === 0 && (await repo.ativos()).length === 2);
  await repo.editar("1", { pasta: "px", nota: "lembrar", etiquetas: ["e1", "e1", "e2"] });
  checar("etiquetas sem repeticao", (await repo.obter("1"))?.etiquetas.join() === "e1,e2");
  checar("remover devolve quantos removeu", (await repo.remover(["1", "nao-existe"])) === 1);
  checar("removido sai dos ativos e vira lapide", !(await repo.contem("1")) && (await repo.obter("1"))?.removidoEm !== undefined);
  const volta = await repo.adicionar({ id: "1", protocolo: "1/2026" });
  checar(
    "re-favoritar devolve pasta e nota, no fim da lista",
    volta.pasta === "px" && volta.nota === "lembrar" && volta.removidoEm === undefined && volta.ordem > (p2?.ordem ?? ""),
    volta,
  );
  await repo.editar("1", { nota: "", titulo: "   " });
  const semNota = await repo.obter("1");
  checar("nota e titulo vazios somem", !!semNota && !("nota" in semNota) && !("titulo" in semNota));
  await repo.adicionar({ id: "2", protocolo: "2/2026", especificacao: "segredo", sigiloso: true });
  await repo.adicionar({ id: "2", protocolo: "2/2026", especificacao: "vazou?" });
  const s = await repo.obter("2");
  checar("sigilo desconhecido mantem o sigilo de antes", s?.sigiloso === true && s.especificacao === undefined, s);

  secao("repositorio: ordem manual");
  await repo.adicionar({ id: "3", protocolo: "3/2026" });
  await repo.mover("3", null, "2");
  const ordemIds = (await repo.ativos())
    .sort(porOrdem)
    .map((f) => f.id)
    .join();
  checar("mover para o topo grava so o movido", ordemIds === "3,2,1", ordemIds);

  secao("repositorio: pastas e etiquetas");
  const pasta = await repo.criarPasta("Contratos");
  checar("pasta repetida devolve a existente", (await repo.criarPasta(" contratos ")).id === pasta.id);
  await repo.editar("2", { pasta: pasta.id });
  await repo.removerPasta(pasta.id);
  checar(
    "remover pasta tira a pasta dos favoritos",
    (await repo.obter("2"))?.pasta === undefined && (await repo.pastasAtivas()).length === 0,
  );
  const et = await repo.criarEtiqueta("Urgente");
  checar("etiqueta nova ganha cor da paleta", PALETA.includes(et.cor));
  await repo.editar("3", { etiquetas: [et.id] });
  await repo.removerEtiqueta(et.id);
  checar("remover etiqueta tira dos favoritos", (await repo.obter("3"))?.etiquetas.length === 0);

  secao("repositorio: importar mescla");
  const atual3 = (await repo.obter("3"))!;
  const r = await repo.importar({
    favoritos: [
      { ...atual3, titulo: "velho", atualizadoEm: 1 },
      { ...atual3, id: "4", protocolo: "4/2026" },
    ],
  });
  checar(
    "importar nao pisa edicao mais nova e traz o novo",
    r.novos === 1 && r.atualizados === 0 && (await repo.obter("3"))?.titulo === undefined,
    r,
  );

  secao("repositorio: lapides antigas");
  await repo.limpar(relogio + 91 * 86_400_000);
  checar(
    "limpeza apaga lapide com mais de 90 dias",
    (await repo.pastas.listar()).length === 0 && (await repo.etiquetas.listar()).length === 0,
  );

  secao("repositorio: duas escritas ao mesmo tempo (Review Focus 3)");
  const repoB = new RepositorioFavoritos(area, esc.unidade!, () => ({ agora: ++relogio, dispositivo: "B" }));
  await Promise.all([repo.adicionar({ id: "10", protocolo: "10/2026" }), repoB.adicionar({ id: "11", protocolo: "11/2026" })]);
  checar("itens diferentes gravados juntos: nenhum se perde", (await repo.contem("10")) && (await repo.contem("11")));
  await Promise.all([repo.editar("10", { nota: "de A" }), repoB.editar("10", { titulo: "de B" })]);
  const final = await repo.obter("10");
  const ativos = (await repo.ativos()).length;
  checar(
    "mesmo item: uma versao inteira vence e a lista fica intacta",
    !!final && (final.nota === "de A") !== (final.titulo === "de B") && ativos === 6,
    { final, ativos },
  );

  secao("repositorio: mover entre listas");
  await repo.editar("11", { titulo: "Pessoal!", pasta: "zz", nota: "n" });
  const movido = await moverEntreListas(repo, pessoal, "11");
  checar(
    "vai para a Pessoal com titulo e nota, sem a pasta da unidade",
    movido?.titulo === "Pessoal!" &&
      movido.nota === "n" &&
      movido.pasta === undefined &&
      !(await repo.contem("11")) &&
      (await pessoal.contem("11")),
    movido,
  );

  secao("repositorio: aviso de mudanca");
  let avisos = 0;
  const parar = repo.aoMudar(() => (avisos += 1));
  await repo.editar("10", { titulo: "x" });
  parar();
  await repo.editar("10", { titulo: "y" });
  checar("aoMudar avisa e para", avisos === 1, avisos);

  secao("repositorio: instantaneo numa leitura so");
  const inst = await repo.instantaneo();
  const separado = { f: (await repo.todos()).length, p: (await repo.pastasAtivas()).length, e: (await repo.etiquetasAtivas()).length };
  checar(
    "instantaneo traz favoritos (com lapides), pastas e etiquetas ativas",
    inst.todos.length === separado.f && inst.pastas.length === separado.p && inst.etiquetas.length === separado.e,
    { inst: [inst.todos.length, inst.pastas.length, inst.etiquetas.length], separado },
  );

  secao("preferencias");
  const sync = areaMemoria();
  checar("padrao quando nada foi gravado", (await lerPreferencias(sync)).exibir === "abaixo");
  await gravarPreferencias(sync, { recolhido: true });
  const pref = await lerPreferencias(sync);
  checar("grava so o que mudou e mantem o resto", pref.recolhido && pref.perguntarAoFavoritar && pref.ordem === "manual", pref);
}
