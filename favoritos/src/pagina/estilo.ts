/**
 * CSS mínimo das estrelas, injetado uma vez por documento. As classes têm o
 * prefixo `spro-fav-` para não colidir com o SEI nem com o legado. Uma folha
 * nova em dist/css exigiria mexer nos manifests de todos os pacotes.
 */
const ID = "spro-fav-estilo";
const CSS = `.spro-fav-estrela{background:none;border:0;padding:0 3px;margin:0 2px;cursor:pointer;color:#8a8a8a;vertical-align:middle;line-height:0}
.spro-fav-estrela:hover{color:#5f5f5f}
.spro-fav-estrela[aria-pressed="true"]{color:#e0a100}
.spro-fav-estrela:focus-visible{outline:2px solid #1a73e8;outline-offset:1px;border-radius:3px}
.spro-fav-titulo{display:flex!important;align-items:center;gap:6px}
.spro-fav-recolher{margin-left:auto;background:none;border:0;cursor:pointer;color:inherit;line-height:0;padding:2px}`;

export function instalarEstilo(doc: Document): void {
  if (doc.getElementById(ID)) return;
  const s = doc.createElement("style");
  s.id = ID;
  s.textContent = CSS;
  (doc.head ?? doc.documentElement).append(s);
}
