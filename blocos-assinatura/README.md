# Retorno de blocos na inclusão

Content script isolado para `acao=bloco_escolher`. Acrescenta o botão nas barras
de comandos da tela de inclusão; a janela permite escolher e confirmar o bloco.
Sem barras reconhecidas, o botão fica junto ao seletor nativo.

O núcleo distingue o id usado no formulário do número exibido, lê os controles
nativos por linha e oferece somente blocos disponibilizados cuja disponibilização
a unidade pode cancelar. `retornarBlocoParaInclusao` compartilha o envio de ações
com `mudarBloco`, usando a ação `cancelar`, os links assinados e os formulários do
`sei-nucleo`. Revalida a ação antes do envio e busca a tela de inclusão para exigir
a opção efetivamente oferecida pelo servidor. A consulta marca Disponibilizado quando necessário, limpa temporariamente
os critérios de texto e seletores com opção neutra, começa na primeira página e
percorre a paginação nativa. Restaura os filtros e a página salvos no fim, inclusive
após uma falha. Se a restauração falhar, mostra um aviso sem invalidar o retorno
confirmado nem substituir o erro original. O núcleo entrega esse aviso por
`aoAviso` nas opções da consulta/retorno.

A interface copia apenas valor e texto dessa opção para o seletor vivo. Não
submete o formulário nem dispara `change`, preservando os documentos marcados e
os campos ocultos. O evento `chosen:updated` mantém o seletor aprimorado em dia.
Não há recarga automática. Erros de sessão, permissão ou confirmação permanecem
visíveis. Fechar a janela antes da confirmação não envia escrita. Enquanto a
escrita está em andamento, os controles ficam bloqueados para evitar envio duplo.

A preferência `retornarblocodisponibilizado` usa
`chrome.storage.sync.dataValues`, via `sei-comum`. Ausente significa ligada;
desligar remove botões e janela. Leituras tardias não remontam a interface. Uma
escrita já enviada termina a verificação, mesmo que a preferência seja desligada;
o resultado não reabre a janela. O ciclo encerra observador e listener no pagehide.

## Desenvolvimento

```sh
npm install
npm run verificar
npm run tipos
npm run build
```

O build gera `dist/js/init_blocos_assinatura.js`, versionado e registrado no
manifest, com verificação de bytes ASCII. Os testes usam HTML autoral sem dados
reais e o núcleo real com transporte simulado. Cobrem controles e links nativos,
permissões por linha, id/número, escrita, resposta inválida, estado inalterado,
opção ausente, confirmação, duplicidade, texto seguro, preferência, remontagem,
filtros de descrição/grupo, paginação e falhas de restauração.

## Conferência no SEI

1. Recarregue a extensão e abra Incluir em Bloco de Assinatura com documentos marcados.
2. Retorne um bloco disponibilizado pela unidade; confira o estado no SEI e o seletor.
3. Confira que documentos marcados continuam selecionados, com e sem Chosen.
4. Inclua os documentos e disponibilize novamente pelo comando nativo desejado.
5. Cancele a janela sem confirmar e confira que o bloco não mudou.
6. Desligue e ligue a preferência com a tela aberta; confira ambos os botões.

A conferência numa sessão real permanece necessária para validar as variantes
de versão, permissões e layout da instalação do SEI.
