/**
 * Área de chave-valor com a forma do `chrome.storage`, para os módulos não
 * dependerem do navegador nos testes. Os dados vivem no `chrome.storage.local`,
 * que sobrevive à limpeza de cache e de dados de site (só a desinstalação
 * apaga). Essa é a primeira defesa contra a perda de favoritos relatada pelos
 * usuários, que guardavam tudo no localStorage da página do SEI.
 */

export type Mudancas = Record<string, { novo?: unknown; antigo?: unknown }>;

export interface Area {
  obter(chaves?: string | string[] | null): Promise<Record<string, unknown>>;
  gravar(itens: Record<string, unknown>): Promise<void>;
  remover(chaves: string | string[]): Promise<void>;
  /** Avisa mudanças feitas por QUALQUER contexto (outra aba, o app, o content script). */
  aoMudar(cb: (m: Mudancas) => void): () => void;
}

export function areaChrome(area: chrome.storage.StorageArea, nome: "local" | "sync" | "session"): Area {
  return {
    obter: (chaves = null) => area.get(chaves) as Promise<Record<string, unknown>>,
    gravar: (itens) => area.set(itens),
    remover: (chaves) => area.remove(chaves),
    aoMudar(cb) {
      const ouvinte = (m: Record<string, chrome.storage.StorageChange>, n: string) => {
        if (n === nome) cb(m as Mudancas);
      };
      chrome.storage.onChanged.addListener(ouvinte);
      return () => chrome.storage.onChanged.removeListener(ouvinte);
    },
  };
}

export function areaMemoria(inicial: Record<string, unknown> = {}): Area {
  const dados = new Map<string, unknown>(Object.entries(structuredClone(inicial)));
  const ouvintes = new Set<(m: Mudancas) => void>();
  const avisar = (m: Mudancas) => {
    if (Object.keys(m).length) for (const o of [...ouvintes]) o(m);
  };
  return {
    async obter(chaves = null) {
      const lista = chaves === null ? [...dados.keys()] : typeof chaves === "string" ? [chaves] : chaves;
      const saida: Record<string, unknown> = {};
      for (const k of lista) if (dados.has(k)) saida[k] = structuredClone(dados.get(k));
      return saida;
    },
    async gravar(itens) {
      const m: Mudancas = {};
      for (const [k, v] of Object.entries(itens)) {
        m[k] = { antigo: dados.get(k), novo: structuredClone(v) };
        dados.set(k, structuredClone(v));
      }
      avisar(m);
    },
    async remover(chaves) {
      const m: Mudancas = {};
      for (const k of typeof chaves === "string" ? [chaves] : chaves) {
        if (!dados.has(k)) continue;
        m[k] = { antigo: dados.get(k) };
        dados.delete(k);
      }
      avisar(m);
    },
    aoMudar(cb) {
      ouvintes.add(cb);
      return () => ouvintes.delete(cb);
    },
  };
}
