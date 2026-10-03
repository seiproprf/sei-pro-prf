# Histórico de Processos Visitados (reformulação em TypeScript) — especificação de desenho

Data: 02/10/2026. Branch `feat/historico-ts` (worktree `../sei-pro-historico`), a partir de
`feat/favoritos-ts` (59e1e6c), porque a extração para o `sei-comum` mexe em arquivos que essa
branch ainda tem à frente do master.

## 1. Objetivo

Reescrever o "Histórico de Processos Visitados" no molde do Favoritos novo: módulo TypeScript,
app numa página da extensão, mesmo visual, lista com seletores inteligentes e busca interativa.

- No SEI, o item do menu abre um **modal** (e não um painel).
- A barra lateral da extensão ganha a aba **Histórico**: Favoritos | Histórico | Agente de IA.
- Novidades aprovadas: linha do tempo (visitas contadas, grupos por dia, "Mais visitados"),
  ligação com Favoritos (estrela, filtro, favoritar em lote), privacidade (pausar, sigilosos
  mínimos, apagar por período, limite) e o Agente de IA lendo o histórico.

## 2. Decisões (aprovadas em conversa, 02/10/2026)

| Tema | Decisão |
|---|---|
| Escopo | **SEI + login.** A unidade de cada visita é gravada e vira filtro. Trocar de unidade não esconde nada. |
| Captura | **Árvore + consulta.** A visita é gravada na hora, pela árvore. A especificação, os interessados e os assuntos vêm da tela Consultar/Alterar Processo: 1 GET por processo, no máximo 1 vez a cada 12 h, e nunca em sigiloso. |
| Arquitetura | **Pacote novo `historico/`**, com a infraestrutura comum levada para o `sei-comum`. A estrela usa o modelo e o repositório do Favoritos (`@favoritos/...`), como o agente já faz. |
| Armazenamento | `chrome.storage.local`, uma chave por processo, **sem sincronizar** entre computadores. |
| Lançamento | Só o `dist/manifest.json` (Lab MV3, Chrome/Edge). Os outros três manifests seguem com o histórico antigo, intacto. |

## 3. O que existe hoje (legado)

- `setHistoryProcessosPro` (sei-functions-pro.js) grava no `localStorage` da página do SEI
  (`dadosHistoricoProcessoPro`), até ~500 itens, **sem separar por usuário**. A gravação só
  acontece quando o legado busca a tela Consultar/Alterar Processo (`ajaxDadosProcessoPro`).
- `getHistoryProcessosPro` abre um diálogo jQuery UI com tablesorter e monta o link à mão
  (`procedimento_trabalhar&id_procedimento=`), o que **derruba a sessão** no SEI 5 (spec do
  Favoritos, 5.3).
- O item do menu (`#historicoProcessosPro`, sei-pro-all.js) aparece com a opção
  `historicoproc` ligada.

## 4. Arquitetura

```
sei-comum/   + ponte/lateral.ts       os dois lados da ponte do painel lateral, com canal e chave por parâmetro
             + ponte/conexaoDaAba.ts  o app aceita a porta da própria aba (canal por parâmetro)
             + pagina/abrir.ts        abrir processo sem montar link (linha da caixa ou pesquisa rápida)
             + pagina/tema.ts         temaEscuroLegado, corDoTemaSei, destaqueDaCorSei
             + ui/aviso.ts            aviso (toast) do app, com emissor trocável
             + csv.ts                 gerarCsv (planilha brasileira)
             + painel/shell.ts        o shell da barra lateral, genérico nas abas (sai de favoritos/src/shell/painel.ts)
             + ui/lista.css           linha, fichas, barra de filtros, busca e diálogo, com classes spro-lista-*
sei-nucleo/  + dominio/processo.ts: consultarDaArvore(http, arvore) (sem buscar a árvore de novo)
             + sessao/pagina.ts: paginaDe, documentoTopo (dependem do tipo Pagina do núcleo; o sei-comum
               não depende do núcleo)
favoritos/   passa a importar do sei-comum o que saiu dele (sem mudar comportamento); o shell vira
             um invólucro fino que passa as três abas ao sei-comum
historico/   (novo)
   ├─ src/modelo/      tipos, visita (mesclar, contar), retenção, filtro, contagens, busca, faixas de dia, csv
   ├─ src/repositorio.ts
   ├─ src/preferencias.ts
   ├─ src/migracao/    legado.ts (dadosHistoricoProcessoPro → Visita)
   ├─ src/pagina/      content script: captura, modal, evento do menu, lado da aba (ponte lateral)
   ├─ src/app/         html/historico.html (modo modal e modo lateral)
   ├─ estatico/        historico.html, historico.css
   └─ tests/           verificar-*.ts (tsx + linkedom, como o Favoritos)
agente-ia/   + tools/historico.ts: historico_listar (lê @historico/modelo e o repositório)
```

