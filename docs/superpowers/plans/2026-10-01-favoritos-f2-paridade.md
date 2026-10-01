# Favoritos F2 + paridade — plano de implementação

> **Para quem executa:** SUB-SKILL obrigatória: superpowers:executing-plans (execução inline pelo próprio autor do plano). Passos com caixas (`- [ ]`).

**Objetivo:** levar os favoritos ao painel lateral (abas Favoritos | Agente), com botão na barra do SEI e preferência de exibição, e repor o que o legado tinha e a F1 deixou de fora (mapa, "Manter em favoritos" no Enviar Processo, prazo a partir de documento).

**Arquitetura:** o mesmo app (`html/favoritos.html`) roda em dois modos. **Embutido** (F1): porta da própria aba, filtrada por `tab.id`. **Lateral** (novo): o app anuncia que abriu numa chave do `chrome.storage.local`; as abas do SEI com sessão conectam numa porta própria (`seipro-favoritos-lateral`) e se apresentam (visível, foco, contexto); o app usa a aba visível mais recente desta janela e se remonta quando o contexto (host, login, unidade) muda. O `html/painel.html` vira o `side_panel.default_path`: um shell com abas e iframes preguiçosos que ficam vivos depois de carregados.

**Tecnologia:** TypeScript strict, esbuild (`charset: ascii`), tsx + linkedom, Biome 2, Leaflet já empacotado em `js/lib/leaflet.js`.

**Spec:** `docs/superpowers/specs/2026-10-01-favoritos-design.md` (seções 5, 7.1, 7.5, 7.6, 8).

## Restrições globais

- JS gerado só com ASCII (portão byte a byte no `build.mjs`); acentos dos fontes viram `\uXXXX` pelo esbuild, e regex com acento é montada sem caractere cru.
- Nunca montar link do SEI à mão: só links assinados lidos da página (`infra_hash`).
- Nenhuma leitura da árvore em segundo plano sem pedido explícito do usuário (efeito "Processo recebido"/visualizado, memória `project_arvore_marca_recebido`).
- Nada de `innerHTML`/`on*` inline: `h()` da `sei-comum/ui`.
- Pacote oficial e dos órgãos intocados: só o manifest Lab (`dist/manifest.json`) muda.
- `gerenciarfavoritos` desligada = nada aparece (nem botão, nem ponte lateral).
- Testes: `cd favoritos && npm run verificar && npm run tipos && npm run checar`; idem `sei-comum`; `agente-ia` para o background.

## Foco de revisão

1. Duas abas do SEI na mesma janela, em unidades diferentes: o painel lateral mostra a lista da aba visível e troca ao trocar de aba, sem misturar escopos.
2. A aba do SEI recarrega no meio de uma operação do painel: a porta cai, o painel mostra "conectando" e volta sozinho quando a aba reconecta.
3. Pacote sem `side_panel` (Firefox, órgãos): preferência "lateral" não aparece e o botão rola até o painel embutido.
4. O agente dentro do iframe continua recebendo as portas das abas (`agente-vivo`, `CHAVE_ABERTURA`) e o `abrirAgente` antigo abre o painel já na aba Agente.
5. Enviar Processo em SEI 4.1 (formulário no `ifrVisualizacao` aninhado): a caixa aparece uma vez, sem quebrar o envio.

---

### Tarefa 1: `sei-comum/ponte/abertura.ts` (anúncio e escolha da aba)

**Arquivos:** criar `sei-comum/src/ponte/abertura.ts`; teste em `sei-comum/tests/verificar-abertura.ts` (registrar em `tests/verificar.ts`).

**Produz:**
```ts
export interface Abertura { id: string; quando: number }
export function abridorDe(valor: unknown): string | null;
export function precisaConectar(valor: unknown, temPorta: boolean, servidos: Set<string>): boolean;
export interface AbaCandidata { id: number; janela: number; visivel: boolean; foco: number }
export function escolherAba<T extends AbaCandidata>(abas: T[], janela: number, fixada?: number | null): T | null;
```
Regras (as do agente, `agente-ia/src/ponte/protocolo.ts` e `cliente.ts`): `abridorDe` aceita `{id}` ou número; `precisaConectar` só quando há abridor e (sem porta ou abridor não servido); `escolherAba` filtra pela janela (janela < 0 aceita todas), a fixada vence, senão visível primeiro e depois o foco mais recente.

- [ ] Testes: abridor de objeto, de número, de lixo (`null`); precisa conectar sem porta; não reconecta para o mesmo abridor; reconecta para abridor novo; escolhe visível sobre foco recente; ignora outra janela; fixada vence; lista vazia → `null`.
- [ ] Rodar e ver falhar; implementar; rodar e ver passar; commit.

