import { areaMemoria } from "@comum/armazenamento/area";
import { CHAVE_PREFERENCIAS } from "../src/modelo/constantes";
import { montarOpcoesExibicao } from "../src/opcoes/exibicao";
import { checar, disparar, instalarDom, secao, tique } from "./util";

export async function verificarOpcoes(): Promise<void> {
  secao("opcoes: posicao exclusiva e lateral independente");
  instalarDom();
  const sync = areaMemoria({ [CHAVE_PREFERENCIAS]: { exibir: "ambos", perguntarAoFavoritar: false } });
  const el = await montarOpcoesExibicao({ sync, lateralDisponivel: true });
  const caixa = (v: string) => el.querySelector(`input[value="${v}"]`) as HTMLInputElement;
  checar(
    "tres caixas sem nos dois lugares",
    el.querySelectorAll('fieldset input[type="checkbox"]').length === 3 && !el.querySelector('input[value="ambos"]'),
  );
  // A ausencia das caixas encerra o teste para o ciclo vermelho sem mascarar a falha.
  if (!caixa("acima") || !caixa("abaixo") || !caixa("lateral")) return;
  const perguntar = el.querySelector("input[data-perguntar]") as HTMLInputElement;
  checar("ambos antigo marca abaixo e lateral", caixa("abaixo").checked && caixa("lateral").checked && !caixa("acima").checked);
  const mudar = async (v: string, checked: boolean) => {
    caixa(v).checked = checked;
    disparar(caixa(v), "change");
    await tique();
  };
  const salvo = async () => ((await sync.obter(CHAVE_PREFERENCIAS))[CHAVE_PREFERENCIAS] as { exibir: string }).exibir;
  await mudar("acima", true);
  checar(
    "acima desmarca abaixo mantendo lateral",
    caixa("acima").checked && !caixa("abaixo").checked && caixa("lateral").checked && (await salvo()) === "acimaLateral",
  );
  await mudar("acima", false);
  checar("permite somente lateral", !caixa("acima").checked && !caixa("abaixo").checked && (await salvo()) === "lateral");
  await mudar("lateral", false);
  checar("permite nenhum local", (await salvo()) === "nenhum");
  await mudar("acima", true);
  await mudar("abaixo", true);
  checar("abaixo desmarca acima", caixa("abaixo").checked && !caixa("acima").checked && (await salvo()) === "abaixo");
  checar("preserva perguntar ao favoritar", perguntar.checked === false);
  perguntar.checked = true;
  disparar(perguntar, "change");
  await tique();
  checar(
    "perguntar grava",
    ((await sync.obter(CHAVE_PREFERENCIAS))[CHAVE_PREFERENCIAS] as { perguntarAoFavoritar: boolean }).perguntarAoFavoritar,
  );
  await sync.gravar({ [CHAVE_PREFERENCIAS]: { exibir: "acimaLateral" } });
  await tique();
  checar("mudanca externa atualiza caixas", caixa("acima").checked && caixa("lateral").checked && !caixa("abaixo").checked);
  const sem = await montarOpcoesExibicao({ sync, lateralDisponivel: false });
  checar(
    "sem lateral preserva acima",
    (sem.querySelector('input[value="acima"]') as HTMLInputElement).checked && !sem.querySelector('input[value="lateral"]'),
  );
}
