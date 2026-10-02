import { lerEnvelope } from "../src/arquivo";
import { checar, secao } from "./util";
import { CTX } from "./verificar-modelo";

export function verificarValidacaoCampos(): void {
  secao("importacao: campos novos editados a mao nao derrubam o app");
  const base = { protocolo: "P1", etiquetas: [], ordem: "a0", criadoEm: 1, atualizadoEm: 2, dispositivo: "X" };
  const env = {
    formato: "seipro-favoritos",
    versao: 1,
    escopos: [
      {
        escopo: { host: CTX.host, login: "pedro.soares", lista: "pessoal" },
        favoritos: [
          {
            ...base,
            id: "1",
            lembrete: { texto: "sem data" },
            documentos: "abc",
            visto: "ontem",
            local: { lat: 999, lng: 1 },
            fixado: "sim",
          },
          {
            ...base,
            id: "2",
            lembrete: { em: "2026-10-05", texto: 7 },
            documentos: [{ id: "9", numero: "0104019", titulo: "Despacho" }, { id: 3 }, "x"],
          },
          { ...base, id: "3", lembrete: { em: "2026-10-05", texto: "ligar" }, local: { lat: -15.8, lng: -47.9 }, fixado: true },
        ],
        pastas: [],
        etiquetas: [],
      },
    ],
    gravadoEm: 1,
    dispositivo: "X",
    revisao: 0,
  };
  const r = lerEnvelope(env)!;
  const [f1, f2, f3] = r.envelope.escopos[0]!.favoritos;
  checar("os favoritos ficam (so os campos quebrados saem)", r.envelope.escopos[0]!.favoritos.length === 3 && r.descartados === 0, r);
  checar("lembrete sem data sai", f1!.lembrete === undefined);
  checar("documentos que nao sao lista saem", f1!.documentos === undefined);
  checar("visto que nao e leitura sai", f1!.visto === undefined);
  checar("local fora do mapa sai", f1!.local === undefined);
  checar(
    "lembrete com texto que nao e texto fica so com a data",
    f2!.lembrete?.em === "2026-10-05" && f2!.lembrete?.texto === undefined,
    f2!.lembrete,
  );
  checar(
    "so os documentos validos ficam",
    f2!.documentos?.length === 1 && f2!.documentos[0]!.numero === "0104019" && typeof f2!.documentos[0]!.criadoEm === "number",
    f2!.documentos,
  );
  checar("validos ficam como estao", f3!.lembrete?.texto === "ligar" && f3!.local?.lat === -15.8);
  checar("fixado so vale como true", (f1 as { fixado?: unknown }).fixado === undefined && f3!.fixado === true);
}
