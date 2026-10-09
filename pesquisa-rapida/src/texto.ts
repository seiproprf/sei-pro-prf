/** Comparação local; pontuação não separa números e palavras ficam no mesmo campo. */
export function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}
export function tokens(texto: string): string[] {
  const valor = normalizar(texto);
  return valor.replace(/\s/g, '').length < 3 ? [] : [...new Set(valor.split(' '))];
}
export function corresponde(campos: string[], termos: string[]): boolean {
  return !termos.length || campos.some((campo) => termos.every((termo) => normalizar(campo).includes(termo)));
}
/** Faixas no texto original, inclusive a pontuação entre caracteres casados. */
export function faixas(texto: string, termos: string[]): Array<{ inicio: number; fim: number }> {
  let limpo = '';
  const mapa: Array<{ inicio: number; fim: number }> = [];
  let pos = 0;
  for (const letra of texto) {
    const inicio = pos;
    pos += letra.length;
    const valor = normalizar(letra);
    for (const c of valor) {
      limpo += c;
      mapa.push({ inicio, fim: pos });
    }
    if (/\s/u.test(letra)) {
      limpo += ' ';
      mapa.push({ inicio, fim: pos });
    }
  }
  const todas: Array<{ inicio: number; fim: number }> = [];
  for (const termo of termos) {
    let desde = 0;
    while (desde < limpo.length) {
      const i = limpo.indexOf(termo, desde);
      if (i < 0) break;
      todas.push({ inicio: mapa[i]!.inicio, fim: mapa[i + termo.length - 1]!.fim });
      desde = i + termo.length;
    }
  }
  const unidas: typeof todas = [];
  for (const f of todas.sort((a, b) => a.inicio - b.inicio)) {
    const anterior = unidas.at(-1);
    if (anterior && f.inicio <= anterior.fim) anterior.fim = Math.max(anterior.fim, f.fim);
    else unidas.push(f);
  }
  return unidas;
}
