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

**SEI MJ de homologação 5.0.4: PENDENTE.** O login no `hmlsei.mj.gov.br` é feito pelo autor, na
janela do harness. Rode o mesmo roteiro (`scratchpad/harness/p2.mjs`, `p2b.mjs`, `persiste.mjs`,
`naovisto.mjs`) com `VISIVEL=1` no daemon.

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

**SEI MJ de homologação 5.0.4:** ver abaixo.
