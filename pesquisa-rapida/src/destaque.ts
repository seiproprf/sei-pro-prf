import { faixas } from './texto';
import { BARRAS, TABELAS } from './leitura';
export const DESTAQUE = 'spro-pesquisa-destaque';
export function limpar(doc: Document) {
  for (const marca of doc.querySelectorAll(`.${DESTAQUE}`)) {
    const pai = marca.parentNode;
    marca.replaceWith(doc.createTextNode(marca.textContent ?? ''));
    pai?.normalize();
  }
}
export function destacar(doc: Document, termos: string[], lista: boolean) {
  limpar(doc);
  if (!termos.length || !doc.body || (doc.contentType && !/html|^text\//.test(doc.contentType))) return;
  const escopo = lista ? (doc.querySelector('#divInfraAreaTelaD, #divInfraAreaTela') ?? doc.body) : doc.body;
  const walker = doc.createTreeWalker(escopo, 4);
  const nos: Text[] = [];
  while (walker.nextNode()) {
    const no = walker.currentNode as Text;
    const pai = no.parentElement;
    if (
      !pai ||
      pai.closest(
        `${BARRAS}, script, style, title, noscript, textarea, input, select, option, button, [contenteditable], [hidden], [aria-hidden="true"], .${DESTAQUE}`,
      )
    )
      continue;
    if (lista && pai.closest(TABELAS)) continue;
    nos.push(no);
  }
  for (const no of nos) {
    const texto = no.nodeValue ?? '';
    const trechos = faixas(texto, termos);
    if (!trechos.length) continue;
    const fragmento = doc.createDocumentFragment();
    let pos = 0;
    for (const f of trechos) {
      fragmento.append(doc.createTextNode(texto.slice(pos, f.inicio)));
      const marca = doc.createElement('span');
      marca.className = DESTAQUE;
      marca.textContent = texto.slice(f.inicio, f.fim);
      fragmento.append(marca);
      pos = f.fim;
    }
    fragmento.append(doc.createTextNode(texto.slice(pos)));
    no.replaceWith(fragmento);
  }
}
