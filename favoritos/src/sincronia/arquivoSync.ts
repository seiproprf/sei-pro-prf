/**
 * Sincronia por arquivo (spec 9.3): um .json numa pasta que o próprio usuário
 * já sincroniza (OneDrive, Google Drive, Dropbox, rede). Leva TODAS as listas
 * do usuário, inclusive a Pessoal: é o backup completo e legível.
 *
 * Chrome/Edge: File System Access, com o "handle" guardado no IndexedDB da
 * extensão e permissão pedida por gesto ("Reconectar arquivo") quando expira.
 * Firefox não tem a API: lá valem "Exportar" e "Importar", que já mesclam.
 *
 * Ler sempre MESCLA; arquivo ilegível nunca apaga nada e é regravado.
 */

import type { Area } from "@comum/armazenamento/area";
import { type Envelope, exportarTudo, importarEnvelope, lerEnvelope } from "../arquivo";
import type { Carimbo } from "../modelo/tipos";
import { assinaturaEnvelope } from "./assinatura";
import type { Dono } from "./copias";

export interface ArquivoSync {
  ler(): Promise<string>;
  gravar(conteudo: string): Promise<void>;
}

export interface StatusArquivo {
  estado: "ok" | "erro" | "permissao";
  quando: number;
  mensagem?: string;
  nome?: string;
}

export const chaveStatusArquivo = (d: Dono): string => `favoritos/sync/arquivo/${d.host}|${d.login.toLowerCase()}`;

export class SincroniaArquivo {
  constructor(private readonly d: { area: Area; dono: Dono; arquivo: ArquivoSync; carimbo: () => Carimbo; nome?: string }) {}

  async sincronizar(): Promise<StatusArquivo> {
    const agora = Date.now();
    try {
      const texto = await this.d.arquivo.ler();
      let remota = "";
      let invalido = false;
      let outros: Envelope["escopos"] = [];
      if (texto.trim()) {
        let bruto: unknown = null;
        try {
          bruto = JSON.parse(texto.replace(/^\uFEFF/, ""));
        } catch {
          bruto = null;
        }
        // Gravado por uma versão mais nova do SEI Pro: esta não entende o formato e não pode regravar por cima.
        const b = bruto as { formato?: unknown; versao?: unknown } | null;
        if (b?.formato === "seipro-favoritos" && typeof b.versao === "number" && b.versao > 1) {
          return this.status({
            estado: "erro",
            quando: agora,
            nome: this.d.nome,
            mensagem:
              "O arquivo foi gravado por uma versão mais nova do SEI Pro. Atualize a extensão neste computador; o arquivo não foi alterado.",
          });
        }
        const env = bruto === null ? null : (lerEnvelope(bruto)?.envelope ?? null);
        if (env) {
          await importarEnvelope(this.d.area, env, this.d.carimbo, this.d.dono);
          remota = assinaturaEnvelope(env);
          // Listas de outro SEI ou usuário (o mesmo arquivo escolhido em dois lugares): ficam como estão.
          outros = env.escopos.filter(
            (e) => e.escopo.host !== this.d.dono.host || e.escopo.login.toLowerCase() !== this.d.dono.login.toLowerCase(),
          );
        } else {
          invalido = true;
        }
      }
      const meu = await exportarTudo(this.d.area, this.d.dono.host, this.d.dono.login, this.d.carimbo());
      const local: Envelope = { ...meu, escopos: [...meu.escopos, ...outros] };
      if (!texto.trim() || invalido || assinaturaEnvelope(local) !== remota) await this.d.arquivo.gravar(JSON.stringify(local, null, 2));
      return this.status({
        estado: "ok",
        quando: agora,
        nome: this.d.nome,
        mensagem: invalido
          ? "O arquivo estava ilegível e foi regravado a partir deste computador."
          : outros.length
            ? `O arquivo também tem ${outros.length === 1 ? "uma lista" : `${outros.length} listas`} de outro usuário ou outro SEI, que foram mantidas.`
            : undefined,
      });
    } catch (e) {
      const nome = (e as { name?: string } | null)?.name;
      if (nome === "NotAllowedError" || nome === "SecurityError") {
        return this.status({
          estado: "permissao",
          quando: agora,
          nome: this.d.nome,
          mensagem: "O navegador pede de novo a permissão do arquivo.",
        });
      }
      return this.status({ estado: "erro", quando: agora, nome: this.d.nome, mensagem: e instanceof Error ? e.message : String(e) });
    }
  }

  private async status(s: StatusArquivo): Promise<StatusArquivo> {
    await this.d.area.gravar({ [chaveStatusArquivo(this.d.dono)]: s });
    return s;
  }
}

/* ---- File System Access (Chrome/Edge) ---- */

interface Permissivel {
  queryPermission?(o: { mode: "readwrite" }): Promise<PermissionState>;
  requestPermission?(o: { mode: "readwrite" }): Promise<PermissionState>;
}
export type HandleArquivo = FileSystemFileHandle & Permissivel;

export function temSeletorDeArquivo(w: unknown = globalThis): boolean {
  return typeof (w as { showSaveFilePicker?: unknown }).showSaveFilePicker === "function";
}

