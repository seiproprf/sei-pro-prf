export type Nivel = "publico" | "restrito" | "sigiloso";
export interface UnidadeVisita {
  id: string;
  sigla: string;
}
export interface Visita {
  id: string;
  protocolo: string;
  tipo?: string;
  especificacao?: string;
  interessados?: string[];
  assuntos?: string[];
  nivel?: Nivel;
  unidades: UnidadeVisita[];
  primeira: number;
  ultima: number;
  vezes: number;
  completadoEm?: number;
  tentouEm?: number;
  origem?: "legado";
}
export interface DadosVisita {
  id: string;
  protocolo: string;
  tipo?: string;
  nivel?: Nivel;
  unidade?: UnidadeVisita | null;
}
export interface DadosCompletos {
  tipo?: string;
  especificacao?: string;
  interessados?: string[];
  assuntos?: string[];
  nivel?: Nivel;
}
export type Limite = 500 | 1000 | 2000 | 5000;
export const LIMITES: readonly Limite[] = [500, 1000, 2000, 5000];
export type Ordem = "recentes" | "visitados" | "protocolo";
export const ORDENS: readonly Ordem[] = ["recentes", "visitados", "protocolo"];
export interface Preferencias {
  registrar: boolean;
  limite: Limite;
  ordem: Ordem;
  agruparPorDia: boolean;
}
export const PREFERENCIAS_PADRAO: Preferencias = { registrar: true, limite: 1000, ordem: "recentes", agruparPorDia: true };
export type Periodo = "hoje" | "ontem" | "7dias" | "30dias" | "antigos";
export const PERIODOS: readonly Periodo[] = ["hoje", "ontem", "7dias", "30dias", "antigos"];
export type Situacao = "favoritos" | "foraFavoritos" | "repetidos" | "publico" | "restrito" | "sigiloso";
export const SITUACOES: readonly Situacao[] = ["favoritos", "foraFavoritos", "repetidos", "publico", "restrito", "sigiloso"];
export interface Filtro {
  busca?: string;
  periodos?: Periodo[];
  tipos?: string[];
  unidades?: string[];
  interessados?: string[];
  assuntos?: string[];
  situacoes?: Situacao[];
}
export type PeriodoApagar = "hora" | "hoje" | "7dias" | "30dias" | "tudo";
export interface MetaHistorico {
  migradoEm?: number;
  migrados?: number;
  avisoMigracao?: boolean;
  apagarLegado?: boolean;
}
export interface ContextoHistorico {
  host: string;
  login: string;
  nome: string;
  unidade: { id: string; sigla: string; nome: string } | null;
  versao: string;
  temaEscuro: boolean;
  corTema?: string;
  /** Manifest com js/init_favoritos.js E opção gerenciarfavoritos ligada. */
  favoritosAtivo: boolean;
  /** O pacote tem painel lateral (side_panel/sidebar_action). */
  lateralDisponivel: boolean;
}
