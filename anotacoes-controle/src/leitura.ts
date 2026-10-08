/**
 * Leitura da anotação a partir da linha já na tela, sem requisição. O SEI 4.1
 * e o 5 descrevem o ícone no aria-label ("Anotação[ com prioridade] / texto /
 * autor"); o SEI 3 só tem o tooltip, lido como literal sem executar nada. A
 * prioridade também está no ícone (anotacao2.svg no 4.1/5, "prioridade" no 3).
 */
import { decodificarEntidades } from '../../sei-nucleo/src/sessao/entidades';
import { chamadas, texto } from '../../sei-nucleo/src/sessao/literais';

export interface Anotacao { texto: string; autor: string; prioridade: boolean }

/**
 * O legado (replaceSticknoteHome, sei-pro.js) troca o checklist do tooltip por
 * HTML de ícones e cola as linhas. Só importa no SEI 3, que não tem aria-label.
 */
const ITEM_LEGADO = /<div(?: style="text-decoration: line-through;")?><i class="(far fa-square|fas fa-check-square)"><\/i> ?([\s\S]*?)<\/div>/g;
function desfazerChecklistLegado(t: string): string {
  if (!t.includes('<div')) return t;
  return t
    .replace(ITEM_LEGADO, (_, icone: string, item: string) => `\n${icone === 'far fa-square' ? '[ ]' : '[X]'} ${item}\n`)
    .replace(/\n{2,}/g, '\n')
    .trim();
}

// O texto é guloso: o autor ("sigla em dd/mm/aaaa hh:mm") nunca tem " / ".
const ROTULO = /^Anota[\u00e7c][\u00e3a]o( com prioridade)?\s+\/\s+([\s\S]*)\s+\/\s+(.*)$/i;

export function lerAnotacaoDaLinha(linha: Element): Anotacao | null {
  const link = linha.querySelector('a[href*="acao=anotacao_registrar"]');
  if (!link) return null;
  const icone = link.querySelector('img')?.getAttribute('src') ?? '';
  const prioridadeIcone = /anotacao2\.|prioridade/i.test(icone);
  const rotulo = ROTULO.exec(link.getAttribute('aria-label') ?? '');
  if (rotulo) {
    const conteudo = decodificarEntidades(rotulo[2]!).replace(/\r\n?/g, '\n').trim();
    return conteudo ? { texto: conteudo, autor: rotulo[3]!.trim(), prioridade: !!rotulo[1] || prioridadeIcone } : null;
  }
  const args = chamadas(link.getAttribute('onmouseover') ?? '', 'infraTooltipMostrar')[0];
  if (typeof args?.[0] !== 'string') return null;
  const conteudo = desfazerChecklistLegado(texto(args[0])).trim();
  return conteudo ? { texto: conteudo, autor: texto(args[1]).trim(), prioridade: prioridadeIcone } : null;
}
