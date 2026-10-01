/**
 * Onde o legado guardava os favoritos, na origem do SEI (o content script do
 * mundo isolado enxerga o mesmo localStorage da página). Nada aqui apaga o que
 * existe: o dado antigo fica intacto por algumas versões, como rede de segurança.
 */

export function lerLegadoLocal(armazenamento: Pick<Storage, "getItem">): unknown | null {
  const bruto = armazenamento.getItem("configDataFavoritesPro");
  if (!bruto) return null;
  try {
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}

type EntradaArquivo = { file(ok: (f: File) => void, erro: () => void): void };
type SistemaArquivos = { root: { getFile(nome: string, o: object, ok: (e: EntradaArquivo) => void, erro: () => void): void } };
type PedirFs = (tipo: number, tamanho: number, ok: (fs: SistemaArquivos) => void, erro: () => void) => void;

/**
 * Cópia que o legado gravava em `configPro.json` (FileSystem API antiga,
 * PERSISTENT) e que ele mesmo nunca conseguiu restaurar, por causa de um
 * `JSON.parse` duplo em sei-functions-pro.js:1547. Em navegador sem a API ou
 * sem o arquivo, devolve null.
 */
export function lerArquivoAntigo(prazoMs = 2000): Promise<unknown | null> {
  const pedir = (window as unknown as { webkitRequestFileSystem?: PedirFs }).webkitRequestFileSystem;
  if (!pedir) return Promise.resolve(null);
  return new Promise((ok) => {
    const limite = setTimeout(() => ok(null), prazoMs);
    const nada = () => {
      clearTimeout(limite);
      ok(null);
    };
    try {
      pedir(
        1,
        0,
        (fs) =>
          fs.root.getFile(
            "configPro.json",
            {},
            (entrada) =>
              entrada.file(async (arquivo) => {
                try {
                  const conteudo = JSON.parse(await arquivo.text());
                  clearTimeout(limite);
                  ok(conteudo);
                } catch {
                  nada();
                }
              }, nada),
            nada,
          ),
        nada,
      );
    } catch {
      nada();
    }
  });
}
