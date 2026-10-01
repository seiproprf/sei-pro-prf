/**
 * Motor da sincronia de UMA lista com UM destino (spec 9.1): puxar → mesclar →
 * (se mudou) empurrar. A mesclagem é a do repositório (vence a versão mais
 * recente de cada entidade, com lápides), então a rodada pode se repetir sem
 * medo, em qualquer aba e em qualquer ordem.
 *
 * - Puxa no máximo a cada 5 min, salvo pendência local ou pedido do usuário.
 * - Mudança local marca "pendente" NA HORA (persistido: se a página fechar, a
 *   próxima carga envia) e envia 15 s depois da última.
 * - Remoto inválido (texto editado por um colega, corrompido, de outro escopo)
 *   nunca apaga nada: é regravado a partir do local.
 * - Sem permissão de Texto Padrão: "indisponível", e não insiste por um dia.
 * - Uma trava por lista (Web Locks, quando a página tem) evita duas abas juntas;
 *   e o conteúdo igual ao remoto não é regravado.
 */

import type { Area } from "@comum/armazenamento/area";
import type { Carimbo, Escopo } from "../modelo/tipos";
import type { RepositorioFavoritos } from "../repositorio";
import { assinaturaEnvelope } from "./assinatura";
import { AVISO_TEXTO, conteudoDoTexto, envelopeDaUnidade, lerConteudoDoTexto, TETO_TEXTO } from "./textoPadrao";

export interface StatusSync {
  estado: "ok" | "erro" | "indisponivel" | "nunca";
  /** Última tentativa. */
  quando: number;
  ultimoOk?: number;
  ultimoPuxar?: number;
  mensagem?: string;
  /** Bytes do último conteúdo gravado ou lido. */
  tamanho?: number;
  /** Há mudança local ainda não enviada. */
  pendente: boolean;
  indisponivelAte?: number;
}

export interface DestinoSync {
  ler(): Promise<string | null>;
  gravar(html: string): Promise<void>;
}

export interface DepsMotor {
  repo: RepositorioFavoritos;
  escopo: Escopo;
  destino: DestinoSync;
  area: Area;
  chaveStatus: string;
  carimbo: () => Carimbo;
  nomeUsuario: string;
  /** Roda `fn` com a trava; devolve null se outra aba já está com ela. */
  travar<T>(nome: string, fn: () => Promise<T>): Promise<T | null>;
  agora?: () => number;
  teto?: number;
  atrasoEnvio?: number;
}

const CINCO_MIN = 5 * 60_000;
const UM_DIA = 86_400_000;

export function textoDoErro(e: unknown): { estado: StatusSync["estado"]; mensagem: string } {
  const codigo = (e as { codigo?: string } | null)?.codigo;
  if (codigo === "SEI_SESSAO_EXPIRADA") return { estado: "erro", mensagem: "Sessão do SEI expirada. Entre de novo no SEI." };
  if (codigo === "SEI_ACAO_INDISPONIVEL")
    return { estado: "indisponivel", mensagem: "Indisponível nesta unidade: o SEI não oferece Textos Padrão para você aqui." };
  return { estado: "erro", mensagem: e instanceof Error ? e.message : String(e) };
}

export class MotorSincronia {
  private espera: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly d: DepsMotor) {}

  private agora(): number {
    return this.d.agora?.() ?? Date.now();
  }

  async status(): Promise<StatusSync> {
    const v = (await this.d.area.obter(this.d.chaveStatus))[this.d.chaveStatus] as StatusSync | undefined;
    return v ?? { estado: "nunca", quando: 0, pendente: false };
  }

  private async gravarStatus(m: Partial<StatusSync>): Promise<StatusSync> {
    const novo = { ...(await this.status()), ...m };
    await this.d.area.gravar({ [this.d.chaveStatus]: novo });
    return novo;
  }

  async marcarPendente(): Promise<void> {
    const s = await this.status();
    if (!s.pendente) await this.gravarStatus({ pendente: true });
  }

  /** Mudança local: pendente na hora, envio 15 s depois da última. */
  agendarEnvio(): Promise<void> {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => void this.sincronizar({ forcar: true }).catch(() => undefined), this.d.atrasoEnvio ?? 15_000);
    return this.marcarPendente();
  }

  parar(): void {
    clearTimeout(this.espera);
  }

  async sincronizar(o: { forcar?: boolean } = {}): Promise<StatusSync> {
    const agora = this.agora();
    const s = await this.status();
    if (!o.forcar) {
      if (s.estado === "indisponivel" && (s.indisponivelAte ?? 0) > agora) return s;
      if (!s.pendente && s.ultimoPuxar && agora - s.ultimoPuxar < CINCO_MIN) return s;
    }
    const nome = `seipro-favoritos-sync|${this.d.chaveStatus}`;
    const feito = await this.d.travar(nome, () => this.rodada(agora));
    return feito ?? (await this.status());
  }

  private async rodada(agora: number): Promise<StatusSync> {
    try {
      const remoto = await this.d.destino.ler();
      let assinaturaRemota = "";
      let invalido: string | null = null;
      if (remoto !== null) {
        const r = await lerConteudoDoTexto(remoto, this.d.escopo);
        if ("envelope" in r) {
          await this.d.repo.importar(r.envelope.escopos[0]!);
          assinaturaRemota = assinaturaEnvelope(r.envelope);
        } else {
          invalido = r.invalido;
        }
      }
      const env = await envelopeDaUnidade(this.d.repo, this.d.escopo, this.d.carimbo());
      if (remoto !== null && !invalido && assinaturaEnvelope(env) === assinaturaRemota) {
        return this.gravarStatus({
          estado: "ok",
          quando: agora,
          ultimoOk: agora,
          ultimoPuxar: agora,
          pendente: false,
          mensagem: undefined,
          tamanho: remoto.length,
        });
      }
      const html = await conteudoDoTexto(env, this.d.nomeUsuario);
      const teto = this.d.teto ?? TETO_TEXTO;
      if (html.length > teto) {
        return this.gravarStatus({
          estado: "erro",
          quando: agora,
          ultimoPuxar: agora,
          tamanho: html.length,
          mensagem: `A lista ficou grande demais para o Texto Padrão (${Math.ceil(html.length / 1024)} KB de ${Math.round(teto / 1024)} KB). Use a sincronização por arquivo.`,
        });
      }
      await this.d.destino.gravar(html);
      const aviso =
        html.length > (this.d.teto ? teto * 0.8 : AVISO_TEXTO)
          ? `A lista está perto do limite do Texto Padrão (${Math.ceil(html.length / 1024)} KB).`
          : undefined;
      return this.gravarStatus({
        estado: "ok",
        quando: agora,
        ultimoOk: agora,
        ultimoPuxar: agora,
        pendente: false,
        tamanho: html.length,
        mensagem: invalido ? `O texto no SEI estava inválido (${invalido}) e foi regravado a partir deste computador.` : aviso,
      });
    } catch (e) {
      const t = textoDoErro(e);
      return this.gravarStatus({
        estado: t.estado,
        mensagem: t.mensagem,
        quando: agora,
        indisponivelAte: t.estado === "indisponivel" ? agora + UM_DIA : undefined,
      });
    }
  }
}
