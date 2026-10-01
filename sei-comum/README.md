# sei-comum

Peças genéricas do SEI Pro que não sabem nada do SEI: datas e feriados, construção
de DOM sem `innerHTML`, armazenamento uma-chave-por-entidade, mesclagem por
entidade (vence o mais recente), índice fracionário para ordem manual, leitura das
opções antigas (`dataValues`) e RPC sobre portas.

O que fala com o SEI fica no `sei-nucleo`. Os pacotes de funcionalidade
(`favoritos/`, `agente-ia/`) importam daqui pelo alias `@comum/*`.

    npm install && npm run tipos && npm run verificar && npm run checar
