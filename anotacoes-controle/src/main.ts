import { criarHttp } from '../../sei-nucleo/src/sessao/http';
import { opcaoLegadaLigada } from '../../sei-comum/src/opcoes/legadas';
import { iniciar } from './controle';
import css from './style.css';
const CHAVE = 'mostraranotacaocontrole';
function montar() {
  if (new URL(location.href).searchParams.get('acao') !== 'procedimento_controlar') return;
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);
  const http = criarHttp(new URL('.', location.href), { concorrencia: 2 });
  const controle = iniciar({ doc: document, lerPagina: async (href, sinal) => {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin || url.searchParams.get('acao') !== 'anotacao_registrar' || !url.searchParams.get('infra_hash')) throw new Error('Link de anotação inválido');
    return (await http.obter(href, { sinal })).doc;
  } });
  let mudou = false;
  const aoMudar = (mudancas: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'sync' || !('dataValues' in mudancas)) return;
    mudou = true;
    controle.configurar(opcaoLegadaLigada(mudancas.dataValues.newValue, CHAVE));
  };
  chrome.storage.onChanged.addListener(aoMudar);
  chrome.storage.sync.get('dataValues').then(itens => {
    if (!mudou) controle.configurar(opcaoLegadaLigada(itens.dataValues, CHAVE));
  }).catch(() => { /* sem preferência legível, mantém a tela nativa */ });
  window.addEventListener('pagehide', event => {
    if (event.persisted) return;
    controle.fechar(); chrome.storage.onChanged.removeListener(aoMudar); style.remove();
  }, { once: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar, { once: true });
else montar();
