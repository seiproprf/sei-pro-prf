/* Reaplicar a ordenação ao atualizar a estrutura não pode separar os grupos. */
(async () => {
  const iguais = (obtido, esperado, etapa) => {
    if (JSON.stringify(obtido) !== JSON.stringify(esperado)) {
      throw new Error(`${etapa}: esperado ${JSON.stringify(esperado)}, obtido ${JSON.stringify(obtido)}`);
    }
  };
  const esperarFiltro = tabela => new Promise(resolve => tabela.one('filterEnd', resolve));
  const esperarInicializacao = async tabela => {
    const limite = performance.now() + 3000;
    while (!tabela[0].config.widgetOptions.filter_initialized) {
      if (performance.now() > limite) throw new Error('Filtro não inicializado');
      await new Promise(resolve => requestAnimationFrame(resolve));
    }
  };
  const linha = (id, usuario) => `<tr id="P${id}"><td><input type="checkbox"></td><td><a href="?acao=anotacao_registrar" aria-label="Anotação / Nota ${id} / autor"><img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'/%3E" alt=""></a></td><td><a href="?acao=procedimento_trabalhar&id_procedimento=${id}">${id}</a></td><td>${usuario}</td></tr>`;
  try {
    localStorage.clear();
    document.querySelector('#fixture').innerHTML = `<table id="tblProcessosRecebidos"><thead><tr><th>Seleção</th><th>Símbolos</th><th>Processo</th><th>Atribuição</th></tr></thead><tbody>${linha(42, 'ana')}${linha(43, 'bia')}</tbody></table>`;
    const tabela = $('#tblProcessosRecebidos');
    tabela.tablesorter({ widgets: ['saveSort', 'filter'], sortList: [[2, 0]], widgetOptions: { filter_saveFilters: true } });
    await esperarInicializacao(tabela);
    tabela.find('#P42').before('<tr class="tableHeader" id="g1"><th colspan="4">Grupo 1</th></tr>');
    tabela.find('#P43').before('<tr class="tableHeader" id="g2"><th colspan="4">Grupo 2</th></tr>');
    const ordem = () => tabela.find('tbody tr').map((_i, tr) => tr.id).get();
    const conferirGrupos = etapa => iguais(ordem(), ['g1', 'P42', 'g2', 'P43'], etapa);
    renderizar(document, true, true);
    conferirGrupos('habilitar coluna');
    await esperarInicializacao(tabela);
    iguais(tabela[0].config.sortList, [[3, 0]], 'índice do processo em coluna');
    renderizar(document, true, true);
    conferirGrupos('renderização repetida');
    tabela.find('tbody').append('<tr class="infraCaption" id="caption"><th colspan="4">Legenda</th></tr>');
    renderizar(document, true, true);
    iguais(ordem(), ['g1', 'P42', 'g2', 'P43', 'caption'], 'legenda nova sem mudar o número de colunas');
    iguais(tabela.find('#caption th')[0].colSpan, 5, 'colspan da legenda nova');
    await esperarInicializacao(tabela);
    tabela.find('#caption').remove();
    const filtrado = esperarFiltro(tabela);
    $.tablesorter.setFilters(tabela[0], ['', '', '', '', 'ana'], true);
    await filtrado;
    conferirGrupos('filtro no grupo');
    iguais(tabela.find('#P42').hasClass('filtered'), false, 'processo correspondente');
    iguais(tabela.find('#P43').hasClass('filtered'), true, 'processo filtrado');
    iguais(tabela.find('.tableHeader.filtered').length, 0, 'cabeçalhos dos grupos visíveis');
    renderizar(document, true, false);
    conferirGrupos('desabilitar coluna');
    await esperarInicializacao(tabela);
    iguais(tabela[0].config.sortList, [[2, 0]], 'índice original do processo');
    iguais($.tablesorter.getFilters(tabela[0]), ['', '', '', 'ana'], 'filtro acompanha atribuição');
    iguais(tabela.find('.tableHeader th').map((_i, th) => th.colSpan).get(), [4, 4], 'colspans restaurados');
    renderizar(document, true, true);
    renderizar(document, false);
    conferirGrupos('desligar anotações');
    await esperarInicializacao(tabela);
    iguais($.tablesorter.getFilters(tabela[0]), ['', '', '', 'ana'], 'filtro preservado em trocas rápidas');
    iguais(tabela.find('.spro-anotacao-coluna').length, 0, 'coluna removida');
    tabela.find('.tableHeader').remove();
    tabela.trigger('sorton', [[[2, 1]]]);
    renderizar(document, true, true);
    await esperarInicializacao(tabela);
    iguais(ordem(), ['P43', 'P42'], 'ordenação descendente sem grupos');
    iguais(tabela[0].config.sortList, [[3, 1]], 'índice ordenado sem grupos');
    iguais($.tablesorter.getFilters(tabela[0]), ['', '', '', '', 'ana'], 'filtro sem grupos');
    tabela.trigger('sorton', [[[3, 0]]]);
    iguais(ordem(), ['P42', 'P43'], 'nova ordenação funciona depois da troca de coluna');
    window.resultadoTestes = { ok: true };
    document.querySelector('#resultado').textContent = 'OK: agrupamentos, legendas, ordenação e filtros preservados ao alternar a coluna.';
  } catch (erro) {
    window.resultadoTestes = { ok: false, erro: erro.message };
    document.querySelector('#resultado').textContent = `FALHA: ${erro.message}`;
  }
})();
