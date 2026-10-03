/**
 * O agente lê os favoritos do usuário (spec 7.7). SOMENTE LEITURA.
 *
 * O painel do agente é página da extensão, como o app dos favoritos: lê o
 * `chrome.storage.local` direto, pelo repositório dos favoritos, sem ponte. Da
 * aba vem só o escopo (SEI, usuário e unidade da tela ligada ao painel).
 * Processo sigiloso nunca sai daqui: nem o número (nem o de sigilo ainda não confirmado).
 */

import { type Area, areaChrome } from "@comum/armazenamento/area";
import { hojeISO } from "@comum/datas/dias";
import { escoposDoContexto } from "@favoritos/modelo/escopo";
import { lembreteVencido } from "@favoritos/modelo/lembrete";
import { compararInstantaneos, resumoNovidade } from "@favoritos/modelo/novidades";
import { filtrar } from "@favoritos/modelo/operacoes";
import { calcularPrazo } from "@favoritos/modelo/prazo";
import type { ContextoAba, Favorito } from "@favoritos/modelo/tipos";
import { RepositorioFavoritos } from "@favoritos/repositorio";
import { s } from "../motor/esquema";
import { definirTool } from "../motor/tools";

let fonteArea: () => Area = () => areaChrome(chrome.storage.local, "local");

/** Para os testes: a área em memória no lugar do chrome.storage. */
export function definirAreaFavoritos(f: () => Area): void {
  fonteArea = f;
}

const MAX_ITENS = 300;

export const TOOL_FAVORITOS = definirTool({
  nome: "favoritos_listar",
  descricao:
    "Lista os FAVORITOS do usuário no SEI Pro (a lista da unidade da tela e a lista Pessoal): número, título, tipo, pasta, etiquetas, nota pessoal, prazo, lembrete, o que mudou desde a última vez que ele viu e documentos favoritos. Use para 'o que mudou nos meus favoritos', 'quais favoritos têm lembrete', 'meus processos acompanhados'. Não abre processo nenhum no SEI; o que mudou vem do que o SEI Pro já leu. Processos sigilosos ficam de fora.",
  parametros: s.objeto({
    "lista?": s.texto({ enum: ["unidade", "pessoal", "todas"], descricao: "Padrão: todas." }),
    "filtro?": s.texto({ enum: ["todos", "novidades", "lembretes", "prazos"], descricao: "novidades = algo mudou; lembretes = para hoje ou atrasados; prazos = com prazo. Padrão: todos." }),
    "busca?": s.texto({ descricao: "Parte do número, título, tipo, nota ou etiqueta (sem acento/caixa)." }),
  }),
  efeito: "leitura",
  rotulo: () => "Ler os favoritos",
  executar: async (a, ctx) => {
    const e = await ctx.sei<{ host: string; login: string; unidade: { id: string; sigla: string } | null }>("favoritos.escopo");
    const contexto = { host: e.host, login: e.login, nome: "", unidade: e.unidade ? { ...e.unidade, nome: "" } : null, versao: "", temaEscuro: false } satisfies ContextoAba;
    const esc = escoposDoContexto(contexto);
    const area = fonteArea();
    const lista = String(a.lista ?? "todas");
    const filtro = String(a.filtro ?? "todos");
    const hoje = hojeISO();
    const fontes: Array<{ rotulo: string; repo: RepositorioFavoritos }> = [];
    if (esc.unidade && lista !== "pessoal") fontes.push({ rotulo: e.unidade?.sigla || "Unidade", repo: new RepositorioFavoritos(area, esc.unidade, () => ({ agora: Date.now(), dispositivo: "agente" })) });
    if (lista !== "unidade") fontes.push({ rotulo: "Pessoal", repo: new RepositorioFavoritos(area, esc.pessoal, () => ({ agora: Date.now(), dispositivo: "agente" })) });
    const itens: Array<Record<string, unknown>> = [];
    let sigilosos = 0;
    for (const { rotulo, repo } of fontes) {
      const { todos, pastas, etiquetas } = await repo.instantaneo();
      const [atuais, vistos] = await Promise.all([repo.atuais(), repo.vistos()]);
      const porEtiqueta = new Map(etiquetas.map((x) => [x.id, x]));
      const porPasta = new Map(pastas.map((x) => [x.id, x]));
      const novidades = (f: Favorito) => compararInstantaneos(vistos.get(f.id) ?? f.visto, atuais.get(f.id));
      const ativos = todos.filter((f) => f.removidoEm === undefined);
      // Sigilo a confirmar (veio da Pesquisa) conta como sigiloso até a caixa ou a árvore dizerem o contrário.
      const fechado = (f: Favorito) => !!f.sigiloso || !!f.sigiloAConfirmar;
      sigilosos += ativos.filter(fechado).length;
      const visiveis = filtrar(
        ativos.filter((f) => !fechado(f)),
        {
          busca: a.busca ? String(a.busca) : undefined,
          situacoes: filtro === "novidades" ? ["novidade"] : filtro === "lembretes" ? ["lembrete"] : undefined,
        },
        { etiquetas: porEtiqueta, resumo: (f) => (f.prazo ? calcularPrazo(f.prazo, hoje) : undefined), novidades, hoje, atual: (f) => atuais.get(f.id) },
      ).filter((f) => filtro !== "prazos" || !!f.prazo);
      for (const f of visiveis) {
        const prazo = f.prazo ? calcularPrazo(f.prazo, hoje) : undefined;
        const novidade = resumoNovidade(novidades(f));
        itens.push({
          lista: rotulo,
          protocolo: f.protocolo,
          ...(f.titulo ? { titulo: f.titulo } : {}),
          ...(f.tipo ? { tipo: f.tipo } : {}),
          ...(f.especificacao ? { especificacao: f.especificacao } : {}),
          ...(f.pasta && porPasta.get(f.pasta) ? { pasta: porPasta.get(f.pasta)!.nome } : {}),
          ...(f.etiquetas.length ? { etiquetas: f.etiquetas.map((id) => porEtiqueta.get(id)?.nome).filter(Boolean) } : {}),
          ...(f.nota ? { nota: f.nota } : {}),
          ...(f.fixado ? { fixado: true } : {}),
          ...(prazo ? { prazo: prazo.texto } : {}),
          ...(f.lembrete ? { lembrete: { ...f.lembrete, vencido: lembreteVencido(f, hoje) } } : {}),
          ...(novidade ? { novidade } : {}),
          ...(f.documentos?.length ? { documentosFavoritos: f.documentos.map((d) => ({ numero: d.numero, titulo: d.titulo })) } : {}),
        });
      }
    }
    // Os contadores ANTES da lista: o motor corta o resultado em ~12 mil caracteres, e no fim eles sumiam.
    return {
      total: itens.length,
      sigilososOmitidos: sigilosos,
      ...(itens.length > MAX_ITENS ? { cortados: itens.length - MAX_ITENS } : {}),
      itens: itens.slice(0, MAX_ITENS),
    };
  },
});
