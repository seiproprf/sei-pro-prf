import { areaMemoria } from "../src/armazenamento/area";
import { Colecao } from "../src/armazenamento/colecao";
import { idDispositivo } from "../src/armazenamento/dispositivo";
import { checar, secao } from "./util";

export async function verificarArmazenamento(): Promise<void> {
  secao("armazenamento: area em memoria");
  const area = areaMemoria({ outro: 1 });
  const vistos: string[][] = [];
  const parar = area.aoMudar((m) => vistos.push(Object.keys(m)));
  await area.gravar({ a: { x: 1 }, b: 2 });
  checar("obter uma chave", (await area.obter("a")).a !== undefined);
  checar(
    "obter tudo",
    Object.keys(await area.obter(null))
      .sort()
      .join() === "a,b,outro",
  );
  const lido = (await area.obter("a")).a as { x: number };
  lido.x = 99;
  checar("devolve copia, nao a referencia guardada", ((await area.obter("a")).a as { x: number }).x === 1);
  await area.remover("b");
  checar("remover", !("b" in (await area.obter(null))));
  checar("aviso com as chaves mudadas", JSON.stringify(vistos) === JSON.stringify([["a", "b"], ["b"]]), vistos);
  parar();
  await area.gravar({ c: 1 });
  checar("parar de ouvir", vistos.length === 2);

  secao("armazenamento: colecao por prefixo");
  const col = new Colecao<{ id: string; n: number }>(area, "fav/u1/f/");
  const outra = new Colecao<{ id: string; n: number }>(area, "fav/u1/p/");
  let avisos = 0;
  col.aoMudar(() => (avisos += 1));
  await col.gravar("10", { id: "10", n: 1 });
  await col.gravarVarios([
    ["11", { id: "11", n: 2 }],
    ["12", { id: "12", n: 3 }],
  ]);
  await outra.gravar("p1", { id: "p1", n: 0 });
  checar("lista so o proprio prefixo", (await col.listar()).length === 3 && (await outra.listar()).length === 1);
  checar("obter por id", (await col.obter("11"))?.n === 2);
  await col.apagar(["10", "12"]);
  checar("apagar varios", (await col.listar()).map((i) => i.id).join() === "11");
  checar("aviso so do proprio prefixo", avisos === 3, avisos);
  await col.gravarVarios([]);
  checar("gravarVarios vazio nao grava", avisos === 3);

  secao("armazenamento: dispositivo");
  const id1 = await idDispositivo(area);
  const id2 = await idDispositivo(area);
  checar("id do dispositivo e estavel", id1 === id2 && id1.length >= 16, [id1, id2]);
}
