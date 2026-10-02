/* GERADO por favoritos/build.mjs. NAO EDITE ESTE ARQUIVO. Rode: npm run build */
"use strict";(()=>{function _o(e,o){return{obter:(t=null)=>e.get(t),gravar:t=>e.set(t),remover:t=>e.remove(t),chaves:typeof e.getKeys=="function"?()=>e.getKeys():void 0,aoMudar(t){let r=(a,i)=>{i===o&&t(a)};return chrome.storage.onChanged.addListener(r),()=>chrome.storage.onChanged.removeListener(r)}}}function no(e=crypto){if(typeof e.randomUUID=="function")return e.randomUUID();let o=e.getRandomValues(new Uint8Array(16));o[6]=(o[6]??0)&15|64,o[8]=(o[8]??0)&63|128;let t=[...o].map(r=>r.toString(16).padStart(2,"0")).join("");return`${t.slice(0,8)}-${t.slice(8,12)}-${t.slice(12,16)}-${t.slice(16,20)}-${t.slice(20)}`}async function ce(e,o="seipro/dispositivo"){let t=(await e.obter(o))[o];if(typeof t=="string"&&t)return t;let r=no();return await e.gravar({[o]:r}),r}var le=e=>String(e).padStart(2,"0");function so(e=new Date){return`${e.getFullYear()}-${le(e.getMonth()+1)}-${le(e.getDate())}`}function Cr(e){let o=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!o)throw new Error(`Data inv\xE1lida: ${e}`);return new Date(Number(o[1]),Number(o[2])-1,Number(o[3]),12)}function co(e,o){let t=Cr(e);return t.setDate(t.getDate()+o),so(t)}function bo(e){let[o,t,r]=e.split("-");return`${r}/${t}/${o}`}function Tr(e,o){let t=e;if(typeof e=="string"){if(!e.trim())return!0;try{t=JSON.parse(e)}catch{return!0}}if(!Array.isArray(t)||t.length===0)return!0;let a=t.map(i=>i?.configGeral).find(Array.isArray)?.find(i=>i?.name===o)?.value;return!(a===!1||a===0||a==="")}async function de(e,o=chrome.storage.sync){let t=await o.get("dataValues");return Tr(t.dataValues,e)}var T=class extends Error{constructor(t,r){super(r);this.codigo=t;this.name="ErroRpc"}};function xo(e,o={}){let t=0,r=!0,a=new Map,i=[],n=()=>{if(r){r=!1;for(let[,c]of a)clearTimeout(c.timer),c.erro(new T("DESCONECTADO","A conex\xE3o com a aba do SEI caiu."));a.clear();for(let c of i)c()}},s=c=>{r&&e.postMessage(c)};return e.onMessage.addListener(c=>{let l=c;if(l?.rpc==="resposta"&&typeof l.id=="number"){let u=a.get(l.id);if(!u)return;a.delete(l.id),clearTimeout(u.timer),l.ok?u.ok(l.valor):u.erro(new T(l.erro?.codigo??"ERRO",l.erro?.mensagem??"Falha."));return}if(l?.rpc!=="pedido"||typeof l.id!="number"||typeof l.op!="string")return;let d=l.id,p=l.op;(async()=>{try{let u=o[p];if(!u)throw new T("OP_DESCONHECIDA",`Opera\xE7\xE3o desconhecida: ${p}`);s({rpc:"resposta",id:d,ok:!0,valor:await u(l.args)})}catch(u){let m=u.codigo;s({rpc:"resposta",id:d,ok:!1,erro:{codigo:typeof m=="string"?m:"ERRO",mensagem:u instanceof Error?u.message:String(u)}})}})()}),e.onDisconnect.addListener(n),{get aberta(){return r},chamar(c,l,d=15e3){if(!r)return Promise.reject(new T("DESCONECTADO","A conex\xE3o com a aba do SEI caiu."));let p=++t;return new Promise((u,m)=>{let v=setTimeout(()=>{a.delete(p),m(new T("PRAZO",`A aba do SEI n\xE3o respondeu a tempo (${c}).`))},d);a.set(p,{ok:u,erro:m,timer:v}),e.postMessage({rpc:"pedido",id:p,op:c,args:l})})},aoFechar(c){i.push(c)},fechar(){r&&(e.disconnect(),n())}}}var ue=`/*
 * Base visual dos m\xF3dulos novos do SEI Pro.
 *
 * Tokens no :root (e no :host, para valerem dentro de Shadow DOM: o bal\xE3o que o
 * content script abre na p\xE1gina do SEI). O modo escuro vem de duas formas:
 * for\xE7ado por data-tema (o painel abaixo da lista segue o SEI, que s\xF3 \xE9 escuro
 * com o modo noturno do SEI Pro) ou pelo sistema, quando ningu\xE9m for\xE7ou nada
 * (o painel lateral). A cor de destaque pode vir do tema do SEI
 * (--spro-cor-sei, posta pelo app embutido).
 */
:root,
:host {
  --spro-fundo: #ffffff;
  --spro-fundo-2: #f6f7f9;
  --spro-fundo-3: #eceef2;
  --spro-pagina: #f3f4f7;
  --spro-texto: #1b1f24;
  --spro-suave: #5d6772;
  --spro-fraco: #8b939c;
  --spro-borda: #e3e6eb;
  --spro-borda-forte: #cfd4db;
  --spro-destaque: #1f5fbf;
  --spro-destaque-texto: #ffffff;
  --spro-perigo: #d1352b;
  --spro-aviso: #b45c0a;
  --spro-ok: #12805c;
  --spro-novidade: #6d4fd8;
  --spro-estrela: #f2a516;
  --spro-sombra-1: 0 1px 2px rgb(16 24 40 / 6%);
  --spro-sombra-2: 0 2px 4px -2px rgb(16 24 40 / 8%), 0 6px 14px -4px rgb(16 24 40 / 12%);
  --spro-sombra-3: 0 10px 24px -6px rgb(16 24 40 / 18%), 0 24px 56px -12px rgb(16 24 40 / 24%);
  --spro-veu: rgb(17 21 28 / 46%);
  --spro-raio-p: 6px;
  --spro-raio: 8px;
  --spro-raio-g: 12px;
  --spro-raio-xg: 16px;
  --spro-fonte: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --spro-mono: ui-monospace, "SF Mono", "Cascadia Mono", "Roboto Mono", Menlo, Consolas, monospace;
  --spro-dur: 150ms;
  --spro-curva: cubic-bezier(0.2, 0.8, 0.2, 1);
  --spro-destaque-suave: color-mix(in srgb, var(--spro-destaque) 10%, transparent);
  --spro-destaque-medio: color-mix(in srgb, var(--spro-destaque) 18%, transparent);
  --spro-anel: 0 0 0 3px color-mix(in srgb, var(--spro-destaque) 30%, transparent);
  color-scheme: light;
}
:root[data-tema="escuro"],
:host([data-tema="escuro"]) {
  --spro-fundo: #1a1d21;
  --spro-fundo-2: #22262b;
  --spro-fundo-3: #2b3036;
  --spro-pagina: #141619;
  --spro-texto: #e7e9ec;
  --spro-suave: #a4abb3;
  --spro-fraco: #767e87;
  --spro-borda: #2f343a;
  --spro-borda-forte: #3d434a;
  --spro-destaque: #79acff;
  --spro-destaque-texto: #0a1526;
  --spro-perigo: #ff7d73;
  --spro-aviso: #e8b04a;
  --spro-ok: #4fcf96;
  --spro-novidade: #ab98ff;
  --spro-estrela: #f6b73c;
  --spro-sombra-1: 0 1px 2px rgb(0 0 0 / 30%);
  --spro-sombra-2: 0 2px 4px -2px rgb(0 0 0 / 40%), 0 6px 14px -4px rgb(0 0 0 / 45%);
  --spro-sombra-3: 0 10px 24px -6px rgb(0 0 0 / 50%), 0 24px 56px -12px rgb(0 0 0 / 60%);
  --spro-veu: rgb(0 0 0 / 58%);
  --spro-destaque-suave: color-mix(in srgb, var(--spro-destaque) 14%, transparent);
  --spro-destaque-medio: color-mix(in srgb, var(--spro-destaque) 24%, transparent);
  color-scheme: dark;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-tema]),
  :host(:not([data-tema])) {
    --spro-fundo: #1a1d21;
    --spro-fundo-2: #22262b;
    --spro-fundo-3: #2b3036;
    --spro-pagina: #141619;
    --spro-texto: #e7e9ec;
    --spro-suave: #a4abb3;
    --spro-fraco: #767e87;
    --spro-borda: #2f343a;
    --spro-borda-forte: #3d434a;
    --spro-destaque: #79acff;
    --spro-destaque-texto: #0a1526;
    --spro-perigo: #ff7d73;
    --spro-aviso: #e8b04a;
    --spro-ok: #4fcf96;
    --spro-novidade: #ab98ff;
    --spro-estrela: #f6b73c;
    --spro-sombra-1: 0 1px 2px rgb(0 0 0 / 30%);
    --spro-sombra-2: 0 2px 4px -2px rgb(0 0 0 / 40%), 0 6px 14px -4px rgb(0 0 0 / 45%);
    --spro-sombra-3: 0 10px 24px -6px rgb(0 0 0 / 50%), 0 24px 56px -12px rgb(0 0 0 / 60%);
    --spro-veu: rgb(0 0 0 / 58%);
    --spro-destaque-suave: color-mix(in srgb, var(--spro-destaque) 14%, transparent);
    --spro-destaque-medio: color-mix(in srgb, var(--spro-destaque) 24%, transparent);
    color-scheme: dark;
  }
}
/* Destaque na cor do tema do SEI (painel abaixo da lista). No escuro, clareado para ter contraste. */
:root[data-cor-sei] {
  --spro-destaque: var(--spro-cor-sei);
}
:root[data-cor-sei][data-tema="escuro"] {
  --spro-destaque: color-mix(in srgb, var(--spro-cor-sei) 45%, #ffffff);
}

/* [hidden] perde para display de classe; o agente aprendeu isso do jeito dif\xEDcil. */
[hidden] {
  /* biome-ignore lint/complexity/noImportantStyles: [hidden] precisa vencer o display das classes */
  display: none !important;
}
.spro-icone {
  flex: none;
  vertical-align: middle;
}

/* ---------- Bot\xF5es ---------- */
.spro-botao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.2;
  white-space: nowrap;
  color: var(--spro-texto);
  background: var(--spro-fundo);
  border: 1px solid var(--spro-borda-forte);
  border-radius: var(--spro-raio);
  box-shadow: var(--spro-sombra-1);
  cursor: pointer;
  transition:
    background var(--spro-dur),
    border-color var(--spro-dur),
    box-shadow var(--spro-dur),
    color var(--spro-dur);
}
.spro-botao:hover {
  background: var(--spro-fundo-2);
  border-color: color-mix(in srgb, var(--spro-borda-forte) 60%, var(--spro-texto));
}
.spro-botao:active {
  background: var(--spro-fundo-3);
}
.spro-botao .spro-icone {
  color: var(--spro-suave);
}
.spro-botao.primario {
  color: var(--spro-destaque-texto);
  background: var(--spro-destaque);
  border-color: transparent;
  box-shadow:
    var(--spro-sombra-1),
    inset 0 1px 0 rgb(255 255 255 / 14%);
}
.spro-botao.primario .spro-icone {
  color: inherit;
}
.spro-botao.primario:hover {
  background: color-mix(in srgb, var(--spro-destaque) 88%, #000000);
}
.spro-botao.perigo {
  color: var(--spro-perigo);
}
.spro-botao.perigo .spro-icone {
  color: inherit;
}
.spro-botao.primario.perigo {
  color: #ffffff;
  background: var(--spro-perigo);
}
.spro-botao.fantasma {
  background: transparent;
  border-color: transparent;
  box-shadow: none;
}
.spro-botao.fantasma:hover {
  background: var(--spro-fundo-3);
}
.spro-botao.pequeno {
  min-height: 26px;
  padding: 0 9px;
  font-size: 12px;
}
.spro-botao:disabled,
.spro-botao-icone:disabled {
  opacity: 0.5;
  cursor: default;
  pointer-events: none;
}
.spro-botao-icone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 30px;
  height: 30px;
  padding: 0;
  color: var(--spro-suave);
  background: none;
  border: 0;
  border-radius: var(--spro-raio);
  cursor: pointer;
  transition:
    background var(--spro-dur),
    color var(--spro-dur);
}
.spro-botao-icone:hover,
.spro-botao-icone[aria-expanded="true"] {
  color: var(--spro-texto);
  background: var(--spro-fundo-3);
}
.spro-botao-icone.pequeno {
  width: 26px;
  height: 26px;
}

/* ---------- Campos ---------- */
.spro-campo {
  box-sizing: border-box;
  min-height: 32px;
  min-width: 0;
  padding: 5px 10px;
  font: inherit;
  font-size: 13px;
  color: var(--spro-texto);
  background: var(--spro-fundo);
  border: 1px solid var(--spro-borda-forte);
  border-radius: var(--spro-raio);
  transition:
    border-color var(--spro-dur),
    box-shadow var(--spro-dur);
}
.spro-campo::placeholder {
  color: var(--spro-fraco);
}
.spro-campo:hover {
  border-color: color-mix(in srgb, var(--spro-borda-forte) 70%, var(--spro-texto));
}
textarea.spro-campo {
  resize: vertical;
  line-height: 1.45;
  padding: 8px 10px;
}
.spro-campo:focus,
.spro-campo:focus-visible {
  outline: none;
  border-color: var(--spro-destaque);
  box-shadow: var(--spro-anel);
}
.spro-botao:focus-visible,
.spro-botao-icone:focus-visible,
.spro-combo:focus-visible,
.spro-chip:focus-visible,
.spro-segmentado button:focus-visible {
  outline: none;
  box-shadow: var(--spro-anel);
}
/* No menu o fundo j\xE1 mostra o item em foco (o foco anda junto com o mouse). */
.spro-menu-item:focus-visible {
  outline: none;
}
input[type="checkbox"],
input[type="radio"] {
  accent-color: var(--spro-destaque);
}

/* ---------- Controle segmentado ---------- */
.spro-segmentado {
  display: inline-flex;
  align-items: stretch;
  gap: 2px;
  padding: 2px;
  background: var(--spro-fundo-3);
  border-radius: calc(var(--spro-raio) + 1px);
}
.spro-segmentado button {
  all: unset;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 26px;
  padding: 0 11px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--spro-suave);
  border-radius: var(--spro-raio-p);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background var(--spro-dur),
    color var(--spro-dur),
    box-shadow var(--spro-dur);
}
.spro-segmentado button:hover {
  color: var(--spro-texto);
}
.spro-segmentado button[aria-selected="true"],
.spro-segmentado button[aria-pressed="true"],
.spro-segmentado button[aria-checked="true"] {
  color: var(--spro-texto);
  background: var(--spro-fundo);
  box-shadow: var(--spro-sombra-1);
  font-weight: 600;
}

/* ---------- Chips (etiquetas) e p\xEDlulas ---------- */
.spro-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  min-height: 24px;
  padding: 0 10px;
  font: inherit;
  font-size: 12px;
  font-weight: 500;
  color: var(--spro-texto);
  background: color-mix(in srgb, var(--cor, var(--spro-fundo-3)) 30%, var(--spro-fundo));
  border: 1px solid color-mix(in srgb, var(--cor, var(--spro-borda-forte)) 60%, transparent);
  border-radius: 999px;
  cursor: pointer;
  transition:
    background var(--spro-dur),
    border-color var(--spro-dur),
    opacity var(--spro-dur);
}
:root[data-tema="escuro"] .spro-chip,
:host([data-tema="escuro"]) .spro-chip {
  background: color-mix(in srgb, var(--cor, var(--spro-fundo-3)) 16%, var(--spro-fundo));
}
@media (prefers-color-scheme: dark) {
  :root:not([data-tema]) .spro-chip,
  :host(:not([data-tema])) .spro-chip {
    background: color-mix(in srgb, var(--cor, var(--spro-fundo-3)) 16%, var(--spro-fundo));
  }
}
.spro-chip::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--cor, var(--spro-fraco));
}
.spro-chip[aria-pressed="false"] {
  color: var(--spro-suave);
  background: transparent;
  border-color: var(--spro-borda-forte);
  border-style: dashed;
}
.spro-pilula {
  --tom: var(--spro-suave);
  display: inline-flex;
  align-items: center;
  gap: 4px;
  min-height: 20px;
  max-width: 100%;
  padding: 0 7px;
  font-size: 11.5px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  color: var(--tom);
  background: color-mix(in srgb, var(--tom) 11%, transparent);
  border-radius: 999px;
  box-sizing: border-box;
}
.spro-pilula > span {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ---------- Seletor inteligente (combobox) ---------- */
.spro-combo {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: 30px;
  min-width: 0;
  max-width: 100%;
  padding: 0 8px 0 10px;
  font: inherit;
  font-size: 13px;
  text-align: left;
  color: var(--spro-texto);
  background: var(--spro-fundo);
  border: 1px solid var(--spro-borda-forte);
  border-radius: var(--spro-raio);
  box-shadow: var(--spro-sombra-1);
  cursor: pointer;
  transition:
    background var(--spro-dur),
    border-color var(--spro-dur),
    box-shadow var(--spro-dur);
}
.spro-combo:hover {
  background: var(--spro-fundo-2);
}
.spro-combo > .spro-icone {
  color: var(--spro-suave);
}
.spro-combo > .spro-icone:last-child {
  margin-left: auto;
  color: var(--spro-fraco);
  transition: transform var(--spro-dur) var(--spro-curva);
}
.spro-combo-aberto {
  border-color: var(--spro-destaque);
  box-shadow: var(--spro-anel);
}
.spro-combo-aberto > .spro-icone:last-child {
  transform: rotate(180deg);
}
.spro-combo-ativo {
  color: var(--spro-destaque);
  background: var(--spro-destaque-suave);
  border-color: color-mix(in srgb, var(--spro-destaque) 45%, transparent);
}
.spro-combo-ativo:hover {
  background: var(--spro-destaque-medio);
}
.spro-combo-ativo > .spro-icone {
  color: inherit;
}
.spro-combo-texto {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1 1 auto;
}
.spro-combo-rotulo {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spro-combo-vazio {
  color: var(--spro-suave);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spro-combo-mais {
  flex: none;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--spro-destaque-texto);
  background: var(--spro-destaque);
  border-radius: 999px;
}
.spro-combo-cor {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 12%);
}
.spro-combo-pop,
.spro-menu-pop {
  position: fixed;
  z-index: 2147483000;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  overflow: hidden;
  font-family: var(--spro-fonte);
  font-size: 13px;
  color: var(--spro-texto);
  background: var(--spro-fundo);
  border: 1px solid var(--spro-borda);
  border-radius: var(--spro-raio-g);
  box-shadow: var(--spro-sombra-3);
  animation: spro-surgir 140ms var(--spro-curva);
  transform-origin: top center;
}
.spro-flutuante-cima {
  transform-origin: bottom center;
}
@keyframes spro-surgir {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
}
.spro-combo-cabeca {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 10px;
  color: var(--spro-fraco);
  border-bottom: 1px solid var(--spro-borda);
}
.spro-combo-busca {
  flex: 1;
  min-width: 0;
  height: 38px;
  padding: 0;
  font: inherit;
  color: var(--spro-texto);
  background: transparent;
  border: 0;
  outline: none;
}
.spro-combo-busca::placeholder {
  color: var(--spro-fraco);
}
.spro-combo-lista {
  flex: 1 1 auto;
  min-height: 0;
  margin: 0;
  padding: 4px;
  overflow: auto;
  list-style: none;
  outline: none;
  scrollbar-width: thin;
}
.spro-combo-op {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 8px;
  border-radius: var(--spro-raio-p);
  cursor: pointer;
  user-select: none;
}
.spro-combo-op > .spro-icone {
  color: var(--spro-suave);
}
.spro-combo-op-ativa {
  background: var(--spro-fundo-3);
}
.spro-combo-op[aria-selected="true"] {
  font-weight: 600;
}
.spro-combo-op-textos {
  display: grid;
  gap: 1px;
  min-width: 0;
  flex: 1 1 auto;
}
.spro-combo-op-rotulo {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spro-combo-op-rotulo mark {
  color: inherit;
  background: color-mix(in srgb, var(--spro-estrela) 35%, transparent);
  border-radius: 2px;
}
.spro-combo-op-desc {
  font-size: 11.5px;
  font-weight: 400;
  color: var(--spro-suave);
  white-space: normal;
}
.spro-combo-caixa {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 16px;
  height: 16px;
  box-sizing: border-box;
  color: var(--spro-destaque-texto);
  border: 1.5px solid var(--spro-borda-forte);
  border-radius: 5px;
  transition:
    background var(--spro-dur),
    border-color var(--spro-dur);
}
.spro-combo-op[aria-selected="true"] .spro-combo-caixa {
  background: var(--spro-destaque);
  border-color: var(--spro-destaque);
}
.spro-combo-caixa .spro-icone {
  stroke-width: 3;
}
.spro-combo-conta {
  flex: none;
  margin-left: auto;
  min-width: 18px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  text-align: center;
  color: var(--spro-suave);
  background: var(--spro-fundo-3);
  border-radius: 999px;
}
.spro-combo-marca {
  flex: none;
  margin-left: auto;
  display: inline-flex;
  color: var(--spro-destaque);
}
.spro-combo-conta + .spro-combo-marca {
  margin-left: 0;
}
.spro-combo-extras:empty {
  display: none;
}
.spro-combo-nada {
  margin: 0;
  padding: 14px 12px;
  text-align: center;
  color: var(--spro-suave);
}
.spro-combo-criar {
  all: unset;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 4px 4px;
  padding: 7px 8px;
  font-weight: 500;
  color: var(--spro-destaque);
  border-radius: var(--spro-raio-p);
  cursor: pointer;
}
.spro-combo-criar:hover,
.spro-combo-criar:focus-visible {
  background: var(--spro-destaque-suave);
}
.spro-combo-rodape {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 6px 6px 12px;
  background: var(--spro-fundo-2);
  border-top: 1px solid var(--spro-borda);
}
.spro-combo-total {
  flex: 1;
  font-size: 12px;
  color: var(--spro-suave);
  white-space: nowrap;
}
.spro-combo-acao {
  all: unset;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--spro-destaque);
  border-radius: var(--spro-raio-p);
  cursor: pointer;
}
.spro-combo-acao:hover,
.spro-combo-acao:focus-visible {
  background: var(--spro-destaque-suave);
}
.spro-combo-acao:disabled {
  color: var(--spro-fraco);
  pointer-events: none;
}

/* ---------- Menu ---------- */
.spro-menu-pop {
  padding: 5px;
  overflow: auto;
}
.spro-menu-item {
  all: unset;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 10px 7px 8px;
  border-radius: var(--spro-raio-p);
  cursor: pointer;
  white-space: nowrap;
}
.spro-menu-item:hover,
.spro-menu-item:focus {
  background: var(--spro-fundo-3);
}
.spro-menu-icone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex: none;
  color: var(--spro-suave);
  background: var(--spro-fundo-2);
  border: 1px solid var(--spro-borda);
  border-radius: var(--spro-raio-p);
  box-sizing: border-box;
}
.spro-menu-item:hover .spro-menu-icone,
.spro-menu-item:focus .spro-menu-icone {
  color: var(--spro-destaque);
  background: var(--spro-fundo);
}
.spro-menu-rotulo {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}
.spro-menu-dica {
  font-size: 11.5px;
  color: var(--spro-fraco);
  font-variant-numeric: tabular-nums;
}
.spro-menu-perigo {
  color: var(--spro-perigo);
}
.spro-menu-perigo .spro-menu-icone,
.spro-menu-perigo:hover .spro-menu-icone,
.spro-menu-perigo:focus .spro-menu-icone {
  color: var(--spro-perigo);
  background: color-mix(in srgb, var(--spro-perigo) 10%, transparent);
  border-color: color-mix(in srgb, var(--spro-perigo) 22%, transparent);
}
.spro-menu-sep {
  height: 1px;
  margin: 5px 6px;
  background: var(--spro-borda);
}

/* ---------- Di\xE1logo ---------- */
dialog.spro-dialogo {
  box-sizing: border-box;
  width: min(580px, calc(100vw - 24px));
  max-width: none;
  max-height: min(calc(100vh - 32px), 820px);
  padding: 0;
  font-family: var(--spro-fonte);
  font-size: 13px;
  color: var(--spro-texto);
  background: var(--spro-fundo);
  border: 1px solid var(--spro-borda);
  border-radius: var(--spro-raio-xg);
  box-shadow: var(--spro-sombra-3);
  overflow: hidden;
}
dialog.spro-dialogo[open] {
  display: flex;
  flex-direction: column;
  animation: spro-dialogo-entrar 180ms var(--spro-curva);
}
@keyframes spro-dialogo-entrar {
  from {
    opacity: 0;
    transform: translateY(8px) scale(0.985);
  }
}
dialog.spro-dialogo::backdrop {
  background: var(--spro-veu);
  backdrop-filter: blur(2px);
}
dialog.spro-dialogo > header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 16px 12px 18px;
  flex: none;
}
.spro-dialogo-icone {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: none;
  width: 34px;
  height: 34px;
  color: var(--spro-destaque);
  background: var(--spro-destaque-suave);
  border-radius: var(--spro-raio);
}
dialog.spro-dialogo > header h2 {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 15.5px;
  font-weight: 650;
  letter-spacing: -0.005em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spro-dialogo-corpo {
  display: grid;
  gap: 12px;
  min-height: 0;
  padding: 2px 18px 18px;
  overflow: auto;
  scrollbar-width: thin;
}
.spro-dialogo-rodape {
  position: sticky;
  bottom: -18px;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
  margin: 6px -18px -18px;
  padding: 12px 18px;
  background: var(--spro-fundo-2);
  border-top: 1px solid var(--spro-borda);
}
.spro-dialogo-rodape > .spro-esquerda {
  margin-right: auto;
}

/* ---------- Aviso (toast) ---------- */
.spro-aviso {
  position: fixed;
  left: 50%;
  bottom: 16px;
  z-index: 2147483001;
  display: flex;
  align-items: center;
  gap: 12px;
  max-width: min(560px, calc(100vw - 24px));
  box-sizing: border-box;
  padding: 10px 10px 10px 14px;
  font-family: var(--spro-fonte);
  font-size: 13px;
  line-height: 1.35;
  color: #f3f5f8;
  background: #1f2329;
  border: 1px solid rgb(255 255 255 / 8%);
  border-radius: var(--spro-raio-g);
  box-shadow: var(--spro-sombra-3);
  transform: translateX(-50%);
  animation: spro-aviso-entrar 220ms var(--spro-curva);
}
.spro-aviso > .spro-icone {
  color: #8fd6b4;
}
.spro-aviso > span {
  flex: 1;
}
@keyframes spro-aviso-entrar {
  from {
    opacity: 0;
    transform: translate(-50%, 10px);
  }
}
.spro-aviso button {
  flex: none;
  padding: 5px 10px;
  font: inherit;
  font-weight: 600;
  color: #9cc3ff;
  background: rgb(255 255 255 / 6%);
  border: 0;
  border-radius: var(--spro-raio-p);
  cursor: pointer;
}
.spro-aviso button:hover {
  background: rgb(255 255 255 / 12%);
}

@media (prefers-reduced-motion: reduce) {
  .spro-combo-pop,
  .spro-menu-pop,
  dialog.spro-dialogo[open],
  .spro-aviso {
    animation: none;
  }
  * {
    transition-duration: 0ms !important;
  }
}
`;var x=class extends Error{codigo;detalhe;constructor(o,t,r){super(t),this.name="ErroSei",this.codigo=o,this.detalhe=r}paraJSON(){return{codigo:this.codigo,mensagem:this.message,detalhe:this.detalhe}}};function $o(e){if(e instanceof x)return e;if(e instanceof DOMException&&e.name==="AbortError")return new x("CANCELADO","Opera\xE7\xE3o cancelada.");let o=e instanceof Error?e.message:String(e);return new x("SEI_REDE",`Falha ao falar com o SEI: ${o}`)}var Ir={AElig:198,Aacute:193,Acirc:194,Agrave:192,Aring:197,Atilde:195,Auml:196,Ccedil:199,ETH:208,Eacute:201,Ecirc:202,Egrave:200,Euml:203,Iacute:205,Icirc:206,Igrave:204,Iuml:207,Ntilde:209,Oacute:211,Ocirc:212,Ograve:210,Oslash:216,Otilde:213,Ouml:214,THORN:222,Uacute:218,Ucirc:219,Ugrave:217,Uuml:220,Yacute:221,aacute:225,acirc:226,acute:180,aelig:230,agrave:224,amp:38,apos:39,aring:229,atilde:227,auml:228,brvbar:166,bull:8226,ccedil:231,cedil:184,cent:162,copy:169,curren:164,deg:176,divide:247,eacute:233,ecirc:234,egrave:232,eth:240,euml:235,euro:8364,frac12:189,frac14:188,frac34:190,gt:62,hellip:8230,iacute:237,icirc:238,iexcl:161,igrave:236,iquest:191,iuml:239,laquo:171,ldquo:8220,lsquo:8216,lt:60,macr:175,mdash:8212,micro:181,middot:183,nbsp:160,ndash:8211,not:172,ntilde:241,oacute:243,ocirc:244,ograve:242,ordf:170,ordm:186,oslash:248,otilde:245,ouml:246,para:182,plusmn:177,pound:163,quot:34,raquo:187,rdquo:8221,reg:174,rsquo:8217,sect:167,shy:173,sup1:185,sup2:178,sup3:179,szlig:223,thorn:254,times:215,trade:8482,uacute:250,ucirc:251,ugrave:249,uml:168,uuml:252,yacute:253,yen:165,yuml:255};function X(e){return e.includes("&")?e.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g,(o,t)=>{let r=t[0]==="#"?t[1]==="x"||t[1]==="X"?parseInt(t.slice(2),16):parseInt(t.slice(1),10):Ir[t];return r===void 0||Number.isNaN(r)?o:String.fromCodePoint(r)}):e}var pe={128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376};var me=null;function yo(e){return me?me(e):new DOMParser().parseFromString(e,"text/html")}function E(e){return(e?.textContent??"").replace(/\s+/g," ").trim()}var Lr={n:`
`,r:"\r",t:"	",b:"\b",f:"\f",v:"\v",0:"\0"};function Ho(e,o){let t=e[o],r="";for(o+=1;o<e.length;){let a=e[o];if(a==="\\"){let i=e[o+1];if(i==="u"&&/^[0-9a-fA-F]{4}$/.test(e.slice(o+2,o+6))){r+=String.fromCharCode(parseInt(e.slice(o+2,o+6),16)),o+=6;continue}r+=Lr[i]??i,o+=2;continue}if(a===t)return[r,o+1];r+=a,o+=1}return[r,o]}function Vo(e,o){let t=[],r=o;for(;r<e.length;){let a=e[r];if(a===")")return[t,r+1];if(a===","||/\s/.test(a)){r+=1;continue}if(a==='"'||a==="'"){let[s,c]=Ho(e,r);t.push(s),r=c;continue}let i=/^(null|true|false|-?\d+(?:\.\d+)?)/.exec(e.slice(r,r+32));if(i){let s=i[1];t.push(s==="null"?null:s==="true"?!0:s==="false"?!1:Number(s)),r+=s.length;continue}let n=0;for(;r<e.length;){let s=e[r];if(s==="(")n+=1;else if(s===")"){if(n===0)break;n-=1}else if(s===","&&n===0)break;r+=1}t.push(null)}return[t,r]}function I(e){return typeof e=="string"?X(e):e==null?"":String(e)}var Or=/controlador(?:_ajax)?\.php\?acao=[^"'\s<>\\]*?infra_hash=[0-9a-f]{64,192}/g;function V(e){let o=new Set;for(let t of e.replace(/&amp;/g,"&").matchAll(Or))o.add(t[0]);return[...o]}function k(e){let o=e.indexOf("?");return new URLSearchParams(o>=0?e.slice(o+1):"")}function U(e,o,t={}){let r=Array.isArray(e)?e:V(e);for(let a of r){let i=k(a),n=i.get("acao")??"";if(!(typeof o=="string"?n!==o:!o.test(n))&&Object.entries(t).every(([s,c])=>i.get(s)===c))return a}return null}function qr(e){let o=new Map;for(let t of e.matchAll(/Nos\[(\d+)\]\s*=\s*new\s+infraArvoreNo\(/g)){let[r]=Vo(e,t.index+t[0].length);o.set(Number(t[1]),{indice:Number(t[1]),args:r,props:{}})}for(let t of e.matchAll(/Nos\[(\d+)\]\.(\w+)\s*=\s*(['"])/g)){let r=o.get(Number(t[1]));if(!r)continue;let[a]=Ho(e,t.index+t[0].length-1);r.props[t[2]]=a}return[...o.values()].sort((t,r)=>t.indice-r.indice)}function kr(e){let o=[];for(let t of e.matchAll(/new\s+infraArvoreAcao\(/g)){let[r]=Vo(e,t.index+t[0].length);o.push({tipo:I(r[0]),idPai:I(r[2]),href:I(r[3]),titulo:I(r[5]),icone:I(r[6]),extra:r[8]==null?void 0:I(r[8])})}return o}function fe(e,o){let t=e.find(n=>n.tipo==="NIVEL_ACESSO"&&n.idPai===o);if(!t)return{nivel:"publico"};let[r,...a]=t.titulo.split(`
`);return{nivel:/sigilos/i.test(r)||/sigiloso/.test(t.icone)?"sigiloso":"restrito",hipotese:a.join(" ").trim()||void 0}}function ge(e){return[...new Set([...e.matchAll(/<img[^>]*\btitle="([^"]+)"/g)].map(o=>I(o[1])))]}var Nr=/\s*\(\d{5,}\)\s*$/;function B(e){let o=e.html,t=qr(o),r=kr(o),a=t.find(c=>c.args[0]==="PROCESSO");if(!a)throw new x("SEI_VERSAO_NAO_SUPORTADA","A \xE1rvore do processo n\xE3o tem o n\xF3 do processo.");let i=I(a.args[1]),n=fe(r,i),s=t.filter(c=>c.args[0]==="DOCUMENTO").map(c=>{let l=I(c.args[1]),d=I(c.args[5]),p=I(c.args[7]),u=(c.props.src??"").replace(/&amp;/g,"&"),m=r.find(A=>A.tipo==="ASSINATURA"&&A.idPai===l),{nivel:v,hipotese:y}=fe(r,l),P=(/documento_([a-z0-9]+)\.svg/.exec(p)?.[1]??"interno").replace("cancelado","interno");return{id:l,numero:I(c.args[15])||(/\((\d{5,})\)\s*$/.exec(d)?.[1]??""),titulo:d.replace(Nr,""),pasta:c.args[2]&&String(c.args[2]).startsWith("PASTA")?String(c.args[2]):null,externo:/documento_download_anexo/.test(u)||!/documento_interno|documento_cancelado|formulario|email/.test(p),formato:P,nivel:v,hipotese:y,assinado:!!m,assinaturas:m?m.titulo.split(`
`).slice(1).filter(Boolean):[],cancelado:/documento_cancelado/.test(p),unidadeGeradora:r.find(A=>A.tipo==="UNIDADE_GERADORA"&&A.idPai===l)?.extra,link:I(c.args[3]).replace(/&amp;/g,"&"),src:u,acoes:V(c.props.acoes??""),botoes:ge(c.props.acoes??"")}});return{idProcedimento:i,protocolo:I(a.args[5])||I(a.args[15]),tipo:I(a.args[6]),nivel:n.nivel,hipotese:n.hipotese,marcadores:r.filter(c=>c.tipo==="MARCADOR"&&c.idPai===i).map(c=>c.titulo.replace(/^Marcador\n/,"").replace(/\n/g," \u2014 ")),documentos:s,acoesProcesso:V(a.props.acoes??""),botoesProcesso:ge(a.props.acoes??""),linkProcesso:I(a.args[3]).replace(/&amp;/g,"&"),sinais:r.filter(c=>c.idPai===i),links:V(o),pagina:e}}async function ve(e,o,t){let r=await e.obter(o,t);if(!/acao=procedimento_visualizar/.test(r.url)){let a=r.doc.querySelector("#ifrArvore")?.getAttribute("src");if(!a)throw new x("SEI_NAO_ENCONTRADO","N\xE3o foi poss\xEDvel abrir a \xE1rvore do processo.");r=await e.obter(a,t)}if(/infraArvoreNo\("PASTA"/.test(r.html)){let a=U(r.html,"procedimento_visualizar")&&V(r.html).find(i=>/abrir_pastas=1/.test(i));a&&(r=await e.obter(a,t))}return B(r)}function Y(e,o,t){if(t){let r=e.documentos.find(a=>a.id===t);return r?U(r.acoes,o):null}return U(e.acoesProcesso,o)??U(e.links,o,{id_procedimento:e.idProcedimento})}var Ae="\xA5",Bo="\xB1";function he(e){return e.map(o=>`${o.id}${Bo}${o.texto}`).join(Ae)}function Rr(e){return e?e.split(Ae).map(o=>{let[t,...r]=o.split(Bo);return{id:t,texto:r.join(Bo)}}):[]}function be(e){let o=[];for(let t of e.matchAll(/new\s+infraLupaSelect\(\s*['"]([\w-]+)['"]\s*,\s*['"]([\w-]+)['"]/g))o.push([t[1],t[2]]);return o}var we=e=>o=>o.url.includes(e),N=class e{constructor(o,t,r){this.http=o;this.pagina=t;this.elemento=r,this.id=r.id,this.action=(r.getAttribute("action")??"").replace(/&amp;/g,"&"),this.campos=zr(r),this.sincronizarLupas()}id;action;campos;elemento;static async abrir(o,t,r,a){let i=await o.obter(t,a);return e.de(i,r,o)}static de(o,t,r=null){let a=o.doc.querySelector(t);if(!a)throw new x("SEI_VERSAO_NAO_SUPORTADA",`A tela do SEI n\xE3o tem o formul\xE1rio esperado (${t}).`,E(o.doc.querySelector("title")));return new e(r,o,a)}pares(){return this.campos.map(o=>[o.nome,o.valor])}valor(o){return this.campos.find(t=>t.nome===o)?.valor}tem(o){return this.elemento.querySelector(`[name="${o}"]`)!==null||this.campos.some(t=>t.nome===o)}opcoes(o){let t=this.elemento.querySelector(`select[name="${o}"], select#${ye(o)}`);return t?[...t.querySelectorAll("option")].map(r=>({valor:r.getAttribute("value")??E(r),texto:E(r),selecionada:r.hasAttribute("selected")})):[]}definir(o){for(let[t,r]of Object.entries(o)){if(r===void 0)continue;if(r===null){this.campos=this.campos.filter(i=>i.nome!==t);continue}let a=this.campos.find(i=>i.nome===t);a?a.valor=r:this.campos.push({nome:t,valor:r})}return this}escolher(o,t){let r=this.opcoes(o),a=Uo(t),i=r.find(n=>n.valor===t)??r.find(n=>Uo(n.texto)===a)??xe(r.filter(n=>Uo(n.texto).includes(a)));if(!i)throw new x("ARGUMENTO_INVALIDO",`"${t}" n\xE3o \xE9 uma op\xE7\xE3o de ${o}.`,r.slice(0,40).map(n=>n.texto).join(" | "));return this.definir({[o]:i.valor}),i}linhas(o){return[...this.elemento.querySelectorAll(`${o} tr`)].filter(t=>t.querySelector("input[type=checkbox]"))}itensLupa(o){let t=this.hiddenDaLupa(o);return t?Rr(this.valor(t)??""):[]}definirLupa(o,t){let r=this.hiddenDaLupa(o);if(!r)throw new x("SEI_VERSAO_NAO_SUPORTADA",`A lupa ${o} n\xE3o existe nesta tela.`);return this.definir({[r]:he(t)}),this.campos=this.campos.filter(a=>a.nome!==o&&a.nome!==`${o}[]`),this}async enviar(o={}){if(!this.http)throw new x("SEI_RESPOSTA_INESPERADA","Formul\xE1rio sem transporte HTTP.");if(!this.action)throw new x("SEI_VERSAO_NAO_SUPORTADA",`O formul\xE1rio ${this.id} n\xE3o tem action.`);let t=this.pares();o.botao&&t.push(this.botaoDeEnvio(o.botao));let r=await this.http.enviar(this.action,t,o);if(o.sucesso&&!o.sucesso(r))throw new x("SEI_RESPOSTA_INESPERADA",`O SEI n\xE3o confirmou ${o.operacao??"a opera\xE7\xE3o"}.`,`${E(r.doc.querySelector("title"))} \u2014 ${r.url.replace(/infra_hash=\w+/,"infra_hash=\u2026")}`);return r}botaoDeEnvio(o){let t=this.elemento.querySelector(`[name="${o}"]`)??xe([...this.elemento.querySelectorAll('button[type="submit"][name^="sbm"], input[type="submit"][name^="sbm"]')]);return t?[t.getAttribute("name")??o,t.getAttribute("value")??E(t)??o]:[o,o]}hiddenDaLupa(o){let t=be(this.pagina.html).find(([r])=>r===o);return t?t[1]:null}sincronizarLupas(){for(let[o,t]of be(this.pagina.html)){let r=this.elemento.querySelector(`select#${ye(o)}`);if(!r)continue;let a=[...r.querySelectorAll("option")].map(i=>({id:i.getAttribute("value")??"",texto:E(i)}));(this.valor(t)??"")||this.definir({[t]:he(a)}),this.campos=this.campos.filter(i=>i.nome!==o&&i.nome!==`${o}[]`)}}};function zr(e){let o=[];for(let t of e.querySelectorAll("input, select, textarea")){let r=t.getAttribute("name");if(!r||t.hasAttribute("disabled"))continue;let a=t.tagName.toLowerCase();if(a==="input"){let i=(t.getAttribute("type")??"text").toLowerCase();if(["submit","button","image","reset","file"].includes(i)||(i==="checkbox"||i==="radio")&&!t.hasAttribute("checked"))continue;o.push({nome:r,valor:t.getAttribute("value")??(i==="checkbox"||i==="radio"?"on":"")})}else if(a==="textarea")o.push({nome:r,valor:t.textContent??""});else{let i=[...t.querySelectorAll("option")],n=i.filter(l=>l.hasAttribute("selected")),s=t.hasAttribute("multiple"),c=n.length?n:!s&&i.length?[i[0]]:[];for(let l of c)o.push({nome:r,valor:l.getAttribute("value")??E(l)})}}return o}function Uo(e){return e.normalize("NFD").replace(/[\u0300-\u036F]/g,"").toLowerCase().replace(/\s+/g," ").trim()}function xe(e){return e.length===1?e[0]:void 0}function ye(e){return e.replace(/([^\w-])/g,"\\$1")}function jo(e,o){let t=e.querySelector("input[type=checkbox]"),r=e.querySelector("a[href*='procedimento_trabalhar']");if(!t||!r)return null;let a=t.getAttribute("aria-label")??"",i=/^Sigiloso\b/.test(a)||/Sigiloso/.test(r.getAttribute("class")??""),n=[...e.querySelectorAll("td")],s=i?[]:[...n[1]?.querySelectorAll("a[aria-label]")??[]].map(c=>c.getAttribute("aria-label")??"");return{idProcedimento:t.getAttribute("value")??k(r.getAttribute("href")??"").get("id_procedimento")??"",protocolo:t.getAttribute("title")??E(r),grupo:o,tipo:/Tipo (.*?)(?: \/ Especifica|$)/.exec(a)?.[1]?.trim()??"",especificacao:i?"":/Especifica\S* (.*)$/.exec(a)?.[1]?.trim()??"",sigiloso:i,novo:/NaoVisualizado/.test(r.getAttribute("class")??""),atribuido:E(n[n.length-1]).replace(/^\(|\)$/g,""),sinais:s,documentoNovo:!!n[1]?.querySelector("img[src*='exclamacao']")||s.some(c=>/documento foi inclu/i.test(c))}}function Ao(e,o){let t=o==="recebidos"?"#tblProcessosRecebidos":"#tblProcessosGerados",r=e.doc.querySelector(t),a=Number(/\((\d+)\s+registro/.exec(E(r?.querySelector("caption")))?.[1]??0),i=[];for(let n of r?.querySelectorAll("tr[id^='P']")??[]){let s=jo(n,o);s&&i.push(s)}return{itens:i,total:a}}function Ee(e){return[...Ao(e,"recebidos").itens,...Ao(e,"gerados").itens]}async function Pe(e,o={}){let t=o.limite??2e3,r=await e.http.obter(e.linkMenu("procedimento_controlar"),{sinal:o.sinal,aceitarValidacao:!0}),a=[],i=0;for(let n of["recebidos","gerados"]){let s=n==="recebidos"?"hdnRecebidosPaginaAtual":"hdnGeradosPaginaAtual",{itens:c,total:l}=Ao(r,n);i+=l,a.push(...c);let d=c.length,p=!1;for(let u=1;d<l&&c.length>0&&a.length<t;u+=1)r=await N.de(r,"#frmProcedimentoControlar",e.http).definir({hdnRecebidosPaginaAtual:"0",hdnGeradosPaginaAtual:"0",[s]:String(u)}).enviar({sinal:o.sinal,aceitarValidacao:!0}),{itens:c}=Ao(r,n),d+=c.length,a.push(...c),p=!0;p&&(r=await N.de(r,"#frmProcedimentoControlar",e.http).definir({hdnRecebidosPaginaAtual:"0",hdnGeradosPaginaAtual:"0"}).enviar({sinal:o.sinal,aceitarValidacao:!0}))}return{total:i,processos:a.slice(0,t)}}function Fr(e){let o=e.doc.querySelector("#tblHistorico"),t=Number(/\((\d+)\s+registro/.exec(E(o?.querySelector("caption")))?.[1]??0);return{itens:[...o?.querySelectorAll("tr")??[]].filter(a=>a.querySelector("td")).map(a=>{let i=[...a.querySelectorAll("td")];return{data:E(i[0]),unidade:E(i[1]),usuario:E(i[2]),descricao:E(i[3])}}),total:t}}function wo(e){return Fr(e).itens}var Se="#frmTextoPadraoInternoCadastro",Me="#frmTextoPadraoInternoLista",_r=40,Eo=e=>(e??"").replace(/&amp;/g,"&");function Ce(e,o){let t=()=>{if(!o.nome.trim()||o.nome.length>50)throw new x("ARGUMENTO_INVALIDO","O nome do texto padr\xE3o deve ter de 1 a 50 caracteres.");if(o.descricao.length>300)throw new x("ARGUMENTO_INVALIDO","A descri\xE7\xE3o do texto padr\xE3o passa de 300 caracteres.")},r=n=>[...n.doc.querySelectorAll("table.infraTable tr")].find(s=>[...s.querySelectorAll("td")].some(c=>(c.textContent??"").trim()===o.nome)),a=n=>{let s=n.querySelector('input[type="checkbox"]')?.getAttribute("value")??/acaoExcluir\(\s*['"](\d+)/.exec(n.querySelector('a[onclick*="acaoExcluir"]')?.getAttribute("onclick")??"")?.[1],c=Eo(n.querySelector('a[href*="acao=texto_padrao_interno_consultar"]')?.getAttribute("href")),l=Eo(n.querySelector('a[href*="acao=texto_padrao_interno_alterar"]')?.getAttribute("href"));return s&&c&&l?{id:s,consultar:c,alterar:l}:null},i=async n=>{t();let s=await e.http.obter(e.linkMenu("texto_padrao_interno_listar"),n),c=s;for(let l=0;l<_r;l++){let d=r(c);if(d)return{pagina:c,primeira:s,achado:a(d)};if(!/infraAcaoPaginar\(\s*['"]\+['"]/.test(c.html))break;c=await N.de(c,Me,e.http).definir({hdnInfraPaginaAtual:String(l+1)}).enviar(n)}return{pagina:c,primeira:s,achado:null}};return{async localizar(n){return(await i(n)).achado},async ler(n){let{achado:s}=await i(n);return s?(await e.http.obter(s.consultar,n)).doc.querySelector('textarea[name="txaConteudo"], #txaConteudo')?.textContent??"":null},async gravar(n,s){let{achado:c,primeira:l}=await i(s),d={...s,modos:{txaConteudo:"html"},sucesso:we("texto_padrao_interno_listar")};if(c){await(await N.abrir(e.http,c.alterar,Se,s)).definir({txaConteudo:n}).enviar({...d,botao:"sbmAlterarTextoPadraoInterno",operacao:"a altera\xE7\xE3o do texto padr\xE3o"});return}let p=Eo(/location\.href\s*=\s*'([^']+)'/.exec(l.doc.querySelector("#btnNovo")?.getAttribute("onclick")??"")?.[1]);if(!p)throw new x("SEI_ACAO_INDISPONIVEL","O SEI n\xE3o permite a voc\xEA criar textos padr\xE3o nesta unidade.");await(await N.abrir(e.http,p,Se,s)).definir({txtNome:o.nome,txtDescricao:o.descricao,txaConteudo:n}).enviar({...d,botao:"sbmCadastrarTextoPadraoInterno",operacao:"o cadastro do texto padr\xE3o"})},async excluir(n){let{achado:s,pagina:c}=await i(n);if(!s)return!1;let l=Eo(/['"](controlador\.php\?acao=texto_padrao_interno_excluir[^'"]+)['"]/.exec(c.html)?.[1]);if(!l)throw new x("SEI_ACAO_INDISPONIVEL","O SEI n\xE3o oferece a exclus\xE3o de textos padr\xE3o para voc\xEA nesta unidade.");let d=N.de(c,Me,e.http).definir({hdnInfraItemId:s.id});return await e.http.enviar(l,d.pares(),{...n,aceitarValidacao:!0}),!0}}}var $r={"\u2010":"-","\u2011":"-","\u2012":"-","\u2013":"-","\u2014":"-","\u2015":"-","\u2212":"-","\u2018":"'","\u2019":"'","\u201A":"'","\u201B":"'","\u2032":"'","\u201C":'"',"\u201D":'"',"\u201E":'"',"\u201F":'"',"\u2033":'"',"\u2026":"...","\u2022":"-","\u2002":" ","\u2003":" ","\u2009":" ","\u202F":" ","\u205F":" ","\u200B":"","\u200C":"","\u200D":"","\u2060":"","\uFEFF":"","\u20AC":"EUR","\u2122":"(TM)","\u2192":"->","\u2190":"<-"};function Te(e,o="texto"){let t="";for(let r of e){let a=r.codePointAt(0);if(a<=255){t+=r;continue}let i=$r[r];if(o==="html"){t+=i===""?"":`&#${a};`;continue}if(i!==void 0){t+=i;continue}let n=r.normalize("NFKD").replace(/[\u0300-\u036F]/g,"");t+=[...n].every(s=>s.codePointAt(0)<=255)?n:""}return t}var Hr=/[A-Za-z0-9\-_.*]/;function De(e){let o="";for(let t of e)t===" "?o+="+":Hr.test(t)?o+=t:o+="%"+t.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0");return o}function Ie(e,o={}){return e.map(([t,r])=>{let a=o[t]??"texto";return`${De(Te(t))}=${De(Te(r??"",a))}`}).join("&")}function Go(e){let o=e instanceof Uint8Array?e:new Uint8Array(e),t=[],r=16384;for(let a=0;a<o.length;a+=r){let i=o.subarray(a,a+r),n=new Array(i.length);for(let s=0;s<i.length;s+=1)n[s]=pe[i[s]]??i[s];t.push(String.fromCharCode(...n))}return t.join("")}var Le="application/x-www-form-urlencoded; charset=ISO-8859-1";function Oe(e,o,t){let r=null;return{url:e,status:o,html:t,get doc(){return r??=yo(t)}}}function qe(e,o={}){if(/\/login\.php/i.test(e.url)||/[?&]acao=(?:infra_)?sair\b/.test(e.url))throw new x("SEI_SESSAO_EXPIRADA","A sess\xE3o do SEI foi encerrada. Fa\xE7a login de novo no SEI e repita o pedido.");if(e.status>=500)throw new x("SEI_EXCECAO",`O SEI respondeu com erro ${e.status}.`);if(e.html.includes('id="divInfraExcecao"')){let t=e.doc.querySelector("#divInfraExcecao");if(t){let r=E(t);throw new x("SEI_EXCECAO",r||"O SEI exibiu uma p\xE1gina de erro.",r)}}if(!o.aceitarValidacao&&e.html.includes("txaInfraValidacao")){let t=e.doc.querySelector("#txaInfraValidacao")?.textContent?.trim()??"";if(t)throw new x("SEI_VALIDACAO",t,t)}return e}function Po(e,o={}){let t=new URL(".",e),r=o.fetch??((...p)=>fetch(...p)),a=Math.max(1,o.concorrencia??3),i=0,n=[];async function s(p){i>=a&&await new Promise(u=>n.push(u)),i+=1;try{return await p()}finally{i-=1,n.shift()?.()}}let c=p=>new URL(p.replace(/&amp;/g,"&"),t).href;async function l(p,u,m){return s(async()=>{try{let v=await r(c(p),{credentials:"same-origin",redirect:"follow",...u,signal:m.sinal}),y=Go(await v.arrayBuffer());return qe(Oe(v.url||c(p),v.status,y),m)}catch(v){throw $o(v)}})}async function d(p,u={}){return s(async()=>{try{let m=await r(c(p),{credentials:"same-origin",redirect:"follow",signal:u.sinal}),v=new Uint8Array(await m.arrayBuffer()),y=(m.headers?.get("content-type")??"").split(";")[0].trim().toLowerCase();y==="text/html"&&qe(Oe(m.url||c(p),m.status,Go(v)),u);let P=m.headers?.get("content-disposition")??"",A=decodeURIComponent(/filename\*=UTF-8''([^;]+)/i.exec(P)?.[1]??/filename="?([^";]+)"?/i.exec(P)?.[1]??"");return{bytes:v,tipo:y,nome:A}}catch(m){throw $o(m)}})}return{base:t,absoluta:c,baixar:d,obter:(p,u={})=>l(p,{method:"GET"},u),enviar:(p,u,m={})=>l(p,{method:"POST",headers:{"Content-Type":Le},body:Ie(u,m.modos)},m)}}function Vr(e){let o=/Sistema Eletr(?:\u00F4|&ocirc;|\\u00F4)nico de Informa[^"]*?Vers(?:\u00E3|&atilde;)o\s*([\d.]+)/i.exec(e);return o?o[1]:/\.(?:js|svg|css)\?(\d+\.\d+\.\d+)-/.exec(e)?.[1]??""}function Ur(e){let o=e.doc.querySelector("#lnkInfraUnidade")?.getAttribute("onclick")??"",t=/infra_unidade_atual=(\d+)/.exec(o)?.[1];if(t)return t;let r=/[?&]infra_unidade_atual=(\d+)/.exec(e.url)?.[1];return r||(e.doc.querySelector("#selInfraUnidades option[selected]")?.getAttribute("value")??"")}function Xo(e){let o=e.doc,t=o.querySelector("#lnkInfraUnidade"),r=o.querySelector("#lnkUsuarioSistema")?.getAttribute("title")??"",[,a="",i="",n=""]=/^(.*?)\s*\(([^/)]+)(?:\/([^)]+))?/.exec(r)??[],s=Vr(e.html);return{host:new URL(e.url).host,versao:s,maior:Number(s.split(".")[0])||0,unidade:{id:Ur(e),sigla:E(t)||E(o.querySelector("#selInfraUnidades option[selected]")),nome:t?.getAttribute("title")??""},usuario:{nome:a.trim(),login:i.trim(),orgao:n.trim()}}}var Br=3e4,Q=class{constructor(o,t=null,r){this.paginaViva=t;this.http=Po(o,r)}http;paginaBase=null;arvores=new Map;localizados=new Map;base(){let o=this.paginaViva?.();if(o&&o.html.includes("frmProtocoloPesquisaRapida"))return o;if(this.paginaBase)return this.paginaBase;if(o)return o;throw new x("SEI_NAO_ENCONTRADO","Abra uma tela do SEI (por exemplo, Controle de Processos) nesta aba.")}contexto(){return Xo(this.base())}linkMenu(o){let t=this.base(),r=[...t.doc.querySelectorAll("#infraMenu a[href], #main-menu a[href], .infraMenu a[href]")].map(s=>s.getAttribute("href")??"").join(`
`),a=V(r).filter(s=>k(s).get("acao")===o),n=(a.length?a:V(t.html).filter(s=>k(s).get("acao")===o)).sort((s,c)=>[...k(s).keys()].length-[...k(c).keys()].length)[0];if(!n)throw new x("SEI_ACAO_INDISPONIVEL",`O menu do SEI n\xE3o oferece "${o}" para este usu\xE1rio.`);return n}async renovarBase(o){return this.paginaBase=await this.http.obter(this.linkMenu("procedimento_controlar"),o),this.arvores.clear(),this.localizados.clear(),this.paginaBase}async localizar(o,t){let r=o.trim();if(!r)throw new x("ARGUMENTO_INVALIDO","Informe o n\xFAmero do processo ou o n\xBA SEI do documento.");let a=this.localizados.get(r);if(a)return a;let i=N.de(this.base(),"#frmProtocoloPesquisaRapida",this.http);i.definir({txtPesquisaRapida:r});let n=await i.enviar(t),s=k(n.url);if(s.get("acao")!=="procedimento_trabalhar")throw new x("SEI_NAO_ENCONTRADO",`Nada encontrado no SEI para "${r}", ou voc\xEA n\xE3o tem acesso a ele.`);let c=n.doc.querySelector("#ifrArvore")?.getAttribute("src");if(!c)throw new x("SEI_VERSAO_NAO_SUPORTADA","A tela do processo n\xE3o trouxe a \xE1rvore.");let d=k(X(c)).get("id_procedimento")??"",p=s.get("id_protocolo")??"",u={idProcedimento:d,idDocumento:p&&p!==d?p:void 0,linkArvore:X(c)};return this.localizados.set(r,u),u}async arvore(o,t={}){let r=await this.localizar(o,t),a=this.arvores.get(r.idProcedimento);if(a&&!t.forcar&&Date.now()-a.quando<Br)return a.arvore;let i=await ve(this.http,r.linkArvore,t);return this.arvores.set(r.idProcedimento,{quando:Date.now(),arvore:i}),i}invalidar(o){o?this.arvores.delete(o):this.arvores.clear()}async ajax(o,t,r){let a=await this.http.enviar(o,t,{...r,aceitarValidacao:!0}),i=[];for(let n of a.html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g))i.push({id:X(n[1]),texto:X(n[2]).trim()});for(let n of a.html.matchAll(/<item\s+([^>]*)>/g)){let s=yo(`<i ${n[1]}></i>`).querySelector("i");i.push({id:s?.getAttribute("id")??"",texto:s?.getAttribute("descricao")??s?.getAttribute("complemento")??""})}return i.filter(n=>n.id&&n.id!=="null")}};function ke(e){let o=e.getItem("configDataFavoritesPro");if(!o)return null;try{return JSON.parse(o)}catch{return null}}function Ko(e=2e3){let o=window.webkitRequestFileSystem;return o?new Promise(t=>{let r=setTimeout(()=>t(null),e),a=()=>{clearTimeout(r),t(null)};try{o(1,0,i=>i.root.getFile("configPro.json",{},n=>n.file(async s=>{try{let c=JSON.parse(await s.text());clearTimeout(r),t(c)}catch{a()}},a),a),a)}catch{a()}}):Promise.resolve(null)}var Ne="seipro-favoritos",K="favoritos/preferencias";var Re="seipro-favoritos-lateral",lo="favoritos/lateralAberto";function to(e){let o=e.login.trim().toLowerCase();return`${e.host}|${o}|${e.lista==="pessoal"?"pessoal":`u:${e.unidade?.id??""}`}`}function ze(e){let o={host:e.host,login:e.login.trim().toLowerCase()};return{unidade:e.unidade?.id?{...o,lista:"unidade",unidade:{id:e.unidade.id,sigla:e.unidade.sigla}}:null,pessoal:{...o,lista:"pessoal"}}}function Fe(e){return[e.host,e.login.trim().toLowerCase(),e.unidade?.id??""].join("|")}function _e(e){let o=e;return!!(o.side_panel||o.sidebar_action)}function Wo(e,o){return o?{abaixo:e!=="lateral",lateral:e!=="abaixo"}:{abaixo:!0,lateral:!1}}var $e={exibir:"abaixo",perguntarAoFavoritar:!0,textoPadrao:"nao-perguntado",textoPadraoUnidades:{},recolhido:!1,agruparPorPasta:!1,ordem:"manual",faixaUnidadeDispensada:!1};async function H(e){let o=(await e.obter(K))[K];return{...$e,...o&&typeof o=="object"?o:{}}}async function Jo(e,o){let t={...await H(e),...o};return await e.gravar({[K]:t}),t}var He=(e,o,t)=>`${e}|${o.trim().toLowerCase()}|${t}`;function Ve(e,o,t,r){return e.textoPadraoUnidades?.[He(o,t,r)]??"nao-perguntado"}async function Ue(e,o,t,r,a){let i=await H(e);return Jo(e,{textoPadraoUnidades:{...i.textoPadraoUnidades??{},[He(o,t,r)]:a}})}async function So(e,o){if(e.chaves){let r=(await e.chaves()).filter(a=>a.startsWith(o));return r.length?e.obter(r):{}}let t=await e.obter(null);return Object.fromEntries(Object.entries(t).filter(([r])=>r.startsWith(o)))}var W=class{constructor(o,t){this.area=o;this.prefixo=t}chave(o){return this.prefixo+o}async listar(){return Object.values(await So(this.area,this.prefixo))}async obter(o){let t=this.chave(o);return(await this.area.obter(t))[t]}async gravar(o,t){await this.area.gravar({[this.chave(o)]:t})}async gravarVarios(o){o.length&&await this.area.gravar(Object.fromEntries(o.map(([t,r])=>[this.chave(t),r])))}async apagar(o){o.length&&await this.area.remover(o.map(t=>this.chave(t)))}aoMudar(o){return this.area.aoMudar(t=>{Object.keys(t).some(r=>r.startsWith(this.prefixo))&&o()})}};var jr="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",Be=new Map;function Gr(e){let o=Be.get(e);if(o===void 0){o=new Uint8Array(256);for(let t=0;t<e.length;t++)o[e.charCodeAt(t)]=t;Be.set(e,o)}return o}function ro(e,o,t,r){let a=t[0];if(o!=null&&e>=o)throw new Error(e+" >= "+o);if(e.slice(-1)===a||o&&o.slice(-1)===a)throw new Error("trailing zero");if(o){let s=0;for(;(e[s]||a)===o[s];)s++;if(s>0)return o.slice(0,s)+ro(e.slice(s),o.slice(s),t,r)}let i=e?r[e.charCodeAt(0)]:0,n=o!=null?r[o.charCodeAt(0)]:t.length;if(n-i>1){let s=Math.round(.5*(i+n));return t[s]}else return o&&o.length>1?o.slice(0,1):t[i]+ro(e.slice(1),null,t,r)}function Je(e,o){if(e.length!==ao(e[0],o))throw new Error("invalid integer part of order key: "+e)}function ao(e,o){if(o===void 0){let t=e.charCodeAt(0);if(t>=97&&t<=122)return t-97+2;if(t>=65&&t<=90)return 90-t+2}else{let t=o.indexOf(e);if(t!==-1){let r=o.length/2;return t<r?r-t+1:t-r+2}}throw new Error("invalid order key head: "+e)}function uo(e,o){let t=ao(e[0],o);if(t>e.length)throw new Error("invalid order key: "+e);return e.slice(0,t)}function je(e,o,t){if(Ze(e,o,t))throw new Error("invalid order key: "+e);let r=uo(e,t);if(e.slice(r.length).slice(-1)===o[0])throw new Error("invalid order key: "+e)}function Ge(e,o,t,r){Je(e,r);let a=e[0],i=o[0],n="";for(let d=e.length-1;d>=1;d--){let p=t[e.charCodeAt(d)]+1;if(p===o.length)n=i+n;else return a+e.slice(1,d)+o[p]+n}if(r===void 0){if(a==="Z")return"a"+i;if(a==="z")return null;let d=String.fromCharCode(a.charCodeAt(0)+1);return d+(d>"a"?n+i:n.slice(1))}let s=r.indexOf(a);if(s===r.length-1)return null;let c=r[s+1],l=ao(c,r)-ao(a,r);return c+(l>0?n+i:l<0?n.slice(1):n)}function Xr(e,o,t,r){Je(e,r);let a=e[0],i=o[o.length-1],n="";for(let d=e.length-1;d>=1;d--){let p=t[e.charCodeAt(d)]-1;if(p===-1)n=i+n;else return a+e.slice(1,d)+o[p]+n}if(r===void 0){if(a==="a")return"Z"+i;if(a==="A")return null;let d=String.fromCharCode(a.charCodeAt(0)-1);return d+(d<"Z"?n+i:n.slice(1))}let s=r.indexOf(a);if(s===0)return null;let c=r[s-1],l=ao(c,r)-ao(a,r);return c+(l>0?n+i:l<0?n.slice(1):n)}var Xe=new Map;function Ze(e,o,t=""){let r=Xe.get(t);r===void 0&&(r=new Map,Xe.set(t,r));let a=o.charCodeAt(0),i=r.get(a);return i===void 0&&(i=t===""?"A"+o[0].repeat(26):t[0]+o[0].repeat(t.length/2),r.set(a,i)),e===i}function Ye(e){for(let o=1;o<e.length;o++)if(e.charCodeAt(o-1)>=e.charCodeAt(o))return!1;return!0}function Qe(e){for(let o=0;o<e.length;o++)if(e.charCodeAt(o)>255)return!1;return!0}var Ke=new Set;function Kr(e){if(!Ke.has(e)){if(e.length<2||!Ye(e))throw new Error("digits must be at least 2 characters in strictly ascending character code order: "+e);if(!Qe(e))throw new Error("digits must be single-byte (char code 0-255): "+e);Ke.add(e)}}var We=new Set;function Wr(e){if(!We.has(e)){if(e.length<2||e.length%2!==0||!Ye(e))throw new Error("intDigits must be an even number of at least 2 characters in strictly ascending character code order: "+e);if(!Qe(e))throw new Error("intDigits must be single-byte (char code 0-255): "+e);We.add(e)}}function Zo(e,o,t=jr,r=void 0){Kr(t),r!==void 0&&Wr(r);let a=Gr(t);if(e!=null&&je(e,t,r),o!=null&&je(o,t,r),e!=null&&o!=null&&e>o){let d=e;e=o,o=d}if(e==null){if(o==null)return(r===void 0?"a":r[r.length/2])+t[0];let d=uo(o,r),p=o.slice(d.length);if(Ze(d,t,r))return d+ro("",p,t,a);if(d<o)return d;let u=Xr(d,t,a,r);if(u==null)throw new Error("cannot decrement any more");return u}if(o==null){let d=uo(e,r),p=e.slice(d.length),u=Ge(d,t,a,r);return u??d+ro(p,null,t,a)}let i=uo(e,r),n=e.slice(i.length),s=uo(o,r),c=o.slice(s.length);if(i===s)return i+ro(n,c,t,a);let l=Ge(i,t,a,r);if(l==null)throw new Error("cannot increment any more");return l<o?l:i+ro(n,null,t,a)}function po(e,o){return Zo(e??null,o??null)}function mo(e){try{return Zo(e,null),!0}catch{return!1}}function ot(e,o){return e.atualizadoEm!==o.atualizadoEm?e.atualizadoEm>o.atualizadoEm:e.dispositivo!==o.dispositivo?e.dispositivo>o.dispositivo:JSON.stringify(e)>JSON.stringify(o)}function et(e,o,t=90){let r=o-t*864e5;return e.filter(a=>a.removidoEm===void 0||a.removidoEm>=r)}function L(e){return e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim()}function oo(e){let o=2166136261;for(let t of e)o^=t.codePointAt(0)??0,o=Math.imul(o,16777619)>>>0;return o.toString(16).padStart(8,"0")}var tt=["#bfd5e8","#c8e6c9","#ffe0b2","#f8bbd0","#d1c4e9","#b2ebf2","#fff9c4","#d7ccc8"];function Mo(e){let o=Number.parseInt(oo(L(e)).slice(0,6),16)%tt.length;return tt[o]??"#bfd5e8"}function Jr(e){let o=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(e);if(!o)return"#1f2328";let[t,r,a]=[o[1],o[2],o[3]].map(i=>Number.parseInt(i??"0",16));return(t*299+r*587+a*114)/1e3>140?"#1f2328":"#ffffff"}function at(e){let o=e.trim().toLowerCase(),t=null,r=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(o);r&&(t=[r[1],r[2],r[3]].map(p=>Number.parseInt(p??"0",16)));let a=/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(o);if(a){if((a[4]===void 0?1:a[4].endsWith("%")?Number.parseFloat(a[4])/100:Number.parseFloat(a[4]))<.9)return null;t=[a[1],a[2],a[3]].map(u=>Number(u))}if(!t||t.some(p=>!Number.isFinite(p)||p<0||p>255))return null;let[i,n,s]=t,c=Math.max(i,n,s),l=Math.min(i,n,s);if(c===0||(c-l)/c<.25)return null;let d=[i,n,s];for(let p=0;p<12&&Jr(rt(d))!=="#ffffff";p++)d=d.map(u=>Math.round(u*.88));return rt(d)}function rt(e){return`#${e.map(o=>o.toString(16).padStart(2,"0")).join("")}`}function it(e,o){if(!o||!e)return[];let t=[];if(o.qtdDocumentos!==void 0&&e.qtdDocumentos!==void 0&&o.qtdDocumentos>e.qtdDocumentos){let i=o.qtdDocumentos-e.qtdDocumentos;t.push({tipo:"documentos",texto:i===1?"1 documento novo":`${i} documentos novos`})}let r=o.ultimoAndamento,a=e.ultimoAndamento;return r&&a&&(r.data!==a.data||r.descricao!==a.descricao)&&t.push({tipo:"andamento",texto:`andamento: ${r.descricao}${r.unidade?` (${r.unidade})`:""}`}),e.abertoNaUnidade===!0&&o.abertoNaUnidade===!1&&t.push({tipo:"saiu",texto:"saiu da sua unidade"}),e.abertoNaUnidade===!1&&o.abertoNaUnidade===!0&&t.push({tipo:"voltou",texto:"voltou para a sua unidade"}),o.naoVisualizado&&!e.naoVisualizado&&t.push({tipo:"naoVisualizado",texto:"n\xE3o visualizado"}),o.documentoNovo&&!e.documentoNovo&&t.push({tipo:"documentoNovo",texto:"documento novo"}),o.concluido&&!e.concluido&&t.push({tipo:"concluido",texto:"conclu\xEDdo"}),o.recebidoNaLeitura&&t.push({tipo:"recebido",texto:"chegou \xE0 sua unidade \u2014 o SEI registrou o recebimento"}),t}function nt(e,o){if(!e||!o)return e===o;let t=r=>JSON.stringify([r.abertoNaUnidade,r.naoVisualizado,r.documentoNovo,r.atribuido,r.marcadores??[],r.concluido,r.qtdDocumentos,r.ultimoAndamento??null]);return t(e)===t(o)}function Yo(e,o){return!!e.lembrete&&e.lembrete.em<=o}function st(e){for(let o of Object.keys(e))e[o]===void 0&&delete e[o];return e}function ct(e,o,t){return st({id:e.id,protocolo:e.protocolo,tipo:e.tipo||void 0,especificacao:e.sigiloso?void 0:e.especificacao||void 0,sigiloso:e.sigiloso?!0:void 0,sigiloAConfirmar:e.sigiloAConfirmar&&e.sigiloso===void 0?!0:void 0,etiquetas:[],ordem:o,criadoEm:t.agora,atualizadoEm:t.agora,dispositivo:t.dispositivo})}function j(e,o,t){return st({...e,...o,atualizadoEm:t.agora,dispositivo:t.dispositivo})}function Co(e,o){return j(e,{removidoEm:o.agora},o)}function lt(e,o){return j(e,{removidoEm:void 0},o)}var dt=e=>e.reduce((o,t)=>mo(t.ordem)&&(o===null||t.ordem>o)?t.ordem:o,null),Qo=(e,o)=>e.nome.localeCompare(o.nome,"pt-BR"),io=class{constructor(o,t,r){this.area=o;this.escopo=t;this.carimbo=r;let a=`favoritos/${to(t)}/`;this.favoritos=new W(o,`${a}f/`),this.pastas=new W(o,`${a}p/`),this.etiquetas=new W(o,`${a}e/`),this.atuaisCol=new W(o,`${a}a/`),this.vistosCol=new W(o,`${a}v/`),this.chaveMeta=`${a}meta`,this.base=a}favoritos;pastas;etiquetas;atuaisCol;vistosCol;chaveMeta;base;async registrar(){await this.area.gravar({[this.chaveMeta]:{escopo:this.escopo}})}async instantaneo(){let o=Object.entries(await So(this.area,this.base)),t=r=>o.filter(([a])=>a.startsWith(this.base+r)).map(([,a])=>a);return{todos:t("f/"),pastas:t("p/").filter(r=>r.removidoEm===void 0).sort(ut),etiquetas:t("e/").filter(r=>r.removidoEm===void 0).sort(Qo)}}async gravarAtual(o,t){await this.atuaisCol.gravar(o,{...t,id:o})}async gravarAtuais(o){await this.atuaisCol.gravarVarios(o.map(([t,r])=>[t,{...r,id:t}]))}async atuais(){return new Map((await this.atuaisCol.listar()).map(({id:o,...t})=>[o,t]))}async vistosCompletos(){return this.vistosCol.listar()}async vistos(){return new Map((await this.vistosCol.listar()).filter(o=>o.removidoEm===void 0).map(o=>[o.id,o.visto]))}async gravarVisto(o,t){let r=await this.vistosCol.obter(o);if(r&&r.removidoEm===void 0&&nt(r.visto,t))return!1;let a=this.carimbo(),i={...t};return delete i.recebidoNaLeitura,await this.vistosCol.gravar(o,{id:o,visto:i,atualizadoEm:a.agora,dispositivo:a.dispositivo}),!0}async marcarVisto(o){let t=await this.atuais(),r=0;for(let a of o){let i=t.get(a),n=await this.obter(a);!i||!n||n.removidoEm!==void 0||(await this.gravarVisto(a,i),r++)}return r}async instantaneoCompleto(){let o=Object.entries(await So(this.area,this.base)),t=r=>o.filter(([a])=>a.startsWith(this.base+r)).map(([,a])=>a);return{todos:t("f/"),pastas:t("p/"),etiquetas:t("e/"),vistos:t("v/")}}todos(){return this.favoritos.listar()}async ativos(){return(await this.todos()).filter(o=>o.removidoEm===void 0)}obter(o){return this.favoritos.obter(o)}async contem(o){let t=await this.obter(o);return!!t&&t.removidoEm===void 0}async proximaOrdem(){return po(dt(await this.todos()),null)}async adicionar(o){let t=this.carimbo(),r=await this.obter(o.id),a;if(!r)a=ct(o,await this.proximaOrdem(),t);else{let i=o.sigiloso===void 0?r.sigiloso:o.sigiloso?!0:void 0,n={sigiloAConfirmar:o.sigiloso!==void 0?void 0:r.sigiloAConfirmar,protocolo:o.protocolo||r.protocolo,tipo:o.tipo||r.tipo,sigiloso:i,especificacao:i?void 0:o.especificacao||r.especificacao};r.removidoEm!==void 0&&Object.assign(n,{removidoEm:void 0,ordem:await this.proximaOrdem()}),a=j(r,n,t)}return await this.favoritos.gravar(a.id,a),a}async editar(o,t){let r=await this.obter(o);if(!r)throw new Error(`O favorito ${o} n\xE3o existe nesta lista.`);let a={...t};a.etiquetas&&(a.etiquetas=[...new Set(a.etiquetas)].slice(0,8)),typeof a.nota=="string"&&(a.nota=a.nota.slice(0,2e3).trim()?a.nota.slice(0,2e3):void 0),typeof a.titulo=="string"&&(a.titulo=a.titulo.trim()||void 0);let i=j(r,a,this.carimbo());return await this.favoritos.gravar(o,i),i}async remover(o){let t=this.carimbo(),r=(await Promise.all(o.map(a=>this.obter(a)))).filter(a=>!!a&&a.removidoEm===void 0);return await this.favoritos.gravarVarios(r.map(a=>[a.id,Co(a,t)])),r.length}async restaurar(o){let t=this.carimbo(),r=(await Promise.all(o.map(a=>this.obter(a)))).filter(a=>!!a&&a.removidoEm!==void 0);return await this.favoritos.gravarVarios(r.map(a=>[a.id,lt(a,t)])),r.length}async mover(o,t,r){let a=t?await this.obter(t):void 0,i=r?await this.obter(r):void 0,n;try{n=po(a?.ordem??null,i?.ordem??null)}catch{n=po(a?.ordem??null,null)}await this.editar(o,{ordem:n})}async pastasAtivas(){return(await this.pastas.listar()).filter(o=>o.removidoEm===void 0).sort((o,t)=>ut(o,t))}async criarPasta(o,t){let r=o.trim();if(!r)throw new Error("Informe o nome da pasta.");let a=await this.pastas.listar(),i=a.find(c=>c.removidoEm===void 0&&L(c.nome)===L(r));if(i)return i;let n=this.carimbo(),s={id:no(),nome:r,ordem:po(dt(a),null),atualizadoEm:n.agora,dispositivo:n.dispositivo};return t&&(s.cor=t),await this.pastas.gravar(s.id,s),s}async editarPasta(o,t){let r=await this.pastas.obter(o);r&&await this.pastas.gravar(o,j(r,t,this.carimbo()))}async removerPasta(o){let t=await this.pastas.obter(o);if(!t)return;let r=this.carimbo();await this.pastas.gravar(o,Co(t,r));let a=(await this.todos()).filter(i=>i.pasta===o);await this.favoritos.gravarVarios(a.map(i=>[i.id,j(i,{pasta:void 0},r)]))}async etiquetasAtivas(){return(await this.etiquetas.listar()).filter(o=>o.removidoEm===void 0).sort(Qo)}async criarEtiqueta(o,t){let r=o.trim();if(!r)throw new Error("Informe o nome da etiqueta.");let a=(await this.etiquetas.listar()).find(s=>s.removidoEm===void 0&&L(s.nome)===L(r));if(a)return a;let i=this.carimbo(),n={id:no(),nome:r,cor:t??Mo(r),atualizadoEm:i.agora,dispositivo:i.dispositivo};return await this.etiquetas.gravar(n.id,n),n}async editarEtiqueta(o,t){let r=await this.etiquetas.obter(o);r&&await this.etiquetas.gravar(o,j(r,t,this.carimbo()))}async removerEtiqueta(o){let t=await this.etiquetas.obter(o);if(!t)return;let r=this.carimbo();await this.etiquetas.gravar(o,Co(t,r));let a=(await this.todos()).filter(i=>i.etiquetas.includes(o));await this.favoritos.gravarVarios(a.map(i=>[i.id,j(i,{etiquetas:i.etiquetas.filter(n=>n!==o)},r)]))}async importar(o){let t=await this.mesclarEm(this.favoritos,o.favoritos??[],Qr);return await this.mesclarEm(this.pastas,o.pastas??[]),await this.mesclarEm(this.etiquetas,o.etiquetas??[]),await this.mesclarEm(this.vistosCol,o.vistos??[]),t}async mesclarEm(o,t,r=a=>a){let a=new Map((await o.listar()).map(c=>[c.id,c])),i=[],n=0,s=0;for(let c of t){let l=a.get(c.id);l?ot(c,l)&&(s+=1,i.push([c.id,r(c,l)])):(n+=1,i.push([c.id,r(c,void 0)]))}return await o.gravarVarios(i),{novos:n,atualizados:s}}async limpar(o=Date.now()){for(let t of[this.favoritos,this.pastas,this.etiquetas]){let r=await t.listar(),a=new Set(et(r,o,90).map(i=>i.id));await t.apagar(r.filter(i=>!a.has(i.id)).map(i=>i.id))}}aoMudarAtuais(o){return this.atuaisCol.aoMudar(o)}aoMudar(o){let t=[this.favoritos.aoMudar(o),this.pastas.aoMudar(o),this.etiquetas.aoMudar(o),this.vistosCol.aoMudar(o)];return()=>{for(let r of t)r()}}};function ut(e,o){return e.ordem!==o.ordem?e.ordem<o.ordem?-1:1:Qo(e,o)}async function pt(e,o,t){let r=await e.obter(t);if(!r||r.removidoEm!==void 0)return null;await o.adicionar({id:r.id,protocolo:r.protocolo,tipo:r.tipo,especificacao:r.especificacao,sigiloso:r.sigiloso});let a=await o.editar(t,{titulo:r.titulo,nota:r.nota,prazo:r.prazo,local:r.local,pasta:void 0,etiquetas:[]});return await e.remover([t]),a}function Qr(e,o){if(!e.resumido||!o?.protocolo)return e;let t={...o,atualizadoEm:e.atualizadoEm,dispositivo:e.dispositivo,removidoEm:e.removidoEm,sigiloso:e.sigiloso??o.sigiloso};return delete t.resumido,t.removidoEm===void 0&&delete t.removidoEm,t.sigiloso?(delete t.especificacao,delete t.sigiloAConfirmar):delete t.sigiloso,t}async function mt(e,o){let t=new Blob([e]).stream().pipeThrough(o);return new Uint8Array(await new Response(t).arrayBuffer())}function oa(e){let o="";for(let t=0;t<e.length;t+=32768)o+=String.fromCharCode(...e.subarray(t,t+32768));return btoa(o).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function ea(e){if(!/^[A-Za-z0-9_-]*$/.test(e))throw new Error("Conte\xFAdo fora do formato base64url.");let o=e.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(e.length/4)*4,"="),t=atob(o),r=new Uint8Array(t.length);for(let a=0;a<t.length;a++)r[a]=t.charCodeAt(a);return r}async function ft(e){let o=new TextEncoder().encode(JSON.stringify(e));return oa(await mt(o,new CompressionStream("gzip")))}async function gt(e){let o=await mt(ea(e),new DecompressionStream("gzip"));return JSON.parse(new TextDecoder().decode(o))}var ta=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");function vt(e,o,t=2e3){let r=[`<p>${ta(e)}</p>`];for(let a=0;a<o.length;a+=t)r.push(`<p>${o.slice(a,a+t)}</p>`);return r.join(`
`)}function ra(e){let o=e;for(let t=0;t<2&&/&lt;\s*\/?p[\s>&]/i.test(o);t++)o=o.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&amp;/g,"&");return o}function ht(e){let t=[...ra(e).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(r=>(r[1]??"").trim()).slice(1);return!t.length||!t.every(r=>/^[A-Za-z0-9_-]+$/.test(r))?null:t.join("")}var D=e=>e&&typeof e=="object"&&!Array.isArray(e)?e:null,S=e=>typeof e=="string",_=e=>typeof e=="number"&&Number.isFinite(e),oe=/^\d{4}-\d{2}-\d{2}$/;var Do=e=>S(e.id)&&e.id!==""&&_(e.atualizadoEm)&&S(e.dispositivo)&&(e.removidoEm===void 0||_(e.removidoEm));function aa(e){let o=D(e),t=D(o?.referencia);if(!o||!t||!["ate","desde","desdeUteis"].includes(String(o.exibicao)))return!1;let r=t.de==="novoDocumento"?[t.desde]:t.de==="data"||t.de==="documento"?[t.data]:[];if(!r.length||!r.every(i=>S(i)&&oe.test(i))||t.de==="novoDocumento"&&!(Array.isArray(t.tipos)&&t.tipos.length&&t.tipos.every(S)))return!1;let a=D(o.vencimento);return o.vencimento===void 0||a?.em==="data"&&S(a.data)&&oe.test(a.data)||a?.em==="dias"&&_(a.n)&&Math.abs(a.n)<=3650&&(a.contagem==="corridos"||a.contagem==="uteis")}function ia(e){let o=D(e);if(!o||!Do(o)||!S(o.protocolo)||!S(o.ordem)||!_(o.criadoEm)||!Array.isArray(o.etiquetas))return null;let t={...o,etiquetas:o.etiquetas.filter(S)};t.prazo!==void 0&&!aa(t.prazo)&&delete t.prazo;for(let i of["titulo","tipo","especificacao","pasta","nota"])t[i]!==void 0&&!S(t[i])&&delete t[i];mo(t.ordem)||(t.ordem="a0"),t.sigiloso!==!0?delete t.sigiloso:delete t.especificacao;let r=D(t.lembrete);if(t.lembrete!==void 0&&(r&&S(r.em)&&oe.test(r.em)?t.lembrete=S(r.texto)?{em:r.em,texto:r.texto}:{em:r.em}:delete t.lembrete),t.documentos!==void 0){let i=Array.isArray(t.documentos)?t.documentos.map(D).filter(n=>!!n&&S(n.id)&&S(n.numero)&&S(n.titulo)).map(n=>({id:n.id,numero:n.numero,titulo:n.titulo,criadoEm:_(n.criadoEm)?n.criadoEm:0,...S(n.nota)?{nota:n.nota}:{}})):[];i.length?t.documentos=i:delete t.documentos}t.visto!==void 0&&!(D(t.visto)&&_(D(t.visto).quando))&&delete t.visto;let a=D(t.local);return t.local!==void 0&&!(a&&_(a.lat)&&_(a.lng)&&Math.abs(a.lat)<=90&&Math.abs(a.lng)<=180)&&delete t.local,t.sigiloAConfirmar!==!0&&delete t.sigiloAConfirmar,t.resumido!==!0&&delete t.resumido,t}var bt=/^#[0-9a-f]{3,8}$/i,na=e=>{let o=D(e);if(!o||!Do(o)||!S(o.nome)||!S(o.ordem))return null;let t={...o,ordem:mo(o.ordem)?o.ordem:"a0"};return t.cor!==void 0&&!(S(t.cor)&&bt.test(t.cor))&&delete t.cor,t},sa=e=>{let o=D(e);return!o||!Do(o)||!S(o.nome)?null:{...o,cor:S(o.cor)&&bt.test(o.cor)?o.cor:Mo(o.nome)}},ca=e=>{let o=D(e);return o&&Do(o)&&D(o.visto)&&_(D(o.visto).quando)?o:null},la=e=>{let o=D(e);return!o||!S(o.host)||!S(o.login)?!1:o.lista==="pessoal"||o.lista==="unidade"&&S(D(o.unidade)?.id)&&D(o.unidade)?.id!==""};function xt(e){let o=D(e);if(!o||o.formato!=="seipro-favoritos"||o.versao!==1||!Array.isArray(o.escopos))return null;let t=0,r=(i,n)=>{let s=Array.isArray(i)?i:[],c=s.map(n).filter(l=>l!==null);return t+=s.length-c.length,c},a=[];for(let i of o.escopos){let n=D(i);if(!n||!la(n.escopo)){t+=1;continue}a.push({escopo:n.escopo,favoritos:r(n.favoritos,ia),pastas:r(n.pastas,na),etiquetas:r(n.etiquetas,sa),vistos:r(n.vistos,ca)})}return{envelope:{formato:"seipro-favoritos",versao:1,escopos:a,gravadoEm:_(o.gravadoEm)?o.gravadoEm:0,dispositivo:S(o.dispositivo)?o.dispositivo:"",revisao:_(o.revisao)?o.revisao:0},descartados:t}}var At=100*1024,wt=80*1024,Io="[_SEIPRO_";function Et(e){let o=e.trim().toLowerCase(),t=`${Io}FAV_${o}]`;return t.length<=50?t:`${Io}FAV_${o.slice(0,27)}~${oo(o).slice(0,8)}]`}var Pt="Dados internos do SEI Pro (favoritos). N\xE3o use em documentos nem edite.";function yt(e,o){return{id:e.id,protocolo:"",etiquetas:[],ordem:"a0",criadoEm:e.criadoEm,atualizadoEm:e.atualizadoEm,dispositivo:e.dispositivo,resumido:!0,...o}}async function St(e,o,t,r=new Set){let{todos:a,pastas:i,etiquetas:n,vistos:s}=await e.instantaneoCompleto(),c=[];for(let l of a)if(!(l.sigiloAConfirmar&&!l.removidoEm)){if(l.sigiloso){r.has(l.id)&&c.push(yt(l,{sigiloso:!0,...l.removidoEm!==void 0?{removidoEm:l.removidoEm}:{}}));continue}c.push(l.removidoEm!==void 0||l.resumido?yt(l,l.removidoEm!==void 0?{removidoEm:l.removidoEm}:{}):l)}return{formato:"seipro-favoritos",versao:1,escopos:[{escopo:o,favoritos:c,pastas:i,etiquetas:n,vistos:s.filter(l=>c.some(d=>d.id===l.id&&!d.resumido&&!d.removidoEm))}],gravadoEm:t.agora,dispositivo:t.dispositivo,revisao:0}}async function Mt(e,o){let t=`Dados internos do SEI Pro \u2014 favoritos de ${o}. N\xE3o use em documentos nem edite: o SEI Pro regrava este texto sozinho.`;return vt(t,await ft(e))}var da=(e,o)=>e.host===o.host&&e.login.toLowerCase()===o.login.toLowerCase()&&e.lista===o.lista&&(e.unidade?.id??"")===(o.unidade?.id??"");async function Ct(e,o){let t=ht(e);if(!t)return{invalido:"o texto n\xE3o tem os dados do SEI Pro (foi editado ou est\xE1 vazio)"};let r;try{r=await gt(t)}catch{return{invalido:"os dados do texto est\xE3o corrompidos"}}let a=r;if(a?.formato==="seipro-favoritos"&&typeof a.versao=="number"&&a.versao>1)return{maisNovo:!0};let i=xt(r);if(!i)return{invalido:"o texto n\xE3o est\xE1 no formato dos favoritos"};let n=i.envelope.escopos;return n.length!==1||!da(n[0].escopo,o)?{invalido:"o texto \xE9 de outro usu\xE1rio ou de outra unidade"}:{envelope:i.envelope}}async function ua(e,o){let t=await e.listarCaixa(o),r=new Map;for(let c of e.repos)for(let l of await c.ativos()){if(l.sigiloso||l.sigiloAConfirmar||l.resumido||t.has(l.id))continue;let d=r.get(l.id)??{protocolo:l.protocolo,repos:[]};d.repos.push(c),r.set(l.id,d)}let a=r.size,i=0,n=0,s=0;await e.progresso({feitos:i,total:a});for(let[c,l]of r){if(o.aborted)break;await e.progresso({feitos:i,total:a,atual:l.protocolo});try{let d=await e.localizar(l.protocolo,o);if(d!==c||t.has(d))throw new Error("O n\xFAmero n\xE3o leva a este processo.");let p=await e.lerProcesso(l.protocolo,o);p.abertoNaUnidade&&s++;for(let u of l.repos){let m=(await u.atuais()).get(c),v={...m,quando:Date.now(),fonte:"atualizar",qtdDocumentos:p.qtdDocumentos,ultimoAndamento:p.ultimoAndamento??m?.ultimoAndamento,abertoNaUnidade:p.abertoNaUnidade,recebidoNaLeitura:p.abertoNaUnidade?!0:void 0};await u.gravarAtual(c,v),(await u.vistos()).has(c)||await u.gravarVisto(c,v)}}catch{if(o.aborted)break;n++}i++,i<a&&!o.aborted&&await e.esperar(e.intervalo??3e3,o).catch(()=>{})}return await e.progresso({feitos:i,total:a,fim:!0,cancelado:o.aborted,erros:n,chegaram:s}),{lidos:i,erros:n,chegaram:s}}var Tt=(e,o)=>`favoritos/atualizando/${e}|${o.toLowerCase()}`,pa=(e,o)=>`favoritos/atualizarCancelar/${e}|${o.toLowerCase()}`;var Lo=class{constructor(o,t,r){this.criarDeps=o;this.gravarProgresso=t;this.ouvir=r}emCurso=null;async iniciar(){if(this.emCurso)throw Object.assign(new Error("J\xE1 h\xE1 uma atualiza\xE7\xE3o em andamento nesta aba."),{codigo:"EM_ANDAMENTO"});let o=new AbortController;this.emCurso=o;let t=this.ouvir?pa(this.ouvir.host,this.ouvir.login):"",r=this.ouvir?.area.aoMudar(a=>{t in a&&a[t]?.novo!==void 0&&o.abort()});try{return await ua({...this.criarDeps(),progresso:a=>this.gravarProgresso(a)},o.signal)}finally{r?.(),this.emCurso=null}}cancelar(){return this.emCurso?.abort(),!!this.emCurso}};function f(e,o={},...t){let r=document.createElement(e);for(let[a,i]of Object.entries(o))i===void 0||i===!1||(typeof i=="function"?r.addEventListener(a.replace(/^on/,""),i):i===!0?r.setAttribute(a,""):a==="class"?r.className=i:a==="value"&&e==="textarea"?r.value=i:r.setAttribute(a,i));for(let a of t)a!=null&&a!==!1&&r.append(a);return r}var $={fill:"currentColor",stroke:"none"},Dt="M12 3.2l2.7 5.5 6 .9-4.35 4.25 1 6L12 17l-5.35 2.85 1-6L3.3 9.6l6-.9z",It={estrela:[["path",{d:Dt}]],estrelaCheia:[["path",{d:Dt,fill:"currentColor"}]],pasta:[["path",{d:"M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"}]],etiqueta:[["path",{d:"M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0z"}],["circle",{cx:"8",cy:"8",r:"1.4",...$}]],relogio:[["circle",{cx:"12",cy:"12",r:"9"}],["path",{d:"M12 7.2V12l3.2 1.9"}]],nota:[["path",{d:"M6 3.5h9l3.5 3.5v13.5H6z"}],["path",{d:"M9 11h6"}],["path",{d:"M9 15h6"}]],lixeira:[["path",{d:"M4.5 6.5h15"}],["path",{d:"M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7"}],["path",{d:"M6.8 6.5 7.6 19c0 .8.7 1.5 1.5 1.5h5.8c.8 0 1.5-.7 1.5-1.5l.8-12.5"}]],lapis:[["path",{d:"M17.5 3.5a2.1 2.1 0 0 1 3 3L9 18l-4.5 1.5L6 15z"}],["path",{d:"M15 6l3 3"}]],fechar:[["path",{d:"M18 6 6 18"}],["path",{d:"M6 6l12 12"}]],mais:[["path",{d:"M12 5v14"}],["path",{d:"M5 12h14"}]],busca:[["circle",{cx:"11",cy:"11",r:"6.5"}],["path",{d:"M20.5 20.5l-4.8-4.8"}]],baixar:[["path",{d:"M12 3.5v11"}],["path",{d:"M7.5 10.2 12 14.7l4.5-4.5"}],["path",{d:"M4.5 19.5h15"}]],subir:[["path",{d:"M12 14.5v-11"}],["path",{d:"M7.5 7.8 12 3.3l4.5 4.5"}],["path",{d:"M4.5 19.5h15"}]],copiar:[["rect",{x:"8.5",y:"8.5",width:"12",height:"12",rx:"2"}],["path",{d:"M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"}]],restaurar:[["path",{d:"M9 14 4 9l5-5"}],["path",{d:"M4 9h9a7 7 0 0 1 7 7v4"}]],check:[["path",{d:"M20 6.5 9.2 17.3 4 12.1"}]],alerta:[["path",{d:"M10.3 4.4 2.8 17.6a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0z"}],["path",{d:"M12 9.5v4"}],["circle",{cx:"12",cy:"16.8",r:"1",...$}]],menu:[["circle",{cx:"5",cy:"12",r:"1.4",...$}],["circle",{cx:"12",cy:"12",r:"1.4",...$}],["circle",{cx:"19",cy:"12",r:"1.4",...$}]],alca:[["circle",{cx:"9",cy:"6",r:"1.3",...$}],["circle",{cx:"15",cy:"6",r:"1.3",...$}],["circle",{cx:"9",cy:"12",r:"1.3",...$}],["circle",{cx:"15",cy:"12",r:"1.3",...$}],["circle",{cx:"9",cy:"18",r:"1.3",...$}],["circle",{cx:"15",cy:"18",r:"1.3",...$}]],ajustes:[["path",{d:"M4 7h5"}],["path",{d:"M13 7h7"}],["circle",{cx:"11",cy:"7",r:"2.1"}],["path",{d:"M4 17h9"}],["path",{d:"M17 17h3"}],["circle",{cx:"15",cy:"17",r:"2.1"}]],setaCima:[["path",{d:"M12 19V6"}],["path",{d:"M6 12l6-6 6 6"}]],setaBaixo:[["path",{d:"M12 5v13"}],["path",{d:"M18 12l-6 6-6-6"}]],recolher:[["path",{d:"M6 15l6-6 6 6"}]],expandir:[["path",{d:"M6 9l6 6 6-6"}]],local:[["path",{d:"M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"}],["circle",{cx:"12",cy:"10",r:"2.3"}]],sino:[["path",{d:"M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14z"}],["path",{d:"M10 20.5a2 2 0 0 0 4 0"}]],documento:[["path",{d:"M7 3.5h7l4 4v13H7z"}],["path",{d:"M14 3.5v4h4"}]],painel:[["rect",{x:"3.5",y:"4.5",width:"17",height:"15",rx:"2"}],["path",{d:"M14.5 4.5v15"}]],atualizar:[["path",{d:"M19.5 12a7.5 7.5 0 1 1-2.2-5.3"}],["path",{d:"M19.5 4.5v4h-4"}]],nuvem:[["path",{d:"M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z"}]],chevron:[["path",{d:"M7 9.5l5 5 5-5"}]],filtro:[["path",{d:"M4 5.5h16l-6.2 7.3v5.4l-3.6 1.8v-7.2z"}]],ordenar:[["path",{d:"M7.5 4.5v15"}],["path",{d:"M4 16l3.5 3.5L11 16"}],["path",{d:"M16.5 19.5v-15"}],["path",{d:"M13 8l3.5-3.5L20 8"}]],mapa:[["path",{d:"M9 4.5 3.5 6.6v13l5.5-2.1 6 2.1 5.5-2.1v-13L15 6.6z"}],["path",{d:"M9 4.5v13"}],["path",{d:"M15 6.6v13"}]],olho:[["path",{d:"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"}],["circle",{cx:"12",cy:"12",r:"2.8"}]],camadas:[["path",{d:"M12 3.5 20.5 8 12 12.5 3.5 8z"}],["path",{d:"M3.5 12 12 16.5 20.5 12"}],["path",{d:"M3.5 16 12 20.5 20.5 16"}]],historico:[["path",{d:"M3.8 12.5A8.3 8.3 0 1 0 6.2 6"}],["path",{d:"M3.8 4.2v4.3h4.3"}],["path",{d:"M12 8v4.2l2.8 1.7"}]],pessoa:[["circle",{cx:"12",cy:"8",r:"3.6"}],["path",{d:"M5 20c.9-3.7 3.6-5.6 7-5.6s6.1 1.9 7 5.6"}]],predio:[["path",{d:"M5 20.5v-15a1 1 0 0 1 1-1h7.5a1 1 0 0 1 1 1v15"}],["path",{d:"M14.5 9.5H18a1 1 0 0 1 1 1v10"}],["path",{d:"M3 20.5h18"}],["path",{d:"M8.5 8.5h3"}],["path",{d:"M8.5 12h3"}],["path",{d:"M8.5 15.5h3"}]],brilho:[["path",{d:"M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"}],["path",{d:"M18.5 16.5v4"}],["path",{d:"M16.5 18.5h4"}]],calendario:[["rect",{x:"4",y:"5.5",width:"16",height:"15",rx:"2"}],["path",{d:"M4 10h16"}],["path",{d:"M8.5 3.5v4"}],["path",{d:"M15.5 3.5v4"}]],cadeado:[["rect",{x:"5.5",y:"10.5",width:"13",height:"10",rx:"2"}],["path",{d:"M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"}]],saida:[["path",{d:"M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14"}],["path",{d:"M10 16l4-4-4-4"}],["path",{d:"M14 12H4.5"}]],planilha:[["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2"}],["path",{d:"M4 9.5h16"}],["path",{d:"M4 15h16"}],["path",{d:"M10 9.5V20"}]],mover:[["path",{d:"M4.5 12h14"}],["path",{d:"M13.5 6.5 19 12l-5.5 5.5"}]],sol:[["circle",{cx:"12",cy:"12",r:"3.8"}],["path",{d:"M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"}]],teclado:[["rect",{x:"3",y:"6.5",width:"18",height:"11",rx:"2"}],["path",{d:"M7 10h.01M10.3 10h.01M13.7 10h.01M17 10h.01M8 14h8"}]]},kn=Object.keys(It);function M(e,o=18){let t="http://www.w3.org/2000/svg",r=document.createElementNS(t,"svg"),a={viewBox:"0 0 24 24",width:String(o),height:String(o),fill:"none",stroke:"currentColor","stroke-width":"1.8","stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true",focusable:"false",class:"spro-icone"};for(let[i,n]of Object.entries(a))r.setAttribute(i,n);for(let[i,n]of It[e]){let s=document.createElementNS(t,i);for(let[c,l]of Object.entries(n))s.setAttribute(c,l);r.append(s)}return r}var ma="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483646;display:flex;align-items:center;gap:12px;max-width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:10px 10px 10px 16px;font:13px/1.35 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#f3f5f8;background:#1f2329;border:1px solid rgb(255 255 255 / 8%);border-radius:12px;box-shadow:0 10px 24px -6px rgb(16 24 40 / 30%),0 24px 56px -12px rgb(16 24 40 / 35%);animation:spro-fav-aviso 220ms cubic-bezier(.2,.8,.2,1)",fa="flex:none;padding:5px 10px;font:inherit;font-weight:600;color:#9cc3ff;background:rgb(255 255 255 / 7%);border:0;border-radius:6px;cursor:pointer";function Lt(e,o){return(t,r,a)=>new Promise(i=>{for(let l of e.querySelectorAll(".spro-fav-aviso"))l.remove();let n=!1,s=l=>{n||(n=!0,c.remove(),i(l))},c=f("div",{class:"spro-fav-aviso",role:"status",style:ma+(o?";background:#2b3036":"")},f("span",{style:"flex:1"},t),r?f("button",{type:"button",style:fa,onclick:()=>s(!0)},r):null);(e.body??e.documentElement).append(c),setTimeout(()=>s(!1),Math.max(10,Math.min(a,6e4)))})}function ga(e){let o=e.closest?.("dialog[open]");if(o)return o;let t=e.getRootNode?.(),r=e.ownerDocument;return t&&t!==r&&t.host?t:r.body??r.documentElement}function Ot(e,o){let t=e;try{t?.CustomEvent&&t.dispatchEvent(new t.CustomEvent("spro-popover",{detail:{fundo:o}}))}catch{}}function qt(e,o,t){let r=e.ownerDocument,a=r.defaultView;ga(e).append(o);let i=!0,n=()=>{if(!i)return;let l=e.getBoundingClientRect?.();if(!l)return;let d=a?.innerHeight??0,p=a?.innerWidth??0,u=Math.min(t.largura??Math.max(l.width,t.larguraMinima??0),Math.max(180,p-16)),m=t.alinharDireita?l.right-u:l.left,v=Math.max(8,Math.min(m,p-u-8)),y=t.alturaMaxima??360,P=Math.min(o.scrollHeight||y,y),A=d-l.bottom-8,w=l.top-8,O=A<Math.min(P,200)&&w>A;o.style.left=`${v}px`,o.style.width=`${u}px`,o.style.maxHeight=`${Math.max(140,Math.min(y,O?w:A>140?A:y))}px`,o.classList.toggle("spro-flutuante-cima",O),O?(o.style.top="",o.style.bottom=`${d-l.top+4}px`):(o.style.bottom="",o.style.top=`${l.bottom+4}px`),Ot(a,O?0:Math.ceil(l.bottom+4+P+12))},s=l=>{let d=l.composedPath?.()??[],p=l.target,u=m=>d.includes(m)||!!p&&!!m.contains?.(p);u(o)||u(e)||t.aoFechar()},c=l=>{l.target instanceof Node&&o.contains(l.target)||n()};return r.addEventListener("pointerdown",s,!0),a?.addEventListener("scroll",c,!0),a?.addEventListener("resize",n),n(),{posicionar:n,fechar(){i&&(i=!1,r.removeEventListener("pointerdown",s,!0),a?.removeEventListener("scroll",c,!0),a?.removeEventListener("resize",n),o.remove(),Ot(a,0))}}}function kt(e,o){let t=L(o);if(!t)return[...e];let r=t.split(" "),a=[];return e.forEach((i,n)=>{let s=L(i.rotulo),c=`${s} ${L(i.descricao??"")}`;if(!r.every(d=>c.includes(d)))return;let l=s.startsWith(t)?0:s.split(" ").some(d=>d.startsWith(r[0]))?1:2;a.push({o:i,nota:l,i:n})}),a.sort((i,n)=>i.nota-n.nota||i.i-n.i).map(i=>i.o)}function va(e,o){let t=L(o).split(" ").filter(Boolean);if(!t.length)return[{texto:e,marcado:!1}];let r=[...e],a="",i=[];r.forEach((c,l)=>{let d=c.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();for(let p of d)a+=p,i.push(l)});let n=new Array(r.length).fill(!1);for(let c of t){let l=a.indexOf(c);if(!(l<0))for(let d=l;d<l+c.length;d++)n[i[d]]=!0}let s=[];return r.forEach((c,l)=>{let d=s[s.length-1];d&&d.marcado===n[l]?d.texto+=c:s.push({texto:c,marcado:n[l]})}),s}var ha=0;function fo(e){let o=`spro-combo-${++ha}`,t=()=>typeof e.opcoes=="function"?e.opcoes():e.opcoes,r=new Map,a=g=>t().find(h=>h.valor===g)??r.get(g),i=[...e.valor??[]],n=null,s="",c=0,l=[],d=null,p=f("button",{type:"button",class:`spro-combo${e.classe?` ${e.classe}`:""}`,role:"combobox","aria-haspopup":"listbox","aria-expanded":"false","aria-label":e.rotulo,title:e.rotulo}),u=()=>e.aoMudar?.([...i]);function m(){let g=[];e.icone&&g.push(M(e.icone,15));let h=i.map(q=>a(q)).filter(q=>!!q),b=f("span",{class:"spro-combo-texto"});if(!h.length)b.classList.add("spro-combo-vazio"),b.append(e.vazio??"Escolher\u2026");else{let q=h[0];q.cor&&b.append(f("span",{class:"spro-combo-cor",style:`background:${q.cor}`})),b.append(f("span",{class:"spro-combo-rotulo"},q.rotulo)),h.length>1&&b.append(f("span",{class:"spro-combo-mais"},`+${h.length-1}`))}g.push(b,M("chevron",14)),p.classList.toggle("spro-combo-ativo",e.multiplo===!0&&h.length>0),p.replaceChildren(...g)}let v=()=>e.busca??(t().length>7||!!e.multiplo||!!e.criar);function y(g){if(e.multiplo){i=i.includes(g.valor)?i.filter(b=>b!==g.valor):[...i,g.valor],u(),m(),O();return}let h=i.length!==1||i[0]!==g.valor;i=[g.valor],m(),eo(!0),h&&u()}async function P(){if(!e.criar)return;let g=s.trim();if(!g)return;let h=await e.criar(g);if(h){if(r.set(h.valor,h),s="",n){let b=n.querySelector(".spro-combo-busca");b&&(b.value="")}e.multiplo&&i.includes(h.valor)?O():y(h)}}function A(g,h){let b=i.includes(g.valor),q=f("span",{class:"spro-combo-op-rotulo"});for(let C of va(g.rotulo,s))q.append(C.marcado?f("mark",{},C.texto):C.texto);let z=f("li",{role:"option",id:`${o}-op-${h}`,class:`spro-combo-op${h===c?" spro-combo-op-ativa":""}`,"data-valor":g.valor,"aria-selected":b?"true":"false"},e.multiplo?f("span",{class:"spro-combo-caixa","aria-hidden":"true"},b?M("check",12):null):null,g.cor?f("span",{class:"spro-combo-cor",style:`background:${g.cor}`}):null,g.icone?M(g.icone,15):null,f("span",{class:"spro-combo-op-textos"},q,g.descricao?f("span",{class:"spro-combo-op-desc"},g.descricao):null),g.contagem!==void 0?f("span",{class:"spro-combo-conta"},String(g.contagem)):null,!e.multiplo&&b?f("span",{class:"spro-combo-marca"},M("check",14)):null);return z.addEventListener("pointerdown",C=>C.preventDefault()),z.addEventListener("click",()=>{c=h,y(g)}),z.addEventListener("pointermove",()=>{c!==h&&(c=h,w())}),z}function w(){if(!n)return;let g=[...n.querySelectorAll('[role="option"]')];g.forEach((z,C)=>{z.classList.toggle("spro-combo-op-ativa",C===c)});let h=g[c],q=n.querySelector(".spro-combo-busca")??n.querySelector('[role="listbox"]');h?(q?.setAttribute("aria-activedescendant",h.id),h.scrollIntoView?.({block:"nearest"})):q?.removeAttribute("aria-activedescendant")}function O(){if(!n)return;l=kt(t(),s),c>=l.length&&(c=Math.max(0,l.length-1)),n.querySelector('[role="listbox"]').replaceChildren(...l.map(A));let h=n.querySelector(".spro-combo-extras");h.replaceChildren();let b=s.trim();l.length||h.append(f("p",{class:"spro-combo-nada"},b?"Nada encontrado.":"Nenhuma op\xE7\xE3o."));let q=t().some(C=>L(C.rotulo)===L(b));if(e.criar&&b&&!q){let C=f("button",{type:"button",class:"spro-combo-criar"},M("mais",14),f("span",{},e.rotuloCriar?e.rotuloCriar(b):`Criar \u201C${b}\u201D`));C.addEventListener("pointerdown",ho=>ho.preventDefault()),C.addEventListener("click",()=>void P()),h.append(C)}let z=n.querySelector(".spro-combo-rodape");if(z){let C=l.filter(Fo=>!i.includes(Fo.valor)),ho=f("button",{type:"button",class:"spro-combo-acao",disabled:!b||!C.length},`Marcar os filtrados${b&&C.length?` (${C.length})`:""}`);ho.addEventListener("click",()=>{i=[...i,...C.map(Fo=>Fo.valor)],u(),m(),O()});let se=f("button",{type:"button",class:"spro-combo-acao spro-combo-limpar",disabled:!i.length},"Limpar");se.addEventListener("click",()=>{i=[],u(),m(),O()}),z.replaceChildren(f("span",{class:"spro-combo-total"},i.length?`${i.length} marcado${i.length>1?"s":""}`:""),ho,se)}w()}let ne=()=>d?.posicionar();function Mr(g){let h=l.length;switch(g.key){case"ArrowDown":c=h?(c+1)%h:0,w();break;case"ArrowUp":c=h?(c-1+h)%h:0,w();break;case"Home":if(g.target?.classList?.contains("spro-combo-busca")&&s)return;c=0,w();break;case"End":if(g.target?.classList?.contains("spro-combo-busca")&&s)return;c=Math.max(0,h-1),w();break;case"Enter":{let b=l[c];b?y(b):P();break}case"Escape":eo(!0);break;case"Tab":eo(!1);return;case"Backspace":if(!e.multiplo||s||!i.length)return;i=i.slice(0,-1),u(),m(),O();break;default:return}g.preventDefault(),g.stopPropagation()}function vo(g=""){if(n)return;s=g,c=g?0:(()=>{let z=kt(t(),s).findIndex(C=>C.valor===i[i.length-1]);return z<0?0:z})();let b=v()?f("input",{type:"text",class:"spro-combo-busca",placeholder:e.criar?"Buscar ou criar\u2026":"Buscar\u2026","aria-label":`Filtrar ${e.rotulo.toLowerCase()}`,"aria-controls":`${o}-lista`,"aria-autocomplete":"list",autocomplete:"off",spellcheck:"false",value:g}):null;b&&(b.value=g,b.addEventListener("input",()=>{s=b.value,c=0,O(),ne()})),n=f("div",{class:`spro-combo-pop${e.multiplo?" spro-combo-pop-multi":""}`},b?f("div",{class:"spro-combo-cabeca"},M("busca",15),b):null,f("ul",{role:"listbox",id:`${o}-lista`,class:"spro-combo-lista",tabindex:b?void 0:"-1","aria-label":e.rotulo,"aria-multiselectable":e.multiplo?"true":void 0}),f("div",{class:"spro-combo-extras"}),e.multiplo?f("div",{class:"spro-combo-rodape"}):null),n.addEventListener("keydown",Mr),d=qt(p,n,{larguraMinima:e.larguraLista??220,alturaMaxima:360,aoFechar:()=>eo(!1)}),p.setAttribute("aria-expanded","true"),p.setAttribute("aria-controls",`${o}-lista`),p.classList.add("spro-combo-aberto"),O(),ne(),(b??n.querySelector('[role="listbox"]'))?.focus?.({preventScroll:!0}),b&&g&&b.setSelectionRange?.(g.length,g.length)}function eo(g=!1){n&&(d?.fechar(),d=null,n=null,s="",p.setAttribute("aria-expanded","false"),p.removeAttribute("aria-controls"),p.classList.remove("spro-combo-aberto"),g&&p.focus?.({preventScroll:!0}))}return p.addEventListener("click",()=>n?eo(!0):vo()),p.addEventListener("keydown",g=>{n||(g.key==="ArrowDown"||g.key==="ArrowUp"?(g.preventDefault(),vo()):g.key.length===1&&g.key!==" "&&!g.ctrlKey&&!g.metaKey&&!g.altKey&&v()&&(g.preventDefault(),vo(g.key)))}),m(),{el:p,valor:()=>[...i],definir(g,h=!1){i=[...g],m(),O(),h&&u()},atualizar(){m(),O()},abrir:vo,fechar:()=>eo(!1)}}function Nt(e,o,t,r="spro-campo"){let a=[["",o?`Lembrete em ${o.em.split("-").reverse().join("/")}`:"Sem lembrete"],["1","Lembrar amanh\xE3"],["7","Lembrar em 1 semana"],["30","Lembrar em 1 m\xEAs"],...o?[["0","Tirar o lembrete"]]:[]],i=f("select",{class:r,"aria-label":"Lembrete"},...a.map(([n,s])=>f("option",{value:n},s)));return i.addEventListener("change",()=>{let n=i.value;n!==""&&t(n==="0"?void 0:{...o,em:co(e,Number(n))})}),i}function Rt(e,o,t){let r=o,a=n=>bo(co(e,n)),i=fo({rotulo:"Lembrete",icone:"sino",vazio:"Sem lembrete",busca:!1,larguraLista:240,opcoes:()=>[...r?[{valor:"atual",rotulo:`Lembrete em ${bo(r.em)}`,icone:"sino"}]:[],{valor:"1",rotulo:"Amanh\xE3",descricao:a(1),icone:"calendario"},{valor:"7",rotulo:"Em 1 semana",descricao:a(7),icone:"calendario"},{valor:"30",rotulo:"Em 1 m\xEAs",descricao:a(30),icone:"calendario"},...r?[{valor:"0",rotulo:"Tirar o lembrete",icone:"fechar"}]:[]],valor:r?["atual"]:[],aoMudar:n=>{let s=n[0];!s||s==="atual"||(r=s==="0"?void 0:{...r,em:co(e,Number(s))},i.definir(r?["atual"]:[]),t(r))}});return i.el}var ba=`:host{all:initial}
.fav-balao{box-sizing:border-box;width:340px;display:grid;gap:10px;padding:14px;font:13px/1.4 var(--spro-fonte);color:var(--spro-texto);background:var(--spro-fundo);border:1px solid var(--spro-borda);border-radius:var(--spro-raio-xg);box-shadow:var(--spro-sombra-3);animation:spro-surgir 160ms var(--spro-curva)}
.fav-balao-topo{display:flex;align-items:center;gap:10px}
.fav-balao-estrela{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:var(--spro-raio);color:var(--spro-estrela);background:color-mix(in srgb,var(--spro-estrela) 16%,transparent)}
.fav-balao-titulo{flex:1;min-width:0;display:grid;line-height:1.25}
.fav-balao-titulo strong{font-size:14px}
.fav-balao-titulo span{font-size:11.5px;color:var(--spro-suave);font-variant-numeric:tabular-nums;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fav-campo{display:grid;gap:5px}
.fav-rotulo{font-size:11.5px;font-weight:600;color:var(--spro-suave);letter-spacing:.01em}
.fav-campo .spro-combo{width:100%}
.fav-campo .spro-combo-ativo{color:var(--spro-texto);background:var(--spro-fundo);border-color:var(--spro-borda-forte)}
.fav-chips-sel{display:flex;flex-wrap:wrap;gap:5px}
.fav-chips-sel:empty{display:none}
.fav-chips-sel .spro-chip .spro-icone{opacity:.6}
.fav-balao-rodape{display:flex;justify-content:flex-end;padding-top:2px}
textarea.spro-campo{resize:vertical;width:100%}`;function xa(e){let o=e.favorito,t=[...e.etiquetas],r=async u=>{o=await e.editar(u)},a=(u,m)=>f("button",{type:"button","aria-pressed":String(e.lista===m),title:m==="pessoal"?"Mover para a sua lista Pessoal":`Mover para a lista da ${u}`,onclick:()=>{e.lista!==m&&e.moverPara(m)}},u),i=e.siglaUnidade?f("div",{class:"spro-segmentado fav-balao-listas",role:"group","aria-label":"Lista"},a(e.siglaUnidade,"unidade"),a("Pessoal","pessoal")):null,n=[...e.pastas],s=fo({rotulo:"Pasta",icone:"pasta",vazio:"(sem pasta)",busca:!0,opcoes:()=>[{valor:"",rotulo:"(sem pasta)"},...n.map(u=>({valor:u.id,rotulo:u.nome,cor:u.cor}))],valor:o.pasta?[o.pasta]:[],criar:async u=>{let m=await e.criarPasta(u.slice(0,60));return n=[...n.filter(v=>v.id!==m.id),m],{valor:m.id,rotulo:m.nome,cor:m.cor}},rotuloCriar:u=>`Criar a pasta \u201C${u}\u201D`,aoMudar:u=>void r({pasta:u[0]||void 0}),larguraLista:260}),c=f("div",{class:"fav-chips-sel"}),l=fo({rotulo:"Etiquetas",icone:"etiqueta",vazio:"Nenhuma",multiplo:!0,opcoes:()=>t.map(u=>({valor:u.id,rotulo:u.nome,cor:u.cor})),valor:o.etiquetas,criar:async u=>{let m=await e.criarEtiqueta(u.slice(0,40));return t=[...t.filter(v=>v.id!==m.id),m],{valor:m.id,rotulo:m.nome,cor:m.cor}},rotuloCriar:u=>`Criar a etiqueta \u201C${u}\u201D`,aoMudar:u=>{d(),r({etiquetas:u})},larguraLista:260}),d=()=>c.replaceChildren(...l.valor().map(u=>{let m=t.find(v=>v.id===u);return f("button",{type:"button",class:"spro-chip",style:`--cor:${m?.cor??"#ccc"}`,title:"Tirar esta etiqueta","aria-label":`Tirar a etiqueta ${m?.nome??""}`,onclick:()=>l.definir(l.valor().filter(v=>v!==u),!0)},m?.nome??"",M("fechar",11))}));d();let p=f("textarea",{class:"spro-campo",rows:"2",maxlength:String(2e3),placeholder:"Nota pessoal","aria-label":"Nota",value:o.nota??""});return p.addEventListener("change",()=>void r({nota:p.value})),f("div",{class:"fav-balao",role:"dialog","aria-label":`Favorito ${o.protocolo}`},f("div",{class:"fav-balao-topo"},f("span",{class:"fav-balao-estrela"},M("estrelaCheia",16)),f("span",{class:"fav-balao-titulo"},f("strong",{},"Favoritado"),f("span",{},o.protocolo)),i,f("button",{type:"button",class:"spro-botao-icone pequeno","aria-label":"Fechar",onclick:()=>e.fechar()},M("fechar",14))),f("div",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Pasta"),s.el),f("div",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Etiquetas"),l.el,c),f("label",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Nota"),p),e.hoje?f("div",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Lembrete"),Rt(e.hoje,o.lembrete,u=>void r({lembrete:u}))):null,f("div",{class:"fav-balao-rodape"},f("button",{type:"button",class:"spro-botao primario",onclick:()=>e.fechar()},M("check",14),"Pronto")))}var Oo=null;function zt(e,o,t){Oo?.();let r=e.ownerDocument,a=r.defaultView,i=r.createElement("div");i.setAttribute("data-tema",o.temaEscuro?"escuro":"claro");let n=i.attachShadow({mode:"open"}),s=r.createElement("style");s.textContent=`${t}
${ba}`;let c=v=>{v.composedPath().includes(i)||d()},l=v=>{v.key==="Escape"&&!n.querySelector(".spro-combo-pop")&&d()};function d(){i.remove(),r.removeEventListener("pointerdown",c,!0),r.removeEventListener("keydown",l,!0),Oo===d&&(Oo=null)}let p=xa({...o,fechar:d});n.append(s,p);let u=e.getBoundingClientRect(),m=Math.max(8,Math.min(u.left,(a?.innerWidth??1024)-340))+(a?.scrollX??0);return i.style.cssText=`position:absolute;z-index:2147483000;left:${Math.round(m)}px;top:${Math.round(u.bottom+(a?.scrollY??0)+4)}px`,r.body.append(i),r.addEventListener("pointerdown",c,!0),r.addEventListener("keydown",l,!0),p.querySelector(".spro-combo")?.focus(),Oo=d,d}function Ft(e,o){let t=e.querySelector("#divBotoesControleProcessos, #divComandos");if(!t||t.querySelector(".spro-fav-botao"))return null;let r=f("a",{href:"#",role:"button",class:"botaoSEI spro-fav-botao",title:"Favoritos","aria-label":"Favoritos",tabindex:"452",style:"cursor: pointer;"},f("img",{class:"infraCorBarraSistema",src:o.url("icons/menu/favoritos.svg"),alt:"Favoritos",title:"Favoritos"}));return r.addEventListener("click",a=>{a.preventDefault(),o.destino()==="lateral"?o.abrirLateral():o.rolarAtePainel()}),t.append(r),r}function _t(e,o){let t=e.querySelector("#topmenu .spro-fav-estrela");if(!t||t.parentElement?.querySelector(".spro-fav-abrir"))return null;let r="Abrir a lista de favoritos no painel lateral",a=f("button",{type:"button",class:"spro-fav-abrir",title:r,"aria-label":r},M("painel",16));return a.addEventListener("click",i=>{i.preventDefault(),i.stopPropagation(),o.abrirLateral()}),t.after(a),a}function $t(e,o,t){e({tipo:"abrirPainel",aba:"favoritos"}).catch(()=>o(t))}async function Ht(e,o){let t=0;for(let r of e){let[a,i,n]=await Promise.all([r.ativos(),r.atuais(),r.vistos()]);t+=a.filter(s=>Yo(s,o)||it(n.get(s.id)??s.visto,i.get(s.id)).length>0).length}return t}function Vt(e,o){e.querySelector(".spro-fav-contador")?.remove(),e.title=o?`Favoritos: ${o} ${o===1?"favorito pede":"favoritos pedem"} aten\xE7\xE3o (lembrete ou novidade)`:"Favoritos",o&&e.append(f("span",{class:"spro-fav-contador","aria-hidden":"true"},String(o)))}function R(e,o=e.location?.href??"https://sei.invalido/sei/controlador.php"){return{url:o,status:200,get html(){return e.documentElement.outerHTML},doc:e}}function Ut(){try{return window.top?.document??document}catch{return document}}function Bt(e,o,t){let r=Xo(R(e,t));return r.usuario.login?{host:r.host,login:r.usuario.login.toLowerCase(),nome:r.usuario.nome,unidade:r.unidade.id?{id:r.unidade.id,sigla:r.unidade.sigla,nome:r.unidade.nome}:null,versao:r.versao,temaEscuro:o}:null}function jt(e){try{return!!e.getItem("darkModePro")}catch{return!1}}function Gt(e){let o=e.defaultView;for(let t of[".infraCorBarraSistema","#divInfraBarraSistema","#divInfraBarraSistemaE"]){let r=e.querySelector(t);if(r)try{let a=at(o?.getComputedStyle?.(r).backgroundColor??"");if(a)return a}catch{}}}async function Kt(e,o,t){let r=await e.unidade?.contem(o.id)?e.unidade:await e.pessoal.contem(o.id)?e.pessoal:null;r||(r=e.unidade??e.pessoal,await r.adicionar(o));let i=(await r.obter(o.id))?.documentos??[];if(i.some(s=>s.id===t.id))return await r.editar(o.id,{documentos:i.filter(s=>s.id!==t.id)}),!1;let n={id:t.id,numero:t.numero,titulo:t.titulo,criadoEm:Date.now()};return await r.editar(o.id,{documentos:[...i,n]}),!0}function Xt(e,o){let t=o?"Tirar dos documentos favoritos":"Guardar este documento nos favoritos";e.setAttribute("aria-pressed",String(o)),e.setAttribute("aria-label",t),e.title=t,e.replaceChildren(M(o?"estrelaCheia":"estrela",13))}function Wt(e,o,t){let r=new Map(o.map(l=>[l.id,l])),a=()=>{for(let l of o){let d=e.getElementById(`anchor${l.id}`);if(!d||d.nextElementSibling?.classList.contains("spro-fav-doc"))continue;let p=f("button",{type:"button",class:"spro-fav-doc","data-doc":l.id});Xt(p,t.marcado(l.id)),d.after(p)}},i=()=>{for(let l of e.querySelectorAll(".spro-fav-doc"))Xt(l,t.marcado(l.dataset.doc??""))};e.addEventListener("click",l=>{let d=l.target?.closest?.(".spro-fav-doc");if(!d)return;l.preventDefault(),l.stopPropagation();let p=r.get(d.dataset.doc??"");!p||d.getAttribute("aria-busy")==="true"||(d.setAttribute("aria-busy","true"),t.alternar(p).catch(u=>console.warn("[SEI Pro] favoritos: documento",u)).finally(()=>{d.removeAttribute("aria-busy"),i()}))}),a();let n=e.querySelector("#divArvore")??e.body,s,c=typeof MutationObserver=="function"?new MutationObserver(()=>{clearTimeout(s),s=setTimeout(a,150)}):null;return c?.observe(n,{childList:!0,subtree:!0}),{parar:()=>{c?.disconnect(),clearTimeout(s)},repintar:i}}var Jt=/^\d{4}-\d{2}-\d{2}$/;function Zt(e){if(e.modo==="nenhum"||!Jt.test(e.referencia))return;if(e.modo==="proximo"){let t=(e.tipos??"").split(",").map(a=>a.trim()).filter(Boolean),r=Math.trunc(Math.abs(e.n));return!t.length||!Number.isFinite(r)||r===0?void 0:{referencia:{de:"novoDocumento",tipos:t,desde:e.referencia},vencimento:{em:"dias",n:r,contagem:e.contagem},exibicao:"ate"}}let o=e.documento&&e.modo!=="data"?{de:"documento",idDocumento:e.documento.id,data:e.referencia}:{de:"data",data:e.referencia};if(e.modo==="data")return Jt.test(e.vencimento)?{referencia:o,vencimento:{em:"data",data:e.vencimento},exibicao:"ate"}:void 0;if(e.modo==="dias"){let t=Math.trunc(Math.abs(e.n));return!Number.isFinite(t)||t===0?void 0:{referencia:o,vencimento:{em:"dias",n:e.sentido==="antes"?-t:t,contagem:e.contagem},exibicao:"ate"}}return{referencia:o,exibicao:e.contagem==="uteis"?"desdeUteis":"desde"}}var Yt='#frmAtividadeListar[action*="acao=procedimento_enviar"]';function ya(e){return[...e.querySelectorAll(`${Yt} #selProcedimentos option`)].map(o=>{let t=(o.textContent??"").trim(),r=t.indexOf(" - "),a=(r>=0?t.slice(0,r):t).trim(),i=r>=0?t.slice(r+3).trim():"";return{id:o.value.trim(),protocolo:a,especificacao:i||void 0}}).filter(o=>/^\d+$/.test(o.id)&&o.protocolo)}async function Qt(e,o){let t=e.querySelector(Yt);if(!t||t.querySelector(".spro-fav-envio"))return null;let r=ya(e);if(!r.length)return null;let a=r.length>1,i=f("input",{type:"checkbox",id:"chkSproManterFavoritos",style:"appearance:auto;opacity:1;position:static;width:auto;height:auto;margin:0"});i.checked=r.every(m=>o.ativo(m.id));let n=f("select",{class:"infraSelect",style:"width:auto;min-width:12em"}),s=f("input",{type:"date",class:"infraText",style:"width:auto"}),c=f("div",{class:"spro-fav-envio-opcoes",style:"display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:6px 0 0 22px"},f("label",{style:"display:inline-flex;gap:6px;align-items:center"},"Pasta:",n),f("label",{style:"display:inline-flex;gap:6px;align-items:center"},"Prazo at\xE9:",s),Nt(o.hoje(),void 0,m=>d({lembrete:m}),"infraSelect"));c.hidden=!i.checked;let l=async()=>{let[m,v]=await Promise.all([o.pastas(),o.obter(r[0].id)]);if(n.replaceChildren(f("option",{value:""},"(sem pasta)"),...m.map(y=>f("option",{value:y.id},y.nome))),!a&&v&&v.removidoEm===void 0){for(let y of n.options)y.selected=y.value===(v.pasta??"");s.value=v.prazo?.vencimento?.em==="data"?v.prazo.vencimento.data:""}};await l(),i.addEventListener("change",()=>{c.hidden=!i.checked,(async()=>{if(i.checked){for(let m of r)o.ativo(m.id)||await o.adicionar(m);await l()}else await o.remover(r.map(m=>m.id))})().catch(m=>console.warn("[SEI Pro] favoritos: n\xE3o foi poss\xEDvel gravar no envio",m))});let d=m=>void Promise.all(r.map(v=>o.editar(v.id,m))).catch(v=>console.warn("[SEI Pro] favoritos: n\xE3o foi poss\xEDvel gravar no envio",v));n.addEventListener("change",()=>d({pasta:n.value||void 0})),s.addEventListener("change",()=>{let m=s.value?Zt({modo:"data",referencia:o.hoje(),vencimento:s.value,n:0,contagem:"corridos",sentido:"depois"}):void 0;d({prazo:m})});let p=a?`Manter os ${r.length} processos em Favoritos`:"Manter processo em Favoritos",u=f("div",{class:"infraAreaDados spro-fav-envio",style:"position:relative;clear:both;height:auto;margin:10px 0;padding:0"},f("label",{for:"chkSproManterFavoritos",style:"display:inline-flex;gap:6px;align-items:center;cursor:pointer"},i,p),c);return t.append(u),u}var or="spro-fav-estilo",Aa=`.spro-fav-estrela{background:none;border:0;padding:0 3px;margin:0 2px;cursor:pointer;color:#8a8a8a;vertical-align:middle;line-height:0}
.spro-fav-estrela:hover{color:#5f5f5f}
.spro-fav-estrela[aria-pressed="true"]{color:#e0a100}
.spro-fav-estrela[data-erro]{color:#c62828}
.spro-fav-estrela[aria-busy="true"]{opacity:.5}
.spro-fav-estrela:focus-visible{outline:2px solid #1a73e8;outline-offset:1px;border-radius:3px}
.spro-fav-abrir{background:none;border:0;padding:0 3px;margin:0 2px;cursor:pointer;color:#8a8a8a;vertical-align:middle;line-height:0}
.spro-fav-abrir:hover{color:#5f5f5f}
.spro-fav-abrir:focus-visible{outline:2px solid #1a73e8;outline-offset:1px;border-radius:3px}
.spro-fav-doc{background:none;border:0;padding:0 2px;margin:0 0 0 2px;cursor:pointer;color:#a0a0a0;vertical-align:middle;line-height:0}
.spro-fav-doc:hover{color:#5f5f5f}
.spro-fav-doc[aria-pressed="true"]{color:#e0a100}
.spro-fav-doc[aria-busy="true"]{opacity:.5}
.spro-fav-doc:focus-visible{outline:2px solid #1a73e8;outline-offset:1px;border-radius:3px}
.spro-fav-botao{position:relative}
.spro-fav-contador{position:absolute;top:-4px;right:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#d93025;color:#fff;font:600 10px/16px sans-serif;text-align:center;box-sizing:border-box}
.spro-fav-titulo{display:flex!important;align-items:center;gap:6px}
.spro-fav-recolher{margin-left:auto;background:none;border:0;cursor:pointer;color:inherit;line-height:0;padding:2px}`;function F(e){if(e.getElementById(or))return;let o=e.createElement("style");o.id=or,o.textContent=Aa,(e.head??e.documentElement).append(o)}var er=new WeakMap;function J(e,o,t){let r=er.get(e);if(r){r.push(t);return}let a=[t];er.set(e,a),e.addEventListener("click",i=>{let n=i.target?.closest?.(".spro-fav-estrela");if(n&&(i.preventDefault(),i.stopPropagation(),n.getAttribute("aria-busy")!=="true"))for(let s of a){let c=s(n);if(c){wa(o,c,n);return}}},!0)}async function wa(e,o,t){t.setAttribute("aria-busy","true");try{await e.alternar(o,t),t.removeAttribute("data-erro")}catch(r){console.warn("[SEI Pro] favoritos: n\xE3o foi poss\xEDvel gravar",r);let a="N\xE3o foi poss\xEDvel gravar o favorito. Tente de novo.";t.setAttribute("data-erro","1"),t.setAttribute("aria-label",a),t.title=a,e.carregar().catch(()=>{})}finally{t.removeAttribute("aria-busy")}}function tr(e,o,t=200){let r=Date.now();return new Promise(a=>{let i=()=>{let n=e();if(n)return a(n);if(Date.now()-r>=o)return a(null);setTimeout(i,t)};i()})}function Z(e){let o=f("button",{type:"button",class:"spro-fav-estrela"});return G(o,e),o}function G(e,o){if(e.getAttribute("aria-pressed")===String(o)&&e.firstChild)return;let t=o?"Remover dos favoritos":"Adicionar aos favoritos";e.setAttribute("aria-pressed",String(o)),e.setAttribute("aria-label",t),e.title=t,e.replaceChildren(M(o?"estrelaCheia":"estrela",16))}var Ea='#topmenu a[target="ifrVisualizacao"], #topmenu a[target="ifrConteudoVisualizacao"]';function Pa(e,o){try{let t=B(R(e,o));return{id:t.idProcedimento,protocolo:t.protocolo,tipo:t.tipo||void 0,sigiloso:t.nivel==="sigiloso"}}catch{return null}}async function rr(e,o,t){let r=Pa(e,t);if(!r)return!1;let a=await tr(()=>e.querySelector(Ea),1e4);if(!a||a.parentElement?.querySelector(".spro-fav-estrela"))return!1;F(e),J(e,o,n=>n.closest("#topmenu")?r:null);let i=Z(o.ativo(r.id));return a.after(i),o.aoMudar(()=>G(i,o.ativo(r.id))),!0}var ar="tr[id^='P']";function ir(e){let o=jo(e,e.closest("#tblProcessosGerados")?"gerados":"recebidos");return o?.idProcedimento?{id:o.idProcedimento,protocolo:o.protocolo,tipo:o.tipo||void 0,especificacao:o.especificacao||void 0,sigiloso:o.sigiloso}:null}function nr(e,o){F(e),J(e,o,s=>{let c=s.closest(ar);return c?ir(c):null});let t=()=>{for(let s of e.querySelectorAll(ar)){let c=s.querySelector(".spro-fav-estrela");if(c){G(c,o.ativo(s.id.slice(1)));continue}let l=ir(s),d=s.querySelectorAll("td")[1];!l||!d||d.prepend(Z(o.ativo(l.id)))}},r=!1,a=typeof MutationObserver=="function"?new MutationObserver(()=>{r||(r=!0,setTimeout(()=>{r=!1,t()},50))}):null,i=e.querySelector("#frmProcedimentoControlar")??e.body;a&&i&&a.observe(i,{childList:!0,subtree:!0});let n=o.aoMudar(t);return t(),{atualizar:t,desligar(){a?.disconnect(),n()}}}var sr="#frmRelBlocoProtocoloLista .infraTable, #frmAcompanhamentoLista .infraTable, #frmProcedimentoSobrestar .infraTable";function cr(e){let o=e.querySelectorAll("td")[2]?.querySelector("a[href*='acao=procedimento_trabalhar']");if(!o)return null;let t=k(o.getAttribute("href")??"").get("id_procedimento"),r=E(o);return!t||!r?null:{id:t,protocolo:r,sigiloso:/Sigiloso/i.test(o.getAttribute("class")??"")}}function lr(e,o){F(e),J(e,o,a=>{let i=a.closest("tr");return i?.closest(sr)?cr(i):null});let t=()=>{for(let a of e.querySelectorAll(sr))for(let i of a.querySelectorAll("tr")){let n=cr(i),s=i.querySelectorAll("td")[2];if(!n||!s)continue;let c=s.querySelector(".spro-fav-estrela");c?G(c,o.ativo(n.id)):s.prepend(Z(o.ativo(n.id)))}},r=o.aoMudar(t);return t(),{atualizar:t,desligar:r}}var dr="table.pesquisaResultado tr.pesquisaTituloRegistro";function ur(e){let o=e.querySelector("a.protocoloNormal[href*='acao=procedimento_trabalhar']");if(!o)return null;let t=k((o.getAttribute("href")??"").replace(/&amp;/g,"&")).get("id_procedimento"),r=E(o);return!t||!r?null:{id:t,protocolo:r,tipo:o.getAttribute("title")?.trim()||void 0,sigiloAConfirmar:!0}}function pr(e,o){F(e),J(e,o,r=>{let a=r.closest("tr");return a?.matches(dr)?ur(a):null});let t=()=>{for(let r of e.querySelectorAll(dr)){let a=ur(r),i=r.querySelector("a.protocoloNormal[href*='acao=procedimento_trabalhar']");if(!a||!i)continue;let n=r.querySelector(".spro-fav-estrela");n?G(n,o.ativo(a.id)):i.after(Z(o.ativo(a.id)))}};o.aoMudar(t),t()}function Sa(e,o){let t=o.replace(/\D/g,""),r=t?e.querySelector(`tr[id="P${t}"] a[href*="procedimento_trabalhar"]`):null;if(r)return{tipo:"linha",link:r};let a=e.querySelector("#frmProtocoloPesquisaRapida"),i=e.querySelector("#txtPesquisaRapida");return a&&i?{tipo:"pesquisa",form:a,campo:i}:null}function mr(e,o,t,r){let a=Sa(e,o);if(!a)throw new T("SEM_PESQUISA","Esta tela do SEI n\xE3o tem a pesquisa r\xE1pida para abrir o processo.");if(a.tipo==="linha")return r?e.defaultView?.open(a.link.href,"_blank","noopener"):a.link.click(),"linha";let i=a.form.getAttribute("target");a.campo.value=t,r&&a.form.setAttribute("target","_blank");try{typeof a.form.requestSubmit=="function"?a.form.requestSubmit():a.form.submit()}finally{i===null?a.form.removeAttribute("target"):a.form.setAttribute("target",i)}return"pesquisa"}var Ma=/(\d{2})\/(\d{2})\/(\d{4})/;function ee(e){let o=[];for(let t of e.querySelectorAll("#tblDocumentos tr")){let r=t.querySelector('a[href*="id_documento="]');if(!r)continue;let a=/id_documento=(\d+)/.exec((r.getAttribute("href")??"").replace(/&amp;/g,"&"))?.[1],i=[...t.querySelectorAll("td")],n=i.findIndex(l=>l.contains(r)),s=(i[n+1]?.textContent??"").trim(),c=i.slice(n+2).map(l=>Ma.exec(l.textContent??"")).find(Boolean);!a||!c||o.push({id:a,numero:(r.textContent??"").trim(),nome:s,data:`${c[3]}-${c[2]}-${c[1]}`})}return o}async function fr(e,o){let t="arvore-aberta",r=o.arvoreAberta(e.id);if(!r){if(!e.buscar)throw new T("PRECISA_BUSCAR","Para listar os documentos, o SEI Pro precisa abrir a \xE1rvore deste processo. Se ele estiver aberto na sua unidade, o SEI pode registrar o andamento \u201CProcesso recebido\u201D em seu nome, ou marc\xE1-lo como visualizado, como se voc\xEA o abrisse.");t="busca",r=await o.arvoreBuscada(e.protocolo)}if(!r.acaoGerarPdf)throw new T("SEM_LISTA_DOCUMENTOS","O SEI n\xE3o oferece a lista de documentos deste processo para voc\xEA (falta \u201CGerar Arquivo PDF do Processo\u201D).");return{documentos:ee(await o.obter(r.acaoGerarPdf)),origem:t}}function te(e){return{contexto:()=>e.ctx,altura:o=>{let t=Number(o?.px);return e.sobreposicao?e.sobreposicao.altura(t):e.iframe&&Number.isFinite(t)&&(e.iframe.style.height=`${Math.max(80,Math.min(Math.round(t),2e4))}px`),!0},sobrepor:o=>e.sobreposicao?e.sobreposicao.ligar(o?.ativo===!0):!1,aviso:o=>{let t=o??{};if(!e.avisar)return!1;let r=Number(t.ms);return e.avisar(String(t.texto??"").slice(0,400),t.acao?String(t.acao).slice(0,40):void 0,Number.isFinite(r)?r:7e3)},abrirProcesso:o=>{let t=o??{};return mr(e.doc,String(t.id??""),String(t.protocolo??""),t.novaAba===!0)},lerLegado:async()=>({local:ke(e.armazenamento),arquivo:e.lerArquivo?await e.lerArquivo():null}),atualizarForaDaUnidade:()=>{if(!e.atualizar)throw new T("SEM_ATUALIZAR","Abra uma tela do SEI para atualizar.");return e.atualizar.iniciar()},cancelarAtualizacao:()=>e.atualizar?.cancelar()??!1,sincronizarAgora:()=>{if(!e.sincronia)throw new T("SEM_SINCRONIA","A sincronia pelo Texto Padr\xE3o s\xF3 funciona numa tela do SEI com unidade.");return e.sincronia.agora()},apagarDoSei:()=>{if(!e.sincronia)throw new T("SEM_SINCRONIA","A sincronia pelo Texto Padr\xE3o s\xF3 funciona numa tela do SEI com unidade.");return e.sincronia.apagar()},documentosAssinados:o=>{let t=o??{};return fr({id:String(t.id??""),protocolo:String(t.protocolo??""),buscar:t.buscar===!0},Ca(e.doc))}}}function Ca(e){let o=null,t=()=>(o??=new Q(e.location?.href??location.href,()=>R(e)),o);return{arvoreAberta(r){try{let a=e.querySelector("#ifrArvore")?.contentDocument;if(!a?.querySelector("#divArvore"))return null;let i=B(R(a,a.location.href));return i.idProcedimento===r?{acaoGerarPdf:Y(i,"procedimento_gerar_pdf")}:null}catch{return null}},async arvoreBuscada(r){let a=await t().arvore(r);return{acaoGerarPdf:Y(a,"procedimento_gerar_pdf")}},async obter(r){return(await t().http.obter(r)).doc}}}function qo(e){let o=i=>e.querySelector(i)?.getAttribute("value")?.trim()??"",t=o("#hdnTipoVisualizacao");if(t&&t!=="R")return"visualiza\xE7\xE3o detalhada (use a resumida)";let r=o("#hdnMeusProcessos");if(r&&r!=="T")return"s\xF3 os processos atribu\xEDdos a voc\xEA";for(let[i,n]of[["hdnIdMarcador","filtro por marcador"],["hdnIdTipoProcedimento","filtro por tipo de processo"],["hdnIdTipoPrioridade","filtro por prioridade"]])if([...e.querySelectorAll(`input[id^="${i}"]`)].some(s=>(s.getAttribute("value")??"").trim()))return n;let a=[...e.querySelectorAll(".caixaFiltroControle")].map(i=>(i.textContent??"").trim()).filter(Boolean);if(a.length)return`filtro ativo: ${a.join(", ")}`;if(e.querySelector("#btnLiberarMarcador"))return"filtro por marcador";if(e.querySelector("#tblMarcadores"))return"caixa agrupada por marcadores";for(let i of["#tblProcessosRecebidos","#tblProcessosGerados"]){let n=e.querySelector(`${i} caption b`);if(n)return`filtro do painel: ${(n.textContent??"").trim()}`}return e.querySelector("#divFiltro")&&!e.querySelector("#lnkAtribuidosMim, #divFiltroMeusProcessos")?"filtro do painel de controle":null}function re(e){if(typeof e=="number"&&e)return String(e);let o=e?.id;return typeof o=="string"&&o?o:null}function gr(e,o,t){let r=re(e);return r?!o||!t.has(r):!1}function vr(e){let o=null,t=!1,r=new Set,a=()=>{o?.aberta&&o.chamar("ola",e.estado(),5e3).catch(()=>{})},i=c=>{if(t||!gr(c,!!o?.aberta,r))return;o?.fechar();let l;try{l=xo(e.conectar(),e.tratadores)}catch{o=null;return}o=l,l.aoFechar(()=>{o===l&&(o=null)});let d=re(c);d&&r.add(d),a()},n=()=>{t||e.area.obter(lo).then(c=>i(c[lo])).catch(()=>{})},s=e.area.aoMudar(c=>{lo in c&&i(c[lo]?.novo)});return n(),{apresentar:a,verificar:n,parar(){t=!0,s(),o?.fechar(),o=null}}}var Ta="data-seipro-favoritos";function hr(e){e.documentElement?.setAttribute(Ta,"1")}function Da(e){if(!e.querySelector("#divRecebidos")||!e.querySelector("#divGerados"))return!1;for(let o of["#tblProcessosRecebidos","#tblProcessosGerados"]){let t=e.querySelector(o);if(!t)continue;let r=Number(/\((\d+)\s+registro/.exec(t.querySelector("caption")?.textContent??"")?.[1]??Number.NaN);if(!Number.isFinite(r)||r>t.querySelectorAll("tr[id^='P']").length)return!1}return!0}var Ia=(e,o)=>!!e&&e.abertoNaUnidade===o.abertoNaUnidade&&e.naoVisualizado===o.naoVisualizado&&e.documentoNovo===o.documentoNovo&&e.atribuido===o.atribuido&&JSON.stringify(e.marcadores??[])===JSON.stringify(o.marcadores??[]);async function br(e,o,t=Date.now()){if(o.escopo.lista!=="unidade")return 0;let r=new Map(Ee(R(e)).map(d=>[d.idProcedimento,d])),a=Da(e)&&!qo(e),[i,n,s]=await Promise.all([o.ativos(),o.atuais(),o.vistos()]),c=[],l=[];for(let d of i){let p=r.get(d.id);p&&(d.sigiloAConfirmar||!!d.sigiloso!==p.sigiloso)&&await o.editar(d.id,p.sigiloso?{sigiloso:!0,especificacao:void 0,sigiloAConfirmar:void 0}:{sigiloso:void 0,sigiloAConfirmar:void 0});let u=n.get(d.id),m;if(p)m={...u,quando:t,fonte:"caixa",abertoNaUnidade:!0,naoVisualizado:p.novo,documentoNovo:p.documentoNovo,atribuido:p.atribuido||void 0,marcadores:p.sinais.filter(v=>/marcador/i.test(v)),recebidoNaLeitura:void 0};else if(a)m={...u,quando:t,fonte:"caixa",abertoNaUnidade:!1,naoVisualizado:void 0,documentoNovo:void 0,recebidoNaLeitura:void 0};else continue;Ia(u,m)||c.push([d.id,m]),!s.has(d.id)&&!d.visto&&l.push([d.id,m])}c.length&&await o.gravarAtuais(c);for(let[d,p]of l)await o.gravarVisto(d,p);return c.length}async function xr(e,o,t,r,a=Date.now()){let i;try{i=B(R(e,o))}catch{return 0}if(!i.idProcedimento)return 0;let n=[];for(let u of t)await u.contem(i.idProcedimento)&&n.push(u);if(!n.length)return 0;let s=i.nivel==="sigiloso";for(let u of n){let m=await u.obter(i.idProcedimento);m&&(m.sigiloAConfirmar||!!m.sigiloso!==s)&&await u.editar(i.idProcedimento,s?{sigiloso:!0,especificacao:void 0,sigiloAConfirmar:void 0}:{sigiloso:void 0,sigiloAConfirmar:void 0})}if(s)return 0;let c=U(i.links,"procedimento_consultar_historico")??/consultarAndamento\('([^']+)'/.exec(e.querySelector("#divConsultarAndamento a")?.getAttribute("onclick")??"")?.[1]?.replace(/&amp;/g,"&")??null,l;if(c)try{let u=wo(await r(c))[0];u&&(l={data:u.data,unidade:u.unidade,descricao:u.descricao})}catch{}let d=[];for(let u of n){let m=await u.obter(i.idProcedimento);m?.prazo?.referencia.de==="novoDocumento"&&d.push({r:u,prazo:m.prazo})}let p=d.length?U(i.links,"procedimento_gerar_pdf"):null;if(p)try{let u=ee((await r(p)).doc);for(let{r:m,prazo:v}of d){let y=La(v,u);y&&await m.editar(i.idProcedimento,{prazo:y})}}catch{}for(let u of n){let m=(await u.atuais()).get(i.idProcedimento),v={...m,quando:a,fonte:"arvore",qtdDocumentos:i.documentos.length,ultimoAndamento:l??m?.ultimoAndamento,recebidoNaLeitura:void 0};await u.gravarAtual(i.idProcedimento,v),await u.marcarVisto([i.idProcedimento])}return n.length}function La(e,o){if(e.referencia.de!=="novoDocumento")return null;let{tipos:t,desde:r}=e.referencia,a=t.map(n=>L(n)).filter(Boolean),i=[...o].filter(n=>n.data>=r&&a.some(s=>L(n.nome).startsWith(s))).sort((n,s)=>n.data<s.data?-1:n.data>s.data?1:0)[0];return i?{...e,referencia:{de:"documento",idDocumento:i.id,data:i.data}}:null}function yr(e){try{let o=JSON.parse(e.getItem("optionsPro")??"{}");if(!Array.isArray(o.orderPanelHome))return null;let t=o.orderPanelHome.find(a=>a?.name==="favoritesPro"),r=Number(t?.index);return t&&Number.isFinite(r)?r:null}catch{return null}}function Oa(e,o,t){if(t!==null)for(let r of[...e.children]){if(!r.classList.contains("panelHomePro"))continue;let a=Number.parseInt(r.getAttribute("data-order")??"",10);if(Number.isFinite(a)&&a>t){r.before(o);return}}e.append(o)}function Ar(e,o){let t=e.querySelector("#frmProcedimentoControlar");if(!t||e.querySelector("#tblMarcadores")||e.querySelector("#favoritesPro"))return null;F(e);let r=e.querySelector("#panelHomePro");r||(r=f("div",{id:"panelHomePro",style:"display: inline-block; width: 100%;"}),t.after(r));let a=f("iframe",{src:o.urlApp,title:"Favoritos do SEI Pro",allow:"clipboard-write",style:`width: 100%; height: 120px; border: 0; display: block; color-scheme: ${o.temaEscuro?"dark":"light"};`}),i=f("div",{class:"spro-fav-corpo",hidden:o.recolhido},a),n=f("button",{type:"button",class:"spro-fav-recolher"}),s=()=>{let p=i.hidden,u=p?"Mostrar favoritos":"Recolher favoritos";n.setAttribute("aria-expanded",String(!p)),n.setAttribute("aria-label",u),n.title=u,n.replaceChildren(M(p?"expandir":"recolher",16))};n.addEventListener("click",()=>{i.hidden=!i.hidden,s(),o.aoRecolher(i.hidden)}),s();let c=M("estrelaCheia",16);c.setAttribute("style","color:#e0a100");let l=f("div",{class:"infraBarraLocalizacao titlePanelHome spro-fav-titulo"},c,f("span",{},"Favoritos"),n),d=f("div",{class:"panelHomePro",id:"favoritesPro","data-order":o.ordem===null?"":String(o.ordem),style:"display: inline-block; width: 100%;"},l,i);return Oa(r,d,o.ordem),{painel:d,iframe:a,corpo:i}}var ko=class{constructor(o){this.d=o;for(let t of[o.unidade,o.pessoal])t?.aoMudar(()=>this.agendarRecarga())}ids=new Set;ouvintes=new Set;agendado=!1;async carregar(){let o=await Promise.all([this.d.unidade?this.d.unidade.ativos():Promise.resolve([]),this.d.pessoal.ativos()]);this.ids=new Set(o.flat().map(t=>t.id)),this.avisar()}ativo(o){return this.ids.has(o)}aoMudar(o){return this.ouvintes.add(o),()=>this.ouvintes.delete(o)}async alternar(o,t){if(this.ids.has(o.id))return await Promise.all([this.d.unidade?.remover([o.id]),this.d.pessoal.remover([o.id])]),this.ids.delete(o.id),this.avisar(),!1;let r=this.d.unidade??this.d.pessoal,a=await r.adicionar(o);return this.ids.add(o.id),this.avisar(),this.d.aoAdicionar?.(a,r,t),!0}avisar(){for(let o of[...this.ouvintes])o()}agendarRecarga(){this.agendado||(this.agendado=!0,setTimeout(()=>{this.agendado=!1,this.carregar()},30))}};function No(e){if(Array.isArray(e))return`[${e.map(No).join(",")}]`;if(e&&typeof e=="object"){let o=e;return`{${Object.keys(o).sort().filter(t=>o[t]!==void 0).map(t=>`${JSON.stringify(t)}:${No(o[t])}`).join(",")}}`}return JSON.stringify(e)}var ae=e=>[...e].sort((o,t)=>o.id<t.id?-1:o.id>t.id?1:0);function ie(e){let o=[...e.escopos].map(t=>({k:to(t.escopo),f:ae(t.favoritos),p:ae(t.pastas),e:ae(t.etiquetas)})).sort((t,r)=>t.k<r.k?-1:t.k>r.k?1:0);return`${oo(No(o))}${oo(No(o).split("").reverse().join(""))}`}var qa=5*6e4,ka=864e5;function Na(e){let o=e?.codigo;return o==="SEI_SESSAO_EXPIRADA"?{estado:"erro",mensagem:"Sess\xE3o do SEI expirada. Entre de novo no SEI."}:o==="SEI_ACAO_INDISPONIVEL"?{estado:"indisponivel",mensagem:"Indispon\xEDvel nesta unidade: o SEI n\xE3o oferece Textos Padr\xE3o para voc\xEA aqui."}:{estado:"erro",mensagem:e instanceof Error?e.message:String(e)}}var Ro=class{constructor(o){this.d=o}espera;agora(){return this.d.agora?.()??Date.now()}async status(){return(await this.d.area.obter(this.d.chaveStatus))[this.d.chaveStatus]??{estado:"nunca",quando:0,pendente:!1}}async gravarStatus(o){let t={...await this.status(),...o};return await this.d.area.gravar({[this.d.chaveStatus]:t}),t}async marcarPendente(){(await this.status()).pendente||await this.gravarStatus({pendente:!0})}agendarEnvio(){return clearTimeout(this.espera),this.espera=setTimeout(()=>void this.sincronizar({forcar:!0}).catch(()=>{}),this.d.atrasoEnvio??15e3),this.marcarPendente()}parar(){clearTimeout(this.espera)}async sincronizar(o={}){let t=this.agora(),r=await this.status();if(!o.forcar&&(r.estado==="indisponivel"&&(r.indisponivelAte??0)>t||!r.pendente&&r.ultimoPuxar&&t-r.ultimoPuxar<qa))return r;let a=`seipro-favoritos-sync|${this.d.chaveStatus}`;return await this.d.travar(a,()=>this.rodada(t))??await this.status()}async rodada(o){try{let t=await this.d.destino.ler(),r="",a=null,i=new Set;if(t!==null){let d=await Ct(t,this.d.escopo);if("maisNovo"in d)return this.gravarStatus({estado:"erro",quando:o,ultimoPuxar:o,mensagem:"Os favoritos no SEI foram gravados por uma vers\xE3o mais nova do SEI Pro. Atualize a extens\xE3o neste computador; o texto n\xE3o foi alterado."});"envelope"in d?(await this.d.repo.importar(d.envelope.escopos[0]),r=ie(d.envelope),i=new Set(d.envelope.escopos[0].favoritos.map(p=>p.id))):a=d.invalido}let n=await St(this.d.repo,this.d.escopo,this.d.carimbo(),i);if(t!==null&&!a&&ie(n)===r)return this.gravarStatus({estado:"ok",quando:o,ultimoOk:o,ultimoPuxar:o,pendente:!1,mensagem:void 0,tamanho:t.length});let s=await Mt(n,this.d.nomeUsuario),c=this.d.teto??At;if(s.length>c)return this.gravarStatus({estado:"erro",quando:o,ultimoPuxar:o,tamanho:s.length,mensagem:`A lista ficou grande demais para o Texto Padr\xE3o (${Math.ceil(s.length/1024)} KB de ${Math.round(c/1024)} KB). Use a sincroniza\xE7\xE3o por arquivo.`});if(this.d.permitido&&!await this.d.permitido())return this.gravarStatus({estado:"nunca",quando:o,pendente:!1,mensagem:void 0});await this.d.destino.gravar(s);let l=s.length>(this.d.teto?c*.8:wt)?`A lista est\xE1 perto do limite do Texto Padr\xE3o (${Math.ceil(s.length/1024)} KB).`:void 0;return this.gravarStatus({estado:"ok",quando:o,ultimoOk:o,ultimoPuxar:o,pendente:!1,tamanho:s.length,mensagem:a?`O texto no SEI estava inv\xE1lido (${a}) e foi regravado a partir deste computador.`:l})}catch(t){let r=Na(t);return this.gravarStatus({estado:r.estado,mensagem:r.mensagem,quando:o,indisponivelAte:r.estado==="indisponivel"?o+ka:void 0})}}};var go=e=>`favoritos/sync/tp/${to(e)}`;function wr(e){let o=0;for(let t of e.querySelectorAll('select#selTextoPadrao option, select[name="selTextoPadrao"] option'))(t.textContent??"").trim().startsWith(Io)&&(t.remove(),o++);return o}var zo=class{constructor(o){this.d=o}motor=null;pararMudancas=null;pararPrefs=null;estado(o){return Ve(o,this.d.ctx.host,this.d.ctx.login,this.d.escopo.unidade?.id??"")}criarMotor(){let o=this.d.armazem();return new Ro({repo:this.d.repo,escopo:this.d.escopo,destino:{ler:()=>o.ler(),gravar:t=>o.gravar(t)},area:this.d.area,chaveStatus:go(this.d.escopo),carimbo:this.d.carimbo,nomeUsuario:this.d.ctx.nome||this.d.ctx.login,travar:this.d.travar,atrasoEnvio:this.d.atrasoEnvio,permitido:async()=>this.estado(await H(this.d.sync))==="ligado"})}rodar(o){return this.motor??=this.criarMotor(),this.motor.sincronizar({forcar:o})}ligar(o){this.pararMudancas||(this.motor??=this.criarMotor(),this.pararMudancas=this.d.repo.aoMudar(()=>void this.motor?.agendarEnvio()),o&&this.rodar(!1).catch(()=>{}))}desligar(){this.pararMudancas?.(),this.pararMudancas=null,this.motor?.parar()}async iniciar(o){if(this.estado(await H(this.d.sync))==="ligado"){let r=(await this.motor?.status())?.pendente??(await this.d.area.obter(go(this.d.escopo)))[go(this.d.escopo)]?.pendente;this.ligar(o==="caixa"||r===!0)}this.pararPrefs=this.d.sync.aoMudar(r=>{K in r&&H(this.d.sync).then(a=>{let i=this.estado(a);i==="ligado"&&!this.pararMudancas?(this.ligar(!1),this.rodar(!0).catch(()=>{})):i!=="ligado"&&this.desligar()})})}agora(){return this.rodar(!0)}async apagar(){this.desligar(),await Ue(this.d.sync,this.d.ctx.host,this.d.ctx.login,this.d.escopo.unidade?.id??"","desligado");let o=this.d.armazem(),t=async()=>{let i=await o.excluir();return o.localizar&&await o.localizar()&&(i=await o.excluir()||i),i},r=`seipro-favoritos-sync|${go(this.d.escopo)}`,a=this.d.travarEsperando?await this.d.travarEsperando(r,t):await t();return await this.d.area.gravar({[go(this.d.escopo)]:{estado:"nunca",quando:Date.now(),pendente:!1}}),a}parar(){this.desligar(),this.pararPrefs?.()}};var Ra="position:fixed;inset:0;left:0;top:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;z-index:2147483646;background:transparent;";function Er(e,o,t){let r=null,a=null,i=s=>{o.style.height=`${Math.max(80,Math.min(Math.round(s),2e4))}px`},n=()=>{let s=[e.documentElement];e.body&&s.push(e.body);let c=e.defaultView;for(let l=o.parentElement;l&&l!==e.body&&l!==e.documentElement;l=l.parentElement)try{let d=c?.getComputedStyle?.(l).overflowY??"";(d==="auto"||d==="scroll")&&l.scrollHeight>l.clientHeight&&s.push(l)}catch{}return s};return{ligar(s){if(s&&!r){let c=o.getBoundingClientRect?.().height||Number.parseFloat(o.style.height)||0,l=n().map(d=>[d,d.style.overflow]);r={iframe:o.getAttribute("style")??"",reserva:t.style.minHeight,travados:l},c&&(t.style.minHeight=`${Math.round(c)}px`),o.setAttribute("style",`${r.iframe};${Ra}`);for(let[d]of l)d.style.overflow="hidden"}else if(!s&&r){o.setAttribute("style",r.iframe),t.style.minHeight=r.reserva;for(let[c,l]of r.travados)c.style.overflow=l;r=null,a!==null&&i(a),a=null}return!0},altura(s){Number.isFinite(s)&&(r?a=s:i(s))}}}hr(document);var Pr=window;if(!Pr.__seiProFavoritos){Pr.__seiProFavoritos=!0;let e=()=>void Fa().catch(o=>console.warn("[SEI Pro] favoritos:",o));document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e,{once:!0}):e()}function za(e){return e.querySelector("#frmProcedimentoControlar")?"caixa":e.querySelector("table.pesquisaResultado")?"pesquisa":e.querySelector('#frmAtividadeListar[action*="acao=procedimento_enviar"]')?"enviar":e.querySelector("#topmenu")&&e.querySelector("#divArvore")?"arvore":e.querySelector("#frmRelBlocoProtocoloLista, #frmAcompanhamentoLista, #frmProcedimentoSobrestar")?"listas":null}async function Fa(){wr(document);let e=window===window.top,o=za(document);if(!o&&!e||!await de("gerenciarfavoritos"))return;let t=Ut(),r=Bt(t,jt(localStorage),t.location?.href);if(!r)return;let a=Gt(t);a&&(r.corTema=a);let i=_o(chrome.storage.local,"local"),n=_o(chrome.storage.sync,"sync"),s=_e(chrome.runtime.getManifest()),c=()=>$t(P=>chrome.runtime.sendMessage(P),P=>void window.open(P,"seiProPainel","popup,width=420,height=760"),chrome.runtime.getURL("html/painel.html#aba=favoritos")),l=await ce(i),d=()=>({agora:Date.now(),dispositivo:l}),p=ze(r),u={unidade:p.unidade?new io(i,p.unidade,d):null,pessoal:new io(i,p.pessoal,d)},m=e&&u.unidade&&p.unidade?new zo({ctx:r,area:i,sync:n,repo:u.unidade,escopo:p.unidade,carimbo:d,travar:Va,travarEsperando:Ga,armazem:()=>Ce(new Q(location.href,()=>R(document)),{nome:Et(r.login),descricao:Pt})}):null;m&&await m.iniciar(o);let v=e?Ua(r,i,u):null;if(e&&_a(r,i,m,v),!o)return;let y=new ko({...u,aoAdicionar:(P,A,w)=>void Sr(P,A,w,u,r,n)});if(await y.carregar(),o==="caixa"){if(nr(document,y),u.unidade&&br(document,u.unidade).catch(P=>console.warn("[SEI Pro] favoritos: captura da caixa",P)),e){let P=await $a(r,n,s,c,m,v);P&&Ba(P,[u.unidade,u.pessoal].filter(A=>!!A))}}else if(o==="arvore"){await rr(document,y,location.href)&&s&&_t(document,{url:A=>chrome.runtime.getURL(A),abrirLateral:c}),ja(u);let P=Po(location.href);xr(document,location.href,[u.unidade,u.pessoal].filter(A=>!!A),A=>P.obter(A)).catch(A=>console.warn("[SEI Pro] favoritos: captura da \xE1rvore",A))}else if(o==="pesquisa")pr(document,y);else if(o==="enviar"){let P=async w=>await u.unidade?.contem(w)?u.unidade:await u.pessoal.contem(w)?u.pessoal:null,A=u.unidade??u.pessoal;await Qt(document,{ativo:w=>y.ativo(w),adicionar:w=>A.adicionar(w),remover:w=>Promise.all([u.unidade?.remover(w),u.pessoal.remover(w)]),editar:async(w,O)=>(await P(w))?.editar(w,O),obter:async w=>(await P(w))?.obter(w),pastas:()=>A.pastasAtivas(),hoje:()=>so()})}else lr(document,y)}function _a(e,o,t,r){let a=document.hasFocus()?Date.now():0,i=vr({area:o,conectar:()=>chrome.runtime.connect({name:Re}),tratadores:te({doc:document,ctx:e,iframe:null,armazenamento:localStorage,lerArquivo:()=>Ko(),sincronia:t,atualizar:r}),estado:()=>({visivel:document.visibilityState==="visible",foco:a,chave:Fe(e)})}),n=()=>{a=Date.now(),i.apresentar()};window.addEventListener("focus",n),document.addEventListener("visibilitychange",()=>document.visibilityState==="visible"?n():i.apresentar()),setInterval(()=>i.verificar(),5e3)}async function Sr(e,o,t,r,a,i){if(!(await H(i)).perguntarAoFavoritar)return;let n=o===r.unidade?"unidade":"pessoal",[s,c]=await Promise.all([o.pastasAtivas(),o.etiquetasAtivas()]);zt(t,{favorito:e,lista:n,siglaUnidade:r.unidade?a.unidade?.sigla??"Unidade":null,pastas:s,etiquetas:c,temaEscuro:a.temaEscuro,hoje:so(),editar:l=>o.editar(e.id,l),criarPasta:l=>o.criarPasta(l),criarEtiqueta:l=>o.criarEtiqueta(l),moverPara:async l=>{let d=l==="unidade"?r.unidade:r.pessoal;if(!d||d===o)return;let p=await pt(o,d,e.id);p&&await Sr(p,d,t,r,a,i)}},ue)}async function $a(e,o,t,r,a,i){let n=await H(o),s=null,c=()=>{let d=Wo(n.exibir,t);d.abaixo&&!s?s=Ha(e,o,n.recolhido,a,i):!d.abaixo&&s&&(s.fechar(),s=null)};c();let l=Ft(document,{url:d=>chrome.runtime.getURL(d),destino:()=>Wo(n.exibir,t).lateral?"lateral":"abaixo",abrirLateral:r,rolarAtePainel:()=>{if(!s)return r();s.corpo.hidden&&s.painel.querySelector(".spro-fav-recolher")?.click(),s.painel.scrollIntoView({behavior:"smooth",block:"start"})}});return o.aoMudar(d=>{K in d&&H(o).then(p=>{n=p,c()})}),l}function Ha(e,o,t,r,a){let i=Ar(document,{urlApp:chrome.runtime.getURL("html/favoritos.html"),temaEscuro:e.temaEscuro,recolhido:t,ordem:yr(localStorage),aoRecolher:c=>void Jo(o,{recolhido:c})});if(!i)return null;let n=te({doc:document,ctx:e,iframe:i.iframe,armazenamento:localStorage,lerArquivo:()=>Ko(),sincronia:r,atualizar:a,sobreposicao:Er(document,i.iframe,i.corpo),avisar:Lt(document,e.temaEscuro)}),s=null;return i.iframe.addEventListener("load",()=>{s?.fechar(),s=xo(chrome.runtime.connect({name:Ne}),n)}),{painel:i.painel,corpo:i.corpo,fechar:()=>{s?.fechar(),i.painel.remove()}}}function Va(e,o){let t=navigator.locks;return t?t.request(e,{ifAvailable:!0},async r=>r?o():null):o()}function Ua(e,o,t){return new Lo(()=>{let r=new Q(location.href,()=>R(document));return{repos:[t.unidade,t.pessoal].filter(a=>!!a),listarCaixa:async a=>{let i=await r.http.obter(r.linkMenu("procedimento_controlar"),{sinal:a,aceitarValidacao:!0}),n=qo(i.doc);if(n)throw new T("CAIXA_FILTRADA",`A caixa do Controle de Processos est\xE1 com ${n}. Tire o filtro e tente de novo: sem a caixa inteira, o SEI Pro n\xE3o sabe quais processos est\xE3o na sua unidade.`);let s=await Pe(r,{limite:Number.MAX_SAFE_INTEGER,sinal:a});if(s.processos.length<s.total)throw new T("CAIXA_INCOMPLETA","N\xE3o foi poss\xEDvel ler a caixa inteira; nada foi atualizado.");return new Set(s.processos.map(c=>c.idProcedimento))},localizar:async(a,i)=>(await r.localizar(a,{sinal:i})).idProcedimento,lerProcesso:async(a,i)=>{let n=await r.arvore(a,{sinal:i,forcar:!0}),s=Y(n,"procedimento_consultar_historico"),c=s?wo(await r.http.obter(s,{sinal:i}))[0]:void 0;return{qtdDocumentos:n.documentos.length,abertoNaUnidade:!!Y(n,"procedimento_enviar"),ultimoAndamento:c?{data:c.data,unidade:c.unidade,descricao:c.descricao}:void 0}},esperar:(a,i)=>new Promise(n=>{let s=setTimeout(n,a);i.addEventListener("abort",()=>{clearTimeout(s),n()},{once:!0})})}},r=>o.gravar({[Tt(e.host,e.login)]:{...r,quando:Date.now()}}),{area:o,host:e.host,login:e.login})}function Ba(e,o){let t=!1,r=()=>{t||(t=!0,setTimeout(()=>{t=!1,Ht(o,so()).then(a=>Vt(e,a)).catch(()=>{})},100))};for(let a of o)a.aoMudar(r),a.aoMudarAtuais(r);r()}function ja(e){let o;try{o=B(R(document,location.href))}catch{return}if(!o.idProcedimento||!o.documentos.length)return;let t={id:o.idProcedimento,protocolo:o.protocolo,tipo:o.tipo||void 0,sigiloso:o.nivel==="sigiloso"},r=new Set,a=async()=>{let i=await e.unidade?.obter(t.id)??await e.pessoal.obter(t.id);r=new Set(i&&i.removidoEm===void 0?(i.documentos??[]).map(n=>n.id):[])};a().then(()=>{F(document);let i=Wt(document,o.documentos.map(n=>({id:n.id,numero:n.numero,titulo:n.titulo})),{marcado:n=>r.has(n),alternar:async n=>{await Kt(e,t,n),await a()}});for(let n of[e.unidade,e.pessoal])n?.aoMudar(()=>void a().then(()=>i.repintar()))})}function Ga(e,o){let t=navigator.locks;return t?t.request(e,()=>o()):o()}})();
