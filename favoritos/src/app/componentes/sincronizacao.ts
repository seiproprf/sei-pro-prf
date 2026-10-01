/**
 * Diálogo "Sincronização": as três formas de não perder os favoritos, numa
 * tela só — o Texto Padrão da unidade, o arquivo numa pasta da nuvem e as
 * cópias diárias deste navegador.
 */

import { formatarData } from "@comum/datas/dias";
import { h } from "@comum/ui/dom";
import type { StatusArquivo } from "../../sincronia/arquivoSync";
import type { Copia } from "../../sincronia/copias";

export interface DepsSincronizacao {
  textoPadrao: {
    sigla: string;
    nomeTexto: string;
    ligado: boolean;
    situacao(): Promise<string>;
    ligar(): void;
    agora(): Promise<void>;
    desligar(): void;
    apagar(): Promise<void>;
  } | null;
  arquivo: {
    status(): Promise<StatusArquivo | null>;
    configurado(): Promise<boolean>;
    escolher(modo: "novo" | "existente"): Promise<void>;
    reconectar(): Promise<void>;
    agora(): Promise<void>;
    esquecer(): Promise<void>;
  } | null;
  copias: { listar(): Promise<Copia[]>; restaurar(c: Copia): Promise<void> } | null;
  confirmar(texto: string): Promise<boolean>;
}

const botao = (rotulo: string, fazer: () => unknown, classe = "spro-botao") =>
  h("button", { type: "button", class: classe, onclick: () => void fazer() }, rotulo);

export async function montarSincronizacao(d: DepsSincronizacao): Promise<HTMLElement> {
  const secoes: HTMLElement[] = [];

  if (d.textoPadrao) {
    const tp = d.textoPadrao;
    const situacao = h("p", { class: "fav-dica" }, await tp.situacao());
    secoes.push(
      h(
        "section",
        { class: "fav-sync-secao" },
        h("h3", {}, `Texto Padrão da ${tp.sigla}`),
        h(
          "p",
          { class: "fav-dica" },
          `A lista da ${tp.sigla} vai para o texto “${tp.nomeTexto}”, visível para a unidade. A Pessoal e os sigilosos não vão.`,
        ),
        situacao,
        tp.ligado
          ? h(
              "div",
              { class: "linha" },
              botao("Sincronizar agora", async () => {
                await tp.agora();
                situacao.textContent = await tp.situacao();
              }),
              botao("Desligar", () => tp.desligar()),
              botao(
                "Desligar e apagar do SEI",
                async () => {
                  if (await d.confirmar(`Apagar do SEI o texto “${tp.nomeTexto}” e desligar? Os favoritos continuam neste navegador.`))
                    await tp.apagar();
                },
                "spro-botao perigo",
              ),
            )
          : h(
              "div",
              { class: "linha" },
              botao("Ligar…", () => tp.ligar(), "spro-botao primario"),
            ),
      ),
    );
  }

  const arq = h("section", { class: "fav-sync-secao" }, h("h3", {}, "Arquivo numa pasta da nuvem"));
  if (d.arquivo) {
    const a = d.arquivo;
    const corpo = h("div", {});
    const pintar = async () => {
      const [st, ok] = await Promise.all([a.status(), a.configurado()]);
      const linha = !ok
        ? "Escolha um arquivo numa pasta que já sincroniza com a nuvem (OneDrive, Google Drive, Dropbox ou rede). Ele leva todas as suas listas, inclusive a Pessoal."
        : st?.estado === "ok"
          ? `Ligado a “${st.nome ?? "arquivo"}”. Última sincronia: ${new Date(st.quando).toLocaleString("pt-BR")}.${st.mensagem ? ` ${st.mensagem}` : ""}`
          : st?.estado === "permissao"
            ? `O navegador pede de novo a permissão de “${st.nome ?? "arquivo"}”.`
            : `Erro no arquivo: ${st?.mensagem ?? "tente de novo"}`;
      const acao = (f: () => Promise<void>) => async () => {
        await f();
        await pintar();
      };
      corpo.replaceChildren(
        h("p", { class: "fav-dica" }, linha),
        h(
          "div",
          { class: "linha" },
          ...(ok
            ? [
                st?.estado === "permissao"
                  ? botao("Reconectar arquivo", acao(a.reconectar), "spro-botao primario")
                  : botao("Sincronizar agora", acao(a.agora)),
                botao(
                  "Trocar arquivo…",
                  acao(() => a.escolher("existente")),
                ),
                botao("Parar de usar o arquivo", acao(a.esquecer)),
              ]
            : [
                botao(
                  "Criar arquivo…",
                  acao(() => a.escolher("novo")),
                  "spro-botao primario",
                ),
                botao(
                  "Usar um arquivo existente…",
                  acao(() => a.escolher("existente")),
                ),
              ]),
        ),
      );
    };
    await pintar();
    arq.append(corpo);
  } else {
    arq.append(
      h(
        "p",
        { class: "fav-dica" },
        "Aqui não dá para manter um arquivo ligado (o navegador não permite, ou a lista está embutida na página do SEI). Use “Exportar” e “Importar” no menu, ou abra os favoritos no painel lateral.",
      ),
    );
  }
  secoes.push(arq);

  if (d.copias) {
    const c = d.copias;
    const lista = await c.listar();
    secoes.push(
      h(
        "section",
        { class: "fav-sync-secao" },
        h("h3", {}, "Cópias deste navegador"),
        h(
          "p",
          { class: "fav-dica" },
          "Uma por dia, as 14 mais recentes. Restaurar traz de volta o que estava na cópia e mantém o que entrou depois.",
        ),
        lista.length
          ? h(
              "ul",
              { class: "fav-copias" },
              ...lista.map((x) =>
                h(
                  "li",
                  {},
                  h("span", {}, `${formatarData(x.dia)} — ${x.quantidade} ${x.quantidade === 1 ? "favorito" : "favoritos"}`),
                  botao("Restaurar", async () => {
                    if (await d.confirmar(`Restaurar a cópia de ${formatarData(x.dia)}?`)) await c.restaurar(x);
                  }),
                ),
              ),
            )
          : h("p", { class: "fav-dica" }, "Ainda não há cópias."),
      ),
    );
  }

  return h("div", { class: "fav-form fav-sync" }, ...secoes);
}
