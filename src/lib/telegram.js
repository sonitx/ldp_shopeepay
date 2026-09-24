/**
 * Gửi thông báo qua Telegram Bot API.
 * Cần biến môi trường:
 *   TELEGRAM_BOT_TOKEN  — token lấy từ @BotFather
 *   TELEGRAM_CHAT_ID    — chat id nhận thông báo (nhiều id cách nhau bằng dấu phẩy)
 *
 * `sendTelegramMessage` dùng chung cho mọi loại thông báo sau này (đơn hàng, liên hệ, lỗi hệ thống...).
 */
const API_BASE = 'https://api.telegram.org';

function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

async function sendTelegramMessage(text, { chatIds } = {}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const ids = chatIds || String(process.env.TELEGRAM_CHAT_ID || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (!token || ids.length === 0) {
    throw new Error('Telegram chưa được cấu hình (thiếu TELEGRAM_BOT_TOKEN hoặc TELEGRAM_CHAT_ID)');
  }

  return Promise.all(
    ids.map(async (chatId) => {
      const res = await fetch(`${API_BASE}/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(`Telegram API lỗi (chat ${chatId}): ${data.description || res.status}`);
      }
      return data.result;
    })
  );
}

function notifyNewLead(lead) {
  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const lines = [
    '🔔 KHÁCH HÀNG MỚI ĐĂNG KÝ',
    '',
    `👤 Họ và tên: ${lead.fullName}`,
    `📞 Số điện thoại: ${lead.phone}`,
    `🏠 Địa chỉ: ${lead.address}`,
    '',
    `🕒 Thời gian: ${time}`,
    lead.source ? `🌐 Trang: ${lead.source}` : null,
  ].filter((l) => l !== null);
  return sendTelegramMessage(lines.join('\n'));
}

function notifyAppDownload(click) {
  const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const lines = [
    '🎉 CÓ KHÁCH TẢI ỨNG DỤNG SHOPEEPAY',
    '',
    'Đã có một khách hàng vừa tải ứng dụng ShopeePay qua link của bạn.',
    '',
    `📍 Vị trí nút: ${click.placement}`,
    `📱 Thiết bị: ${click.device}`,
    `🕒 Thời gian: ${time}`,
    click.source ? `🌐 Trang: ${click.source}` : null,
    `🔗 Link: ${click.url}`,
  ].filter((l) => l !== null);
  return sendTelegramMessage(lines.join('\n'));
}

module.exports = { isTelegramConfigured, sendTelegramMessage, notifyNewLead, notifyAppDownload };
