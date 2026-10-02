import { criarFiltros, type EstadoFiltros } from "../src/app/componentes/filtros";
import { type AcoesItem, renderItem } from "../src/app/componentes/item";
import { renderLista } from "../src/app/componentes/lista";
import { dataHora, quando } from "../src/modelo/dias";
import type { Contagens } from "../src/modelo/operacoes";
import type { Visita } from "../src/modelo/tipos";
import { botao, checar, combo, disparar, escolherCombo, instalarDom, itemDoMenu, opcoesDoCombo, secao } from "./util";

const AGORA = new Date(2026, 9, 2, 15, 0).getTime();
const visita = (x: Partial<Visita> & { id: string }): Visita => ({
  protocolo: `${x.id}/2026`,
  unidades: [{ id: "u1", sigla: "ANTAQ/SFIS" }],
  primeira: new Date(2026, 8, 20, 9, 5).getTime(),
  ultima: AGORA - 3_600_000,
  vezes: 1,
  ...x,
});
const contagens = (x: Partial<Contagens> = {}): Contagens => ({
  periodos: new Map([["hoje", 3]]),
  tipos: new Map([
    ["Licitação", 2],
    ["Contrato", 5],
  ]),
  unidades: new Map(),
  interessados: new Map(),
  assuntos: new Map(),
  situacoes: new Map([["publico", 4]]),
  ...x,
});

