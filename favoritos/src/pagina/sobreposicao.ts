/**
 * Diálogo do painel embutido no meio da tela visível (pedido do autor): o
 * iframe do app vive abaixo da lista de processos e cresce com o conteúdo; um
 * `<dialog>` dentro dele ficaria centralizado na altura do PAINEL, às vezes lá
 * embaixo, fora da vista. Enquanto há diálogo aberto, o iframe vira uma camada
 * fixa sobre a tela inteira (o app deixa o próprio fundo transparente e só o
 * diálogo e o véu aparecem), uma reserva da mesma altura segura o lugar dele
 * na página e a rolagem da página trava. Ao fechar, tudo volta como estava.
 */

export interface Sobreposicao {
  ligar(ativo: boolean): boolean;
  /** Altura pedida pelo app: durante a sobreposição, fica para depois. */
  altura(px: number): void;
}

const CAMADA =
  "position:fixed;inset:0;left:0;top:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;z-index:2147483646;background:transparent;";

export function criarSobreposicao(doc: Document, iframe: HTMLIFrameElement, reserva: HTMLElement): Sobreposicao {
  let salvo: { iframe: string; reserva: string; travados: Array<[HTMLElement, string]> } | null = null;
  let pendente: number | null = null;

  const aplicarAltura = (px: number) => {
    iframe.style.height = `${Math.max(80, Math.min(Math.round(px), 20000))}px`;
  };

  /** html, body e os ancestrais do iframe que rolam (o SEI 4+ rola dentro de divs). */
  const rolaveis = (): HTMLElement[] => {
    const lista: HTMLElement[] = [doc.documentElement];
    if (doc.body) lista.push(doc.body);
    const visao = doc.defaultView;
    for (let el = iframe.parentElement; el && el !== doc.body && el !== doc.documentElement; el = el.parentElement) {
      try {
        const oy = visao?.getComputedStyle?.(el).overflowY ?? "";
        if ((oy === "auto" || oy === "scroll") && el.scrollHeight > el.clientHeight) lista.push(el);
      } catch {
        /* sem estilo computado (testes) */
      }
    }
    return lista;
  };

  const visivel = () => {
    if (!iframe.isConnected || reserva.hidden || reserva.closest?.("[hidden]")) return false;
    return typeof iframe.getClientRects !== "function" || iframe.getClientRects().length > 0;
  };

  const api: Sobreposicao = {
    ligar(ativo) {
      // Painel recolhido (ou fora da página): o diálogo nem apareceria, e a página ficaria travada sem motivo visível.
      if (ativo && !salvo && !visivel()) return false;
      if (ativo && !salvo) {
        const alturaAtual = iframe.getBoundingClientRect?.().height || Number.parseFloat(iframe.style.height) || 0;
        const travados = rolaveis().map((el): [HTMLElement, string] => [el, el.style.overflow]);
        salvo = { iframe: iframe.getAttribute("style") ?? "", reserva: reserva.style.minHeight, travados };
        if (alturaAtual) reserva.style.minHeight = `${Math.round(alturaAtual)}px`;
        iframe.setAttribute("style", `${salvo.iframe};${CAMADA}`);
        for (const [el] of travados) el.style.overflow = "hidden";
      } else if (!ativo && salvo) {
        iframe.setAttribute("style", salvo.iframe);
        reserva.style.minHeight = salvo.reserva;
        for (const [el, antes] of salvo.travados) el.style.overflow = antes;
        salvo = null;
        if (pendente !== null) aplicarAltura(pendente);
        pendente = null;
      }
      return true;
    },
    altura(px) {
      if (!Number.isFinite(px)) return;
      if (salvo) pendente = px;
      else aplicarAltura(px);
    },
  };
  // O app recarregou (extensão atualizada, por exemplo) com um diálogo aberto: ninguém mais vai pedir para desligar.
  iframe.addEventListener("load", () => api.ligar(false));
  return api;
}
