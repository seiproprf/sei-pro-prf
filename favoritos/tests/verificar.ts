import { resumo } from "./util";
import { verificarMigracao } from "./verificar-migracao";
import { verificarModelo } from "./verificar-modelo";
import { verificarPrazo } from "./verificar-prazo";
import { verificarRepositorio } from "./verificar-repositorio";

verificarModelo();
verificarPrazo();
await verificarRepositorio();
verificarMigracao();
resumo();
