import { h, icone } from "@comum/ui/dom";
import type { Etiqueta, Pasta } from "../../modelo/tipos";

export interface DepsGerenciar {
  listar(): Promise<{ pastas: Pasta[]; etiquetas: Etiqueta[] }>;
  criarPasta(nome: string): Promise<unknown>;
  editarPasta(id: string, m: Partial<Pick<Pasta, "nome" | "cor">>): Promise<void>;
  removerPasta(id: string): Promise<void>;
  criarEtiqueta(nome: string): Promise<unknown>;
  editarEtiqueta(id: string, m: Partial<Pick<Etiqueta, "nome" | "cor">>): Promise<void>;
  removerEtiqueta(id: string): Promise<void>;
  confirmar(texto: string): Promise<boolean>;
}

/** Renomear, trocar a cor e excluir pastas e etiquetas desta lista. Redesenha a cada ação. */
export async function montarGerenciar(d: DepsGerenciar): Promise<HTMLElement> {
  const raiz = h("div", { class: "fav-form" });
  const acao = (fazer: () => Promise<unknown>) => async () => {
    await fazer();
    await desenhar();
  };
  const linha = (tipo: "pasta" | "etiqueta", item: { id: string; nome: string; cor?: string }) => {
    const nome = h("input", { class: "spro-campo", value: item.nome, maxlength: "60", "aria-label": `Nome da ${tipo} ${item.nome}` });
    nome.addEventListener(
      "change",
      acao(() => (tipo === "pasta" ? d.editarPasta(item.id, { nome: nome.value }) : d.editarEtiqueta(item.id, { nome: nome.value }))),
    );
    const cor = h("input", { type: "color", value: item.cor ?? "#bfd5e8", "aria-label": `Cor da ${tipo} ${item.nome}` });
    cor.addEventListener(
      "change",
      acao(() => (tipo === "pasta" ? d.editarPasta(item.id, { cor: cor.value }) : d.editarEtiqueta(item.id, { cor: cor.value }))),
    );
    const aviso =
      tipo === "pasta"
        ? `Excluir a pasta "${item.nome}"? Os favoritos dela ficam sem pasta.`
        : `Excluir a etiqueta "${item.nome}"? Ela sai de todos os favoritos.`;
    const excluir = h(
      "button",
      {
        type: "button",
        class: "spro-botao-icone",
        "aria-label": `Excluir a ${tipo} ${item.nome}`,
        title: "Excluir",
        onclick: acao(async () => {
          if (await d.confirmar(aviso)) await (tipo === "pasta" ? d.removerPasta(item.id) : d.removerEtiqueta(item.id));
        }),
      },
      icone("lixeira", 16),
    );
    return h("div", { class: "linha" }, nome, cor, excluir);
  };
  const criar = (tipo: "pasta" | "etiqueta") => {
    const nome = h("input", {
      class: "spro-campo",
      placeholder: tipo === "pasta" ? "Nova pasta" : "Nova etiqueta",
      "aria-label": tipo === "pasta" ? "Nova pasta" : "Nova etiqueta",
    });
    const botao = h(
      "button",
      {
        type: "button",
        class: "spro-botao",
        onclick: acao(async () => {
          const v = nome.value.trim();
          if (v) await (tipo === "pasta" ? d.criarPasta(v) : d.criarEtiqueta(v));
        }),
      },
      tipo === "pasta" ? "Criar pasta" : "Criar etiqueta",
    );
    return h("div", { class: "linha" }, nome, botao);
  };
  async function desenhar(): Promise<void> {
    const { pastas, etiquetas } = await d.listar();
    raiz.replaceChildren(
      h("h3", {}, "Pastas"),
      ...pastas.map((p) => linha("pasta", p)),
      criar("pasta"),
      h("h3", {}, "Etiquetas"),
      ...etiquetas.map((e) => linha("etiqueta", e)),
      criar("etiqueta"),
    );
  }
  await desenhar();
  return raiz;
}
