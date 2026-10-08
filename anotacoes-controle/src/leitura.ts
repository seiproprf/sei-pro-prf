/** Leitura da tela já aberta. Literais e entidades usam o parser do núcleo. */
import { chamadas, texto } from '../../sei-nucleo/src/sessao/literais';
import { decodificarEntidades } from '../../sei-nucleo/src/sessao/entidades';
export interface Anotacao { texto: string; autor: string; href: string }
export function lerAnotacaoDaLinha(linha: Element): Anotacao | null {
  const link = linha.querySelector('a[href*="acao=anotacao_registrar"]');
  if (!link) return null;
  const args = chamadas(link.getAttribute('onmouseover') ?? '', 'infraTooltipMostrar')[0];
  const rotulo = link.getAttribute('aria-label') ?? '';
  const partes = /^Anota[\u00e7c][\u00e3a]o\s*\/\s*([\s\S]*?)\s*\/\s*([^\n]*)$/i.exec(rotulo);
  const acessivel = partes?.[1] ?? /^Anota[\u00e7c][\u00e3a]o\s*:\s*([\s\S]*)$/i.exec(rotulo)?.[1];
  const conteudo = acessivel !== undefined ? decodificarEntidades(acessivel) : typeof args?.[0] === 'string' ? texto(args[0]) : '';
  if (!conteudo.trim()) return null;
  return { texto: conteudo.trim(), autor: partes?.[2] ?? texto(args?.[1]), href: link.getAttribute('href') ?? '' };
}
export function lerPrioridade(doc: Document): boolean {
  const checkbox = doc.querySelector<HTMLInputElement>('#chkSinPrioridade');
  return !!checkbox && (checkbox.checked || checkbox.hasAttribute('checked'));
}
