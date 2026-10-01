/** Nome da porta entre o content script (a aba do SEI) e o app do favoritos. */
export const CANAL_FAVORITOS = "seipro-favoritos";
/** Em `chrome.storage.sync`: pequeno, acompanha a conta do navegador. */
export const CHAVE_PREFERENCIAS = "favoritos/preferencias";
export const DIAS_LIXEIRA = 30;
export const DIAS_LAPIDE = 90;
/** O mesmo teto do legado. */
export const MAX_ETIQUETAS = 8;
export const MAX_NOTA = 2000;
/** Valor do filtro "sem pasta" (nenhum id real começa com "__"). */
export const SEM_PASTA = "__sem__";
export const chaveMigracao = (host: string, login: string): string => `favoritos/migracao/${host}|${login}`;
export const chaveUltimaUnidade = (host: string, login: string): string => `favoritos/ultimaUnidade/${host}|${login}`;
/** Porta das abas do SEI com o app no painel lateral (diferente da do app embutido, que é da própria aba). */
export const CANAL_LATERAL = "seipro-favoritos-lateral";
/** Em `chrome.storage.local`: o app lateral anuncia que abriu (`Abertura` da sei-comum). */
export const CHAVE_LATERAL = "favoritos/lateralAberto";
