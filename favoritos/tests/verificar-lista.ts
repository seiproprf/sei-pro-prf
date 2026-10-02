import { criarFiltros, type EstadoFiltros, renderLote } from "../src/app/componentes/filtros";
import { type AcoesItem, type ApoioItem, renderItem } from "../src/app/componentes/item";
import { renderLista, vizinhosAoMover, vizinhosAoSoltar } from "../src/app/componentes/lista";
import { gerarCsv, linhasCsv } from "../src/app/csv";
import type { Etiqueta, Favorito, Pasta } from "../src/modelo/tipos";
import { botao, checar, combo, disparar, escolherCombo, instalarDom, itemDoMenu, opcoesDoCombo, secao } from "./util";

const fav = (x: Partial<Favorito> & { id: string }): Favorito => ({
  protocolo: `${x.id}/2026`,
  etiquetas: [],
  ordem: `a${x.id}`,
  criadoEm: 1,
  atualizadoEm: 1,
  dispositivo: "D",
  ...x,
});

export function verificarLista(): void {
  instalarDom();
  const pasta: Pasta = { id: "p1", nome: "Contratos", ordem: "a0", atualizadoEm: 1, dispositivo: "D" };
  const et: Etiqueta = { id: "e1", nome: "Urgente", cor: "#ffe0b2", atualizadoEm: 1, dispositivo: "D" };
  const removida: Etiqueta = { ...et, id: "e2", nome: "Velha", removidoEm: 5 };
  const pastas = new Map([[pasta.id, pasta]]);
  const etiquetas = new Map([
    [et.id, et],
    [removida.id, removida],
  ]);
  const feito: string[] = [];
  const acoes: AcoesItem = {
    abrir: (f, nova) => feito.push(`abrir:${f.id}:${nova}`),
    editar: (f) => feito.push(`editar:${f.id}`),
    alternarSelecao: (f, m) => feito.push(`sel:${f.id}:${m}`),
    remover: (f) => feito.push(`remover:${f.id}`),
    moverLista: (f) => feito.push(`lista:${f.id}`),
    moverOrdem: (f, d) => feito.push(`ordem:${f.id}:${d}`),
  };
  const apoio = (x: Partial<ApoioItem> = {}): ApoioItem => ({
    pastas,
    etiquetas,
    selecionado: false,
    arrastavel: false,
    outraLista: "Pessoal",
    ...x,
  });

  secao("app: item");
  const f1 = fav({
    id: "1",
    protocolo: "50300.000001/2026-01",
    tipo: "Fiscalização",
    especificacao: "Porto",
    pasta: "p1",
    etiquetas: ["e1", "e2"],
    nota: "ligar",
  });
  const li = renderItem(f1, apoio({ resumo: { situacao: "atrasado", texto: "2 dias de atraso", dica: "d", ordem: -2 } }), acoes);
  checar(
    "protocolo e titulo pelo tipo e especificacao",
    li.querySelector(".fav-protocolo")?.textContent === "50300.000001/2026-01" &&
      li.querySelector(".fav-titulo")?.textContent === "Fiscalização · Porto",
  );
  checar(
    "pasta e so as etiquetas vivas",
    li.querySelector(".fav-pasta")?.textContent === "Contratos" && li.querySelectorAll(".fav-etiqueta").length === 1,
  );
  checar("prazo com a classe da situacao", li.querySelector(".fav-prazo-atrasado")?.textContent === "2 dias de atraso");
  checar("nota indicada com o texto no title", li.querySelector(".fav-nota")?.getAttribute("title") === "ligar");
  (li.querySelector(".fav-protocolo") as HTMLElement).click();
  (li.querySelector(".fav-titulo") as HTMLElement).click();
  const sel = li.querySelector("input.fav-sel") as HTMLInputElement;
  // No linkedom, `checked` não reflete o atributo: marca-se como o navegador faz.
  sel.checked = true;
  disparar(sel, "change");
  const menu = "Mais ações para 50300.000001/2026-01";
  itemDoMenu(li, menu, "Mover para Pessoal");
  itemDoMenu(li, menu, "Mover para cima");
  itemDoMenu(li, menu, "Remover");
  checar("acoes do item", feito.join() === "abrir:1:false,editar:1,sel:1:true,lista:1,ordem:1:-1,remover:1", feito);
  checar(
    "titulo do usuario vence e sem descricao ha aviso",
    renderItem(fav({ id: "2", titulo: "Meu" }), apoio(), acoes).querySelector(".fav-titulo")?.textContent === "Meu" &&
      renderItem(fav({ id: "3" }), apoio(), acoes).querySelector(".fav-titulo")?.textContent === "(sem descrição)",
  );
  checar(
    "sem outra lista nao oferece mover",
    !itemDoMenu(renderItem(fav({ id: "4" }), apoio({ outraLista: null }), acoes), "Mais ações para 4/2026", "Mover para Pessoal"),
  );
  checar("atrasado pinta a faixa do item", li.getAttribute("data-estado") === "atrasado");
  checar(
    "menu do item tem icone em cada acao",
    (() => {
      const b = li.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]')!;
      b.click();
      const itens = [...document.querySelectorAll(".spro-menu-pop [role='menuitem']")];
      const ok = itens.length > 4 && itens.every((i) => !!i.querySelector("svg"));
      b.click();
      return ok;
    })(),
  );
  checar(
    "sigiloso sinalizado",
    renderItem(fav({ id: "5", sigiloso: true }), apoio(), acoes).querySelector(".fav-selo")?.textContent === "sigiloso",
  );

  secao("app: lista");
  checar(
    "vazia mostra o convite",
    renderLista({ itens: [], agrupar: false, pastas: [], apoio: () => apoio(), acoes, vazio: "Nada aqui" }).textContent === "Nada aqui",
  );
  const itens = [fav({ id: "1", pasta: "p1" }), fav({ id: "2" }), fav({ id: "3", pasta: "p1" })];
  const grupos = renderLista({ itens, agrupar: true, pastas: [pasta], apoio: () => apoio(), acoes, vazio: "" });
  checar(
    "agrupada: pasta primeiro, sem pasta por ultimo, com contagem",
    [...grupos.querySelectorAll("h3")]
      .map((x) => `${x.querySelector(".fav-grupo-nome")?.textContent} (${x.querySelector(".fav-grupo-conta")?.textContent})`)
      .join("|") === "Contratos (2)|Sem pasta (1)",
  );
  const arrastavel = renderLista({
    itens,
    agrupar: false,
    pastas: [],
    apoio: () => apoio({ arrastavel: true }),
    acoes,
    reordenar: () => undefined,
    vazio: "",
  });
  checar("modo manual: itens arrastaveis", arrastavel.querySelectorAll('li[draggable="true"]').length === 3);
  const ids = ["a", "b", "c", "d"];
  checar("soltar antes de c", JSON.stringify(vizinhosAoSoltar(ids, "a", "c", false)) === JSON.stringify(["b", "c"]));
  checar("soltar depois de d", JSON.stringify(vizinhosAoSoltar(ids, "a", "d", true)) === JSON.stringify(["d", null]));
  checar("mover para cima", JSON.stringify(vizinhosAoMover(ids, "c", -1)) === JSON.stringify(["a", "b"]));
  checar("mover o primeiro para cima nao faz nada", vizinhosAoMover(ids, "a", -1) === null);
  checar("mover para baixo", JSON.stringify(vizinhosAoMover(ids, "b", 1)) === JSON.stringify(["c", "d"]));

  secao("app: filtros e lote");
  const pedidos: string[] = [];
  const estado = (x: Partial<EstadoFiltros> = {}): EstadoFiltros => ({
    filtro: {},
    ordem: "manual",
    agrupar: false,
    pastas: [pasta],
    etiquetas: [et],
    contagens: { pastas: new Map([["p1", 2]]), etiquetas: new Map(), prazos: new Map([["atrasado", 1]]), situacoes: new Map() },
    ...x,
  });
  const barraFiltros = criarFiltros(estado(), {
    filtrar: (f) => pedidos.push(`f:${JSON.stringify(f)}`),
    ordenar: (m) => pedidos.push(`o:${m}`),
    agrupar: (v) => pedidos.push(`g:${v}`),
  });
  const filtros = barraFiltros.el;
  document.body.append(filtros, barraFiltros.ativos);
  escolherCombo(filtros, "Pasta", "p1");
  escolherCombo(filtros, "Ordem", "prazo");
  botao(filtros, "Agrupar por pasta")!.click();
  checar("filtros pedem o que o usuario escolheu", pedidos.join() === 'f:{"pastas":["p1"]},o:prazo,g:true', pedidos);
  checar(
    "prazo: as comuns sempre, as raras so quando existem",
    opcoesDoCombo(filtros, "Prazo").join() === "atrasado,hoje,noPrazo,semPrazo",
    opcoesDoCombo(filtros, "Prazo"),
  );
  barraFiltros.atualizar(estado({ filtro: { pastas: ["p1"], prazos: ["aguardando"] } }));
  checar("seletor mostra a escolha", (combo(filtros, "Pasta")?.textContent ?? "").includes("Contratos"));
  checar(
    "a rara escolhida aparece mesmo sem itens (para poder desmarcar)",
    opcoesDoCombo(filtros, "Prazo").join() === "atrasado,hoje,noPrazo,aguardando,semPrazo",
    opcoesDoCombo(filtros, "Prazo"),
  );
  checar("filtros ligados viram fichas", barraFiltros.ativos.querySelectorAll(".fav-ficha").length === 2 && !barraFiltros.ativos.hidden);
  pedidos.length = 0;
  botao(barraFiltros.ativos, "Tirar o filtro Contratos")!.click();
  botao(barraFiltros.ativos, "Limpar filtros")!.click();
  checar("tirar uma ficha e limpar tudo", pedidos.join() === 'f:{"prazos":["aguardando"]},f:{}', pedidos);
  filtros.remove();
  barraFiltros.ativos.remove();
  const lote: string[] = [];
  const barra = renderLote(2, [pasta], [et], {
    moverPasta: (id) => lote.push(`p:${id}`),
    etiquetar: (id) => lote.push(`e:${id}`),
    copiar: () => lote.push("copiar"),
    csv: () => lote.push("csv"),
    remover: () => lote.push("remover"),
    limpar: () => lote.push("limpar"),
    marcarVistos: () => lote.push("vistos"),
    outraLista: { rotulo: "Pessoal", mover: () => lote.push("lista") },
  });
  checar("contagem", barra.textContent?.includes("2 selecionados") === true);
  escolherCombo(barra, "Mover para pasta", "__sem__");
  escolherCombo(barra, "Etiquetar", "e1");
  checar("seletor de acao volta ao rotulo", (combo(barra, "Etiquetar")?.textContent ?? "").includes("Etiquetar"));
  for (const r of ["Mover para Pessoal", "Copiar números", "Baixar CSV", "Remover selecionados", "Limpar seleção"])
    botao(barra, r)!.click();
  checar("acoes em lote", lote.join() === "p:undefined,e:e1,lista,copiar,csv,remover,limpar", lote);

  secao("app: CSV");
  const csv = gerarCsv([
    ["Processo", "Nota"],
    ["1/2026", 'disse "ok"; depois'],
    ["2/2026", "=HYPERLINK(1)"],
  ]);
  checar("BOM, separador ; e aspas escapadas", csv.startsWith("﻿Processo;Nota\r\n") && csv.includes('"disse ""ok""; depois"'));
  checar("celula que parece formula e neutralizada", csv.includes("'=HYPERLINK(1)"));
  const linhas = linhasCsv([f1], { pastas, etiquetas, resumo: () => undefined, lista: "GPF" });
  checar(
    "linhas do CSV",
    linhas.length === 2 && linhas[1]?.[4] === "Contratos" && linhas[1]?.[5] === "Urgente" && linhas[1]?.[9] === "GPF",
    linhas,
  );
}