**O CSS de lista no `sei-comum`.** O histórico usa classes `spro-lista-*` novas, desenhadas a
partir do `favoritos.css` (mesmas medidas, cores e estados). O Favoritos **não** troca as
classes `fav-*` nesta etapa: são 1.374 linhas recém-publicadas, e trocá-las arrisca regressão
visual sem ganho para o usuário. Fica anotado como adoção futura.

### Onde cada coisa roda

| Peça | Contexto | O que faz |
|---|---|---|
| `js/init_historico.js` | content script, mundo isolado, todos os frames, `document_start`, mesmos `matches` do `init_favoritos.js` | Marca `<html data-seipro-historico>`. **Árvore:** registra a visita e completa os dados. **Topo:** abre o modal pelo evento do menu, atende "abrir processo", migra o legado e responde à barra lateral. |
| `html/historico.html` | página da extensão | **Um só app.** `#modo=modal`: iframe sobre a tela do SEI. `#modo=lateral`: dentro do `painel.html`. Lê o `chrome.storage.local` direto e se redesenha pelo `onChanged`. |
| `html/painel.html` | barra lateral | Abas Favoritos \| Histórico \| Agente de IA. Cada aba aparece só se o manifest tiver o content script dela. |
| `background.js` | service worker | `abrirPainel` passa a aceitar `aba: "historico"`. |

### Ponte

- **Modal ⇄ sua aba:** a mesma porta `chrome.runtime.connect` do app embutido do Favoritos,
  agora com o canal `seipro-historico`. O app aceita só a porta da própria aba, do frame de topo
  (`app/ponte.ts` do Favoritos, generalizado com o nome do canal).
- **Lateral ⇄ aba do SEI:** a ponte lateral generalizada, com o canal
  `seipro-historico-lateral` e o anúncio em `historico/lateralAberto`. A chave de roteamento da
  aba é `host|login`, sem a unidade. Ao trocar de unidade, o painel relê o contexto e remonta a
  lista, para os Favoritos (estrela, filtro, "Favoritar") irem para a lista da unidade certa; as
  visitas são as mesmas.
- **Pedidos do app à aba:** `contexto`, `abrirProcesso`, `fechar` (só no modal), `aviso`,
  `apagarLegado`.
- **Dados não passam pela ponte.**

## 5. Modelo de dados

### 5.1 Escopo e chaves (`chrome.storage.local`)

| Chave | Conteúdo |
|---|---|
| `historico/<host>\|<login>/v/<idProcedimento>` | `Visita` |
| `historico/<host>\|<login>/meta` | `{ migradoEm?, migrados?, avisoMigracao?, apagarLegado? }` |
| `historico/preferencias` | `Preferencias` |
| `historico/migracao/<host>` | `{ em, login }`: o histórico antigo deste SEI já foi trazido (5.4) |
| `historico/lateralAberto` | anúncio do painel lateral (`Abertura` da sei-comum) |

O login vai em minúsculas, lido do título do usuário (`lerContexto`), e não do cookie.

### 5.2 Entidades

