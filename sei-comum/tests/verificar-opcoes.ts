import { lerOpcaoLegada, opcaoLegadaLigada } from "../src/opcoes/legadas";
import { checar, secao } from "./util";

const dv = (configGeral: Array<{ name: string; value: unknown }>) => JSON.stringify([{ baseTipo: "x" }, { configGeral }]);

export async function verificarOpcoes(): Promise<void> {
  secao("opcoes legadas (mesma regra de checkConfigValue)");
  checar("desligada", !opcaoLegadaLigada(dv([{ name: "gerenciarfavoritos", value: false }]), "gerenciarfavoritos"));
  checar("ligada", opcaoLegadaLigada(dv([{ name: "gerenciarfavoritos", value: true }]), "gerenciarfavoritos"));
  checar("ausente conta como ligada", opcaoLegadaLigada(dv([{ name: "outra", value: false }]), "gerenciarfavoritos"));
  checar("valor nulo conta como ligado", opcaoLegadaLigada(dv([{ name: "gerenciarfavoritos", value: null }]), "gerenciarfavoritos"));
  checar("zero desliga, como no == false", !opcaoLegadaLigada(dv([{ name: "gerenciarfavoritos", value: 0 }]), "gerenciarfavoritos"));
  checar("sem configuracao, tudo ligado", opcaoLegadaLigada("", "gerenciarfavoritos") && opcaoLegadaLigada("[]", "gerenciarfavoritos"));
  checar("JSON quebrado nao derruba (fica ligado)", opcaoLegadaLigada("{quebrado", "gerenciarfavoritos"));
  checar("aceita a lista ja analisada", !opcaoLegadaLigada([{ configGeral: [{ name: "a", value: false }] }], "a"));
  const falso = { get: async () => ({ dataValues: dv([{ name: "a", value: false }]) }) } as unknown as Pick<
    chrome.storage.StorageArea,
    "get"
  >;
  checar("lerOpcaoLegada le do sync", (await lerOpcaoLegada("a", falso)) === false);
}
