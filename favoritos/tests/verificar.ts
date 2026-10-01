import { resumo } from "./util";
import { verificarMigracao } from "./verificar-migracao";
import { verificarModelo } from "./verificar-modelo";
import { verificarPagina } from "./verificar-pagina";
import { verificarPrazo } from "./verificar-prazo";
import { verificarRepositorio } from "./verificar-repositorio";

verificarModelo();
verificarPrazo();
await verificarRepositorio();
verificarMigracao();
await verificarPagina();
resumo();
