// Nút "Tải ứng dụng": link tự mở tab mới (target="_blank"), script này chỉ báo về server để gửi Telegram.
(function () {
  function report(link) {
    var data = new URLSearchParams({
      placement: link.getAttribute('data-download') || '',
      page: location.href,
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/download-click', data);
    } else {
      fetch('/api/download-click', { method: 'POST', body: data, keepalive: true }).catch(function () {});
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'app_download_click', { placement: link.getAttribute('data-download') });
    }
  }

  function onClick(event) {
    // click chuột trái / chạm, hoặc auxclick chuột giữa (mở tab mới)
    if (event.type === 'auxclick' && event.button !== 1) return;
    var link = event.target.closest && event.target.closest('[data-download]');
    if (link) report(link);
  }

  document.addEventListener('click', onClick);
  document.addEventListener('auxclick', onClick);
})();
