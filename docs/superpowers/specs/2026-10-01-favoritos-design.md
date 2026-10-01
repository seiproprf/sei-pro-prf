# Favoritos do SEI Pro (reformulação em TypeScript) — especificação de desenho

Data: 01/10/2026 · Status: decisões da seção 2 aprovadas em conversa; **spec aguardando revisão do autor**.

## 1. Objetivo

Os favoritos passam a ser a **lista pessoal de processos que o usuário quer acompanhar**. Ela
se diferencia de duas ferramentas nativas do SEI:

- **Favoritos nativos** (`protocolo_modelo_listar`): são documentos-modelo e valem para a
  unidade inteira.
- **Acompanhamento Especial**: é compartilhado pela unidade e fica numa tela à parte.

A lista fica **à vista**: abaixo da tabela do Controle de Processos, no painel lateral, ou nos
dois lugares, à escolha do usuário. Os dados **não se perdem** e **sincronizam** sem servidor
próprio.

É também a primeira funcionalidade do legado reescrita **inteira** na stack TypeScript, e não
só adaptada. Isso vale para o painel, as estrelas e a sincronia. As peças genéricas saem
prontas para as próximas migrações.

Motivações concretas (quadro de sugestões e código):

- **Perda de dados.** Hoje tudo vive no `localStorage` da página do SEI. O backup em arquivo
  **nunca restaura**: há um `JSON.parse` duplo em `sei-functions-pro.js:1547`, e a sugestão
  #1348 relata isso. A sincronia com o servidor das Atividades compara um campo que não existe
  na raiz do objeto (`sei-pro-favoritos.js:1080`). A importação substitui tudo sem validar.
