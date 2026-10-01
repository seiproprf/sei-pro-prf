/**
 * Sincronia por Texto Padrão, do lado da aba do SEI (o content script tem a
 * sessão). Liga e desliga sozinha conforme o consentimento DESTA unidade
 * (`estadoTextoPadrao`), que o usuário decide no app:
 * - ao carregar o Controle de Processos, puxa (no máximo a cada 5 min);
 * - qualquer mudança na lista da unidade, feita aqui, no app ou em outra aba,
 *   é enviada 15 s depois;
 * - o app pede "sincronizar agora" e "apagar meus dados do SEI" pela ponte.
 */

import type { Area } from "@comum/armazenamento/area";
import { CHAVE_PREFERENCIAS } from "../modelo/constantes";
import { chaveEscopo } from "../modelo/escopo";
import type { Carimbo, ContextoAba, Escopo, Preferencias } from "../modelo/tipos";
import { definirTextoPadrao, estadoTextoPadrao, lerPreferencias } from "../preferencias";
import type { RepositorioFavoritos } from "../repositorio";
import { MotorSincronia, type StatusSync } from "../sincronia/motor";
import { PREFIXO_TEXTO } from "../sincronia/textoPadrao";

export const chaveStatusTexto = (e: Escopo): string => `favoritos/sync/tp/${chaveEscopo(e)}`;

/** Esconde os textos de dados do SEI Pro no seletor "Texto Padrão" ao gerar documento. É cosmético: o dado continua no SEI. */
export function ocultarTextosInternos(doc: Document): number {
  let n = 0;
  for (const o of doc.querySelectorAll<HTMLOptionElement>('select#selTextoPadrao option, select[name="selTextoPadrao"] option')) {
    if ((o.textContent ?? "").trim().startsWith(PREFIXO_TEXTO)) {
      o.remove();
      n++;
    }
  }
  return n;
}

export interface ArmazemDestino {
  ler(): Promise<string | null>;
  gravar(html: string): Promise<void>;
  excluir(): Promise<boolean>;
}

export interface DepsControle {
  ctx: ContextoAba;
  area: Area;
  sync: Area;
  repo: RepositorioFavoritos;
  escopo: Escopo;
  armazem: () => ArmazemDestino;
  carimbo: () => Carimbo;
  travar<T>(nome: string, fn: () => Promise<T>): Promise<T | null>;
  atrasoEnvio?: number;
}

export class ControleSincronia {
  private motor: MotorSincronia | null = null;
  private pararMudancas: (() => void) | null = null;
  private pararPrefs: (() => void) | null = null;

  constructor(private readonly d: DepsControle) {}

  private estado(p: Preferencias): "nao-perguntado" | "ligado" | "desligado" {
    return estadoTextoPadrao(p, this.d.ctx.host, this.d.escopo.unidade?.id ?? "");
  }

  private criarMotor(): MotorSincronia {
    const armazem = this.d.armazem();
    return new MotorSincronia({
      repo: this.d.repo,
      escopo: this.d.escopo,
      destino: { ler: () => armazem.ler(), gravar: (h) => armazem.gravar(h) },
      area: this.d.area,
      chaveStatus: chaveStatusTexto(this.d.escopo),
      carimbo: this.d.carimbo,
      nomeUsuario: this.d.ctx.nome || this.d.ctx.login,
      travar: this.d.travar,
      atrasoEnvio: this.d.atrasoEnvio,
    });
  }

  private rodar(forcar: boolean): Promise<StatusSync> {
    this.motor ??= this.criarMotor();
    return this.motor.sincronizar({ forcar });
  }

  private ligar(puxar: boolean): void {
    if (this.pararMudancas) return;
    this.motor ??= this.criarMotor();
    // As escritas da própria mesclagem também chegam aqui: custam uma leitura a mais 15 s depois,
    // que acha tudo igual e não regrava. Ignorá-las por janela de tempo engoliria mudança do usuário.
    this.pararMudancas = this.d.repo.aoMudar(() => void this.motor?.agendarEnvio());
    if (puxar) void this.rodar(false).catch(() => undefined);
  }

  private desligar(): void {
    this.pararMudancas?.();
    this.pararMudancas = null;
    this.motor?.parar();
  }

  async iniciar(tela: string | null): Promise<void> {
    const ligado = this.estado(await lerPreferencias(this.d.sync)) === "ligado";
    if (ligado) {
      const pendente =
        (await this.motor?.status())?.pendente ??
        ((await this.d.area.obter(chaveStatusTexto(this.d.escopo)))[chaveStatusTexto(this.d.escopo)] as StatusSync | undefined)?.pendente;
      this.ligar(tela === "caixa" || pendente === true);
    }
    this.pararPrefs = this.d.sync.aoMudar((m) => {
      if (!(CHAVE_PREFERENCIAS in m)) return;
      void lerPreferencias(this.d.sync).then((p) => {
        const e = this.estado(p);
        if (e === "ligado" && !this.pararMudancas) {
          this.ligar(false);
          void this.rodar(true).catch(() => undefined);
        } else if (e !== "ligado") {
          this.desligar();
        }
      });
    });
  }

  /** "Sincronizar agora", pedido pelo app. */
  agora(): Promise<StatusSync> {
    return this.rodar(true);
  }

  /** "Apagar meus dados do SEI desta unidade": exclui o texto e desliga a sincronia. */
  async apagar(): Promise<boolean> {
    this.desligar();
    await definirTextoPadrao(this.d.sync, this.d.ctx.host, this.d.escopo.unidade?.id ?? "", "desligado");
    const excluiu = await this.d.armazem().excluir();
    await this.d.area.gravar({
      [chaveStatusTexto(this.d.escopo)]: { estado: "nunca", quando: Date.now(), pendente: false } satisfies StatusSync,
    });
    return excluiu;
  }

  parar(): void {
    this.desligar();
    this.pararPrefs?.();
  }
}