export function verificarComponentes(): void {
  instalarDom();
  secao("componentes: filtros");
  const pedidos: string[] = [];
  const estado = (x: Partial<EstadoFiltros> = {}): EstadoFiltros => ({
    filtro: { busca: "x" },
    ordem: "recentes",
    agrupar: true,
    contagens: contagens(),
    favoritosAtivo: false,
    ...x,
  });
  const barra = criarFiltros(estado(), {
    filtrar: (f) => pedidos.push(`f:${JSON.stringify(f)}`),
    ordenar: (o) => pedidos.push(`o:${o}`),
    agrupar: (v) => pedidos.push(`g:${v}`),
  });
  document.body.append(barra.el, barra.ativos);
  for (const r of ["Período", "Tipo", "Unidade", "Interessado", "Assunto", "Situação", "Ordem"])
    checar(`seletor ${r}`, !!combo(barra.el, r));
  checar(
    "tipos por contagem decrescente",
    opcoesDoCombo(barra.el, "Tipo").join() === "Contrato,Licitação",
    opcoesDoCombo(barra.el, "Tipo"),
  );
  checar(
    "periodo: as 5 sempre, na ordem",
    opcoesDoCombo(barra.el, "Período").join() === "hoje,ontem,7dias,30dias,antigos",
    opcoesDoCombo(barra.el, "Período"),
  );
  checar(
    "situacao sem favoritos e sem raras",
    opcoesDoCombo(barra.el, "Situação").join() === "publico",
    opcoesDoCombo(barra.el, "Situação"),
  );
  barra.atualizar(
    estado({
      favoritosAtivo: true,
      contagens: contagens({
        situacoes: new Map([
          ["sigiloso", 1],
          ["repetidos", 2],
        ]),
      }),
    }),
  );
  checar(
    "situacao com favoritos e raras existentes",
    opcoesDoCombo(barra.el, "Situação").join() === "favoritos,foraFavoritos,repetidos,publico,sigiloso",
    opcoesDoCombo(barra.el, "Situação"),
  );
  escolherCombo(barra.el, "Tipo", "Licitação");
  checar("escolher tipo filtra mantendo a busca", pedidos[0] === 'f:{"busca":"x","tipos":["Licitação"]}', pedidos);
  barra.atualizar(estado({ filtro: { busca: "x", tipos: ["Licitação"] } }));
  const ficha = barra.ativos.querySelector(".spro-lista-ficha");
  checar("ficha do filtro", ficha?.textContent?.includes("Licitação") === true && !barra.ativos.hidden);
  pedidos.length = 0;
  (ficha as HTMLElement).click();
  checar("clicar na ficha tira o tipo", pedidos[0] === 'f:{"busca":"x"}', pedidos);
  barra.atualizar(estado({ filtro: { busca: "x", tipos: ["Licitação"], periodos: ["hoje"] } }));
  pedidos.length = 0;
  botao(barra.ativos, "Limpar filtros")!.click();
  checar("limpar filtros mantem a busca", pedidos[0] === 'f:{"busca":"x"}', pedidos);
  escolherCombo(barra.el, "Ordem", "visitados");
  const ag = botao(barra.el, "Agrupar por dia")!;
  checar("agrupar tem aria-pressed", ag.getAttribute("aria-pressed") === "true");
  ag.click();
  checar("ordem e agrupar pedidos", pedidos.slice(-2).join() === "o:visitados,g:false", pedidos);
  checar("agrupar visivel em recentes", !ag.hidden);
  barra.atualizar(estado({ ordem: "visitados" }));
  checar("agrupar some fora de recentes", ag.hidden === true);
  barra.el.remove();
  barra.ativos.remove();

  secao("componentes: item");
  const feito: string[] = [];
  const acoes: AcoesItem = {
    abrir: (v, n) => feito.push(`abrir:${v.id}:${n}`),
    alternarSelecao: (v, m) => feito.push(`sel:${v.id}:${m}`),
    alternarFavorito: (v) => feito.push(`fav:${v.id}`),
    copiar: (v) => feito.push(`copiar:${v.id}`),
    remover: (v) => feito.push(`remover:${v.id}`),
  };
  const v1 = visita({
    id: "1",
    protocolo: "50300.000001/2026-01",
    tipo: "Licitação",
    especificacao: "Pregão 1",
    vezes: 3,
    interessados: ["ACME", "Beta", "Gama"],
    nivel: "restrito",
  });
  const li = renderItem(v1, { agora: AGORA, selecionado: false, favorito: false }, acoes);
  document.body.append(li);
  const num = li.querySelector(".spro-lista-protocolo") as HTMLElement;
  num.click();
  const Ev = (num.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  const ctrl = new Ev("click", { bubbles: true, cancelable: true });
  Object.defineProperty(ctrl, "ctrlKey", { value: true });
  num.dispatchEvent(ctrl);
  checar("abrir e ctrl abre em outra aba", feito.join() === "abrir:1:false,abrir:1:true", feito);
  const caixa = li.querySelector("input.spro-lista-sel") as HTMLInputElement;
  checar("caixa com aria-label", caixa.getAttribute("aria-label") === "Selecionar 50300.000001/2026-01");
  caixa.checked = true;
  disparar(caixa, "change");
  const est = li.querySelector("button.spro-lista-estrela") as HTMLElement;
  checar(
    "estrela favoritar",
    est.getAttribute("aria-label") === "Favoritar 50300.000001/2026-01" && est.getAttribute("aria-pressed") === "false",
  );
  est.click();
  checar("selo restrito", li.querySelector(".spro-lista-selo")?.textContent?.includes("restrito") === true);
  const apoio = li.querySelector(".spro-lista-apoio")?.textContent ?? "";
  checar(
    "apoio: quando, visitas, sigla, interessados",
    [quando(v1.ultima, AGORA), "3 visitas", "ANTAQ/SFIS", "ACME, Beta +1"].every((t) => apoio.includes(t)),
    apoio,
  );
  checar(
    "title com primeira visita",
    (li.getAttribute("title") ?? "").includes(`Primeira visita: ${dataHora(v1.primeira)}`),
    li.getAttribute("title"),
  );
  checar(
    "principal com tipo e especificacao",
    li.querySelector(".spro-lista-tipo")?.textContent === "Licitação" && li.querySelector(".spro-lista-esp")?.textContent === "Pregão 1",
  );
  const menu = "Mais ações para 50300.000001/2026-01";
  itemDoMenu(li, menu, "Abrir em outra aba");
  itemDoMenu(li, menu, "Copiar número");
  itemDoMenu(li, menu, "Favoritar");
  itemDoMenu(li, menu, "Remover do histórico");
  checar("acoes do item", feito.slice(2).join() === "sel:1:true,fav:1,abrir:1:true,copiar:1,fav:1,remover:1", feito);
  li.remove();

  const li2 = renderItem(
    visita({ id: "2", nivel: "sigiloso", tipo: "Processo X", especificacao: "segredo" }),
    { agora: AGORA, selecionado: true, favorito: null },
    acoes,
  );
  document.body.append(li2);
  checar("sem estrela com favorito null", !li2.querySelector(".spro-lista-estrela"));
  checar("selo sigiloso", li2.querySelector(".spro-lista-selo")?.textContent?.includes("sigiloso") === true);
  checar("selecionado", li2.classList.contains("spro-lista-item-selecionado"));
  checar("sem 'visitas' com 1 so", !(li2.querySelector(".spro-lista-apoio")?.textContent ?? "").includes("visita"));
  checar("sigiloso mostra so o tipo", !(li2.textContent ?? "").includes("segredo"));
  checar("menu sem favoritar com Favoritos inativo", !itemDoMenu(li2, "Mais ações para 2/2026", "Favoritar"));
  li2.remove();
  const li3 = renderItem(visita({ id: "3" }), { agora: AGORA, selecionado: false, favorito: true }, acoes);
  checar("estrela marcada", li3.querySelector(".spro-lista-estrela")?.getAttribute("aria-label") === "Tirar 3/2026 dos favoritos");
  checar("sem descricao", li3.querySelector(".spro-lista-principal")?.textContent?.includes("(sem descrição)") === true);

  secao("componentes: lista");
  let mais = 0;
  const base = {
    agora: AGORA,
    selecao: new Set<string>(),
    favoritos: null,
    acoes,
    mostrarMais: () => mais++,
  };
  const dia = 86_400_000;
  const duas = [visita({ id: "a" }), visita({ id: "b", ultima: AGORA - 2 * dia })];
  const agr = renderLista(duas, { ...base, agrupar: true, visiveis: 200 });
  const cab = [...agr.querySelectorAll(".spro-lista-grupo")].map((e) => e.textContent?.replace(/\s+/g, " ").trim());
  checar("cabecalhos de grupo", cab.join() === "Hoje · 1,Últimos 7 dias · 1", cab);
  const plana = renderLista(duas, { ...base, agrupar: false, visiveis: 200 });
  checar("sem grupo, sem cabecalho", plana.querySelectorAll(".spro-lista-grupo").length === 0 && plana.querySelectorAll("li").length === 2);
  const muitas = Array.from({ length: 250 }, (_, i) => visita({ id: String(i) }));
  const l = renderLista(muitas, { ...base, agrupar: false, visiveis: 200 });
  const bm = l.querySelector("button.spro-lista-mais") as HTMLElement;
  checar(
    "200 itens e Mostrar mais 50",
    l.querySelectorAll("li.spro-lista-item").length === 200 && bm?.textContent?.includes("Mostrar mais 50") === true,
    bm?.textContent,
  );
  bm.click();
  checar("mostrar mais chama", mais === 1);
  const g = renderLista(muitas, { ...base, agrupar: true, visiveis: 200 });
  checar("agrupado tambem limita em 200", g.querySelectorAll("li.spro-lista-item").length === 200);
}
