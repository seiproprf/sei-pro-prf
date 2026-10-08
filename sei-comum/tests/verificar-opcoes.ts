import { lerOpcaoLegada, opcaoLegadaLigada, opcaoLegadaMarcada } from "../src/opcoes/legadas";
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

  secao("opcoes legadas desligadas por padrao (mesma regra de verifyConfigValue)");
  checar("marcada liga", opcaoLegadaMarcada(dv([{ name: "nova", value: true }]), "nova"));
  checar("desmarcada desliga", !opcaoLegadaMarcada(dv([{ name: "nova", value: false }]), "nova"));
  checar("ausente conta como desligada", !opcaoLegadaMarcada(dv([{ name: "outra", value: true }]), "nova"));
  checar("valor nulo conta como desligado", !opcaoLegadaMarcada(dv([{ name: "nova", value: null }]), "nova"));
  checar("um liga, como no == true", opcaoLegadaMarcada(dv([{ name: "nova", value: 1 }]), "nova"));
  checar(
    "sem configuracao, desligada",
    !opcaoLegadaMarcada("", "nova") && !opcaoLegadaMarcada("[]", "nova") && !opcaoLegadaMarcada(undefined, "nova"),
  );
  checar("JSON quebrado nao derruba (fica desligada)", !opcaoLegadaMarcada("{quebrado", "nova"));
  checar("aceita a lista ja analisada", opcaoLegadaMarcada([{ configGeral: [{ name: "a", value: true }] }], "a"));
}
