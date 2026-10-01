/* SEI Pro — convite para avaliar a extensão na loja.

   O background.js da extensão abre o histórico de versões com
   #avaliar=<loja>&versao=<versão> quando a atualização traz novidades (muda o
   1º ou o 2º número da versão) e a extensão veio da Chrome Web Store ou da loja
   do Edge. O seipro.js só carrega este arquivo quando esse fragmento existe.

   Quem clicou em "Avaliar" não vê mais o convite; quem fechou de qualquer outro
   jeito só volta a ver depois de 60 dias. O registro fica no navegador da
   pessoa (localStorage de seipro.app) e não vai para lugar nenhum.

   Os textos se revezam por dia, no horário de Brasília: todo mundo vê o mesmo
   texto no mesmo dia. {loja} vira o nome da loja em negrito. */
(function () {
  'use strict';

  var LOJAS = {
    chrome: {
      nome: 'Chrome Web Store',
      botao: 'Avaliar na Chrome Web Store',
      url: 'https://chromewebstore.google.com/detail/sei-pro/pdbbapplhjopafpgidbgceccbbmehcjj/reviews'
    },
    edge: {
      nome: 'loja do Edge',
      botao: 'Avaliar na loja do Edge',
      url: 'https://microsoftedge.microsoft.com/addons/detail/sei-pro/gkhfbbbminanojfklpfmloaglckmlfne'
    }
  };

  /* t: título; d: botão de fechar; c: parágrafos; assinatura: bloco de assinatura do SEI. */
  var TEXTOS = [
    { t: 'Este processo aguarda a sua assinatura', d: 'Fica para a próxima', assinatura: true, c: [
      'Calma, não é a chefia cobrando. É o SEI Pro, que acabou de ganhar novidades e queria saber o que você acha dele.',
      'Avaliar na {loja} leva menos tempo que incluir um documento em bloco.'] },
    { t: 'Gostando do SEI Pro?', d: 'Agora não', c: [
      'Então conta lá na {loja}! Cada avaliação ajuda outros servidores a descobrirem a extensão.',
      'E deixa o desenvolvedor mais feliz que ponto facultativo emendado com feriado.'] },
    { t: 'Quantos cliques o SEI Pro já te poupou?', d: 'Agora não', c: [
      'A gente não sabe, e nem quer saber: o SEI Pro não coleta nada sobre o seu uso.',
      'Mas se foram muitos, que tal gastar só mais uns três para avaliar na {loja}?'] },
    { t: 'Encaminhe-se para manifestação', d: 'Sobrestar por 60 dias', c: [
      'Considerando a nova versão do SEI Pro, solicita-se a Vossa Senhoria o obséquio de avaliar a extensão na {loja}.',
      'Prazo: quando der. Sem ofício de cobrança.'] },
    { t: 'Ciente?', d: 'Depois eu despacho', c: [
      'Você já viu as novidades. Falta só o despacho: uma avaliação na {loja}.',
      'Pode ser curtinha. “De acordo” também vale.'] },
    { t: 'Isto não é uma reunião', d: 'Agora não', c: [
      'Não tem pauta, nem ata, nem “só mais um ponto”.',
      'É só um minuto para avaliar o SEI Pro na {loja}, e isso ajuda outros colegas a encontrarem a extensão.'] },
    { t: 'Cabe entre um café e outro', d: 'Depois do café', c: [
      'Avaliar o SEI Pro na {loja} leva menos tempo que o café esfriar.',
      'E ajuda mais gente a descobrir que o SEI pode ser mais rápido.'] },
    { t: 'Retorno programado para hoje', d: 'Reprogramar o retorno', c: [
      'O SEI Pro ganhou novidades e marcou um retorno com você.',
      'Se ele tem facilitado o seu dia, uma avaliação na {loja} faz diferença para quem ainda não o conhece.'] },
    { t: 'Aguardando o seu parecer', d: 'Agora não', c: [
      'Favorável, com ressalvas ou cheio de sugestões: todo parecer sobre o SEI Pro na {loja} ajuda a extensão a melhorar e a chegar a mais colegas.'] },
    { t: 'Pendência encontrada', d: 'Fica para a próxima', c: [
      'O SEI Pro vive apontando documento sem assinatura. Desta vez a pendência é dele: falta a sua avaliação na {loja}.',
      'Resolve em um minuto.'] },
    { t: 'Protocolado com sucesso', d: 'Agora não', c: [
      'A nova versão do SEI Pro já está instalada. Falta só um trâmite: a sua avaliação na {loja}.',
      'Sem fila, sem senha e sem balcão.'] },
    { t: 'Urgente (mas nem tanto)', d: 'Agora não', c: [
      'Todo processo diz que é urgente. Este não: avaliar o SEI Pro na {loja} pode esperar você terminar o despacho.',
      'Mas faz uma diferença enorme para quem ainda não conhece a extensão.'] },
    { t: 'Publique-se. Registre-se. Avalie-se.', d: 'Agora não', c: [
      'Não tem prazo nem intimação. É só um convite para contar na {loja} o que você achou do SEI Pro.'] },
    { t: 'Despacho de mero expediente', d: 'Agora não', c: [
      'Nada complicado: escolha as estrelas, escreva um comentário se quiser, e pronto.',
      'Avaliar o SEI Pro na {loja} é mais simples que ofício de encaminhamento.'] },
    { t: 'Pedido de vista concedido', d: 'Pedir vista por 60 dias', c: [
      'Veja as novidades com calma. Quando terminar, conte na {loja} o que achou do SEI Pro.',
      'Sua avaliação ajuda outros servidores a encontrá-lo.'] },
    { t: 'Ofício-circular nº 1/SEI Pro', d: 'Agora não', c: [
      'Assunto: avaliação da extensão.',
      'Comunicamos que o SEI Pro tem novidades e que a sua opinião na {loja} é muito bem-vinda. Atenciosamente, o desenvolvedor.'] },
    { t: 'Mais rápido que abrir a árvore do processo', d: 'Agora não', c: [
      'Avaliar o SEI Pro na {loja} leva menos tempo que a árvore de um processo grande carregar.',
      'E ajuda outros colegas a encontrarem a extensão.'] },
    { t: 'A sua opinião tem fé pública', d: 'Agora não', c: [
      'Bom, quase. Mas na {loja} ela pesa muito: é o que outros servidores leem antes de instalar o SEI Pro.'] },
    { t: 'Juntada de avaliação', d: 'Agora não', c: [
      'Que tal juntar ao processo do SEI Pro uma avaliação na {loja}?',
      'Não precisa autenticar, nem conferir com o original.'] },
    { t: 'Se você não avaliar, o desconto é o mesmo', d: 'Agora não', c: [
      'O SEI Pro é 100% de graça, com ou sem avaliação. O pai do Chris ia adorar.',
      'Mas se ele tem poupado o seu tempo, uma avaliação na {loja} ajuda mais colegas a economizarem também.'] },
    { t: 'Custa zero centavos. O pai do Chris aprovaria.', d: 'Economizar para depois', c: [
      'Avaliar o SEI Pro na {loja} não gasta luz, não gasta papel e não gasta tinta de impressora.',
      'Só um minuto do seu dia.'] },
    { t: 'Tem gente com dois empregos. Você tem o SEI.', d: 'Agora não', c: [
      'Às vezes parece a mesma coisa.',
      'O SEI Pro existe para aliviar essa carga, e se ele tem ajudado, conta isso na {loja}.'] },
    { t: 'Ninguém vai cobrar 14 meses de aluguel', d: 'Agora não', c: [
      'Diferente do Seu Barriga, o SEI Pro não cobra nada: nem aluguel, nem mensalidade, nem taxa.',
      'Só pede, com educação, uma avaliação na {loja}.'] },
    { t: 'Isso, isso, isso!', d: 'Agora não', c: [
      'Saiu versão nova do SEI Pro.',
      'Se as novidades te deixaram feliz feito o Chaves com um sanduíche de presunto, conta isso na {loja}.'] },
    { t: 'Não contavam com a minha astúcia!', d: 'Agora não', c: [
      'O SEI Pro voltou com novidades.',
      'Se ele já salvou o seu dia (com menos trapalhada que o Chapolin), deixe a sua avaliação na {loja}.'] },
    { t: 'Um plano infalível (de verdade)', d: 'Agora não', c: [
      'Diferente dos planos do Cebolinha, este funciona: você avalia o SEI Pro na {loja}, mais colegas encontram a extensão e mais ideias chegam até nós.'] },
    { t: 'Nazaré fazendo as contas', d: 'Agora não', c: [
      'Quantos cliques o SEI Pro já te poupou?',
      'Se a conta ficou confusa, relaxa: não precisa calcular nada para avaliar na {loja}.'] },
    { t: '“Porque sim” não é resposta', d: 'Agora não', c: [
      'Gostou das novidades? Não gostou de alguma coisa? Conta o porquê na {loja}.',
      'Toda avaliação ajuda o SEI Pro a melhorar.'] },
    { t: 'Isto não é corrente de WhatsApp', d: 'Fechar sem medo', c: [
      'Não precisa repassar para dez contatos, e nada de ruim acontece se você fechar esta janela.',
      'É só um convite para avaliar o SEI Pro na {loja}.'] },
    { t: 'A regra é clara', d: 'Agora não', c: [
      'Avaliar o SEI Pro na {loja} não tem impedimento, não dá cartão e não precisa de VAR.',
      'É só um minuto.'] },
    { t: 'Biscoito ou bolacha?', d: 'Agora não', c: [
      'Essa discussão não acaba nunca.',
      'Avaliar o SEI Pro na {loja} acaba em um minuto.'] },
    { t: 'Me ajuda a te ajudar', d: 'Agora não', c: [
      'Cada avaliação na {loja} leva o SEI Pro a mais colegas.',
      'Mais gente usando é mais ideia, mais correção e mais novidade para você.'] },
    { t: 'Receba!', d: 'Agora não', c: [
      'Uma versão nova do SEI Pro, com novidades fresquinhas.',
      'E se tiver um minuto, uma avaliação na {loja} ajuda muito.'] },
    { t: 'Não é sobre estrelas', d: 'Agora não', c: [
      'É sobre ajudar um colega de outro órgão a descobrir que o SEI pode dar menos trabalho.',
      'Avalie o SEI Pro na {loja}.'] }
  ];

  var CHAVE = 'seipro-convite-avaliacao';
  var DIA = 24 * 3600 * 1000;
  var ADIAMENTO = 60 * DIA;
  var BRASILIA = -3 * 3600 * 1000; /* UTC-3, sem horário de verão desde 2019 */

  function lerPedido(hash) {
    var m = /^#avaliar=([a-z]+)(?:&versao=([^&]*))?$/.exec(hash || '');
    if (!m || !Object.prototype.hasOwnProperty.call(LOJAS, m[1])) return null;
    return { loja: m[1], versao: /^\d+(\.\d+){1,3}$/.test(m[2] || '') ? m[2] : null };
  }

  function podeMostrar(registro, agora) {
    if (!registro || typeof registro !== 'object') return true;
    if (registro.avaliou) return false;
    return !(typeof registro.adiadoAte === 'number' && agora < registro.adiadoAte);
  }

  function registroDepois(acao, agora) {
    return acao === 'avaliar' ? { avaliou: true } : { adiadoAte: agora + ADIAMENTO };
  }

  function textoDoDia(agora) {
    return Math.floor((agora + BRASILIA) / DIA) % TEXTOS.length;
  }

  /* Nos testes (Node), o arquivo entrega só a lógica. */
  if (typeof module === 'object' && module && module.exports) {
    module.exports = { TEXTOS: TEXTOS, LOJAS: LOJAS, lerPedido: lerPedido, podeMostrar: podeMostrar, registroDepois: registroDepois, textoDoDia: textoDoDia };
    return;
  }

  var pedido = lerPedido(location.hash);
  if (!pedido) return;
  /* Tira o pedido do endereço: recarregar a página ou copiar o link não reabre o convite. */
  history.replaceState(null, '', location.pathname + location.search);
  if (typeof HTMLDialogElement !== 'function') return;

  function lerRegistro() {
    try { return JSON.parse(localStorage.getItem(CHAVE)); } catch (e) { return null; }
  }
  function gravarRegistro(r) {
    try { localStorage.setItem(CHAVE, JSON.stringify(r)); } catch (e) { /* sem armazenamento, o convite pode voltar na próxima versão */ }
  }
  if (!podeMostrar(lerRegistro(), Date.now())) return;

  var base = (document.body.getAttribute('data-base') || '').replace(/\/$/, '');
  var SVG = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, text) {
    var e = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text != null) e.textContent = text;
    return e;
  }
  function icone(nome) {
    var svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('class', 'ico');
    svg.setAttribute('aria-hidden', 'true');
    var use = document.createElementNS(SVG, 'use');
    use.setAttribute('href', '#i-' + nome);
    svg.appendChild(use);
    return svg;
  }
  /* Parágrafo com {loja} trocado pelo nome da loja em negrito. */
  function paragrafo(texto, loja) {
    var p = el('p');
    texto.split('{loja}').forEach(function (parte, i) {
      if (i > 0) p.appendChild(el('strong', null, loja.nome));
      p.appendChild(document.createTextNode(parte));
    });
    return p;
  }
  function agoraEmBrasilia() {
    var d = new Date();
    try {
      var o = { timeZone: 'America/Sao_Paulo' };
      return { data: d.toLocaleDateString('pt-BR', o), hora: d.toLocaleTimeString('pt-BR', { timeZone: o.timeZone, hour: '2-digit', minute: '2-digit' }) };
    } catch (e) {
      return { data: d.toLocaleDateString('pt-BR'), hora: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) };
    }
  }

  function mostrar() {
    var loja = LOJAS[pedido.loja];
    var x = TEXTOS[textoDoDia(Date.now())];
    var dialogo = el('dialog', { 'class': 'convite', closedby: 'any', 'aria-labelledby': 'convite-titulo', 'aria-describedby': 'convite-texto' });

    var fechar = el('button', { type: 'button', 'class': 'convite-fechar', 'aria-label': 'Fechar' });
    var xis = document.createElementNS(SVG, 'svg');
    xis.setAttribute('viewBox', '0 0 24 24');
    xis.setAttribute('aria-hidden', 'true');
    var traco = document.createElementNS(SVG, 'path');
    traco.setAttribute('d', 'M18 6 6 18M6 6l12 12');
    xis.appendChild(traco);
    fechar.appendChild(xis);
    dialogo.appendChild(fechar);

    var topo = el('div', { 'class': 'convite-topo' });
    topo.appendChild(el('img', { src: base + '/dist/icons/icon-128.png', width: '40', height: '40', alt: '' }));
    var selo = el('div', { 'class': 'convite-versao' }, 'Atualizado');
    if (pedido.versao) selo.appendChild(el('b', null, 'versão ' + pedido.versao));
    topo.appendChild(selo);
    dialogo.appendChild(topo);

    dialogo.appendChild(el('h2', { id: 'convite-titulo' }, x.t));
    var texto = el('div', { id: 'convite-texto' });
    x.c.forEach(function (c) { texto.appendChild(paragrafo(c, loja)); });
    if (x.assinatura) {
      var agora = agoraEmBrasilia();
      var assin = el('div', { 'class': 'convite-assinatura' });
      assin.appendChild(icone('stamp'));
      var linha = el('div', null, 'Avaliação a ser assinada eletronicamente por ');
      linha.appendChild(el('b', null, 'você'));
      linha.appendChild(document.createTextNode(', em ' + agora.data + ', às ' + agora.hora + ', conforme horário oficial de Brasília, com fundamento na sua boa vontade.'));
      assin.appendChild(linha);
      texto.appendChild(assin);
    }
    dialogo.appendChild(texto);

    var acoes = el('div', { 'class': 'convite-acoes' });
    var avaliar = el('a', { 'class': 'btn convite-avaliar', href: loja.url, target: '_blank', rel: 'noopener' });
    avaliar.appendChild(icone('star'));
    avaliar.appendChild(el('span', null, loja.botao));
    var depois = el('button', { type: 'button', 'class': 'btn convite-depois' }, x.d);
    acoes.appendChild(avaliar);
    acoes.appendChild(depois);
    dialogo.appendChild(acoes);

    var rodape = el('p', { 'class': 'convite-rodape' }, 'Achou um erro ou tem uma ideia? ');
    rodape.appendChild(el('a', { href: 'https://sugestoes.seipro.app', target: '_blank', rel: 'noopener' }, 'Conte no quadro de sugestões'));
    rodape.appendChild(document.createTextNode('.'));
    dialogo.appendChild(rodape);

    /* O link abre a loja em outra aba; fechar o convite não impede a navegação. */
    avaliar.addEventListener('click', function () { dialogo.close('avaliou'); });
    depois.addEventListener('click', function () { dialogo.close('adiou'); });
    fechar.addEventListener('click', function () { dialogo.close('fechou'); });
    /* Esc e clique fora também chegam aqui (returnValue vazio): contam como "agora não". */
    dialogo.addEventListener('close', function () {
      gravarRegistro(registroDepois(dialogo.returnValue === 'avaliou' ? 'avaliar' : 'adiar', Date.now()));
      dialogo.remove();
    });
    /* Safari ainda não tem closedby: o clique fora é tratado à mão. */
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialogo.addEventListener('click', function (e) {
        if (e.target !== dialogo) return;
        var r = dialogo.getBoundingClientRect();
        var dentro = r.top <= e.clientY && e.clientY <= r.bottom && r.left <= e.clientX && e.clientX <= r.right;
        if (!dentro) dialogo.close();
      });
    }

    document.body.appendChild(dialogo);
    dialogo.showModal();
  }

  /* Um instante para a página aparecer por trás antes do convite. */
  setTimeout(mostrar, 500);
})();
