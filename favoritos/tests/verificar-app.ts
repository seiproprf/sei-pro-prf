import { areaMemoria } from "@comum/armazenamento/area";
import { type AbrirModal, AppFavoritos, type DepsApp } from "../src/app/app";
import { chaveMigracao, chaveUltimaUnidade } from "../src/modelo/constantes";
import { escoposDoContexto } from "../src/modelo/escopo";
import { RepositorioFavoritos } from "../src/repositorio";
import { botao, checar, disparar, instalarDom, secao, tique } from "./util";
import { CTX } from "./verificar-modelo";

function montar(extra: Partial<DepsApp> = {}, inicial: Record<string, unknown> = {}) {
  const doc = instalarDom('<html><body><div id="app"></div></body></html>');
  const area = areaMemoria(inicial);
  const sync = areaMemoria();
  let t = 1000;
  const carimbo = () => ({ agora: ++t, dispositivo: "X" });
  const esc = escoposDoContexto(CTX);
  const repos = {
    unidade: new RepositorioFavoritos(area, esc.unidade!, carimbo),
    pessoal: new RepositorioFavoritos(area, esc.pessoal, carimbo),
  };
  const chamadas: Array<[string, unknown]> = [];
  const modais: Array<{ titulo: string; conteudo: HTMLElement; fechado: boolean }> = [];
  const baixados: string[] = [];
  const copiados: string[] = [];
  const abrirModal: AbrirModal = (o) => {
    const m = { titulo: o.titulo, conteudo: o.conteudo, fechado: false };
    modais.push(m);
    return {
      fechar: () => {
        m.fechado = true;
        o.aoFechar?.();
      },
    };
  };
  const deps: DepsApp = {
    rpc: {
      chamar: (async (op: string, args?: unknown) => {
        chamadas.push([op, args]);
        return op === "lerLegado" ? { local: null, arquivo: null } : true;
      }) as DepsApp["rpc"]["chamar"],
    },
    ctx: CTX,
    area,
    sync,
    repos,
    carimbo,
    abrirModal,
    confirmar: async () => true,
    baixar: (nome) => void baixados.push(nome),
    copiar: async (texto) => void copiados.push(texto),
    escolherArquivo: async () => null,
    hoje: () => "2026-10-01",
    ...extra,
  };
  const raiz = doc.getElementById("app")!;
  return { doc, raiz, area, repos, chamadas, modais, baixados, copiados, app: new AppFavoritos(raiz, deps) };
}

