/**
 * "Atualizar fora da unidade" (spec 7.3, passo 3), SÓ quando o usuário pede.
 *
 * Abrir a árvore de processo aberto na unidade faz o SEI registrar o
 * recebimento ou marcar como visualizado (memória `project_arvore_marca_recebido`).
 * Por isso: (1) a caixa INTEIRA é lida imediatamente antes, como trava; (2) todo
 * favorito que está nela é descartado, e os sigilosos também; (3) os demais são
 * lidos um por vez, com intervalo, e o usuário pode cancelar; (4) se mesmo assim
 * o processo chegou à unidade nesse meio tempo, o item ganha o aviso.
 */

import type { Instantaneo } from "../modelo/tipos";
import type { RepositorioFavoritos } from "../repositorio";

export interface LeituraProcesso {
  qtdDocumentos: number;
  abertoNaUnidade: boolean;
  ultimoAndamento?: Instantaneo["ultimoAndamento"];
}

export interface ProgressoAtualizacao {
  feitos: number;
  total: number;
  atual?: string;
  fim?: boolean;
  cancelado?: boolean;
  erros?: number;
  chegaram?: number;
}

export interface DepsAtualizar {
  repos: RepositorioFavoritos[];
  /** Ids de TODOS os processos abertos na unidade (todas as páginas da caixa). */
  listarCaixa(sinal: AbortSignal): Promise<Set<string>>;
  lerProcesso(protocolo: string, sinal: AbortSignal): Promise<LeituraProcesso>;
  progresso(p: ProgressoAtualizacao): Promise<void>;
  esperar(ms: number, sinal: AbortSignal): Promise<void>;
  intervalo?: number;
}

export async function atualizarForaDaUnidade(
  d: DepsAtualizar,
  sinal: AbortSignal,
): Promise<{ lidos: number; erros: number; chegaram: number }> {
  const naCaixa = await d.listarCaixa(sinal);
  const alvos = new Map<string, { protocolo: string; repos: RepositorioFavoritos[] }>();
  for (const r of d.repos) {
    for (const f of await r.ativos()) {
      if (f.sigiloso || naCaixa.has(f.id)) continue;
      const a = alvos.get(f.id) ?? { protocolo: f.protocolo, repos: [] };
      a.repos.push(r);
      alvos.set(f.id, a);
    }
  }
  const total = alvos.size;
  let feitos = 0;
  let erros = 0;
  let chegaram = 0;
  await d.progresso({ feitos, total });
  for (const [id, alvo] of alvos) {
    if (sinal.aborted) break;
    await d.progresso({ feitos, total, atual: alvo.protocolo });
    try {
      const l = await d.lerProcesso(alvo.protocolo, sinal);
      if (l.abertoNaUnidade) chegaram++;
      for (const r of alvo.repos) {
        const anterior = (await r.atuais()).get(id);
        const novo: Instantaneo = {
          ...anterior,
          quando: Date.now(),
          fonte: "atualizar",
          qtdDocumentos: l.qtdDocumentos,
          ultimoAndamento: l.ultimoAndamento ?? anterior?.ultimoAndamento,
          abertoNaUnidade: l.abertoNaUnidade,
          recebidoNaLeitura: l.abertoNaUnidade ? true : undefined,
        };
        await r.gravarAtual(id, novo);
        const f = await r.obter(id);
        if (f && !f.visto) await r.editar(id, { visto: { ...novo, recebidoNaLeitura: undefined } });
      }
    } catch {
      if (sinal.aborted) break;
      erros++;
    }
    feitos++;
    if (feitos < total && !sinal.aborted) await d.esperar(d.intervalo ?? 3000, sinal).catch(() => undefined);
  }
  await d.progresso({ feitos, total, fim: true, cancelado: sinal.aborted, erros, chegaram });
  return { lidos: feitos, erros, chegaram };
}

export const chaveProgresso = (host: string, login: string): string => `favoritos/atualizando/${host}|${login.toLowerCase()}`;

/** Uma atualização por aba; o app pede, acompanha pelo storage e pode cancelar. */
export class ControleAtualizar {
  private emCurso: AbortController | null = null;

  constructor(
    private readonly criarDeps: () => Omit<DepsAtualizar, "progresso">,
    private readonly gravarProgresso: (p: ProgressoAtualizacao) => Promise<void>,
  ) {}

  async iniciar(): Promise<{ lidos: number; erros: number; chegaram: number }> {
    if (this.emCurso) throw Object.assign(new Error("Já há uma atualização em andamento nesta aba."), { codigo: "EM_ANDAMENTO" });
    const ctl = new AbortController();
    this.emCurso = ctl;
    try {
      return await atualizarForaDaUnidade({ ...this.criarDeps(), progresso: (p) => this.gravarProgresso(p) }, ctl.signal);
    } finally {
      this.emCurso = null;
    }
  }

  cancelar(): boolean {
    this.emCurso?.abort();
    return !!this.emCurso;
  }
}
