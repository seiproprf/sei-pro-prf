import { areaMemoria } from "@comum/armazenamento/area";
import { CHAVE_PREFERENCIAS } from "../src/modelo/constantes";
import { escoposDoContexto } from "../src/modelo/escopo";
import { ControleSincronia, chaveStatusTexto, ocultarTextosInternos } from "../src/pagina/sincronia";
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
  const sync = areaMemoria({ [CHAVE_PREFERENCIAS]: { textoPadrao: "nao-perguntado" } });
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
  await sync.gravar({ [CHAVE_PREFERENCIAS]: { textoPadrao: "ligado" } });
  await tique(30);
  checar("ligou (de qualquer lugar): sincroniza na hora", remoto.lidas === 1 && remoto.html !== null);
  await repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  await tique(80);
  checar("mudanca local vai para o SEI sozinha", remoto.lidas === 2 && /<p>/.test(remoto.html ?? ""));
  const st = await c.agora();
  checar("sincronizar agora (pedido do app)", st.estado === "ok" && remoto.lidas === 3, st);
  await c.apagar();
  const prefs = (await sync.obter(CHAVE_PREFERENCIAS))[CHAVE_PREFERENCIAS] as { textoPadrao?: string };
  const status = (await area.obter(chaveStatusTexto(esc)))[chaveStatusTexto(esc)] as StatusSync | undefined;
  checar("apagar exclui o texto e desliga", remoto.excluido && prefs.textoPadrao === "desligado" && status?.estado === "nunca", {
    prefs,
    status,
  });
  await repo.adicionar({ id: "2", protocolo: "50300.000002/2026-02" });
  await tique(80);
  checar("desligado: mudancas nao vao mais", remoto.html === null);
  c.parar();
}
