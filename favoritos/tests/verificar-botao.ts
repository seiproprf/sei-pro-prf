import { instalarBotaoArvore, instalarBotaoCaixa, pedirPainelLateral } from "../src/pagina/botao";
import { checar, instalarDom, secao, telaSei, tique } from "./util";

const url = (c: string) => `chrome-extension://x/${c}`;

export async function verificarBotao(): Promise<void> {
  secao("botao Favoritos na barra do Controle de Processos");
  const { doc } = telaSei("sei41/caixa.html");
  let destino: "lateral" | "abaixo" = "abaixo";
  let rolou = 0;
  let abriu = 0;
  const o = { url, destino: () => destino, rolarAtePainel: () => void rolou++, abrirLateral: () => void abriu++ };
  const b = instalarBotaoCaixa(doc, o);
  checar("entra na barra de botoes do SEI", !!b && b.parentElement?.id === "divBotoesControleProcessos");
  checar(
    "icone proprio (cor propria, aparece na barra branca)",
    b?.querySelector("img")?.getAttribute("src") === url("icons/menu/favoritos.svg"),
  );
  checar("nao entra duas vezes", instalarBotaoCaixa(doc, o) === null && doc.querySelectorAll(".spro-fav-botao").length === 1);
  b!.click();
  checar("com 'abaixo da lista', rola ate o painel", rolou === 1 && abriu === 0);
  destino = "lateral";
  b!.click();
  checar("com 'painel lateral', abre o painel", abriu === 1);
  const semBarra = instalarDom("<html><body></body></html>");
  checar("tela sem a barra: nada", instalarBotaoCaixa(semBarra, o) === null);

  secao("botao Favoritos no topo da arvore");
  const arv = instalarDom(
    '<html><body><div id="topmenu"><a target="ifrVisualizacao">50300.000001/2026-01</a><button class="spro-fav-estrela"></button></div></body></html>',
  );
  const ba = instalarBotaoArvore(arv, { url, abrirLateral: () => void abriu++ });
  checar("entra depois da estrela", !!ba && ba.previousElementSibling?.classList.contains("spro-fav-estrela") === true);
  ba!.click();
  checar("abre o painel lateral", abriu === 2);
  checar("nao e confundido com a estrela (delegacao)", !ba!.classList.contains("spro-fav-estrela"));
  checar(
    "sem estrela (tela sem processo), nada",
    instalarBotaoArvore(instalarDom("<html><body></body></html>"), { url, abrirLateral: () => undefined }) === null,
  );

  secao("pedir o painel lateral ao background");
  const janelas: string[] = [];
  pedirPainelLateral(
    async () => undefined,
    (u) => void janelas.push(u),
    url("html/painel.html#aba=favoritos"),
  );
  await tique();
  checar("com background, nao abre janela", janelas.length === 0);
  pedirPainelLateral(
    () => Promise.reject(new Error("Receiving end does not exist")),
    (u) => void janelas.push(u),
    url("html/painel.html#aba=favoritos"),
  );
  await tique();
  checar("sem background (Firefox), abre o painel numa janela", janelas[0] === url("html/painel.html#aba=favoritos"));
}
