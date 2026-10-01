/**
 * Entrada de html/favoritos.html. Liga o app ao navegador: <dialog>, download,
 * área de transferência, seletor de arquivo e a porta com a aba do SEI.
 */

import { areaChrome } from "@comum/armazenamento/area";
import { idDispositivo } from "@comum/armazenamento/dispositivo";
import { hojeISO } from "@comum/datas/dias";
import { h, icone } from "@comum/ui/dom";
import { escoposDoContexto } from "../modelo/escopo";
import type { ContextoAba } from "../modelo/tipos";
import { RepositorioFavoritos } from "../repositorio";
import { observarAltura } from "./altura";
import { type AbrirModal, AppFavoritos } from "./app";
import { esperarConexaoDaAba } from "./ponte";

// O ouvinte da porta é registrado já, antes do `load` do iframe, que é quando o content script conecta.
const conexao = esperarConexaoDaAba();

void iniciar().catch((e) => {
  document
    .getElementById("app")
    ?.replaceChildren(h("p", { class: "fav-erro" }, `Não foi possível abrir os favoritos: ${e instanceof Error ? e.message : String(e)}`));
});

async function iniciar(): Promise<void> {
  const rpc = await conexao;
  const ctx = await rpc.chamar<ContextoAba>("contexto");
  document.documentElement.dataset.tema = ctx.temaEscuro ? "escuro" : "claro";
  const area = areaChrome(chrome.storage.local, "local");
  const sync = areaChrome(chrome.storage.sync, "sync");
  const dispositivo = await idDispositivo(area);
  const carimbo = () => ({ agora: Date.now(), dispositivo });
  const esc = escoposDoContexto(ctx);
  const repos = {
    unidade: esc.unidade ? new RepositorioFavoritos(area, esc.unidade, carimbo) : null,
    pessoal: new RepositorioFavoritos(area, esc.pessoal, carimbo),
  };
  const altura = observarAltura(rpc);

  const abrirModal: AbrirModal = ({ titulo, conteudo, aoFechar }) => {
    const dlg = h("dialog", { class: "spro-dialogo", "aria-label": titulo });
    const fechar = () => {
      if (dlg.open) dlg.close();
    };
    dlg.append(
      h(
        "header",
        {},
        h("h2", {}, titulo),
        h("button", { type: "button", class: "spro-botao-icone", "aria-label": "Fechar", onclick: fechar }, icone("fechar", 16)),
      ),
      h("div", { class: "spro-dialogo-corpo" }, conteudo),
    );
    dlg.addEventListener("close", () => {
      dlg.remove();
      altura.minimo(0);
      aoFechar?.();
    });
    document.body.append(dlg);
    altura.minimo(640);
    dlg.showModal();
    return { fechar };
  };

  const confirmar = (texto: string) =>
    new Promise<boolean>((ok) => {
      let resposta = false;
      let modal: { fechar(): void } | null = null;
      const corpo = h(
        "div",
        {},
        h("p", {}, texto),
        h(
          "div",
          { class: "spro-dialogo-rodape" },
          h("button", { type: "button", class: "spro-botao", onclick: () => modal?.fechar() }, "Cancelar"),
          h(
            "button",
            {
              type: "button",
              class: "spro-botao perigo",
              onclick: () => {
                resposta = true;
                modal?.fechar();
              },
            },
            "Confirmar",
          ),
        ),
      );
      modal = abrirModal({ titulo: "Confirmar", conteudo: corpo, aoFechar: () => ok(resposta) });
    });

  const baixar = (nome: string, conteudo: string, tipo: string) => {
    const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
    const a = h("a", { href: url, download: nome });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const escolherArquivo = () =>
    new Promise<string | null>((ok) => {
      const i = h("input", { type: "file", accept: ".json,application/json" });
      i.addEventListener("change", async () => ok(i.files?.[0] ? await i.files[0].text() : null));
      i.addEventListener("cancel", () => ok(null));
      i.click();
    });

  const app = new AppFavoritos(document.getElementById("app")!, {
    rpc,
    ctx,
    area,
    sync,
    repos,
    carimbo,
    abrirModal,
    confirmar,
    baixar,
    copiar: (texto) => navigator.clipboard.writeText(texto),
    escolherArquivo,
    hoje: () => hojeISO(),
    aoRedesenhar: () => altura.medir(),
  });
  await app.iniciar();
}
