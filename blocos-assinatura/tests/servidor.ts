import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseHTML } from 'linkedom';
import { definirAnalisador } from '../../sei-nucleo/src/sessao/dom';
import { paginaDe } from '../../sei-nucleo/src/sessao/pagina';
import { Sei } from '../../sei-nucleo/src/sei';

export const url = 'https://sei.exemplo.gov.br/sei/controlador.php?acao=bloco_escolher&id_procedimento=77&infra_hash=cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc';
export const criar = (html: string) => parseHTML(`<html><head></head><body>${html}</body></html>`).document as unknown as Document;
definirAnalisador(criar);
export const inclusao = `<form id="frmBlocoEscolher"><div id="divInfraBarraComandosSuperior"><button type="submit">Incluir</button></div>
  <select name="selBloco" id="selBloco" onchange="this.form.submit()"><option value="">Selecione</option><option value="12">222222 - Outro</option></select>
  <table id="tblDocumentos"><tr><td><input type="checkbox" name="chkInfraItem0" value="doc1" checked></td></tr></table>
  <input id="hdnDocumentosItensSelecionados" name="hdnDocumentosItensSelecionados" value="doc1">
  <div id="divInfraBarraComandosInferior"><button type="submit">Incluir</button></div></form>`;

export function servidor() {
  let cancelado = false;
  const estado = { posts: 0, leituras: 0, pesquisas: 0, layoutAlternativo: false, layoutSei415: false, filtraDisponibilizado: true, falharBusca: false, falha: '', rejeitar: false, semOpcao: false, semTabela: false, semAcao: false, tardar: null as Promise<void> | null };
  const link = (acao: string) => `controlador.php?acao=${acao}&infra_hash=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa`;
  const topo = criar(`<nav id="infraMenu"><a href="${link('bloco_assinatura_listar')}">Assinatura</a></nav>`);
  const lista = () => `<form id="frmBlocoLista" action="${link('bloco_assinatura_listar')}"><input name="hdnInfraItemId" value=""><input name="hdnInfraItensSelecionados" value=""><input type="checkbox" name="chkSinEstadoDisponibilizado" id="chkSinEstadoDisponibilizado" ${estado.filtraDisponibilizado ? 'checked' : ''}><input name="txtDescricao" value=""><button type="submit" name="sbmPesquisar">Pesquisar</button>
    <table id="tblBlocos"><tr><th>Seleção</th><th>Número</th><th>Estado</th><th>Descrição</th><th>Ações</th></tr>
    ${estado.filtraDisponibilizado || cancelado ? `<tr><td><input type="checkbox" value="11"></td><td>111111</td><td>${cancelado ? 'Gerado' : 'Disponibilizado'}</td><td>&lt;img src=x onerror=alert(1)&gt; Árvore</td><td>${estado.semAcao ? '' : '<a onclick="acaoCancelarDisponibilizacao(\'11\')">Cancelar</a>'}</td></tr>` : ''}
    <tr><td><input type="checkbox" value="12"></td><td>222222</td><td>Gerado</td><td>Outro</td><td></td></tr>
    <tr><td><input type="checkbox" value="13"></td><td>333333</td><td>Disponibilizado</td><td>Recebido</td><td><a onclick="acaoRetornar(\'13\')">Retornar à geradora</a></td></tr></table></form>
    <script>function acaoCancelarDisponibilizacao(id){form.action='${link('bloco_cancelar_disponibilizacao')}';}</script>`;
  const sei = new Sei(url, () => paginaDe(topo, url), { fetch: (async (input, init) => {
    const alvo = new URL(String(input));
    estado.leituras++;
    if (estado.tardar) await estado.tardar;
    if (estado.falha) throw new Error(estado.falha);
    if (init?.method === 'POST') {
      const campos = new URLSearchParams(String(init.body));
      assert.equal(campos.get('hdnInfraItensSelecionados'), '');
      if (estado.layoutSei415) {
        assert.equal(campos.get('hdnInfraSelecoes'), 'Infra');
        assert.equal(campos.get('hdnInfraItensHash'), 'hash-ficticio');
      }
      if (alvo.searchParams.get('acao') === 'bloco_assinatura_listar') {
        assert.equal(campos.get('hdnInfraItemId'), '');
        estado.filtraDisponibilizado = campos.has('chkSinEstadoDisponibilizado'); estado.pesquisas++;
        if (estado.falharBusca && estado.filtraDisponibilizado) throw new Error('Falha depois de aplicar filtro');
      } else {
        assert.equal(alvo.searchParams.get('acao'), 'bloco_cancelar_disponibilizacao');
        assert.equal(campos.get('hdnInfraItemId'), '11');
        estado.posts++;
        if (!estado.rejeitar) cancelado = true;
      }
    }
    let html = alvo.searchParams.get('acao') === 'bloco_escolher'
      ? inclusao.replace('</select>', cancelado && !estado.semOpcao ? '<option value="11">111111 - Árvore</option></select>' : '</select>')
      : estado.semTabela ? '<p>Tela inesperada</p>' : lista();
    if (estado.layoutAlternativo && alvo.searchParams.get('acao') !== 'bloco_escolher') {
      html = html.replace('<table id="tblBlocos">', '<table><tr><td>Filtros</td></tr></table><table class="infraTable">')
        .replace('<th>Estado</th>', '<th>Situação</th>')
        .replace(/<input type="checkbox" value="\d+">/g, '');
    }
    if (estado.layoutSei415 && alvo.searchParams.get('acao') !== 'bloco_escolher') {
      const cabecalho = readFileSync(new URL('./fixtures/cabecalho-sei-4.1.5.html', import.meta.url), 'utf8');
      // Dez colunas observadas no SEI; linhas e identificadores fictícios.
      html = html.replace(/<tr><th>Seleção<\/th>[\s\S]*?<\/tr>/, cabecalho)
        .replace(/(<td>\d+<\/td>)(<td>(?:Disponibilizado|Gerado)<\/td>)/g, '$1<td></td><td></td>$2<td>GERADORA</td><td>DESTINO</td><td></td>');
      html = html.replace('<input name="hdnInfraItemId"', '<input type="hidden" name="hdnInfraSelecoes" value="Infra"><input type="hidden" name="hdnInfraItensHash" value="hash-ficticio"><input name="hdnInfraItemId"');
    }
    return { url: alvo.href, status: 200, arrayBuffer: async () => Uint8Array.from([...html].map(c => c.charCodeAt(0))).buffer } as Response;
  }) as typeof fetch });
  return { sei, estado };
}
