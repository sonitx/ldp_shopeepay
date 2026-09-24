// Gửi tin nhắn thử qua Telegram để kiểm tra cấu hình: `npm run telegram:test`
try {
  process.loadEnvFile('.env');
} catch {
  // dùng biến môi trường hiện có
}
const { sendTelegramMessage } = require('../src/lib/telegram');

sendTelegramMessage('✅ Kết nối Telegram thành công! Website sẽ gửi thông báo khách hàng đăng ký vào đây.')
  .then(() => console.log('Đã gửi tin nhắn thử thành công.'))
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
