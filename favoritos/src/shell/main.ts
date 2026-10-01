/** Entrada de html/painel.html (o painel lateral da extensão). */

import { areaChrome } from "@comum/armazenamento/area";
import { type AbaPainel, montarShell } from "./painel";

const manifesto = chrome.runtime.getManifest();
const temAgente = (manifesto.content_scripts ?? []).some((c) => c.js?.includes("js/init_agente.js"));
const doEndereco = new URLSearchParams(location.hash.slice(1)).get("aba");

void montarShell(document.getElementById("painel")!, {
  // Sem `storage.session` (navegador antigo), a aba pedida só vale pelo endereço.
  sessao: areaChrome(chrome.storage.session ?? chrome.storage.local, chrome.storage.session ? "session" : "local"),
  temAgente,
  local: areaChrome(chrome.storage.local, "local"),
  url: (c) => chrome.runtime.getURL(c),
  abaDoEndereco: doEndereco === "agente" || doEndereco === "favoritos" ? (doEndereco as AbaPainel) : null,
});