```ts
type Nivel = "publico" | "restrito" | "sigiloso";

interface Visita {
  id: string;                  // idProcedimento
  protocolo: string;
  tipo?: string;
  especificacao?: string;      // nunca em sigiloso
  interessados?: string[];     // nunca em sigiloso
  assuntos?: string[];         // nunca em sigiloso
  nivel?: Nivel;
  unidades: { id: string; sigla: string }[]; // de onde você abriu, a mais recente primeiro, até 10
  primeira: number;            // epoch ms
  ultima: number;
  vezes: number;
  completadoEm?: number;       // última leitura do Consultar/Alterar Processo
  tentouEm?: number;           // tentativa de completar em curso ou que falhou (espera 2 min)
  origem?: "legado";
}

interface Preferencias {
  registrar: boolean;          // false = pausado (padrão true)
  limite: 500 | 1000 | 2000 | 5000;  // padrão 1000
  ordem: "recentes" | "visitados" | "protocolo";  // padrão "recentes"
  agruparPorDia: boolean;      // padrão true (só vale em "recentes")
}
```

### 5.3 Regras

- **Nova visita** só se a anterior foi há **mais de 30 minutos**: `vezes + 1`. Antes disso, só
  `ultima` é atualizada. Recarregar a árvore depois de criar um documento não conta.
- **Unidade:** a da tela vai para o início de `unidades`, sem repetir, e a lista guarda até 10.
- **Limite:** depois de gravar, se o total passar do limite, saem as visitas de `ultima` mais
  antiga. A poda conta só os nomes das chaves (`getKeys`) e só lê as visitas quando passou do
  limite. Também roda na hora em que o limite muda.
- **Sigiloso:** só `id`, `protocolo`, `tipo`, `nivel`, `unidades` e os horários. Se o processo
  **vira** sigiloso, a visita perde especificação, interessados e assuntos. Nenhum GET de
  consulta.
- **Pausado:** nada é gravado, nem a atualização de visitas que já existem.
- **Apagar por período** (última hora, hoje, últimos 7 dias, últimos 30 dias, tudo): tira os
  processos cuja `ultima` cai no período. O diálogo avisa que um processo visto há 20 dias e de
  novo hoje sai inteiro em "hoje", porque cada visita não fica guardada separada.
- **Observações** do processo nunca são guardadas.
- **Cota** (`storage.local` de 10 MB dividido com Favoritos e Agente, até 5.000 visitas):
  interessados e assuntos guardam até 10 itens de até 120 caracteres; a especificação, até 500.

### 5.4 Migração do legado

- **Quando:** na janela de topo, a primeira vez que o content script roda num host com
  `dadosHistoricoProcessoPro` no `localStorage` e sem `meta.migradoEm` para aquele login. Com
  o registro pausado não roda (fica para quando retomar). A marca `historico/migracao/<host>`
  faz a importação acontecer uma vez por SEI: o segundo login só grava `migradoEm`.
- **Conversão:**

  | Legado | Novo |
  |---|---|
  | `id_procedimento` | `id` |
  | `protocolo` | `protocolo` |
  | `tipo_processo` | `tipo` |
  | `descricao` | `especificacao` |
  | `assuntos` (lista de textos) | `assuntos` |
  | `nivel_acesso` (`"0"`, `"1"`, `"2"`) | `nivel` (público, restrito, sigiloso) |
  | `datetime` (`AAAA-MM-DD HH:mm:ss`, hora local) | `primeira = ultima` |

  Também: `vezes: 1`, `unidades: []`, `origem: "legado"`. As observações ficam de fora, e os
  sigilosos ficam sem especificação nem assuntos.
- **Item com defeito:** sem id, sem protocolo ou com data inválida é ignorado e contado.
- **Mesclagem:** se o processo já existir no novo, ficam a `primeira` mais antiga e a `ultima`
  mais recente. Os dados de texto do novo têm precedência.
- **A chave antiga fica**, para o oficial e para um eventual retorno de versão. "Apagar tudo"
  a remove: na hora, pela RPC `apagarLegado`, se houver aba conectada; senão, por
  `meta.apagarLegado`, cumprido na próxima vez que o SEI daquele host abrir.
- **Risco aceito:** a lista antiga não tinha dono. Se dois logins usavam o mesmo navegador,
  quem abrir primeiro herda tudo.

## 6. Captura

