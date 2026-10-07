# Anotações no Controle de Processos

Exibe a anotação já disponível na tela em um cartão por processo, em Recebidos,
Gerados e na visão detalhada. A preferência `mostraranotacaocontrole` usa o mesmo
`chrome.storage.sync.dataValues` das opções atuais; ausente significa ligada.

## Estrutura

- `src/leitura.ts`: lê o rótulo acessível ou os literais do tooltip com os parsers
  do `sei-nucleo`; não executa scripts nem interpreta o texto como HTML.
- `src/view.ts`: DOM somente leitura, com expansão acessível; preserva colunas,
  links, seleção e os nós nativos da anotação na visão detalhada.
- `src/controle.ts`: atualização idempotente por MutationObserver, preferência
  e cache de prioridade em memória durante a permanência na tela.
- `src/main.ts`: content script isolado, integração com as opções de `sei-comum`
  e transporte de `sei-nucleo`. Só inicia em `procedimento_controlar`.

O texto aparece sem requisição extra. Para o destaque vermelho, lê o checkbox
`chkSinPrioridade` no formulário de anotação pelo link assinado da própria
linha. O transporte limita a duas requisições simultâneas. Falha nessa leitura
mantém o cartão sem destaque e não repete automaticamente a requisição.
Desligar a preferência cancela leituras pendentes e restaura a tela nativa.
Nenhuma anotação é gravada ou enviada para serviços externos.

A interface fica dentro da célula existente do processo, acima do número; isso
preserva os índices de coluna utilizados pelo núcleo e pelo tablesorter atual.
A visão detalhada reutiliza a coluna Anotação quando presente. O pacote não
substitui a anotação da árvore nem sua edição.

## Desenvolvimento

```sh
npm install
npm run verificar
npm run tipos
npm run build
```

O build gera `dist/js/init_anotacoes_controle.js`, incluído no manifest, com
verificação de bytes ASCII. Testes incluem uma fixture real do SEI 4.1, conteúdo
com escapes e entidades, dados maliciosos tratados como texto, visualização
simples/detalhada, alterações de DOM, preferência ao vivo, prioridade e falhas
ou respostas tardias de IO.

## Validação manual no SEI

1. Recarregue a extensão e abra Controle de Processos com a opção ligada.
2. Confira notas curtas, multilinhas e prioritárias em Recebidos e Gerados.
3. Expanda e recolha uma nota longa; abra o processo pelo número e a edição
   pelo ícone nativo.
4. Ordene, filtre, pagine e alterne para a visão detalhada; confira ausência de
   duplicações e a integridade da seleção e das atribuições.
5. Desligue a opção e confirme que só a tela nativa permanece.

A validação automatizada e a prévia local com dados fictícios não substituem a
conferência em sessão real do SEI, especialmente nas versões 3 e 5.
