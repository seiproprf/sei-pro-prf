import type { Etiqueta, Favorito, MudancasFavorito, Pasta } from "../src/modelo/tipos";
import { type DepsBalao, montarBalao } from "../src/pagina/balao";
import { botao, checar, disparar, escolher, instalarDom, secao, tique } from "./util";

export async function verificarBalao(): Promise<void> {
  instalarDom();
  secao("balao ao favoritar");
  const fav: Favorito = { id: "1", protocolo: "1/2026", etiquetas: [], ordem: "a0", criadoEm: 1, atualizadoEm: 1, dispositivo: "D" };
  const pasta: Pasta = { id: "pA", nome: "Contratos", ordem: "a0", atualizadoEm: 1, dispositivo: "D" };
  const et: Etiqueta = { id: "eA", nome: "Urgente", cor: "#ffe0b2", atualizadoEm: 1, dispositivo: "D" };
  const chamadas: Array<[string, unknown]> = [];
  let fechou = 0;
  let atual = fav;
  const deps: DepsBalao = {
    favorito: fav,
    lista: "unidade",
    siglaUnidade: "GPF",
    pastas: [pasta],
    etiquetas: [et],
    temaEscuro: false,
    editar: async (m) => {
      chamadas.push(["editar", m]);
      atual = { ...atual, ...m } as Favorito;
      return atual;
    },
    criarPasta: async (nome) => {
      chamadas.push(["criarPasta", nome]);
      return { ...pasta, id: "pB", nome };
    },
    criarEtiqueta: async (nome) => {
      chamadas.push(["criarEtiqueta", nome]);
      return { ...et, id: "eB", nome };
    },
    moverPara: async (l) => {
      chamadas.push(["mover", l]);
    },
    fechar: () => {
      fechou += 1;
    },
  };
  const ultimaEdicao = () => [...chamadas].reverse().find((c) => c[0] === "editar")?.[1] as MudancasFavorito | undefined;
  const el = montarBalao(deps);

  escolher(el.querySelector("select")!, "pA");
  await tique();
  checar("trocar a pasta grava", ultimaEdicao()?.pasta === "pA", ultimaEdicao());
  escolher(el.querySelector("select")!, "");
  await tique();
  checar("sem pasta grava vazio", !!ultimaEdicao() && "pasta" in ultimaEdicao()! && ultimaEdicao()?.pasta === undefined);

  const nomePasta = el.querySelector('input[aria-label="Nova pasta"]') as HTMLInputElement;
  nomePasta.value = "Licitações";
  botao(el, "Criar")!.click();
  await tique();
  checar(
    "nova pasta e criada e escolhida",
    chamadas.some((c) => c[0] === "criarPasta" && c[1] === "Licitações") && ultimaEdicao()?.pasta === "pB",
  );

  botao(el, "Urgente")!.click();
  await tique();
  checar("marcar etiqueta grava a lista", JSON.stringify(ultimaEdicao()?.etiquetas) === JSON.stringify(["eA"]));
  const nomeEtiqueta = el.querySelector('input[aria-label="Nova etiqueta"]') as HTMLInputElement;
  nomeEtiqueta.value = "Diligência";
  botao(el, "Adicionar")!.click();
  await tique();
  checar("nova etiqueta e criada e marcada", JSON.stringify(ultimaEdicao()?.etiquetas) === JSON.stringify(["eA", "eB"]), ultimaEdicao());

  const nota = el.querySelector("textarea")!;
  nota.value = "ligar amanhã";
  disparar(nota, "change");
  await tique();
  checar("nota grava ao sair do campo", ultimaEdicao()?.nota === "ligar amanhã");

  botao(el, "Pessoal")!.click();
  await tique();
  checar(
    "escolher a Pessoal move",
    chamadas.some((c) => c[0] === "mover" && c[1] === "pessoal"),
  );
  botao(el, "Pronto")!.click();
  checar("Pronto fecha", fechou === 1);
  checar("sem unidade nao oferece a troca de lista", !botao(montarBalao({ ...deps, siglaUnidade: null }), "Pessoal"));
}