1. O content script, **no frame da árvore** (`#topmenu` + `#divArvore`), com `historicoproc`
   ligada e `registrar: true`:
   - lê a árvore (`lerArvore`) e o contexto pelo topo (`contextoDe(documentoTopo())`);
   - chama `registrarVisita({ id, protocolo, tipo, nivel, unidade }, agora)`.
2. **Completar:** se o processo não é sigiloso e `completadoEm` está vazio ou tem mais de 12 h,
   `consultarDaArvore(http, arvore)` lê `procedimento_alterar` (ou `procedimento_consultar`)
   pelo link que a própria árvore já trouxe. Ela devolve tipo, especificação, interessados e
   assuntos.
   - O resultado é gravado com `completadoEm = agora`.
   - Falha (rede, permissão, tela diferente) fica em `console.warn` e tenta de novo na próxima
     visita.
3. **O legado se recolhe:** com `data-seipro-historico` no `<html>`, `setHistoryProcessosPro`
   retorna sem gravar.
4. **Fica de fora:** a Pesquisa, a caixa e as listas não registram visita. Só abrir o
   processo conta.

## 7. Interface

### 7.1 Modal no SEI

- **Abrir:** o item do menu continua o do legado (mesma posição, ícone e texto). Com o
  marcador presente, `getHistoryProcessosPro` dispara `document.dispatchEvent(new
  CustomEvent("spro-historico-abrir"))` e retorna. O content script do topo escuta o evento,
  que atravessa os mundos.
- **Montagem:**
  - iframe `html/historico.html#modo=modal`, `position: fixed`, tela inteira, fundo
    transparente e `z-index` máximo;
  - `color-scheme` igual ao do app, senão o Chrome pinta fundo opaco;
  - a rolagem da página trava, como na sobreposição do Favoritos.
- **Diálogo:** o app abre um `<dialog class="spro-dialogo hist-modal">` com `showModal()`.
  - Tamanho: `min(1100px, 100vw - 32px)` × `min(860px, 100vh - 32px)`.
  - O véu é o `::backdrop`.
- **Fechar:** Esc, o X ou o clique no véu. O app chama `fechar`, o content script tira o
  iframe, destrava a rolagem e devolve o foco ao item do menu. A porta caiu (extensão
  recarregada)? O iframe sai igual.
- **Tema:** segue o SEI, como o painel embutido (modo noturno do SEI Pro e cor da barra do
  sistema como destaque).
- **Abrir um processo:**
  - clique no número: `abrirProcesso` na própria aba, e o modal fecha;
  - Ctrl/⌘ + clique ou "Abrir em outra aba": abre em nova aba, e o modal fica.

### 7.2 Aba na barra lateral

- O `painel.html` ganha a aba **Histórico** (ícone `historico`), entre Favoritos e Agente de IA.
- A lista é a do SEI + login da aba do SEI que está na frente nesta janela. Sem aba do SEI:
  "Abra o SEI nesta janela para ver seu histórico." e "Se o SEI já está aberto e nada aparece,
  recarregue a página dele (F5).", como no Favoritos.
- **Tema:** segue o sistema (`prefers-color-scheme`), como a aba Favoritos.
- **Ao vivo:** abrir um processo no SEI põe a visita no topo da lista na hora (`onChanged`).
- **Trocar de unidade:** a chave de roteamento é `host|login`, mas o painel relê o contexto e
  remonta a lista, para os Favoritos irem para a lista da unidade certa.
- **Desligado nas opções:** o painel mostra o estado "desligado" sem esperar aba; sem SEI nem
  login, o menu só oferece "Opções do SEI Pro" (não há o que apagar).
- O modal tem o botão **"Abrir na barra lateral"** onde o pacote tem barra lateral. Ele usa
  `{tipo:"abrirPainel", aba:"historico"}`, e o modal fecha.

### 7.3 A lista (igual nos dois modos)

**Cabeçalho**
- Título "Histórico", com o total ("1.234 processos"), só no modal. Na lateral, a aba já diz
  o que é.
- À direita: "Abrir na barra lateral" (modal), o menu ⋯ e o X (modal).
- O menu ⋯ tem:
  - Exportar CSV (o que está filtrado);
  - Pausar o registro / Retomar o registro;
  - Apagar histórico…;
  - Limite de processos…;
  - Opções do SEI Pro.

