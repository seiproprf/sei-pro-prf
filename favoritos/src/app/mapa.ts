/**
 * Mapa dos favoritos (paridade com o legado, com três correções do spec 7.6):
 * - sem `map.locate`: o legado pedia a geolocalização a cada 3 s ao abrir o
 *   mapa de um favorito sem local;
 * - tiles do OSM com a configuração do próprio OSM (256 px, zoom até 19), e
 *   não a do Mapbox que o legado copiou;
 * - o mapa geral usa os itens visíveis da lista (com o filtro aplicado) e não
 *   procura linha de tabela, que era o que quebrava com filtro.
 *
 * O Leaflet (já empacotado em js/lib) só carrega quando um mapa é aberto. A
 * rede vai ao OSM (tiles) e, se o usuário buscar um endereço, ao Nominatim,
 * como no legado; os dois estão na política de privacidade.
 */

import { h } from "@comum/ui/dom";
import type { Favorito } from "../modelo/tipos";

export interface Ponto {
  id: string;
  lat: number;
  lng: number;
  rotulo: string;
}

export function localValido(v: unknown): v is { lat: number; lng: number } {
  const p = v as { lat?: unknown; lng?: unknown } | null;
  return (
    !!p &&
    typeof p.lat === "number" &&
    typeof p.lng === "number" &&
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    Math.abs(p.lat) <= 90 &&
    Math.abs(p.lng) <= 180
  );
}

export function pontosDoMapa(favs: Favorito[]): Ponto[] {
  return favs
    .filter((f) => f.removidoEm === undefined && localValido(f.local))
    .map((f) => ({
      id: f.id,
      lat: f.local!.lat,
      lng: f.local!.lng,
      rotulo: [f.protocolo, f.titulo || [f.tipo, f.especificacao].filter(Boolean).join(" · ")].filter(Boolean).join(" — "),
    }));
}

/* O pedaço do Leaflet 1.7 que o favoritos usa. */
// biome-ignore lint/suspicious/noExplicitAny: API externa sem tipos no pacote.
type Qualquer = any;
export interface LeafletMinimo {
  map(el: HTMLElement, o?: Record<string, unknown>): Qualquer;
  tileLayer(url: string, o: Record<string, unknown>): Qualquer;
  marker(p: [number, number]): Qualquer;
  latLngBounds(p: Array<[number, number]>): Qualquer;
  Control?: { geocoder?: (o: Record<string, unknown>) => Qualquer; Geocoder?: { nominatim?: () => Qualquer } };
}

const cargas = new WeakMap<Document, Promise<LeafletMinimo>>();

export function carregarLeaflet(doc: Document, url: (c: string) => string): Promise<LeafletMinimo> {
  const ja = cargas.get(doc);
  if (ja) return ja;
  const carga = new Promise<LeafletMinimo>((ok, erro) => {
    doc.head.append(h("link", { rel: "stylesheet", href: url("css/leaflet.css") }));
    const script = (src: string) =>
      new Promise<void>((pronto, falha) => {
        const s = h("script", { src });
        s.addEventListener("load", () => pronto(), { once: true });
        s.addEventListener("error", () => falha(new Error(`Não foi possível carregar ${src}`)), { once: true });
        doc.head.append(s);
      });
    script(url("js/lib/leaflet.js"))
      .then(() => script(url("js/lib/leaflet-geocoder.js")).catch(() => undefined))
      .then(() => {
        const L = (globalThis as { L?: LeafletMinimo }).L;
        if (L) ok(L);
        else erro(new Error("O Leaflet não carregou."));
      }, erro);
  });
  cargas.set(doc, carga);
  carga.catch(() => cargas.delete(doc));
  return carga;
}

const TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATRIBUICAO = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';
/** Brasil inteiro, quando o favorito ainda não tem local. */
const CENTRO_PADRAO: [number, number] = [-14.2, -51.9];

function baseDoMapa(L: LeafletMinimo, el: HTMLElement, centro: [number, number], zoom: number): Qualquer {
  const mapa = L.map(el, { zoomControl: true }).setView(centro, zoom);
  L.tileLayer(TILES, { maxZoom: 19, attribution: ATRIBUICAO }).addTo(mapa);
  return mapa;
}
function comBusca(L: LeafletMinimo, mapa: Qualquer, aoAchar: (p: [number, number], rotulo: string) => void): void {
  const fazer = L.Control?.geocoder;
  if (typeof fazer !== "function") return;
  fazer({ placeholder: "Buscar endereço…", defaultMarkGeocode: false, geocoder: L.Control?.Geocoder?.nominatim?.() })
    .on("markgeocode", (e: Qualquer) => {
      const c = e.geocode.center ?? e.geocode.bbox.getCenter();
      aoAchar([c.lat, c.lng], String(e.geocode.name ?? ""));
    })
    .addTo(mapa);
}

