/**
 * A ponte do histórico com os Favoritos novos: estrela por linha, filtro e "Favoritar" em lote.
 * Usa os repositórios do próprio pacote Favoritos (mesmas listas, mesma lixeira), então o que se
 * favorita aqui aparece no painel de Favoritos e vice-versa.
 */

import type { Area } from "@comum/armazenamento/area";
import { escoposDoContexto, rotuloDaLista } from "@favoritos/modelo/escopo";
import type { Carimbo, ContextoAba } from "@favoritos/modelo/tipos";
import { RepositorioFavoritos } from "@favoritos/repositorio";
import type { ContextoHistorico } from "../modelo/tipos";
import type { FavoritosDoApp } from "./app";

/** Lateral: remonta quando muda o SEI/login (chave) ou a unidade, porque o adaptador é amarrado à lista da unidade. */
export function precisaRemontar(montado: { chave: string; unidadeId: string } | null, chave: string, unidadeId: string): boolean {
  return !montado || montado.chave !== chave || montado.unidadeId !== unidadeId;
}

export function favoritosDoApp(area: Area, ctx: ContextoHistorico, carimbo: () => Carimbo): FavoritosDoApp | null {
  if (!ctx.favoritosAtivo) return null;
  const ctxFav: ContextoAba = {
    host: ctx.host,
    login: ctx.login,
    nome: ctx.nome,
    unidade: ctx.unidade,
    versao: ctx.versao,
    temaEscuro: ctx.temaEscuro,
  };
  const esc = escoposDoContexto(ctxFav);
  const unidade = esc.unidade ? new RepositorioFavoritos(area, esc.unidade, carimbo) : null;
  const pessoal = new RepositorioFavoritos(area, esc.pessoal, carimbo);
  const repos = unidade ? [unidade, pessoal] : [pessoal];
  return {
    async ids() {
      const listas = await Promise.all(repos.map((r) => r.ativos()));
      return new Set(listas.flat().map((f) => f.id));
    },
    async favoritar(v) {
      const repo = unidade ?? pessoal;
      await repo.registrar();
      await repo.adicionar({
        id: v.id,
        protocolo: v.protocolo,
        tipo: v.tipo,
        especificacao: v.especificacao,
        sigiloso: v.nivel === "sigiloso",
      });
      return { lista: rotuloDaLista(repo.escopo), desfazer: async () => void (await repo.remover([v.id])) };
    },
    async tirar(id) {
      // Em uma só lista ou nas duas: a estrela apaga com um clique.
      const onde: RepositorioFavoritos[] = [];
      for (const repo of repos) if (await repo.contem(id)) onde.push(repo);
      if (!onde.length) return null;
      for (const repo of onde) await repo.remover([id]);
      return {
        desfazer: async () => {
          for (const repo of onde) await repo.restaurar([id]);
        },
      };
    },
    aoMudar(cb) {
      const parar = repos.map((r) => r.aoMudar(cb));
      return () => {
        for (const p of parar) p();
      };
    },
  };
}
