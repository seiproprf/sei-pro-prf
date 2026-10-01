/**
 * Um ouvinte só, no documento, para todas as estrelas. O legado CLONA as linhas
 * da caixa quando agrupa os processos (getTableOnTag e appendGerados, em
 * sei-pro.js), e o clone leva o botão mas não o ouvinte de addEventListener:
 * a estrela clonada ficava morta, o mesmo sintoma da sugestão #1397. Com a
 * delegação, qualquer estrela (original ou clone) funciona, e os dados do
 * processo são lidos da linha no momento do clique.
 */

import type { DadosProcesso } from "../modelo/tipos";
import type { ServicoFavoritosPagina } from "./servico";

type Resolvedor = (estrela: HTMLButtonElement) => DadosProcesso | null;

const porDocumento = new WeakMap<Document, Resolvedor[]>();

export function delegarEstrelas(doc: Document, servico: ServicoFavoritosPagina, resolver: Resolvedor): void {
  const lista = porDocumento.get(doc);
  if (lista) {
    lista.push(resolver);
    return;
  }
  const resolvedores = [resolver];
  porDocumento.set(doc, resolvedores);
  // Captura no documento: a estrela responde antes de qualquer ouvinte da linha do SEI.
  doc.addEventListener(
    "click",
    (ev) => {
      const estrela = (ev.target as Element | null)?.closest?.(".spro-fav-estrela") as HTMLButtonElement | null;
      if (!estrela) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (estrela.getAttribute("aria-busy") === "true") return;
      for (const r of resolvedores) {
        const dados = r(estrela);
        if (dados) {
          void alternarComAviso(servico, dados, estrela);
          return;
        }
      }
    },
    true,
  );
}

/** Erro ao gravar não pode passar em silêncio: a estrela diz que falhou e o estado é relido. */
export async function alternarComAviso(servico: ServicoFavoritosPagina, dados: DadosProcesso, estrela: HTMLButtonElement): Promise<void> {
  estrela.setAttribute("aria-busy", "true");
  try {
    await servico.alternar(dados, estrela);
    estrela.removeAttribute("data-erro");
  } catch (e) {
    console.warn("[SEI Pro] favoritos: não foi possível gravar", e);
    const aviso = "Não foi possível gravar o favorito. Tente de novo.";
    estrela.setAttribute("data-erro", "1");
    estrela.setAttribute("aria-label", aviso);
    estrela.title = aviso;
    void servico.carregar().catch(() => undefined);
  } finally {
    estrela.removeAttribute("aria-busy");
  }
}
