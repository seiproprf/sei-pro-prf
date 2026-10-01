/**
 * A caixa da tela está FILTRADA? O SEI guarda os filtros do Controle de
 * Processos por usuário (procedimento_controlar.php, 3.1.7 e 5.0.0:
 * `salvarCamposPost('hdnMeusProcessos', hdnIdMarcador<unidade>…)` e os
 * filtros do painel `nao_visualizados`, `recebidos`…). Com filtro, o
 * "N registros" do título é o do recorte: uma caixa filtrada não pode servir
 * de trava do "Atualizar fora da unidade" (um processo aberto na unidade, mas
 * fora do recorte, teria a árvore aberta e o SEI registraria o recebimento),
 * nem para concluir que um favorito "saiu da unidade".
 *
 * Devolve uma descrição do filtro, ou null se a caixa está completa.
 */

export function filtroAtivoNaCaixa(doc: Document): string | null {
  const campo = (seletor: string) => doc.querySelector<HTMLInputElement>(seletor)?.getAttribute("value")?.trim() ?? "";
  const visualizacao = campo("#hdnTipoVisualizacao");
  if (visualizacao && visualizacao !== "R") return "visualização detalhada (use a resumida)";
  const meus = campo("#hdnMeusProcessos");
  if (meus && meus !== "T") return "só os processos atribuídos a você";
  for (const [prefixo, rotulo] of [
    ["hdnIdMarcador", "filtro por marcador"],
    ["hdnIdTipoProcedimento", "filtro por tipo de processo"],
    ["hdnIdTipoPrioridade", "filtro por prioridade"],
  ] as const) {
    if ([...doc.querySelectorAll<HTMLInputElement>(`input[id^="${prefixo}"]`)].some((i) => (i.getAttribute("value") ?? "").trim())) return rotulo;
  }
  const caixinhas = [...doc.querySelectorAll(".caixaFiltroControle")].map((c) => (c.textContent ?? "").trim()).filter(Boolean);
  if (caixinhas.length) return `filtro ativo: ${caixinhas.join(", ")}`;
  if (doc.querySelector("#btnLiberarMarcador")) return "filtro por marcador";
  if (doc.querySelector("#tblMarcadores")) return "caixa agrupada por marcadores";
  for (const id of ["#tblProcessosRecebidos", "#tblProcessosGerados"]) {
    const destaque = doc.querySelector(`${id} caption b`);
    if (destaque) return `filtro do painel: ${(destaque.textContent ?? "").trim()}`;
  }
  // SEI 4+/5: as opções de filtro ("atribuídos a mim", "ver por marcadores"…) só aparecem SEM filtro do
  // painel (`$bolOpcoesFiltro`). Na barra nova (#divFiltro), sumir a opção e a caixinha dela = filtro.
  if (doc.querySelector("#divFiltro") && !doc.querySelector("#lnkAtribuidosMim, #divFiltroMeusProcessos")) return "filtro do painel de controle";
  return null;
}
