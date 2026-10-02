import { resumo } from "./util";
import { verificarApp } from "./verificar-app";
import { verificarCaptura } from "./verificar-captura";
import { verificarComponentes } from "./verificar-componentes";
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
verificarComponentes();
await verificarApp();
resumo();