**Faixas**
- "O registro está pausado: nada novo entra no histórico.", com o botão **Retomar**.
- "Histórico antigo trazido para cá: N processos.", uma vez, depois da migração, com o botão
  **Entendi**.

**Busca**
- Campo com placeholder "Buscar número, tipo, especificação, interessado ou assunto".
- A tecla "/" leva o cursor até ela, o Esc limpa, e o filtro roda 150 ms depois da última tecla.
- Não diferencia acento nem maiúsculas. O número casa com ou sem pontuação: só os dígitos são
  comparados quando a busca tem 4 dígitos ou mais.
- Busca em: protocolo, tipo, especificação, interessados, assuntos e siglas das unidades.

**Seletores inteligentes** (`criarCombo`: múltipla escolha, contagem por opção, busca dentro do
seletor). A combinação é **OU dentro do campo e E entre campos**.

| Seletor | Opções |
|---|---|
| Período | Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Mais antigos (sem busca; todas sempre) |
| Tipo | tipos presentes, com contagem |
| Unidade | siglas onde você abriu (qualquer uma das `unidades`) |
| Interessado | interessados presentes |
| Assunto | assuntos presentes |
| Situação | Nos favoritos, Fora dos favoritos, Visitados mais de uma vez, Públicos, Restritos, Sigilosos. As raras só aparecem quando existem; "Nos/Fora dos favoritos" só com o Favoritos novo ativo. |

Mais duas peças na mesma barra:
- **Ordem:** Mais recentes (padrão), Mais visitados, Por número.
- **Agrupar por dia:** botão alternável, ligado por padrão, que só aparece em "Mais recentes".

Os filtros ligados viram **fichas** removíveis, com "Limpar filtros" a partir de 2 fichas. Os
filtros e a busca valem **para a tela aberta** e não são gravados.

**Grupos por dia** (com "Agrupar" ligado): Hoje, Ontem, Últimos 7 dias, Últimos 30 dias, Mais
antigos. Cada grupo tem cabeçalho com a contagem, e o cabeçalho fica grudado no topo ao rolar.

**Dias contados pelo calendário local** (pelo `ultima`):
- "Hoje" é a mesma data local de agora, e "Ontem" é a data anterior.
- **No filtro, os períodos são cumulativos:** "Últimos 7 dias" = de hoje − 6 até hoje,
  "Últimos 30 dias" = de hoje − 29 até hoje, e "Mais antigos" = antes de hoje − 29. Marcar
  "Hoje" e "Últimos 7 dias" dá os últimos 7 dias. As contagens seguem a mesma regra.
- **Nos grupos, os períodos são disjuntos:**
  - "Últimos 7 dias" = de hoje − 6 a hoje − 2;
  - "Últimos 30 dias" = de hoje − 29 a hoje − 7;
  - cada processo aparece num grupo só.

**Linha**
- Caixa de seleção e estrela (só com o Favoritos novo ativo).
- **Número** (link) com selo "sigiloso" ou "restrito".
- **Tipo** em cinza e **especificação** em negrito.
- Linha de apoio: "hoje às 14:32" / "ontem às 09:10" / "12/09/2026 às 10:00" · "3 visitas"
  (só se > 1) · sigla da última unidade · interessados (até 2, depois "+N").
- O `title` da linha traz a primeira visita.
- Menu ⋯ da linha: Abrir em outra aba, Copiar número, Favoritar / Tirar dos favoritos, Remover
  do histórico.

**Seleção em lote:** a barra aparece com 1 ou mais selecionados e traz Favoritar, Copiar
números, Exportar CSV e Remover do histórico. A seleção só conta os itens **visíveis**: mudar o
filtro tira da seleção quem sumiu, e assim o lote nunca age sobre item escondido (defeito
conhecido do Favoritos, evitado aqui).

**Desempenho:** desenha 200 linhas e um botão "Mostrar mais 200". A busca e os filtros rodam
sobre o modelo em memória, não sobre o DOM.

