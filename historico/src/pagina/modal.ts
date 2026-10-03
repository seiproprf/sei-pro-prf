/**
 * O modal do histórico sobre a tela do SEI (janela de topo). O item do menu do
 * legado dispara `spro-historico-abrir` (o evento atravessa os mundos); aqui o
 * content script põe por cima de tudo um iframe transparente com o app
 * (`html/historico.html#modo=modal`), trava a rolagem da página e liga uma
 * porta só dele. O app desenha o `<dialog>` com o véu dentro do iframe.
 *
 * Fechar tem uma porta só, idempotente: o pedido `fechar` do app (X, Esc ou
 * véu), o Esc na página, a porta caída (extensão recarregada) e o app que
 * nunca conversa. Tira o iframe, destrava a rolagem e devolve o foco ao item
 * do menu.
 *
 * Sem contexto na janela de topo (ou com o content script interrompido antes
 * de ligar o modal), o legado também cede ao evento, porque o marcador existe:
 * aí um aviso na própria página diz o que fazer, em vez de o clique sumir.
 */

import { criarRpc, type PortaRpc, type Rpc, type Tratador } from "@comum/ponte/rpc";
import { h } from "@comum/ui/dom";
import { EVENTO_ABRIR } from "../modelo/constantes";

export interface ModalMontado {
  iframe: HTMLIFrameElement;
  fechar(): void;
}

const CAMADA =
  "position:fixed;inset:0;left:0;top:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;border:0;padding:0;z-index:2147483646;background:transparent;display:block;";

export function montarModal(doc: Document, o: { urlApp: string; temaEscuro: boolean; aoFechar?: () => void }): ModalMontado {
  const iframe = h("iframe", {
    src: o.urlApp,
    title: "Histórico de processos visitados",
    allow: "clipboard-write",
    "data-spro-historico-modal": "1",
    // Sem o color-scheme do app, o Chrome pinta o fundo do iframe opaco.
    style: `${CAMADA}color-scheme:${o.temaEscuro ? "dark" : "light"};`,
  });
  const travados: Array<[HTMLElement, string]> = [doc.documentElement, doc.body]
    .filter((el): el is HTMLElement => !!el)
    .map((el) => [el, el.style.overflow]);
  for (const [el] of travados) el.style.overflow = "hidden";
  (doc.body ?? doc.documentElement).append(iframe);
  iframe.addEventListener("load", () => iframe.focus());
  let fechado = false;
  return {
    iframe,
    fechar() {
      if (fechado) return;
      fechado = true;
      iframe.remove();
      for (const [el, v] of travados) el.style.overflow = v;
      o.aoFechar?.();
    },
  };
}

export interface DepsControleModal {
  /** Endereço do app, lido a cada abertura (lança se a extensão foi recarregada). */
  urlApp(): string;
  temaEscuro: boolean;
  /** Porta nova para o app, a cada carga do iframe. */
  conectar(): PortaRpc;
  /** O que o app pode pedir à aba; `fechar` é o fechamento único do modal. */
  tratadores(fechar: () => void): Record<string, Tratador>;
  /** Sem nenhum pedido do app nesse prazo, o modal sai: um iframe transparente não pode prender a tela. */
  prazoContatoMs?: number;
  /** Relógio do prazo (as provas injetam um falso). Devolve o cancelamento. */
  agendar?: (fazer: () => void, ms: number) => () => void;
}

export interface ControleModal {
  readonly aberto: boolean;
  abrir(): void;
  fechar(): void;
  /** Para de ouvir o evento do menu (e fecha o que estiver aberto). */
  desligar(): void;
}

/** O caminho bom responde em milissegundos; no ruim, a tela fica presa durante todo o prazo. */
export const PRAZO_CONTATO_MS = 8_000;

const agendarComTimeout = (fazer: () => void, ms: number) => {
  const t = setTimeout(fazer, ms);
  return () => clearTimeout(t);
};

interface Aberto {
  modal: ModalMontado;
  rpc: Rpc | null;
  cancelarPrazo?: () => void;
}

/** O item do legado é um <a> sem href nem tabindex: sem tabindex="-1", o focus() não faz nada. */
function focavel(el: HTMLElement): boolean {
  if (el.hasAttribute("tabindex") || el.isContentEditable) return true;
  const tag = el.localName;
  if (tag === "a" || tag === "area") return el.hasAttribute("href");
  return ["button", "input", "select", "textarea"].includes(tag) && !el.hasAttribute("disabled");
}

function devolverFocoAoMenu(doc: Document): void {
  const item = doc.querySelector<HTMLElement>("#historicoProcessosPro");
  if (!item) return;
  if (!focavel(item)) item.setAttribute("tabindex", "-1");
  item.focus({ preventScroll: true });
}

