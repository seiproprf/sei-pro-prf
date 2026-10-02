/* GERADO por favoritos/build.mjs. NAO EDITE ESTE ARQUIVO. Rode: npm run build */
"use strict";(()=>{function Uo(e,o){return{obter:(t=null)=>e.get(t),gravar:t=>e.set(t),remover:t=>e.remove(t),chaves:typeof e.getKeys=="function"?()=>e.getKeys():void 0,aoMudar(t){let r=(a,i)=>{i===o&&t(a)};return chrome.storage.onChanged.addListener(r),()=>chrome.storage.onChanged.removeListener(r)}}}function uo(e=crypto){if(typeof e.randomUUID=="function")return e.randomUUID();let o=e.getRandomValues(new Uint8Array(16));o[6]=(o[6]??0)&15|64,o[8]=(o[8]??0)&63|128;let t=[...o].map(r=>r.toString(16).padStart(2,"0")).join("");return`${t.slice(0,8)}-${t.slice(8,12)}-${t.slice(12,16)}-${t.slice(16,20)}-${t.slice(20)}`}async function de(e,o="seipro/dispositivo"){let t=(await e.obter(o))[o];if(typeof t=="string"&&t)return t;let r=uo();return await e.gravar({[o]:r}),r}var ue=e=>String(e).padStart(2,"0");function po(e=new Date){return`${e.getFullYear()}-${ue(e.getMonth()+1)}-${ue(e.getDate())}`}function Dr(e){let o=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e);if(!o)throw new Error(`Data inv\xE1lida: ${e}`);return new Date(Number(o[1]),Number(o[2])-1,Number(o[3]),12)}function mo(e,o){let t=Dr(e);return t.setDate(t.getDate()+o),po(t)}function Ao(e){let[o,t,r]=e.split("-");return`${r}/${t}/${o}`}function Lr(e,o){let t=e;if(typeof e=="string"){if(!e.trim())return!0;try{t=JSON.parse(e)}catch{return!0}}if(!Array.isArray(t)||t.length===0)return!0;let a=t.map(i=>i?.configGeral).find(Array.isArray)?.find(i=>i?.name===o)?.value;return!(a===!1||a===0||a==="")}async function pe(e,o=chrome.storage.sync){let t=await o.get("dataValues");return Lr(t.dataValues,e)}var L=class extends Error{constructor(t,r){super(r);this.codigo=t;this.name="ErroRpc"}};function wo(e,o={}){let t=0,r=!0,a=new Map,i=[],n=()=>{if(r){r=!1;for(let[,c]of a)clearTimeout(c.timer),c.erro(new L("DESCONECTADO","A conex\xE3o com a aba do SEI caiu."));a.clear();for(let c of i)c()}},s=c=>{r&&e.postMessage(c)};return e.onMessage.addListener(c=>{let l=c;if(l?.rpc==="resposta"&&typeof l.id=="number"){let d=a.get(l.id);if(!d)return;a.delete(l.id),clearTimeout(d.timer),l.ok?d.ok(l.valor):d.erro(new L(l.erro?.codigo??"ERRO",l.erro?.mensagem??"Falha."));return}if(l?.rpc!=="pedido"||typeof l.id!="number"||typeof l.op!="string")return;let u=l.id,p=l.op;(async()=>{try{let d=o[p];if(!d)throw new L("OP_DESCONHECIDA",`Opera\xE7\xE3o desconhecida: ${p}`);s({rpc:"resposta",id:u,ok:!0,valor:await d(l.args)})}catch(d){let m=d.codigo;s({rpc:"resposta",id:u,ok:!1,erro:{codigo:typeof m=="string"?m:"ERRO",mensagem:d instanceof Error?d.message:String(d)}})}})()}),e.onDisconnect.addListener(n),{get aberta(){return r},chamar(c,l,u=15e3){if(!r)return Promise.reject(new L("DESCONECTADO","A conex\xE3o com a aba do SEI caiu."));let p=++t;return new Promise((d,m)=>{let v=setTimeout(()=>{a.delete(p),m(new L("PRAZO",`A aba do SEI n\xE3o respondeu a tempo (${c}).`))},u);a.set(p,{ok:d,erro:m,timer:v}),e.postMessage({rpc:"pedido",id:p,op:c,args:l})})},aoFechar(c){i.push(c)},fechar(){r&&(e.disconnect(),n())}}}var me=`/*
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
/* Como popover (camada de cima, acima de di\xE1logo aberto): sem a posi\xE7\xE3o e a margem padr\xE3o do navegador. */
.spro-aviso[popover] {
  inset: auto auto 16px 50%;
  margin: 0;
  overflow: visible;
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
`;var y=class extends Error{codigo;detalhe;constructor(o,t,r){super(t),this.name="ErroSei",this.codigo=o,this.detalhe=r}paraJSON(){return{codigo:this.codigo,mensagem:this.message,detalhe:this.detalhe}}};function Bo(e){if(e instanceof y)return e;if(e instanceof DOMException&&e.name==="AbortError")return new y("CANCELADO","Opera\xE7\xE3o cancelada.");let o=e instanceof Error?e.message:String(e);return new y("SEI_REDE",`Falha ao falar com o SEI: ${o}`)}var Or={AElig:198,Aacute:193,Acirc:194,Agrave:192,Aring:197,Atilde:195,Auml:196,Ccedil:199,ETH:208,Eacute:201,Ecirc:202,Egrave:200,Euml:203,Iacute:205,Icirc:206,Igrave:204,Iuml:207,Ntilde:209,Oacute:211,Ocirc:212,Ograve:210,Oslash:216,Otilde:213,Ouml:214,THORN:222,Uacute:218,Ucirc:219,Ugrave:217,Uuml:220,Yacute:221,aacute:225,acirc:226,acute:180,aelig:230,agrave:224,amp:38,apos:39,aring:229,atilde:227,auml:228,brvbar:166,bull:8226,ccedil:231,cedil:184,cent:162,copy:169,curren:164,deg:176,divide:247,eacute:233,ecirc:234,egrave:232,eth:240,euml:235,euro:8364,frac12:189,frac14:188,frac34:190,gt:62,hellip:8230,iacute:237,icirc:238,iexcl:161,igrave:236,iquest:191,iuml:239,laquo:171,ldquo:8220,lsquo:8216,lt:60,macr:175,mdash:8212,micro:181,middot:183,nbsp:160,ndash:8211,not:172,ntilde:241,oacute:243,ocirc:244,ograve:242,ordf:170,ordm:186,oslash:248,otilde:245,ouml:246,para:182,plusmn:177,pound:163,quot:34,raquo:187,rdquo:8221,reg:174,rsquo:8217,sect:167,shy:173,sup1:185,sup2:178,sup3:179,szlig:223,thorn:254,times:215,trade:8482,uacute:250,ucirc:251,ugrave:249,uml:168,uuml:252,yacute:253,yen:165,yuml:255};function W(e){return e.includes("&")?e.replace(/&(#x[0-9a-fA-F]+|#\d+|[a-zA-Z][a-zA-Z0-9]*);/g,(o,t)=>{let r=t[0]==="#"?t[1]==="x"||t[1]==="X"?parseInt(t.slice(2),16):parseInt(t.slice(1),10):Or[t];return r===void 0||Number.isNaN(r)?o:String.fromCodePoint(r)}):e}var fe={128:8364,130:8218,131:402,132:8222,133:8230,134:8224,135:8225,136:710,137:8240,138:352,139:8249,140:338,142:381,145:8216,146:8217,147:8220,148:8221,149:8226,150:8211,151:8212,152:732,153:8482,154:353,155:8250,156:339,158:382,159:376};var ge=null;function Eo(e){return ge?ge(e):new DOMParser().parseFromString(e,"text/html")}function E(e){return(e?.textContent??"").replace(/\s+/g," ").trim()}var kr={n:`
`,r:"\r",t:"	",b:"\b",f:"\f",v:"\v",0:"\0"};function jo(e,o){let t=e[o],r="";for(o+=1;o<e.length;){let a=e[o];if(a==="\\"){let i=e[o+1];if(i==="u"&&/^[0-9a-fA-F]{4}$/.test(e.slice(o+2,o+6))){r+=String.fromCharCode(parseInt(e.slice(o+2,o+6),16)),o+=6;continue}r+=kr[i]??i,o+=2;continue}if(a===t)return[r,o+1];r+=a,o+=1}return[r,o]}function Go(e,o){let t=[],r=o;for(;r<e.length;){let a=e[r];if(a===")")return[t,r+1];if(a===","||/\s/.test(a)){r+=1;continue}if(a==='"'||a==="'"){let[s,c]=jo(e,r);t.push(s),r=c;continue}let i=/^(null|true|false|-?\d+(?:\.\d+)?)/.exec(e.slice(r,r+32));if(i){let s=i[1];t.push(s==="null"?null:s==="true"?!0:s==="false"?!1:Number(s)),r+=s.length;continue}let n=0;for(;r<e.length;){let s=e[r];if(s==="(")n+=1;else if(s===")"){if(n===0)break;n-=1}else if(s===","&&n===0)break;r+=1}t.push(null)}return[t,r]}function k(e){return typeof e=="string"?W(e):e==null?"":String(e)}var qr=/controlador(?:_ajax)?\.php\?acao=[^"'\s<>\\]*?infra_hash=[0-9a-f]{64,192}/g;function B(e){let o=new Set;for(let t of e.replace(/&amp;/g,"&").matchAll(qr))o.add(t[0]);return[...o]}function N(e){let o=e.indexOf("?");return new URLSearchParams(o>=0?e.slice(o+1):"")}function j(e,o,t={}){let r=Array.isArray(e)?e:B(e);for(let a of r){let i=N(a),n=i.get("acao")??"";if(!(typeof o=="string"?n!==o:!o.test(n))&&Object.entries(t).every(([s,c])=>i.get(s)===c))return a}return null}function zr(e){let o=new Map;for(let t of e.matchAll(/Nos\[(\d+)\]\s*=\s*new\s+infraArvoreNo\(/g)){let[r]=Go(e,t.index+t[0].length);o.set(Number(t[1]),{indice:Number(t[1]),args:r,props:{}})}for(let t of e.matchAll(/Nos\[(\d+)\]\.(\w+)\s*=\s*(['"])/g)){let r=o.get(Number(t[1]));if(!r)continue;let[a]=jo(e,t.index+t[0].length-1);r.props[t[2]]=a}return[...o.values()].sort((t,r)=>t.indice-r.indice)}function Nr(e){let o=[];for(let t of e.matchAll(/new\s+infraArvoreAcao\(/g)){let[r]=Go(e,t.index+t[0].length);o.push({tipo:k(r[0]),idPai:k(r[2]),href:k(r[3]),titulo:k(r[5]),icone:k(r[6]),extra:r[8]==null?void 0:k(r[8])})}return o}function ve(e,o){let t=e.find(n=>n.tipo==="NIVEL_ACESSO"&&n.idPai===o);if(!t)return{nivel:"publico"};let[r,...a]=t.titulo.split(`
`);return{nivel:/sigilos/i.test(r)||/sigiloso/.test(t.icone)?"sigiloso":"restrito",hipotese:a.join(" ").trim()||void 0}}function he(e){return[...new Set([...e.matchAll(/<img[^>]*\btitle="([^"]+)"/g)].map(o=>k(o[1])))]}var Rr=/\s*\(\d{5,}\)\s*$/;function G(e){let o=e.html,t=zr(o),r=Nr(o),a=t.find(c=>c.args[0]==="PROCESSO");if(!a)throw new y("SEI_VERSAO_NAO_SUPORTADA","A \xE1rvore do processo n\xE3o tem o n\xF3 do processo.");let i=k(a.args[1]),n=ve(r,i),s=t.filter(c=>c.args[0]==="DOCUMENTO").map(c=>{let l=k(c.args[1]),u=k(c.args[5]),p=k(c.args[7]),d=(c.props.src??"").replace(/&amp;/g,"&"),m=r.find(P=>P.tipo==="ASSINATURA"&&P.idPai===l),{nivel:v,hipotese:x}=ve(r,l),w=(/documento_([a-z0-9]+)\.svg/.exec(p)?.[1]??"interno").replace("cancelado","interno");return{id:l,numero:k(c.args[15])||(/\((\d{5,})\)\s*$/.exec(u)?.[1]??""),titulo:u.replace(Rr,""),pasta:c.args[2]&&String(c.args[2]).startsWith("PASTA")?String(c.args[2]):null,externo:/documento_download_anexo/.test(d)||!/documento_interno|documento_cancelado|formulario|email/.test(p),formato:w,nivel:v,hipotese:x,assinado:!!m,assinaturas:m?m.titulo.split(`
`).slice(1).filter(Boolean):[],cancelado:/documento_cancelado/.test(p),unidadeGeradora:r.find(P=>P.tipo==="UNIDADE_GERADORA"&&P.idPai===l)?.extra,link:k(c.args[3]).replace(/&amp;/g,"&"),src:d,acoes:B(c.props.acoes??""),botoes:he(c.props.acoes??"")}});return{idProcedimento:i,protocolo:k(a.args[5])||k(a.args[15]),tipo:k(a.args[6]),nivel:n.nivel,hipotese:n.hipotese,marcadores:r.filter(c=>c.tipo==="MARCADOR"&&c.idPai===i).map(c=>c.titulo.replace(/^Marcador\n/,"").replace(/\n/g," \u2014 ")),documentos:s,acoesProcesso:B(a.props.acoes??""),botoesProcesso:he(a.props.acoes??""),linkProcesso:k(a.args[3]).replace(/&amp;/g,"&"),sinais:r.filter(c=>c.idPai===i),links:B(o),pagina:e}}async function be(e,o,t){let r=await e.obter(o,t);if(!/acao=procedimento_visualizar/.test(r.url)){let a=r.doc.querySelector("#ifrArvore")?.getAttribute("src");if(!a)throw new y("SEI_NAO_ENCONTRADO","N\xE3o foi poss\xEDvel abrir a \xE1rvore do processo.");r=await e.obter(a,t)}if(/infraArvoreNo\("PASTA"/.test(r.html)){let a=j(r.html,"procedimento_visualizar")&&B(r.html).find(i=>/abrir_pastas=1/.test(i));a&&(r=await e.obter(a,t))}return G(r)}function to(e,o,t){if(t){let r=e.documentos.find(a=>a.id===t);return r?j(r.acoes,o):null}return j(e.acoesProcesso,o)??j(e.links,o,{id_procedimento:e.idProcedimento})}var Ee="\xA5",Ko="\xB1";function xe(e){return e.map(o=>`${o.id}${Ko}${o.texto}`).join(Ee)}function Fr(e){return e?e.split(Ee).map(o=>{let[t,...r]=o.split(Ko);return{id:t,texto:r.join(Ko)}}):[]}function ye(e){let o=[];for(let t of e.matchAll(/new\s+infraLupaSelect\(\s*['"]([\w-]+)['"]\s*,\s*['"]([\w-]+)['"]/g))o.push([t[1],t[2]]);return o}var Pe=e=>o=>o.url.includes(e),R=class e{constructor(o,t,r){this.http=o;this.pagina=t;this.elemento=r,this.id=r.id,this.action=(r.getAttribute("action")??"").replace(/&amp;/g,"&"),this.campos=_r(r),this.sincronizarLupas()}id;action;campos;elemento;static async abrir(o,t,r,a){let i=await o.obter(t,a);return e.de(i,r,o)}static de(o,t,r=null){let a=o.doc.querySelector(t);if(!a)throw new y("SEI_VERSAO_NAO_SUPORTADA",`A tela do SEI n\xE3o tem o formul\xE1rio esperado (${t}).`,E(o.doc.querySelector("title")));return new e(r,o,a)}pares(){return this.campos.map(o=>[o.nome,o.valor])}valor(o){return this.campos.find(t=>t.nome===o)?.valor}tem(o){return this.elemento.querySelector(`[name="${o}"]`)!==null||this.campos.some(t=>t.nome===o)}opcoes(o){let t=this.elemento.querySelector(`select[name="${o}"], select#${we(o)}`);return t?[...t.querySelectorAll("option")].map(r=>({valor:r.getAttribute("value")??E(r),texto:E(r),selecionada:r.hasAttribute("selected")})):[]}definir(o){for(let[t,r]of Object.entries(o)){if(r===void 0)continue;if(r===null){this.campos=this.campos.filter(i=>i.nome!==t);continue}let a=this.campos.find(i=>i.nome===t);a?a.valor=r:this.campos.push({nome:t,valor:r})}return this}escolher(o,t){let r=this.opcoes(o),a=Xo(t),i=r.find(n=>n.valor===t)??r.find(n=>Xo(n.texto)===a)??Ae(r.filter(n=>Xo(n.texto).includes(a)));if(!i)throw new y("ARGUMENTO_INVALIDO",`"${t}" n\xE3o \xE9 uma op\xE7\xE3o de ${o}.`,r.slice(0,40).map(n=>n.texto).join(" | "));return this.definir({[o]:i.valor}),i}linhas(o){return[...this.elemento.querySelectorAll(`${o} tr`)].filter(t=>t.querySelector("input[type=checkbox]"))}itensLupa(o){let t=this.hiddenDaLupa(o);return t?Fr(this.valor(t)??""):[]}definirLupa(o,t){let r=this.hiddenDaLupa(o);if(!r)throw new y("SEI_VERSAO_NAO_SUPORTADA",`A lupa ${o} n\xE3o existe nesta tela.`);return this.definir({[r]:xe(t)}),this.campos=this.campos.filter(a=>a.nome!==o&&a.nome!==`${o}[]`),this}async enviar(o={}){if(!this.http)throw new y("SEI_RESPOSTA_INESPERADA","Formul\xE1rio sem transporte HTTP.");if(!this.action)throw new y("SEI_VERSAO_NAO_SUPORTADA",`O formul\xE1rio ${this.id} n\xE3o tem action.`);let t=this.pares();o.botao&&t.push(this.botaoDeEnvio(o.botao));let r=await this.http.enviar(this.action,t,o);if(o.sucesso&&!o.sucesso(r))throw new y("SEI_RESPOSTA_INESPERADA",`O SEI n\xE3o confirmou ${o.operacao??"a opera\xE7\xE3o"}.`,`${E(r.doc.querySelector("title"))} \u2014 ${r.url.replace(/infra_hash=\w+/,"infra_hash=\u2026")}`);return r}botaoDeEnvio(o){let t=this.elemento.querySelector(`[name="${o}"]`)??Ae([...this.elemento.querySelectorAll('button[type="submit"][name^="sbm"], input[type="submit"][name^="sbm"]')]);return t?[t.getAttribute("name")??o,t.getAttribute("value")??E(t)??o]:[o,o]}hiddenDaLupa(o){let t=ye(this.pagina.html).find(([r])=>r===o);return t?t[1]:null}sincronizarLupas(){for(let[o,t]of ye(this.pagina.html)){let r=this.elemento.querySelector(`select#${we(o)}`);if(!r)continue;let a=[...r.querySelectorAll("option")].map(i=>({id:i.getAttribute("value")??"",texto:E(i)}));(this.valor(t)??"")||this.definir({[t]:xe(a)}),this.campos=this.campos.filter(i=>i.nome!==o&&i.nome!==`${o}[]`)}}};function _r(e){let o=[];for(let t of e.querySelectorAll("input, select, textarea")){let r=t.getAttribute("name");if(!r||t.hasAttribute("disabled"))continue;let a=t.tagName.toLowerCase();if(a==="input"){let i=(t.getAttribute("type")??"text").toLowerCase();if(["submit","button","image","reset","file"].includes(i)||(i==="checkbox"||i==="radio")&&!t.hasAttribute("checked"))continue;o.push({nome:r,valor:t.getAttribute("value")??(i==="checkbox"||i==="radio"?"on":"")})}else if(a==="textarea")o.push({nome:r,valor:t.textContent??""});else{let i=[...t.querySelectorAll("option")],n=i.filter(l=>l.hasAttribute("selected")),s=t.hasAttribute("multiple"),c=n.length?n:!s&&i.length?[i[0]]:[];for(let l of c)o.push({nome:r,valor:l.getAttribute("value")??E(l)})}}return o}function Xo(e){return e.normalize("NFD").replace(/[\u0300-\u036F]/g,"").toLowerCase().replace(/\s+/g," ").trim()}function Ae(e){return e.length===1?e[0]:void 0}function we(e){return e.replace(/([^\w-])/g,"\\$1")}function Wo(e,o){let t=e.querySelector("input[type=checkbox]"),r=e.querySelector("a[href*='procedimento_trabalhar']");if(!t||!r)return null;let a=t.getAttribute("aria-label")??"",i=/^Sigiloso\b/.test(a)||/Sigiloso/.test(r.getAttribute("class")??""),n=[...e.querySelectorAll("td")],s=i?[]:[...n[1]?.querySelectorAll("a[aria-label]")??[]].map(c=>c.getAttribute("aria-label")??"");return{idProcedimento:t.getAttribute("value")??N(r.getAttribute("href")??"").get("id_procedimento")??"",protocolo:t.getAttribute("title")??E(r),grupo:o,tipo:/Tipo (.*?)(?: \/ Especifica|$)/.exec(a)?.[1]?.trim()??"",especificacao:i?"":/Especifica\S* (.*)$/.exec(a)?.[1]?.trim()??"",sigiloso:i,novo:/NaoVisualizado/.test(r.getAttribute("class")??""),atribuido:E(n[n.length-1]).replace(/^\(|\)$/g,""),sinais:s,documentoNovo:!!n[1]?.querySelector("img[src*='exclamacao']")||s.some(c=>/documento foi inclu/i.test(c))}}function Po(e,o){let t=o==="recebidos"?"#tblProcessosRecebidos":"#tblProcessosGerados",r=e.doc.querySelector(t),a=Number(/\((\d+)\s+registro/.exec(E(r?.querySelector("caption")))?.[1]??0),i=[];for(let n of r?.querySelectorAll("tr[id^='P']")??[]){let s=Wo(n,o);s&&i.push(s)}return{itens:i,total:a}}function Se(e){return[...Po(e,"recebidos").itens,...Po(e,"gerados").itens]}async function Ce(e,o={}){let t=o.limite??2e3,r=await e.http.obter(e.linkMenu("procedimento_controlar"),{sinal:o.sinal,aceitarValidacao:!0}),a=[],i=0;for(let n of["recebidos","gerados"]){let s=n==="recebidos"?"hdnRecebidosPaginaAtual":"hdnGeradosPaginaAtual",{itens:c,total:l}=Po(r,n);i+=l,a.push(...c);let u=c.length,p=!1;for(let d=1;u<l&&c.length>0&&a.length<t;d+=1)r=await R.de(r,"#frmProcedimentoControlar",e.http).definir({hdnRecebidosPaginaAtual:"0",hdnGeradosPaginaAtual:"0",[s]:String(d)}).enviar({sinal:o.sinal,aceitarValidacao:!0}),{itens:c}=Po(r,n),u+=c.length,a.push(...c),p=!0;p&&(r=await R.de(r,"#frmProcedimentoControlar",e.http).definir({hdnRecebidosPaginaAtual:"0",hdnGeradosPaginaAtual:"0"}).enviar({sinal:o.sinal,aceitarValidacao:!0}))}return{total:i,processos:a.slice(0,t)}}function Hr(e){let o=e.doc.querySelector("#tblHistorico"),t=Number(/\((\d+)\s+registro/.exec(E(o?.querySelector("caption")))?.[1]??0);return{itens:[...o?.querySelectorAll("tr")??[]].filter(a=>a.querySelector("td")).map(a=>{let i=[...a.querySelectorAll("td")];return{data:E(i[0]),unidade:E(i[1]),usuario:E(i[2]),descricao:E(i[3])}}),total:t}}function So(e){return Hr(e).itens}var Me="#frmTextoPadraoInternoCadastro",Te="#frmTextoPadraoInternoLista",$r=40,Co=e=>(e??"").replace(/&amp;/g,"&");function De(e,o){let t=()=>{if(!o.nome.trim()||o.nome.length>50)throw new y("ARGUMENTO_INVALIDO","O nome do texto padr\xE3o deve ter de 1 a 50 caracteres.");if(o.descricao.length>300)throw new y("ARGUMENTO_INVALIDO","A descri\xE7\xE3o do texto padr\xE3o passa de 300 caracteres.")},r=n=>[...n.doc.querySelectorAll("table.infraTable tr")].find(s=>[...s.querySelectorAll("td")].some(c=>(c.textContent??"").trim()===o.nome)),a=n=>{let s=n.querySelector('input[type="checkbox"]')?.getAttribute("value")??/acaoExcluir\(\s*['"](\d+)/.exec(n.querySelector('a[onclick*="acaoExcluir"]')?.getAttribute("onclick")??"")?.[1],c=Co(n.querySelector('a[href*="acao=texto_padrao_interno_consultar"]')?.getAttribute("href")),l=Co(n.querySelector('a[href*="acao=texto_padrao_interno_alterar"]')?.getAttribute("href"));return s&&c&&l?{id:s,consultar:c,alterar:l}:null},i=async n=>{t();let s=await e.http.obter(e.linkMenu("texto_padrao_interno_listar"),n),c=s;for(let l=0;l<$r;l++){let u=r(c);if(u)return{pagina:c,primeira:s,achado:a(u)};if(!/infraAcaoPaginar\(\s*['"]\+['"]/.test(c.html))break;c=await R.de(c,Te,e.http).definir({hdnInfraPaginaAtual:String(l+1)}).enviar(n)}return{pagina:c,primeira:s,achado:null}};return{async localizar(n){return(await i(n)).achado},async ler(n){let{achado:s}=await i(n);return s?(await e.http.obter(s.consultar,n)).doc.querySelector('textarea[name="txaConteudo"], #txaConteudo')?.textContent??"":null},async gravar(n,s){let{achado:c,primeira:l}=await i(s),u={...s,modos:{txaConteudo:"html"},sucesso:Pe("texto_padrao_interno_listar")};if(c){await(await R.abrir(e.http,c.alterar,Me,s)).definir({txaConteudo:n}).enviar({...u,botao:"sbmAlterarTextoPadraoInterno",operacao:"a altera\xE7\xE3o do texto padr\xE3o"});return}let p=Co(/location\.href\s*=\s*'([^']+)'/.exec(l.doc.querySelector("#btnNovo")?.getAttribute("onclick")??"")?.[1]);if(!p)throw new y("SEI_ACAO_INDISPONIVEL","O SEI n\xE3o permite a voc\xEA criar textos padr\xE3o nesta unidade.");await(await R.abrir(e.http,p,Me,s)).definir({txtNome:o.nome,txtDescricao:o.descricao,txaConteudo:n}).enviar({...u,botao:"sbmCadastrarTextoPadraoInterno",operacao:"o cadastro do texto padr\xE3o"})},async excluir(n){let{achado:s,pagina:c}=await i(n);if(!s)return!1;let l=Co(/['"](controlador\.php\?acao=texto_padrao_interno_excluir[^'"]+)['"]/.exec(c.html)?.[1]);if(!l)throw new y("SEI_ACAO_INDISPONIVEL","O SEI n\xE3o oferece a exclus\xE3o de textos padr\xE3o para voc\xEA nesta unidade.");let u=R.de(c,Te,e.http).definir({hdnInfraItemId:s.id});return await e.http.enviar(l,u.pares(),{...n,aceitarValidacao:!0}),!0}}}var Vr={"\u2010":"-","\u2011":"-","\u2012":"-","\u2013":"-","\u2014":"-","\u2015":"-","\u2212":"-","\u2018":"'","\u2019":"'","\u201A":"'","\u201B":"'","\u2032":"'","\u201C":'"',"\u201D":'"',"\u201E":'"',"\u201F":'"',"\u2033":'"',"\u2026":"...","\u2022":"-","\u2002":" ","\u2003":" ","\u2009":" ","\u202F":" ","\u205F":" ","\u200B":"","\u200C":"","\u200D":"","\u2060":"","\uFEFF":"","\u20AC":"EUR","\u2122":"(TM)","\u2192":"->","\u2190":"<-"};function Le(e,o="texto"){let t="";for(let r of e){let a=r.codePointAt(0);if(a<=255){t+=r;continue}let i=Vr[r];if(o==="html"){t+=i===""?"":`&#${a};`;continue}if(i!==void 0){t+=i;continue}let n=r.normalize("NFKD").replace(/[\u0300-\u036F]/g,"");t+=[...n].every(s=>s.codePointAt(0)<=255)?n:""}return t}var Ur=/[A-Za-z0-9\-_.*]/;function Ie(e){let o="";for(let t of e)t===" "?o+="+":Ur.test(t)?o+=t:o+="%"+t.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0");return o}function Oe(e,o={}){return e.map(([t,r])=>{let a=o[t]??"texto";return`${Ie(Le(t))}=${Ie(Le(r??"",a))}`}).join("&")}function Jo(e){let o=e instanceof Uint8Array?e:new Uint8Array(e),t=[],r=16384;for(let a=0;a<o.length;a+=r){let i=o.subarray(a,a+r),n=new Array(i.length);for(let s=0;s<i.length;s+=1)n[s]=fe[i[s]]??i[s];t.push(String.fromCharCode(...n))}return t.join("")}var ke="application/x-www-form-urlencoded; charset=ISO-8859-1";function qe(e,o,t){let r=null;return{url:e,status:o,html:t,get doc(){return r??=Eo(t)}}}function ze(e,o={}){if(/\/login\.php/i.test(e.url)||/[?&]acao=(?:infra_)?sair\b/.test(e.url))throw new y("SEI_SESSAO_EXPIRADA","A sess\xE3o do SEI foi encerrada. Fa\xE7a login de novo no SEI e repita o pedido.");if(e.status>=500)throw new y("SEI_EXCECAO",`O SEI respondeu com erro ${e.status}.`);if(e.html.includes('id="divInfraExcecao"')){let t=e.doc.querySelector("#divInfraExcecao");if(t){let r=E(t);throw new y("SEI_EXCECAO",r||"O SEI exibiu uma p\xE1gina de erro.",r)}}if(!o.aceitarValidacao&&e.html.includes("txaInfraValidacao")){let t=e.doc.querySelector("#txaInfraValidacao")?.textContent?.trim()??"";if(t)throw new y("SEI_VALIDACAO",t,t)}return e}function Mo(e,o={}){let t=new URL(".",e),r=o.fetch??((...p)=>fetch(...p)),a=Math.max(1,o.concorrencia??3),i=0,n=[];async function s(p){i>=a&&await new Promise(d=>n.push(d)),i+=1;try{return await p()}finally{i-=1,n.shift()?.()}}let c=p=>new URL(p.replace(/&amp;/g,"&"),t).href;async function l(p,d,m){return s(async()=>{try{let v=await r(c(p),{credentials:"same-origin",redirect:"follow",...d,signal:m.sinal}),x=Jo(await v.arrayBuffer());return ze(qe(v.url||c(p),v.status,x),m)}catch(v){throw Bo(v)}})}async function u(p,d={}){return s(async()=>{try{let m=await r(c(p),{credentials:"same-origin",redirect:"follow",signal:d.sinal}),v=new Uint8Array(await m.arrayBuffer()),x=(m.headers?.get("content-type")??"").split(";")[0].trim().toLowerCase();x==="text/html"&&ze(qe(m.url||c(p),m.status,Jo(v)),d);let w=m.headers?.get("content-disposition")??"",P=decodeURIComponent(/filename\*=UTF-8''([^;]+)/i.exec(w)?.[1]??/filename="?([^";]+)"?/i.exec(w)?.[1]??"");return{bytes:v,tipo:x,nome:P}}catch(m){throw Bo(m)}})}return{base:t,absoluta:c,baixar:u,obter:(p,d={})=>l(p,{method:"GET"},d),enviar:(p,d,m={})=>l(p,{method:"POST",headers:{"Content-Type":ke},body:Oe(d,m.modos)},m)}}function Br(e){let o=/Sistema Eletr(?:\u00F4|&ocirc;|\\u00F4)nico de Informa[^"]*?Vers(?:\u00E3|&atilde;)o\s*([\d.]+)/i.exec(e);return o?o[1]:/\.(?:js|svg|css)\?(\d+\.\d+\.\d+)-/.exec(e)?.[1]??""}function jr(e){let o=e.doc.querySelector("#lnkInfraUnidade")?.getAttribute("onclick")??"",t=/infra_unidade_atual=(\d+)/.exec(o)?.[1];if(t)return t;let r=/[?&]infra_unidade_atual=(\d+)/.exec(e.url)?.[1];return r||(e.doc.querySelector("#selInfraUnidades option[selected]")?.getAttribute("value")??"")}function Zo(e){let o=e.doc,t=o.querySelector("#lnkInfraUnidade"),r=o.querySelector("#lnkUsuarioSistema")?.getAttribute("title")??"",[,a="",i="",n=""]=/^(.*?)\s*\(([^/)]+)(?:\/([^)]+))?/.exec(r)??[],s=Br(e.html);return{host:new URL(e.url).host,versao:s,maior:Number(s.split(".")[0])||0,unidade:{id:jr(e),sigla:E(t)||E(o.querySelector("#selInfraUnidades option[selected]")),nome:t?.getAttribute("title")??""},usuario:{nome:a.trim(),login:i.trim(),orgao:n.trim()}}}var Gr=3e4,ro=class{constructor(o,t=null,r){this.paginaViva=t;this.http=Mo(o,r)}http;paginaBase=null;arvores=new Map;localizados=new Map;base(){let o=this.paginaViva?.();if(o&&o.html.includes("frmProtocoloPesquisaRapida"))return o;if(this.paginaBase)return this.paginaBase;if(o)return o;throw new y("SEI_NAO_ENCONTRADO","Abra uma tela do SEI (por exemplo, Controle de Processos) nesta aba.")}contexto(){return Zo(this.base())}linkMenu(o){let t=this.base(),r=[...t.doc.querySelectorAll("#infraMenu a[href], #main-menu a[href], .infraMenu a[href]")].map(s=>s.getAttribute("href")??"").join(`
`),a=B(r).filter(s=>N(s).get("acao")===o),n=(a.length?a:B(t.html).filter(s=>N(s).get("acao")===o)).sort((s,c)=>[...N(s).keys()].length-[...N(c).keys()].length)[0];if(!n)throw new y("SEI_ACAO_INDISPONIVEL",`O menu do SEI n\xE3o oferece "${o}" para este usu\xE1rio.`);return n}async renovarBase(o){return this.paginaBase=await this.http.obter(this.linkMenu("procedimento_controlar"),o),this.arvores.clear(),this.localizados.clear(),this.paginaBase}async localizar(o,t){let r=o.trim();if(!r)throw new y("ARGUMENTO_INVALIDO","Informe o n\xFAmero do processo ou o n\xBA SEI do documento.");let a=this.localizados.get(r);if(a)return a;let i=R.de(this.base(),"#frmProtocoloPesquisaRapida",this.http);i.definir({txtPesquisaRapida:r});let n=await i.enviar(t),s=N(n.url);if(s.get("acao")!=="procedimento_trabalhar")throw new y("SEI_NAO_ENCONTRADO",`Nada encontrado no SEI para "${r}", ou voc\xEA n\xE3o tem acesso a ele.`);let c=n.doc.querySelector("#ifrArvore")?.getAttribute("src");if(!c)throw new y("SEI_VERSAO_NAO_SUPORTADA","A tela do processo n\xE3o trouxe a \xE1rvore.");let u=N(W(c)).get("id_procedimento")??"",p=s.get("id_protocolo")??"",d={idProcedimento:u,idDocumento:p&&p!==u?p:void 0,linkArvore:W(c)};return this.localizados.set(r,d),d}async arvore(o,t={}){let r=await this.localizar(o,t),a=this.arvores.get(r.idProcedimento);if(a&&!t.forcar&&Date.now()-a.quando<Gr)return a.arvore;let i=await be(this.http,r.linkArvore,t);return this.arvores.set(r.idProcedimento,{quando:Date.now(),arvore:i}),i}invalidar(o){o?this.arvores.delete(o):this.arvores.clear()}async ajax(o,t,r){let a=await this.http.enviar(o,t,{...r,aceitarValidacao:!0}),i=[];for(let n of a.html.matchAll(/<option[^>]*value="([^"]*)"[^>]*>([^<]*)<\/option>/g))i.push({id:W(n[1]),texto:W(n[2]).trim()});for(let n of a.html.matchAll(/<item\s+([^>]*)>/g)){let s=Eo(`<i ${n[1]}></i>`).querySelector("i");i.push({id:s?.getAttribute("id")??"",texto:s?.getAttribute("descricao")??s?.getAttribute("complemento")??""})}return i.filter(n=>n.id&&n.id!=="null")}};function Ne(e){let o=e.getItem("configDataFavoritesPro");if(!o)return null;try{return JSON.parse(o)}catch{return null}}function Yo(e=2e3){let o=window.webkitRequestFileSystem;return o?new Promise(t=>{let r=setTimeout(()=>t(null),e),a=()=>{clearTimeout(r),t(null)};try{o(1,0,i=>i.root.getFile("configPro.json",{},n=>n.file(async s=>{try{let c=JSON.parse(await s.text());clearTimeout(r),t(c)}catch{a()}},a),a),a)}catch{a()}}):Promise.resolve(null)}var Re="seipro-favoritos",J="favoritos/preferencias";var Fe="seipro-favoritos-lateral",fo="favoritos/lateralAberto";function no(e){let o=e.login.trim().toLowerCase();return`${e.host}|${o}|${e.lista==="pessoal"?"pessoal":`u:${e.unidade?.id??""}`}`}function _e(e){let o={host:e.host,login:e.login.trim().toLowerCase()};return{unidade:e.unidade?.id?{...o,lista:"unidade",unidade:{id:e.unidade.id,sigla:e.unidade.sigla}}:null,pessoal:{...o,lista:"pessoal"}}}function He(e){return[e.host,e.login.trim().toLowerCase(),e.unidade?.id??""].join("|")}function $e(e){let o=e;return!!(o.side_panel||o.sidebar_action)}function Qo(e,o){return o?{abaixo:e!=="lateral",lateral:e!=="abaixo"}:{abaixo:!0,lateral:!1}}var Ve={exibir:"abaixo",perguntarAoFavoritar:!0,textoPadrao:"nao-perguntado",textoPadraoUnidades:{},recolhido:!1,agruparPorPasta:!1,ordem:"manual",faixaUnidadeDispensada:!1};async function U(e){let o=(await e.obter(J))[J];return{...Ve,...o&&typeof o=="object"?o:{}}}async function oe(e,o){let t={...await U(e),...o};return await e.gravar({[J]:t}),t}var Ue=(e,o,t)=>`${e}|${o.trim().toLowerCase()}|${t}`;function Be(e,o,t,r){return e.textoPadraoUnidades?.[Ue(o,t,r)]??"nao-perguntado"}async function je(e,o,t,r,a){let i=await U(e);return oe(e,{textoPadraoUnidades:{...i.textoPadraoUnidades??{},[Ue(o,t,r)]:a}})}async function To(e,o){if(e.chaves){let r=(await e.chaves()).filter(a=>a.startsWith(o));return r.length?e.obter(r):{}}let t=await e.obter(null);return Object.fromEntries(Object.entries(t).filter(([r])=>r.startsWith(o)))}var Z=class{constructor(o,t){this.area=o;this.prefixo=t}chave(o){return this.prefixo+o}async listar(){return Object.values(await To(this.area,this.prefixo))}async obter(o){let t=this.chave(o);return(await this.area.obter(t))[t]}async gravar(o,t){await this.area.gravar({[this.chave(o)]:t})}async gravarVarios(o){o.length&&await this.area.gravar(Object.fromEntries(o.map(([t,r])=>[this.chave(t),r])))}async apagar(o){o.length&&await this.area.remover(o.map(t=>this.chave(t)))}aoMudar(o){return this.area.aoMudar(t=>{Object.keys(t).some(r=>r.startsWith(this.prefixo))&&o()})}};var Xr="0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",Ge=new Map;function Kr(e){let o=Ge.get(e);if(o===void 0){o=new Uint8Array(256);for(let t=0;t<e.length;t++)o[e.charCodeAt(t)]=t;Ge.set(e,o)}return o}function so(e,o,t,r){let a=t[0];if(o!=null&&e>=o)throw new Error(e+" >= "+o);if(e.slice(-1)===a||o&&o.slice(-1)===a)throw new Error("trailing zero");if(o){let s=0;for(;(e[s]||a)===o[s];)s++;if(s>0)return o.slice(0,s)+so(e.slice(s),o.slice(s),t,r)}let i=e?r[e.charCodeAt(0)]:0,n=o!=null?r[o.charCodeAt(0)]:t.length;if(n-i>1){let s=Math.round(.5*(i+n));return t[s]}else return o&&o.length>1?o.slice(0,1):t[i]+so(e.slice(1),null,t,r)}function Ye(e,o){if(e.length!==co(e[0],o))throw new Error("invalid integer part of order key: "+e)}function co(e,o){if(o===void 0){let t=e.charCodeAt(0);if(t>=97&&t<=122)return t-97+2;if(t>=65&&t<=90)return 90-t+2}else{let t=o.indexOf(e);if(t!==-1){let r=o.length/2;return t<r?r-t+1:t-r+2}}throw new Error("invalid order key head: "+e)}function go(e,o){let t=co(e[0],o);if(t>e.length)throw new Error("invalid order key: "+e);return e.slice(0,t)}function Xe(e,o,t){if(Qe(e,o,t))throw new Error("invalid order key: "+e);let r=go(e,t);if(e.slice(r.length).slice(-1)===o[0])throw new Error("invalid order key: "+e)}function Ke(e,o,t,r){Ye(e,r);let a=e[0],i=o[0],n="";for(let u=e.length-1;u>=1;u--){let p=t[e.charCodeAt(u)]+1;if(p===o.length)n=i+n;else return a+e.slice(1,u)+o[p]+n}if(r===void 0){if(a==="Z")return"a"+i;if(a==="z")return null;let u=String.fromCharCode(a.charCodeAt(0)+1);return u+(u>"a"?n+i:n.slice(1))}let s=r.indexOf(a);if(s===r.length-1)return null;let c=r[s+1],l=co(c,r)-co(a,r);return c+(l>0?n+i:l<0?n.slice(1):n)}function Wr(e,o,t,r){Ye(e,r);let a=e[0],i=o[o.length-1],n="";for(let u=e.length-1;u>=1;u--){let p=t[e.charCodeAt(u)]-1;if(p===-1)n=i+n;else return a+e.slice(1,u)+o[p]+n}if(r===void 0){if(a==="a")return"Z"+i;if(a==="A")return null;let u=String.fromCharCode(a.charCodeAt(0)-1);return u+(u<"Z"?n+i:n.slice(1))}let s=r.indexOf(a);if(s===0)return null;let c=r[s-1],l=co(c,r)-co(a,r);return c+(l>0?n+i:l<0?n.slice(1):n)}var We=new Map;function Qe(e,o,t=""){let r=We.get(t);r===void 0&&(r=new Map,We.set(t,r));let a=o.charCodeAt(0),i=r.get(a);return i===void 0&&(i=t===""?"A"+o[0].repeat(26):t[0]+o[0].repeat(t.length/2),r.set(a,i)),e===i}function ot(e){for(let o=1;o<e.length;o++)if(e.charCodeAt(o-1)>=e.charCodeAt(o))return!1;return!0}function et(e){for(let o=0;o<e.length;o++)if(e.charCodeAt(o)>255)return!1;return!0}var Je=new Set;function Jr(e){if(!Je.has(e)){if(e.length<2||!ot(e))throw new Error("digits must be at least 2 characters in strictly ascending character code order: "+e);if(!et(e))throw new Error("digits must be single-byte (char code 0-255): "+e);Je.add(e)}}var Ze=new Set;function Zr(e){if(!Ze.has(e)){if(e.length<2||e.length%2!==0||!ot(e))throw new Error("intDigits must be an even number of at least 2 characters in strictly ascending character code order: "+e);if(!et(e))throw new Error("intDigits must be single-byte (char code 0-255): "+e);Ze.add(e)}}function ee(e,o,t=Xr,r=void 0){Jr(t),r!==void 0&&Zr(r);let a=Kr(t);if(e!=null&&Xe(e,t,r),o!=null&&Xe(o,t,r),e!=null&&o!=null&&e>o){let u=e;e=o,o=u}if(e==null){if(o==null)return(r===void 0?"a":r[r.length/2])+t[0];let u=go(o,r),p=o.slice(u.length);if(Qe(u,t,r))return u+so("",p,t,a);if(u<o)return u;let d=Wr(u,t,a,r);if(d==null)throw new Error("cannot decrement any more");return d}if(o==null){let u=go(e,r),p=e.slice(u.length),d=Ke(u,t,a,r);return d??u+so(p,null,t,a)}let i=go(e,r),n=e.slice(i.length),s=go(o,r),c=o.slice(s.length);if(i===s)return i+so(n,c,t,a);let l=Ke(i,t,a,r);if(l==null)throw new Error("cannot increment any more");return l<o?l:i+so(n,null,t,a)}function vo(e,o){return ee(e??null,o??null)}function ho(e){try{return ee(e,null),!0}catch{return!1}}function tt(e,o){return e.atualizadoEm!==o.atualizadoEm?e.atualizadoEm>o.atualizadoEm:e.dispositivo!==o.dispositivo?e.dispositivo>o.dispositivo:JSON.stringify(e)>JSON.stringify(o)}function rt(e,o,t=90){let r=o-t*864e5;return e.filter(a=>a.removidoEm===void 0||a.removidoEm>=r)}function D(e){return e.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ").trim()}function ao(e){let o=2166136261;for(let t of e)o^=t.codePointAt(0)??0,o=Math.imul(o,16777619)>>>0;return o.toString(16).padStart(8,"0")}var at=["#bfd5e8","#c8e6c9","#ffe0b2","#f8bbd0","#d1c4e9","#b2ebf2","#fff9c4","#d7ccc8"];function Do(e){let o=Number.parseInt(ao(D(e)).slice(0,6),16)%at.length;return at[o]??"#bfd5e8"}function Yr(e){let o=/^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(e);if(!o)return"#1f2328";let[t,r,a]=[o[1],o[2],o[3]].map(i=>Number.parseInt(i??"0",16));return(t*299+r*587+a*114)/1e3>140?"#1f2328":"#ffffff"}function nt(e){let o=e.trim().toLowerCase(),t=null,r=/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(o);r&&(t=[r[1],r[2],r[3]].map(p=>Number.parseInt(p??"0",16)));let a=/^rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+%?))?\s*\)$/.exec(o);if(a){if((a[4]===void 0?1:a[4].endsWith("%")?Number.parseFloat(a[4])/100:Number.parseFloat(a[4]))<.9)return null;t=[a[1],a[2],a[3]].map(d=>Number(d))}if(!t||t.some(p=>!Number.isFinite(p)||p<0||p>255))return null;let[i,n,s]=t,c=Math.max(i,n,s),l=Math.min(i,n,s);if(c===0||(c-l)/c<.25)return null;let u=[i,n,s];for(let p=0;p<12&&Yr(it(u))!=="#ffffff";p++)u=u.map(d=>Math.round(d*.88));return it(u)}function it(e){return`#${e.map(o=>o.toString(16).padStart(2,"0")).join("")}`}function st(e,o){if(!o||!e)return[];let t=[];if(o.qtdDocumentos!==void 0&&e.qtdDocumentos!==void 0&&o.qtdDocumentos>e.qtdDocumentos){let i=o.qtdDocumentos-e.qtdDocumentos;t.push({tipo:"documentos",texto:i===1?"1 documento novo":`${i} documentos novos`})}let r=o.ultimoAndamento,a=e.ultimoAndamento;return r&&a&&(r.data!==a.data||r.descricao!==a.descricao)&&t.push({tipo:"andamento",texto:`andamento: ${r.descricao}${r.unidade?` (${r.unidade})`:""}`}),e.abertoNaUnidade===!0&&o.abertoNaUnidade===!1&&t.push({tipo:"saiu",texto:"saiu da sua unidade"}),e.abertoNaUnidade===!1&&o.abertoNaUnidade===!0&&t.push({tipo:"voltou",texto:"voltou para a sua unidade"}),o.naoVisualizado&&!e.naoVisualizado&&t.push({tipo:"naoVisualizado",texto:"n\xE3o visualizado"}),o.documentoNovo&&!e.documentoNovo&&t.push({tipo:"documentoNovo",texto:"documento novo"}),o.concluido&&!e.concluido&&t.push({tipo:"concluido",texto:"conclu\xEDdo"}),o.recebidoNaLeitura&&t.push({tipo:"recebido",texto:"chegou \xE0 sua unidade \u2014 o SEI registrou o recebimento"}),t}function ct(e,o){if(!e||!o)return e===o;let t=r=>JSON.stringify([r.abertoNaUnidade,r.naoVisualizado,r.documentoNovo,r.atribuido,r.marcadores??[],r.concluido,r.qtdDocumentos,r.ultimoAndamento??null]);return t(e)===t(o)}function te(e,o){return!!e.lembrete&&e.lembrete.em<=o}function lt(e){for(let o of Object.keys(e))e[o]===void 0&&delete e[o];return e}function dt(e,o,t){return lt({id:e.id,protocolo:e.protocolo,tipo:e.tipo||void 0,especificacao:e.sigiloso?void 0:e.especificacao||void 0,sigiloso:e.sigiloso?!0:void 0,sigiloAConfirmar:e.sigiloAConfirmar&&e.sigiloso===void 0?!0:void 0,etiquetas:[],ordem:o,criadoEm:t.agora,atualizadoEm:t.agora,dispositivo:t.dispositivo})}function X(e,o,t){return lt({...e,...o,atualizadoEm:t.agora,dispositivo:t.dispositivo})}function Lo(e,o){return X(e,{removidoEm:o.agora},o)}function ut(e,o){return X(e,{removidoEm:void 0},o)}var pt=e=>e.reduce((o,t)=>ho(t.ordem)&&(o===null||t.ordem>o)?t.ordem:o,null),re=(e,o)=>e.nome.localeCompare(o.nome,"pt-BR"),lo=class{constructor(o,t,r){this.area=o;this.escopo=t;this.carimbo=r;let a=`favoritos/${no(t)}/`;this.favoritos=new Z(o,`${a}f/`),this.pastas=new Z(o,`${a}p/`),this.etiquetas=new Z(o,`${a}e/`),this.atuaisCol=new Z(o,`${a}a/`),this.vistosCol=new Z(o,`${a}v/`),this.chaveMeta=`${a}meta`,this.base=a}favoritos;pastas;etiquetas;atuaisCol;vistosCol;chaveMeta;base;async registrar(){await this.area.gravar({[this.chaveMeta]:{escopo:this.escopo}})}async instantaneo(){let o=Object.entries(await To(this.area,this.base)),t=r=>o.filter(([a])=>a.startsWith(this.base+r)).map(([,a])=>a);return{todos:t("f/"),pastas:t("p/").filter(r=>r.removidoEm===void 0).sort(mt),etiquetas:t("e/").filter(r=>r.removidoEm===void 0).sort(re)}}async gravarAtual(o,t){await this.atuaisCol.gravar(o,{...t,id:o})}async gravarAtuais(o){await this.atuaisCol.gravarVarios(o.map(([t,r])=>[t,{...r,id:t}]))}async atuais(){return new Map((await this.atuaisCol.listar()).map(({id:o,...t})=>[o,t]))}async vistosCompletos(){return this.vistosCol.listar()}async vistos(){return new Map((await this.vistosCol.listar()).filter(o=>o.removidoEm===void 0).map(o=>[o.id,o.visto]))}async gravarVisto(o,t){let r=await this.vistosCol.obter(o);if(r&&r.removidoEm===void 0&&ct(r.visto,t))return!1;let a=this.carimbo(),i={...t};return delete i.recebidoNaLeitura,await this.vistosCol.gravar(o,{id:o,visto:i,atualizadoEm:a.agora,dispositivo:a.dispositivo}),!0}async marcarVisto(o){let t=await this.atuais(),r=0;for(let a of o){let i=t.get(a),n=await this.obter(a);!i||!n||n.removidoEm!==void 0||(await this.gravarVisto(a,i),r++)}return r}async instantaneoCompleto(){let o=Object.entries(await To(this.area,this.base)),t=r=>o.filter(([a])=>a.startsWith(this.base+r)).map(([,a])=>a);return{todos:t("f/"),pastas:t("p/"),etiquetas:t("e/"),vistos:t("v/")}}todos(){return this.favoritos.listar()}async ativos(){return(await this.todos()).filter(o=>o.removidoEm===void 0)}obter(o){return this.favoritos.obter(o)}async contem(o){let t=await this.obter(o);return!!t&&t.removidoEm===void 0}async proximaOrdem(){return vo(pt(await this.todos()),null)}async adicionar(o){let t=this.carimbo(),r=await this.obter(o.id),a;if(!r)a=dt(o,await this.proximaOrdem(),t);else{let i=o.sigiloso===void 0?r.sigiloso:o.sigiloso?!0:void 0,n={sigiloAConfirmar:o.sigiloso!==void 0?void 0:r.sigiloAConfirmar,protocolo:o.protocolo||r.protocolo,tipo:o.tipo||r.tipo,sigiloso:i,especificacao:i?void 0:o.especificacao||r.especificacao};r.removidoEm!==void 0&&Object.assign(n,{removidoEm:void 0,ordem:await this.proximaOrdem()}),a=X(r,n,t)}return await this.favoritos.gravar(a.id,a),a}async editar(o,t){let r=await this.obter(o);if(!r)throw new Error(`O favorito ${o} n\xE3o existe nesta lista.`);let a={...t};a.etiquetas&&(a.etiquetas=[...new Set(a.etiquetas)].slice(0,8)),typeof a.nota=="string"&&(a.nota=a.nota.slice(0,2e3).trim()?a.nota.slice(0,2e3):void 0),typeof a.titulo=="string"&&(a.titulo=a.titulo.trim()||void 0);let i=X(r,a,this.carimbo());return await this.favoritos.gravar(o,i),i}async remover(o){let t=this.carimbo(),r=(await Promise.all(o.map(a=>this.obter(a)))).filter(a=>!!a&&a.removidoEm===void 0);return await this.favoritos.gravarVarios(r.map(a=>[a.id,Lo(a,t)])),r.length}async restaurar(o){let t=this.carimbo(),r=(await Promise.all(o.map(a=>this.obter(a)))).filter(a=>!!a&&a.removidoEm!==void 0);return await this.favoritos.gravarVarios(r.map(a=>[a.id,ut(a,t)])),r.length}async mover(o,t,r){let a=t?await this.obter(t):void 0,i=r?await this.obter(r):void 0,n;try{n=vo(a?.ordem??null,i?.ordem??null)}catch{n=vo(a?.ordem??null,null)}await this.editar(o,{ordem:n})}async pastasAtivas(){return(await this.pastas.listar()).filter(o=>o.removidoEm===void 0).sort((o,t)=>mt(o,t))}async criarPasta(o,t){let r=o.trim();if(!r)throw new Error("Informe o nome da pasta.");let a=await this.pastas.listar(),i=a.find(c=>c.removidoEm===void 0&&D(c.nome)===D(r));if(i)return i;let n=this.carimbo(),s={id:uo(),nome:r,ordem:vo(pt(a),null),atualizadoEm:n.agora,dispositivo:n.dispositivo};return t&&(s.cor=t),await this.pastas.gravar(s.id,s),s}async editarPasta(o,t){let r=await this.pastas.obter(o);r&&await this.pastas.gravar(o,X(r,t,this.carimbo()))}async removerPasta(o){let t=await this.pastas.obter(o);if(!t)return;let r=this.carimbo();await this.pastas.gravar(o,Lo(t,r));let a=(await this.todos()).filter(i=>i.pasta===o);await this.favoritos.gravarVarios(a.map(i=>[i.id,X(i,{pasta:void 0},r)]))}async etiquetasAtivas(){return(await this.etiquetas.listar()).filter(o=>o.removidoEm===void 0).sort(re)}async criarEtiqueta(o,t){let r=o.trim();if(!r)throw new Error("Informe o nome da etiqueta.");let a=(await this.etiquetas.listar()).find(s=>s.removidoEm===void 0&&D(s.nome)===D(r));if(a)return a;let i=this.carimbo(),n={id:uo(),nome:r,cor:t??Do(r),atualizadoEm:i.agora,dispositivo:i.dispositivo};return await this.etiquetas.gravar(n.id,n),n}async editarEtiqueta(o,t){let r=await this.etiquetas.obter(o);r&&await this.etiquetas.gravar(o,X(r,t,this.carimbo()))}async removerEtiqueta(o){let t=await this.etiquetas.obter(o);if(!t)return;let r=this.carimbo();await this.etiquetas.gravar(o,Lo(t,r));let a=(await this.todos()).filter(i=>i.etiquetas.includes(o));await this.favoritos.gravarVarios(a.map(i=>[i.id,X(i,{etiquetas:i.etiquetas.filter(n=>n!==o)},r)]))}async importar(o){let t=await this.mesclarEm(this.favoritos,o.favoritos??[],ea);return await this.mesclarEm(this.pastas,o.pastas??[]),await this.mesclarEm(this.etiquetas,o.etiquetas??[]),await this.mesclarEm(this.vistosCol,o.vistos??[]),t}async mesclarEm(o,t,r=a=>a){let a=new Map((await o.listar()).map(c=>[c.id,c])),i=[],n=0,s=0;for(let c of t){let l=a.get(c.id);l?tt(c,l)&&(s+=1,i.push([c.id,r(c,l)])):(n+=1,i.push([c.id,r(c,void 0)]))}return await o.gravarVarios(i),{novos:n,atualizados:s}}async limpar(o=Date.now()){for(let t of[this.favoritos,this.pastas,this.etiquetas]){let r=await t.listar(),a=new Set(rt(r,o,90).map(i=>i.id));await t.apagar(r.filter(i=>!a.has(i.id)).map(i=>i.id))}}aoMudarAtuais(o){return this.atuaisCol.aoMudar(o)}aoMudar(o){let t=[this.favoritos.aoMudar(o),this.pastas.aoMudar(o),this.etiquetas.aoMudar(o),this.vistosCol.aoMudar(o)];return()=>{for(let r of t)r()}}};function mt(e,o){return e.ordem!==o.ordem?e.ordem<o.ordem?-1:1:re(e,o)}async function ft(e,o,t){let r=await e.obter(t);if(!r||r.removidoEm!==void 0)return null;await o.adicionar({id:r.id,protocolo:r.protocolo,tipo:r.tipo,especificacao:r.especificacao,sigiloso:r.sigiloso});let a=await o.editar(t,{titulo:r.titulo,nota:r.nota,prazo:r.prazo,local:r.local,pasta:void 0,etiquetas:[]});return await e.remover([t]),a}function ea(e,o){if(!e.resumido||!o?.protocolo)return e;let t={...o,atualizadoEm:e.atualizadoEm,dispositivo:e.dispositivo,removidoEm:e.removidoEm,sigiloso:e.sigiloso??o.sigiloso};return delete t.resumido,t.removidoEm===void 0&&delete t.removidoEm,t.sigiloso?(delete t.especificacao,delete t.sigiloAConfirmar):delete t.sigiloso,t}async function gt(e,o){let t=new Blob([e]).stream().pipeThrough(o);return new Uint8Array(await new Response(t).arrayBuffer())}function ta(e){let o="";for(let t=0;t<e.length;t+=32768)o+=String.fromCharCode(...e.subarray(t,t+32768));return btoa(o).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}function ra(e){if(!/^[A-Za-z0-9_-]*$/.test(e))throw new Error("Conte\xFAdo fora do formato base64url.");let o=e.replace(/-/g,"+").replace(/_/g,"/").padEnd(Math.ceil(e.length/4)*4,"="),t=atob(o),r=new Uint8Array(t.length);for(let a=0;a<t.length;a++)r[a]=t.charCodeAt(a);return r}async function vt(e){let o=new TextEncoder().encode(JSON.stringify(e));return ta(await gt(o,new CompressionStream("gzip")))}async function ht(e){let o=await gt(ra(e),new DecompressionStream("gzip"));return JSON.parse(new TextDecoder().decode(o))}var aa=e=>e.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");function bt(e,o,t=2e3){let r=[`<p>${aa(e)}</p>`];for(let a=0;a<o.length;a+=t)r.push(`<p>${o.slice(a,a+t)}</p>`);return r.join(`
`)}function ia(e){let o=e;for(let t=0;t<2&&/&lt;\s*\/?p[\s>&]/i.test(o);t++)o=o.replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&quot;/g,'"').replace(/&amp;/g,"&");return o}function xt(e){let t=[...ia(e).matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(r=>(r[1]??"").trim()).slice(1);return!t.length||!t.every(r=>/^[A-Za-z0-9_-]+$/.test(r))?null:t.join("")}var I=e=>e&&typeof e=="object"&&!Array.isArray(e)?e:null,S=e=>typeof e=="string",$=e=>typeof e=="number"&&Number.isFinite(e),ae=/^\d{4}-\d{2}-\d{2}$/;var Oo=e=>S(e.id)&&e.id!==""&&$(e.atualizadoEm)&&S(e.dispositivo)&&(e.removidoEm===void 0||$(e.removidoEm));function na(e){let o=I(e),t=I(o?.referencia);if(!o||!t||!["ate","desde","desdeUteis"].includes(String(o.exibicao)))return!1;let r=t.de==="novoDocumento"?[t.desde]:t.de==="data"||t.de==="documento"?[t.data]:[];if(!r.length||!r.every(i=>S(i)&&ae.test(i))||t.de==="novoDocumento"&&!(Array.isArray(t.tipos)&&t.tipos.length&&t.tipos.every(S)))return!1;let a=I(o.vencimento);return o.vencimento===void 0||a?.em==="data"&&S(a.data)&&ae.test(a.data)||a?.em==="dias"&&$(a.n)&&Math.abs(a.n)<=3650&&(a.contagem==="corridos"||a.contagem==="uteis")}function sa(e){let o=I(e);if(!o||!Oo(o)||!S(o.protocolo)||!S(o.ordem)||!$(o.criadoEm)||!Array.isArray(o.etiquetas))return null;let t={...o,etiquetas:o.etiquetas.filter(S)};t.prazo!==void 0&&!na(t.prazo)&&delete t.prazo;for(let i of["titulo","tipo","especificacao","pasta","nota"])t[i]!==void 0&&!S(t[i])&&delete t[i];ho(t.ordem)||(t.ordem="a0"),t.fixado!==!0&&delete t.fixado,t.sigiloso!==!0?delete t.sigiloso:delete t.especificacao;let r=I(t.lembrete);if(t.lembrete!==void 0&&(r&&S(r.em)&&ae.test(r.em)?t.lembrete=S(r.texto)?{em:r.em,texto:r.texto}:{em:r.em}:delete t.lembrete),t.documentos!==void 0){let i=Array.isArray(t.documentos)?t.documentos.map(I).filter(n=>!!n&&S(n.id)&&S(n.numero)&&S(n.titulo)).map(n=>({id:n.id,numero:n.numero,titulo:n.titulo,criadoEm:$(n.criadoEm)?n.criadoEm:0,...S(n.nota)?{nota:n.nota}:{}})):[];i.length?t.documentos=i:delete t.documentos}t.visto!==void 0&&!(I(t.visto)&&$(I(t.visto).quando))&&delete t.visto;let a=I(t.local);return t.local!==void 0&&!(a&&$(a.lat)&&$(a.lng)&&Math.abs(a.lat)<=90&&Math.abs(a.lng)<=180)&&delete t.local,t.sigiloAConfirmar!==!0&&delete t.sigiloAConfirmar,t.resumido!==!0&&delete t.resumido,t}var yt=/^#[0-9a-f]{3,8}$/i,ca=e=>{let o=I(e);if(!o||!Oo(o)||!S(o.nome)||!S(o.ordem))return null;let t={...o,ordem:ho(o.ordem)?o.ordem:"a0"};return t.cor!==void 0&&!(S(t.cor)&&yt.test(t.cor))&&delete t.cor,t},la=e=>{let o=I(e);return!o||!Oo(o)||!S(o.nome)?null:{...o,cor:S(o.cor)&&yt.test(o.cor)?o.cor:Do(o.nome)}},da=e=>{let o=I(e);return o&&Oo(o)&&I(o.visto)&&$(I(o.visto).quando)?o:null},ua=e=>{let o=I(e);return!o||!S(o.host)||!S(o.login)?!1:o.lista==="pessoal"||o.lista==="unidade"&&S(I(o.unidade)?.id)&&I(o.unidade)?.id!==""};function At(e){let o=I(e);if(!o||o.formato!=="seipro-favoritos"||o.versao!==1||!Array.isArray(o.escopos))return null;let t=0,r=(i,n)=>{let s=Array.isArray(i)?i:[],c=s.map(n).filter(l=>l!==null);return t+=s.length-c.length,c},a=[];for(let i of o.escopos){let n=I(i);if(!n||!ua(n.escopo)){t+=1;continue}a.push({escopo:n.escopo,favoritos:r(n.favoritos,sa),pastas:r(n.pastas,ca),etiquetas:r(n.etiquetas,la),vistos:r(n.vistos,da)})}return{envelope:{formato:"seipro-favoritos",versao:1,escopos:a,gravadoEm:$(o.gravadoEm)?o.gravadoEm:0,dispositivo:S(o.dispositivo)?o.dispositivo:"",revisao:$(o.revisao)?o.revisao:0},descartados:t}}var Et=100*1024,Pt=80*1024,ko="[_SEIPRO_";function St(e){let o=e.trim().toLowerCase(),t=`${ko}FAV_${o}]`;return t.length<=50?t:`${ko}FAV_${o.slice(0,27)}~${ao(o).slice(0,8)}]`}var Ct="Dados internos do SEI Pro (favoritos). N\xE3o use em documentos nem edite.";function wt(e,o){return{id:e.id,protocolo:"",etiquetas:[],ordem:"a0",criadoEm:e.criadoEm,atualizadoEm:e.atualizadoEm,dispositivo:e.dispositivo,resumido:!0,...o}}async function Mt(e,o,t,r=new Set){let{todos:a,pastas:i,etiquetas:n,vistos:s}=await e.instantaneoCompleto(),c=[];for(let l of a)if(!(l.sigiloAConfirmar&&!l.removidoEm)){if(l.sigiloso){r.has(l.id)&&c.push(wt(l,{sigiloso:!0,...l.removidoEm!==void 0?{removidoEm:l.removidoEm}:{}}));continue}c.push(l.removidoEm!==void 0||l.resumido?wt(l,l.removidoEm!==void 0?{removidoEm:l.removidoEm}:{}):l)}return{formato:"seipro-favoritos",versao:1,escopos:[{escopo:o,favoritos:c,pastas:i,etiquetas:n,vistos:s.filter(l=>c.some(u=>u.id===l.id&&!u.resumido&&!u.removidoEm))}],gravadoEm:t.agora,dispositivo:t.dispositivo,revisao:0}}async function Tt(e,o){let t=`Dados internos do SEI Pro \u2014 favoritos de ${o}. N\xE3o use em documentos nem edite: o SEI Pro regrava este texto sozinho.`;return bt(t,await vt(e))}var pa=(e,o)=>e.host===o.host&&e.login.toLowerCase()===o.login.toLowerCase()&&e.lista===o.lista&&(e.unidade?.id??"")===(o.unidade?.id??"");async function Dt(e,o){let t=xt(e);if(!t)return{invalido:"o texto n\xE3o tem os dados do SEI Pro (foi editado ou est\xE1 vazio)"};let r;try{r=await ht(t)}catch{return{invalido:"os dados do texto est\xE3o corrompidos"}}let a=r;if(a?.formato==="seipro-favoritos"&&typeof a.versao=="number"&&a.versao>1)return{maisNovo:!0};let i=At(r);if(!i)return{invalido:"o texto n\xE3o est\xE1 no formato dos favoritos"};let n=i.envelope.escopos;return n.length!==1||!pa(n[0].escopo,o)?{invalido:"o texto \xE9 de outro usu\xE1rio ou de outra unidade"}:{envelope:i.envelope}}async function ma(e,o){let t=await e.listarCaixa(o),r=new Map;for(let c of e.repos)for(let l of await c.ativos()){if(l.sigiloso||l.sigiloAConfirmar||l.resumido||t.has(l.id))continue;let u=r.get(l.id)??{protocolo:l.protocolo,repos:[]};u.repos.push(c),r.set(l.id,u)}let a=r.size,i=0,n=0,s=0;await e.progresso({feitos:i,total:a});for(let[c,l]of r){if(o.aborted)break;await e.progresso({feitos:i,total:a,atual:l.protocolo});try{let u=await e.localizar(l.protocolo,o);if(u!==c||t.has(u))throw new Error("O n\xFAmero n\xE3o leva a este processo.");let p=await e.lerProcesso(l.protocolo,o);p.abertoNaUnidade&&s++;for(let d of l.repos){let m=(await d.atuais()).get(c),v={...m,quando:Date.now(),fonte:"atualizar",qtdDocumentos:p.qtdDocumentos,ultimoAndamento:p.ultimoAndamento??m?.ultimoAndamento,abertoNaUnidade:p.abertoNaUnidade,recebidoNaLeitura:p.abertoNaUnidade?!0:void 0};await d.gravarAtual(c,v),(await d.vistos()).has(c)||await d.gravarVisto(c,v)}}catch{if(o.aborted)break;n++}i++,i<a&&!o.aborted&&await e.esperar(e.intervalo??3e3,o).catch(()=>{})}return await e.progresso({feitos:i,total:a,fim:!0,cancelado:o.aborted,erros:n,chegaram:s}),{lidos:i,erros:n,chegaram:s}}var Lt=(e,o)=>`favoritos/atualizando/${e}|${o.toLowerCase()}`,fa=(e,o)=>`favoritos/atualizarCancelar/${e}|${o.toLowerCase()}`;var qo=class{constructor(o,t,r){this.criarDeps=o;this.gravarProgresso=t;this.ouvir=r}emCurso=null;async iniciar(){if(this.emCurso)throw Object.assign(new Error("J\xE1 h\xE1 uma atualiza\xE7\xE3o em andamento nesta aba."),{codigo:"EM_ANDAMENTO"});let o=new AbortController;this.emCurso=o;let t=this.ouvir?fa(this.ouvir.host,this.ouvir.login):"",r=this.ouvir?.area.aoMudar(a=>{t in a&&a[t]?.novo!==void 0&&o.abort()});try{return await ma({...this.criarDeps(),progresso:a=>this.gravarProgresso(a)},o.signal)}finally{r?.(),this.emCurso=null}}cancelar(){return this.emCurso?.abort(),!!this.emCurso}};function f(e,o={},...t){let r=document.createElement(e);for(let[a,i]of Object.entries(o))i===void 0||i===!1||(typeof i=="function"?r.addEventListener(a.replace(/^on/,""),i):i===!0?r.setAttribute(a,""):a==="class"?r.className=i:a==="value"&&e==="textarea"?r.value=i:r.setAttribute(a,i));for(let a of t)a!=null&&a!==!1&&r.append(a);return r}var V={fill:"currentColor",stroke:"none"},It="M12 3.2l2.7 5.5 6 .9-4.35 4.25 1 6L12 17l-5.35 2.85 1-6L3.3 9.6l6-.9z",Ot={estrela:[["path",{d:It}]],estrelaCheia:[["path",{d:It,fill:"currentColor"}]],pasta:[["path",{d:"M3.5 7.5a2 2 0 0 1 2-2h4l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"}]],etiqueta:[["path",{d:"M3.5 12.2V4.5a1 1 0 0 1 1-1h7.7l8.3 8.3a1 1 0 0 1 0 1.4l-7.1 7.1a1 1 0 0 1-1.4 0z"}],["circle",{cx:"8",cy:"8",r:"1.4",...V}]],relogio:[["circle",{cx:"12",cy:"12",r:"9"}],["path",{d:"M12 7.2V12l3.2 1.9"}]],nota:[["path",{d:"M6 3.5h9l3.5 3.5v13.5H6z"}],["path",{d:"M9 11h6"}],["path",{d:"M9 15h6"}]],lixeira:[["path",{d:"M4.5 6.5h15"}],["path",{d:"M9.5 6.5V4.8c0-.7.6-1.3 1.3-1.3h2.4c.7 0 1.3.6 1.3 1.3v1.7"}],["path",{d:"M6.8 6.5 7.6 19c0 .8.7 1.5 1.5 1.5h5.8c.8 0 1.5-.7 1.5-1.5l.8-12.5"}]],lapis:[["path",{d:"M17.5 3.5a2.1 2.1 0 0 1 3 3L9 18l-4.5 1.5L6 15z"}],["path",{d:"M15 6l3 3"}]],fechar:[["path",{d:"M18 6 6 18"}],["path",{d:"M6 6l12 12"}]],mais:[["path",{d:"M12 5v14"}],["path",{d:"M5 12h14"}]],busca:[["circle",{cx:"11",cy:"11",r:"6.5"}],["path",{d:"M20.5 20.5l-4.8-4.8"}]],baixar:[["path",{d:"M12 3.5v11"}],["path",{d:"M7.5 10.2 12 14.7l4.5-4.5"}],["path",{d:"M4.5 19.5h15"}]],subir:[["path",{d:"M12 14.5v-11"}],["path",{d:"M7.5 7.8 12 3.3l4.5 4.5"}],["path",{d:"M4.5 19.5h15"}]],copiar:[["rect",{x:"8.5",y:"8.5",width:"12",height:"12",rx:"2"}],["path",{d:"M15.5 8.5V5.5a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"}]],restaurar:[["path",{d:"M9 14 4 9l5-5"}],["path",{d:"M4 9h9a7 7 0 0 1 7 7v4"}]],check:[["path",{d:"M20 6.5 9.2 17.3 4 12.1"}]],alerta:[["path",{d:"M10.3 4.4 2.8 17.6a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.4a2 2 0 0 0-3.4 0z"}],["path",{d:"M12 9.5v4"}],["circle",{cx:"12",cy:"16.8",r:"1",...V}]],menu:[["circle",{cx:"5",cy:"12",r:"1.4",...V}],["circle",{cx:"12",cy:"12",r:"1.4",...V}],["circle",{cx:"19",cy:"12",r:"1.4",...V}]],alca:[["circle",{cx:"9",cy:"6",r:"1.3",...V}],["circle",{cx:"15",cy:"6",r:"1.3",...V}],["circle",{cx:"9",cy:"12",r:"1.3",...V}],["circle",{cx:"15",cy:"12",r:"1.3",...V}],["circle",{cx:"9",cy:"18",r:"1.3",...V}],["circle",{cx:"15",cy:"18",r:"1.3",...V}]],ajustes:[["path",{d:"M4 7h5"}],["path",{d:"M13 7h7"}],["circle",{cx:"11",cy:"7",r:"2.1"}],["path",{d:"M4 17h9"}],["path",{d:"M17 17h3"}],["circle",{cx:"15",cy:"17",r:"2.1"}]],setaCima:[["path",{d:"M12 19V6"}],["path",{d:"M6 12l6-6 6 6"}]],setaBaixo:[["path",{d:"M12 5v13"}],["path",{d:"M18 12l-6 6-6-6"}]],recolher:[["path",{d:"M6 15l6-6 6 6"}]],expandir:[["path",{d:"M6 9l6 6 6-6"}]],local:[["path",{d:"M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z"}],["circle",{cx:"12",cy:"10",r:"2.3"}]],sino:[["path",{d:"M6.5 16.5V11a5.5 5.5 0 0 1 11 0v5.5l1.5 1.5h-14z"}],["path",{d:"M10 20.5a2 2 0 0 0 4 0"}]],documento:[["path",{d:"M7 3.5h7l4 4v13H7z"}],["path",{d:"M14 3.5v4h4"}]],painel:[["rect",{x:"3.5",y:"4.5",width:"17",height:"15",rx:"2"}],["path",{d:"M14.5 4.5v15"}]],atualizar:[["path",{d:"M19.5 12a7.5 7.5 0 1 1-2.2-5.3"}],["path",{d:"M19.5 4.5v4h-4"}]],nuvem:[["path",{d:"M7 18.5h10a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7 9.5a4.5 4.5 0 0 0 0 9z"}]],chevron:[["path",{d:"M7 9.5l5 5 5-5"}]],pino:[["path",{d:"M9.5 3.5h5l-.8 5.2 3.3 3.1v1.7H7v-1.7l3.3-3.1z"}],["path",{d:"M12 13.5v7"}]],pinoCheio:[["path",{d:"M9.5 3.5h5l-.8 5.2 3.3 3.1v1.7H7v-1.7l3.3-3.1z",fill:"currentColor"}],["path",{d:"M12 13.5v7"}]],filtro:[["path",{d:"M4 5.5h16l-6.2 7.3v5.4l-3.6 1.8v-7.2z"}]],ordenar:[["path",{d:"M7.5 4.5v15"}],["path",{d:"M4 16l3.5 3.5L11 16"}],["path",{d:"M16.5 19.5v-15"}],["path",{d:"M13 8l3.5-3.5L20 8"}]],mapa:[["path",{d:"M9 4.5 3.5 6.6v13l5.5-2.1 6 2.1 5.5-2.1v-13L15 6.6z"}],["path",{d:"M9 4.5v13"}],["path",{d:"M15 6.6v13"}]],olho:[["path",{d:"M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"}],["circle",{cx:"12",cy:"12",r:"2.8"}]],camadas:[["path",{d:"M12 3.5 20.5 8 12 12.5 3.5 8z"}],["path",{d:"M3.5 12 12 16.5 20.5 12"}],["path",{d:"M3.5 16 12 20.5 20.5 16"}]],historico:[["path",{d:"M3.8 12.5A8.3 8.3 0 1 0 6.2 6"}],["path",{d:"M3.8 4.2v4.3h4.3"}],["path",{d:"M12 8v4.2l2.8 1.7"}]],pessoa:[["circle",{cx:"12",cy:"8",r:"3.6"}],["path",{d:"M5 20c.9-3.7 3.6-5.6 7-5.6s6.1 1.9 7 5.6"}]],predio:[["path",{d:"M5 20.5v-15a1 1 0 0 1 1-1h7.5a1 1 0 0 1 1 1v15"}],["path",{d:"M14.5 9.5H18a1 1 0 0 1 1 1v10"}],["path",{d:"M3 20.5h18"}],["path",{d:"M8.5 8.5h3"}],["path",{d:"M8.5 12h3"}],["path",{d:"M8.5 15.5h3"}]],brilho:[["path",{d:"M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"}],["path",{d:"M18.5 16.5v4"}],["path",{d:"M16.5 18.5h4"}]],calendario:[["rect",{x:"4",y:"5.5",width:"16",height:"15",rx:"2"}],["path",{d:"M4 10h16"}],["path",{d:"M8.5 3.5v4"}],["path",{d:"M15.5 3.5v4"}]],cadeado:[["rect",{x:"5.5",y:"10.5",width:"13",height:"10",rx:"2"}],["path",{d:"M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"}]],saida:[["path",{d:"M14 4.5h4.5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H14"}],["path",{d:"M10 16l4-4-4-4"}],["path",{d:"M14 12H4.5"}]],planilha:[["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2"}],["path",{d:"M4 9.5h16"}],["path",{d:"M4 15h16"}],["path",{d:"M10 9.5V20"}]],mover:[["path",{d:"M4.5 12h14"}],["path",{d:"M13.5 6.5 19 12l-5.5 5.5"}]],sol:[["circle",{cx:"12",cy:"12",r:"3.8"}],["path",{d:"M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4"}]],teclado:[["rect",{x:"3",y:"6.5",width:"18",height:"11",rx:"2"}],["path",{d:"M7 10h.01M10.3 10h.01M13.7 10h.01M17 10h.01M8 14h8"}]]},Fn=Object.keys(Ot);function M(e,o=18){let t="http://www.w3.org/2000/svg",r=document.createElementNS(t,"svg"),a={viewBox:"0 0 24 24",width:String(o),height:String(o),fill:"none",stroke:"currentColor","stroke-width":"1.8","stroke-linecap":"round","stroke-linejoin":"round","aria-hidden":"true",focusable:"false",class:"spro-icone"};for(let[i,n]of Object.entries(a))r.setAttribute(i,n);for(let[i,n]of Ot[e]){let s=document.createElementNS(t,i);for(let[c,l]of Object.entries(n))s.setAttribute(c,l);r.append(s)}return r}var ga="position:fixed;left:50%;bottom:20px;transform:translateX(-50%);z-index:2147483646;display:flex;align-items:center;gap:12px;max-width:min(560px,calc(100vw - 24px));box-sizing:border-box;padding:10px 10px 10px 16px;font:13px/1.35 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:#f3f5f8;background:#1f2329;border:1px solid rgb(255 255 255 / 8%);border-radius:12px;box-shadow:0 10px 24px -6px rgb(16 24 40 / 30%),0 24px 56px -12px rgb(16 24 40 / 35%);animation:spro-fav-aviso 220ms cubic-bezier(.2,.8,.2,1)",va="flex:none;padding:5px 10px;font:inherit;font-weight:600;color:#9cc3ff;background:rgb(255 255 255 / 7%);border:0;border-radius:6px;cursor:pointer";function kt(e,o){return(t,r,a)=>new Promise(i=>{for(let l of e.querySelectorAll(".spro-fav-aviso"))l.remove();let n=!1,s=l=>{n||(n=!0,c.remove(),i(l))},c=f("div",{class:"spro-fav-aviso",role:"status",style:ga+(o?";background:#2b3036":"")},f("span",{style:"flex:1"},t),r?f("button",{type:"button",style:va,onclick:()=>s(!0)},r):null);(e.body??e.documentElement).append(c),setTimeout(()=>s(!1),Math.max(10,Math.min(a,6e4)))})}var qt=new Set;var ha=null;function ba(e){let o=e.closest?.("dialog[open]");if(o)return o;let t=e.getRootNode?.(),r=e.ownerDocument;return t&&t!==r&&t.host?t:r.body??r.documentElement}function zt(e,o){let t=e;try{t?.CustomEvent&&t.dispatchEvent(new t.CustomEvent("spro-popover",{detail:{fundo:o}}))}catch{}}function Nt(e,o,t){let r=e.ownerDocument,a=r.defaultView;ba(e).append(o);let i=!0,n=()=>{if(!i)return;let d=e.getBoundingClientRect?.();if(!d)return;let m=a?.innerHeight??0,v=a?.innerWidth??0,x=Math.min(t.largura??Math.max(d.width,t.larguraMinima??0),Math.max(180,v-16)),w=t.alinharDireita?d.right-x:d.left,P=Math.max(8,Math.min(w,v-x-8)),A=t.alturaMaxima??360;o.style.maxHeight="none";let q=Math.min(o.scrollHeight||A,A),oo=m-d.bottom-8,yo=d.top-8,eo=ha?.()??!1,H=!eo&&oo<Math.min(q,200)&&yo>oo;o.style.left=`${P}px`,o.style.width=`${x}px`,o.style.maxHeight=`${eo?A:Math.max(140,Math.min(A,H?yo:oo>140?oo:A))}px`,o.classList.toggle("spro-flutuante-cima",H),H?(o.style.top="",o.style.bottom=`${m-d.top+4}px`):(o.style.bottom="",o.style.top=`${d.bottom+4}px`),zt(a,H?0:Math.ceil(d.bottom+4+q+12))},s=d=>{let m=d.composedPath?.()??[],v=d.target,x=w=>m.includes(w)||!!v&&!!w.contains?.(v);x(o)||x(e)||t.aoFechar()},c=()=>{e.isConnected?n():t.aoFechar()},l=d=>{d.target instanceof Node&&o.contains(d.target)||c()},u=()=>t.aoFechar();r.addEventListener("pointerdown",s,!0),a?.addEventListener("scroll",l,!0),a?.addEventListener("resize",c),a?.addEventListener("blur",u);let p={ancora:e,fechar:()=>t.aoFechar()};return qt.add(p),n(),{posicionar:n,fechar(){i&&(i=!1,qt.delete(p),r.removeEventListener("pointerdown",s,!0),a?.removeEventListener("scroll",l,!0),a?.removeEventListener("resize",c),a?.removeEventListener("blur",u),o.remove(),zt(a,0))}}}function Rt(e,o){let t=D(o);if(!t)return[...e];let r=t.split(" "),a=[];return e.forEach((i,n)=>{let s=D(i.rotulo),c=`${s} ${D(i.descricao??"")}`;if(!r.every(u=>c.includes(u)))return;let l=s.startsWith(t)?0:s.split(" ").some(u=>u.startsWith(r[0]))?1:2;a.push({o:i,nota:l,i:n})}),a.sort((i,n)=>i.nota-n.nota||i.i-n.i).map(i=>i.o)}function xa(e,o){let t=e.normalize("NFC"),r=D(o).split(" ").filter(Boolean);if(!r.length)return[{texto:t,marcado:!1}];let a=[...t],i="",n=[];a.forEach((l,u)=>{let p=l.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();for(let d of p)i+=d,n.push(u)});let s=new Array(a.length).fill(!1);for(let l of r){let u=i.indexOf(l);if(!(u<0))for(let p=u;p<u+l.length;p++)s[n[p]]=!0}let c=[];return a.forEach((l,u)=>{let p=c[c.length-1];p&&p.marcado===s[u]?p.texto+=l:c.push({texto:l,marcado:s[u]})}),c}var ya=0;function bo(e){let o=`spro-combo-${++ya}`,t=()=>typeof e.opcoes=="function"?e.opcoes():e.opcoes,r=new Map,a=g=>t().find(h=>h.valor===g)??r.get(g),i=[...e.valor??[]],n=null,s="",c=0,l=[],u=null,p=f("button",{type:"button",class:`spro-combo${e.classe?` ${e.classe}`:""}`,role:"combobox","aria-haspopup":"listbox","aria-expanded":"false","aria-label":e.rotulo,title:e.rotulo}),d=()=>e.aoMudar?.([...i]);function m(){let g=[];e.icone&&g.push(M(e.icone,15));let h=i.map(T=>a(T)).filter(T=>!!T),b=f("span",{class:"spro-combo-texto"});if(!h.length)b.classList.add("spro-combo-vazio"),b.append(e.vazio??"Escolher\u2026");else{let T=h[0];T.cor&&b.append(f("span",{class:"spro-combo-cor",style:`background:${T.cor}`})),b.append(f("span",{class:"spro-combo-rotulo"},T.rotulo)),h.length>1&&b.append(f("span",{class:"spro-combo-mais"},`+${h.length-1}`))}g.push(b,M("chevron",14)),p.classList.toggle("spro-combo-ativo",e.multiplo===!0&&h.length>0),p.replaceChildren(...g)}let v=()=>e.busca??(t().length>7||!!e.multiplo||!!e.criar);function x(g){if(e.multiplo){i=i.includes(g.valor)?i.filter(b=>b!==g.valor):[...i,g.valor],d(),m(),q();return}let h=i.length!==1||i[0]!==g.valor;i=[g.valor],m(),H(!0),h&&d()}async function w(){if(!e.criar)return;let g=s.trim();if(!g)return;let h=await e.criar(g);if(h){if(r.set(h.valor,h),s="",n){let b=n.querySelector(".spro-combo-busca");b&&(b.value="")}e.multiplo&&i.includes(h.valor)?q():x(h)}}function P(g,h){let b=i.includes(g.valor),T=f("span",{class:"spro-combo-op-rotulo"});for(let C of xa(g.rotulo,s))T.append(C.marcado?f("mark",{},C.texto):C.texto);let z=f("li",{role:"option",id:`${o}-op-${h}`,class:`spro-combo-op${h===c?" spro-combo-op-ativa":""}`,"data-valor":g.valor,"aria-selected":b?"true":"false"},e.multiplo?f("span",{class:"spro-combo-caixa","aria-hidden":"true"},b?M("check",12):null):null,g.cor?f("span",{class:"spro-combo-cor",style:`background:${g.cor}`}):null,g.icone?M(g.icone,15):null,f("span",{class:"spro-combo-op-textos"},T,g.descricao?f("span",{class:"spro-combo-op-desc"},g.descricao):null),g.contagem!==void 0?f("span",{class:"spro-combo-conta"},String(g.contagem)):null,!e.multiplo&&b?f("span",{class:"spro-combo-marca"},M("check",14)):null);return z.addEventListener("pointerdown",C=>C.preventDefault()),z.addEventListener("click",()=>{c=h,x(g)}),z.addEventListener("pointermove",()=>{c!==h&&(c=h,A())}),z}function A(){if(!n)return;let g=[...n.querySelectorAll('[role="option"]')];g.forEach((z,C)=>{z.classList.toggle("spro-combo-op-ativa",C===c)});let h=g[c],T=n.querySelector(".spro-combo-busca")??n.querySelector('[role="listbox"]');h?(T?.setAttribute("aria-activedescendant",h.id),h.scrollIntoView?.({block:"nearest"})):T?.removeAttribute("aria-activedescendant")}function q(){if(!n)return;l=Rt(t(),s),c>=l.length&&(c=Math.max(0,l.length-1)),n.querySelector('[role="listbox"]').replaceChildren(...l.map(P));let h=n.querySelector(".spro-combo-extras");h.replaceChildren();let b=s.trim();l.length||h.append(f("p",{class:"spro-combo-nada"},b?"Nada encontrado.":"Nenhuma op\xE7\xE3o."));let T=t().some(C=>D(C.rotulo)===D(b));if(e.criar&&b&&!T){let C=f("button",{type:"button",class:"spro-combo-criar"},M("mais",14),f("span",{},e.rotuloCriar?e.rotuloCriar(b):`Criar \u201C${b}\u201D`));C.addEventListener("pointerdown",O=>O.preventDefault()),C.addEventListener("click",()=>void w()),h.append(C)}let z=n.querySelector(".spro-combo-rodape");if(z){let C=l.filter(io=>!i.includes(io.valor)),O=f("button",{type:"button",class:"spro-combo-acao",disabled:!b||!C.length},`Marcar os filtrados${b&&C.length?` (${C.length})`:""}`);O.addEventListener("click",()=>{i=[...i,...C.map(io=>io.valor)],d(),m(),q()});let $o=f("button",{type:"button",class:"spro-combo-acao spro-combo-limpar",disabled:!i.length},"Limpar");$o.addEventListener("click",()=>{i=[],d(),m(),q()}),z.replaceChildren(f("span",{class:"spro-combo-total"},i.length?`${i.length} marcado${i.length>1?"s":""}`:""),O,$o)}A()}let oo=()=>u?.posicionar();function yo(g){let h=l.length,b=g.target,T=n?[...n.querySelectorAll(".spro-combo-rodape button:not(:disabled)")]:[],z=!!b?.closest?.(".spro-combo-rodape, .spro-combo-criar");if(g.key==="Tab"){let O=T.indexOf(b);if(!g.shiftKey&&O<T.length-1)T[O+1]?.focus();else if(g.shiftKey&&O>=0)O>0?T[O-1]?.focus():(n?.querySelector(".spro-combo-busca")??n?.querySelector('[role="listbox"]'))?.focus();else{H(!0);return}g.preventDefault(),g.stopPropagation();return}if(z&&g.key!=="Escape")return;let C=!n?.querySelector(".spro-combo-busca");if(C&&g.key===" "){let O=l[c];O&&x(O),g.preventDefault(),g.stopPropagation();return}if(C&&g.key.length===1&&!g.ctrlKey&&!g.metaKey&&!g.altKey){let O=D(g.key),io=[...l.keys()].map(Vo=>(c+1+Vo)%Math.max(1,h)).find(Vo=>D(l[Vo]?.rotulo??"").startsWith(O));io!==void 0&&(c=io,A()),g.preventDefault(),g.stopPropagation();return}switch(g.key){case"ArrowDown":c=h?(c+1)%h:0,A();break;case"ArrowUp":c=h?(c-1+h)%h:0,A();break;case"Home":if(g.target?.classList?.contains("spro-combo-busca")&&s)return;c=0,A();break;case"End":if(g.target?.classList?.contains("spro-combo-busca")&&s)return;c=Math.max(0,h-1),A();break;case"Enter":{let O=l[c];O?x(O):w();break}case"Escape":H(!0);break;case"Backspace":if(!e.multiplo||s||!i.length)return;i=i.slice(0,-1),d(),m(),q();break;default:return}g.preventDefault(),g.stopPropagation()}function eo(g=""){if(n)return;s=g,c=g?0:(()=>{let z=Rt(t(),s).findIndex(C=>C.valor===i[i.length-1]);return z<0?0:z})();let b=v()?f("input",{type:"text",class:"spro-combo-busca",placeholder:e.criar?"Buscar ou criar\u2026":"Buscar\u2026","aria-label":`Filtrar ${e.rotulo.toLowerCase()}`,"aria-controls":`${o}-lista`,"aria-autocomplete":"list",autocomplete:"off",spellcheck:"false",value:g}):null;if(b&&(b.value=g,b.addEventListener("input",()=>{s=b.value,c=0,q(),oo()})),n=f("div",{class:`spro-combo-pop${e.multiplo?" spro-combo-pop-multi":""}`},b?f("div",{class:"spro-combo-cabeca"},M("busca",15),b):null,f("ul",{role:"listbox",id:`${o}-lista`,class:"spro-combo-lista",tabindex:b?void 0:"-1","aria-label":e.rotulo,"aria-multiselectable":e.multiplo?"true":void 0}),f("div",{class:"spro-combo-extras"}),e.multiplo?f("div",{class:"spro-combo-rodape"}):null),n.addEventListener("keydown",yo),u=Nt(p,n,{larguraMinima:e.larguraLista??220,alturaMaxima:360,aoFechar:()=>H(!1)}),p.setAttribute("aria-expanded","true"),p.setAttribute("aria-controls",`${o}-lista`),p.classList.add("spro-combo-aberto"),q(),oo(),!n)return;(b??n.querySelector('[role="listbox"]'))?.focus?.({preventScroll:!0}),b&&g&&b.setSelectionRange?.(g.length,g.length)}function H(g=!1){n&&(u?.fechar(),u=null,n=null,s="",p.setAttribute("aria-expanded","false"),p.removeAttribute("aria-controls"),p.classList.remove("spro-combo-aberto"),g&&p.focus?.({preventScroll:!0}))}return p.addEventListener("click",()=>n?H(!0):eo()),p.addEventListener("keydown",g=>{n||(g.key==="ArrowDown"||g.key==="ArrowUp"?(g.preventDefault(),eo()):g.key.length===1&&g.key!==" "&&!g.ctrlKey&&!g.metaKey&&!g.altKey&&v()&&(g.preventDefault(),eo(g.key)))}),m(),{el:p,valor:()=>[...i],definir(g,h=!1){i=[...g],m(),q(),h&&d()},atualizar(){m(),q()},abrir:eo,fechar:()=>H(!1)}}function Ft(e,o,t,r="spro-campo"){let a=[["",o?`Lembrete em ${o.em.split("-").reverse().join("/")}`:"Sem lembrete"],["1","Lembrar amanh\xE3"],["7","Lembrar em 1 semana"],["30","Lembrar em 1 m\xEAs"],...o?[["0","Tirar o lembrete"]]:[]],i=f("select",{class:r,"aria-label":"Lembrete"},...a.map(([n,s])=>f("option",{value:n},s)));return i.addEventListener("change",()=>{let n=i.value;n!==""&&t(n==="0"?void 0:{...o,em:mo(e,Number(n))})}),i}function _t(e,o,t){let r=o,a=n=>Ao(mo(e,n)),i=bo({rotulo:"Lembrete",icone:"sino",vazio:"Sem lembrete",busca:!1,larguraLista:240,opcoes:()=>[...r?[{valor:"atual",rotulo:`Lembrete em ${Ao(r.em)}`,icone:"sino"}]:[],{valor:"1",rotulo:"Amanh\xE3",descricao:a(1),icone:"calendario"},{valor:"7",rotulo:"Em 1 semana",descricao:a(7),icone:"calendario"},{valor:"30",rotulo:"Em 1 m\xEAs",descricao:a(30),icone:"calendario"},...r?[{valor:"0",rotulo:"Tirar o lembrete",icone:"fechar"}]:[]],valor:r?["atual"]:[],aoMudar:n=>{let s=n[0];!s||s==="atual"||(r=s==="0"?void 0:{...r,em:mo(e,Number(s))},i.definir(r?["atual"]:[]),t(r))}});return i.el}var Aa=`:host{all:initial}
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
textarea.spro-campo{resize:vertical;width:100%}`;function wa(e){let o=e.favorito,t=[...e.etiquetas],r=async d=>{o=await e.editar(d)},a=(d,m)=>f("button",{type:"button","aria-pressed":String(e.lista===m),title:m==="pessoal"?"Mover para a sua lista Pessoal":`Mover para a lista da ${d}`,onclick:()=>{e.lista!==m&&e.moverPara(m)}},d),i=e.siglaUnidade?f("div",{class:"spro-segmentado fav-balao-listas",role:"group","aria-label":"Lista"},a(e.siglaUnidade,"unidade"),a("Pessoal","pessoal")):null,n=[...e.pastas],s=bo({rotulo:"Pasta",icone:"pasta",vazio:"(sem pasta)",busca:!0,opcoes:()=>[{valor:"",rotulo:"(sem pasta)"},...n.map(d=>({valor:d.id,rotulo:d.nome,cor:d.cor}))],valor:o.pasta?[o.pasta]:[],criar:async d=>{let m=await e.criarPasta(d.slice(0,60));return n=[...n.filter(v=>v.id!==m.id),m],{valor:m.id,rotulo:m.nome,cor:m.cor}},rotuloCriar:d=>`Criar a pasta \u201C${d}\u201D`,aoMudar:d=>void r({pasta:d[0]||void 0}),larguraLista:260}),c=f("div",{class:"fav-chips-sel"}),l=bo({rotulo:"Etiquetas",icone:"etiqueta",vazio:"Nenhuma",multiplo:!0,opcoes:()=>t.map(d=>({valor:d.id,rotulo:d.nome,cor:d.cor})),valor:o.etiquetas.filter(d=>t.some(m=>m.id===d)),criar:async d=>{let m=await e.criarEtiqueta(d.slice(0,40));return t=[...t.filter(v=>v.id!==m.id),m],{valor:m.id,rotulo:m.nome,cor:m.cor}},rotuloCriar:d=>`Criar a etiqueta \u201C${d}\u201D`,aoMudar:d=>{u();let m=o.etiquetas.filter(v=>!t.some(x=>x.id===v));r({etiquetas:[...d,...m]})},larguraLista:260}),u=()=>c.replaceChildren(...l.valor().map(d=>{let m=t.find(v=>v.id===d);return f("button",{type:"button",class:"spro-chip",style:`--cor:${m?.cor??"#ccc"}`,title:"Tirar esta etiqueta","aria-label":`Tirar a etiqueta ${m?.nome??""}`,onclick:()=>l.definir(l.valor().filter(v=>v!==d),!0)},m?.nome??"",M("fechar",11))}));u();let p=f("textarea",{class:"spro-campo",rows:"2",maxlength:String(2e3),placeholder:"Nota pessoal","aria-label":"Nota",value:o.nota??""});return p.addEventListener("change",()=>void r({nota:p.value})),f("div",{class:"fav-balao",role:"dialog","aria-label":`Favorito ${o.protocolo}`},f("div",{class:"fav-balao-topo"},f("span",{class:"fav-balao-estrela"},M("estrelaCheia",16)),f("span",{class:"fav-balao-titulo"},f("strong",{},"Favoritado"),f("span",{},o.protocolo)),i,f("button",{type:"button",class:"spro-botao-icone pequeno","aria-label":"Fechar",onclick:()=>e.fechar()},M("fechar",14))),f("div",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Pasta"),s.el),f("div",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Etiquetas"),l.el,c),f("label",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Nota"),p),e.hoje?f("div",{class:"fav-campo"},f("span",{class:"fav-rotulo"},"Lembrete"),_t(e.hoje,o.lembrete,d=>void r({lembrete:d}))):null,f("div",{class:"fav-balao-rodape"},f("button",{type:"button",class:"spro-botao primario",onclick:()=>e.fechar()},M("check",14),"Pronto")))}var zo=null;function Ht(e,o,t){zo?.();let r=e.ownerDocument,a=r.defaultView,i=r.createElement("div");i.setAttribute("data-tema",o.temaEscuro?"escuro":"claro");let n=i.attachShadow({mode:"open"}),s=r.createElement("style");s.textContent=`${t}
${Aa}`;let c=v=>{v.composedPath().includes(i)||u()},l=v=>{v.key==="Escape"&&!n.querySelector(".spro-combo-pop")&&u()};function u(){i.remove(),r.removeEventListener("pointerdown",c,!0),r.removeEventListener("keydown",l,!0),zo===u&&(zo=null)}let p=wa({...o,fechar:u});n.append(s,p);let d=e.getBoundingClientRect(),m=Math.max(8,Math.min(d.left,(a?.innerWidth??1024)-340))+(a?.scrollX??0);return i.style.cssText=`position:absolute;z-index:2147483000;left:${Math.round(m)}px;top:${Math.round(d.bottom+(a?.scrollY??0)+4)}px`,r.body.append(i),r.addEventListener("pointerdown",c,!0),r.addEventListener("keydown",l,!0),p.querySelector(".spro-combo")?.focus(),zo=u,u}function $t(e,o){let t=e.querySelector("#divBotoesControleProcessos, #divComandos");if(!t||t.querySelector(".spro-fav-botao"))return null;let r=f("a",{href:"#",role:"button",class:"botaoSEI spro-fav-botao",title:"Favoritos","aria-label":"Favoritos",tabindex:"452",style:"cursor: pointer;"},f("img",{class:"infraCorBarraSistema",src:o.url("icons/menu/favoritos.svg"),alt:"Favoritos",title:"Favoritos"}));return r.addEventListener("click",a=>{a.preventDefault(),o.destino()==="lateral"?o.abrirLateral():o.rolarAtePainel()}),t.append(r),r}function Vt(e,o){let t=e.querySelector("#topmenu .spro-fav-estrela");if(!t||t.parentElement?.querySelector(".spro-fav-abrir"))return null;let r="Abrir a lista de favoritos no painel lateral",a=f("button",{type:"button",class:"spro-fav-abrir",title:r,"aria-label":r},M("painel",16));return a.addEventListener("click",i=>{i.preventDefault(),i.stopPropagation(),o.abrirLateral()}),t.after(a),a}function Ut(e,o,t){e({tipo:"abrirPainel",aba:"favoritos"}).catch(()=>o(t))}async function Bt(e,o){let t=0;for(let r of e){let[a,i,n]=await Promise.all([r.ativos(),r.atuais(),r.vistos()]);t+=a.filter(s=>te(s,o)||st(n.get(s.id)??s.visto,i.get(s.id)).length>0).length}return t}function jt(e,o){e.querySelector(".spro-fav-contador")?.remove(),e.title=o?`Favoritos: ${o} ${o===1?"favorito pede":"favoritos pedem"} aten\xE7\xE3o (lembrete ou novidade)`:"Favoritos",o&&e.append(f("span",{class:"spro-fav-contador","aria-hidden":"true"},String(o)))}function F(e,o=e.location?.href??"https://sei.invalido/sei/controlador.php"){return{url:o,status:200,get html(){return e.documentElement.outerHTML},doc:e}}function Gt(){try{return window.top?.document??document}catch{return document}}function Xt(e,o,t){let r=Zo(F(e,t));return r.usuario.login?{host:r.host,login:r.usuario.login.toLowerCase(),nome:r.usuario.nome,unidade:r.unidade.id?{id:r.unidade.id,sigla:r.unidade.sigla,nome:r.unidade.nome}:null,versao:r.versao,temaEscuro:o}:null}function Kt(e){try{return!!e.getItem("darkModePro")}catch{return!1}}function Wt(e){let o=e.defaultView;for(let t of[".infraCorBarraSistema","#divInfraBarraSistema","#divInfraBarraSistemaE"]){let r=e.querySelector(t);if(r)try{let a=nt(o?.getComputedStyle?.(r).backgroundColor??"");if(a)return a}catch{}}}async function Zt(e,o,t){let r=await e.unidade?.contem(o.id)?e.unidade:await e.pessoal.contem(o.id)?e.pessoal:null;r||(r=e.unidade??e.pessoal,await r.adicionar(o));let i=(await r.obter(o.id))?.documentos??[];if(i.some(s=>s.id===t.id))return await r.editar(o.id,{documentos:i.filter(s=>s.id!==t.id)}),!1;let n={id:t.id,numero:t.numero,titulo:t.titulo,criadoEm:Date.now()};return await r.editar(o.id,{documentos:[...i,n]}),!0}function Jt(e,o){let t=o?"Tirar dos documentos favoritos":"Guardar este documento nos favoritos";e.setAttribute("aria-pressed",String(o)),e.setAttribute("aria-label",t),e.title=t,e.replaceChildren(M(o?"estrelaCheia":"estrela",13))}function Yt(e,o,t){let r=new Map(o.map(l=>[l.id,l])),a=()=>{for(let l of o){let u=e.getElementById(`anchor${l.id}`);if(!u||u.nextElementSibling?.classList.contains("spro-fav-doc"))continue;let p=f("button",{type:"button",class:"spro-fav-doc","data-doc":l.id});Jt(p,t.marcado(l.id)),u.after(p)}},i=()=>{for(let l of e.querySelectorAll(".spro-fav-doc"))Jt(l,t.marcado(l.dataset.doc??""))};e.addEventListener("click",l=>{let u=l.target?.closest?.(".spro-fav-doc");if(!u)return;l.preventDefault(),l.stopPropagation();let p=r.get(u.dataset.doc??"");!p||u.getAttribute("aria-busy")==="true"||(u.setAttribute("aria-busy","true"),t.alternar(p).catch(d=>console.warn("[SEI Pro] favoritos: documento",d)).finally(()=>{u.removeAttribute("aria-busy"),i()}))}),a();let n=e.querySelector("#divArvore")??e.body,s,c=typeof MutationObserver=="function"?new MutationObserver(()=>{clearTimeout(s),s=setTimeout(a,150)}):null;return c?.observe(n,{childList:!0,subtree:!0}),{parar:()=>{c?.disconnect(),clearTimeout(s)},repintar:i}}var Qt=/^\d{4}-\d{2}-\d{2}$/;function or(e){if(e.modo==="nenhum"||!Qt.test(e.referencia))return;if(e.modo==="proximo"){let t=(e.tipos??"").split(",").map(a=>a.trim()).filter(Boolean),r=Math.trunc(Math.abs(e.n));return!t.length||!Number.isFinite(r)||r===0?void 0:{referencia:{de:"novoDocumento",tipos:t,desde:e.referencia},vencimento:{em:"dias",n:r,contagem:e.contagem},exibicao:"ate"}}let o=e.documento&&e.modo!=="data"?{de:"documento",idDocumento:e.documento.id,data:e.referencia}:{de:"data",data:e.referencia};if(e.modo==="data")return Qt.test(e.vencimento)?{referencia:o,vencimento:{em:"data",data:e.vencimento},exibicao:"ate"}:void 0;if(e.modo==="dias"){let t=Math.trunc(Math.abs(e.n));return!Number.isFinite(t)||t===0?void 0:{referencia:o,vencimento:{em:"dias",n:e.sentido==="antes"?-t:t,contagem:e.contagem},exibicao:"ate"}}return{referencia:o,exibicao:e.contagem==="uteis"?"desdeUteis":"desde"}}var er='#frmAtividadeListar[action*="acao=procedimento_enviar"]';function Ea(e){return[...e.querySelectorAll(`${er} #selProcedimentos option`)].map(o=>{let t=(o.textContent??"").trim(),r=t.indexOf(" - "),a=(r>=0?t.slice(0,r):t).trim(),i=r>=0?t.slice(r+3).trim():"";return{id:o.value.trim(),protocolo:a,especificacao:i||void 0}}).filter(o=>/^\d+$/.test(o.id)&&o.protocolo)}async function tr(e,o){let t=e.querySelector(er);if(!t||t.querySelector(".spro-fav-envio"))return null;let r=Ea(e);if(!r.length)return null;let a=r.length>1,i=f("input",{type:"checkbox",id:"chkSproManterFavoritos",style:"appearance:auto;opacity:1;position:static;width:auto;height:auto;margin:0"});i.checked=r.every(m=>o.ativo(m.id));let n=f("select",{class:"infraSelect",style:"width:auto;min-width:12em"}),s=f("input",{type:"date",class:"infraText",style:"width:auto"}),c=f("div",{class:"spro-fav-envio-opcoes",style:"display:flex;flex-wrap:wrap;gap:12px;align-items:center;margin:6px 0 0 22px"},f("label",{style:"display:inline-flex;gap:6px;align-items:center"},"Pasta:",n),f("label",{style:"display:inline-flex;gap:6px;align-items:center"},"Prazo at\xE9:",s),Ft(o.hoje(),void 0,m=>u({lembrete:m}),"infraSelect"));c.hidden=!i.checked;let l=async()=>{let[m,v]=await Promise.all([o.pastas(),o.obter(r[0].id)]);if(n.replaceChildren(f("option",{value:""},"(sem pasta)"),...m.map(x=>f("option",{value:x.id},x.nome))),!a&&v&&v.removidoEm===void 0){for(let x of n.options)x.selected=x.value===(v.pasta??"");s.value=v.prazo?.vencimento?.em==="data"?v.prazo.vencimento.data:""}};await l(),i.addEventListener("change",()=>{c.hidden=!i.checked,(async()=>{if(i.checked){for(let m of r)o.ativo(m.id)||await o.adicionar(m);await l()}else await o.remover(r.map(m=>m.id))})().catch(m=>console.warn("[SEI Pro] favoritos: n\xE3o foi poss\xEDvel gravar no envio",m))});let u=m=>void Promise.all(r.map(v=>o.editar(v.id,m))).catch(v=>console.warn("[SEI Pro] favoritos: n\xE3o foi poss\xEDvel gravar no envio",v));n.addEventListener("change",()=>u({pasta:n.value||void 0})),s.addEventListener("change",()=>{let m=s.value?or({modo:"data",referencia:o.hoje(),vencimento:s.value,n:0,contagem:"corridos",sentido:"depois"}):void 0;u({prazo:m})});let p=a?`Manter os ${r.length} processos em Favoritos`:"Manter processo em Favoritos",d=f("div",{class:"infraAreaDados spro-fav-envio",style:"position:relative;clear:both;height:auto;margin:10px 0;padding:0"},f("label",{for:"chkSproManterFavoritos",style:"display:inline-flex;gap:6px;align-items:center;cursor:pointer"},i,p),c);return t.append(d),d}var rr="spro-fav-estilo",Pa=`.spro-fav-estrela{background:none;border:0;padding:0 3px;margin:0 2px;cursor:pointer;color:#8a8a8a;vertical-align:middle;line-height:0}
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
#topmenu .spro-fav-estrela,#topmenu .spro-fav-abrir{display:inline-block;width:27px;height:24px;padding:0;margin:0;line-height:0;vertical-align:baseline}
#topmenu .spro-fav-estrela svg,#topmenu .spro-fav-abrir svg{display:block;width:20px;height:20px;margin:2px auto}
.spro-fav-botao{position:relative}
.spro-fav-contador{position:absolute;top:-4px;right:-6px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#d93025;color:#fff;font:600 10px/16px sans-serif;text-align:center;box-sizing:border-box}
.spro-fav-titulo{display:flex!important;align-items:center;gap:8px}
.spro-fav-recolher{margin-left:4px;background:none;border:0;cursor:pointer;color:inherit;line-height:0;padding:2px;border-radius:4px}
.spro-fav-recolher:hover{background:rgb(127 127 127 / 14%)}
.spro-fav-recolher:focus-visible{outline:2px solid #1a73e8;outline-offset:1px}
@keyframes spro-fav-aviso{from{opacity:0;transform:translate(-50%,10px)}}
@media (prefers-reduced-motion:reduce){.spro-fav-aviso{animation:none!important}}`;function _(e){if(e.getElementById(rr))return;let o=e.createElement("style");o.id=rr,o.textContent=Pa,(e.head??e.documentElement).append(o)}var ar=new WeakMap;function Y(e,o,t){let r=ar.get(e);if(r){r.push(t);return}let a=[t];ar.set(e,a),e.addEventListener("click",i=>{let n=i.target?.closest?.(".spro-fav-estrela");if(n&&(i.preventDefault(),i.stopPropagation(),n.getAttribute("aria-busy")!=="true"))for(let s of a){let c=s(n);if(c){Sa(o,c,n);return}}},!0)}async function Sa(e,o,t){t.setAttribute("aria-busy","true");try{await e.alternar(o,t),t.removeAttribute("data-erro")}catch(r){console.warn("[SEI Pro] favoritos: n\xE3o foi poss\xEDvel gravar",r);let a="N\xE3o foi poss\xEDvel gravar o favorito. Tente de novo.";t.setAttribute("data-erro","1"),t.setAttribute("aria-label",a),t.title=a,e.carregar().catch(()=>{})}finally{t.removeAttribute("aria-busy")}}function ir(e,o,t=200){let r=Date.now();return new Promise(a=>{let i=()=>{let n=e();if(n)return a(n);if(Date.now()-r>=o)return a(null);setTimeout(i,t)};i()})}function Q(e){let o=f("button",{type:"button",class:"spro-fav-estrela"});return K(o,e),o}function K(e,o){if(e.getAttribute("aria-pressed")===String(o)&&e.firstChild)return;let t=o?"Remover dos favoritos":"Adicionar aos favoritos";e.setAttribute("aria-pressed",String(o)),e.setAttribute("aria-label",t),e.title=t,e.replaceChildren(M(o?"estrelaCheia":"estrela",16))}var Ca='#topmenu a[target="ifrVisualizacao"], #topmenu a[target="ifrConteudoVisualizacao"]';function Ma(e,o){try{let t=G(F(e,o));return{id:t.idProcedimento,protocolo:t.protocolo,tipo:t.tipo||void 0,sigiloso:t.nivel==="sigiloso"}}catch{return null}}async function nr(e,o,t){let r=Ma(e,t);if(!r)return!1;let a=await ir(()=>e.querySelector(Ca),1e4);if(!a||a.parentElement?.querySelector(".spro-fav-estrela"))return!1;_(e),Y(e,o,n=>n.closest("#topmenu")?r:null);let i=Q(o.ativo(r.id));return a.after(i),o.aoMudar(()=>K(i,o.ativo(r.id))),!0}var sr="tr[id^='P']";function cr(e){let o=Wo(e,e.closest("#tblProcessosGerados")?"gerados":"recebidos");return o?.idProcedimento?{id:o.idProcedimento,protocolo:o.protocolo,tipo:o.tipo||void 0,especificacao:o.especificacao||void 0,sigiloso:o.sigiloso}:null}function lr(e,o){_(e),Y(e,o,s=>{let c=s.closest(sr);return c?cr(c):null});let t=()=>{for(let s of e.querySelectorAll(sr)){let c=s.querySelector(".spro-fav-estrela");if(c){K(c,o.ativo(s.id.slice(1)));continue}let l=cr(s),u=s.querySelectorAll("td")[1];!l||!u||u.prepend(Q(o.ativo(l.id)))}},r=!1,a=typeof MutationObserver=="function"?new MutationObserver(()=>{r||(r=!0,setTimeout(()=>{r=!1,t()},50))}):null,i=e.querySelector("#frmProcedimentoControlar")??e.body;a&&i&&a.observe(i,{childList:!0,subtree:!0});let n=o.aoMudar(t);return t(),{atualizar:t,desligar(){a?.disconnect(),n()}}}var dr="#frmRelBlocoProtocoloLista .infraTable, #frmAcompanhamentoLista .infraTable, #frmProcedimentoSobrestar .infraTable";function ur(e){let o=e.querySelectorAll("td")[2]?.querySelector("a[href*='acao=procedimento_trabalhar']");if(!o)return null;let t=N(o.getAttribute("href")??"").get("id_procedimento"),r=E(o);return!t||!r?null:{id:t,protocolo:r,sigiloso:/Sigiloso/i.test(o.getAttribute("class")??"")}}function pr(e,o){_(e),Y(e,o,a=>{let i=a.closest("tr");return i?.closest(dr)?ur(i):null});let t=()=>{for(let a of e.querySelectorAll(dr))for(let i of a.querySelectorAll("tr")){let n=ur(i),s=i.querySelectorAll("td")[2];if(!n||!s)continue;let c=s.querySelector(".spro-fav-estrela");c?K(c,o.ativo(n.id)):s.prepend(Q(o.ativo(n.id)))}},r=o.aoMudar(t);return t(),{atualizar:t,desligar:r}}var mr="table.pesquisaResultado tr.pesquisaTituloRegistro";function fr(e){let o=e.querySelector("a.protocoloNormal[href*='acao=procedimento_trabalhar']");if(!o)return null;let t=N((o.getAttribute("href")??"").replace(/&amp;/g,"&")).get("id_procedimento"),r=E(o);return!t||!r?null:{id:t,protocolo:r,tipo:o.getAttribute("title")?.trim()||void 0,sigiloAConfirmar:!0}}function gr(e,o){_(e),Y(e,o,r=>{let a=r.closest("tr");return a?.matches(mr)?fr(a):null});let t=()=>{for(let r of e.querySelectorAll(mr)){let a=fr(r),i=r.querySelector("a.protocoloNormal[href*='acao=procedimento_trabalhar']");if(!a||!i)continue;let n=r.querySelector(".spro-fav-estrela");n?K(n,o.ativo(a.id)):i.after(Q(o.ativo(a.id)))}};o.aoMudar(t),t()}function Ta(e,o){let t=o.replace(/\D/g,""),r=t?e.querySelector(`tr[id="P${t}"] a[href*="procedimento_trabalhar"]`):null;if(r)return{tipo:"linha",link:r};let a=e.querySelector("#frmProtocoloPesquisaRapida"),i=e.querySelector("#txtPesquisaRapida");return a&&i?{tipo:"pesquisa",form:a,campo:i}:null}function vr(e,o,t,r){let a=Ta(e,o);if(!a)throw new L("SEM_PESQUISA","Esta tela do SEI n\xE3o tem a pesquisa r\xE1pida para abrir o processo.");if(a.tipo==="linha")return r?e.defaultView?.open(a.link.href,"_blank","noopener"):a.link.click(),"linha";let i=a.form.getAttribute("target");a.campo.value=t,r&&a.form.setAttribute("target","_blank");try{typeof a.form.requestSubmit=="function"?a.form.requestSubmit():a.form.submit()}finally{i===null?a.form.removeAttribute("target"):a.form.setAttribute("target",i)}return"pesquisa"}var Da=/(\d{2})\/(\d{2})\/(\d{4})/;function ie(e){let o=[];for(let t of e.querySelectorAll("#tblDocumentos tr")){let r=t.querySelector('a[href*="id_documento="]');if(!r)continue;let a=/id_documento=(\d+)/.exec((r.getAttribute("href")??"").replace(/&amp;/g,"&"))?.[1],i=[...t.querySelectorAll("td")],n=i.findIndex(l=>l.contains(r)),s=(i[n+1]?.textContent??"").trim(),c=i.slice(n+2).map(l=>Da.exec(l.textContent??"")).find(Boolean);!a||!c||o.push({id:a,numero:(r.textContent??"").trim(),nome:s,data:`${c[3]}-${c[2]}-${c[1]}`})}return o}async function hr(e,o){let t="arvore-aberta",r=o.arvoreAberta(e.id);if(!r){if(!e.buscar)throw new L("PRECISA_BUSCAR","Para listar os documentos, o SEI Pro precisa abrir a \xE1rvore deste processo. Se ele estiver aberto na sua unidade, o SEI pode registrar o andamento \u201CProcesso recebido\u201D em seu nome, ou marc\xE1-lo como visualizado, como se voc\xEA o abrisse.");t="busca",r=await o.arvoreBuscada(e.protocolo)}if(!r.acaoGerarPdf)throw new L("SEM_LISTA_DOCUMENTOS","O SEI n\xE3o oferece a lista de documentos deste processo para voc\xEA (falta \u201CGerar Arquivo PDF do Processo\u201D).");return{documentos:ie(await o.obter(r.acaoGerarPdf)),origem:t}}function ne(e){return{contexto:()=>e.ctx,altura:o=>{let t=Number(o?.px);return e.sobreposicao?e.sobreposicao.altura(t):e.iframe&&Number.isFinite(t)&&(e.iframe.style.height=`${Math.max(80,Math.min(Math.round(t),2e4))}px`),!0},sobrepor:o=>e.sobreposicao?e.sobreposicao.ligar(o?.ativo===!0):!1,aviso:o=>{let t=o??{};if(!e.avisar)return!1;let r=Number(t.ms);return e.avisar(String(t.texto??"").slice(0,400),t.acao?String(t.acao).slice(0,40):void 0,Number.isFinite(r)?r:7e3)},abrirProcesso:o=>{let t=o??{};return vr(e.doc,String(t.id??""),String(t.protocolo??""),t.novaAba===!0)},lerLegado:async()=>({local:Ne(e.armazenamento),arquivo:e.lerArquivo?await e.lerArquivo():null}),atualizarForaDaUnidade:()=>{if(!e.atualizar)throw new L("SEM_ATUALIZAR","Abra uma tela do SEI para atualizar.");return e.atualizar.iniciar()},cancelarAtualizacao:()=>e.atualizar?.cancelar()??!1,sincronizarAgora:()=>{if(!e.sincronia)throw new L("SEM_SINCRONIA","A sincronia pelo Texto Padr\xE3o s\xF3 funciona numa tela do SEI com unidade.");return e.sincronia.agora()},apagarDoSei:()=>{if(!e.sincronia)throw new L("SEM_SINCRONIA","A sincronia pelo Texto Padr\xE3o s\xF3 funciona numa tela do SEI com unidade.");return e.sincronia.apagar()},documentosAssinados:o=>{let t=o??{};return hr({id:String(t.id??""),protocolo:String(t.protocolo??""),buscar:t.buscar===!0},La(e.doc))}}}function La(e){let o=null,t=()=>(o??=new ro(e.location?.href??location.href,()=>F(e)),o);return{arvoreAberta(r){try{let a=e.querySelector("#ifrArvore")?.contentDocument;if(!a?.querySelector("#divArvore"))return null;let i=G(F(a,a.location.href));return i.idProcedimento===r?{acaoGerarPdf:to(i,"procedimento_gerar_pdf")}:null}catch{return null}},async arvoreBuscada(r){let a=await t().arvore(r);return{acaoGerarPdf:to(a,"procedimento_gerar_pdf")}},async obter(r){return(await t().http.obter(r)).doc}}}function No(e){let o=i=>e.querySelector(i)?.getAttribute("value")?.trim()??"",t=o("#hdnTipoVisualizacao");if(t&&t!=="R")return"visualiza\xE7\xE3o detalhada (use a resumida)";let r=o("#hdnMeusProcessos");if(r&&r!=="T")return"s\xF3 os processos atribu\xEDdos a voc\xEA";for(let[i,n]of[["hdnIdMarcador","filtro por marcador"],["hdnIdTipoProcedimento","filtro por tipo de processo"],["hdnIdTipoPrioridade","filtro por prioridade"]])if([...e.querySelectorAll(`input[id^="${i}"]`)].some(s=>(s.getAttribute("value")??"").trim()))return n;let a=[...e.querySelectorAll(".caixaFiltroControle")].map(i=>(i.textContent??"").trim()).filter(Boolean);if(a.length)return`filtro ativo: ${a.join(", ")}`;if(e.querySelector("#btnLiberarMarcador"))return"filtro por marcador";if(e.querySelector("#tblMarcadores"))return"caixa agrupada por marcadores";for(let i of["#tblProcessosRecebidos","#tblProcessosGerados"]){let n=e.querySelector(`${i} caption b`);if(n)return`filtro do painel: ${(n.textContent??"").trim()}`}return e.querySelector("#divFiltro")&&!e.querySelector("#lnkAtribuidosMim, #divFiltroMeusProcessos")?"filtro do painel de controle":null}function se(e){if(typeof e=="number"&&e)return String(e);let o=e?.id;return typeof o=="string"&&o?o:null}function br(e,o,t){let r=se(e);return r?!o||!t.has(r):!1}function xr(e){let o=null,t=!1,r=new Set,a=()=>{o?.aberta&&o.chamar("ola",e.estado(),5e3).catch(()=>{})},i=c=>{if(t||!br(c,!!o?.aberta,r))return;o?.fechar();let l;try{l=wo(e.conectar(),e.tratadores)}catch{o=null;return}o=l,l.aoFechar(()=>{o===l&&(o=null)});let u=se(c);u&&r.add(u),a()},n=()=>{t||e.area.obter(fo).then(c=>i(c[fo])).catch(()=>{})},s=e.area.aoMudar(c=>{fo in c&&i(c[fo]?.novo)});return n(),{apresentar:a,verificar:n,parar(){t=!0,s(),o?.fechar(),o=null}}}var Ia="data-seipro-favoritos";function yr(e){e.documentElement?.setAttribute(Ia,"1")}function Oa(e){if(!e.querySelector("#divRecebidos")||!e.querySelector("#divGerados"))return!1;for(let o of["#tblProcessosRecebidos","#tblProcessosGerados"]){let t=e.querySelector(o);if(!t)continue;let r=Number(/\((\d+)\s+registro/.exec(t.querySelector("caption")?.textContent??"")?.[1]??Number.NaN);if(!Number.isFinite(r)||r>t.querySelectorAll("tr[id^='P']").length)return!1}return!0}var ka=(e,o)=>!!e&&e.abertoNaUnidade===o.abertoNaUnidade&&e.naoVisualizado===o.naoVisualizado&&e.documentoNovo===o.documentoNovo&&e.atribuido===o.atribuido&&JSON.stringify(e.marcadores??[])===JSON.stringify(o.marcadores??[]);async function Ar(e,o,t=Date.now()){if(o.escopo.lista!=="unidade")return 0;let r=new Map(Se(F(e)).map(u=>[u.idProcedimento,u])),a=Oa(e)&&!No(e),[i,n,s]=await Promise.all([o.ativos(),o.atuais(),o.vistos()]),c=[],l=[];for(let u of i){let p=r.get(u.id);p&&(u.sigiloAConfirmar||!!u.sigiloso!==p.sigiloso)&&await o.editar(u.id,p.sigiloso?{sigiloso:!0,especificacao:void 0,sigiloAConfirmar:void 0}:{sigiloso:void 0,sigiloAConfirmar:void 0});let d=n.get(u.id),m;if(p)m={...d,quando:t,fonte:"caixa",abertoNaUnidade:!0,naoVisualizado:p.novo,documentoNovo:p.documentoNovo,atribuido:p.atribuido||void 0,marcadores:p.sinais.filter(v=>/marcador/i.test(v)),recebidoNaLeitura:void 0};else if(a)m={...d,quando:t,fonte:"caixa",abertoNaUnidade:!1,naoVisualizado:void 0,documentoNovo:void 0,recebidoNaLeitura:void 0};else continue;ka(d,m)||c.push([u.id,m]),!s.has(u.id)&&!u.visto&&l.push([u.id,m])}c.length&&await o.gravarAtuais(c);for(let[u,p]of l)await o.gravarVisto(u,p);return c.length}async function wr(e,o,t,r,a=Date.now()){let i;try{i=G(F(e,o))}catch{return 0}if(!i.idProcedimento)return 0;let n=[];for(let d of t)await d.contem(i.idProcedimento)&&n.push(d);if(!n.length)return 0;let s=i.nivel==="sigiloso";for(let d of n){let m=await d.obter(i.idProcedimento);m&&(m.sigiloAConfirmar||!!m.sigiloso!==s)&&await d.editar(i.idProcedimento,s?{sigiloso:!0,especificacao:void 0,sigiloAConfirmar:void 0}:{sigiloso:void 0,sigiloAConfirmar:void 0})}if(s)return 0;let c=j(i.links,"procedimento_consultar_historico")??/consultarAndamento\('([^']+)'/.exec(e.querySelector("#divConsultarAndamento a")?.getAttribute("onclick")??"")?.[1]?.replace(/&amp;/g,"&")??null,l;if(c)try{let d=So(await r(c))[0];d&&(l={data:d.data,unidade:d.unidade,descricao:d.descricao})}catch{}let u=[];for(let d of n){let m=await d.obter(i.idProcedimento);m?.prazo?.referencia.de==="novoDocumento"&&u.push({r:d,prazo:m.prazo})}let p=u.length?j(i.links,"procedimento_gerar_pdf"):null;if(p)try{let d=ie((await r(p)).doc);for(let{r:m,prazo:v}of u){let x=qa(v,d);x&&await m.editar(i.idProcedimento,{prazo:x})}}catch{}for(let d of n){let m=(await d.atuais()).get(i.idProcedimento),v={...m,quando:a,fonte:"arvore",qtdDocumentos:i.documentos.length,ultimoAndamento:l??m?.ultimoAndamento,recebidoNaLeitura:void 0};await d.gravarAtual(i.idProcedimento,v),await d.marcarVisto([i.idProcedimento])}return n.length}function qa(e,o){if(e.referencia.de!=="novoDocumento")return null;let{tipos:t,desde:r}=e.referencia,a=t.map(n=>D(n)).filter(Boolean),i=[...o].filter(n=>n.data>=r&&a.some(s=>D(n.nome).startsWith(s))).sort((n,s)=>n.data<s.data?-1:n.data>s.data?1:0)[0];return i?{...e,referencia:{de:"documento",idDocumento:i.id,data:i.data}}:null}var za="position:fixed;inset:0;left:0;top:0;width:100vw;height:100vh;max-width:none;max-height:none;margin:0;z-index:2147483646;background:transparent;";function Er(e,o,t){let r=null,a=null,i=l=>{o.style.height=`${Math.max(80,Math.min(Math.round(l),2e4))}px`},n=()=>{let l=[e.documentElement];e.body&&l.push(e.body);let u=e.defaultView;for(let p=o.parentElement;p&&p!==e.body&&p!==e.documentElement;p=p.parentElement)try{let d=u?.getComputedStyle?.(p).overflowY??"";(d==="auto"||d==="scroll")&&p.scrollHeight>p.clientHeight&&l.push(p)}catch{}return l},s=()=>!o.isConnected||t.hidden||t.closest?.("[hidden]")?!1:typeof o.getClientRects!="function"||o.getClientRects().length>0,c={ligar(l){if(l&&!r&&!s())return!1;if(l&&!r){let u=o.getBoundingClientRect?.().height||Number.parseFloat(o.style.height)||0,p=n().map(d=>[d,d.style.overflow]);r={iframe:o.getAttribute("style")??"",reserva:t.style.minHeight,travados:p},u&&(t.style.minHeight=`${Math.round(u)}px`),o.setAttribute("style",`${r.iframe};${za}`);for(let[d]of p)d.style.overflow="hidden"}else if(!l&&r){o.setAttribute("style",r.iframe),t.style.minHeight=r.reserva;for(let[u,p]of r.travados)u.style.overflow=p;r=null,a!==null&&i(a),a=null}return!0},altura(l){Number.isFinite(l)&&(r?a=l:i(l))}};return o.addEventListener("load",()=>c.ligar(!1)),c}function Pr(e){try{let o=JSON.parse(e.getItem("optionsPro")??"{}");if(!Array.isArray(o.orderPanelHome))return null;let t=o.orderPanelHome.find(a=>a?.name==="favoritesPro"),r=Number(t?.index);return t&&Number.isFinite(r)?r:null}catch{return null}}function Na(e,o,t){if(t!==null)for(let r of[...e.children]){if(!r.classList.contains("panelHomePro"))continue;let a=Number.parseInt(r.getAttribute("data-order")??"",10);if(Number.isFinite(a)&&a>t){r.before(o);return}}e.append(o)}function Ra(e,o){let t=e.querySelector("#divInfraBarraLocalizacao"),r=e.defaultView;if(!(!t||!r?.getComputedStyle))try{let a=r.getComputedStyle(t);a.fontSize&&(o.style.fontSize=a.fontSize),a.fontWeight&&(o.style.fontWeight=a.fontWeight),a.fontFamily&&(o.style.fontFamily=a.fontFamily)}catch{}}function Sr(e,o){let t=e.querySelector("#frmProcedimentoControlar");if(!t||e.querySelector("#tblMarcadores")||e.querySelector("#favoritesPro"))return null;_(e);let r=e.querySelector("#panelHomePro");r||(r=f("div",{id:"panelHomePro",style:"display: inline-block; width: 100%;"}),t.after(r));let a=f("iframe",{src:o.urlApp,title:"Favoritos do SEI Pro",allow:"clipboard-write",style:`width: 100%; height: 120px; border: 0; display: block; color-scheme: ${o.temaEscuro?"dark":"light"};`}),i=f("div",{class:"spro-fav-corpo",hidden:o.recolhido},a),n=f("button",{type:"button",class:"spro-fav-recolher"}),s=()=>{let d=i.hidden,m=d?"Mostrar favoritos":"Recolher favoritos";n.setAttribute("aria-expanded",String(!d)),n.setAttribute("aria-label",m),n.title=m,n.replaceChildren(M(d?"expandir":"recolher",18))};n.addEventListener("click",()=>{i.hidden=!i.hidden,s(),o.aoRecolher(i.hidden)}),s();let c=M("estrelaCheia",20);c.setAttribute("style","color:#e0a100");let l=f("div",{class:"infraBarraLocalizacao titlePanelHome spro-fav-titulo"},c,"Favoritos",n);Ra(e,l);let u=f("div",{class:"panelHomePro",id:"favoritesPro","data-order":o.ordem===null?"":String(o.ordem),style:"display: inline-block; width: 100%;"},l,i);Na(r,u,o.ordem);let p=Er(e,a,i);return{painel:u,iframe:a,corpo:i,sobreposicao:p,fechar:()=>{p.ligar(!1),u.remove()}}}var Ro=class{constructor(o){this.d=o;for(let t of[o.unidade,o.pessoal])t?.aoMudar(()=>this.agendarRecarga())}ids=new Set;ouvintes=new Set;agendado=!1;async carregar(){let o=await Promise.all([this.d.unidade?this.d.unidade.ativos():Promise.resolve([]),this.d.pessoal.ativos()]);this.ids=new Set(o.flat().map(t=>t.id)),this.avisar()}ativo(o){return this.ids.has(o)}aoMudar(o){return this.ouvintes.add(o),()=>this.ouvintes.delete(o)}async alternar(o,t){if(this.ids.has(o.id))return await Promise.all([this.d.unidade?.remover([o.id]),this.d.pessoal.remover([o.id])]),this.ids.delete(o.id),this.avisar(),!1;let r=this.d.unidade??this.d.pessoal,a=await r.adicionar(o);return this.ids.add(o.id),this.avisar(),this.d.aoAdicionar?.(a,r,t),!0}avisar(){for(let o of[...this.ouvintes])o()}agendarRecarga(){this.agendado||(this.agendado=!0,setTimeout(()=>{this.agendado=!1,this.carregar()},30))}};function Fo(e){if(Array.isArray(e))return`[${e.map(Fo).join(",")}]`;if(e&&typeof e=="object"){let o=e;return`{${Object.keys(o).sort().filter(t=>o[t]!==void 0).map(t=>`${JSON.stringify(t)}:${Fo(o[t])}`).join(",")}}`}return JSON.stringify(e)}var ce=e=>[...e].sort((o,t)=>o.id<t.id?-1:o.id>t.id?1:0);function le(e){let o=[...e.escopos].map(t=>({k:no(t.escopo),f:ce(t.favoritos),p:ce(t.pastas),e:ce(t.etiquetas)})).sort((t,r)=>t.k<r.k?-1:t.k>r.k?1:0);return`${ao(Fo(o))}${ao(Fo(o).split("").reverse().join(""))}`}var Fa=5*6e4,_a=864e5;function Ha(e){let o=e?.codigo;return o==="SEI_SESSAO_EXPIRADA"?{estado:"erro",mensagem:"Sess\xE3o do SEI expirada. Entre de novo no SEI."}:o==="SEI_ACAO_INDISPONIVEL"?{estado:"indisponivel",mensagem:"Indispon\xEDvel nesta unidade: o SEI n\xE3o oferece Textos Padr\xE3o para voc\xEA aqui."}:{estado:"erro",mensagem:e instanceof Error?e.message:String(e)}}var _o=class{constructor(o){this.d=o}espera;agora(){return this.d.agora?.()??Date.now()}async status(){return(await this.d.area.obter(this.d.chaveStatus))[this.d.chaveStatus]??{estado:"nunca",quando:0,pendente:!1}}async gravarStatus(o){let t={...await this.status(),...o};return await this.d.area.gravar({[this.d.chaveStatus]:t}),t}async marcarPendente(){(await this.status()).pendente||await this.gravarStatus({pendente:!0})}agendarEnvio(){return clearTimeout(this.espera),this.espera=setTimeout(()=>void this.sincronizar({forcar:!0}).catch(()=>{}),this.d.atrasoEnvio??15e3),this.marcarPendente()}parar(){clearTimeout(this.espera)}async sincronizar(o={}){let t=this.agora(),r=await this.status();if(!o.forcar&&(r.estado==="indisponivel"&&(r.indisponivelAte??0)>t||!r.pendente&&r.ultimoPuxar&&t-r.ultimoPuxar<Fa))return r;let a=`seipro-favoritos-sync|${this.d.chaveStatus}`;return await this.d.travar(a,()=>this.rodada(t))??await this.status()}async rodada(o){try{let t=await this.d.destino.ler(),r="",a=null,i=new Set;if(t!==null){let u=await Dt(t,this.d.escopo);if("maisNovo"in u)return this.gravarStatus({estado:"erro",quando:o,ultimoPuxar:o,mensagem:"Os favoritos no SEI foram gravados por uma vers\xE3o mais nova do SEI Pro. Atualize a extens\xE3o neste computador; o texto n\xE3o foi alterado."});"envelope"in u?(await this.d.repo.importar(u.envelope.escopos[0]),r=le(u.envelope),i=new Set(u.envelope.escopos[0].favoritos.map(p=>p.id))):a=u.invalido}let n=await Mt(this.d.repo,this.d.escopo,this.d.carimbo(),i);if(t!==null&&!a&&le(n)===r)return this.gravarStatus({estado:"ok",quando:o,ultimoOk:o,ultimoPuxar:o,pendente:!1,mensagem:void 0,tamanho:t.length});let s=await Tt(n,this.d.nomeUsuario),c=this.d.teto??Et;if(s.length>c)return this.gravarStatus({estado:"erro",quando:o,ultimoPuxar:o,tamanho:s.length,mensagem:`A lista ficou grande demais para o Texto Padr\xE3o (${Math.ceil(s.length/1024)} KB de ${Math.round(c/1024)} KB). Use a sincroniza\xE7\xE3o por arquivo.`});if(this.d.permitido&&!await this.d.permitido())return this.gravarStatus({estado:"nunca",quando:o,pendente:!1,mensagem:void 0});await this.d.destino.gravar(s);let l=s.length>(this.d.teto?c*.8:Pt)?`A lista est\xE1 perto do limite do Texto Padr\xE3o (${Math.ceil(s.length/1024)} KB).`:void 0;return this.gravarStatus({estado:"ok",quando:o,ultimoOk:o,ultimoPuxar:o,pendente:!1,tamanho:s.length,mensagem:a?`O texto no SEI estava inv\xE1lido (${a}) e foi regravado a partir deste computador.`:l})}catch(t){let r=Ha(t);return this.gravarStatus({estado:r.estado,mensagem:r.mensagem,quando:o,indisponivelAte:r.estado==="indisponivel"?o+_a:void 0})}}};var xo=e=>`favoritos/sync/tp/${no(e)}`;function Cr(e){let o=0;for(let t of e.querySelectorAll('select#selTextoPadrao option, select[name="selTextoPadrao"] option'))(t.textContent??"").trim().startsWith(ko)&&(t.remove(),o++);return o}var Ho=class{constructor(o){this.d=o}motor=null;pararMudancas=null;pararPrefs=null;estado(o){return Be(o,this.d.ctx.host,this.d.ctx.login,this.d.escopo.unidade?.id??"")}criarMotor(){let o=this.d.armazem();return new _o({repo:this.d.repo,escopo:this.d.escopo,destino:{ler:()=>o.ler(),gravar:t=>o.gravar(t)},area:this.d.area,chaveStatus:xo(this.d.escopo),carimbo:this.d.carimbo,nomeUsuario:this.d.ctx.nome||this.d.ctx.login,travar:this.d.travar,atrasoEnvio:this.d.atrasoEnvio,permitido:async()=>this.estado(await U(this.d.sync))==="ligado"})}rodar(o){return this.motor??=this.criarMotor(),this.motor.sincronizar({forcar:o})}ligar(o){this.pararMudancas||(this.motor??=this.criarMotor(),this.pararMudancas=this.d.repo.aoMudar(()=>void this.motor?.agendarEnvio()),o&&this.rodar(!1).catch(()=>{}))}desligar(){this.pararMudancas?.(),this.pararMudancas=null,this.motor?.parar()}async iniciar(o){if(this.estado(await U(this.d.sync))==="ligado"){let r=(await this.motor?.status())?.pendente??(await this.d.area.obter(xo(this.d.escopo)))[xo(this.d.escopo)]?.pendente;this.ligar(o==="caixa"||r===!0)}this.pararPrefs=this.d.sync.aoMudar(r=>{J in r&&U(this.d.sync).then(a=>{let i=this.estado(a);i==="ligado"&&!this.pararMudancas?(this.ligar(!1),this.rodar(!0).catch(()=>{})):i!=="ligado"&&this.desligar()})})}agora(){return this.rodar(!0)}async apagar(){this.desligar(),await je(this.d.sync,this.d.ctx.host,this.d.ctx.login,this.d.escopo.unidade?.id??"","desligado");let o=this.d.armazem(),t=async()=>{let i=await o.excluir();return o.localizar&&await o.localizar()&&(i=await o.excluir()||i),i},r=`seipro-favoritos-sync|${xo(this.d.escopo)}`,a=this.d.travarEsperando?await this.d.travarEsperando(r,t):await t();return await this.d.area.gravar({[xo(this.d.escopo)]:{estado:"nunca",quando:Date.now(),pendente:!1}}),a}parar(){this.desligar(),this.pararPrefs?.()}};yr(document);var Mr=window;if(!Mr.__seiProFavoritos){Mr.__seiProFavoritos=!0;let e=()=>void Va().catch(o=>console.warn("[SEI Pro] favoritos:",o));document.readyState==="loading"?document.addEventListener("DOMContentLoaded",e,{once:!0}):e()}function $a(e){return e.querySelector("#frmProcedimentoControlar")?"caixa":e.querySelector("table.pesquisaResultado")?"pesquisa":e.querySelector('#frmAtividadeListar[action*="acao=procedimento_enviar"]')?"enviar":e.querySelector("#topmenu")&&e.querySelector("#divArvore")?"arvore":e.querySelector("#frmRelBlocoProtocoloLista, #frmAcompanhamentoLista, #frmProcedimentoSobrestar")?"listas":null}async function Va(){Cr(document);let e=window===window.top,o=$a(document);if(!o&&!e||!await pe("gerenciarfavoritos"))return;let t=Gt(),r=Xt(t,Kt(localStorage),t.location?.href);if(!r)return;let a=Wt(t);a&&(r.corTema=a);let i=Uo(chrome.storage.local,"local"),n=Uo(chrome.storage.sync,"sync"),s=$e(chrome.runtime.getManifest()),c=()=>Ut(w=>chrome.runtime.sendMessage(w),w=>void window.open(w,"seiProPainel","popup,width=420,height=760"),chrome.runtime.getURL("html/painel.html#aba=favoritos")),l=await de(i),u=()=>({agora:Date.now(),dispositivo:l}),p=_e(r),d={unidade:p.unidade?new lo(i,p.unidade,u):null,pessoal:new lo(i,p.pessoal,u)},m=e&&d.unidade&&p.unidade?new Ho({ctx:r,area:i,sync:n,repo:d.unidade,escopo:p.unidade,carimbo:u,travar:Ga,travarEsperando:Ja,armazem:()=>De(new ro(location.href,()=>F(document)),{nome:St(r.login),descricao:Ct})}):null;m&&await m.iniciar(o);let v=e?Xa(r,i,d):null;if(e&&Ua(r,i,m,v),!o)return;let x=new Ro({...d,aoAdicionar:(w,P,A)=>void Tr(w,P,A,d,r,n)});if(await x.carregar(),o==="caixa"){if(lr(document,x),d.unidade&&Ar(document,d.unidade).catch(w=>console.warn("[SEI Pro] favoritos: captura da caixa",w)),e){let w=await Ba(r,n,s,c,m,v);w&&Ka(w,[d.unidade,d.pessoal].filter(P=>!!P))}}else if(o==="arvore"){await nr(document,x,location.href)&&s&&Vt(document,{url:P=>chrome.runtime.getURL(P),abrirLateral:c}),Wa(d);let w=Mo(location.href);wr(document,location.href,[d.unidade,d.pessoal].filter(P=>!!P),P=>w.obter(P)).catch(P=>console.warn("[SEI Pro] favoritos: captura da \xE1rvore",P))}else if(o==="pesquisa")gr(document,x);else if(o==="enviar"){let w=async A=>await d.unidade?.contem(A)?d.unidade:await d.pessoal.contem(A)?d.pessoal:null,P=d.unidade??d.pessoal;await tr(document,{ativo:A=>x.ativo(A),adicionar:A=>P.adicionar(A),remover:A=>Promise.all([d.unidade?.remover(A),d.pessoal.remover(A)]),editar:async(A,q)=>(await w(A))?.editar(A,q),obter:async A=>(await w(A))?.obter(A),pastas:()=>P.pastasAtivas(),hoje:()=>po()})}else pr(document,x)}function Ua(e,o,t,r){let a=document.hasFocus()?Date.now():0,i=xr({area:o,conectar:()=>chrome.runtime.connect({name:Fe}),tratadores:ne({doc:document,ctx:e,iframe:null,armazenamento:localStorage,lerArquivo:()=>Yo(),sincronia:t,atualizar:r}),estado:()=>({visivel:document.visibilityState==="visible",foco:a,chave:He(e)})}),n=()=>{a=Date.now(),i.apresentar()};window.addEventListener("focus",n),document.addEventListener("visibilitychange",()=>document.visibilityState==="visible"?n():i.apresentar()),setInterval(()=>i.verificar(),5e3)}async function Tr(e,o,t,r,a,i){if(!(await U(i)).perguntarAoFavoritar)return;let n=o===r.unidade?"unidade":"pessoal",[s,c]=await Promise.all([o.pastasAtivas(),o.etiquetasAtivas()]);Ht(t,{favorito:e,lista:n,siglaUnidade:r.unidade?a.unidade?.sigla??"Unidade":null,pastas:s,etiquetas:c,temaEscuro:a.temaEscuro,hoje:po(),editar:l=>o.editar(e.id,l),criarPasta:l=>o.criarPasta(l),criarEtiqueta:l=>o.criarEtiqueta(l),moverPara:async l=>{let u=l==="unidade"?r.unidade:r.pessoal;if(!u||u===o)return;let p=await ft(o,u,e.id);p&&await Tr(p,u,t,r,a,i)}},me)}async function Ba(e,o,t,r,a,i){let n=await U(o),s=null,c=()=>{let u=Qo(n.exibir,t);u.abaixo&&!s?s=ja(e,o,n.recolhido,a,i):!u.abaixo&&s&&(s.fechar(),s=null)};c();let l=$t(document,{url:u=>chrome.runtime.getURL(u),destino:()=>Qo(n.exibir,t).lateral?"lateral":"abaixo",abrirLateral:r,rolarAtePainel:()=>{if(!s)return r();s.corpo.hidden&&s.painel.querySelector(".spro-fav-recolher")?.click(),s.painel.scrollIntoView({behavior:"smooth",block:"start"})}});return o.aoMudar(u=>{J in u&&U(o).then(p=>{n=p,c()})}),l}function ja(e,o,t,r,a){let i=Sr(document,{urlApp:chrome.runtime.getURL("html/favoritos.html"),temaEscuro:e.temaEscuro,recolhido:t,ordem:Pr(localStorage),aoRecolher:c=>void oe(o,{recolhido:c})});if(!i)return null;let n=ne({doc:document,ctx:e,iframe:i.iframe,armazenamento:localStorage,lerArquivo:()=>Yo(),sincronia:r,atualizar:a,sobreposicao:i.sobreposicao,avisar:kt(document,e.temaEscuro)}),s=null;return i.iframe.addEventListener("load",()=>{s?.fechar(),s=wo(chrome.runtime.connect({name:Re}),n),s.aoFechar(()=>i.sobreposicao.ligar(!1))}),{painel:i.painel,corpo:i.corpo,fechar:()=>{s?.fechar(),i.fechar()}}}function Ga(e,o){let t=navigator.locks;return t?t.request(e,{ifAvailable:!0},async r=>r?o():null):o()}function Xa(e,o,t){return new qo(()=>{let r=new ro(location.href,()=>F(document));return{repos:[t.unidade,t.pessoal].filter(a=>!!a),listarCaixa:async a=>{let i=await r.http.obter(r.linkMenu("procedimento_controlar"),{sinal:a,aceitarValidacao:!0}),n=No(i.doc);if(n)throw new L("CAIXA_FILTRADA",`A caixa do Controle de Processos est\xE1 com ${n}. Tire o filtro e tente de novo: sem a caixa inteira, o SEI Pro n\xE3o sabe quais processos est\xE3o na sua unidade.`);let s=await Ce(r,{limite:Number.MAX_SAFE_INTEGER,sinal:a});if(s.processos.length<s.total)throw new L("CAIXA_INCOMPLETA","N\xE3o foi poss\xEDvel ler a caixa inteira; nada foi atualizado.");return new Set(s.processos.map(c=>c.idProcedimento))},localizar:async(a,i)=>(await r.localizar(a,{sinal:i})).idProcedimento,lerProcesso:async(a,i)=>{let n=await r.arvore(a,{sinal:i,forcar:!0}),s=to(n,"procedimento_consultar_historico"),c=s?So(await r.http.obter(s,{sinal:i}))[0]:void 0;return{qtdDocumentos:n.documentos.length,abertoNaUnidade:!!to(n,"procedimento_enviar"),ultimoAndamento:c?{data:c.data,unidade:c.unidade,descricao:c.descricao}:void 0}},esperar:(a,i)=>new Promise(n=>{let s=setTimeout(n,a);i.addEventListener("abort",()=>{clearTimeout(s),n()},{once:!0})})}},r=>o.gravar({[Lt(e.host,e.login)]:{...r,quando:Date.now()}}),{area:o,host:e.host,login:e.login})}function Ka(e,o){let t=!1,r=()=>{t||(t=!0,setTimeout(()=>{t=!1,Bt(o,po()).then(a=>jt(e,a)).catch(()=>{})},100))};for(let a of o)a.aoMudar(r),a.aoMudarAtuais(r);r()}function Wa(e){let o;try{o=G(F(document,location.href))}catch{return}if(!o.idProcedimento||!o.documentos.length)return;let t={id:o.idProcedimento,protocolo:o.protocolo,tipo:o.tipo||void 0,sigiloso:o.nivel==="sigiloso"},r=new Set,a=async()=>{let i=await e.unidade?.obter(t.id)??await e.pessoal.obter(t.id);r=new Set(i&&i.removidoEm===void 0?(i.documentos??[]).map(n=>n.id):[])};a().then(()=>{_(document);let i=Yt(document,o.documentos.map(n=>({id:n.id,numero:n.numero,titulo:n.titulo})),{marcado:n=>r.has(n),alternar:async n=>{await Zt(e,t,n),await a()}});for(let n of[e.unidade,e.pessoal])n?.aoMudar(()=>void a().then(()=>i.repintar()))})}function Ja(e,o){let t=navigator.locks;return t?t.request(e,()=>o()):o()}})();
