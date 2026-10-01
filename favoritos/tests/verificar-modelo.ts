import { corDoTexto, corPadrao, PALETA } from "../src/modelo/cores";
import { chaveEscopo, escoposDoContexto } from "../src/modelo/escopo";
import { editar, filtrar, novoFavorito, ordenar, remover, restaurar } from "../src/modelo/operacoes";
import type { ContextoAba, Etiqueta, Favorito } from "../src/modelo/tipos";
import { checar, secao } from "./util";

export const CTX: ContextoAba = {
  host: "sei.antaq.gov.br",
  login: "Pedro.Soares",
  nome: "Pedro",
  unidade: { id: "110000001", sigla: "GPF", nome: "Gerência" },
  versao: "5.0.4",
  temaEscuro: false,
};

export function verificarModelo(): void {
  secao("escopo");
  const { unidade, pessoal } = escoposDoContexto(CTX);
  checar(
    "chave da unidade (login minusculo)",
    unidade !== null && chaveEscopo(unidade) === "sei.antaq.gov.br|pedro.soares|u:110000001",
    unidade && chaveEscopo(unidade),
  );
  checar("chave pessoal", chaveEscopo(pessoal) === "sei.antaq.gov.br|pedro.soares|pessoal");
  checar("sem unidade na tela, so a Pessoal (Review Focus 4)", escoposDoContexto({ ...CTX, unidade: null }).unidade === null);
  checar(
    "unidade sem id tambem nao vira escopo",
    escoposDoContexto({ ...CTX, unidade: { id: "", sigla: "X", nome: "" } }).unidade === null,
  );

  secao("cores");
  checar("cor padrao vem da paleta e e estavel", PALETA.includes(corPadrao("Urgente")) && corPadrao("Urgente") === corPadrao(" urgente "));
  checar("texto escuro em fundo claro, claro em fundo escuro", corDoTexto("#fff9c4") === "#1f2328" && corDoTexto("#123456") === "#ffffff");

  secao("operacoes");
  const c = { agora: 1000, dispositivo: "D1" };
  const sig = novoFavorito({ id: "9", protocolo: "1/2026", tipo: "T", especificacao: "segredo", sigiloso: true }, "a0", c);
  checar("sigiloso sem especificacao", sig.sigiloso === true && sig.especificacao === undefined && sig.tipo === "T");
  const f = novoFavorito({ id: "1", protocolo: "50300.018905/2018-67", tipo: "Fiscalização", especificacao: "Porto X" }, "a0", c);
  checar(
    "novo favorito carimbado",
    f.criadoEm === 1000 && f.atualizadoEm === 1000 && f.dispositivo === "D1" && f.etiquetas.length === 0 && !("sigiloso" in f),
  );
  const e = editar(f, { titulo: "Meu título", nota: undefined }, { agora: 2000, dispositivo: "D2" });
  checar(
    "editar carimba e tira chaves vazias",
    e.titulo === "Meu título" && e.atualizadoEm === 2000 && e.dispositivo === "D2" && !("nota" in e),
  );
  checar("editar nao muda o original", f.titulo === undefined);
  const r = remover(e, { agora: 3000, dispositivo: "D1" });
  checar("remover vira lapide", r.removidoEm === 3000 && r.atualizadoEm === 3000);
  const v = restaurar(r, { agora: 4000, dispositivo: "D1" });
  checar("restaurar tira a lapide", !("removidoEm" in v) && v.atualizadoEm === 4000);

  secao("filtro e busca");
  const et: Etiqueta = { id: "e1", nome: "Urgência", cor: "#fff", atualizadoEm: 1, dispositivo: "D" };
  const lista: Favorito[] = [
    { ...f, id: "1", titulo: "Fiscalização do porto", etiquetas: ["e1"], pasta: "p1", ordem: "a1" },
    {
      ...f,
      id: "2",
      protocolo: "00000.000004/2025-54",
      tipo: "Contrato",
      especificacao: "Limpeza",
      etiquetas: [],
      ordem: "a0",
      nota: "ligar para o fiscal",
    },
    { ...f, id: "3", protocolo: "1/2026", ordem: "a2", removidoEm: 5 },
  ];
  const apoio = { etiquetas: new Map([["e1", et]]), resumo: () => undefined };
  const ids = (l: Favorito[]) => l.map((x) => x.id).join();
  checar("busca ignora acento e caixa", ids(filtrar(lista, { busca: "fiscalizacao" }, apoio)) === "1");
  checar("busca pelo numero do protocolo", ids(filtrar(lista, { busca: "018905" }, apoio)) === "1");
  checar("busca pela etiqueta", ids(filtrar(lista, { busca: "urgencia" }, apoio)) === "1");
  checar("busca com dois termos na nota", ids(filtrar(lista, { busca: "FISCAL ligar" }, apoio)) === "2");
  checar("lapide nunca aparece", !filtrar(lista, {}, apoio).some((x) => x.id === "3"));
  checar("filtro por pasta", ids(filtrar(lista, { pasta: "p1" }, apoio)) === "1");
  checar("filtro sem pasta", ids(filtrar(lista, { pasta: "__sem__" }, apoio)) === "2");
  checar("filtro por etiqueta", ids(filtrar(lista, { etiqueta: "e1" }, apoio)) === "1");
  checar("filtro sem prazo", ids(filtrar(lista, { prazo: "semPrazo" }, apoio)) === "1,2");

  secao("ordenacao");
  checar("manual pela chave com <", ids(ordenar(lista, "manual", () => undefined)) === "2,1,3");
  checar("protocolo numerico", ids(ordenar(lista.slice(0, 2), "protocolo", () => undefined)) === "2,1");
  const resumo = (x: Favorito) => (x.id === "1" ? { situacao: "noPrazo" as const, texto: "", dica: "", ordem: 3 } : undefined);
  checar("por prazo, sem prazo por ultimo", ids(ordenar(lista.slice(0, 2), "prazo", resumo)) === "1,2");
  checar(
    "inclusao mais recente primeiro",
    ids(
      ordenar(
        [
          { ...lista[0]!, criadoEm: 1 },
          { ...lista[1]!, criadoEm: 2 },
        ],
        "inclusao",
        () => undefined,
      ),
    ) === "2,1",
  );
}
