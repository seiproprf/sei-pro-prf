# Pesquisa rápida

Filtro local nas tabelas de controle e destaque na árvore e no documento HTML.
Segue os módulos TypeScript do upstream: `src/main.ts` é o content script isolado,
`controle.ts` cuida dos eventos e da observação, `leitura.ts` lê o DOM e tooltips
com o parser de literais do `sei-nucleo`, e `texto.ts` faz a comparação.

A preferência `filtrarpaginapelapesquisarapida` usa `sei-comum` e o formato
existente de `chrome.storage.sync.dataValues`. Ausente significa ligada; uma
escolha salva prevalece. Mudanças da preferência valem sem recarregar.

    npm install
    npm run tipos
    npm run build

Para repetir o smoke com o bundle no Chromium, rode `npm run verificar:navegador`
(após o build). Ele usa `npx @playwright/cli`, navegador instalado e storage
simulado, sem acessar o SEI.

O build verifica o comportamento e gera `dist/js/init_pesquisa_rapida.js`, em
ASCII para páginas SEI com codificações antigas. Não editar o bundle à mão.

## Validação no SEI

- No controle, buscar número sem pontuação e texto de tooltip. Usar três ou
  mais caracteres; várias palavras devem estar no mesmo campo.
- Limpar com Escape, verificar Enter como pesquisa nativa e combinar com
  agrupamentos e filtros já existentes: o módulo só remove sua própria classe.
- Dentro do processo, buscar na árvore, expandir nós, abrir outro documento e
  conferir destaques no HTML, inclusive frames filhos. PDF/imagem ficam inativos.
- Desligar e religar a opção durante a busca: filtro e destaques são reversíveis.

Os testes usam DOM sintético e fixture SEI 4.1, sem sessão ou conteúdo de produção.
