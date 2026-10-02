/**
 * CSV para planilha brasileira: separador ";", BOM para o Excel ler UTF-8 e
 * aspas quando preciso. Célula que começa com = + - @ é neutralizada com
 * apóstrofo: uma nota digitada como fórmula não pode virar fórmula na planilha.
 */

export function gerarCsv(linhas: string[][]): string {
  const campo = (bruto: string) => {
    const v = /^[=+\-@\t\r]/.test(bruto) ? `'${bruto}` : bruto;
    return /[;"\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  };
  return `\uFEFF${linhas.map((l) => l.map(campo).join(";")).join("\r\n")}`;
}
