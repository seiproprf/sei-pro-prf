# Favoritos — provas de campo

Resultados das provas ao vivo previstas no spec (`2026-10-01-favoritos-design.md`, seção 13) e no plano
F0+F1 (`docs/superpowers/plans/2026-10-01-favoritos-f0-f1.md`, Tarefas 19 e 20).

## P2 — iframe da extensão no SEI

**SEI SP de Treinamento, SEI 4.1.5 (CKEditor 4), 01/10/2026.**

Ambiente:
- Chrome for Testing 151 com puppeteer-core 24, perfil limpo.
- Extensão Lab descompactada da branch `feat/favoritos-ts`.
- `dataValues` vazio, o que conta como opção ligada, pela mesma regra do `checkConfigValue`.

| Verificação | Resultado |
|---|---|
| `<html data-seipro-favoritos="1">` no Controle de Processos | ok |
| Legado fora (`loadFavoritosPro`/`getStoreFavoritePro` indefinidos, sem `#favoriteTablePro`, sem `.iconFavoritePro`) | ok |
| Estrelas na caixa | 199 de 199 linhas |
| Painel `#panelHomePro > #favoritesPro` com iframe `chrome-extension://…/html/favoritos.html` | ok; o SEI 4.1.5 não bloqueia o iframe (sem CSP no caminho) |
| App conecta à aba | ok, **pela aba** (`chrome.tabs.getCurrent` funciona dentro do iframe; o recuo pela origem não foi preciso) |
| Clique na estrela | **0 requisições ao SEI**; estrela acesa; balão aberto; o item aparece no app |
| Estrela em processo **não visualizado** (`P112825`) | 0 requisições; depois de recarregar, **continua não visualizado** |
| Recarregar a caixa | o favorito persiste (`chrome.storage.local`) |
| Estrela no topo da árvore (`ifrArvore`) | ok, acesa para o processo favorito; o legado não põe a dele |
| Acompanhamento Especial | 50 estrelas em 50 linhas com processo |

**Defeito achado e corrigido:** o painel fica abaixo de 199 linhas, fora da tela. Nessa posição o
Chrome suspende a renderização do iframe de outra origem, o `ResizeObserver` não dispara, e o painel
ficava preso em 80 px até ser rolado até ele. Correção no commit `3c0a16d`: o app avisa a cada
redesenho (`aoRedesenhar`) e a altura é lida na hora, porque ler a geometria força o layout.
Conferido ao vivo: numa navegação limpa, a altura vai de 120 para 185 px em meio segundo, sem rolar.

**SEI MJ de homologação, SEI 5.0.4 (CKEditor 5), unidade TESTE, 01/10/2026.** O autor fez o login
na janela do harness.

| Verificação | Resultado |
|---|---|
| Marca e legado fora | ok |
| Estrelas na caixa | 27 de 27 linhas |
| Painel e app | ok, conectado **pela aba**; altura ajustada sozinha (151 px vazio, 224 px com 3 itens) |
| Clique com mouse real em duas linhas | estrela acesa e balão aberto nas duas; persistem depois de recarregar; o app lista os 3 favoritos |
| Requisições ao SEI no clique | 0 |
| Estrela no topo da árvore (`ifrArvore`) | ok |

O **primeiro** clique da rodada, logo depois do login, não registrou: a estrela ficou apagada,
sem balão e sem requisição. O clique pelo DOM na mesma linha funcionou, e os dois cliques
seguintes com mouse real também. O mais provável é a janela visível ter recebido interação no
mesmo instante. Ainda assim, vale observar na checklist manual se algum clique "se perde".

**Checklist manual do autor (Tarefa 19, Step 9): PENDENTE.** A automação não alcança a interação
dentro do app (diálogos, arrastar, área de transferência, download). Marque cada item ao conferir:

- [ ] Migração dos favoritos antigos (diálogo, "Trazer para <sigla>"; `configDataFavoritesPro` intacto)
- [ ] Balão: pasta, etiquetas, nota, "Pessoal" move e reabre, Esc e clique fora fecham
- [ ] Painel: busca, filtros, agrupar, arrastar, "Mover para cima", seleção, copiar, CSV no Excel, remover/desfazer, Lixeira
- [ ] Editor: título, pasta e etiqueta novas, nota, prazo em dias úteis com prévia; o diálogo não fica cortado
- [ ] Exportar `.json`, apagar um favorito, importar: ele volta sem duplicar
- [ ] Troca de unidade: a faixa aparece uma vez, a lista troca e a Pessoal continua
- [ ] Modo noturno do SEI Pro: o painel fica escuro
- [ ] Opção "Processos Favoritos" desligada: some tudo, sem erro no console

