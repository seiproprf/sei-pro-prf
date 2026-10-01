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

Ver a seção abaixo, preenchida na Tarefa 20.
