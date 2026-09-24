// Gửi form đăng ký bằng fetch (không reload trang). Nếu JS bị tắt, form vẫn submit bình thường.
(function () {
  var form = document.querySelector('[data-lead-form]');
  if (!form) return;
  var status = form.querySelector('.form-status');
  var button = form.querySelector('button[type="submit"]');

  function setStatus(message, type) {
    status.textContent = message || '';
    status.className = 'form-status' + (type ? ' is-' + type : '');
  }

  function showErrors(errors) {
    form.querySelectorAll('[data-error-for]').forEach(function (el) {
      var name = el.getAttribute('data-error-for');
      var input = form.elements[name];
      el.textContent = (errors && errors[name]) || '';
      if (input) input.setAttribute('aria-invalid', errors && errors[name] ? 'true' : 'false');
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var data = Object.fromEntries(new FormData(form).entries());
    button.disabled = true;
    setStatus('Đang gửi...');
    showErrors(null);

    fetch(form.action, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(data),
    })
      .then(function (res) {
        return res.json().catch(function () { return { ok: false }; });
      })
      .then(function (json) {
        if (json.ok) {
          form.reset();
          setStatus(json.message || status.dataset.success, 'success');
          if (typeof window.gtag === 'function') window.gtag('event', 'generate_lead');
        } else {
          showErrors(json.errors);
          setStatus(json.message || status.dataset.error, 'error');
        }
      })
      .catch(function () {
        setStatus(status.dataset.error, 'error');
      })
      .finally(function () {
        button.disabled = false;
      });
  });
})();
