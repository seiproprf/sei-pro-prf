import { chamadas } from '../../sei-nucleo/src/sessao/literais';
import { decodificarEntidades } from '../../sei-nucleo/src/sessao/entidades';

export const TABELAS = '#tblProcessosRecebidos, #tblProcessosGerados, #tblProcessosDetalhado';
export const GRUPOS = '.tableHeader, .tagintable, .infraCaption';
export const BARRAS =
  '#navInfraBarraNavegacao, #divInfraBarraSistema, #frmProtocoloPesquisaRapida, #divInfraSidebarMenu, #divInfraBarraLocalizacao';
/** Lê literais do tooltip sem avaliar JavaScript nem inserir o HTML na página. */
export function camposDaLinha(linha: Element): string[] {
  const campos: string[] = [];
  for (const el of linha.querySelectorAll('td, a, span, img, input, label')) {
    campos.push(el.textContent ?? '');
    for (const nome of ['title', 'aria-label', 'alt', 'data-tagname']) campos.push(el.getAttribute(nome) ?? '');
    for (const args of chamadas(el.getAttribute('onmouseover') ?? '', 'infraTooltipMostrar')) {
      for (const arg of args)
        if (typeof arg === 'string') campos.push(decodificarEntidades(arg.replace(/<[^>]*>/g, ' ')));
    }
  }
  return campos;
}
export function buscarCampo(doc: Document): HTMLInputElement | null {
  let janela: Window | null = doc.defaultView;
  for (let i = 0; i < 8; i++) {
    try {
      const atual = janela?.document ?? doc;
      const input = atual.querySelector<HTMLInputElement>('#txtPesquisaRapida');
      if (input) return input;
      if (!janela || janela.parent === janela) break;
      janela = janela.parent;
    } catch {
      return null;
    }
  }
  return null;
}
export type Contexto = 'lista' | 'arvore' | 'documento';
/** Nunca instala no editor. Frames filhos do visualizador usam o campo do pai. */
export function contextoDaPagina(doc: Document): Contexto | null {
  if (doc.querySelector('#frmEditor, [contenteditable="true"], .cke, .ck-editor')) return null;
  const acao =
    new URL(doc.URL || doc.defaultView?.location.href || 'https://localhost/').searchParams.get('acao') ?? '';
  if (/editar|editor/.test(acao)) return null;
  if (acao === 'procedimento_controlar' || doc.querySelector('#frmProcedimentoControlar')) return 'lista';
  if (acao === 'procedimento_arvore' || doc.querySelector('#divArvore')) return 'arvore';
  if (
    /^(procedimento_trabalhar|procedimento_visualizar|documento_visualizar|documento_consultar|documento_mostrar|documento_download|arvore_visualizar)$/.test(
      acao,
    )
  )
    return 'documento';
  try {
    let janela: Window | null = doc.defaultView;
    for (let i = 0; janela && i < 8; i++) {
      const frame = janela.frameElement;
      if (!frame) break;
      if (frame.matches('#ifrVisualizacao, #ifrConteudoVisualizacao, #ifrDocumento')) return 'documento';
      janela = janela.parent;
    }
  } catch {
    /* Frame externo: mantém o SEI nativo. */
  }
  return null;
}
