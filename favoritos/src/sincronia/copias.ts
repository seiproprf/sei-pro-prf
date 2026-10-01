/**
 * Cópias diárias (spec 9.4): uma por dia, de todas as listas do usuário, no
 * IndexedDB da extensão; ficam as 14 mais recentes. É a rede de segurança de
 * tudo o resto (um colega que apagou o texto, uma importação errada, a lixeira
 * que venceu).
 *
 * Restaurar não "volta no tempo" apagando o que veio depois: traz de volta o
 * que estava ATIVO na cópia, com carimbo novo para vencer remoções posteriores,
 * e deixa em paz o que entrou depois dela.
 */

import type { Area } from "@comum/armazenamento/area";
import type { DataISO } from "@comum/datas/dias";
import { type Envelope, exportarTudo, importarEnvelope } from "../arquivo";
import type { Carimbo } from "../modelo/tipos";

export const MAX_COPIAS = 14;

export interface Dono {
  host: string;
  login: string;
}

export interface Copia {
  /** host|login|dia */
  id: string;
  dono: string;
  dia: DataISO;
  quando: number;
  quantidade: number;
  envelope: Envelope;
}

export interface ArmazemCopias {
  listar(dono: Dono): Promise<Copia[]>;
  gravar(c: Copia): Promise<void>;
  apagar(id: string): Promise<void>;
}

const chaveDono = (d: Dono) => `${d.host}|${d.login.toLowerCase()}`;

export async function fazerCopiaDoDia(area: Area, dono: Dono, armazem: ArmazemCopias, hoje: DataISO, c: Carimbo): Promise<boolean> {
  const existentes = await armazem.listar(dono);
  if (existentes.some((x) => x.dia === hoje)) return false;
  const envelope = await exportarTudo(area, dono.host, dono.login, c);
  const quantidade = envelope.escopos.reduce((n, e) => n + e.favoritos.filter((f) => f.removidoEm === undefined).length, 0);
  await armazem.gravar({ id: `${chaveDono(dono)}|${hoje}`, dono: chaveDono(dono), dia: hoje, quando: c.agora, quantidade, envelope });
  const sobra = [...existentes, { dia: hoje } as Copia].sort((a, b) => (a.dia < b.dia ? 1 : -1)).slice(MAX_COPIAS);
  for (const x of sobra) if (x.id) await armazem.apagar(x.id);
  return true;
}

export async function restaurarCopia(area: Area, copia: Copia, carimbo: () => Carimbo, dono: Dono): Promise<{ restaurados: number }> {
  const c = carimbo();
  const recarimbar = <T extends { removidoEm?: number }>(l: T[]) =>
    l.filter((x) => x.removidoEm === undefined).map((x) => ({ ...x, atualizadoEm: c.agora, dispositivo: c.dispositivo }));
  const env: Envelope = {
    ...copia.envelope,
    escopos: copia.envelope.escopos.map((e) => ({
      ...e,
      favoritos: recarimbar(e.favoritos),
      pastas: recarimbar(e.pastas),
      etiquetas: recarimbar(e.etiquetas),
    })),
  };
  const r = await importarEnvelope(area, env, () => c, dono);
  return { restaurados: r.novos + r.atualizados };
}

/** Para os testes (e como recuo quando o IndexedDB falha). */
export function copiasEmMemoria(): ArmazemCopias {
  const dados = new Map<string, Copia>();
  return {
    async listar(dono) {
      return [...dados.values()].filter((c) => c.dono === chaveDono(dono)).sort((a, b) => (a.dia < b.dia ? 1 : -1));
    },
    async gravar(c) {
      dados.set(c.id, structuredClone(c));
    },
    async apagar(id) {
      dados.delete(id);
    },
  };
}

/** IndexedDB da extensão (origem chrome-extension://), banco "seipro-favoritos", depósito "copias". */
export function copiasNoIndexedDB(nome = "seipro-favoritos"): ArmazemCopias {
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
  const pedir = <T>(modo: IDBTransactionMode, fazer: (s: IDBObjectStore) => IDBRequest<T>) =>
    abrir().then(
      (db) =>
        new Promise<T>((ok, erro) => {
          const t = db.transaction("copias", modo);
          const r = fazer(t.objectStore("copias"));
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
  return {
    async listar(dono) {
      const todas = await pedir<Copia[]>("readonly", (s) => s.index("dono").getAll(chaveDono(dono)) as IDBRequest<Copia[]>);
      return todas.sort((a, b) => (a.dia < b.dia ? 1 : -1));
    },
    async gravar(c) {
      await pedir("readwrite", (s) => s.put(c));
    },
    async apagar(id) {
      await pedir("readwrite", (s) => s.delete(id));
    },
  };
}
