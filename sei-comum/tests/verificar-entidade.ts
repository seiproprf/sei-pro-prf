import { indiceEntre, indicesEntre } from "../src/ordem/indice";
import { mesclar, purgarLapides, type Versionada, vence } from "../src/sincronia/entidade";
import { checar, secao } from "./util";

type Item = Versionada & { v?: string };
const it = (id: string, atualizadoEm: number, dispositivo = "A", extra: Partial<Item> = {}): Item => ({
  id,
  atualizadoEm,
  dispositivo,
  ...extra,
});

export function verificarEntidade(): void {
  secao("mesclagem: vence o mais recente");
  checar("mais recente vence", vence(it("1", 2), it("1", 1)) && !vence(it("1", 1), it("1", 2)));
  checar(
    "empate decidido pelo dispositivo, nos dois sentidos",
    vence(it("1", 5, "B"), it("1", 5, "A")) && !vence(it("1", 5, "A"), it("1", 5, "B")),
  );

  const a = [it("1", 10, "A", { v: "a1" }), it("2", 5, "A", { v: "a2" })];
  const b = [it("1", 12, "B", { v: "b1" }), it("3", 1, "B", { v: "b3" })];
  const c = [it("2", 7, "C", { removidoEm: 7 }), it("3", 1, "A", { v: "c3" })];
  const ref = JSON.stringify(mesclar(a, b, c));
  const ordens = [
    [a, b, c],
    [c, b, a],
    [b, a, c],
    [b, c, a],
    [c, a, b],
    [a, c, b],
  ];
  checar(
    "comutativa (qualquer ordem dos lados)",
    ordens.every((o) => JSON.stringify(mesclar(...o)) === ref),
  );
  checar("idempotente", JSON.stringify(mesclar(mesclar(a, b, c), a, b)) === ref);
  const m = mesclar(a, b, c);
  checar("edicao mais nova vence", m.find((i) => i.id === "1")?.v === "b1");
  checar("lapide mais nova vence item antigo", m.find((i) => i.id === "2")?.removidoEm === 7);
  checar(
    "empate em tudo resolve igual",
    m.find((i) => i.id === "3")?.v === "b3",
    m.find((i) => i.id === "3"),
  );
  const revivido = mesclar([it("9", 3, "A", { removidoEm: 3 })], [it("9", 4, "A")]);
  checar("item re-adicionado depois da lapide volta", revivido[0]?.removidoEm === undefined);

  secao("lapides");
  const dia = 86_400_000;
  const agora = 100 * dia;
  const l = [it("1", 1, "A", { removidoEm: agora - 91 * dia }), it("2", 1, "A", { removidoEm: agora - 89 * dia }), it("3", 1)];
  checar(
    "purga so lapide com mais de 90 dias",
    purgarLapides(l, agora)
      .map((i) => i.id)
      .join() === "2,3",
  );

  secao("indice fracionario");
  const x = indiceEntre(null, null);
  const y = indiceEntre(x, null);
  const z = indiceEntre(x, y);
  checar("ordem crescente com < (nunca localeCompare)", x < z && z < y, [x, z, y]);
  let esq = x;
  const dir = y;
  let ok = true;
  for (let i = 0; i < 50; i++) {
    const n = indiceEntre(esq, dir);
    ok &&= esq < n && n < dir;
    esq = n;
  }
  checar("50 insercoes no mesmo intervalo", ok);
  const varios = indicesEntre(null, null, 5);
  checar("n indices ja ordenados", varios.length === 5 && varios.every((v, i) => i === 0 || (varios[i - 1] ?? "") < v), varios);
}
