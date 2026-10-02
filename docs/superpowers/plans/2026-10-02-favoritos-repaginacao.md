# Favoritos — repaginação visual (02/10/2026) — plano

> **Para quem executa:** SUB-SKILL: superpowers:executing-plans (inline). Pedido do autor depois do teste no SEI ANTAQ.

**Objetivo:** dar ao favoritos um visual à altura do resto (hoje "simplista, pouco atrativo"). Também:
- trocar os `<select>` nativos por um seletor inteligente: múltipla escolha e filtro ao digitar, sem diferenciar acento nem caixa;
- tema: o painel lateral segue o escuro do sistema, e o painel embutido segue o tema do SEI;
- no embutido, abrir os diálogos fora do contêiner, centralizados na parte visível da tela;
- pôr ícones no menu de opções.

## Pedidos do autor (literais)

1. Repaginar os elementos ("o melhor do Claude Design").
2. Seletor inteligente no lugar do `<select>` nativo:
   - múltipla escolha;
   - filtro ao digitar, ignorando acentos;
   - outras inovações.
3. Tema:
   - lateral: segue o escuro do usuário, automaticamente;
   - abaixo da lista: segue o tema do SEI.
4. Modal do painel embutido fora do contêiner, centralizado na tela visível.
5. Ícones temáticos no menu de opções.

## Decisões de desenho

- **Tokens novos** em `sei-comum/ui/base.css`:
  - superfícies em camadas, bordas suaves e sombras em três níveis;
  - raios de 8/12/14;
  - movimento curto, que respeita `prefers-reduced-motion`;
  - modo escuro de verdade, não só invertido.
- **Combobox** (`sei-comum/ui/combobox.ts`), genérico, que funciona também em Shadow DOM (o balão):
  - simples ou múltiplo;
  - filtro com `normalizarTexto`, destacando o trecho achado;
  - contagem por opção;
  - "Selecionar os filtrados" e "Limpar";
  - "Criar “…”" quando não acha;
  - teclado completo (↑ ↓ Home End Enter Esc Backspace) e ARIA de combobox/listbox;
  - abre para cima quando falta espaço;
  - avisa a altura que precisa (o iframe embutido cresce).
- **Filtro** vira listas, com OU dentro do campo e E entre campos: pastas, etiquetas, prazos e situações. As situações são novidade, lembrete, nota, documentos favoritos, local no mapa, fora da unidade e sigiloso.
- **Lista:**
  - cartões com faixa de estado (novidade, atrasado, vence hoje);
  - número em algarismos tabulares;
  - pílulas de pasta, etiqueta, prazo, lembrete e documentos;
  - ações rápidas ao passar o mouse;
  - grupos que recolhem;
  - estado vazio ilustrado;
  - barra de seleção flutuante.
- **Menus** (opções e "⋯") com ícone em cada item, separadores e navegação por setas.
- **Diálogos:**
  - cabeçalho com ícone;
  - rodapé fixo;
  - campos com rótulo em cima;
  - modo de prazo em seletor com descrição;
  - corridos/úteis e antes/depois em controle segmentado.
- **Tema:**
  - lateral sem `data-tema`, seguindo o sistema (o shell também);
  - embutido com `data-tema` do modo noturno do SEI Pro e a cor de destaque lida da barra do SEI.
- **Diálogo fora do contêiner (embutido):** enquanto houver diálogo aberto, o content script põe o iframe em sobreposição.
  - O iframe vira fixo e cobre a tela visível. Uma reserva da mesma altura fica no lugar dele.
  - A rolagem da página do SEI trava.
  - O app esconde a lista e deixa o fundo transparente.
  - Para manter a transparência, o `color-scheme` do iframe é igual ao da página.
- **Avisos (toasts) do embutido** vão para a página do SEI, embaixo e no centro da tela visível, e a ação do aviso volta ao app pela ponte.

## Tarefas

1. **Base visual e ícones:** tokens, botões, campos, chips, menus, diálogos, toggle, segmentado e ícones novos.
2. **Combobox com testes:** filtro sem acento, múltiplo, teclado, criar, fechar fora, destaque e Shadow DOM.
3. **Filtro em listas no modelo**, com o agente acompanhando.
4. **App:**
   - barra (abas segmentadas, busca com atalho "/", filtros-combobox, ordem, agrupar, selecionar todos, Atualizar);
   - lista e cartões, grupos recolhíveis, "Para hoje", vazio, barra de seleção, menus com ícones.
5. **Diálogos:** editor (pasta e etiquetas em combobox com criar, prazo), lembrete, sincronização, preferências e migração.
6. **Tema** (lateral pelo sistema, embutido pelo SEI) e **sobreposição** dos diálogos e avisos no embutido.
7. **Balão** com combobox e o cabeçalho do painel na página do SEI.
8. **Build e capturas ao vivo** (claro, escuro, lateral, embutido, diálogo no meio da tela) e commit.