- **Estrela que pisca e não faz nada** (#1397). Há duas causas. Primeiro, a adição depende de
  um iframe oculto e de `tiposDocumentos`, e expira em silêncio. Segundo, `addFavoritePro`
  grava o que estiver em `dadosProcessoPro` sem conferir o id, e pode gravar o processo errado.
- **Pedidos abertos:**
  - #1254 página/janela própria;
  - #651 e #656 cadastro ao favoritar;
  - #1206 documentos favoritos;
  - #1404 processos pessoais;
  - #1396 "coluna de acompanhamento" na tela principal.

## 2. Decisões tomadas (aprovadas em conversa, 01/10/2026)

| Tema | Decisão |
|---|---|
| Escopo | **Uma lista por usuário + unidade**, mais uma lista **Pessoal** que acompanha o usuário em qualquer unidade da mesma instância do SEI. Trocar de unidade troca a lista da unidade, com aviso na 1ª vez. |
| Barra lateral | O painel lateral nativo vira **"SEI Pro" com abas Favoritos \| Agente**. O botão de favoritos abre direto na aba certa. O Agente não muda por dentro. |
| Exibição | Preferência do usuário: **abaixo da lista**, **painel lateral** ou **os dois**. Fica nas configurações da extensão e também é editável dentro do próprio favoritos. |
| Base local | `chrome.storage.local`, que **sobrevive à limpeza de cache/dados de site** (só a desinstalação apaga). O `localStorage` do SEI deixa de ser usado. |
| Sincronia | **Texto Padrão do SEI** por usuário e unidade, ligado depois de um **aviso de consentimento** na 1ª vez. O **arquivo .json** (pasta do Drive/OneDrive) é opção extra. A lista Pessoal **só** sincroniza por arquivo. |
| Servidor das Atividades | Deixa de ser destino. Fica só como origem de **importação** única. |
| Primeira versão | Paridade com o que funciona hoje (sem o código morto), mais: **o que mudou**, **lembretes pessoais**, **documentos favoritos** e **o Agente lê os favoritos**. |
| Atualizar processos fora da unidade | **Só quando o usuário pede** (botão), com a trava da seção 7.3. Nada roda sozinho em segundo plano. |
| Lançamento | **Lab primeiro.** O novo favoritos substitui o antigo no pacote dos testadores; o oficial vem depois da validação. A migração é automática, e o dado antigo fica intacto no lugar por algumas versões. |

## 3. Restrições descobertas (conferidas no fonte do SEI 5.0.0 e no legado)

1. **Texto Padrão** (`sei/web/rn/TextoPadraoInternoRN.php`):
   - Nome com **no máximo 50 caracteres**; descrição com no máximo 300.
   - O conteúdo passa por `EditorRN::validarTagsCriticas` e `SeiINT::validarXss`, e por isso
     JSON cru dentro de `<p>` é frágil.
   - O texto pertence à **unidade**: qualquer pessoa da unidade vê, edita ou exclui.
   - Ele aparece no seletor de texto padrão dos documentos.
   - O CK5 baixa o **conteúdo de todos** os textos padrão da unidade
     (`controlador_rest.php` → `editor_listar_textos_padroes`), e o CK4 monta autotextos com eles
     (`montar_auto_texto_editor`). Por isso o conteúdo precisa ser **compacto**.
2. **O legado do Texto Padrão** (`sei-pro.js:2799-2884`, `txtPadrao_*`) não serve de base:
   - lê só a 1ª página da lista e, quando não acha o texto, **cria duplicado**;
   - envia `sbmCadastrar` e `sbmAlterar` juntos;
   - usa `escape()`, que grava `%uXXXX`;
   - não reconhece erro de validação nem sessão expirada.
3. **Abrir a árvore marca o processo.** No SEI 4.1/5 a árvore é a ação `procedimento_visualizar`
   (`arvore_montar.php`). Quando o processo está **aberto na unidade**, o SEI chama
   `ProcedimentoRN::receber` (`arvore_montar.php:420`), e isso tem dois efeitos:
   - se houve remessa, **gera o andamento "Processo recebido na unidade" em nome do usuário**
     (`ProcedimentoRN.php:4919-4926`);
   - caso contrário, marca o processo como **visualizado** para a unidade.

   `procedimento_trabalhar` e `procedimento_consultar_historico` **não** chamam `receber`.
   Consequência: **nenhuma consulta em segundo plano** abre a árvore de processo aberto na
   unidade.
4. **Um painel lateral por extensão.** Hoje o painel é do Agente
   (`side_panel.default_path = html/agente.html`). Os manifests dos órgãos (antaq, antt, cfq,
   conab) não têm `sidePanel`, e o ANTT Pro nem tem `background.js`.
5. **Seletor de arquivo em iframe.** O File System Access (`showSaveFilePicker`,
   `requestPermission`) é bloqueado em subframe de outra origem. O painel embutido no SEI
   (seção 8.2) é um iframe `chrome-extension://` dentro de `https://sei…`, então **a
   configuração do arquivo acontece num contexto de topo da extensão** (painel lateral ou
   página de opções). O Firefox não tem a API; ali o arquivo funciona por "baixar/carregar".
6. **`sei-nucleo` já resolve a base**: sessão, Latin-1, `Formulario`, links colhidos, erros
   tipados, `listarCaixa`, `andamentos` e `lerArvore`. Faltam três coisas:
   - um `dominio/textoPadrao.ts`;
   - o **id** da unidade no contexto (hoje `lerContexto` só traz sigla e nome);
   - o sinal "documento novo" da caixa (`img[src*="exclamacao"]`).

## 4. Abordagens consideradas

- **A — Pacote novo `favoritos/` + biblioteca nova `sei-comum/` + `sei-nucleo` (escolhida).**
  `favoritos/` segue o molde do `agente-ia/`. `sei-comum/` é genérica: UI, datas, armazenamento
  e sincronia, sem conhecimento do SEI. O `sei-nucleo` ganha `textoPadrao.ts`. Cada coisa tem
  dono, e o que é genérico nasce reaproveitável.
- **B — Dentro de `agente-ia/`.** Reaproveita painel e ponte, mas acopla duas funcionalidades
  independentes e incha o build do agente. O favoritos teria de funcionar sem o agente nos
  pacotes dos órgãos.
- **C — Só trocar o armazenamento no legado jQuery.** Resolve a perda de dados, mas não
  entrega painel lateral, stack nova nem as funções novas, e mantém os 98 handlers inline que
  travam a loja do Firefox.

## 5. Arquitetura

```
sei-nucleo/   (existe)  SEI: sessão, formulários, caixa, árvore, andamentos
   └─ + dominio/textoPadrao.ts   armazém genérico em Texto Padrão
sei-comum/    (novo)    sem SEI: ui/, datas/, armazenamento/, sincronia/, opcoes/, ponte/
favoritos/    (novo)    a funcionalidade
   ├─ modelo/        tipos, operações puras, migrações, validação
   ├─ sincronia/     motor + destinos (local, Texto Padrão, arquivo)
   ├─ novidades/     sinais da caixa, captura da árvore, comparação
   ├─ ui/            componentes da lista, do editor e da configuração
   ├─ app/           página da extensão (favoritos.html): lateral e embutida
   ├─ shell/         painel.html com abas Favoritos | Agente
   ├─ pagina/        content script (mundo isolado): estrelas, embutir, executor SEI
   └─ opcoes/        seção "Favoritos" na página de opções
agente-ia/    (existe)  + tool favoritos_listar (lê o repositório do favoritos)
```

### Onde cada coisa roda

| Peça | Contexto | Por quê |
|---|---|---|
| `init_favoritos.js` | content script, **mundo isolado**, só na janela do topo; lê os iframes do SEI, que são da mesma origem | Estrelas, Enviar Processo, captura oportunista, embutir o app, e **executar** operações no SEI (Texto Padrão, caixa, Atualizar) com os cookies da sessão |
| `html/favoritos.html` | página da extensão. **Lateral:** dentro do `painel.html`. **Embutida:** iframe no Controle de Processos | **Um só app** nos dois lugares: acesso direto a `chrome.storage`, CSS isolado do SEI, mesma origem para Web Locks |
| `html/painel.html` | painel lateral (Chrome `side_panel`; Firefox `sidebar_action`) | Abas com iframes preguiçosos: o Agente só carrega se a aba for aberta |
| `background.js` | service worker | Abre o painel na aba pedida (gesto do usuário) |

### Ponte

- **App embutido ⇄ sua aba:** `MessageChannel`. O content script cria o iframe com um token
  no hash, espera o `load` e transfere a `port2` com `postMessage(…, origemDaExtensao)`. O
  canal é privado, sem broadcast entre abas.
- **App lateral ⇄ aba do SEI:** porta `chrome.runtime.connect({name:"seipro-favoritos"})`
  **aberta pela aba**, como no agente (evita a permissão `tabs`). O painel fala com a aba
  visível mais recente. A lógica de escolher a aba sai de `agente-ia/src/ponte/cliente.ts`
  para `sei-comum/ponte/`.
- **Pedidos do app à aba** (RPC com prazo e cancelamento): `abrirProcesso`, `lerCaixa`,
  `atualizarForaDaUnidade`, `sincronizarTextoPadrao`, `contexto`.
- **Dados:** **não passam pela ponte**. Cada contexto lê e grava o `chrome.storage.local` e
  escuta `chrome.storage.onChanged`. A ponte serve só para operações que precisam da sessão do
  SEI.

### Abrir um processo sem montar link

Montar link do SEI à mão **derruba a sessão**. Os caminhos permitidos são três:

1. o link da linha na caixa, se o processo estiver lá;
2. a **pesquisa rápida** (formulário da própria página, com o protocolo ou o nº SEI do
   documento), via `Formulario`;
3. link colhido nesta sessão, nesta unidade.

## 6. Modelo de dados

### 6.1 Escopo e chaves

```ts
type Escopo =
  | { host: string; login: string; tipo: "unidade"; unidade: { id: string; sigla: string } }
  | { host: string; login: string; tipo: "pessoal" };

// chave textual: "sei.antaq.gov.br|pedro.soares|u:110000001"  ou  "…|pedro.soares|pessoal"
```

- O `login` é o real, lido do `title` de `#lnkUsuarioSistema` (`lerContexto`), e não o
  prefixo do cookie que o SEI 4.1.5+ altera.
- **Uma chave por entidade** no `chrome.storage.local`:

  | Chave | Conteúdo |
  |---|---|
  | `favoritos/<escopo>/f/<idProcedimento>` | favorito |
  | `favoritos/<escopo>/pasta/<id>` | pasta |
  | `favoritos/<escopo>/etiqueta/<id>` | etiqueta |
  | `favoritos/<escopo>/meta` | metadados do escopo |
  | `favoritos/preferencias` | preferências (no `storage.sync`) |

  Gravar um item não reescreve a lista inteira. Duas janelas, ou o content script e o app,
  não se atropelam ao mexer em favoritos diferentes. A cota do `storage.local` (10 MB) basta
  para dezenas de milhares de itens.

### 6.2 Entidades

```ts
interface Favorito {
  id: string;                 // id_procedimento (único no escopo)
  protocolo: string;
  titulo?: string;            // apelido pessoal (substitui a "especificação própria")
  tipo?: string;              // cache do SEI, para exibir e buscar
  especificacao?: string;     // idem; vazio em sigiloso
  pasta?: string;             // id de Pasta (substitui "categoria")
  etiquetas: string[];        // ids de Etiqueta (até 8, como hoje)
  nota?: string;              // anotação pessoal, até 2.000 caracteres
  prazo?: Prazo;
  lembrete?: { em: string /* AAAA-MM-DD */; texto?: string };
  documentos?: DocumentoFavorito[];
  local?: { lat: number; lng: number };   // mapa
  ordem: string;              // índice fracionário (arrastar não renumera os outros)
  sigiloso?: true;            // nunca vai para Texto Padrão; o agente não vê
  visto?: Instantaneo;        // o que o usuário viu por último  (sincroniza)
  atual?: Instantaneo;        // última leitura                   (só local)
  criadoEm: number; atualizadoEm: number; dispositivo: string;
  removidoEm?: number;        // lápide: lixeira de 30 dias + sincronia
}

interface DocumentoFavorito {
  id: string; numeroSei: string; titulo: string; nota?: string;
  atualizadoEm: number; removidoEm?: number;
}

interface Instantaneo {
  quando: number;
  fonte: "caixa" | "arvore" | "atualizar";
  abertoNaUnidade?: boolean;
  naoVisualizado?: boolean;     // da caixa
  documentoNovo?: boolean;      // da caixa (ícone de exclamação)
  atribuido?: string;
  marcadores?: string[];
  unidadesAbertas?: string[];   // da árvore ("Processo aberto nas unidades")
  concluido?: boolean;
  qtdDocumentos?: number;
  ultimoAndamento?: { data: string; unidade: string; descricao: string };
}

interface Prazo {
  // porta do configdate legado, com nomes legíveis
  inicio: { de: "data"; data: string }
        | { de: "documento"; idDocumento: string; assinadoEm?: string }
        | { de: "novoDocumento"; tipos: string[]; desde: string };   // o antigo "EM BREVE"
  vencimento: { em: "data"; data: string }
            | { em: "dias"; n: number; contagem: "corridos" | "uteis"; sentido: "depois" | "antes" };
  exibicao: "relativa" | "dias" | "diasUteis";
}

interface Pasta    { id: string; nome: string; cor?: string; ordem: string; atualizadoEm: number; removidoEm?: number }
interface Etiqueta { id: string; nome: string; cor: string; icone?: string; atualizadoEm: number; removidoEm?: number }
```

O que **deixa de existir**:
- `andamento`, `documentos` completos, `assuntos` e `interessados` por favorito. Eram gravados
  e nunca exibidos.
- `config.tiposdocs`.

### 6.3 Mesclagem (a regra de toda sincronia)

- **Por entidade, vence quem tem o maior `atualizadoEm`.** O empate se resolve pelo
  `dispositivo` (id aleatório gerado na instalação), sempre na mesma direção.
- **Lápides** (`removidoEm`) participam da mesclagem e somem depois de **90 dias**. Enquanto
  existem, alimentam a **Lixeira** (restaurar em 30 dias).
- A mesclagem é **comutativa, associativa e idempotente** (testada, seção 12). Por isso
  "puxar, mesclar e empurrar" pode se repetir sem medo.
- Limite conhecido: editar a nota na máquina A e as etiquetas na máquina B, dentro da mesma
  janela de sincronia, mantém só a edição mais recente. É aceito.

### 6.4 Envelope (Texto Padrão e arquivo)

```ts
interface Envelope {
  formato: "seipro-favoritos"; versao: 1;
  escopos: Array<{ escopo: Escopo; favoritos: Favorito[]; pastas: Pasta[]; etiquetas: Etiqueta[] }>;
  gravadoEm: number; dispositivo: string; revisao: number;
}
```

Nos dois destinos o campo `atual` fica fora: é cache do dispositivo e muda a cada leitura da
caixa.

- **Texto Padrão:** um escopo **de unidade** por texto; a Pessoal nunca vai para lá. O
  resultado é
  `JSON → gzip (CompressionStream) → base64url`, em blocos `<p>` de até 2.000 caracteres,
  precedidos de um `<p>` legível:
  "Dados internos do SEI Pro — favoritos de fulano. Não use em documentos nem edite."
  Base64url só tem `[A-Za-z0-9_-]`, então passa no filtro de XSS e sobrevive ao Latin-1.
- **Arquivo:** **todos** os escopos do usuário, inclusive a Pessoal, em JSON legível e
  indentado. O usuário consegue abrir e conferir.

## 7. Funcionalidades

### 7.1 Favoritar

**Estrela** (botão com `aria-pressed`) em:
- Controle de Processos, **inclusive em processo não visualizado**: favoritar não busca nada
  no SEI;
- árvore (topo);
- blocos, Acompanhamento Especial, sobrestados;
- resultados da Pesquisa (novo).

O clique grava **na hora**, com os dados já presentes na tela (id, protocolo, tipo,
especificação). Acabam o iframe oculto e a espera.

**Para qual lista:**
- o clique simples vai para a **lista da unidade**;
- o menu da estrela (botão direito, ou o ▾ ao lado) oferece "Pessoal".

**Cadastro rápido ao favoritar** (#651, #656): um balão ancorado na estrela, não bloqueante,
com pasta, etiquetas, lembrete e nota. Fecha sozinho. A preferência "Perguntar ao favoritar"
liga e desliga o balão.

**Processo sigiloso:** pode ser favoritado (`sigiloso: true`). Guarda só protocolo e id, sem
especificação. **Nunca** vai para o Texto Padrão, e o agente não o vê.

**Enviar Processo:** a caixa "Manter em favoritos" volta, com pasta, lembrete e prazo
rápidos. Grava ao enviar o formulário.

**Documento favorito** (#1206): estrela ao lado de cada documento na árvore. Grava em
`documentos[]` do favorito do processo. Se o processo ainda não é favorito, ele entra na
lista da unidade. Na árvore, o documento favorito fica marcado.

### 7.2 A lista

**Duas abas:** a unidade (por exemplo, "GPF") e "Pessoal".

**Busca** (tecla `/`) em: protocolo, título, tipo, especificação, nota, etiquetas e números
SEI dos documentos favoritos.

**Filtros:** pasta, etiqueta, situação do prazo, "com novidade", "lembrete para hoje",
"aberto na unidade" / "fora da unidade".

**Ordem:** manual (arrastar), por prazo, por novidade, por protocolo ou por data de inclusão.
Também é possível agrupar por pasta.

**Cada item mostra:**
- protocolo, que abre o processo (seção 5);
- título, ou tipo + especificação;
- selo de novidade (7.3);
- onde o processo está;
- anel de prazo (como hoje) com texto do tipo "vence em 3 dias úteis";
- sino do lembrete, etiquetas e pasta;
- nota (expandir);
- documentos favoritos (expandir);
- menu "⋯": editar, mover, lembrete, prazo, mapa, marcar como visto, remover.

**Seleção múltipla com ações em lote:** mover, etiquetar, lembrete, remover, copiar números,
**CSV**.

**Editor do favorito** (`<dialog>`), com as seções Geral, Prazo, Lembrete, Documentos e Mapa.

**Lixeira:** removidos nos últimos 30 dias, com "Restaurar".

**Densidade:**
- **lateral:** compacta, em cartões;
- **embutida:** tabela larga, com colunas que podem ser ocultadas.

**Troca de unidade:** faixa única com "Não mostrar de novo". O texto: "Você está na unidade
SFC: estes são os favoritos desta unidade. Os da GPF continuam guardados. A lista Pessoal
aparece em todas."

### 7.3 O que mudou

Compara-se `atual` com `visto`. "Mudou" é qualquer uma destas situações:
- documentos a mais;
- último andamento diferente;
- entrou ou saiu da unidade;
- `unidadesAbertas` diferente;
- concluído;
- `naoVisualizado` ou `documentoNovo` vindos da caixa.

O selo resume a mudança, por exemplo "2 documentos novos · agora em SFC". Abrir o processo,
ou clicar em "Marcar como visto", faz `visto = atual`.

**De onde vem o `atual`** (do mais barato ao mais caro, e nunca abrindo a árvore de processo
aberto na unidade):

1. **Caixa, sem custo.** Toda vez que o Controle de Processos carrega, o content script lê as
   linhas da página (`listarCaixa` aplicado ao documento atual) e atualiza os favoritos que
   estão ali: aberto na unidade, não visualizado, documento novo, atribuição e marcadores.
2. **Captura oportunista, sem custo.** Quando o **próprio usuário** abre um favorito, o
   content script lê a árvore que o SEI já carregou: documentos, "aberto nas unidades" e
   concluído. Também lê o histórico resumido, pelo link da própria árvore (o histórico não
   chama `receber`). Essa leitura marca o processo como visto.
3. **Botão "Atualizar fora da unidade (N)", só quando o usuário pede.** Funciona em quatro
   passos:
   1. **Trava:** lê a caixa **inteira** (`listarCaixa`, todas as páginas) imediatamente
      antes.
   2. Descarta todo favorito que esteja na caixa, e também os sigilosos.
   3. Para os demais, um de cada vez, com cerca de 3 s entre eles e cancelável: pesquisa
      rápida → árvore → histórico resumido.
   4. Se, mesmo assim, a árvore revelar que o processo **acabou de chegar** à unidade (corrida
      de segundos), o item recebe o aviso "chegou à sua unidade — o SEI registrou o
      recebimento".

   Na 1ª vez, uma explicação curta aparece antes de rodar.

### 7.4 Lembretes

- "Me lembre em…" com hoje+1, +7, +30 ou uma data, e texto opcional.
- Seção **"Para hoje"** no topo da lista.
- **Contador** no botão de favoritos da barra do SEI e na aba do painel.
- Adiar (+1 dia, +1 semana) e concluir (apaga o lembrete).
- **Sem** notificação do sistema, que exigiria permissão nova.

### 7.5 Prazos

É a porta do prazo avançado do legado:
- contar a partir de uma data, ou da assinatura de um documento do processo;
- vencer numa data, ou em N dias corridos/úteis, antes ou depois;
- dias úteis com feriados nacionais (`getHolidaysBr`) e feriados extras já configurados.

**O antigo "EM BREVE"**, "a partir da assinatura de um novo documento do tipo T", passa a
funcionar com a captura (7.3). Quando um snapshot traz documento novo assinado de um tipo da
lista depois de `desde`, a contagem começa.

**Limite honesto:** para processo aberto na unidade, a caixa só diz "documento novo". O prazo
mostra "há documento novo — abra o processo para conferir" até a captura acontecer.

### 7.6 Mapa

Mantido, carregado sob demanda (Leaflet + OSM, já declarados), com três correções:
- **sem `map.locate`**: o código atual pede a geolocalização a cada 3 s, contrariando
  `pages/FAVORITOS.md`;
- tiles com a configuração certa do OSM;
- mapa com todos os favoritos que não quebra quando há filtro.

### 7.7 Agente lê os favoritos

Tool **somente leitura** `favoritos_listar` em `agente-ia/src/tools`.

- **Parâmetros:** `lista`, que pode ser unidade, pessoal ou todas; `filtro`, que pode ser
  novidades, lembretes, prazos ou todos; e `busca`.
- **Escopo:** host, login e unidade da aba ligada ao painel (`contexto_tela`).
- **Lê** pelo módulo de repositório do favoritos (`@favoritos/repositorio`), porque o agente
  roda na mesma origem da extensão. Não precisa de ponte.
- **Não devolve sigilosos.** A nota passa pela pseudonimização que o motor já aplica na
  saída.
- **Sugestão no painel do agente:** "O que mudou nos meus favoritos?".

## 8. Onde aparece

### 8.1 Preferência de exibição

Fica em `chrome.storage.sync` → `favoritos/preferencias`. É pequena e acompanha a conta do
navegador.

```ts
interface Preferencias {
  exibir: "abaixo" | "lateral" | "ambos";       // padrão: "abaixo" (o lugar de hoje)
  perguntarAoFavoritar: boolean;                 // padrão: true
  textoPadrao: "nao-perguntado" | "ligado" | "desligado";
  densidade?: "compacta" | "confortavel";
}
```

A preferência é editável em dois lugares:
- na **página de opções** (`options.html`), numa seção "Favoritos" desenhada por um bundle
  TS pequeno (`js/favoritos/opcoes.js`);
- no diálogo de configuração do próprio favoritos.

A chave legada `gerenciarfavoritos` (em `dataValues`) continua sendo o **liga/desliga
geral**, lida por `sei-comum/opcoes/lerOpcaoLegada`, com a mesma semântica de
`checkConfigValue`: a opção ausente conta como ligada.

### 8.2 Abaixo da lista

- O content script cria `div.panelHomePro#favoritosSeiPro` dentro de `#panelHomePro`. Isso
  preserva a ordenação entre painéis do legado (`orderDivPanel` / `setSortDivPanel`), e a
  barra de título usa as classes do legado.
- Dentro, um **iframe** `html/favoritos.html#modo=embutido&canal=<token>`. A altura segue o
  conteúdo por `ResizeObserver` + mensagem no canal. O tema escuro e a cor do SEI Pro vêm das
  opções legadas.
- O estado recolhido/expandido fica nas preferências.

### 8.3 Painel lateral

- `html/painel.html` passa a ser o `side_panel.default_path`, e no Firefox o
  `sidebar_action`. Abas: **Favoritos \| Agente**. A aba Agente só aparece se o manifest tiver
  o agente.
- **`background.js`:**
  - a mensagem nova `{tipo:"abrirPainel", aba}` chama `sidePanel.open` **direto no listener**
    (gesto) e grava `painelAba` em `chrome.storage.session`. O shell lê a aba ao carregar e
    troca por `onChanged` se já estiver aberto;
  - `abrirAgente` continua funcionando como sinônimo.
- **Botão "Favoritos"** na barra do Controle de Processos e no topo da árvore, com contador de
  lembretes e novidades.
  - Com `exibir = abaixo`, rola até o painel.
  - Com `exibir = lateral`, abre o painel lateral.
- **Pacotes dos órgãos sem `sidePanel`/`background.js`:** só "abaixo da lista" no início. Levar
  o painel lateral a eles é tarefa separada.

## 9. Sincronia

### 9.1 Motor

`sei-comum/sincronia`, genérico, mais os destinos do favoritos. O ciclo é sempre o mesmo:
**puxar → mesclar → (se mudou) empurrar**.
- Uma **trava** por escopo e destino (`navigator.locks`) evita duas abas sincronizando juntas.
  As abas do SEI dividem a origem do SEI; as páginas da extensão, a origem da extensão.
- **Status visível no app:** "Sincronizado há 2 min · Texto Padrão", "Pendente",
  "Erro: sessão expirada", "Indisponível nesta unidade (sem permissão)".
- **Indicador de pendência** persistido: se a página fechar antes do envio, a próxima
  carga envia.

### 9.2 Texto Padrão

Tudo no **content script**, que tem a sessão, pelo `sei-nucleo/dominio/textoPadrao.ts`.
Esse módulo é **genérico**: `criarArmazemTextoPadrao({ nome, descricao })`, com as operações
`ler`, `gravar` e `excluir`. A Distribuição Automática do legado pode migrar para ele depois.

**Nome do texto:** `[_SEIPRO_FAV_<login>]`. Se o login passar de 36 caracteres, entra
`[_SEIPRO_FAV_<27 primeiros>~<8 hex do hash>]`. O envelope traz host, login e unidade
completos, e o conteúdo **só é aceito se casar**.

**Localizar:** link do menu `texto_padrao_interno_listar` → percorre **todas as páginas**
pelo próprio formulário da lista → casa o nome exato. O id achado fica guardado; os links,
não, porque o hash é da sessão.

**Ler:** pelo `texto_padrao_interno_consultar` da linha → `#txaConteudo` → blocos → base64url
→ gunzip → valida o envelope.
- Conteúdo corrompido, ou um colega que editou o texto, vira "remoto inválido". Nada é
  apagado: o motor regrava a partir do local e avisa.

**Gravar:** `Formulario` em `texto_padrao_interno_alterar` (ou `cadastrar` na 1ª vez):
- **só o botão certo** (`botaoDeEnvio`);
- `txaConteudo` em modo `"html"`;
- sucesso **provado** pela volta à lista com o id;
- erros tipados por `verificarPagina`.

**Quando sincroniza:**
- **puxa** ao carregar o Controle de Processos (no máximo a cada 5 min) e quando o app abre;
- **empurra** 15 s depois da última alteração local.

**Teto:** 100 KB de conteúdo por escopo, com aviso a partir de 80%. Acima disso o texto não é
gravado, e a recomendação é usar o arquivo.

**Consentimento (1ª vez):** um diálogo explica quatro pontos e oferece **Ligar** e
**Agora não**:
- o texto fica **visível para toda a unidade**;
- aparece na lista de textos padrão e não deve ser usado em documentos;
- sigilosos ficam fora;
- como desligar e apagar.

**Desligar:** oferece "Apagar meus dados do SEI desta unidade", que exclui o texto.

**Higiene:**
- o seletor do Documentos em Lote passa a ocultar nomes que começam com `[_`;
- na tela "Gerar documento", o content script oculta as opções `[_SEIPRO_` do
  `selTextoPadrao`. É cosmético, porque o dado continua no SEI.

### 9.3 Arquivo

- **Chrome/Edge:** File System Access. A **configuração é feita no painel lateral ou nas
  opções**, que são contexto de topo. O handle fica no IndexedDB da extensão, e o app pede
  "Permitir sempre" (permissão persistente).
- O app (lateral ou embutido) lê o arquivo quando ganha foco e grava 15 s depois de alterar.
  Se a permissão expirou, mostra "Reconectar arquivo" (gesto).
- **Firefox:** "Baixar cópia" e "Carregar cópia". Carregar **mescla**, nunca substitui.
- O arquivo leva **todos os escopos**, inclusive a Pessoal: é o backup completo.

### 9.4 Cópias locais e importações

- **Cópia automática diária** de cada escopo no IndexedDB da extensão, guardando as últimas
  14. Ação "Restaurar cópia de dd/mm".
- **Migração do legado** (1ª execução por host + login):
  1. O content script lê `localStorage.configDataFavoritesPro` da origem do SEI. Se o
     arquivo `configPro.json` da FileSystem antiga existir, também o lê: são backups que o
     legado **nunca conseguiu restaurar**.
  2. Converte categoria → pasta, `colortags` → etiquetas, `descricao` diferente da
     especificação do SEI → título, `configdate` → prazo, `latlng` → local e `order` → ordem.
  3. Pergunta o destino, unidade atual ou Pessoal, num diálogo.
  4. **Não apaga** a chave antiga e registra a migração em `favoritos/migracao`.
- **Importar arquivo:** aceita o envelope novo e o `configPro_*.json` antigo, e mescla.
- **Importar do servidor das Atividades:** quando houver login no módulo, por mensagem ao
  mundo da página. Prioridade baixa.

## 10. Bibliotecas compartilhadas (o legado pode adotar depois)

| Módulo | Conteúdo | Quem mais usará |
|---|---|---|
| `sei-comum/ui` | `h()`, `icone()` (SVG inline), `Dialogo` (`<dialog>` com fallback), `Aviso` (toast), `tokens.css` (`:root` + escuro) | Agente (hoje em `painel/dom.ts`), futuras migrações |
| `sei-comum/datas` | `feriadosNacionais(ano)`, `diasUteisEntre`, `somarDiasUteis`, `formatarRelativo` | Atividades, Controle de Prazos, marcadores com prazo |
| `sei-comum/armazenamento` | `Repositorio<T>` tipado por prefixo de chave, migrações versionadas, assinatura de mudanças | Todo módulo novo |
| `sei-comum/sincronia` | `mesclar` (vence o mais recente + lápides), `codec` (gzip + base64url + blocos), `Envelope`, `DestinoArquivo` | Configurações, regras, skills do agente |
| `sei-comum/opcoes` | `lerOpcaoLegada(nome)` sobre `dataValues`, tema do SEI Pro | Qualquer TS que respeite as opções antigas |
| `sei-comum/ponte` | canal por `MessageChannel` com iframe; escolha da aba (extraída do agente) | Agente, Ferramentas de PDF |
| `sei-nucleo/dominio/textoPadrao` | armazém genérico em Texto Padrão | Distribuição Automática, configurações da unidade |

A migração do Agente para `sei-comum/ui` e `sei-comum/ponte` fica **fora** desta entrega. O
que entra aqui é a extração; trocar os imports do agente é tarefa à parte.

## 11. Qualidade de código e segurança

- **Mesmo molde do `agente-ia`:**
  - esbuild por `build.mjs`;
  - `charset: "ascii"`, sem acento cru em `dist/js`;
  - TS strict + `noUncheckedIndexedAccess`;
  - testes `tests/verificar-*.ts` com tsx + linkedom;
  - `npm run build` só gera se os testes passarem;
  - código, nomes e commits em pt-BR;
  - comentário explica o porquê.
- **Novo, só nos pacotes novos:** **Biome** (lint + formatação), com `npm run checar`.
- **DOM seguro:** nada de `innerHTML` nem `on*` inline. Tudo por `h()`, e
  `tools/check-dom-injection.mjs` valida os arquivos gerados. Isso ajuda a destravar a loja do
  Firefox.
- **Rede:**
  - só o SEI da própria origem, pelo content script;
  - OSM/Nominatim, só ao abrir o mapa (já declarados);
  - **nenhum servidor do SEI Pro**.
- **Sigiloso:**
  - nunca vai ao Texto Padrão nem ao agente;
  - a captura e o Atualizar não leem processo sigiloso;
  - o arquivo pode conter o número, porque é do usuário.

## 12. Testes

**Unidade, sem rede:**
- `modelo`: operações, validação e índice fracionário.
- `mesclar`: propriedades em casos gerados (comutativa, idempotente, lápide vence item antigo,
  empate determinístico).
- `codec`: ida e volta com acentos, travessão, aspas curvas, emoji e 5 mil itens.
- `migrar`: JSONs reais do legado (com `configdate`, `latlng` e categoria com aspas).
- `datas`: Carnaval, Sexta-Santa e Corpus Christi de 2026/2027; dias úteis atravessando o
  feriado.
- `novidades`: tabela de casos `visto` × `atual`.
- `textoPadrao`, com **fixtures novas do 4.1.5 e do 5.0.4**: lista paginada; cadastrar,
  alterar e consultar; validação ("conteúdo não permitido"); sessão expirada; texto ausente;
  texto de outro login com nome truncado igual.
- `caixa`: sinal `documentoNovo` em `caixa.html`.

**Ponta a ponta** (harness puppeteer do repositório; SEI SP de Treinamento 4.1.5 e SEI MJ de
homologação 5.0.4):
- Estrela na caixa (incluindo processo **não visualizado**), na árvore e na pesquisa: o item
  aparece no painel embutido e no lateral na hora.
- Painel com abas: abrir em Favoritos, trocar para o Agente, voltar. O agente segue
  funcionando dentro do iframe (porta, aviso de "aberto").
- **Atualizar fora da unidade: o histórico de um processo aberto na unidade, antes e depois,
  NÃO ganha "Processo recebido"** (teste crítico).
- Texto Padrão entre **dois perfis do Chrome** (dois "computadores"): favoritar no A, aparecer
  no B; remover no B, sumir no A; editar os dois em paralelo e conferir a regra de
  mesclagem.
- Arquivo: configurar, reiniciar o navegador e reconectar. Firefox: baixar e carregar
  (mescla).
- Migração: semear `configDataFavoritesPro` e um `configPro.json` antigos, abrir e conferir.
- Troca de unidade: a lista troca, a faixa aparece uma vez e a Pessoal continua.

**Portões antes de empacotar:**
- `npm run tipos && npm run checar && npm run build` em `sei-comum`, `sei-nucleo` e
  `favoritos`;
- `LC_ALL=C grep` de acento cru em `dist/js`;
- `node tools/patch-manifests.mjs --check`.

## 13. Fases (cada uma é entregável no Lab)

| Fase | Entrega |
|---|---|
| **F0 — Fundação e provas** | `sei-comum` (ui, datas, armazenamento, sincronia/codec+mesclar, opcoes) com testes; pacote `favoritos` com build e Biome. `sei-nucleo`: `unidade.id`, `documentoNovo` e `textoPadrao.ts`. **Provas de campo:** (P1) Texto Padrão no 4.1.5 e no 5.0.4 (limite real do conteúdo, filtro XSS com base64, paginação, fixtures); (P2) iframe da extensão dentro do SEI (CSP, altura, tema); (P3) Agente dentro do `painel.html` em iframe; (P4) File System Access com permissão persistente a partir do painel lateral e uso pelo iframe embutido. |
| **F1 — Favoritos locais** | Modelo e repositório, escopos (unidade + Pessoal), migração do legado, estrelas (caixa, árvore, blocos, acompanhamento, sobrestados, pesquisa), app embutido "abaixo da lista" com lista, busca, filtros, pastas, etiquetas, título, nota, ordem, CSV/copiar, lote, lixeira, faixa de troca de unidade, balão ao favoritar. No manifest Lab, o legado deixa de ser carregado. |
| **F2 — Painel com abas** | `painel.html`, `background.js` (`abrirPainel`), botão Favoritos na barra, preferência de exibição (opções + diálogo). |
| **F3 — Sincronia** | Texto Padrão (consentimento, motor, travas, status, desligar/apagar, higiene dos seletores), arquivo (Chrome/Edge + Firefox), cópias diárias, importações. |
| **F4 — Acompanhamento** | O que mudou (caixa, captura, Atualizar com trava), lembretes, prazos (porta + "novo documento"), documentos favoritos, Enviar Processo, mapa. |
| **F5 — Agente** | `favoritos_listar` + sugestão no painel do agente. |
| **F6 — Lançamento** | Lab → validação ponta a ponta nos dois SEIs → oficial (`manifest_seipro.json` regenerado). `pages/FAVORITOS.md` reescrita com GIFs em tema claro, `pages/HISTORICO.md`, respostas no quadro (#1397, #1348, #1254, #651, #656, #1206, #1404, #1396), com o texto confirmado pelo autor antes de enviar. **Remoção do legado** algumas versões depois: `sei-pro-favoritos.js`, os pontos de chamada (`init.js:441`, `initPanelFavorites`, estrelas em `sei-pro-all.js` e `sei-pro-arvore.js`, `htmlIconFavorites`, `checkPageFavoritosVisualizacao`) e os ramos `fav` das funções de etiqueta e especificação. A chave antiga do `localStorage` só é apagada depois disso. |

## 14. Fora do escopo (backlog sugerido)

- Filtro **"só meus favoritos"** na própria tabela do Controle de Processos (#1396). É barato
  e é o próximo passo natural.
- Colar uma lista de números e favoritar todos; importar do Acompanhamento Especial ou de um
  bloco.
- Lembrete **recorrente** (mensal, para execução de contratos, como em #1221) e exportação
  `.ics`.
- **Pasta compartilhada com a equipe:** um Texto Padrão de equipe, só leitura para quem
  assina.
- Inserir **referência de documento favorito** no editor (segunda metade da #1206).
- Paleta de busca por atalho de teclado em qualquer tela do SEI.
- Notificação do sistema (permissão opcional).
- Raiz do repositório com **npm workspaces** (um `npm install` para todos os pacotes).
- Agente usando `sei-comum/ui` e `sei-comum/ponte`.
- Painel lateral nos pacotes dos órgãos.

## 15. Riscos e como estão cobertos

| Risco | Cobertura |
|---|---|
| Limite real do conteúdo do Texto Padrão menor que o previsto | Prova P1 na F0; teto configurável; o arquivo como alternativa |
| Colega da unidade edita ou apaga o texto | O local é a fonte da verdade; o remoto inválido é regravado; a lixeira e as cópias diárias cobrem o resto |
| Atualizar gera "Processo recebido" numa corrida | Só por pedido do usuário; leitura da caixa inteira imediatamente antes; aviso explícito quando acontece; teste crítico na seção 12 |
| Agente quebrar dentro de iframe | Prova P3 antes da F2; se falhar, o shell troca de página (`location`) em vez de iframe, ao custo de reiniciar a aba ao alternar |
| Iframe embutido barrado por CSP de algum SEI | Prova P2; o recuo é desenhar a lista no content script com Shadow DOM, reaproveitando os mesmos componentes `ui/` |
| Usuário sem permissão de Texto Padrão | Status "indisponível nesta unidade"; sugestão do arquivo |
| 220 mil usuários | Lab primeiro; o dado legado nunca é apagado na migração; o `gerenciarfavoritos` desliga tudo |