## P1 — Texto Padrão

**SEI SP de Treinamento, SEI 4.1.5 (CKEditor 4), unidade TESTE, 01/10/2026.** A gravação foi
autorizada pelo autor. O texto de prova `[_SEIPRO_PROVA_1]` foi criado e **excluído na mesma
execução** (ids 2724 e 2725, duas rodadas).

Ferramentas: o núcleo em IIFE (`node sei-nucleo/build.mjs --saida`) injetado na aba,
`Formulario.abrir/definir/enviar` com `modos: { txaConteudo: "html" }` e prova de sucesso pela volta
à lista.

**Telas e campos** (fixtures em `sei-nucleo/tests/fixtures/sei41/texto_padrao_{listar,cadastrar,alterar,consultar}.html`,
com hashes zerados e nomes de terceiros trocados por neutros):
- Formulário `#frmTextoPadraoInternoCadastro`, o mesmo nas três telas (o `action` muda).
- Campos: `txtNome` (maxlength **50**), `txtDescricao` (maxlength **300**), `txaConteudo` (textarea do CK4) e `hdnIdTextoPadraoInterno`.
- Botões: `sbmCadastrarTextoPadraoInterno` no cadastro e `sbmAlterarTextoPadraoInterno` na alteração. A consulta só tem "Fechar".
- Novo: a URL de cadastro vem no `onclick` de `#btnNovo` (`location.href='…'`).
- Exclusão: a função `acaoExcluir(id, desc)` da página põe o id em `hdnInfraItemId` e envia `#frmTextoPadraoInternoLista`. O `action` é a URL assinada de `texto_padrao_interno_excluir`, que está no próprio script.
- A lista da unidade tinha 10 textos, **sem paginação**. A paginação continua sendo um caso a tratar na F3, para unidades com muitos textos.

**Tamanho.** O conteúdo foi base64url em blocos `<p>` de 2.000 caracteres, precedidos de um `<p>` legível:

| Conteúdo | Gravou | Leitura idêntica | Tempo (gravar + ler) |
|---|---|---|---|
| 10 KB | sim | sim | 1,9 s |
| 60 KB | sim | sim | 2,1 s |
| 120 KB | sim | sim | 2,2 s |
| 250 KB | sim | sim | 2,8 s |
| 1 MB | sim | sim | 6,1 s |

**Filtro de XSS e codificação no 4.1.5:**
- JSON cru com `<b>` e `&` passou e voltou igual.
- JSON com aspas passou.
- Acentos, travessão e aspas curvas voltaram intactos (`paraLatin1Seguro` em modo html).

**O que muda na F3:**
- O teto de 100 KB do spec **não** vem de limite do banco: o 4.1.5 aceitou 1 MB. Ele continua valendo
  pelo outro motivo do spec, o CK5 baixar o conteúdo de todos os textos da unidade.
- Base64url continua sendo a escolha, por robustez diante do editor (o CK5 ainda não foi medido) e do filtro de XSS das outras versões.
- O ciclo criar → localizar pelo nome → alterar → consultar → excluir funciona com o `Formulario` do núcleo, sem código novo de infraestrutura.

**SEI MJ de homologação, SEI 5.0.4 (CKEditor 5), unidade TESTE, 01/10/2026.** Mesmo roteiro.
O texto de prova foi criado e **excluído** (id 22966).

| Conteúdo | Gravou | Leitura idêntica | Tempo |
|---|---|---|---|
| 10 KB | sim | sim | 0,7 s |
| 60 KB | sim | sim | 0,8 s |
| 120 KB | sim | sim | 1,0 s |
| 250 KB | sim | sim | 1,4 s |
| 1 MB | sim | sim | 4,0 s |

**Diferenças do SEI 5 que a F3 precisa tratar:**
- O conteúdo fica num `<textarea name="txaConteudo" class="infraTextarea editor-simples">` **sem id**.
  O `#txaConteudo` só existe no 4.1, então leia por `textarea[name="txaConteudo"]`. O envio por
  `name` funciona igual nos dois. O resto do formulário (`#frmTextoPadraoInternoCadastro`,
  `txtNome` 50, `txtDescricao` 300, `hdnIdTextoPadraoInterno`, botões `sbm*`) é igual ao 4.1.5.