**Vazio:** "Nenhum processo visitado ainda. Abra um processo no SEI e ele aparece aqui." Com
filtro, a mensagem é "Nada com esses filtros", seguida de "Limpar filtros".

**Desligado** (`historicoproc` falsa): "O histórico está desligado nas opções do SEI Pro.",
com o botão **Abrir opções**. Nada é capturado.

### 7.4 Diálogos

Todos usam o `abrirModal` do app (o mesmo `<dialog class="spro-dialogo">` do Favoritos). No
modo modal, o diálogo abre sobre o próprio modal.

| Diálogo | Conteúdo |
|---|---|
| Apagar histórico | Grupo de opções com os 5 períodos, o aviso da regra de 5.3 e o botão "Apagar" (perigo). "Tudo" também apaga a chave antiga (5.4). |
| Limite | Grupo de opções 500 / 1.000 / 2.000 / 5.000 e o total atual. Baixar o limite avisa quantos saem. |
| Confirmar remoção em lote | "Remover N processos do histórico?" |

## 8. Ligação com Favoritos

- **Favoritos novo ativo** = o manifest tem `js/init_favoritos.js` **e** a opção
  `gerenciarfavoritos` está ligada (`lerOpcaoLegada`). O content script calcula e manda no
  `contexto` (`favoritosAtivo`). Sem ele: nada de estrela, de filtro de favoritos nem de
  "Favoritar".
- **Estado da estrela:** cheia se o processo é favorito ativo na lista da unidade da tela ou
  na Pessoal. Lê os dois `RepositorioFavoritos` do contexto e se atualiza pelo `aoMudar`
  deles.
- **Favoritar:** vai para a lista da unidade da tela (ou a Pessoal, sem unidade), igual à
  estrela da caixa. Usa `adicionar({ id, protocolo, tipo, especificacao, sigiloso })`. O aviso
  é "Favoritado em <SIGLA>", com o botão **Desfazer**.
- **Tirar:** sai da lista onde está (vai para a lixeira do Favoritos). O aviso tem **Desfazer**.
- **Em lote:** o mesmo, para os selecionados que ainda não são favoritos.

## 9. Agente de IA

- **Ferramenta `historico_listar`** (`efeito: "leitura"`).
  - Parâmetros:
    - `busca?`;
    - `periodo?` (`hoje`, `ontem`, `7dias`, `30dias`, `todos`; padrão `todos`);
    - `tipo?`, `unidade?`;
    - `ordem?` (`recentes`, `visitados`);
    - `limite?` (padrão 30, máximo 200).
  - O escopo vem da operação existente `favoritos.escopo` (host e login da aba ligada).
  - Devolve `{ total, itens, sigilososOmitidos, cortados? }`. Cada item traz protocolo, tipo,
    especificação, interessados, assuntos, `ultimaVisita` (dd/mm/aaaa hh:mm), `vezes` e
    `unidade`.
  - **Sigilosos nunca saem**, nem o número.
- Registrada só quando o manifest tem `js/init_historico.js`.
- Sugestão nova no painel do agente: **"Processos que vi esta semana"**, com o prompt "Liste
  os processos que visitei nos últimos 7 dias, do mais recente ao mais antigo, com tipo e
  especificação, e diga quais parecem pedir ação minha.".

## 10. Coexistência com o legado e pacotes

- **Marcador:** `marcarAtivo` grava `data-seipro-historico` no `<html>` de forma síncrona, em
  `document_start`.
- **Legado** (sei-functions-pro.js), com o marcador presente:
  - `getHistoryProcessosPro` dispara o evento e retorna;
  - `setHistoryProcessosPro` retorna sem gravar.
  - Sem o marcador, nada muda.
- **`dist/manifest.json` (Lab MV3):**
  - content script `js/init_historico.js` (todos os frames, `document_start`, mesmos
    `matches` do favoritos);
  - no WAR: `html/historico.html`, `js/historico/app.js` e `css/historico.css`.
- **`background.js`:** `abrirPainel` aceita `historico`.
- **Os outros 3 manifests não mudam.** No oficial e no Firefox, o legado continua igual.

## 11. Qualidade e segurança

