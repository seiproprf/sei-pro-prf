# Favoritos F3 — sincronia (Texto Padrão, arquivo, cópias diárias) — plano

> **Para quem executa:** SUB-SKILL obrigatória: superpowers:executing-plans (inline). Passos com caixas (`- [ ]`).

**Objetivo:** os favoritos de uma unidade acompanham o usuário entre computadores sem servidor do SEI Pro: pelo Texto Padrão do próprio SEI (com consentimento), por um arquivo numa pasta sincronizada e, como rede de segurança, por cópias diárias locais.

**Arquitetura:** a regra é sempre "puxar → mesclar → (se mudou) empurrar", com a mesclagem por entidade que já existe (`sei-comum/sincronia/entidade.ts`, `RepositorioFavoritos.importar`). O Texto Padrão roda no content script (tem a sessão), por um armazém genérico do núcleo (`sei-nucleo/dominio/textoPadrao.ts`, a receita provada na P1). O estado da sincronia fica no `chrome.storage.local` (`favoritos/sync/<escopo>`) e o app só mostra e pede ações pela ponte. O arquivo e as cópias rodam no app (origem da extensão: File System Access e IndexedDB).

**Spec:** `docs/superpowers/specs/2026-10-01-favoritos-design.md` (6.4, 9.1–9.4) e o relatório `2026-10-01-favoritos-provas.md` (P1).

## Restrições globais

- Pessoal e sigilosos **nunca** vão para o Texto Padrão; o campo `atual` (F4) também não.
- Nome do texto `[_SEIPRO_FAV_<login>]` (≤ 50); login longo → `[_SEIPRO_FAV_<27>~<8 hex>]`; descrição ≤ 300.
- Conteúdo: `<p>` legível + blocos `<p>` de 2.000 caracteres base64url (gzip). Ler por `textarea[name="txaConteudo"]` desfazendo escape duplo (SEI 5).
- Conteúdo remoto só é aceito se host, login e unidade casarem; inválido nunca apaga nada local.
- Teto 100 KB de conteúdo por escopo; aviso a partir de 80%; acima, não grava e sugere o arquivo.
- Puxa no máximo a cada 5 min (carga da caixa e abertura do app); empurra 15 s depois da última mudança local; pendência persistida.
- Uma trava por escopo (`navigator.locks`) entre abas do SEI.
- Nada de montar link: lista pelo link do menu, alterar/consultar pelos links da linha, excluir pelo link assinado do script da lista.
- Desligar oferece "Apagar meus dados do SEI desta unidade".

## Foco de revisão

1. Colega da unidade edita ou apaga o texto: o local continua valendo, o remoto inválido é regravado, nada local some.
2. Duas abas do SEI abertas: só uma sincroniza por vez e a segunda não regrava o mesmo conteúdo.
3. Sessão expirada no meio: status "Erro: sessão expirada", pendência mantida, próxima carga tenta de novo.
4. Lista de textos com paginação: o texto é achado na página 2.
5. Usuário sem permissão de Texto Padrão: status "Indisponível nesta unidade", sem repetir a tentativa a cada carga.

---

### Tarefa 1: codec (`sei-comum/sincronia/codec.ts`)
Produz `codificar(valor): Promise<string>` (JSON → gzip → base64url), `decodificar(texto): Promise<unknown>`, `paraParagrafos(legivel, b64, bloco=2000): string`, `deParagrafos(html): string | null` (aceita escape duplo e quebras de linha).
- [ ] Testes: ida e volta com acentos, travessão, aspas curvas, emoji e 5 mil itens; blocos de 2.000; leitura com `&lt;p&gt;`; HTML sem blocos → `null`; base64 corrompido rejeita.

### Tarefa 2: armazém em Texto Padrão (`sei-nucleo/dominio/textoPadrao.ts`)
Produz `criarArmazemTextoPadrao(sei, { nome, descricao })` → `{ localizar(), ler(), gravar(html), excluir() }`; `ErroSei` tipado (`SEI_ACAO_INDISPONIVEL` sem o menu = sem permissão).
- [ ] Testes com as fixtures `texto_padrao_*` e transporte falso: localizar na lista; na página 2 (paginação pelo formulário da lista); ausente → `null`; ler (4.1 com id e 5 sem id + escape duplo); gravar cadastra quando não existe e altera quando existe (botão certo, `txaConteudo` em html); excluir posta `hdnInfraItemId` no link assinado; sem o item do menu → `SEI_ACAO_INDISPONIVEL`.

### Tarefa 3: envelope do Texto Padrão (`favoritos/src/sincronia/textoPadrao.ts`)
Produz `nomeDoTexto(login)`, `envelopeDaUnidade(repo, escopo, carimbo)` (sem sigilosos, sem `atual`), `conteudoDoTexto(env, nomeUsuario)`, `lerConteudoDoTexto(html, escopo)` → `{ envelope } | { invalido: motivo }`, `tamanhoOk(bytes)`.
- [ ] Testes: nome curto e truncado com hash; sigiloso fora; envelope de outro login/unidade recusado; texto editado por colega → inválido; ida e volta completa.

### Tarefa 4: motor (`favoritos/src/sincronia/motor.ts`)
Produz `class MotorSincronia { sincronizar({forcar}), agendarEnvio(), status() }` com dependências injetadas (destino `{ler, gravar}`, repo, área de status, trava, relógio). Status `{ estado: "ok"|"pendente"|"erro"|"indisponivel"|"desligado", quando, mensagem?, tamanho? }` em `favoritos/sync/<chave>`.
- [ ] Testes: puxar mescla o remoto; local mais novo empurra; igual não empurra; remoto inválido regrava a partir do local; erro de sessão vira "erro" e mantém pendente; sem permissão vira "indisponivel" e não tenta por 1 dia; acima do teto não grava e avisa; trava impede duas rodadas juntas; puxar no máximo a cada 5 min sem `forcar`.

### Tarefa 5: ligar no content script e na ponte
Content script (janela de topo com sessão, unidade presente, preferência `ligado`): motor com destino Texto Padrão; puxa ao carregar a caixa; empurra 15 s depois de mudanças; ops `sincronizarAgora`, `apagarDoSei`. Higiene: oculta `[_SEIPRO_` no `selTextoPadrao`; legado do Documentos em Lote oculta `[_`.
- [ ] Testes: higiene do seletor numa tela sintética; op `apagarDoSei` chama excluir e desliga a preferência.

### Tarefa 6: consentimento, status e menu no app
Faixa de convite (uma vez por unidade, com "Agora não"), diálogo com os quatro pontos, linha de status, diálogo "Sincronização" (status, sincronizar agora, desligar, apagar do SEI).
- [ ] Testes: convite aparece com unidade e `nao-perguntado`; Ligar grava `ligado` e pede `sincronizarAgora`; status renderiza os estados; desligar com apagar chama `apagarDoSei`.

### Tarefa 7: arquivo (File System Access) e cópias diárias
`favoritos/src/sincronia/arquivo.ts` (handle no IndexedDB, permissão, ler/mesclar/gravar todos os escopos) e `copias.ts` (uma por dia, guarda 14, restaurar re-carimbando). Firefox: continua Exportar/Importar.
- [ ] Testes: cópia do dia não duplica; poda em 14; restaurar traz de volta o removido depois da cópia; arquivo: mescla ao ler, grava envelope com todos os escopos (handle falso).

### Tarefa 8: build, provas, commit
- [ ] Suítes, build, portão ASCII; P1/P4 ao vivo no fim (com o autor).
