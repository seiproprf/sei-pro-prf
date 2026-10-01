/**
 * Como uma página da extensão (painel lateral, Estúdio) alcança as abas do SEI
 * sem a permissão `tabs`: ela grava um aviso no `chrome.storage.local`, e o
 * content script de cada aba, que escuta o storage, abre a porta. A regra veio
 * do agente (`agente-ia/src/ponte/protocolo.ts` e `cliente.ts`), que segue com
 * a cópia dele até ser migrado para cá.
 */

/** O que a página grava ao abrir e renova de tempos em tempos. O `id` é da INSTÂNCIA. */
export interface Abertura {
  id: string;
  quando: number;
}

/** Quem gravou o aviso. O formato antigo do agente era só o `Date.now()`. */
export function abridorDe(valor: unknown): string | null {
  if (typeof valor === "number" && valor) return String(valor);
  const id = (valor as Abertura | null | undefined)?.id;
  return typeof id === "string" && id ? id : null;
}

/**
 * A aba precisa (re)conectar? `onConnect` só dispara no momento do `connect`:
 * uma página aberta depois não recebe a porta antiga. Mas a renovação do mesmo
 * abridor não pode reconectar, senão mataria a operação em curso.
 */
export function precisaConectar(valor: unknown, temPorta: boolean, servidos: Set<string>): boolean {
  const quem = abridorDe(valor);
  if (!quem) return false;
  return !temPorta || !servidos.has(quem);
}

export interface AbaCandidata {
  id: number;
  janela: number;
  visivel: boolean;
  /** `Date.now()` do último foco. */
  foco: number;
}

/**
 * A aba que atende o painel: desta janela (janela < 0 aceita todas, como no
 * sidebar do Firefox), a fixada se houver, senão a visível com foco mais recente.
 */
export function escolherAba<T extends AbaCandidata>(abas: T[], janela: number, fixada: number | null = null): T | null {
  const daJanela = abas.filter((a) => janela < 0 || a.janela === janela || a.id === fixada);
  if (fixada !== null) {
    const f = daJanela.find((a) => a.id === fixada);
    if (f) return f;
  }
  return [...daJanela].sort((a, b) => Number(b.visivel) - Number(a.visivel) || b.foco - a.foco)[0] ?? null;
}
