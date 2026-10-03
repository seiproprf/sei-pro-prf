import type { Area } from "@comum/armazenamento/area";
import { converterLegado } from "../migracao/legado";
import { chaveMigracao, LEGADO_CHAVE } from "../modelo/constantes";
import { lerPreferencias } from "../preferencias";
import type { RepositorioHistorico } from "../repositorio";

export interface DepsMigracao {
  /** chrome.storage.local: a marca por SEI e a pausa do registro. */
  area: Area;
  host: string;
  login: string;
}

/**
 * Importa uma vez o histórico antigo (localStorage). Mantém a chave antiga até o usuário pedir para apagar.
 *
 * O localStorage é um por SEI, e não por login: quem abrir primeiro herda tudo (spec 5.4). A marca
 * `historico/migracao/<host>` impede o segundo login do mesmo SEI de reimportar a mesma lista. Com o
 * registro pausado nada entra, nem o antigo: a migração fica para quando o usuário retomar.
 */
export async function migrarSeNecessario(
  repo: RepositorioHistorico,
  armazenamento: Pick<Storage, "getItem" | "removeItem">,
  d: DepsMigracao,
  agora = Date.now(),
): Promise<number | null> {
  const meta = await repo.meta();
  // O pedido de apagar vale antes de tudo: com a migração adiada (pausa), o antigo apagado não volta depois.
  if (meta.apagarLegado) {
    try {
      armazenamento.removeItem(LEGADO_CHAVE);
    } catch {
      /* sem acesso ao localStorage */
    }
    await repo.gravarMeta({ apagarLegado: undefined });
  }
  if (meta.migradoEm) return null;
  if (!(await lerPreferencias(d.area)).registrar) return null;
  const kHost = chaveMigracao(d.host);
  const marca = (await d.area.obter(kHost))[kHost];
  // Outro login deste SEI já trouxe a lista antiga: este só marca que a migração passou.
  if (marca && typeof marca === "object") {
    await repo.gravarMeta({ migradoEm: agora });
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
  await d.area.gravar({ [kHost]: { em: agora, login: d.login } });
  await repo.gravarMeta({ migradoEm: agora, migrados: n });
  return n;
}
