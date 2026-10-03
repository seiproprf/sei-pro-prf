export const CANAL_HISTORICO = "seipro-historico";
export const CANAL_LATERAL = "seipro-historico-lateral";
export const CHAVE_LATERAL = "historico/lateralAberto";
export const CHAVE_PREFERENCIAS = "historico/preferencias";
export const EVENTO_ABRIR = "spro-historico-abrir";
export const ATRIBUTO_ATIVO = "data-seipro-historico";
export const LEGADO_CHAVE = "dadosHistoricoProcessoPro";
export const INTERVALO_VISITA_MS = 30 * 60_000;
export const VALIDADE_COMPLETAR_MS = 12 * 3_600_000;
export const ESPERA_TENTATIVA_MS = 2 * 60_000;
export const MAX_UNIDADES = 10;
// Cota do chrome.storage.local (10 MB divididos com Favoritos e Agente, até 5.000 visitas): listas e textos curtos.
export const MAX_LISTA = 10;
/** Cada interessado ou assunto. */
export const MAX_TEXTO = 120;
export const MAX_ESPECIFICACAO = 500;
export const PAGINA_LISTA = 200;
export const chaveEscopo = (host: string, login: string): string => `${host}|${login.trim().toLowerCase()}`;
/** host|login com as duas partes. Sem elas (o painel com o histórico desligado monta com "|"), nada é gravado. */
export const escopoValido = (escopo: string): boolean => {
  const i = escopo.indexOf("|");
  return i > 0 && i < escopo.length - 1;
};
export const prefixoVisitas = (escopo: string): string => `historico/${escopo}/v/`;
export const chaveMeta = (escopo: string): string => `historico/${escopo}/meta`;
