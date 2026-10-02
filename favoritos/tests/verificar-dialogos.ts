import { areaMemoria } from "@comum/armazenamento/area";
import { montarEditor } from "../src/app/componentes/editor";
import { montarGerenciar } from "../src/app/componentes/gerenciar";
import { montarLixeira, naLixeira } from "../src/app/componentes/lixeira";
import { montarMigracao } from "../src/app/componentes/migracao";
import { prazoDosValores, valoresDoPrazo } from "../src/app/prazoForm";
import { exportarTudo, importarEnvelope, lerEnvelope } from "../src/arquivo";
import { escoposDoContexto } from "../src/modelo/escopo";
import type { Etiqueta, Favorito, MudancasFavorito, Pasta } from "../src/modelo/tipos";
import { RepositorioFavoritos } from "../src/repositorio";
import { botao, checar, disparar, escolherCombo, instalarDom, opcoesDoCombo, secao, tique } from "./util";
import { CTX } from "./verificar-modelo";

const HOJE = "2026-10-01";
const fav = (x: Partial<Favorito> & { id: string }): Favorito => ({
  protocolo: `${x.id}/2026`,
  etiquetas: [],
  ordem: "a0",
  criadoEm: 1,
  atualizadoEm: 1,
  dispositivo: "D",
  ...x,
});

