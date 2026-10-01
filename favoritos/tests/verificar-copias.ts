import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { RepositorioFavoritos } from "../src/repositorio";
import { type ArquivoSync, ControleArquivo, type HandleArquivo, SincroniaArquivo } from "../src/sincronia/arquivoSync";
import { type Copia, copiasEmMemoria, fazerCopiaDoDia, restaurarCopia } from "../src/sincronia/copias";
import { checar, secao } from "./util";
import { CTX } from "./verificar-modelo";

const dono = { host: CTX.host, login: CTX.login.toLowerCase() };

export async function verificarCopias(): Promise<void> {
  secao("copias diarias");
  const area = areaMemoria();
  let t = 1;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const esc = escoposDoContexto(CTX);
  const repo = new RepositorioFavoritos(area, esc.unidade!, carimbo);
  await repo.registrar();
  await repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  const copias = copiasEmMemoria();
  checar("primeira do dia: copia", await fazerCopiaDoDia(area, dono, copias, "2026-10-01", carimbo()));
  checar("segunda no mesmo dia: nao duplica", !(await fazerCopiaDoDia(area, dono, copias, "2026-10-01", carimbo())));
  for (let d = 2; d <= 20; d++) await fazerCopiaDoDia(area, dono, copias, `2026-10-${String(d).padStart(2, "0")}`, carimbo());
  const lista = await copias.listar(dono);
  checar(
    "guarda as 14 mais recentes",
    lista.length === 14 && lista[0]!.dia === "2026-10-20" && lista.at(-1)!.dia === "2026-10-07",
    lista.map((c) => c.dia),
  );
  const antiga = lista.at(-1) as Copia;
  await repo.remover(["1"]);
  await repo.adicionar({ id: "2", protocolo: "50300.000002/2026-02" });
  await restaurarCopia(area, antiga, carimbo, dono);
  checar("restaurar traz de volta o que foi removido depois da copia", await repo.contem("1"));
  checar("e mantem o que entrou depois", await repo.contem("2"));

  secao("arquivo sincronizado (pasta da nuvem)");
  const area2 = areaMemoria();
  const repo2 = new RepositorioFavoritos(area2, esc.unidade!, () => ({ agora: ++t, dispositivo: "B" }));
  await repo2.registrar();
  await repo2.adicionar({ id: "9", protocolo: "50300.000009/2026-09" });
  let conteudo = "";
  let escritas = 0;
  const arquivo: ArquivoSync = {
    ler: async () => conteudo,
    gravar: async (s: string) => {
      escritas++;
      conteudo = s;
    },
  };
  const s1 = new SincroniaArquivo({ area: area2, dono, arquivo, carimbo: () => ({ agora: ++t, dispositivo: "B" }) });
  const r1 = await s1.sincronizar();
  checar("arquivo vazio: grava todas as listas", r1.estado === "ok" && escritas === 1 && JSON.parse(conteudo).escopos.length >= 1);
  const s2 = new SincroniaArquivo({ area, dono, arquivo, carimbo });
  await s2.sincronizar();
  checar("outro computador le e mescla", await repo.contem("9"));
  checar("e grava o que so ele tinha", escritas === 2 && conteudo.includes("50300.000002/2026-02"));
  await s2.sincronizar();
  checar("sem mudanca: nao regrava", escritas === 2);
  conteudo = "{ isto nao e json";
  const r3 = await s2.sincronizar();
  checar(
    "arquivo estragado: nao apaga nada e regrava",
    r3.estado === "ok" && escritas === 3 && (await repo.contem("9")) && /regrav/i.test(r3.mensagem ?? ""),
    r3,
  );
}

export async function verificarControleArquivo(): Promise<void> {
  secao("arquivo: controle no app");
  const area = areaMemoria();
  let t = 1;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const repo = new RepositorioFavoritos(area, escoposDoContexto(CTX).unidade!, carimbo);
  await repo.registrar();
  await repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  let conteudo = "";
  let perm: PermissionState = "granted";
  const handle = {
    name: "favoritos-seipro.json",
    getFile: async () => ({ text: async () => conteudo }),
    createWritable: async () => ({
      write: async (s: string) => {
        conteudo = s;
      },
      close: async () => undefined,
    }),
    queryPermission: async () => perm,
    requestPermission: async () => {
      perm = "granted";
      return perm;
    },
  } as unknown as HandleArquivo;
  const guardados = new Map<string, HandleArquivo>();
  const handles = {
    ler: async () => guardados.get("h"),
    guardar: async (_d: unknown, h: HandleArquivo) => void guardados.set("h", h),
    esquecer: async () => void guardados.delete("h"),
  };
  const c = new ControleArquivo({ area, dono, handles, escolher: async () => handle, carimbo, atraso: 10 });
  checar("sem arquivo escolhido: nada a fazer", (await c.sincronizar()) === null);
  await c.escolher();
  checar("escolher grava as listas no arquivo", conteudo.includes("50300.000001/2026-01") && (await c.status())?.estado === "ok");
  perm = "prompt";
  const s = await c.sincronizar();
  checar("permissao expirada: pede reconectar (sem gesto nao pergunta)", s?.estado === "permissao", s);
  await c.reconectar();
  checar("reconectar pede a permissao e sincroniza", (perm as PermissionState) === "granted" && (await c.status())?.estado === "ok");
  await repo.adicionar({ id: "2", protocolo: "50300.000002/2026-02" });
  c.agendar();
  c.agendar();
  await new Promise((r) => setTimeout(r, 60));
  checar("mudanca local vai para o arquivo depois do intervalo", conteudo.includes("50300.000002/2026-02"));
  await c.esquecer();
  checar("parar de usar o arquivo", !(await c.configurado()) && (await c.status()) === null);
}
