/* Envio do cartão "Novidades por e-mail" sem sair da página (serviço em novidades.seipro.app). */
(function () {
  var formularios = document.querySelectorAll('form[data-novidades]');
  Array.prototype.forEach.call(formularios, function (form) {
    var msg = form.querySelector('.form-novidades-msg');
    var botao = form.querySelector('button[type=submit]');
    var widget = form.querySelector('.cf-turnstile');

    function mostrar(texto, tipo) {
      msg.textContent = texto;
      msg.className = 'form-novidades-msg' + (tipo ? ' ' + tipo : '');
    }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      botao.disabled = true;
      mostrar('Enviando…');
      fetch(form.action, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new URLSearchParams(new FormData(form))
      })
        .then(function (r) {
          return r.json().catch(function () {
            return { ok: false, mensagem: 'Não foi possível enviar agora. Tente de novo em instantes.' };
          });
        })
        .then(function (d) {
          mostrar(d.mensagem, d.ok ? 'ok' : 'erro');
          if (d.ok) form.reset();
        })
        .catch(function () {
          mostrar('Sem conexão com o serviço de novidades. Tente de novo em instantes.', 'erro');
        })
        .then(function () {
          botao.disabled = false;
          // O token do Turnstile vale uma vez só.
          if (window.turnstile && widget) {
            try { window.turnstile.reset(widget); } catch (e) { /* widget ainda não carregou */ }
          }
        });
    });
  });
})();
