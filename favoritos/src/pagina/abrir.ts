/**
 * Abrir um favorito SEM montar link. Montar a URL do SEI à mão derruba a
 * sessão (SEI 5), porque o `infra_hash` assina os parâmetros. Há dois caminhos
 * seguros: o link que a própria página já tem na linha da caixa, ou a pesquisa
 * rápida do cabeçalho, o mesmo que o usuário faria digitando o número.
 */

import { ErroRpc } from "@comum/ponte/rpc";

export type Abertura = { tipo: "linha"; link: HTMLAnchorElement } | { tipo: "pesquisa"; form: HTMLFormElement; campo: HTMLInputElement };

export function localizarAbertura(doc: Document, id: string): Abertura | null {
  const limpo = id.replace(/\D/g, "");
  const link = limpo ? doc.querySelector<HTMLAnchorElement>(`tr[id="P${limpo}"] a[href*="procedimento_trabalhar"]`) : null;
  if (link) return { tipo: "linha", link };
  const form = doc.querySelector<HTMLFormElement>("#frmProtocoloPesquisaRapida");
  const campo = doc.querySelector<HTMLInputElement>("#txtPesquisaRapida");
  return form && campo ? { tipo: "pesquisa", form, campo } : null;
}

export function abrirProcesso(doc: Document, id: string, protocolo: string, novaAba: boolean): "linha" | "pesquisa" {
  const a = localizarAbertura(doc, id);
  if (!a) throw new ErroRpc("SEM_PESQUISA", "Esta tela do SEI não tem a pesquisa rápida para abrir o processo.");
  if (a.tipo === "linha") {
    if (novaAba) doc.defaultView?.open(a.link.href, "_blank", "noopener");
    else a.link.click();
    return "linha";
  }
  const alvoAntes = a.form.getAttribute("target");
  a.campo.value = protocolo;
  if (novaAba) a.form.setAttribute("target", "_blank");
  try {
    if (typeof a.form.requestSubmit === "function") a.form.requestSubmit();
    else a.form.submit();
  } finally {
    if (alvoAntes === null) a.form.removeAttribute("target");
    else a.form.setAttribute("target", alvoAntes);
  }
  return "pesquisa";
}
