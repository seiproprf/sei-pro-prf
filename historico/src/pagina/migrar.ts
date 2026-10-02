import { converterLegado } from "../migracao/legado";
import { LEGADO_CHAVE } from "../modelo/constantes";
import type { RepositorioHistorico } from "../repositorio";

/** Importa uma vez o histórico antigo (localStorage). Mantém a chave antiga até o usuário pedir para apagar. */
export async function migrarSeNecessario(
  repo: RepositorioHistorico,
  armazenamento: Pick<Storage, "getItem" | "removeItem">,
  agora = Date.now(),
): Promise<number | null> {
  const meta = await repo.meta();
  if (meta.migradoEm) {
    if (meta.apagarLegado) {
      try {
        armazenamento.removeItem(LEGADO_CHAVE);
      } catch {
        /* sem acesso ao localStorage */
      }
      await repo.gravarMeta({ apagarLegado: undefined });
    }
    return null;
  }
  let bruto: string | null = null;
  try {
    bruto = armazenamento.getItem(LEGADO_CHAVE);
  } catch {
    /* idem */
  }
  if (!bruto) {
    await repo.gravarMeta({ migradoEm: agora });
    return null;
  }
  const r = converterLegado(bruto);
  const n = await repo.importar(r.visitas);
  await repo.gravarMeta({ migradoEm: agora, migrados: n });
  return n;
}