/** Corpo do diálogo "Local no mapa" de um favorito. */
export function montarMapaFavorito(o: {
  L: LeafletMinimo;
  favorito: Favorito;
  salvar(local: { lat: number; lng: number } | undefined): Promise<void>;
  fechar(): void;
}): { el: HTMLElement; iniciar(): void } {
  const area = h("div", { class: "fav-mapa" });
  let escolhido: [number, number] | null = localValido(o.favorito.local) ? [o.favorito.local.lat, o.favorito.local.lng] : null;
  const salvar = h("button", { type: "button", class: "spro-botao primario", disabled: !escolhido }, "Salvar");
  const el = h(
    "div",
    { class: "fav-form" },
    h("p", { class: "fav-dica" }, "Clique no mapa para marcar o local do processo, ou busque um endereço na lupa."),
    area,
    h(
      "div",
      { class: "spro-dialogo-rodape" },
      localValido(o.favorito.local)
        ? h(
            "button",
            {
              type: "button",
              class: "spro-botao perigo",
              onclick: () => void o.salvar(undefined).then(() => o.fechar()),
            },
            "Remover local",
          )
        : null,
      h("button", { type: "button", class: "spro-botao", onclick: () => o.fechar() }, "Cancelar"),
      salvar,
    ),
  );
  salvar.addEventListener("click", () => {
    if (escolhido) void o.salvar({ lat: escolhido[0], lng: escolhido[1] }).then(() => o.fechar());
  });
  const iniciar = () => {
    const mapa = baseDoMapa(o.L, area, escolhido ?? CENTRO_PADRAO, escolhido ? 16 : 4);
    let marca: Qualquer = escolhido ? o.L.marker(escolhido).addTo(mapa) : null;
    const marcar = (p: [number, number]) => {
      escolhido = p;
      if (marca) marca.setLatLng(p);
      else marca = o.L.marker(p).addTo(mapa);
      salvar.disabled = false;
    };
    mapa.on("click", (e: Qualquer) => marcar([e.latlng.lat, e.latlng.lng]));
    comBusca(o.L, mapa, (p) => {
      marcar(p);
      mapa.setView(p, 16);
    });
    // O diálogo acabou de abrir: o Leaflet mede o contêiner de novo.
    setTimeout(() => mapa.invalidateSize(), 50);
  };
  return { el, iniciar };
}

/** Corpo do diálogo "Mapa dos favoritos": um marcador por favorito visível com local. */
export function montarMapaGeral(o: { L: LeafletMinimo; pontos: Ponto[]; abrir(id: string): void }): { el: HTMLElement; iniciar(): void } {
  const area = h("div", { class: "fav-mapa fav-mapa-geral" });
  const el = h(
    "div",
    { class: "fav-form" },
    o.pontos.length
      ? h(
          "p",
          { class: "fav-dica" },
          `${o.pontos.length} ${o.pontos.length === 1 ? "favorito com local" : "favoritos com local"} na lista atual (com os filtros aplicados).`,
        )
      : h("p", { class: "fav-dica" }, "Nenhum favorito desta lista tem local. Marque pelo menu ⋯ do favorito, em “Local no mapa…”."),
    area,
  );
  const iniciar = () => {
    const mapa = baseDoMapa(o.L, area, CENTRO_PADRAO, 4);
    for (const p of o.pontos) {
      const abrir = h("button", { type: "button", class: "spro-botao", onclick: () => o.abrir(p.id) }, "Abrir processo");
      o.L.marker([p.lat, p.lng])
        .addTo(mapa)
        .bindPopup(h("div", { class: "fav-mapa-popup" }, h("strong", {}, p.rotulo), abrir));
    }
    if (o.pontos.length)
      mapa.fitBounds(o.L.latLngBounds(o.pontos.map((p) => [p.lat, p.lng] as [number, number])), { maxZoom: 15, padding: [24, 24] });
    setTimeout(() => mapa.invalidateSize(), 50);
  };
  return { el, iniciar };
}
