import type { DataISO } from "@comum/datas/dias";
import type { Versionada } from "@comum/sincronia/entidade";

export type TipoLista = "unidade" | "pessoal";

/** Quem é e onde está o usuário, lido do cabeçalho do SEI pelo content script. */
export interface ContextoAba {
  host: string;
  /** Sempre em minúsculas. */
  login: string;
  nome: string;
  /** null quando a tela não mostra a unidade: só a lista Pessoal funciona. */
  unidade: { id: string; sigla: string; nome: string } | null;
  versao: string;
  /** Modo noturno do SEI Pro (legado) ligado na página. */
  temaEscuro: boolean;
}

export interface Escopo {
  host: string;
  login: string;
  lista: TipoLista;
  unidade?: { id: string; sigla: string };
}

/** O que a tela do SEI informa sobre um processo, sem requisição. */
export interface DadosProcesso {
  id: string;
  protocolo: string;
  tipo?: string;
  especificacao?: string;
  /** true/false quando a tela informa; undefined quando não sabe (mantém o que havia). */
  sigiloso?: boolean;
  /** A tela não diz o nível de acesso (resultado da Pesquisa): fica fora do Texto Padrão, do agente e do Atualizar até confirmar. */
  sigiloAConfirmar?: boolean;
}

/** Porta do `configdate` legado, com nomes legíveis (spec 6.2). */
export interface Prazo {
  referencia:
    | { de: "data"; data: DataISO }
    | { de: "documento"; idDocumento: string; data: DataISO }
    | { de: "novoDocumento"; tipos: string[]; desde: DataISO };
  /** n negativo: antes da referência. */
  vencimento?: { em: "data"; data: DataISO } | { em: "dias"; n: number; contagem: "corridos" | "uteis" };
  /** "ate": quanto falta para a data; "desde"/"desdeUteis": quanto passou desde ela. */
  exibicao: "ate" | "desde" | "desdeUteis";
}

export type SituacaoPrazo = "noPrazo" | "hoje" | "atrasado" | "semVencimento" | "aguardando";

export interface ResumoPrazo {
  situacao: SituacaoPrazo;
  vencimento?: DataISO;
  texto: string;
  dica: string;
  /** Para ordenar por prazo: dias até vencer (negativo = atrasado). */
  ordem: number;
}

/**
 * O que se sabe de um processo num momento: da caixa (sem custo), da árvore que
 * o próprio usuário abriu, ou do "Atualizar" pedido por ele. O `visto` fica no
 * favorito (sincroniza); o `atual` fica numa chave local, porque muda a cada
 * carga da caixa e não pode virar conflito entre computadores.
 */
export interface Instantaneo {
  quando: number;
  fonte: "caixa" | "arvore" | "atualizar";
  abertoNaUnidade?: boolean;
  naoVisualizado?: boolean;
  documentoNovo?: boolean;
  atribuido?: string;
  marcadores?: string[];
  concluido?: boolean;
  qtdDocumentos?: number;
  ultimoAndamento?: { data: string; unidade: string; descricao: string };
  /** O "Atualizar" pegou o processo recém-chegado à unidade: o SEI registrou o recebimento. */
  recebidoNaLeitura?: boolean;
}

export interface DocumentoFavorito {
  id: string;
  /** Número SEI. */
  numero: string;
  titulo: string;
  nota?: string;
  criadoEm: number;
}

export interface Lembrete {
  em: DataISO;
  texto?: string;
}

export interface Favorito extends Versionada {
  /** id_procedimento. */
  id: string;
  protocolo: string;
  /** Apelido do usuário (substitui a "especificação própria" do legado). */
  titulo?: string;
  /** Cache do que a tela do SEI mostrou, para exibir e buscar. */
  tipo?: string;
  especificacao?: string;
  pasta?: string;
  etiquetas: string[];
  nota?: string;
  prazo?: Prazo;
  /** Mapa (ganha tela na F4); preservado na migração. */
  local?: { lat: number; lng: number };
  lembrete?: Lembrete;
  documentos?: DocumentoFavorito[];
  /** O que o usuário viu por último (base do "o que mudou"). */
  visto?: Instantaneo;
  /** Índice fracionário (comparar com < e >). */
  ordem: string;
  sigiloso?: true;
  /** Veio de tela que não informa o sigilo (Pesquisa); a caixa ou a árvore confirmam depois. */
  sigiloAConfirmar?: true;
  /**
   * Registro mínimo do Texto Padrão (lápide ou aviso de sigilo, sem número nem nota): na
   * mesclagem leva só o estado, e os dados ficam os do computador que os tem.
   */
  resumido?: true;
  criadoEm: number;
}

export type MudancasFavorito = Partial<Omit<Favorito, "id" | "atualizadoEm" | "dispositivo" | "criadoEm">>;

export interface Pasta extends Versionada {
  nome: string;
  cor?: string;
  ordem: string;
}

export interface Etiqueta extends Versionada {
  nome: string;
  cor: string;
  /** Nome do ícone do legado (FontAwesome), guardado para a F4. */
  icone?: string;
}

export type ModoOrdem = "manual" | "prazo" | "protocolo" | "inclusao" | "novidade";

export interface Filtro {
  busca?: string;
  pasta?: string;
  etiqueta?: string;
  prazo?: SituacaoPrazo | "semPrazo";
  /** Só os que têm novidade. */
  novidade?: boolean;
  /** Só os com lembrete para hoje (ou vencido). */
  lembrete?: boolean;
}

export interface Preferencias {
  exibir: "abaixo" | "lateral" | "ambos";
  perguntarAoFavoritar: boolean;
  /** Obsoleto (era um só para todos os SEIs): valem as escolhas por unidade, abaixo. */
  textoPadrao: "nao-perguntado" | "ligado" | "desligado";
  /** Consentimento do Texto Padrão por pessoa e unidade (`host|login|idUnidade`): o texto é visível para aquela unidade. */
  textoPadraoUnidades: Record<string, "ligado" | "desligado">;
  recolhido: boolean;
  agruparPorPasta: boolean;
  ordem: ModoOrdem;
  faixaUnidadeDispensada: boolean;
}

export const PREFERENCIAS_PADRAO: Preferencias = {
  exibir: "abaixo",
  perguntarAoFavoritar: true,
  textoPadrao: "nao-perguntado",
  textoPadraoUnidades: {},
  recolhido: false,
  agruparPorPasta: false,
  ordem: "manual",
  faixaUnidadeDispensada: false,
};

export interface Carimbo {
  agora: number;
  dispositivo: string;
}