- O build é o mesmo do Favoritos: esbuild com `charset: "ascii"` e o portão de bytes não ASCII
  no fim. O Biome e o `tsc --noEmit` passam sem erro.
- **DOM só por `h()`** (sei-comum/ui/dom), sem `innerHTML` com dado do SEI. O contrato DOM
  seguro do projeto vale também aqui.
- Nenhuma requisição sai da extensão para fora do SEI.
- As requisições ao SEI são só GETs de leitura, pelo link assinado que a própria árvore trouxe.

## 12. Testes

São scripts `tests/verificar-*.ts` (tsx + linkedom), como no Favoritos:

| Suíte | O que prova |
|---|---|
| modelo | mesclar visita (30 min, unidades, sigiloso), retenção, faixas de dia nas viradas de dia e de fuso, busca (acento, dígitos), filtros (OU/E), contagens, ordens, CSV |
| repositório | registrar, completar, podar, apagar por período, meta, `aoMudar` |
| migração | conversão, itens com defeito, mesclagem, sigilosos, observações fora |
| captura | fixture de árvore SEI 4.1.5; GET só quando precisa; sigiloso sem GET; pausado sem gravar |
| núcleo | `consultarDaArvore` com o formulário real (fixture) |
| app | modal e lateral, busca, seletores, fichas, grupos, "mostrar mais", lote só com os visíveis, estrela, diálogos, desligado, pausado |
| página | modal abre pelo evento, trava e destrava a rolagem, fecha por RPC e quando a porta cai |
| shell | 3 abas, preguiça, troca por `painelAba`, sem a aba quando o manifest não tem |
| agente | `historico_listar` sem sigilosos, períodos, limite |

As suítes atuais não podem regredir: Favoritos 572, `sei-comum` 163, `sei-nucleo` e
`agente-ia` no número da linha de base.

**Ao vivo:** SEI SP 4.1.5 de treinamento (harness Chrome, porta 9444), conferindo:
- abrir processo → visita aparece na lateral;
- item do menu → modal;
- abrir pelo modal e pela lateral;
- favoritar;
- migração do histórico antigo;
- claro e escuro.

SEI 5 quando houver acesso de teste. Não há fixture de árvore do SEI 5 no repositório: as provas
automáticas de captura usam o SEI 4.1, e o SEI 5 fica para a prova ao vivo.

## 13. Fases

| Fase | Entrega |
|---|---|
| F0 | Extração para o `sei-comum` (ponte lateral, abrir, contexto, aviso, shell) e `consultarDaArvore` no núcleo. Favoritos verde. |
| F1 | `historico/`: modelo, repositório, preferências, migração e captura. |
| F2 | App: lista, busca, seletores, grupos, lote, diálogos, modo modal + content script do modal + legado. |
| F3 | Aba lateral: shell com 3 abas, ponte lateral, `background.js`, manifest. |
| F4 | Favoritos (estrela, filtro, lote), agente (`historico_listar` + sugestão). |
| F5 | Build, provas ao vivo e revisão final. |

## 14. Fora do escopo

- Sincronizar o histórico entre computadores.
- Guardar cada visita separada (linha do tempo completa por processo).
- Histórico de documentos visitados.
- Atalho de teclado global para abrir o modal.
- O Favoritos adotar o `ui/lista.css`.
- Levar o histórico novo ao pacote oficial e ao Firefox (próxima etapa, como no Favoritos).
- Página de ajuda e HISTORICO.md: só no release.

## 15. Riscos

| Risco | Cobertura |
|---|---|
| GET extra por processo pesar no SEI | 1 por processo a cada 12 h; nunca em sigiloso; mesmo GET que o legado já fazia ao abrir o processo |
| Mexer no Favoritos publicado | Extração só move código; as 572 provas rodam a cada tarefa; o CSS do Favoritos não muda |
| Evento do menu não chegar (mundo da página × isolado) | `CustomEvent` em `document` atravessa os mundos; prova de página + prova ao vivo |
| Muitas chaves no `storage.local` | Limite de 5.000; leitura por prefixo com `getKeys` (Chrome 130+) |
| Migração atribuir a lista ao login errado | Risco aceito e documentado (5.4) |