### Tarefa 2: onde mostrar (`modelo/exibicao.ts`)

**Arquivos:** criar `favoritos/src/modelo/exibicao.ts`; testes em `favoritos/tests/verificar-exibicao.ts`.

**Produz:**
```ts
export function temPainelLateral(manifesto: { side_panel?: unknown; sidebar_action?: unknown }): boolean;
export function ondeMostrar(exibir: Preferencias["exibir"], lateral: boolean): { abaixo: boolean; lateral: boolean };
export const ROTULOS_EXIBIR: Record<Preferencias["exibir"], string>;
```
Sem painel lateral, tudo vira `{abaixo: true, lateral: false}`.

- [ ] Testes: manifest com `side_panel`, com `sidebar_action`, sem nenhum; `lateral` sem painel → abaixo; `ambos` com painel → os dois.
- [ ] RED, GREEN, commit.

### Tarefa 3: ponte lateral, lado da aba (`pagina/lateral.ts`)

**Arquivos:** criar `favoritos/src/pagina/lateral.ts`; constantes `CANAL_LATERAL = "seipro-favoritos-lateral"` e `CHAVE_LATERAL = "favoritos/lateralAberto"` em `modelo/constantes.ts`; testes em `favoritos/tests/verificar-lateral.ts`.

**Consome:** `abridorDe`, `precisaConectar` (T1); `criarRpc`, `PortaRpc` (sei-comum).

**Produz:**
```ts
export interface DepsLadoAba {
  area: Area;                                   // chrome.storage.local
  conectar(): PortaRpc;                         // chrome.runtime.connect({name: CANAL_LATERAL})
  tratadores: Record<string, Tratador>;         // os mesmos do embutido, sem "altura"
  estado(): { visivel: boolean; foco: number }; // document.visibilityState e último foco
}
export function ligarLadoAba(d: DepsLadoAba): { apresentar(): void; parar(): void };
```
Conecta quando vê abridor novo em `CHAVE_LATERAL` (na carga e por `aoMudar`), chama `ola` no app com o estado, reapresenta em foco/visibilidade. Porta caída: zera e espera o próximo anúncio (o app renova a cada 60 s; a aba também confere a cada 5 s, como o agente).

- [ ] Testes (areaMemoria + parDePortas): sem anúncio não conecta; anúncio → conecta e apresenta; mesmo abridor renovado não reconecta; abridor novo reconecta; pedido do app chega aos tratadores; porta caída + novo anúncio → reconecta.
- [ ] RED, GREEN, commit.

### Tarefa 4: ponte lateral, lado do app (`app/lateral.ts`) e app remontável

**Arquivos:** criar `favoritos/src/app/lateral.ts`; mudar `favoritos/src/app/app.ts` (método `destruir()`), `favoritos/src/app/main.ts` (modo pelo hash), `favoritos/estatico/favoritos.css` (`[data-modo="lateral"]` compacto); testes em `favoritos/tests/verificar-lateral.ts` e `verificar-app.ts`.

**Produz:**
```ts
export interface AbaLateral extends AbaCandidata { rpc: Rpc; chave: string }
export interface DepsLadoApp {
  area: Area;
  ouvirConexoes(cb: (porta: PortaRpc, remetente: { tab?: { id?: number; windowId?: number }; frameId?: number }) => void): void;
  janela: number;
  novoId(): string;
}
export class PonteLateral {
  constructor(d: DepsLadoApp);
  iniciar(): Promise<void>;           // anuncia e renova a cada 60 s
  atual(): AbaLateral | null;
  aoMudar(cb: () => void): () => void;
  encerrar(): Promise<void>;          // remove o anúncio
}
export function chaveDoContexto(ctx: ContextoAba): string; // host|login|idUnidade
```
`AppFavoritos.destruir()` cancela as assinaturas de `aoMudar` (repositórios e `sync`). O `main.ts` lateral: a cada mudança da ponte, se a chave do contexto da aba atual mudou, destrói o app e monta outro (lendo `contexto` da aba); sem aba, mostra "Abra o SEI nesta janela para ver seus favoritos". O `rpc` do app lateral é um intermediário que sempre fala com a aba atual.

- [ ] Testes: porta de outra janela é ignorada; porta de frame interno é recusada; `ola` atualiza visível/foco e a escolha; desconexão tira a aba e avisa; `destruir()` faz o app parar de reagir a mudanças do storage.
- [ ] RED, GREEN, commit.

### Tarefa 5: shell `painel.html` (abas Favoritos | Agente)

**Arquivos:** criar `favoritos/src/shell/painel.ts`, `favoritos/src/shell/main.ts`, `favoritos/estatico/painel.html`, `favoritos/estatico/painel.css`; mudar `favoritos/build.mjs` (entradas `js/favoritos/painel.js`, cópia de `painel.html`, `css/painel.css`); testes em `favoritos/tests/verificar-shell.ts`.

