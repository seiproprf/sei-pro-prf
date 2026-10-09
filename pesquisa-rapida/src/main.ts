/** Entrada isolada, como anotacoes-controle: configuração compartilhada e atualização ao vivo. */
import { opcaoLegadaLigada } from '../../sei-comum/src/opcoes/legadas';
import { contextoDaPagina } from './leitura';
import { iniciar } from './controle';
import css from './style.css';
const OPCAO = 'filtrarpaginapelapesquisarapida';
function montar() {
  const contexto = contextoDaPagina(document);
  if (!contexto) return;
  const estilo = document.createElement('style');
  estilo.textContent = css;
  document.head.append(estilo);
  const controle = iniciar(document, contexto);
  let mudou = false;
  const configuracao = (mudancas: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'sync' || !('dataValues' in mudancas)) return;
    mudou = true;
    controle.configurar(opcaoLegadaLigada(mudancas.dataValues!.newValue, OPCAO));
  };
  chrome.storage.onChanged.addListener(configuracao);
  chrome.storage.sync
    .get('dataValues')
    .then((itens) => {
      if (!mudou) controle.configurar(opcaoLegadaLigada(itens.dataValues, OPCAO));
    })
    .catch(() => {
      /* Sem acesso ao storage: mantém o SEI nativo. */
    });
  window.addEventListener('pagehide', (evento) => {
    if (evento.persisted) return;
    chrome.storage.onChanged.removeListener(configuracao);
    controle.fechar();
    estilo.remove();
  });
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', montar, { once: true });
else montar();
