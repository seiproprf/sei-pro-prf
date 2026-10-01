import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { instalarManterNoEnvio, lerProcessosDoEnvio } from "../src/pagina/enviar";
import { RepositorioFavoritos } from "../src/repositorio";
import { checar, disparar, escolher, instalarDom, secao, telaSei, tique } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarEnviar(): Promise<void> {
  secao("Enviar Processo: manter em favoritos");
  const { doc } = telaSei("sei41/p_procedimento_enviar.html");
  const procs = lerProcessosDoEnvio(doc);
  checar(
    "le o processo do formulario",
    procs.length === 1 && procs[0]!.id === "148265" && procs[0]!.protocolo === "99906.713-630.000032/2025-82",
    procs,
  );
  checar("e a especificacao", procs[0]?.especificacao?.startsWith("Processo de contrata") === true, procs);
  const area = areaMemoria();
  let t = 0;
  const repo = new RepositorioFavoritos(area, escoposDoContexto(CTX).unidade!, () => ({ agora: ++t, dispositivo: "X" }));
  await repo.criarPasta("Contratos");
  const ids = new Set<string>();
  const deps = {
    ativo: (id: string) => ids.has(id),
    adicionar: async (p: (typeof procs)[number]) => {
      ids.add(p.id);
      return repo.adicionar(p);
    },
    remover: async (lista: string[]) => {
      for (const id of lista) ids.delete(id);
      await repo.remover(lista);
    },
    editar: (id: string, m: Parameters<RepositorioFavoritos["editar"]>[1]) => repo.editar(id, m),
    obter: (id: string) => repo.obter(id),
    pastas: () => repo.pastasAtivas(),
    hoje: () => "2026-10-01",
  };
  const bloco = await instalarManterNoEnvio(doc, deps);
  checar("insere o bloco no formulario", !!bloco && doc.querySelector("#frmAtividadeListar")!.contains(bloco));
  checar("nao insere duas vezes", (await instalarManterNoEnvio(doc, deps)) === null);
  const caixa = bloco!.querySelector('input[type="checkbox"]') as HTMLInputElement;
  checar("desmarcada quando nao e favorito", !caixa.checked);
  const opcoes = bloco!.querySelector(".spro-fav-envio-opcoes") as HTMLElement;
  checar("opcoes escondidas sem a caixa", opcoes.hidden);
  caixa.checked = true;
  disparar(caixa, "change");
  await tique(20);
  checar("marcar favorita na hora", await repo.contem("148265"));
  checar("e mostra pasta e prazo", !opcoes.hidden);
  const pasta = opcoes.querySelector("select") as HTMLSelectElement;
  const idPasta = (await repo.pastasAtivas())[0]!.id;
  escolher(pasta, idPasta);
  await tique(20);
  checar("trocar a pasta grava", (await repo.obter("148265"))?.pasta === idPasta);
  const data = opcoes.querySelector('input[type="date"]') as HTMLInputElement;
  data.value = "2026-10-20";
  disparar(data, "change");
  await tique(20);
  const f = await repo.obter("148265");
  checar("prazo ate a data", f?.prazo?.vencimento?.em === "data" && f.prazo.vencimento.data === "2026-10-20", f?.prazo);
  escolher(opcoes.querySelector('select[aria-label="Lembrete"]') as HTMLSelectElement, "30");
  await tique(20);
  checar("lembrete rapido no envio", (await repo.obter("148265"))?.lembrete?.em === "2026-10-31");
  caixa.checked = false;
  disparar(caixa, "change");
  await tique(20);
  checar("desmarcar tira dos favoritos", !(await repo.contem("148265")));

  const ja = telaSei("sei41/p_procedimento_enviar.html").doc;
  ids.add("148265");
  const bloco2 = await instalarManterNoEnvio(ja, deps);
  checar("ja favorito: comeca marcada", (bloco2!.querySelector('input[type="checkbox"]') as HTMLInputElement).checked);
  checar("tela sem o formulario de envio: nada", (await instalarManterNoEnvio(instalarDom("<html><body></body></html>"), deps)) === null);
}
