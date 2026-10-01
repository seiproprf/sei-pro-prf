/**
 * Armazém de dados num Texto Padrão da unidade (`texto_padrao_interno_*`).
 *
 * Genérico: guarda um HTML sob um nome. Quem usa (os favoritos, e no futuro a
 * Distribuição Automática ou configurações da unidade) decide o formato do
 * conteúdo. Receita provada ao vivo no SEI 4.1.5 e no 5.0.4 (prova P1 do
 * favoritos, `docs/superpowers/specs/2026-10-01-favoritos-provas.md`):
 * - a lista vem do link do MENU (o hash é da sessão; nada de montar URL);
 * - consultar e alterar pelos links da própria linha;
 * - criar pela URL do botão "Novo" da lista;
 * - excluir como a função `acaoExcluir` da página: `hdnInfraItemId` no
 *   formulário da lista, postado no link assinado que está no script;
 * - o conteúdo vai em `txaConteudo` como HTML, e o sucesso é provado pela
 *   volta à lista. No SEI 5 o `<textarea>` não tem id: lê-se pelo `name`.
 */

import { Formulario, urlContem } from "../formulario/formulario";
import type { Sei } from "../sei";
import { ErroSei } from "../sessao/erros";
import type { OpcoesHttp, Pagina } from "../sessao/http";

export interface TextoLocalizado {
  id: string;
  consultar: string;
  alterar: string;
}

export interface ArmazemTextoPadrao {
  localizar(op?: OpcoesHttp): Promise<TextoLocalizado | null>;
  /** O HTML guardado (já sem o escape do `<textarea>`), ou null se o texto não existe. */
  ler(op?: OpcoesHttp): Promise<string | null>;
  gravar(html: string, op?: OpcoesHttp): Promise<void>;
  /** true se havia o texto e ele foi excluído. */
  excluir(op?: OpcoesHttp): Promise<boolean>;
}

const FORM_CADASTRO = "#frmTextoPadraoInternoCadastro";
const FORM_LISTA = "#frmTextoPadraoInternoLista";
/** Um teto para a paginação: nenhuma unidade tem tantos textos, e um laço sem fim travaria a aba. */
const MAX_PAGINAS = 40;

const desfazerAmp = (s: string | null | undefined) => (s ?? "").replace(/&amp;/g, "&");

export function criarArmazemTextoPadrao(sei: Sei, o: { nome: string; descricao: string }): ArmazemTextoPadrao {
  const validar = () => {
    if (!o.nome.trim() || o.nome.length > 50) throw new ErroSei("ARGUMENTO_INVALIDO", "O nome do texto padrão deve ter de 1 a 50 caracteres.");
    if (o.descricao.length > 300) throw new ErroSei("ARGUMENTO_INVALIDO", "A descrição do texto padrão passa de 300 caracteres.");
  };

  const linhaNa = (p: Pagina) =>
    [...p.doc.querySelectorAll("table.infraTable tr")].find((tr) => [...tr.querySelectorAll("td")].some((td) => (td.textContent ?? "").trim() === o.nome));

  const daLinha = (tr: Element): TextoLocalizado | null => {
    const id =
      tr.querySelector('input[type="checkbox"]')?.getAttribute("value") ??
      /acaoExcluir\(\s*['"](\d+)/.exec(tr.querySelector('a[onclick*="acaoExcluir"]')?.getAttribute("onclick") ?? "")?.[1];
    const consultar = desfazerAmp(tr.querySelector('a[href*="acao=texto_padrao_interno_consultar"]')?.getAttribute("href"));
    const alterar = desfazerAmp(tr.querySelector('a[href*="acao=texto_padrao_interno_alterar"]')?.getAttribute("href"));
    return id && consultar && alterar ? { id, consultar, alterar } : null;
  };

  /** Percorre a lista (todas as páginas) até achar o texto. Devolve a última página lida. */
  const percorrer = async (op?: OpcoesHttp): Promise<{ pagina: Pagina; primeira: Pagina; achado: TextoLocalizado | null }> => {
    validar();
    const primeira = await sei.http.obter(sei.linkMenu("texto_padrao_interno_listar"), op);
    let pagina = primeira;
    for (let n = 0; n < MAX_PAGINAS; n++) {
      const tr = linhaNa(pagina);
      if (tr) return { pagina, primeira, achado: daLinha(tr) };
      // Há próxima página? O infra só desenha o "+" quando há.
      if (!/infraAcaoPaginar\(\s*['"]\+['"]/.test(pagina.html)) break;
      pagina = await Formulario.de(pagina, FORM_LISTA, sei.http)
        .definir({ hdnInfraPaginaAtual: String(n + 1) })
        .enviar(op);
    }
    return { pagina, primeira, achado: null };
  };

  return {
    async localizar(op) {
      return (await percorrer(op)).achado;
    },

    async ler(op) {
      const { achado } = await percorrer(op);
      if (!achado) return null;
      const p = await sei.http.obter(achado.consultar, op);
      const ta = p.doc.querySelector('textarea[name="txaConteudo"], #txaConteudo');
      return ta?.textContent ?? "";
    },

    async gravar(html, op) {
      const { achado, primeira } = await percorrer(op);
      const opEnvio = { ...op, modos: { txaConteudo: "html" as const }, sucesso: urlContem("texto_padrao_interno_listar") };
      if (achado) {
        const f = await Formulario.abrir(sei.http, achado.alterar, FORM_CADASTRO, op);
        await f.definir({ txaConteudo: html }).enviar({ ...opEnvio, botao: "sbmAlterarTextoPadraoInterno", operacao: "a alteração do texto padrão" });
        return;
      }
      const novo = desfazerAmp(/location\.href\s*=\s*'([^']+)'/.exec(primeira.doc.querySelector("#btnNovo")?.getAttribute("onclick") ?? "")?.[1]);
      if (!novo) throw new ErroSei("SEI_ACAO_INDISPONIVEL", "O SEI não permite a você criar textos padrão nesta unidade.");
      const f = await Formulario.abrir(sei.http, novo, FORM_CADASTRO, op);
      await f
        .definir({ txtNome: o.nome, txtDescricao: o.descricao, txaConteudo: html })
        .enviar({ ...opEnvio, botao: "sbmCadastrarTextoPadraoInterno", operacao: "o cadastro do texto padrão" });
    },

    async excluir(op) {
      const { achado, pagina } = await percorrer(op);
      if (!achado) return false;
      const url = desfazerAmp(/['"](controlador\.php\?acao=texto_padrao_interno_excluir[^'"]+)['"]/.exec(pagina.html)?.[1]);
      if (!url) throw new ErroSei("SEI_ACAO_INDISPONIVEL", "O SEI não oferece a exclusão de textos padrão para você nesta unidade.");
      const form = Formulario.de(pagina, FORM_LISTA, sei.http).definir({ hdnInfraItemId: achado.id });
      await sei.http.enviar(url, form.pares(), { ...op, aceitarValidacao: true });
      return true;
    },
  };
}
