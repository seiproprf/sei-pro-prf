# Anotações no Controle de Processos

Mostra o texto da anotação de cada processo num cartão dentro da célula do
processo, logo abaixo do número, em Recebidos e Gerados. Opção
`mostraranotacaocontrole`, **desligada por padrão** (regra do
`verifyConfigValue`, lida por `opcaoLegadaMarcada` do `sei-comum`). Ajuda em
`pages/ANOTACAOCONTROLE.md`.

Proposta original: PR #174 (seiproprf). Esta versão mantém a ideia e corta o
que pesava:

- **Nenhuma requisição.** Texto, autor e prioridade vêm da linha já na tela:
  `aria-label` "Anotação[ com prioridade] / texto / autor" no SEI 4.1 e 5,
  tooltip no SEI 3; a prioridade também está no ícone (`anotacao2.svg`, ou
  "prioridade" no nome no SEI 3).
- **Nenhuma coluna nova.** O legado lê as colunas por posição em dezenas de
  lugares; dentro da célula do processo só dois leem a célula inteira, e os dois
  (mapa e Kanban em `sei-pro.js`) descartam `.spro-anotacao`.
- **O ícone nativo fica** e continua abrindo a edição.
- **Visão detalhada intocada:** o SEI já tem a coluna Anotação.

## Visual

Linguagem dos favoritos e do histórico: tokens de `sei-comum/src/ui/base.css`
(cores, fonte do sistema, raio de 8 px), fundo tingido pelo tom como a pílula
de lembrete, ícones `nota` e `chevron` de `sei-comum/src/ui/dom.ts`. Os tokens
são declarados só no cartão (`.spro-anotacao`), porque o `base.css` tem regras
globais e a página é do SEI. Prioridade: tom vermelho e pílula com texto (a cor
sozinha não basta).

Checklist das anotações: linha que **começa** com `[ ]`, `[X]` ou `[x]` vira
item com uma caixa desenhada (não é `<input>`, não tem clique); concluído fica
riscado. Marcador no meio da linha continua texto (o legado aceita em qualquer
ponto). Com prioridade e checklist na primeira linha, a pílula vai numa linha
própria, senão esmaga o item em célula estreita. No SEI 3 o tooltip chega já
transformado pelo `replaceSticknoteHome` do legado (HTML de ícones, linhas
coladas); `leitura.ts` desfaz isso de volta para `[ ]`/`[X]`.

Modo noturno do legado = `body.seiSlim.dark-mode`. O `sei-slim.css` pinta todo
elemento (`.seiSlim.dark-mode * { color }`, peso 0,2,0), inclusive os `<path>`
dos ícones; o `style.css` devolve as cores com seletores de peso 0,3,0.

## Estrutura

- `src/leitura.ts`: lê a anotação da linha, sem executar o tooltip.
- `src/view.ts`: põe, atualiza e retira os cartões. O estado fica no próprio
  cartão (`data-spro-chave`) e a seta usa um ouvinte único em captura no
  documento, então as linhas que o agrupamento clona funcionam sem tratamento
  especial.
- `src/controle.ts`: redesenha quando as tabelas mudam (MutationObserver) e
  quando a largura muda (ResizeObserver, só largura).
- `src/main.ts`: content script isolado; só age em `procedimento_controlar` e
  liga/desliga ao vivo quando as opções mudam.

## Desenvolvimento

```sh
npm install
npm run verificar   # testes (linkedom)
npm run tipos
npm run build       # verificar + gera dist/js/init_anotacoes_controle.js (só ASCII)
```

O linkedom ignora a fase de captura dos eventos; a ordem real (o clique na
seta não chega à linha) só se confere no Chrome.
