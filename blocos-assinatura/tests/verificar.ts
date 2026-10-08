import assert from 'node:assert/strict';
import * as blocos from '../../sei-nucleo/src/dominio/blocos';
import { servidor, url } from './servidor';

// Captura ausência de filtro por controle nativo, confusão entre número e id,
// ação errada e sucesso anunciado sem a opção devolvida pelo servidor.
assert.equal(typeof blocos.listarBlocosParaInclusao, 'function', 'núcleo deve listar blocos que podem voltar à inclusão');
assert.equal(typeof blocos.retornarBlocoParaInclusao, 'function');
const s = servidor();
const lista = await blocos.listarBlocosParaInclusao(s.sei);
assert.equal(lista.length, 1);
assert.deepEqual(lista[0], { id: '11', numero: '111111', descricao: '<img src=x onerror=alert(1)> Árvore' });
assert.equal(s.estado.posts, 0);
const retornado = await blocos.retornarBlocoParaInclusao(s.sei, '11', url);
assert.deepEqual(retornado, { id: '11', rotulo: '111111 - Árvore' });
assert.equal(s.estado.posts, 1);
assert.equal((await blocos.listarBlocosParaInclusao(s.sei)).length, 0);

const rejeitado = servidor(); rejeitado.estado.rejeitar = true;
await assert.rejects(() => blocos.retornarBlocoParaInclusao(rejeitado.sei, '11', url));
const incompleto = servidor(); incompleto.estado.semOpcao = true;
await assert.rejects(() => blocos.retornarBlocoParaInclusao(incompleto.sei, '11', url), /inclus/i);
const invalido = servidor(); invalido.estado.semTabela = true;
await assert.rejects(() => blocos.listarBlocosParaInclusao(invalido.sei));
const semPermissao = servidor(); semPermissao.estado.semAcao = true;
assert.equal((await blocos.listarBlocosParaInclusao(semPermissao.sei)).length, 0);
await assert.rejects(() => blocos.retornarBlocoParaInclusao(semPermissao.sei, '11', url));
assert.equal(semPermissao.estado.posts, 0);
const outro = servidor();
await assert.rejects(() => blocos.retornarBlocoParaInclusao(outro.sei, '13', url));
assert.equal(outro.estado.posts, 0);
await assert.rejects(() => blocos.retornarBlocoParaInclusao(outro.sei, '11', 'https://outro.gov.br/'));
assert.equal(outro.estado.posts, 0);
console.log('OK: permissões nativas, id/número, cancelamento assinado, verificação e falhas');

const filtrado = servidor(); filtrado.estado.filtraDisponibilizado = false;
assert.equal((await blocos.listarBlocosParaInclusao(filtrado.sei)).length, 1, 'filtro salvo não pode esconder o bloco');
assert.equal(filtrado.estado.filtraDisponibilizado, false, 'restaura o filtro da unidade');
assert.equal(filtrado.estado.pesquisas, 2);
await blocos.retornarBlocoParaInclusao(filtrado.sei, '11', url);
assert.equal(filtrado.estado.posts, 1);
assert.equal(filtrado.estado.filtraDisponibilizado, false);
const erroFiltro = servidor(); erroFiltro.estado.filtraDisponibilizado = false; erroFiltro.estado.falharBusca = true;
await assert.rejects(() => blocos.listarBlocosParaInclusao(erroFiltro.sei));
assert.equal(erroFiltro.estado.filtraDisponibilizado, false, 'restaura também após falha no envio da pesquisa');
assert.equal(erroFiltro.estado.posts, 0);
console.log('OK: filtro salvo restaurado na listagem, escrita e falha');

// Variante documentada nas fixtures do legado: tabela sem id, Situação e
// identidade exclusivamente no controle nativo de cancelar disponibilização.
const alternativo = servidor(); alternativo.estado.layoutAlternativo = true;
assert.deepEqual(await blocos.listarBlocosParaInclusao(alternativo.sei), [
  { id: '11', numero: '111111', descricao: '<img src=x onerror=alert(1)> Árvore' },
]);
assert.deepEqual(await blocos.retornarBlocoParaInclusao(alternativo.sei, '11', url), { id: '11', rotulo: '111111 - Árvore' });
assert.equal(alternativo.estado.posts, 1);
console.log('OK: tabela sem id, coluna Situação e identidade pelo controle nativo');

// Cabeçalho capturado na sessão real: ordenação, responsividade e dez colunas.
const sei415 = servidor(); sei415.estado.layoutSei415 = true;
assert.deepEqual(await blocos.listarBlocosParaInclusao(sei415.sei), [
  { id: '11', numero: '111111', descricao: '<img src=x onerror=alert(1)> Árvore' },
]);
assert.deepEqual(await blocos.retornarBlocoParaInclusao(sei415.sei, '11', url), { id: '11', rotulo: '111111 - Árvore' });
assert.equal(sei415.estado.posts, 1);
console.log('OK: cabeçalho real SEI 4.1.5 e preservação dos campos nativos do POST');

const restrito = servidor(); restrito.estado.descricao = 'inexistente'; restrito.estado.grupo = 'restrito';
assert.equal((await blocos.listarBlocosParaInclusao(restrito.sei)).length, 1, 'remove filtros que ocultam blocos elegíveis');
assert.equal(restrito.estado.descricao, 'inexistente'); assert.equal(restrito.estado.grupo, 'restrito');
const paginado = servidor(); paginado.estado.paginado = true; paginado.estado.pagina = 1;
assert.equal((await blocos.listarBlocosParaInclusao(paginado.sei)).length, 1, 'consulta desde a primeira página e percorre as seguintes');
assert.equal(paginado.estado.pagina, 1, 'restaura página salva');
assert.deepEqual(await blocos.retornarBlocoParaInclusao(paginado.sei, '11', url), { id: '11', rotulo: '111111 - Árvore' });
const restauracao = servidor(); restauracao.estado.descricao = 'inexistente'; restauracao.estado.falharRestauracao = true;
const avisos: string[] = [];
assert.deepEqual(await blocos.retornarBlocoParaInclusao(restauracao.sei, '11', url, { aoAviso: aviso => avisos.push(aviso) }), { id: '11', rotulo: '111111 - Árvore' }, 'falha de restauração não invalida retorno confirmado');
console.log('OK: filtros de descrição/grupo, paginação e retorno apesar de falha de restauração');

assert.equal(avisos.length, 1); assert.match(avisos[0], /filtros/i);
const falhaOriginal = servidor(); falhaOriginal.estado.descricao = 'inexistente'; falhaOriginal.estado.falharRestauracao = true; falhaOriginal.estado.semOpcao = true;
await assert.rejects(() => blocos.retornarBlocoParaInclusao(falhaOriginal.sei, '11', url), /não confirmou o retorno/);

const segundaPagina = servidor(); segundaPagina.estado.paginado = true;
assert.equal((await blocos.listarBlocosParaInclusao(segundaPagina.sei)).length, 1, 'bloco que aparece somente na segunda página deve ser oferecido');
assert.equal(segundaPagina.estado.pagina, 0, 'devolve primeira página salva');
const consultaAviso = servidor(); consultaAviso.estado.descricao = 'inexistente'; consultaAviso.estado.falharRestauracao = true;
const avisosConsulta: string[] = [];
assert.equal((await blocos.listarBlocosParaInclusao(consultaAviso.sei, { aoAviso: a => avisosConsulta.push(a) })).length, 1);
assert.equal(avisosConsulta.length, 1);
