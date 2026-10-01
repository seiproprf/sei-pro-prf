import { resumo } from "./util";
import { verificarBalao } from "./verificar-balao";
import { verificarMigracao } from "./verificar-migracao";
import { verificarModelo } from "./verificar-modelo";
import { verificarPagina } from "./verificar-pagina";
import { verificarPainel } from "./verificar-painel";
import { verificarPrazo } from "./verificar-prazo";
import { verificarRepositorio } from "./verificar-repositorio";

verificarModelo();
verificarPrazo();
await verificarRepositorio();
verificarMigracao();
await verificarPagina();
await verificarBalao();
await verificarPainel();
resumo();
