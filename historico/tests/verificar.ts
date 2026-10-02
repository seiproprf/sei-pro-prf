import { resumo } from "./util";
import { verificarCaptura } from "./verificar-captura";
import { verificarDias } from "./verificar-dias";
import { verificarMigracao } from "./verificar-migracao";
import { verificarOperacoes } from "./verificar-operacoes";
import { verificarRepositorio } from "./verificar-repositorio";
import { verificarVisita } from "./verificar-visita";

verificarDias();
verificarVisita();
verificarOperacoes();
await verificarRepositorio();
verificarMigracao();
await verificarCaptura();
resumo();
