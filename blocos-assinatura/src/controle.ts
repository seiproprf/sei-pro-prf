import { listarBlocosParaInclusao, retornarBlocoParaInclusao } from '../../sei-nucleo/src/dominio/blocos';
import type { Sei } from '../../sei-nucleo/src/sei';

export interface Dependencias {
  doc: Document;
  url: string;
  sei: Sei;
}

/** Ciclo da tela viva: só o núcleo conhece listagem, formulário e escrita do SEI. */
export function iniciar({ doc, url, sei }: Dependencias) {
  let ligada = false;
  let encerrada = false;
  let escrevendo = false;
  let dialogo: HTMLDialogElement | null = null;
  let leitura: AbortController | null = null;
  let origem: HTMLElement | null = null;
  const botoes = new Set<HTMLButtonElement>();
  const contexto = new URL(url).searchParams.get('acao') === 'bloco_escolher';

  function fecharDialogo() {
    leitura?.abort(); leitura = null;
    const atual = dialogo;
    dialogo = null;
    if (atual?.open) atual.close();
    atual?.remove();
    if (origem?.isConnected) origem.focus();
    origem = null;
  }

  function desmontar() {
    fecharDialogo();
    for (const botao of botoes) botao.remove();
    botoes.clear();
  }

  function montar() {
    if (!ligada || encerrada || !contexto) return;
    const seletor = doc.querySelector<HTMLSelectElement>('#frmBlocoEscolher #selBloco');
    if (!seletor) return;
    for (const botao of botoes) if (!botao.isConnected) botoes.delete(botao);
    const barras = [...doc.querySelectorAll<HTMLElement>('#frmBlocoEscolher #divInfraBarraComandosSuperior, #frmBlocoEscolher #divInfraBarraComandosInferior')];
    const destinos = barras.length ? barras : [seletor.parentElement!];
    for (const destino of destinos) {
      if (destino.querySelector('.spro-blocos-retornar')) continue;
      const botao = doc.createElement('button');
      botao.type = 'button';
      botao.className = 'infraButton spro-blocos-retornar';
      botao.textContent = 'Retornar bloco disponibilizado';
      botao.disabled = escrevendo;
      botao.addEventListener('click', () => { void abrir(botao); });
      destino.append(botao); botoes.add(botao);
    }
  }

  async function abrir(botao: HTMLElement) {
    if (!ligada || encerrada || dialogo || escrevendo) return;
    origem = botao;
    const atual = doc.createElement('dialog');
    atual.className = 'spro-blocos-dialog';
    atual.setAttribute('aria-labelledby', 'spro-blocos-titulo');
    const titulo = doc.createElement('h2');
    titulo.id = 'spro-blocos-titulo'; titulo.textContent = 'Retornar bloco disponibilizado';
    const explicacao = doc.createElement('p');
    explicacao.textContent = 'O retorno cancela a disponibilização para outras unidades e libera o bloco para incluir novos documentos. Depois da inclusão, você pode disponibilizá-lo novamente.';
    const status = doc.createElement('p');
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    status.textContent = 'Carregando blocos disponibilizados…';
    const lista = doc.createElement('fieldset');
    lista.className = 'spro-blocos-lista'; lista.hidden = true;
    const legenda = doc.createElement('legend'); legenda.textContent = 'Selecione o bloco'; lista.append(legenda);
    const acoes = doc.createElement('div'); acoes.className = 'spro-blocos-acoes';
    const confirmar = doc.createElement('button');
    confirmar.type = 'button'; confirmar.className = 'infraButton';
    confirmar.dataset.sproConfirmar = ''; confirmar.textContent = 'Retornar bloco'; confirmar.disabled = true;
    const fechar = doc.createElement('button');
    fechar.type = 'button'; fechar.className = 'infraButton';
    fechar.dataset.sproFechar = ''; fechar.textContent = 'Cancelar';
    acoes.append(fechar, confirmar); atual.append(titulo, explicacao, status, lista, acoes);
    dialogo = atual;
    doc.body.append(atual);
    atual.addEventListener('cancel', evento => {
      evento.preventDefault();
      if (!escrevendo) fecharDialogo();
    });
    fechar.addEventListener('click', () => { if (!escrevendo) fecharDialogo(); });
    atual.showModal(); fechar.focus();
    let selecionado = '';
    lista.addEventListener('change', () => {
      selecionado = lista.querySelector<HTMLInputElement>('input:checked')?.value ?? '';
      confirmar.disabled = !selecionado || escrevendo;
    });
    const abort = new AbortController(); leitura = abort;
    const ativa = () => !encerrada && ligada && dialogo === atual;
    try {
      const blocos = await listarBlocosParaInclusao(sei, { sinal: abort.signal });
      if (!ativa()) return;
      leitura = null;
      if (!blocos.length) {
        status.textContent = 'Nenhum bloco disponibilizado que possa retornar nesta unidade foi encontrado.';
        fechar.textContent = 'Fechar'; return;
      }
      for (const bloco of blocos) {
        const rotulo = doc.createElement('label');
        const radio = doc.createElement('input');
        radio.type = 'radio'; radio.name = 'spro-bloco-retorno'; radio.value = bloco.id;
        const texto = doc.createElement('span'); texto.textContent = `${bloco.numero} - ${bloco.descricao}`;
        rotulo.append(radio, texto); lista.append(rotulo);
      }
      lista.hidden = false;
      status.textContent = 'Escolha um bloco e confirme o retorno.';
      lista.querySelector<HTMLInputElement>('input')?.focus();
    } catch (erro) {
      if (!ativa()) return;
      leitura = null;
      status.textContent = erro instanceof Error ? erro.message : 'Não foi possível carregar os blocos. Tente novamente.';
      fechar.textContent = 'Fechar';
    }
    confirmar.addEventListener('click', () => { void retornar(); });

    async function retornar() {
      if (!ativa() || escrevendo || !selecionado || confirmar.disabled) return;
      escrevendo = true;
      confirmar.disabled = true; fechar.disabled = true; lista.disabled = true;
      for (const botao of botoes) botao.disabled = true;
      status.textContent = 'Retornando o bloco e verificando a inclusão…';
      try {
        // A escrita já enviada continua mesmo se a preferência for desligada:
        // abortar o fetch não garante cancelar o que o servidor está fazendo.
        const bloco = await retornarBlocoParaInclusao(sei, selecionado, url);
        if (!ativa()) return;
        const seletor = doc.querySelector<HTMLSelectElement>('#frmBlocoEscolher #selBloco');
        if (!seletor) {
          status.textContent = 'Bloco retornado no SEI. A tela de inclusão mudou; atualize-a antes de continuar.';
        } else {
          let opcao = [...seletor.options].find(o => o.value === bloco.id);
          if (!opcao) { opcao = doc.createElement('option'); opcao.value = bloco.id; seletor.append(opcao); }
          opcao.textContent = bloco.rotulo;
          seletor.value = bloco.id;
          // O onchange nativo submete o formulário: só o Chosen é notificado.
          const Evento = doc.defaultView!.Event;
          seletor.dispatchEvent(new Evento('chosen:updated', { bubbles: true }));
          status.textContent = 'Bloco retornado e selecionado no campo Bloco. Você pode incluir os documentos marcados.';
        }
        confirmar.hidden = true; fechar.textContent = 'Fechar';
      } catch (erro) {
        if (!ativa()) return;
        status.textContent = erro instanceof Error ? erro.message : 'Não foi possível confirmar o retorno. Confira o bloco no SEI antes de tentar novamente.';
        confirmar.disabled = false;
      } finally {
        escrevendo = false;
        for (const botao of botoes) botao.disabled = false;
        if (ativa()) { fechar.disabled = false; lista.disabled = false; fechar.focus(); }
      }
    }
  }

  const Observador = doc.defaultView!.MutationObserver;
  const observador = new Observador(montar);
  if (contexto) observador.observe(doc.body, { childList: true, subtree: true });
  return {
    configurar(valor: boolean) {
      if (encerrada) return;
      ligada = valor;
      if (ligada) montar(); else desmontar();
    },
    fechar() {
      encerrada = true; ligada = false;
      observador.disconnect(); desmontar();
    },
  };
}
