import { areaMemoria } from "@comum/armazenamento/area";
import { escoposDoContexto } from "@favoritos/modelo/escopo";
import { RepositorioFavoritos } from "@favoritos/repositorio";
import { favoritosDoApp } from "../src/app/favoritos";
import type { ContextoHistorico, Visita } from "../src/modelo/tipos";
import { checar, secao } from "./util";

const ctx = (extra: Partial<ContextoHistorico> = {}): ContextoHistorico => ({
  host: "sei.x.gov.br",
  login: "Ana",
  nome: "Ana",
  unidade: { id: "u1", sigla: "GPF", nome: "Gerencia" },
  versao: "5.0.4",
  temaEscuro: false,
  favoritosAtivo: true,
  lateralDisponivel: true,
  ...extra,
});
const visita = (id: string, extra: Partial<Visita> = {}): Visita => ({
  id,
  protocolo: `50300.0000${id}/2024-00`,
  tipo: "Oficio",
  especificacao: "Assunto X",
  unidades: [],
  primeira: 1,
  ultima: 1,
  vezes: 1,
  ...extra,
});
const carimbo = () => ({ agora: 1000, dispositivo: "d1" });

export async function verificarFavoritos(): Promise<void> {
  secao("historico: ligacao com os Favoritos");
  const area = areaMemoria();
  checar("favoritosAtivo false devolve null", favoritosDoApp(area, ctx({ favoritosAtivo: false }), carimbo) === null);

  const fav = favoritosDoApp(area, ctx(), carimbo)!;
  const esc = escoposDoContexto({ ...ctx(), login: "ana" });
  const gpf = new RepositorioFavoritos(area, esc.unidade!, carimbo);
  const pessoal = new RepositorioFavoritos(area, esc.pessoal, carimbo);
  checar("ids vazio no comeco", (await fav.ids()).size === 0);

  const r = await fav.favoritar(visita("1", { nivel: "sigiloso" }));
  checar("favoritar devolve a sigla da unidade", r.lista === "GPF");
  const gravado = (await gpf.ativos())[0];
  checar(
    "grava na lista da unidade com protocolo e tipo",
    gravado?.id === "1" && gravado.protocolo === "50300.00001/2024-00" && gravado.tipo === "Oficio",
  );
  checar("sigiloso vira sigiloso true e sem especificacao", gravado?.sigiloso === true && gravado.especificacao === undefined);
  await fav.favoritar(visita("2"));
  checar("nao sigiloso guarda a especificacao", (await gpf.obter("2"))?.especificacao === "Assunto X" && !(await gpf.obter("2"))?.sigiloso);
  await pessoal.adicionar({ id: "3", protocolo: "3" });
  checar("ids reune unidade e pessoal", [...(await fav.ids())].sort().join() === "1,2,3");

  await r.desfazer();
  checar("desfazer do favoritar tira o favorito", !(await fav.ids()).has("1"));

  const t = await fav.tirar("3");
  checar("tirar da pessoal sai de ids", !!t && !(await fav.ids()).has("3"));
  await t!.desfazer();
  checar("desfazer do tirar restaura", (await fav.ids()).has("3"));
  const t2 = await fav.tirar("2");
  checar("tirar da unidade", !!t2 && !(await gpf.contem("2")));
  await t2!.desfazer();
  checar("desfazer restaura na unidade", await gpf.contem("2"));
  checar("tirar de quem nao e favorito devolve null", (await fav.tirar("999")) === null);

  let n = 0;
  const parar = fav.aoMudar(() => n++);
  await pessoal.adicionar({ id: "4", protocolo: "4" });
  checar("aoMudar dispara com a lista pessoal", n > 0);
  const antes = n;
  await gpf.adicionar({ id: "5", protocolo: "5" });
  checar("aoMudar dispara com a lista da unidade", n > antes);
  parar();
  const depois = n;
  await pessoal.adicionar({ id: "6", protocolo: "6" });
  checar("depois de desligar nao dispara mais", n === depois);

  const semUnidade = favoritosDoApp(area, ctx({ unidade: null }), carimbo)!;
  const p = await semUnidade.favoritar(visita("7"));
  checar("sem unidade grava na Pessoal", p.lista === "Pessoal" && (await pessoal.contem("7")));
}