**Produz:**
```ts
export type AbaPainel = "favoritos" | "agente";
export interface DepsShell {
  sessao: Area;                 // chrome.storage.session (painelAba)
  temAgente: boolean;           // manifest tem js/init_agente.js
  url(caminho: string): string; // chrome.runtime.getURL
}
export function montarShell(raiz: HTMLElement, d: DepsShell): Promise<{ mostrar(aba: AbaPainel): void; atual(): AbaPainel }>;
```
Abas com `role="tab"`; iframe criado só na primeira vez que a aba aparece e escondido (não destruído) ao trocar; aba inicial de `painelAba` na sessão (padrão `favoritos`); `aoMudar` da sessão troca a aba com o painel já aberto; sem agente, não há barra de abas.

- [ ] Testes: abre na aba gravada; troca cria o iframe uma vez; voltar não recria; mudança da sessão troca; sem agente, só favoritos e nenhuma aba; iframe do favoritos com `#modo=lateral`.
- [ ] RED, GREEN, commit.

### Tarefa 6: `background.js` e manifest

**Arquivos:** mudar `dist/background.js`, `dist/manifest.json` (`side_panel.default_path` → `html/painel.html`; ícone novo `icons/menu/favoritos.svg` no WAR), `agente-ia/tests/verificar-background.ts`.

Mensagem `{tipo:"abrirPainel", aba}`: `sidePanel.open` **direto no listener** (gesto) e grava `painelAba` em `chrome.storage.session` (`abrirAgente` = `abrirPainel` com `aba:"agente"`). O clique na notificação de rotina grava `painelAba:"agente"` antes de abrir. Continua um único `onMessage`.

- [ ] Testes (no `chrome` falso, com `storage.session`): `abrirPainel` abre e grava a aba; `abrirAgente` grava `agente`; mensagem sem `sender.tab` é ignorada; continua 1 ouvinte de mensagem.
- [ ] RED, GREEN, commit.

### Tarefa 7: botão "Favoritos" na barra e reação à preferência

**Arquivos:** criar `favoritos/src/pagina/botao.ts`, `dist/icons/menu/favoritos.svg`; mudar `favoritos/src/pagina/main.ts` (ligar a ponte lateral no topo de qualquer tela com sessão; botão na caixa e na árvore; montar/desmontar o painel embutido quando `exibir` muda); testes em `favoritos/tests/verificar-botao.ts`.

**Produz:**
```ts
export interface AcoesBotao { abrirLateral(): void; rolarAtePainel(): void }
export function instalarBotaoCaixa(doc: Document, o: { url: (c: string) => string; destino: () => "lateral" | "abaixo" } & AcoesBotao): HTMLElement | null;
export function instalarBotaoArvore(doc: Document, o: { url: (c: string) => string } & Pick<AcoesBotao, "abrirLateral">): HTMLElement | null;
export function pedirPainelLateral(enviar: (m: unknown) => Promise<unknown>, abrirJanela: (url: string) => void, url: string): void;
```
Na caixa: `a.botaoSEI` com o SVG próprio (cor própria, como o do agente) em `#divBotoesControleProcessos, #divComandos`, uma vez só. Clique: `destino()==="lateral"` → `abrirLateral()`; senão rola até `#favoritesPro` e o expande. Na árvore: só com painel lateral disponível. `pedirPainelLateral` manda `abrirPainel` e, se falhar (sem background), abre `painel.html` numa janela.

- [ ] Testes (fixture `caixa.html`): botão entra uma vez; clique com "abaixo" chama rolar; com "lateral" chama abrir; árvore sem painel lateral não ganha botão; falha no envio abre a janela.
- [ ] RED, GREEN, commit.

### Tarefa 8: preferência na página de opções e no app

**Arquivos:** criar `favoritos/src/opcoes/exibicao.ts`, `favoritos/src/opcoes/main.ts` (bundle `js/favoritos/opcoes.js`); mudar `dist/html/options.html` (contêiner logo depois da linha `gerenciarfavoritos` + `<script type="module">`), `favoritos/src/app/app.ts` (grupo "Onde mostrar" no menu); testes em `favoritos/tests/verificar-opcoes.ts`.

**Produz:**
```ts
export function montarOpcoesExibicao(d: { sync: Area; lateralDisponivel: boolean }): Promise<HTMLElement>;
```
Rádios "Abaixo da lista", "No painel lateral", "Nos dois" (os dois últimos só com painel lateral) + "Perguntar pasta e etiquetas ao favoritar". Grava em `favoritos/preferencias` e acompanha mudanças feitas em outro lugar.

