/**
 * Content script isolado: só age no Controle de Processos e só com a opção
 * "mostraranotacaocontrole" marcada (desligada por padrão, como no
 * verifyConfigValue do legado). Liga e desliga ao vivo quando as opções mudam.
 */
import { opcaoLegadaMarcada } from '../../sei-comum/src/opcoes/legadas';
import { iniciar } from './controle';
import css from './style.css';

const OPCAO = 'mostraranotacaocontrole';

function montar() {
  if (new URL(location.href).searchParams.get('acao') !== 'procedimento_controlar') return;
  const estilo = document.createElement('style');
  estilo.textContent = css;
  document.head.append(estilo);
  const controle = iniciar(document);
  let mudou = false;
  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area !== 'sync' || !('dataValues' in mudancas)) return;
    mudou = true;
    controle.configurar(opcaoLegadaMarcada(mudancas.dataValues!.newValue, OPCAO));
  });
  chrome.storage.sync.get('dataValues').then(itens => {
    if (!mudou) controle.configurar(opcaoLegadaMarcada(itens.dataValues, OPCAO));
  }).catch(() => { /* sem preferência legível: mantém a tela nativa */ });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar, { once: true });
else montar();
