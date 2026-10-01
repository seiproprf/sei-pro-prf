/**
 * O que vai para o Texto Padrão (spec 6.4 e 9.2): só a lista DA UNIDADE, sem
 * sigilosos, num texto por usuário. A lista Pessoal nunca vai: ela é do
 * usuário e não da unidade, e o texto é visível para a unidade inteira.
 *
 * O conteúdo só é aceito se o envelope for do mesmo SEI, do mesmo login e da
 * mesma unidade. Qualquer outra coisa (texto editado por um colega, corrompido,
 * de outra pessoa) é "inválido": o motor regrava a partir do local e nada local
 * é apagado.
 */

import { codificar, decodificar, deParagrafos, paraParagrafos } from "@comum/sincronia/codec";
import { hashCurto } from "@comum/texto";
import { type Envelope, lerEnvelope } from "../arquivo";
import type { Carimbo, Escopo, Favorito } from "../modelo/tipos";
import type { RepositorioFavoritos } from "../repositorio";

/** Teto do conteúdo: o CKEditor 5 baixa o conteúdo de todos os textos da unidade (P1). */
export const TETO_TEXTO = 100 * 1024;
export const AVISO_TEXTO = 80 * 1024;
export const PREFIXO_TEXTO = "[_SEIPRO_";

/** `[_SEIPRO_FAV_<login>]`, no máximo 50 caracteres (o limite do campo). */
export function nomeDoTexto(login: string): string {
  const l = login.trim().toLowerCase();
  const nome = `${PREFIXO_TEXTO}FAV_${l}]`;
  return nome.length <= 50 ? nome : `${PREFIXO_TEXTO}FAV_${l.slice(0, 27)}~${hashCurto(l).slice(0, 8)}]`;
}

export const DESCRICAO_TEXTO = "Dados internos do SEI Pro (favoritos). Não use em documentos nem edite.";

/** O mínimo para levar uma remoção ou um sigilo: sem número, título, nota, prazo nem documentos. */
function resumir(f: Favorito, extra: Partial<Favorito>): Favorito {
  return {
    id: f.id,
    protocolo: "",
    etiquetas: [],
    ordem: "a0",
    criadoEm: f.criadoEm,
    atualizadoEm: f.atualizadoEm,
    dispositivo: f.dispositivo,
    resumido: true,
    ...extra,
  };
}

/**
 * `idsRemotos`: os favoritos que o texto JÁ tem. Um sigiloso só vai (como aviso, sem número) se o texto
 * tiver uma cópia dele de antes do sigilo: é o que faz os outros computadores marcarem o sigilo.
 */
export async function envelopeDaUnidade(
  repo: RepositorioFavoritos,
  escopo: Escopo,
  c: Carimbo,
  idsRemotos: ReadonlySet<string> = new Set(),
): Promise<Envelope> {
  const { todos, pastas, etiquetas, vistos } = await repo.instantaneoCompleto();
  const favoritos: Favorito[] = [];
  for (const f of todos) {
    if (f.sigiloAConfirmar && !f.removidoEm) continue;
    if (f.sigiloso) {
      if (idsRemotos.has(f.id))
        favoritos.push(resumir(f, { sigiloso: true, ...(f.removidoEm !== undefined ? { removidoEm: f.removidoEm } : {}) }));
      continue;
    }
    // Lápide: o Texto Padrão é visível para a unidade, e o item pode ter sido removido (ou levado à Pessoal) justamente por isso.
    favoritos.push(
      f.removidoEm !== undefined || f.resumido ? resumir(f, f.removidoEm !== undefined ? { removidoEm: f.removidoEm } : {}) : f,
    );
  }
  return {
    formato: "seipro-favoritos",
    versao: 1,
    // O visto só acompanha favorito ativo, que vai inteiro (nunca de sigiloso, a confirmar ou removido).
    escopos: [
      {
        escopo,
        favoritos,
        pastas,
        etiquetas,
        vistos: vistos.filter((v) => favoritos.some((f) => f.id === v.id && !f.resumido && !f.removidoEm)),
      },
    ],
    gravadoEm: c.agora,
    dispositivo: c.dispositivo,
    revisao: 0,
  };
}

export async function conteudoDoTexto(env: Envelope, nomeUsuario: string): Promise<string> {
  const legivel = `Dados internos do SEI Pro — favoritos de ${nomeUsuario}. Não use em documentos nem edite: o SEI Pro regrava este texto sozinho.`;
  return paraParagrafos(legivel, await codificar(env));
}

const mesmoEscopo = (a: Escopo, b: Escopo) =>
  a.host === b.host &&
  a.login.toLowerCase() === b.login.toLowerCase() &&
  a.lista === b.lista &&
  (a.unidade?.id ?? "") === (b.unidade?.id ?? "");

export async function lerConteudoDoTexto(html: string, escopo: Escopo): Promise<{ envelope: Envelope } | { invalido: string }> {
  const b64 = deParagrafos(html);
  if (!b64) return { invalido: "o texto não tem os dados do SEI Pro (foi editado ou está vazio)" };
  let bruto: unknown;
  try {
    bruto = await decodificar(b64);
  } catch {
    return { invalido: "os dados do texto estão corrompidos" };
  }
  const lido = lerEnvelope(bruto);
  if (!lido) return { invalido: "o texto não está no formato dos favoritos" };
  const e = lido.envelope.escopos;
  if (e.length !== 1 || !mesmoEscopo(e[0]!.escopo, escopo)) return { invalido: "o texto é de outro usuário ou de outra unidade" };
  return { envelope: lido.envelope };
}