export function criarControleModal(doc: Document, d: DepsControleModal): ControleModal {
  let atual: Aberto | null = null;
  const agendar = d.agendar ?? agendarComTimeout;

  // Captura: o Esc chega aqui antes de qualquer tratador da página que pare a propagação.
  const aoTeclar = (ev: Event) => {
    if ((ev as KeyboardEvent).key === "Escape") fechar();
  };

  function fechar(): void {
    const a = atual;
    if (!a) return;
    // Antes de tudo: o rpc.fechar() abaixo chama o aoFechar da porta, que volta aqui.
    atual = null;
    a.cancelarPrazo?.();
    doc.removeEventListener("keydown", aoTeclar, true);
    const rpc = a.rpc;
    a.rpc = null;
    rpc?.fechar();
    a.modal.fechar();
  }

  function abrir(): void {
    if (atual) {
      atual.modal.iframe.focus();
      return;
    }
    let urlApp: string;
    try {
      urlApp = d.urlApp();
    } catch (e) {
      console.warn("[SEI Pro] histórico: o modal não abriu (recarregue a página)", e);
      return;
    }
    const modal = montarModal(doc, { urlApp, temaEscuro: d.temaEscuro, aoFechar: () => devolverFocoAoMenu(doc) });
    const a: Aberto = { modal, rpc: null };
    atual = a;
    let contato = false;
    const armar = () => {
      a.cancelarPrazo?.();
      contato = false;
      a.cancelarPrazo = agendar(() => {
        if (atual === a && !contato) fechar();
      }, d.prazoContatoMs ?? PRAZO_CONTATO_MS);
    };
    const tratadores = Object.fromEntries(
      Object.entries(d.tratadores(fechar)).map(([op, t]): [string, Tratador] => [
        op,
        (args) => {
          contato = true;
          a.cancelarPrazo?.();
          return t(args);
        },
      ]),
    );
    // A cada carga do iframe, uma porta nova: o app só aceita a porta da própria aba (@comum/ponte/conexaoDaAba).
    modal.iframe.addEventListener("load", () => {
      if (atual !== a) return;
      const velha = a.rpc;
      a.rpc = null;
      velha?.fechar();
      let porta: PortaRpc;
      try {
        porta = d.conectar();
      } catch (e) {
        console.warn("[SEI Pro] histórico: sem conexão com o app (recarregue a página)", e);
        fechar();
        return;
      }
      const rpc = criarRpc(porta, tratadores);
      a.rpc = rpc;
      rpc.aoFechar(() => {
        if (a.rpc === rpc) fechar();
      });
      armar();
    });
    doc.addEventListener("keydown", aoTeclar, true);
    armar();
  }

  doc.addEventListener(EVENTO_ABRIR, abrir);
  return {
    get aberto() {
      return atual !== null;
    },
    abrir,
    fechar,
    desligar() {
      doc.removeEventListener(EVENTO_ABRIR, abrir);
      fechar();
    },
  };
}

export const TEXTO_SEM_MODAL = "Não foi possível abrir o histórico nesta tela. Recarregue a página (F5) e tente de novo.";

/** Estilo em linha (a página do SEI não tem a base visual) e cores fixas, legíveis nos dois temas, como o aviso do Favoritos. */
const CAIXA_AVISO =
  "position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483646;box-sizing:border-box;" +
  "max-width:min(560px,calc(100vw - 24px));padding:10px 16px;font:13px/1.35 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;" +
  "color:#f3f5f8;background:#1f2329;border:1px solid rgb(255 255 255 / 8%);border-radius:12px;" +
  "box-shadow:0 10px 24px -6px rgb(16 24 40 / 30%),0 24px 56px -12px rgb(16 24 40 / 35%);";

/** Aviso curto no rodapé da tela do SEI (um por vez). */
export function avisarNaPagina(doc: Document, texto: string, ms = 7000): HTMLElement {
  for (const velho of doc.querySelectorAll(".spro-historico-aviso")) velho.remove();
  const caixa = h("div", { class: "spro-historico-aviso", role: "status", style: CAIXA_AVISO }, texto);
  (doc.body ?? doc.documentElement).append(caixa);
  setTimeout(() => caixa.remove(), ms);
  return caixa;
}

/** Janela de topo sem modal: o clique no item do menu mostra o aviso. Devolve o desligamento. */
export function ligarAvisoSemModal(doc: Document, ms?: number): () => void {
  const avisar = () => void avisarNaPagina(doc, TEXTO_SEM_MODAL, ms);
  doc.addEventListener(EVENTO_ABRIR, avisar);
  return () => doc.removeEventListener(EVENTO_ABRIR, avisar);
}
