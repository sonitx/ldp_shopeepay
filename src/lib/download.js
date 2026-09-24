// Ghi nhận lượt nhấn nút "Tải ứng dụng" trước khi gửi thông báo Telegram.

const PLACEMENTS = {
  header: 'Menu trên cùng',
  hero: 'Đầu trang (hero)',
  features: 'Phần tính năng',
  promos: 'Phần ưu đãi',
  steps: 'Phần hướng dẫn 3 bước',
  cta: 'Khối kêu gọi cuối trang',
  footer: 'Chân trang',
  sticky: 'Thanh cố định (điện thoại)',
  blog: 'Cuối bài blog',
  notfound: 'Trang 404',
};

const BOT_UA = /bot|crawl|spider|slurp|preview|headless|lighthouse|facebookexternalhit|zalo/i;

function detectDevice(ua = '') {
  if (/iphone|ipad|ipod/i.test(ua)) return 'iPhone/iPad';
  if (/android/i.test(ua)) return 'Android';
  if (/windows|macintosh|linux/i.test(ua)) return 'Máy tính';
  return 'Không rõ';
}

// Chống spam đơn giản: mỗi IP chỉ gửi 1 thông báo trong 30 giây.
// Trên Netlify mỗi instance function có bộ nhớ riêng nên đây chỉ là giới hạn "cố gắng hết sức".
const THROTTLE_MS = 30 * 1000;
const lastSeen = new Map();

function shouldNotify(ip, now = Date.now()) {
  if (lastSeen.size > 5000) lastSeen.clear();
  const prev = lastSeen.get(ip);
  if (prev && now - prev < THROTTLE_MS) return false;
  lastSeen.set(ip, now);
  return true;
}

module.exports = { PLACEMENTS, BOT_UA, detectDevice, shouldNotify };
