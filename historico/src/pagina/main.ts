/**
 * Content script do histórico (mundo isolado, todos os frames, document_start).
 * Marca o documento de forma síncrona (o legado não carrega o código antigo) e,
 * já com o DOM, registra a visita quando o frame da árvore do processo carrega.
 * Na janela de topo, migra uma vez o histórico antigo do localStorage.
 */
import { areaChrome } from "@comum/armazenamento/area";
import { lerOpcaoLegada } from "@comum/opcoes/legadas";
import { corDoTemaSei, temaEscuroLegado } from "@comum/pagina/tema";
import { temPainelLateral } from "@favoritos/modelo/exibicao";
import { type Arvore, lerArvore } from "@nucleo/dominio/arvore";
import { consultarDaArvore } from "@nucleo/dominio/processo";
import { criarHttp } from "@nucleo/sessao/http";
import { documentoTopo, paginaDe } from "@nucleo/sessao/pagina";
import { chaveEscopo } from "../modelo/constantes";
import { lerPreferencias } from "../preferencias";
import { RepositorioHistorico } from "../repositorio";
import { capturarVisita } from "./captura";
import { contextoHistorico } from "./contexto";
import { marcarAtivo } from "./marca";
import { migrarSeNecessario } from "./migrar";

marcarAtivo(document);

const global = window as unknown as { __seiProHistorico?: boolean };
if (!global.__seiProHistorico) {
  global.__seiProHistorico = true;
  const iniciar = () => void principal().catch((e) => console.warn("[SEI Pro] histórico:", e));
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  else iniciar();
}

const naArvore = (doc: Document) => !!doc.querySelector("#topmenu") && !!doc.querySelector("#divArvore");

async function principal(): Promise<void> {
  const noTopo = window === window.top;
  const arvore = naArvore(document);
  if (!arvore && !noTopo) return;
  if (!(await lerOpcaoLegada("historicoproc"))) return;
  const topo = documentoTopo();
  const manifesto = chrome.runtime.getManifest();
  const temFavoritos = (manifesto.content_scripts ?? []).some((c) => c.js?.includes("js/init_favoritos.js"));
  const ctx = contextoHistorico(
    topo,
    {
      temaEscuro: temaEscuroLegado(localStorage),
      favoritosAtivo: temFavoritos && (await lerOpcaoLegada("gerenciarfavoritos")),
      lateralDisponivel: temPainelLateral(manifesto),
      corTema: corDoTemaSei(topo),
    },
    topo.location?.href,
  );
  if (!ctx) return;
  const area = areaChrome(chrome.storage.local, "local");
  const repo = new RepositorioHistorico(area, chaveEscopo(ctx.host, ctx.login));
  if (arvore) {
    let arv: Arvore | null;
    try {
      arv = lerArvore(paginaDe(document, location.href));
    } catch {
      arv = null;
    }
    if (arv?.idProcedimento) {
      const http = criarHttp(location.href);
      void capturarVisita(arv, ctx.unidade ? { id: ctx.unidade.id, sigla: ctx.unidade.sigla } : null, {
        repo,
        // historicoproc já foi conferida acima: aqui só a pausa.
        ligado: async () => (await lerPreferencias(area)).registrar,
        limite: async () => (await lerPreferencias(area)).limite,
        consultar: async (a) => {
          const m = await consultarDaArvore(http, a);
          return { tipo: m.tipo, especificacao: m.especificacao, interessados: m.interessados, assuntos: m.assuntos };
        },
        agora: () => Date.now(),
      }).catch((e) => console.warn("[SEI Pro] histórico: captura", e));
    }
  }
  if (noTopo) void migrarSeNecessario(repo, localStorage).catch((e) => console.warn("[SEI Pro] histórico: migração", e));
}