export function arquivoDoHandle(handle: HandleArquivo): ArquivoSync {
  return {
    ler: async () => (await handle.getFile()).text(),
    gravar: async (conteudo) => {
      const w = await handle.createWritable();
      await w.write(conteudo);
      await w.close();
    },
  };
}

/** "granted" sem perguntar; "prompt" pede gesto do usuário (botão "Reconectar arquivo"). */
export async function permissao(handle: HandleArquivo, pedir: boolean): Promise<PermissionState> {
  const o = { mode: "readwrite" as const };
  const atual = (await handle.queryPermission?.(o)) ?? "granted";
  if (atual === "granted" || !pedir) return atual;
  return (await handle.requestPermission?.(o)) ?? "denied";
}

/** O handle fica no IndexedDB da extensão (o storage do navegador não guarda handles). */
export function handlesNoIndexedDB(nome = "seipro-favoritos") {
  const abrir = () =>
    new Promise<IDBDatabase>((ok, erro) => {
      const r = indexedDB.open(nome, 1);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains("copias")) db.createObjectStore("copias", { keyPath: "id" }).createIndex("dono", "dono");
        if (!db.objectStoreNames.contains("arquivos")) db.createObjectStore("arquivos");
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    });
  const fazer = <T>(modo: IDBTransactionMode, f: (s: IDBObjectStore) => IDBRequest<T>) =>
    abrir().then(
      (db) =>
        new Promise<T>((ok, erro) => {
          const t = db.transaction("arquivos", modo);
          const r = f(t.objectStore("arquivos"));
          t.oncomplete = () => {
            ok(r.result);
            db.close();
          };
          t.onerror = () => {
            erro(t.error);
            db.close();
          };
        }),
    );
  const chave = (d: Dono) => `${d.host}|${d.login.toLowerCase()}`;
  return {
    ler: (d: Dono) => fazer<HandleArquivo | undefined>("readonly", (s) => s.get(chave(d)) as IDBRequest<HandleArquivo | undefined>),
    guardar: (d: Dono, h: HandleArquivo) => fazer("readwrite", (s) => s.put(h, chave(d))),
    esquecer: (d: Dono) => fazer("readwrite", (s) => s.delete(chave(d))),
  };
}

export interface DepsControleArquivo {
  area: Area;
  dono: Dono;
  handles: {
    ler(d: Dono): Promise<HandleArquivo | undefined>;
    guardar(d: Dono, h: HandleArquivo): Promise<unknown>;
    esquecer(d: Dono): Promise<unknown>;
  };
  /** Seletor do navegador (precisa de gesto do usuário): "novo" = Salvar como, "existente" = Abrir. */
  escolher(modo: "novo" | "existente"): Promise<HandleArquivo | null>;
  carimbo: () => Carimbo;
  atraso?: number;
}

/** O arquivo no app: escolher, reconectar, sincronizar ao abrir/ganhar foco e 15 s depois de mudar. */
export class ControleArquivo {
  private espera: ReturnType<typeof setTimeout> | undefined;

  constructor(private readonly d: DepsControleArquivo) {}

  async configurado(): Promise<boolean> {
    return Boolean(await this.d.handles.ler(this.d.dono).catch(() => undefined));
  }

  async status(): Promise<StatusArquivo | null> {
    const k = chaveStatusArquivo(this.d.dono);
    return ((await this.d.area.obter(k))[k] as StatusArquivo | undefined) ?? null;
  }

  /** null quando não há arquivo escolhido. `pedir` só com gesto do usuário. */
  async sincronizar(pedir = false): Promise<StatusArquivo | null> {
    const h = await this.d.handles.ler(this.d.dono).catch(() => undefined);
    if (!h) return null;
    const sync = new SincroniaArquivo({
      area: this.d.area,
      dono: this.d.dono,
      arquivo: arquivoDoHandle(h),
      carimbo: this.d.carimbo,
      nome: h.name,
    });
    if ((await permissao(h, pedir).catch(() => "denied" as PermissionState)) !== "granted") {
      const s: StatusArquivo = {
        estado: "permissao",
        quando: Date.now(),
        nome: h.name,
        mensagem: "O navegador pede de novo a permissão do arquivo.",
      };
      await this.d.area.gravar({ [chaveStatusArquivo(this.d.dono)]: s });
      return s;
    }
    return sync.sincronizar();
  }

  async escolher(modo: "novo" | "existente" = "novo"): Promise<StatusArquivo | null> {
    const h = await this.d.escolher(modo);
    if (!h) return null;
    await this.d.handles.guardar(this.d.dono, h);
    return this.sincronizar(true);
  }

  reconectar(): Promise<StatusArquivo | null> {
    return this.sincronizar(true);
  }

  async esquecer(): Promise<void> {
    clearTimeout(this.espera);
    await this.d.handles.esquecer(this.d.dono);
    await this.d.area.remover(chaveStatusArquivo(this.d.dono));
  }

  agendar(): void {
    clearTimeout(this.espera);
    this.espera = setTimeout(() => void this.sincronizar().catch(() => undefined), this.d.atraso ?? 15_000);
  }

  parar(): void {
    clearTimeout(this.espera);
  }
}
