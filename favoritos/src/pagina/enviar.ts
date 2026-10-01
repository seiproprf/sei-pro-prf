/**
 * "Manter processo em Favoritos" no Enviar Processo, como no legado
 * (`getFavoritesEnviarProcesso`): a caixa já vem marcada se o processo é
 * favorito, e com ela marcada aparecem pasta e prazo rápidos.
 *
 * Grava NA HORA, como o legado, e não no envio do formulário: o envio navega
 * para outra página, e uma gravação disparada nesse instante pode não chegar.
 *
 * Os processos vêm do próprio formulário (`selProcedimentos`, valor = id,
 * texto = "protocolo - especificação"); vale também para o envio de vários
 * processos marcados na caixa.
 */

import type { DataISO } from "@comum/datas/dias";
import { h } from "@comum/ui/dom";
import { prazoDosValores } from "../app/prazoForm";
import type { DadosProcesso, Favorito, MudancasFavorito, Pasta } from "../modelo/tipos";

export interface DepsEnvio {
  ativo(id: string): boolean;
  adicionar(d: DadosProcesso): Promise<unknown>;
  remover(ids: string[]): Promise<unknown>;
  editar(id: string, m: MudancasFavorito): Promise<unknown>;
  obter(id: string): Promise<Favorito | undefined>;
  pastas(): Promise<Pasta[]>;
  hoje(): DataISO;
}

const FORM = '#frmAtividadeListar[action*="acao=procedimento_enviar"]';

export function lerProcessosDoEnvio(doc: Document): DadosProcesso[] {
  return [...doc.querySelectorAll<HTMLOptionElement>(`${FORM} #selProcedimentos option`)]
    .map((o) => {
      const texto = (o.textContent ?? "").trim();
      const i = texto.indexOf(" - ");
      const protocolo = (i >= 0 ? texto.slice(0, i) : texto).trim();
      const especificacao = i >= 0 ? texto.slice(i + 3).trim() : "";
      return { id: o.value.trim(), protocolo, especificacao: especificacao || undefined };
    })
    .filter((p) => /^\d+$/.test(p.id) && p.protocolo);
}

export async function instalarManterNoEnvio(doc: Document, d: DepsEnvio): Promise<HTMLElement | null> {
  const form = doc.querySelector(FORM);
  if (!form || form.querySelector(".spro-fav-envio")) return null;
  const procs = lerProcessosDoEnvio(doc);
  if (!procs.length) return null;
  const varios = procs.length > 1;

  const caixa = h("input", {
    type: "checkbox",
    id: "chkSproManterFavoritos",
    style: "appearance:auto;opacity:1;position:static;width:auto;height:auto;margin:0",
  });
  caixa.checked = procs.every((p) => d.ativo(p.id));
  const pasta = h("select", { class: "infraSelect", style: "width:auto;min-width:12em" });
  const data = h("input", { type: "date", class: "infraText", style: "width:auto" });
  const opcoes = h(
    "div",
    { class: "spro-fav-envio-opcoes", style: "display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:6px 0 0 22px" },
    h("label", { style: "display:inline-flex;gap:6px;align-items:center" }, "Pasta:", pasta),
    h("label", { style: "display:inline-flex;gap:6px;align-items:center" }, "Prazo até:", data),
  );
  opcoes.hidden = !caixa.checked;

  const preencher = async () => {
    const [pastas, primeiro] = await Promise.all([d.pastas(), d.obter(procs[0]!.id)]);
    pasta.replaceChildren(h("option", { value: "" }, "(sem pasta)"), ...pastas.map((p) => h("option", { value: p.id }, p.nome)));
    if (!varios && primeiro && primeiro.removidoEm === undefined) {
      // Pela opção, e não por `select.value`: vale também no DOM dos testes.
      for (const o of pasta.options) o.selected = o.value === (primeiro.pasta ?? "");
      data.value = primeiro.prazo?.vencimento?.em === "data" ? primeiro.prazo.vencimento.data : "";
    }
  };
  await preencher();

  caixa.addEventListener("change", () => {
    opcoes.hidden = !caixa.checked;
    void (async () => {
      if (caixa.checked) {
        for (const p of procs) if (!d.ativo(p.id)) await d.adicionar(p);
        await preencher();
      } else {
        await d.remover(procs.map((p) => p.id));
      }
    })().catch((e) => console.warn("[SEI Pro] favoritos: não foi possível gravar no envio", e));
  });
  const emTodos = (m: MudancasFavorito) =>
    void Promise.all(procs.map((p) => d.editar(p.id, m))).catch((e) =>
      console.warn("[SEI Pro] favoritos: não foi possível gravar no envio", e),
    );
  pasta.addEventListener("change", () => emTodos({ pasta: pasta.value || undefined }));
  data.addEventListener("change", () => {
    const prazo = data.value
      ? prazoDosValores({
          modo: "data",
          referencia: d.hoje(),
          vencimento: data.value as DataISO,
          n: 0,
          contagem: "corridos",
          sentido: "depois",
        })
      : undefined;
    emTodos({ prazo });
  });

  const rotulo = varios ? `Manter os ${procs.length} processos em Favoritos` : "Manter processo em Favoritos";
  const bloco = h(
    "div",
    { class: "infraAreaDados spro-fav-envio", style: "position:relative;clear:both;height:auto;margin:10px 0;padding:0" },
    h("label", { for: "chkSproManterFavoritos", style: "display:inline-flex;gap:6px;align-items:center;cursor:pointer" }, caixa, rotulo),
    opcoes,
  );
  form.append(bloco);
  return bloco;
}
