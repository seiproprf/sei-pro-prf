# Favoritos F4 — acompanhamento (o que mudou, lembretes, documentos favoritos) — plano

> **Para quem executa:** SUB-SKILL obrigatória: superpowers:executing-plans (inline). Passos com caixas (`- [ ]`).

**Objetivo:** o favorito deixa de ser só um atalho: mostra o que mudou desde a última vez que o usuário viu, lembra o usuário numa data, guarda documentos favoritos e ganha a estrela também na Pesquisa; o prazo "a partir do próximo documento do tipo T" (o antigo EM BREVE) passa a funcionar.

**Arquitetura:** o `atual` (última leitura) fica numa chave própria e LOCAL (`favoritos/<escopo>/a/<id>`), fora do envelope e da mesclagem, porque muda a cada carga da caixa; o `visto` fica no favorito (sincroniza). As fontes, da mais barata à mais cara e nunca abrindo a árvore de processo aberto na unidade sem pedido: (1) a caixa já carregada; (2) a árvore que o PRÓPRIO usuário abriu (mais o histórico resumido pelo link dela); (3) "Atualizar fora da unidade", só por pedido, com a caixa inteira lida antes como trava.

**Spec:** `docs/superpowers/specs/2026-10-01-favoritos-design.md` (7.1–7.5) e a memória `project_arvore_marca_recebido`.

## Restrições globais

- Nunca ler a árvore de processo aberto na unidade sem pedido; o "Atualizar" descarta todo favorito que está na caixa (lida inteira imediatamente antes) e os sigilosos; um por vez, ~3 s entre eles, cancelável; aviso se, mesmo assim, o processo chegou à unidade na corrida.
- `unidadesAbertas` fica fora: a tela não traz essa informação de forma estável (sem fixture). "Entrou/saiu da unidade" vem da caixa.
- Sem notificação do sistema (permissão nova).
- Sigiloso: a captura e o Atualizar não leem.

## Foco de revisão

1. Primeira leitura de um favorito antigo: não pode aparecer "novidade" falsa (o `visto` nasce igual ao `atual`).
2. Caixa paginada: favorito fora da página visível NÃO vira "saiu da unidade".
3. Lembrete vencido de dias atrás continua em "Para hoje" até concluir ou adiar.
4. Documento favorito em processo que ainda não é favorito: o processo entra na lista da unidade.
5. "Atualizar" cancelado no meio: o que já foi lido fica, nada mais é lido.

---

### Tarefa 1: modelo (`modelo/novidades.ts`, `modelo/lembrete.ts`, tipos, filtros, ordem, repositório)
`Instantaneo`, `compararInstantaneos(visto, atual)`, `resumoNovidade`, `temNovidade`; `Favorito.lembrete`, `Favorito.documentos`, `Favorito.visto`; `lembreteVencido`, `adiar`; filtros `novidade` e `lembrete`; ordem "novidade"; busca nos números dos documentos; repositório `gravarAtual`, `atuais`, `marcarVisto`.
- [ ] Testes: tabela visto × atual (docs a mais, andamento, saiu/entrou, não visualizado, doc novo, concluído); sem visto = sem novidade; lembrete de ontem vence; adiar; filtros; ordem; `atual` fora do envelope.

### Tarefa 2: sinais da caixa e captura da árvore (content script)
`pagina/novidades.ts`: `capturarDaCaixa(doc, repos)` (só conclui "fora da unidade" com a caixa inteira na tela), `capturarDaArvore(doc, url, repos, obter)` (qtd. de documentos + último andamento pelo link do histórico da árvore; marca visto), primeira leitura inicializa o `visto`.
- [ ] Testes com `caixa.html` e `arvore_completa.html` + `historico.html`.

### Tarefa 3: "Atualizar fora da unidade" (content script + app)
Op `atualizarForaDaUnidade` e `cancelarAtualizacao`; progresso em `favoritos/atualizando/<escopo>`; explicação na 1ª vez.
- [ ] Testes: favorito na caixa é descartado; sigiloso descartado; cancelamento para; aviso de corrida.

### Tarefa 4: app — novidades e lembretes
Selo no item, "Marcar como visto" (item e lote), filtros, "Para hoje", diálogo de lembrete (amanhã, 1 semana, 1 mês, data, texto; adiar; concluir), contador (botão da barra e aba do painel).
- [ ] Testes de UI com linkedom.

### Tarefa 5: documentos favoritos
Estrela por documento na árvore (DOM renderizado), `documentos[]` no favorito, lista no item (abrir pela pesquisa rápida com o nº SEI, remover).
- [ ] Testes: alternar documento, processo entra na lista, abrir pelo número.

### Tarefa 6: estrela na Pesquisa e prazo "próximo documento do tipo"
Estrela nos resultados de `protocolo_pesquisar`; modo de prazo `novoDocumento` no editor; resolução na captura da árvore pela tela "Gerar PDF" (primeiro documento do tipo depois de `desde`).
- [ ] Testes com `pesquisa_resultado.html`; resolução com tabela sintética.

### Tarefa 7: lembrete no balão e no Enviar Processo; build e commit.
