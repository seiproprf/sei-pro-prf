/**
 * Parsers de domínio sobre telas reais do SEI 4.1.5 (SEI SP Treinamento).
 * As escritas foram validadas ao vivo; aqui fica o que dá para garantir
 * offline: que cada tela é lida do jeito certo.
 */

import { lerEditor, textoDoHtml } from "../src/dominio/editor";
import { lerContexto, lerIdUnidade, lerVersao } from "../src/sei";
import { lerCaixaDaPagina } from "../src/dominio/caixa";
import { Formulario } from "../src/formulario/formulario";
import { lerResultados } from "../src/dominio/pesquisa";
import { checar, fixture, paginaSintetica, secao } from "./util";

export async function verificarDominio(): Promise<void> {
  secao("contexto");
  const caixa = fixture("sei41/caixa.html");
  const ctx = lerContexto(caixa);
  checar("versao 4.1.5", ctx.versao === "4.1.5" && ctx.maior === 4, ctx.versao);
  checar("unidade e usuario", ctx.unidade.sigla === "TESTE" && ctx.usuario.login === "pedro.soares", ctx);
  checar("id da unidade pelo link de troca", ctx.unidade.id === "110000001", ctx.unidade);
  const sei3 = paginaSintetica(
    '<a id="lnkUsuarioSistema" title="Fulano (fulano/ORG)"></a><select id="selInfraUnidades"><option value="7">OUTRA</option><option value="123" selected>GPF</option></select>',
    "https://sei.exemplo.gov.br/sei/controlador.php?acao=procedimento_controlar",
  );
  checar("SEI 3: id e sigla pelo seletor", lerIdUnidade(sei3) === "123" && lerContexto(sei3).unidade.sigla === "GPF", lerContexto(sei3).unidade);
  checar(
    "id pela URL quando nao ha cabecalho",
    lerIdUnidade(paginaSintetica("<p></p>", "https://x/sei/controlador.php?acao=x&infra_unidade_atual=555&infra_hash=0")) === "555",
  );
  checar("sem nada, id vazio (sem quebrar)", lerIdUnidade(paginaSintetica("<p></p>")) === "");

  secao("caixa lida da tela (sem requisicao)");
  const linhas = lerCaixaDaPagina(caixa);
  const sigilosa = linhas.find((l) => l.idProcedimento === "157584");
  checar("le as linhas da tela", linhas.length > 0 && !!sigilosa, linhas.length);
  checar("sigiloso sem especificacao", sigilosa?.sigiloso === true && sigilosa.especificacao === "", sigilosa);
  checar("sem exclamacao nao ha documento novo", sigilosa?.documentoNovo === false);
  const comNovo = paginaSintetica(
    '<table id="tblProcessosRecebidos"><caption>(1 registro)</caption><tr id="P9"><td><input type="checkbox" value="9" title="1.1/2026" aria-label="Tipo Teste / Especificação X"></td><td><a href="javascript:void(0);" aria-label="Um documento foi incluído ou assinado neste processo"><img src="svg/exclamacao.svg?5" class="imagemStatus"></a></td><td><a class="processoVisualizado" href="controlador.php?acao=procedimento_trabalhar&id_procedimento=9">1.1/2026</a></td><td>(fulano)</td></tr></table>',
  );
  const novo = lerCaixaDaPagina(comNovo)[0];
  checar("documento novo pela exclamacao", novo?.documentoNovo === true && novo.especificacao === "X", novo);
  checar("versao pelo asset quando nao ha logo", lerVersao('<script src="/x.js?5.0.4-2.30.0"></script>') === "5.0.4");

  secao("editor ck4");
  const ed = lerEditor(fixture("sei41/editor.html"));
  checar("quatro secoes", ed.tipo === "ck4" && ed.secoes.length === 4, ed.secoes.map((s) => s.nome));
  checar("cabecalho e titulo somente leitura", ed.secoes[0].somenteLeitura && ed.secoes[1].somenteLeitura);
  const principal = ed.secoes.find((s) => s.principal);
  checar("corpo do texto e o principal", principal?.titulo === "Corpo do Texto", principal?.titulo);
  checar("frmEditor posta no editor_processar", Formulario.de(ed.pagina, "#frmEditor").action.includes("editor_processar.php?acao=editor_salvar"));

  secao("editor ck5 (sintetico, formato do SEI 5)");
  const cfg = {
    initialData: { txaEditor_1: "<p>cab</p>", txaEditor_2: "<p>corpo</p>" },
    rootsAttributes: { txaEditor_1: { somenteLeitura: true, label: "Cabeçalho" }, txaEditor_2: { principal: true, label: "Corpo do Texto" } },
    sei: { urlSalvar: "controlador_rest.php?acao_rest=editor_salvar_conteudo&x=\"}{\"", versao: 3, siglaUnidade: "U" },
  };
  const ed5 = lerEditor({ url: "https://h/sei/x", status: 200, html: `<script>window.INFRA_EDITOR_CONFIG = ${JSON.stringify(cfg)};</script>`, get doc() { return null as unknown as Document; } });
  checar("ck5 com chaves dentro de string", ed5.tipo === "ck5" && ed5.secoes.length === 2 && ed5.ck5?.versao === 3);
  checar("ck5 principal pelo rootsAttributes", ed5.secoes[1].principal && ed5.secoes[0].somenteLeitura);

  secao("texto de html");
  checar("paragrafos viram linhas", textoDoHtml("<p>a&nbsp;b</p><p>c</p>") === "a b\nc", textoDoHtml("<p>a&nbsp;b</p><p>c</p>"));

  secao("pesquisa");
  const pesq = lerResultados(fixture("sei41/pesquisa_resultado.html"));
  checar("total da barra com milhar", pesq.total === 5394, pesq.total);
  checar("dez resultados na pagina", pesq.itens.length === 10, pesq.itens.length);
  const r0 = pesq.itens[0];
  checar("resultado de documento", r0.protocolo === "99906.713-630.000032/2025-82" && r0.documento?.numero === "0104019" && r0.documento.tipo === "Despacho", r0);
  checar("trecho e metadados", r0.trecho.includes("Teste") && r0.unidade === "TESTE" && /\d{2}\/\d{2}\/\d{4}/.test(r0.data), r0);

  secao("formularios de acao");
  const anot = Formulario.de(fixture("sei41/p_anotacao_registrar.html"), "#frmAnotacaoCadastro");
  checar("anotacao atual lida", anot.valor("txaDescricao") === "teste");
  const atr = Formulario.de(fixture("sei41/p_procedimento_atribuicao_cadastrar.html"), "#frmAtividadeAtribuir");
  checar("usuarios da unidade", atr.opcoes("selAtribuicao").length > 5);
  const marc = Formulario.de(fixture("sei41/marcador_cadastrar.html"), "#frmAndamentoMarcadorCadastro");
  checar("marcadores da unidade", marc.opcoes("selMarcador").some((o) => o.texto === "Enviado para auditoria"));
  const hist = fixture("sei41/historico.html");
  checar("historico tem o formulario de tipo", Formulario.de(hist, "#frmProcedimentoHistorico").valor("hdnTipoHistorico") === "R");
}
