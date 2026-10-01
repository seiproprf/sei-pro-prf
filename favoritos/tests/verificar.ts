import { resumo } from "./util";
import { verificarModelo } from "./verificar-modelo";
import { verificarPrazo } from "./verificar-prazo";
import { verificarRepositorio } from "./verificar-repositorio";

verificarModelo();
verificarPrazo();
await verificarRepositorio();
resumo();
