/**
 * Seção do favoritos na página de opções (html/options.html), logo abaixo da
 * chave "Processos Favoritos". Só aparece onde o favoritos novo está no
 * manifest: a página de opções é a mesma em todos os pacotes.
 */

import { areaChrome } from "@comum/armazenamento/area";
import { h } from "@comum/ui/dom";
import { temPainelLateral } from "../modelo/exibicao";
import { montarOpcoesExibicao } from "./exibicao";

const CSS = `.spro-fav-opcoes{display:grid;gap:6px;padding:4px 0 8px 26px;font-size:12px}
.spro-fav-opcoes fieldset{border:0;margin:0;padding:0;display:grid;gap:3px}
.spro-fav-opcoes legend{padding:0;margin-bottom:2px;font-weight:600}
.spro-fav-opcoes label{display:flex;gap:6px;align-items:center;cursor:pointer}
.spro-fav-opcoes-nota{margin:2px 0 0;color:#777}`;

async function iniciar(): Promise<void> {
  const manifesto = chrome.runtime.getManifest();
  const temNovo = (manifesto.content_scripts ?? []).some((c) => c.js?.includes("js/init_favoritos.js"));
  const chave = document.getElementById("itemConfigGeral_gerenciarfavoritos") as HTMLInputElement | null;
  const linha = chave?.closest("tr");
  if (!temNovo || !chave || !linha) return;
  const el = await montarOpcoesExibicao({ sync: areaChrome(chrome.storage.sync, "sync"), lateralDisponivel: temPainelLateral(manifesto) });
  const td = h("td", { colspan: "2" }, el);
  const nova = h("tr", { class: "spro-fav-opcoes-linha" }, td);
  document.head.append(h("style", {}, CSS));
  linha.after(nova);
  // A seção só faz sentido com a funcionalidade ligada.
  const seguir = () => {
    nova.hidden = !chave.checked;
  };
  chave.addEventListener("change", seguir);
  // O options.js marca as chaves depois de ler as opções, sem disparar "change".
  setInterval(seguir, 1000);
  seguir();
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => void iniciar(), { once: true });
else void iniciar();