- [ ] Testes: marca a opção gravada; trocar grava; sem painel lateral só "Abaixo"; mudança externa remarca.
- [ ] RED, GREEN, commit.

### Tarefa 9: Enviar Processo — "Manter processo em Favoritos"

**Arquivos:** criar `favoritos/src/pagina/enviar.ts`; mudar `favoritos/src/pagina/main.ts` (tela `enviar`); testes em `favoritos/tests/verificar-enviar.ts` com `p_procedimento_enviar.html`.

**Produz:**
```ts
export function instalarManterNoEnvio(doc: Document, servico: ServicoFavoritosPagina, d: { id: string; protocolo: string; pastas: () => Promise<Pasta[]>; editar(m: MudancasFavorito): Promise<unknown> }): HTMLElement | null;
```
Formulário `#frmAtividadeListar[action*="acao=procedimento_enviar"]`; id do `action`; protocolo do topo/árvore (ou da própria tela). Caixa marcada se já é favorito; marcar/desmarcar grava na hora (como o legado: gravar só no envio perderia a escrita na navegação); com marcada, pasta e prazo (data) rápidos.

- [ ] Testes: insere uma vez; marcada quando já favorito; marcar adiciona; desmarcar remove; trocar a pasta edita; tela sem o formulário → nada.
- [ ] RED, GREEN, commit.

### Tarefa 10: mapa

**Arquivos:** criar `favoritos/src/app/mapa.ts`; mudar `app.ts` (menu do item "Mapa…", menu do topo "Mapa dos favoritos"), `componentes/item.ts` (ícone de local), `favoritos.css`; testes em `favoritos/tests/verificar-mapa.ts`.

**Produz:**
```ts
export function pontosDoMapa(favs: Favorito[]): Array<{ id: string; lat: number; lng: number; rotulo: string }>;
export function localValido(v: unknown): v is { lat: number; lng: number };
export function carregarLeaflet(doc: Document, url: (c: string) => string): Promise<LeafletMinimo>;
export function abrirMapaDoFavorito(...): void; export function abrirMapaGeral(...): void;
```
Leaflet sob demanda (`../js/lib/leaflet.js`, `../css/leaflet.css`, geocoder Nominatim como no legado); tiles OSM 256 px, `maxZoom 19`, atribuição; **sem `map.locate`**; o mapa geral usa os itens visíveis (com filtro) e nunca procura linha de tabela.

- [ ] Testes: pontos só de quem tem local válido; `localValido` recusa NaN/fora de faixa; `carregarLeaflet` injeta script e css uma vez só.
- [ ] RED, GREEN, commit.

### Tarefa 11: prazo a partir de documento

**Arquivos:** criar `favoritos/src/pagina/documentos.ts` (leitura de `#tblDocumentos` do "Gerar PDF"); mudar `pagina/executor.ts` (op `documentosAssinados`), `app/prazoForm.ts` (modo `documento`), `componentes/editor.ts`; testes em `verificar-prazo.ts` e `verificar-documentos.ts`.

**Produz:**
```ts
export interface DocumentoAssinado { id: string; numero: string; nome: string; data: DataISO }
export function lerDocumentosGerarPdf(doc: Document): DocumentoAssinado[];
// op "documentosAssinados" {id, buscar?: boolean} → { documentos: DocumentoAssinado[]; origem: "arvore-aberta" | "busca" }
```
Caminho sem efeito colateral primeiro: a árvore que a aba já mostra (`#ifrArvore` do mesmo processo) dá o link assinado do "Gerar PDF"; a tabela dá número, nome e data. Fora disso, só com `buscar: true` (o usuário clicou em "Buscar no SEI", que avisa que o SEI pode registrar o processo como visualizado) — busca pela pesquisa rápida do núcleo. `prazoForm` ganha o modo "A partir de um documento" que grava `{de:"documento", idDocumento, data}`.

- [ ] Testes: leitura da tabela (HTML sintético com a forma do legado); modo documento ida e volta no `prazoForm`; op sem árvore aberta e sem `buscar` → erro `PRECISA_BUSCAR`.
- [ ] RED, GREEN, commit.

### Tarefa 12: build, manifest, conferências

- [ ] `build.mjs` com as entradas novas e portão ASCII para todos os JS gerados; `dist/html/painel.html`, `dist/css/painel.css`.
- [ ] `tools/check-dom-injection.mjs`: incluir os bundles novos (menor adiado da F1).
- [ ] Suítes de `sei-comum`, `favoritos`, `sei-nucleo`, `agente-ia`; `npm run build` do favoritos e do agente; `node tools/patch-manifests.mjs --check` se aplicável.
- [ ] Commit.
