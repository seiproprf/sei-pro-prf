import { resumo } from "./util";
import { verificarArmazenamento } from "./verificar-armazenamento";
import { verificarDatas } from "./verificar-datas";
import { verificarUi } from "./verificar-ui";

verificarDatas();
verificarUi();
await verificarArmazenamento();
resumo();
