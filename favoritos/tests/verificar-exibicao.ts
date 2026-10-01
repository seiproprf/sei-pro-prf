import { ondeMostrar, ROTULOS_EXIBIR, temPainelLateral } from "../src/modelo/exibicao";
import { checar, secao } from "./util";

export function verificarExibicao(): void {
  secao("exibicao: onde mostrar os favoritos");
  checar("Chrome com side_panel tem painel lateral", temPainelLateral({ side_panel: { default_path: "html/painel.html" } }));
  checar("Firefox com sidebar_action tem painel lateral", temPainelLateral({ sidebar_action: {} }));
  checar("pacote sem painel lateral", !temPainelLateral({}));
  const so = ondeMostrar("lateral", false);
  checar("sem painel lateral, 'lateral' vira abaixo", so.abaixo && !so.lateral);
  const ambos = ondeMostrar("ambos", true);
  checar("'ambos' com painel mostra os dois", ambos.abaixo && ambos.lateral);
  const lat = ondeMostrar("lateral", true);
  checar("'lateral' com painel esconde o de baixo", !lat.abaixo && lat.lateral);
  const ab = ondeMostrar("abaixo", true);
  checar("'abaixo' com painel nao abre o lateral sozinho", ab.abaixo && !ab.lateral);
  checar("rotulos para as tres opcoes", Object.keys(ROTULOS_EXIBIR).length === 3);
}
