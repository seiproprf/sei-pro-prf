import { codificar, decodificar, deParagrafos, paraParagrafos } from "../src/sincronia/codec";
import { checar, lanca, secao } from "./util";

export async function verificarCodec(): Promise<void> {
  secao("codec: gzip + base64url");
  const dado = {
    nome: "Ação — “Ok” 🚢 São Paulo",
    lista: Array.from({ length: 5000 }, (_, i) => ({ id: String(i), t: `processo ${i} – ç` })),
  };
  const b64 = await codificar(dado);
  checar("so caracteres base64url", /^[A-Za-z0-9_-]+$/.test(b64));
  checar("comprime (5 mil itens bem menor que o JSON)", b64.length < JSON.stringify(dado).length / 3, b64.length);
  checar("ida e volta identica (acentos, travessao, aspas curvas, emoji)", JSON.stringify(await decodificar(b64)) === JSON.stringify(dado));
  checar("base64 corrompido rejeita", !!(await lanca(() => decodificar(`${b64.slice(0, 40)}!!!`))));

  secao("codec: paragrafos do Texto Padrao");
  const html = paraParagrafos("Dados internos do SEI Pro — favoritos de Ana. Não use em documentos nem edite.", b64);
  const blocos = html.match(/<p>[A-Za-z0-9_-]+<\/p>/g) ?? [];
  checar("blocos de no maximo 2000", blocos.length > 1 && blocos.every((b) => b.length <= 2007));
  checar("paragrafo legivel primeiro", html.startsWith("<p>Dados internos do SEI Pro"));
  checar("le de volta", deParagrafos(html) === b64);
  const duplo = html.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  checar("le com escape duplo (SEI 5)", deParagrafos(duplo) === b64);
  const comQuebras = html.replace(/<\/p>/g, "</p>\r\n").replace(/<p>/g, '<p class="x">');
  checar("le com quebras e atributos", deParagrafos(comQuebras) === b64);
  checar("sem blocos, null", deParagrafos("<p>texto qualquer de um colega</p>") === null);
  checar(
    "legivel com escape (&amp;) nao atrapalha",
    deParagrafos(paraParagrafos("A & B <x>", "abc_DEF-123".repeat(3))) === "abc_DEF-123".repeat(3),
  );
}
