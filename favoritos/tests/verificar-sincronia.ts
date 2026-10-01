import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "../src/modelo/escopo";
import { RepositorioFavoritos } from "../src/repositorio";
import { conteudoDoTexto, envelopeDaUnidade, lerConteudoDoTexto, nomeDoTexto, TETO_TEXTO } from "../src/sincronia/textoPadrao";
import { checar, secao } from "./util";
import { CTX } from "./verificar-modelo";

export async function verificarSincroniaTexto(): Promise<void> {
  secao("sincronia: nome do texto");
  checar("login curto", nomeDoTexto("Pedro.Soares") === "[_SEIPRO_FAV_pedro.soares]");
  const longo = nomeDoTexto("a".repeat(30) + "@orgao.gov.br");
  checar("login longo cabe em 50 com hash", longo.length === 50 && /^\[_SEIPRO_FAV_a{27}~[0-9a-f]{8}\]$/.test(longo), longo);
  checar("logins longos diferentes nao colidem", nomeDoTexto("a".repeat(30) + "@x.gov.br") !== nomeDoTexto("a".repeat(30) + "@y.gov.br"));

  secao("sincronia: envelope da unidade");
  const area = areaMemoria();
  let t = 100;
  const carimbo = () => ({ agora: ++t, dispositivo: "A" });
  const esc = escoposDoContexto(CTX).unidade!;
  const repo = new RepositorioFavoritos(area, esc, carimbo);
  await repo.adicionar({ id: "1", protocolo: "50300.000001/2026-01", especificacao: "Contrato" });
  await repo.adicionar({ id: "2", protocolo: "50300.000002/2026-02", sigiloso: true });
  await repo.adicionar({ id: "3", protocolo: "50300.000003/2026-03" });
  await repo.remover(["3"]);
  await repo.criarPasta("Contratos");
  const env = await envelopeDaUnidade(repo, esc, carimbo());
  const ids = env.escopos[0]!.favoritos.map((f) => f.id)
    .sort()
    .join();
  checar("leva favoritos e lapides, sem sigiloso", ids === "1,3", ids);
  checar("leva as pastas", env.escopos[0]!.pastas.length === 1);
  checar("um escopo so, o da unidade", env.escopos.length === 1 && env.escopos[0]!.escopo.lista === "unidade");

  secao("sincronia: conteudo do Texto Padrao");
  const html = await conteudoDoTexto(env, "Pedro");
  checar("paragrafo legivel avisa o que e", html.startsWith("<p>Dados internos do SEI Pro") && html.includes("Pedro"));
  const volta = await lerConteudoDoTexto(html, esc);
  checar("ida e volta", "envelope" in volta && volta.envelope.escopos[0]!.favoritos.length === 2, volta);
  const editado = html.replace(/<\/p>\n<p>/, "</p>\n<p>colega escreveu aqui</p>\n<p>");
  const r1 = await lerConteudoDoTexto(editado, esc);
  checar("texto editado por colega: invalido (nao apaga nada)", "invalido" in r1, r1);
  const outro = await lerConteudoDoTexto(html, { ...esc, login: "outra.pessoa" });
  checar("envelope de outro login: invalido", "invalido" in outro);
  const outraUnidade = await lerConteudoDoTexto(html, { ...esc, unidade: { id: "999", sigla: "X" } });
  checar("envelope de outra unidade: invalido", "invalido" in outraUnidade);
  checar("vazio: invalido", "invalido" in (await lerConteudoDoTexto("", esc)));
  checar("teto de 100 KB", TETO_TEXTO === 100 * 1024);
}