export async function verificarDialogos(): Promise<void> {
  instalarDom();
  secao("prazo no formulario");
  const vazio = valoresDoPrazo(undefined, HOJE);
  checar("sem prazo comeca em nenhum, com a data de hoje", vazio.modo === "nenhum" && vazio.referencia === HOJE);
  const dias = prazoDosValores({ ...vazio, modo: "dias", n: 3, contagem: "uteis", sentido: "antes" });
  checar(
    "N dias antes vira n negativo",
    JSON.stringify(dias) ===
      JSON.stringify({ referencia: { de: "data", data: HOJE }, vencimento: { em: "dias", n: -3, contagem: "uteis" }, exibicao: "ate" }),
    dias,
  );
  checar(
    "ida e volta",
    JSON.stringify(valoresDoPrazo(dias, HOJE)) === JSON.stringify({ ...vazio, modo: "dias", n: 3, contagem: "uteis", sentido: "antes" }),
  );
  checar(
    "prazo simples do legado abre como data limite",
    valoresDoPrazo({ referencia: { de: "data", data: "2026-10-04" }, exibicao: "ate" }, HOJE).modo === "data",
  );
  checar("so contar desde", prazoDosValores({ ...vazio, modo: "contagem", contagem: "uteis" })?.exibicao === "desdeUteis");
  const doDoc = {
    referencia: { de: "documento" as const, idDocumento: "901", data: "2026-09-05" },
    vencimento: { em: "dias" as const, n: 10, contagem: "uteis" as const },
    exibicao: "ate" as const,
  };
  const vDoc = valoresDoPrazo(doDoc, HOJE);
  checar(
    "prazo a partir de documento abre com o documento e a data dele",
    vDoc.modo === "dias" && vDoc.documento?.id === "901" && vDoc.referencia === "2026-09-05",
    vDoc,
  );
  checar("e volta igual", JSON.stringify(prazoDosValores(vDoc)) === JSON.stringify(doDoc), prazoDosValores(vDoc));
  checar(
    "'ate uma data' ignora o documento",
    prazoDosValores({ ...vDoc, modo: "data", vencimento: "2026-10-09" })?.referencia.de === "data",
  );
  const prox = prazoDosValores({ ...vazio, modo: "proximo", tipos: "Despacho, Nota Técnica", n: 10, contagem: "uteis" });
  checar(
    "proximo documento do tipo (o antigo EM BREVE)",
    JSON.stringify(prox) ===
      JSON.stringify({
        referencia: { de: "novoDocumento", tipos: ["Despacho", "Nota Técnica"], desde: HOJE },
        vencimento: { em: "dias", n: 10, contagem: "uteis" },
        exibicao: "ate",
      }),
    prox,
  );
  const vProx = valoresDoPrazo(prox, HOJE);
  checar("e volta com os tipos", vProx.modo === "proximo" && vProx.tipos === "Despacho, Nota Técnica" && vProx.n === 10, vProx);
  checar("sem tipo, nao vira prazo", prazoDosValores({ ...vazio, modo: "proximo", tipos: " , ", n: 5 }) === undefined);
  checar(
    "dados incompletos nao viram prazo",
    prazoDosValores({ ...vazio, modo: "dias", n: 0 }) === undefined &&
      prazoDosValores({ ...vazio, modo: "data", vencimento: "" }) === undefined,
  );

  secao("editor do favorito");
  const pasta: Pasta = { id: "p1", nome: "Contratos", ordem: "a0", atualizadoEm: 1, dispositivo: "D" };
  const et: Etiqueta = { id: "e1", nome: "Urgente", cor: "#ffe0b2", atualizadoEm: 1, dispositivo: "D" };
  const salvos: MudancasFavorito[] = [];
  let fechou = false;
  const deps = {
    pastas: [pasta],
    etiquetas: [et],
    hoje: HOJE,
    salvar: async (m: MudancasFavorito) => {
      salvos.push(m);
    },
    criarPasta: async (nome: string) => ({ ...pasta, id: "p2", nome }),
    criarEtiqueta: async (nome: string) => ({ ...et, id: "e2", nome }),
    fechar: () => {
      fechou = true;
    },
  };
  const docLegado = fav({
    id: "1",
    prazo: { referencia: { de: "documento", idDocumento: "160223", data: "2026-09-01" }, exibicao: "ate" },
  });
  const ed = montarEditor({ ...deps, favorito: docLegado });
  checar(
    "prazo de documento mostra de onde conta",
    /documento/.test(ed.textContent ?? "") && ed.textContent?.includes("01/09/2026") === true,
    ed.textContent,
  );
  (ed.querySelector('input[aria-label="Título"]') as HTMLInputElement).value = "Porto";
  document.body.append(ed);
  escolherCombo(ed, "Pasta", "p1");
  escolherCombo(ed, "Etiquetas", "e1");
  botao(ed, "Salvar")!.click();
  await tique();
  checar(
    "salva titulo, pasta e etiquetas",
    salvos[0]?.titulo === "Porto" && salvos[0]?.pasta === "p1" && salvos[0]?.etiquetas?.join() === "e1" && fechou,
    salvos[0],
  );
  checar("prazo intocado nao e regravado (preserva o do legado)", !!salvos[0] && !("prazo" in salvos[0]));
  const ed2 = montarEditor({ ...deps, favorito: fav({ id: "2" }) });
  document.body.append(ed2);
  escolherCombo(ed2, "Prazo", "data");
  const venc = ed2.querySelector('input[aria-label="Vence em"]') as HTMLInputElement;
  venc.value = "2026-10-05";
  disparar(venc, "change");
  checar(
    "previa do prazo",
    ed2.querySelector(".fav-previa")?.textContent?.includes("vence em 4 dias") === true,
    ed2.querySelector(".fav-previa")?.textContent,
  );
  botao(ed2, "Salvar")!.click();
  await tique();
  checar(
    "prazo alterado e salvo",
    JSON.stringify(salvos[1]?.prazo?.vencimento) === JSON.stringify({ em: "data", data: "2026-10-05" }),
    salvos[1],
  );

  secao("editor: prazo a partir de um documento do processo");
  const pedidos: boolean[] = [];
  const docsFalsos = [
    { id: "901", numero: "0103947", nome: "Despacho 12", data: "2026-09-05" as const },
    { id: "902", numero: "0103950", nome: "Nota Técnica 3", data: "2026-09-12" as const },
  ];
  const ed3 = montarEditor({
    ...deps,
    favorito: fav({ id: "3" }),
    listarDocumentos: async (buscar: boolean) => {
      pedidos.push(buscar);
      if (!buscar)
        throw Object.assign(new Error("Para listar os documentos, o SEI Pro precisa abrir a árvore deste processo."), {
          codigo: "PRECISA_BUSCAR",
        });
      return docsFalsos;
    },
  });
  document.body.append(ed3);
  escolherCombo(ed3, "Prazo", "dias");
  const radios = () => [...ed3.querySelectorAll<HTMLElement>('[role="radiogroup"][aria-label="Contagem"] [role="radio"]')];
  const Ev3 = (ed3.ownerDocument.defaultView as unknown as { Event: typeof Event }).Event;
  const seta = new Ev3("keydown", { bubbles: true, cancelable: true });
  Object.defineProperty(seta, "key", { value: "ArrowRight" });
  radios()[0]!.dispatchEvent(seta);
  checar(
    "controle segmentado anda com as setas (um so no Tab)",
    radios()[1]?.getAttribute("aria-checked") === "true" &&
      radios()[1]?.getAttribute("tabindex") === "0" &&
      radios()[0]?.getAttribute("tabindex") === "-1",
  );
  radios()[0]!.click();
  botao(ed3, "Usar a data de um documento…")!.click();
  await tique(10);
  checar(
    "sem a arvore aberta, explica o efeito e pede confirmacao",
    /visualizado/.test(ed3.textContent ?? "") && /Processo recebido/.test(ed3.textContent ?? "") && !!botao(ed3, "Buscar no SEI"),
  );
  botao(ed3, "Buscar no SEI")!.click();
  await tique(10);
  checar("lista os documentos assinados", pedidos.join() === "false,true" && opcoesDoCombo(ed3, "Documento").join() === "901,902", pedidos);
  escolherCombo(ed3, "Documento", "902");
  checar(
    "a data de referencia vira a da assinatura",
    (ed3.querySelector('input[aria-label="A partir de"]') as HTMLInputElement).value === "2026-09-12",
  );
  botao(ed3, "Salvar")!.click();
  await tique();
  checar(
    "salva o prazo a partir do documento",
    JSON.stringify(salvos.at(-1)?.prazo?.referencia) === JSON.stringify({ de: "documento", idDocumento: "902", data: "2026-09-12" }),
    salvos.at(-1)?.prazo,
  );
  const ed4 = montarEditor({ ...deps, favorito: fav({ id: "4" }) });
  checar("sem como listar documentos, sem o botao", !botao(ed4, "Usar a data de um documento…"));

  secao("gerenciar pastas e etiquetas");
  const feito: string[] = [];
  let lista = { pastas: [pasta], etiquetas: [et] };
  const g = await montarGerenciar({
    listar: async () => lista,
    criarPasta: async (n) => {
      feito.push(`+p:${n}`);
      lista = { ...lista, pastas: [...lista.pastas, { ...pasta, id: "p9", nome: n }] };
    },
    editarPasta: async (id, m) => void feito.push(`~p:${id}:${JSON.stringify(m)}`),
    removerPasta: async (id) => void feito.push(`-p:${id}`),
    criarEtiqueta: async (n) => void feito.push(`+e:${n}`),
    editarEtiqueta: async (id, m) => void feito.push(`~e:${id}:${JSON.stringify(m)}`),
    removerEtiqueta: async (id) => void feito.push(`-e:${id}`),
    confirmar: async () => true,
  });
  const nomePasta = g.querySelector('input[aria-label="Nome da pasta Contratos"]') as HTMLInputElement;
  nomePasta.value = "Contratos 2026";
  disparar(nomePasta, "change");
  await tique();
  botao(g, "Excluir a etiqueta Urgente")!.click();
  await tique();
  (g.querySelector('input[aria-label="Nova pasta"]') as HTMLInputElement).value = "Licitações";
  botao(g, "Criar pasta")!.click();
  await tique();
  checar("renomear, excluir e criar", feito.join() === '~p:p1:{"nome":"Contratos 2026"},-e:e1,+p:Licitações', feito);
  checar("redesenha com o que voltou do armazenamento", !!g.querySelector('input[aria-label="Nome da pasta Licitações"]'));

  secao("lixeira");
  const agora = 100 * 86_400_000;
  const itens = [fav({ id: "1", removidoEm: agora - 1 }), fav({ id: "2", removidoEm: agora - 31 * 86_400_000 }), fav({ id: "3" })];
  checar(
    "so removidos dos ultimos 30 dias",
    naLixeira(itens, agora)
      .map((f) => f.id)
      .join() === "1",
  );
  const restaurados: string[] = [];
  const lx = montarLixeira(itens, agora, { restaurar: async (id) => void restaurados.push(id), voltar: () => undefined });
  botao(lx, "Restaurar 1/2026")!.click();
  await tique();
  checar("restaurar", restaurados.join() === "1");

  secao("migracao: dialogo");
  const escolhas: string[] = [];
  const mg = montarMigracao({
    quantidade: 42,
    amostra: ["1/2026"],
    siglaUnidade: "GPF",
    trazer: async (d) => void escolhas.push(d),
    adiar: async () => void escolhas.push("adiar"),
  });
  checar("explica quantos e de onde", mg.textContent?.includes("42") === true);
  botao(mg, "Trazer para GPF")!.click();
  botao(mg, "Trazer para Pessoal")!.click();
  botao(mg, "Agora não")!.click();
  await tique();
  checar("tres escolhas", escolhas.join() === "unidade,pessoal,adiar");

  secao("arquivo: exportar e importar");
  const area = areaMemoria();
  let t = 1;
  const carimbo = () => ({ agora: ++t, dispositivo: "X" });
  const esc = escoposDoContexto(CTX);
  const ru = new RepositorioFavoritos(area, esc.unidade!, carimbo);
  const rp = new RepositorioFavoritos(area, esc.pessoal, carimbo);
  await ru.registrar();
  await rp.registrar();
  await ru.adicionar({ id: "1", protocolo: "1/2026" });
  await rp.adicionar({ id: "2", protocolo: "2/2026" });
  await ru.criarPasta("Contratos");
  const env = await exportarTudo(area, CTX.host, "pedro.soares", carimbo());
  checar("exporta as duas listas do usuario", env.escopos.length === 2 && env.formato === "seipro-favoritos" && env.versao === 1);
  const lido = lerEnvelope(JSON.parse(JSON.stringify(env)));
  checar("le o proprio arquivo sem descartar nada", lido?.descartados === 0);
  const outra = areaMemoria();
  const r = await importarEnvelope(outra, lido!.envelope, carimbo, { host: CTX.host, login: "pedro.soares" });
  checar("importa num navegador limpo", r.novos === 2 && (await new RepositorioFavoritos(outra, esc.pessoal, carimbo).contem("2")), r);
  const deOutro = await importarEnvelope(areaMemoria(), lido!.envelope, carimbo, { host: CTX.host, login: "fulano" });
  checar("arquivo de outro usuario nao entra", deOutro.novos === 0 && deOutro.deOutro === 2);
  const sujo = JSON.parse(JSON.stringify(env));
  sujo.escopos[0].favoritos.push({ id: "x" });
  sujo.escopos[0].favoritos[0].prazo = { referencia: "quebrado" };
  const lidoSujo = lerEnvelope(sujo);
  checar(
    "item quebrado e descartado e prazo quebrado some",
    lidoSujo?.descartados === 1 && lidoSujo.envelope.escopos[0]?.favoritos[0]?.prazo === undefined,
    lidoSujo?.descartados,
  );
  checar("formato desconhecido", lerEnvelope({ formato: "outro" }) === null && lerEnvelope(null) === null);

  secao("arquivo: dados editados a mao nao travam a lista nem o favoritar");
  const torto = JSON.parse(JSON.stringify(env));
  const fx = torto.escopos[0].favoritos[0];
  fx.ordem = "b";
  fx.sigiloso = true;
  fx.especificacao = "nao deveria ficar";
  torto.escopos[0].favoritos.push(
    {
      ...fx,
      id: "p1",
      ordem: "a0",
      sigiloso: undefined,
      prazo: { referencia: { de: "novoDocumento", desde: "2026-10-01" }, exibicao: "ate" },
    },
    {
      ...fx,
      id: "p2",
      ordem: "a1",
      sigiloso: undefined,
      prazo: { referencia: { de: "data", data: "2026-10-01" }, vencimento: { em: "dias", n: 1e9, contagem: "uteis" }, exibicao: "ate" },
    },
  );
  torto.escopos[0].etiquetas = [
    { id: "e9", nome: "Ruim", cor: "red;background:url(https://exemplo.invalido/x)", atualizadoEm: 1, dispositivo: "X" },
  ];
  const lidoTorto = lerEnvelope(torto)!;
  const favs = lidoTorto.envelope.escopos[0]!.favoritos;
  const f0 = favs.find((f) => f.id === fx.id);
  checar("ordem invalida vira uma chave valida", !!f0 && f0.ordem !== "b" && /^[a-zA-Z]/.test(f0.ordem), f0?.ordem);
  checar("sigiloso perde a especificacao", f0?.especificacao === undefined);
  checar("prazo de novo documento sem tipos e descartado", favs.find((f) => f.id === "p1")?.prazo === undefined);
  checar("vencimento com n absurdo e descartado", favs.find((f) => f.id === "p2")?.prazo === undefined);
  checar(
    "cor de etiqueta que nao e cor vira cor da paleta",
    /^#[0-9a-f]{3,8}$/i.test(lidoTorto.envelope.escopos[0]!.etiquetas[0]?.cor ?? ""),
    lidoTorto.envelope.escopos[0]!.etiquetas[0]?.cor,
  );
  const areaTorta = areaMemoria();
  await importarEnvelope(areaTorta, lidoTorto.envelope, carimbo, { host: CTX.host, login: "pedro.soares" });
  const repoTorto = new RepositorioFavoritos(areaTorta, lidoTorto.envelope.escopos[0]!.escopo, carimbo);
  checar(
    "depois de importar, favoritar continua funcionando",
    (await repoTorto.adicionar({ id: "novo", protocolo: "9/2026" })).id === "novo",
  );
  const areaLixo = areaMemoria();
  const repoLixo = new RepositorioFavoritos(areaLixo, esc.unidade!, carimbo);
  await repoLixo.favoritos.gravar("velho", { ...fx, id: "velho", ordem: "b" });
  checar(
    "chave de ordem invalida ja gravada nao trava o proximo favorito",
    (await repoLixo.adicionar({ id: "outro", protocolo: "8/2026" })).id === "outro",
  );
}
