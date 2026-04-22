# DEVELOPMENT — SEI Pro PRF

Documentação técnica para desenvolvimento e manutenção da extensão. Para informações de uso, veja o [README](./README.md).

---

## Ambiente

Não há sistema de build. Todo o código-fonte fica em `dist/` e é carregado diretamente pelo navegador.

**Para desenvolver:**
1. Edite os arquivos em `dist/js/`
2. Acesse `chrome://extensions/` e clique em **Atualizar**
3. Recarregue a página do SEI

---

## Estrutura

```
dist/
├── js/
│   ├── sei-functions-pro.js       # Funções utilitárias, configuração, localStorage
│   ├── sei-pro.js                 # Lista de processos, Kanban, agrupamentos
│   ├── sei-pro-editor.js          # CKEditor — tabelas, atalhos, auto-save, IA
│   ├── sei-pro-arvore.js          # Árvore de documentos — menus, drag & drop
│   ├── sei-pro-ai.js              # IA — OpenAI, Gemini, Ollama
│   ├── sei-pro-all.js             # Funcionalidades em todas as páginas
│   ├── sei-pro-favoritos.js       # Favoritos
│   ├── sei-pro-projetos.js        # Projetos e Gantt
│   ├── sei-pro-atividades.js      # Kanban de atividades
│   ├── sei-pro-prescricoes.js     # Controle de prazos
│   ├── sei-pro-docs-lote.js       # Documentos em lote
│   ├── sei-pro-visualizacao.js    # Visualizador de documentos
│   ├── sei-pro-icons.js           # Definições de ícones dos menus rápidos
│   ├── sei-legis.js               # Legística (enumeração de normas)
│   ├── background.js              # Service worker (MV3)
│   ├── init.js                    # Inicialização — páginas de processos
│   ├── init_all.js                # Inicialização — todas as páginas
│   ├── init_arvore.js             # Inicialização — árvore de documentos
│   ├── init_db.js                 # Inicialização — configuração de host
│   └── lib/                       # Bibliotecas de terceiros
├── css/
├── html/                          # options.html (página de configurações)
├── icons/
│   └── lab/                       # Ícones da extensão (16, 32, 48, 128px)
├── config_hosts.json              # Configuração por host SEI
└── manifest.json
```

---

## Stack

| Biblioteca | Uso |
|---|---|
| jQuery 3.7.1 | DOM e requisições |
| JMESPath | Consultas na configuração JSON |
| Moment.js | Manipulação de datas e prazos |
| CKEditor | Editor de documentos (SEI 4.x) |
| Font Awesome Pro | Ícones |
| frappe-gantt | Gráfico de Gantt (projetos) |
| jKanban | Board Kanban |
| Chart.js | Gráficos |
| Dropzone.js | Upload drag & drop |
| PDF.js | Leitura de PDFs |
| Tesseract.js | OCR |
| DOMPurify | Sanitização de HTML |

---

## Configuração

Configurações do usuário são salvas via `chrome.storage.sync` e cacheadas em `localStorage` como `configBasePro` (JSON). Funções principais:

```js
checkConfigValue(name)   // boolean — feature está ativa?
getConfigValue(name)     // valor configurado de uma feature
getOptionsPro(name)      // opção da extensão
localStorageRestorePro(key) // restaura JSON do localStorage
```

---

## Detecção de versão do SEI

```js
isNewSEI     // true para SEI 4.x+
isSEI_5      // true para SEI 5.x
compareVersionNumbers(v1, v2) // comparação semântica
```

---

## Compatibilidade Chrome / Firefox

```js
const isChrome = (typeof browser === 'undefined');
if (isChrome) { var browser = chrome; }
// Todas as chamadas de API usam browser.*
```

---

## Implementações PRF Dev

### Correção de race condition (`init.js`)

O SEI Pro original carregava `sei-pro.js` em paralelo com `sei-functions-pro.js`, causando `checkHostLimit is not defined` intermitentemente. Corrigido com `jQuery.Deferred`:

```js
var seiProFunctionsLoaded_init = $.Deferred().resolve();
if (typeof loadFunctionsPro === 'undefined')
    seiProFunctionsLoaded_init = $.getScript('js/sei-functions-pro.js');
seiProFunctionsLoaded_init.done(function() { $.getScript('js/sei-pro.js'); });
```

### Suporte a Ollama (`sei-pro-ai.js`)

Portado de [godlikeb0b/sei-pro](https://github.com/godlikeb0b/sei-pro). Adiciona `perfilOllama`, `modelsOllama`, `loadAIPromptsToStorage()` e resolve `getModelAI` para 3 plataformas. Ver `sei-pro-ai.js` linhas 11–100 para detalhes.

### Service worker (`background.js`)

Registrado em `manifest.json` como `"background": { "service_worker": "js/background.js" }`. Abre aba na instalação/atualização. Requer permissão `tabs`.

---

## Publicação na Chrome Web Store

1. Gerar o pacote com `bash scripts/package-extension.sh`
2. Acessar `chrome.google.com/webstore/devconsole`
3. Upload do zip → preencher nome, descrição e screenshots
4. Em **Visibilidade** → **Privado**
5. Submeter para revisão (1–3 dias úteis)

**Descrição curta para a loja (132 chars):**
```
Ferramentas avançadas para o SEI da PRF. Gerencie processos, documentos e use IA diretamente no Sistema Eletrônico de Informações.
```

---

## Repositórios de referência

| Repo | Relevância |
|---|---|
| [pedrohsoaresadv/sei-pro](https://github.com/pedrohsoaresadv/sei-pro) | Base original |
| [godlikeb0b/sei-pro](https://github.com/godlikeb0b/sei-pro) | Implementação do Ollama |
| [tarcinwth/sei-amargosa](https://github.com/tarcinwth/sei-amargosa) | Referência de fork municipal |

---

## Histórico

Veja o [CHANGELOG](./CHANGELOG.md).
