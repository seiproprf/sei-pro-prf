import { Sei } from '../../sei-nucleo/src/sei';
import { documentoTopo, paginaDe } from '../../sei-nucleo/src/sessao/pagina';
import { opcaoLegadaLigada } from '../../sei-comum/src/opcoes/legadas';
import { iniciar } from './controle';
import css from './style.css';

const CHAVE = 'retornarblocodisponibilizado';
function montar() {
  if (new URL(location.href).searchParams.get('acao') !== 'bloco_escolher') return;
  const style = document.createElement('style'); style.textContent = css; document.head.append(style);
  const sei = new Sei(location.href, () => {
    const topo = documentoTopo();
    return paginaDe(topo, topo.location?.href ?? location.href);
  });
  const controle = iniciar({ doc: document, url: location.href, sei });
  let mudou = false;
  const aoMudar = (mudancas: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'sync' || !('dataValues' in mudancas)) return;
    mudou = true;
    controle.configurar(opcaoLegadaLigada(mudancas.dataValues.newValue, CHAVE));
  };
  chrome.storage.onChanged.addListener(aoMudar);
  chrome.storage.sync.get('dataValues').then(itens => {
    if (!mudou) controle.configurar(opcaoLegadaLigada(itens.dataValues, CHAVE));
  }).catch(() => { /* sem acesso à preferência, mantém a tela nativa */ });
  window.addEventListener('pagehide', evento => {
    if (evento.persisted) return;
    controle.fechar(); chrome.storage.onChanged.removeListener(aoMudar); style.remove();
  }, { once: true });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar, { once: true });
else montar();
