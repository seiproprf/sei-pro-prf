import { areaMemoria } from "@comum/armazenamento/area";
import { codificar, paraParagrafos } from "@comum/sincronia/codec";
import { escoposDoContexto } from "../src/modelo/escopo";
import { RepositorioFavoritos } from "../src/repositorio";
import { MotorSincronia, type StatusSync } from "../src/sincronia/motor";
import { conteudoDoTexto, envelopeDaUnidade } from "../src/sincronia/textoPadrao";
import { checar, secao, tique } from "./util";
import { CTX } from "./verificar-modelo";

const esc = escoposDoContexto(CTX).unidade!;

function montar(o: { remoto?: string | null; erroLer?: { codigo: string; message: string }; teto?: number } = {}) {
  const area = areaMemoria();
  let t = 1000;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const repo = new RepositorioFavoritos(area, esc, carimbo);
  const destino = {
    html: o.remoto ?? null,
    lidas: 0,
    gravadas: 0,
    async ler() {
      this.lidas++;
      if (o.erroLer) throw Object.assign(new Error(o.erroLer.message), { codigo: o.erroLer.codigo });
      return this.html;
    },
    async gravar(html: string) {
      this.gravadas++;
      this.html = html;
    },
  };
  let ocupado = false;
  let agora = 10_000_000;
  const motor = new MotorSincronia({
    repo,
    escopo: esc,
    destino,
    area,
    chaveStatus: "favoritos/sync/teste",
    carimbo,
    nomeUsuario: "Pedro",
    travar: async (_nome, fn) => (ocupado ? null : fn()),
    agora: () => agora,
    teto: o.teto,
    atrasoEnvio: 10,
  });
  return {
    area,
    repo,
    destino,
    motor,
    avancar: (ms: number) => {
      agora += ms;
    },
    ocupar: (v: boolean) => {
      ocupado = v;
    },
  };
}

/** O texto que outro computador (dispositivo B) gravaria com estes favoritos. */
async function remotoDeOutro(itens: Array<{ id: string; protocolo: string }>): Promise<string> {
  const area = areaMemoria();
  let t = 5000;
  const repoB = new RepositorioFavoritos(area, esc, () => ({ agora: ++t, dispositivo: "B" }));
  for (const i of itens) await repoB.adicionar(i);
  return conteudoDoTexto(await envelopeDaUnidade(repoB, esc, { agora: t, dispositivo: "B" }), "Pedro");
}

export async function verificarMotor(): Promise<void> {
  secao("motor: primeira sincronia");
  const m = montar();
  await m.repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  const s1 = await m.motor.sincronizar();
  checar("sem texto no SEI: cria", m.destino.gravadas === 1 && s1.estado === "ok" && !s1.pendente, s1);
  const s2 = await m.motor.sincronizar();
  checar("logo depois, sem mudanca: nem le (no maximo a cada 5 min)", m.destino.lidas === 1 && s2.estado === "ok");
  m.avancar(6 * 60_000);
  await m.motor.sincronizar();
  checar("depois de 5 min le, e sem diferenca nao regrava", m.destino.lidas === 2 && m.destino.gravadas === 1);

  secao("motor: mescla com outro computador");
  const m2 = montar({ remoto: await remotoDeOutro([{ id: "7", protocolo: "50300.000007/2026-07" }]) });
  await m2.repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  await m2.motor.sincronizar();
  checar("traz o favorito do outro computador", await m2.repo.contem("7"));
  checar("e empurra o local que faltava la", m2.destino.gravadas === 1 && (await m2.motor.status()).estado === "ok");
  const m3 = montar({ remoto: await remotoDeOutro([{ id: "7", protocolo: "50300.000007/2026-07" }]) });
  await m3.motor.sincronizar();
  checar("igual depois de mesclar: nao regrava", m3.destino.gravadas === 0 && (await m3.repo.contem("7")));

  secao("motor: texto invalido e erros");
  const m4 = montar({ remoto: "<p>Um colega apagou tudo e escreveu isto</p>" });
  await m4.repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  const s4 = await m4.motor.sincronizar();
  checar(
    "remoto invalido: regrava a partir do local e avisa",
    m4.destino.gravadas === 1 && s4.estado === "ok" && /regrav/i.test(s4.mensagem ?? ""),
    s4,
  );
  checar("nada local some", await m4.repo.contem("1"));
  const m5 = montar({ erroLer: { codigo: "SEI_SESSAO_EXPIRADA", message: "Sessão expirada" } });
  await m5.motor.marcarPendente();
  const s5 = await m5.motor.sincronizar();
  checar("sessao expirada: erro, pendencia mantida", s5.estado === "erro" && s5.pendente && /sess/i.test(s5.mensagem ?? ""), s5);
  const m6 = montar({ erroLer: { codigo: "SEI_ACAO_INDISPONIVEL", message: "sem menu" } });
  const s6 = await m6.motor.sincronizar();
  checar("sem permissao: indisponivel", s6.estado === "indisponivel", s6);
  m6.avancar(60 * 60_000);
  await m6.motor.sincronizar();
  checar("e nao tenta de novo no mesmo dia", m6.destino.lidas === 1);
  await m6.motor.sincronizar({ forcar: true });
  checar("salvo se o usuario pedir", m6.destino.lidas === 2);
  const m7 = montar({ teto: 300 });
  await m7.repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  const s7 = await m7.motor.sincronizar();
  checar("acima do teto: nao grava e explica", m7.destino.gravadas === 0 && s7.estado === "erro" && /grande/i.test(s7.mensagem ?? ""), s7);

  secao("motor: trava e envio agendado");
  const m8 = montar();
  m8.ocupar(true);
  await m8.motor.sincronizar({ forcar: true });
  checar("outra aba sincronizando: esta nao faz nada", m8.destino.lidas === 0);
  m8.ocupar(false);
  void m8.motor.agendarEnvio();
  await m8.motor.agendarEnvio();
  checar(
    "mudanca local marca pendente na hora",
    ((await m8.area.obter("favoritos/sync/teste"))["favoritos/sync/teste"] as StatusSync | undefined)?.pendente === true,
  );
  await tique(60);
  checar("duas mudancas seguidas: um envio so", m8.destino.lidas === 1 && m8.destino.gravadas === 1, m8.destino);

  secao("motor: texto gravado por versao mais nova do SEI Pro");
  const futuro = paraParagrafos("Dados internos do SEI Pro", await codificar({ formato: "seipro-favoritos", versao: 2, escopos: [] }));
  const m9 = montar({ remoto: futuro });
  await m9.repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01" });
  const s9 = await m9.motor.sincronizar();
  checar(
    "nao regrava por cima e pede para atualizar a extensao",
    m9.destino.gravadas === 0 && s9.estado === "erro" && /mais nova/i.test(s9.mensagem ?? ""),
    s9,
  );
}
