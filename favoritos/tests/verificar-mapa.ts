import { carregarLeaflet, localValido, pontosDoMapa } from "../src/app/mapa";
import type { Favorito } from "../src/modelo/tipos";
import { checar, disparar, instalarDom, secao, tique } from "./util";

const fav = (id: string, extra: Partial<Favorito> = {}): Favorito =>
  ({
    id,
    protocolo: `50300.00000${id}/2026-0${id}`,
    etiquetas: [],
    ordem: "a0",
    criadoEm: 1,
    atualizadoEm: 1,
    dispositivo: "X",
    ...extra,
  }) as Favorito;

export async function verificarMapa(): Promise<void> {
  secao("mapa: dados");
  checar("local valido", localValido({ lat: -15.8, lng: -47.9 }));
  checar(
    "recusa NaN, fora de faixa e lixo",
    !localValido({ lat: Number.NaN, lng: 1 }) &&
      !localValido({ lat: 91, lng: 0 }) &&
      !localValido({ lat: 0, lng: 181 }) &&
      !localValido(null) &&
      !localValido({ lat: "1", lng: 2 }),
  );
  const pts = pontosDoMapa([
    fav("1", { local: { lat: -15.8, lng: -47.9 }, titulo: "Obra do porto" }),
    fav("2"),
    fav("3", { local: { lat: 999, lng: 0 } }),
    fav("4", { local: { lat: -3.7, lng: -38.5 }, removidoEm: 5 }),
  ]);
  checar("so quem tem local valido e nao foi removido", pts.length === 1 && pts[0]!.id === "1", pts);
  checar("rotulo com numero e titulo", pts[0]!.rotulo.includes("50300.000001/2026-01") && pts[0]!.rotulo.includes("Obra do porto"));

  secao("mapa: Leaflet sob demanda");
  const doc = instalarDom("<html><head></head><body></body></html>");
  const url = (c: string) => `../${c}`;
  const p1 = carregarLeaflet(doc, url);
  const p2 = carregarLeaflet(doc, url);
  checar("uma carga so por documento", p1 === p2);
  checar("css do Leaflet", doc.querySelectorAll('link[href="../css/leaflet.css"]').length === 1);
  const s1 = doc.querySelector('script[src="../js/lib/leaflet.js"]');
  checar("script do Leaflet", !!s1);
  (globalThis as { L?: unknown }).L = { map: () => ({}) };
  disparar(s1!, "load");
  await tique();
  const s2 = doc.querySelector('script[src="../js/lib/leaflet-geocoder.js"]');
  checar("depois o geocoder (depende do L)", !!s2);
  disparar(s2!, "load");
  const L = await p1;
  checar("entrega o L global", typeof (L as { map?: unknown }).map === "function");
  delete (globalThis as { L?: unknown }).L;
}
