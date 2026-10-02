import type { Etiqueta, Favorito, MudancasFavorito, Pasta } from "../src/modelo/tipos";
import { type DepsBalao, montarBalao } from "../src/pagina/balao";
import { botao, checar, combo, disparar, escolherCombo, instalarDom, secao, tique } from "./util";

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
  document.body.append(el);

  escolherCombo(el, "Pasta", "pA");
  await tique();
  checar("trocar a pasta grava", ultimaEdicao()?.pasta === "pA", ultimaEdicao());
  escolherCombo(el, "Pasta", "");
  await tique();
  checar("sem pasta grava vazio", !!ultimaEdicao() && "pasta" in ultimaEdicao()! && ultimaEdicao()?.pasta === undefined);

  // Pasta nova: digita no seletor e escolhe "Criar".
  combo(el, "Pasta")!.click();
  const buscaPasta = document.querySelector(".spro-combo-pop input.spro-combo-busca") as HTMLInputElement;
  buscaPasta.value = "Licitações";
  disparar(buscaPasta, "input");
  (document.querySelector(".spro-combo-pop .spro-combo-criar") as HTMLElement).click();
  await tique(20);
  checar(
    "nova pasta e criada e escolhida",
    chamadas.some((c) => c[0] === "criarPasta" && c[1] === "Licitações") && ultimaEdicao()?.pasta === "pB",
    ultimaEdicao(),
  );

  escolherCombo(el, "Etiquetas", "eA");
  await tique();
  checar("marcar etiqueta grava a lista", JSON.stringify(ultimaEdicao()?.etiquetas) === JSON.stringify(["eA"]));
  checar("a etiqueta marcada vira ficha", !!botao(el, "Tirar a etiqueta Urgente"));
  combo(el, "Etiquetas")!.click();
  const buscaEt = document.querySelector(".spro-combo-pop input.spro-combo-busca") as HTMLInputElement;
  buscaEt.value = "Diligência";
  disparar(buscaEt, "input");
  (document.querySelector(".spro-combo-pop .spro-combo-criar") as HTMLElement).click();
  await tique(20);
  combo(el, "Etiquetas")!.click();
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
  const comLembrete = montarBalao({ ...deps, hoje: "2026-10-01" });
  document.body.append(comLembrete);
  escolherCombo(comLembrete, "Lembrete", "7");
  await tique();
  const ultimoL = chamadas.at(-1)?.[1] as { lembrete?: { em: string } } | undefined;
  checar("lembrete rapido no balao (em 1 semana)", ultimoL?.lembrete?.em === "2026-10-08", chamadas.at(-1));
}
