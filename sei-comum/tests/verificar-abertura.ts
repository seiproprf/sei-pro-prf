import { abridorDe, escolherAba, precisaConectar } from "../src/ponte/abertura";
import { checar, secao } from "./util";

export function verificarAbertura(): void {
  secao("ponte: anuncio de pagina aberta");
  checar("abridor de objeto", abridorDe({ id: "a1", quando: 1 }) === "a1");
  checar("abridor no formato antigo (numero)", abridorDe(1234) === "1234");
  checar("lixo nao e abridor", abridorDe(null) === null && abridorDe({}) === null && abridorDe(0) === null);
  const servidos = new Set<string>();
  checar("sem anuncio nao conecta", !precisaConectar(undefined, false, servidos));
  checar("anuncio sem porta conecta", precisaConectar({ id: "a1", quando: 1 }, false, servidos));
  servidos.add("a1");
  checar("o mesmo abridor renovado nao reconecta", !precisaConectar({ id: "a1", quando: 2 }, true, servidos));
  checar("abridor novo reconecta mesmo com porta", precisaConectar({ id: "b2", quando: 3 }, true, servidos));
  checar("porta caida reconecta com o mesmo abridor", precisaConectar({ id: "a1", quando: 4 }, false, servidos));

  secao("ponte: escolha da aba");
  const abas = [
    { id: 1, janela: 10, visivel: false, foco: 900 },
    { id: 2, janela: 10, visivel: true, foco: 100 },
    { id: 3, janela: 20, visivel: true, foco: 999 },
  ];
  checar("visivel vence foco mais recente", escolherAba(abas, 10)?.id === 2);
  checar("outra janela fica de fora", escolherAba(abas, 20)?.id === 3);
  checar("sem janela conhecida aceita todas", escolherAba(abas, -1)?.id === 3);
  checar("fixada vence", escolherAba(abas, 10, 1)?.id === 1);
  checar("entre invisiveis, o foco mais recente", escolherAba([abas[0]!, { id: 4, janela: 10, visivel: false, foco: 5 }], 10)?.id === 1);
  checar("lista vazia", escolherAba([], 10) === null);
}
