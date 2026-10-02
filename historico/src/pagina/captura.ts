import type { Arvore } from "@nucleo/dominio/arvore";
import type { DadosCompletos, UnidadeVisita, Visita } from "../modelo/tipos";
import { precisaCompletar } from "../modelo/visita";
import type { RepositorioHistorico } from "../repositorio";

export interface DepsCaptura {
  repo: RepositorioHistorico;
  /** historicoproc && preferencias.registrar */
  ligado(): Promise<boolean>;
  limite(): Promise<number>;
  consultar(arv: Arvore): Promise<DadosCompletos>;
  agora(): number;
}

/** Registra a visita e a completa com 1 GET (no máximo a cada 12 h; nunca em sigiloso). */
export async function capturarVisita(arv: Arvore, unidade: UnidadeVisita | null, d: DepsCaptura): Promise<Visita | null> {
  if (!arv.idProcedimento || !arv.protocolo || !(await d.ligado())) return null;
  const agora = d.agora();
  let v = await d.repo.registrarVisita(
    { id: arv.idProcedimento, protocolo: arv.protocolo, tipo: arv.tipo || undefined, nivel: arv.nivel, unidade },
    agora,
  );
  await d.repo.podar(await d.limite()).catch(() => 0);
  if (precisaCompletar(v, agora)) {
    await d.repo.marcarTentativa(v.id, agora);
    try {
      v = (await d.repo.completar(v.id, await d.consultar(arv), d.agora())) ?? v;
    } catch (e) {
      console.warn("[SEI Pro] histórico: não foi possível ler os dados do processo", e);
    }
  }
  return v;
}