export async function verificarApp(): Promise<void> {
  secao("app montado: lista, abas e mudancas de outro contexto");
  const a = montar();
  await a.repos.unidade.adicionar({ id: "1", protocolo: "50300.000001/2026-01", tipo: "Fiscalização" });
  await a.repos.unidade.adicionar({ id: "2", protocolo: "50300.000002/2026-02", tipo: "Contrato" });
  await a.app.iniciar();
  const itens = () => a.raiz.querySelectorAll("li.fav-item").length;
  checar("lista os favoritos da unidade", itens() === 2, itens());
  checar("abas com contagem", !!botao(a.raiz, "GPF (2)") && !!botao(a.raiz, "Pessoal (0)"));
  await a.repos.unidade.adicionar({ id: "3", protocolo: "50300.000003/2026-03" });
  await tique(80);
  checar("favorito gravado pela estrela (outro contexto) aparece sozinho", itens() === 3);

  (a.raiz.querySelector('li[data-id="1"] .fav-protocolo') as HTMLElement).click();
  checar(
    "clicar no numero pede a aba para abrir",
    a.chamadas.some(([op, x]) => op === "abrirProcesso" && (x as { id: string }).id === "1"),
  );

  const busca = a.raiz.querySelector('input[type="search"]') as HTMLInputElement;
  busca.value = "contrato";
  disparar(busca, "input");
  await tique(220);
  checar("busca filtra", itens() === 1);
  busca.value = "";
  disparar(busca, "input");
  await tique(220);

  secao("app montado: selecao e lote");
  const sel = a.raiz.querySelector('li[data-id="2"] input.fav-sel') as HTMLInputElement;
  // No linkedom, `checked` não reflete o atributo: marca-se como o navegador faz.
  sel.checked = true;
  disparar(sel, "change");
  botao(a.raiz, "Copiar números")!.click();
  await tique();
  checar("copia os numeros selecionados", a.copiados.join() === "50300.000002/2026-02");
  botao(a.raiz, "Baixar CSV")!.click();
  checar("baixa o CSV com nome da lista e data", a.baixados.includes("favoritos-GPF-2026-10-01.csv"), a.baixados);
  botao(a.raiz, "Remover selecionados")!.click();
  await tique(80);
  checar("remover manda para a lixeira", !(await a.repos.unidade.contem("2")) && itens() === 2);
  checar("aviso com desfazer", !!botao(a.raiz, "Desfazer"));
  botao(a.raiz, "Desfazer")!.click();
  await tique(80);
  checar("desfazer devolve", (await a.repos.unidade.contem("2")) && itens() === 3);

  secao("app montado: editar");
  (a.raiz.querySelector('li[data-id="1"] .fav-titulo') as HTMLElement).click();
  const modal = a.modais[a.modais.length - 1]!;
  checar("editar abre o dialogo do processo", modal.titulo.includes("50300.000001/2026-01"));
  (modal.conteudo.querySelector('input[aria-label="Título"]') as HTMLInputElement).value = "Porto de Santos";
  botao(modal.conteudo, "Salvar")!.click();
  await tique(80);
  checar(
    "salvar grava e a lista mostra o titulo",
    (await a.repos.unidade.obter("1"))?.titulo === "Porto de Santos" && (a.raiz.textContent ?? "").includes("Porto de Santos"),
  );

  secao("app montado: Pessoal e lixeira");
  botao(a.raiz, "Pessoal (0)")!.click();
  await tique(80);
  checar("aba Pessoal vazia convida a usar a estrela", (a.raiz.querySelector(".fav-vazio")?.textContent ?? "").includes("estrela"));
  botao(a.raiz, "GPF (3)")!.click();
  await tique(80);
  botao(a.raiz, "Lixeira")!.click();
  await tique(20);
  checar("lixeira abre (vazia depois do desfazer)", (a.raiz.textContent ?? "").includes("A lixeira está vazia."));

  secao("app montado: troca de unidade");
  const b = montar({}, { [chaveUltimaUnidade(CTX.host, CTX.login.toLowerCase())]: { id: "999", sigla: "SFC" } });
  await b.app.iniciar();
  const faixa = b.raiz.querySelector(".fav-faixa")?.textContent ?? "";
  checar("faixa explica a troca de unidade", faixa.includes("GPF") && faixa.includes("SFC"), faixa);
  const c = montar({}, { [chaveUltimaUnidade(CTX.host, CTX.login.toLowerCase())]: { id: "110000001", sigla: "GPF" } });
  await c.app.iniciar();
  checar("mesma unidade, sem faixa", !c.raiz.querySelector(".fav-faixa"));

  secao("app montado: migracao dos favoritos antigos");
  const legado = { favorites: [{ id_procedimento: "70", processo: "70/2026", categoria: "Contratos" }] };
  const m = montar({
    rpc: { chamar: (async (op: string) => (op === "lerLegado" ? { local: legado, arquivo: null } : true)) as DepsApp["rpc"]["chamar"] },
  });
  await m.app.iniciar();
  const dlg = m.modais[0];
  checar("oferece trazer os antigos na primeira vez", dlg?.titulo === "Favoritos da versão anterior");
  botao(dlg!.conteudo, "Trazer para GPF")!.click();
  await tique(80);
  checar(
    "traz para a unidade e marca a migracao",
    (await m.repos.unidade.contem("70")) &&
      !!(await m.area.obter(chaveMigracao(CTX.host, "pedro.soares")))[chaveMigracao(CTX.host, "pedro.soares")],
  );
  const m2 = montar(
    { rpc: { chamar: (async (op: string) => (op === "lerLegado" ? { local: legado, arquivo: null } : true)) as DepsApp["rpc"]["chamar"] } },
    { [chaveMigracao(CTX.host, "pedro.soares")]: { adiadoEm: 1 } },
  );
  await m2.app.iniciar();
  checar("nao pergunta de novo depois de respondido", m2.modais.length === 0);
}
