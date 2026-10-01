import { resumo } from "./util";
import { verificarArmazenamento } from "./verificar-armazenamento";
import { verificarDatas } from "./verificar-datas";
import { verificarEntidade } from "./verificar-entidade";
import { verificarId } from "./verificar-id";
import { verificarOpcoes } from "./verificar-opcoes";
import { verificarRpc } from "./verificar-rpc";
import { verificarUi } from "./verificar-ui";

verificarDatas();
verificarUi();
await verificarArmazenamento();
verificarEntidade();
await verificarOpcoes();
await verificarRpc();
verificarId();
resumo();