- A leitura volta com **um nível a mais de escape HTML**: `&amp;`, `&#8212;` e `&#8220;` aparecem
  como texto. JSON cru exigiria desfazer o escape conforme a versão; o **base64url passa imune**,
  e isso confirma a escolha do spec. O parágrafo legível pode trazer entidades, o que não importa.
- A lista da unidade tinha 12 textos, sem paginação.
- As fixtures do SEI 5 **não foram versionadas**: são páginas do ambiente de homologação de um
  ministério, e o repositório é público. Elas ficaram fora de qualquer repositório,
  em `SEI Pro/provas-locais-favoritos/sei5/` (junto dos roteiros das provas), e cabe ao autor decidir se e como publicar.

## Rodada ao vivo das fases F2 a F4 (SEI SP de Treinamento 4.1.5, 01/10/2026)

Chrome for Testing 151 (headless), extensão Lab da branch, unidade TESTE. O painel lateral foi
aberto como página (`html/painel.html`), que é o que o Chrome carrega no `side_panel`.

| Verificação | Resultado |
|---|---|
| Botão Favoritos na barra do Controle de Processos | ok |
| Painel com abas Favoritos \| Agente | ok; o favoritos lateral se ligou à aba do SEI e mostrou a lista TESTE |
| **P3 — Agente dentro do iframe do painel** | ok: conectou à aba (mostrou "treinamento.sei.sp.gov.br — Controle de Processos") |
| Tiles do OSM a partir de página da extensão | ok (imagem 256×256 carregada) |
| Captura da caixa ("o que mudou") | ok: leituras gravadas em `favoritos/<escopo>/a/<id>` com aberto na unidade, atribuição e sinais |
| Convite para sincronizar (unidade sem consentimento) | ok |
| **Texto Padrão: ligar → sincronizar → apagar** | ok: com o consentimento, o texto `[_SEIPRO_FAV_pedro.soares]` foi criado (1.062 bytes), a linha de status mostrou "Sincronizado agora há pouco"; "Desligar e apagar do SEI" excluiu o texto. Nenhum texto ficou no SEI. |

**Defeitos achados nesta rodada e corrigidos (com teste antes):**
1. O app lateral mandava os pedidos para a aba "da frente", mesmo de outro SEI: com uma aba do SEI
   MJ de homologação aberta no mesmo perfil, o "apagar do SEI" da lista do SP foi para a aba do MJ (lá
   não havia texto, e nada foi gravado no MJ; a lista de textos do MJ foi conferida depois, só leitura).
   Agora o pedido vai para uma aba da MESMA unidade da lista aberta.
2. O consentimento do Texto Padrão era um só para o navegador inteiro: ligar numa unidade ligaria em
   qualquer SEI e unidade em que o usuário estivesse. Agora é por unidade (`host|idUnidade`).

**P4 (arquivo pela File System Access) e o higiene do seletor "Texto Padrão" ao gerar documento não
foram exercitados ao vivo** (o seletor de arquivo pede gesto humano). Ficam para a checklist do autor.

## Depois da revisão final (SEI SP 4.1.5, 01/10/2026)

A revisão final de contexto novo apontou 3 problemas críticos e 4 importantes. Mais 5 apontamentos
menores foram reclassificados como importantes, porque afetam consentimento, privacidade ou perda de
dados. Todos foram corrigidos, cada um com um teste que falhava antes da correção. O resumo está no
ledger, fora do repositório.

**Rodada ao vivo com o build corrigido:**
* Um texto que tinha ficado de uma rodada anterior foi apagado pelo próprio app.
* Ligar a sincronia criou o texto em 7 s.
* "Desligar e apagar do SEI" o removeu, e ele continuava ausente 20 s depois.

O defeito que essa rodada pegou antes da correção era uma rodada lenta que recriava o texto depois do
"apagar". Agora o "apagar" espera a mesma trava e confere o resultado, e a rodada não grava se o
usuário desligou no meio.

**Fica para a checklist do autor:**
* o teste crítico do "Atualizar fora da unidade": o histórico de um processo da unidade, antes e
  depois, não pode ganhar "Processo recebido". Para isso é preciso ter favorito fora da unidade e
  favorito na unidade, e no ambiente de treinamento todos estão na caixa;
* a P4 (arquivo pela File System Access);
* o seletor "Texto Padrão" ao gerar documento;
* o sidebar do Firefox.
