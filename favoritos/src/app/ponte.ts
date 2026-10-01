/**
 * O app (iframe abaixo da lista) aceita a porta do content script da PRÓPRIA
 * aba, do frame de topo. O `onConnect` chega a todas as páginas da extensão
 * (os iframes do favoritos em outras abas e o painel lateral também), e cada
 * uma recusa o que não é seu. Uma porta `chrome.runtime` não pode ser forjada
 * pela página do SEI, ao contrário de um `postMessage` com token na URL do iframe.
 *
 * Se `chrome.tabs.getCurrent` não responder dentro do iframe (prova P2), vale
 * a origem do pai (`document.referrer`), aceitando a primeira porta dessa origem.
 */

import { criarRpc, type Rpc } from "@comum/ponte/rpc";
import { CANAL_FAVORITOS } from "../modelo/constantes";

export function esperarConexaoDaAba(): Promise<Rpc> {
  const minhaAba = (async () => {
    try {
      return (await chrome.tabs?.getCurrent?.())?.id;
    } catch {
      return undefined;
    }
  })();
  const origemPai = (() => {
    try {
      return new URL(document.referrer).origin;
    } catch {
      return "";
    }
  })();
  return new Promise((ok) => {
    let aceita = false;
    chrome.runtime.onConnect.addListener((porta) => {
      if (porta.name !== CANAL_FAVORITOS || aceita) return;
      void minhaAba.then((aba) => {
        const s = porta.sender;
        const daAba = aba !== undefined ? s?.tab?.id === aba : !!origemPai && !!s?.url && new URL(s.url).origin === origemPai;
        if (aceita || !daAba || s?.frameId !== 0) {
          porta.disconnect();
          return;
        }
        aceita = true;
        console.info("[SEI Pro] favoritos conectado", aba !== undefined ? "pela aba" : "pela origem");
        ok(criarRpc(porta));
      });
    });
  });
}
