import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { ControleSincronia, chaveStatusTexto, ocultarTextosInternos } from "../src/pagina/sincronia";
import { definirTextoPadrao, estadoTextoPadrao, lerPreferencias } from "../src/preferencias";
import { RepositorioFavoritos } from "../src/repositorio";
import type { StatusSync } from "../src/sincronia/motor";
import { checar, instalarDom, secao, tique } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarControleSync(): Promise<void> {
  secao("higiene: textos internos fora do seletor do SEI");
  const doc = instalarDom(
    '<html><body><select id="selTextoPadrao"><option value="">-</option><option value="1">Despacho padrão</option><option value="2">[_SEIPRO_FAV_ana]</option><option value="3">[_SEIPRO_FAV_bia]</option></select></body></html>',
  );
  checar(
    "remove os [_SEIPRO_ e mantem os outros",
    ocultarTextosInternos(doc) === 2 && doc.querySelectorAll("#selTextoPadrao option").length === 2,
  );
  checar("tela sem o seletor: nada", ocultarTextosInternos(instalarDom("<html><body></body></html>")) === 0);

  secao("controle da sincronia na aba");
  const area = areaMemoria();
  const sync = areaMemoria();
  let t = 1;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const esc = escoposDoContexto(CTX).unidade!;
  const repo = new RepositorioFavoritos(area, esc, carimbo);
  const remoto = { html: null as string | null, lidas: 0, excluido: false };
  const armazem = {
    ler: async () => {
      remoto.lidas++;
      return remoto.html;
    },
    gravar: async (h: string) => {
      remoto.html = h;
    },
    excluir: async () => {
      remoto.excluido = true;
      remoto.html = null;
      return true;
    },
  };
  const c = new ControleSincronia({
    ctx: CTX,
    area,
    sync,
    repo,
    escopo: esc,
    armazem: () => armazem,
    carimbo,
    travar: (_n, fn) => fn(),
    atrasoEnvio: 10,
  });
  await c.iniciar("caixa");
  checar("sem consentimento, nao sincroniza", remoto.lidas === 0);
  // Outro SEI (outro host) liga a sincronia: esta unidade NÃO pode passar a sincronizar.
  await definirTextoPadrao(sync, "outro.sei.gov.br", "pedro.soares", "999", "ligado");
  await definirTextoPadrao(sync, CTX.host, "outra.pessoa", CTX.unidade!.id, "ligado");
  await tique(30);
  checar("ligar em outro SEI, ou outro login no mesmo navegador, nao liga aqui (consentimento por login e unidade)", remoto.lidas === 0);
  await definirTextoPadrao(sync, CTX.host, CTX.login, CTX.unidade!.id, "ligado");
  await tique(30);
  checar("ligou (de qualquer lugar): sincroniza na hora", remoto.lidas === 1 && remoto.html !== null);
  await repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  await tique(80);
  checar("mudanca local vai para o SEI sozinha", remoto.lidas === 2 && /<p>/.test(remoto.html ?? ""));
  const st = await c.agora();
  checar("sincronizar agora (pedido do app)", st.estado === "ok" && remoto.lidas === 3, st);
  await c.apagar();
  const prefs = await lerPreferencias(sync);
  const status = (await area.obter(chaveStatusTexto(esc)))[chaveStatusTexto(esc)] as StatusSync | undefined;
  checar(
    "apagar exclui o texto e desliga",
    remoto.excluido &&
      estadoTextoPadrao(prefs, CTX.host, CTX.login, CTX.unidade!.id) === "desligado" &&
      estadoTextoPadrao(prefs, "outro.sei.gov.br", "pedro.soares", "999") === "ligado" &&
      status?.estado === "nunca",
    {
      prefs,
      status,
    },
  );
  await repo.adicionar({ id: "2", protocolo: "50300.000002/2026-02" });
  await tique(80);
  checar("desligado: mudancas nao vao mais", remoto.html === null);
  c.parar();

  secao("apagar com uma rodada em curso nao deixa texto no SEI");
  const area2 = areaMemoria();
  const sync2 = areaMemoria();
  const repo2 = new RepositorioFavoritos(area2, esc, carimbo);
  await repo2.adicionar({ id: "1", protocolo: "P1" });
  const remoto2 = { html: null as string | null };
  let soltarGravacao: () => void = () => undefined;
  const armazem2 = {
    ler: async () => remoto2.html,
    // A gravacao demora (rede do orgao): o usuario pede "apagar" no meio dela.
    gravar: (h: string) =>
      new Promise<void>((ok) => {
        soltarGravacao = () => {
          remoto2.html = h;
          ok();
        };
      }),
    excluir: async () => {
      const havia = remoto2.html !== null;
      remoto2.html = null;
      return havia;
    },
    localizar: async () => (remoto2.html ? { id: "1" } : null),
  };
  // Trava de verdade (fila): a rodada e o apagar usam a mesma.
  let fila = Promise.resolve();
  const travarEsperando = <T>(_n: string, fn: () => Promise<T>) => {
    const r = fila.then(fn);
    fila = r.then(
      () => undefined,
      () => undefined,
    );
    return r;
  };
  const c2 = new ControleSincronia({
    ctx: CTX,
    area: area2,
    sync: sync2,
    repo: repo2,
    escopo: esc,
    armazem: () => armazem2,
    carimbo,
    travar: (n, fn) => travarEsperando(n, fn),
    travarEsperando,
    atrasoEnvio: 10,
  });
  await c2.iniciar("caixa");
  await definirTextoPadrao(sync2, CTX.host, CTX.login, CTX.unidade!.id, "ligado");
  await tique(30);
  const apagando = c2.apagar();
  await tique(10);
  soltarGravacao();
  await apagando;
  await tique(30);
  checar("o texto que a rodada gravou depois do pedido tambem sai", remoto2.html === null, remoto2.html?.slice(0, 40));
  c2.parar();
}
