// Liệt kê các chat đã nhắn tin cho bot để lấy TELEGRAM_CHAT_ID: `npm run telegram:chat-id`
// Trước khi chạy: mở Telegram, nhắn bất kỳ tin nào cho bot (hoặc thêm bot vào group rồi nhắn trong group).
try {
  process.loadEnvFile('.env');
} catch {
  // dùng biến môi trường hiện có
}

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error('Thiếu TELEGRAM_BOT_TOKEN (đặt trong .env hoặc biến môi trường).');
  process.exit(1);
}

fetch(`https://api.telegram.org/bot${token}/getUpdates`)
  .then((res) => res.json())
  .then((data) => {
    if (!data.ok) throw new Error(data.description || 'Telegram API lỗi');
    const chats = new Map();
    for (const update of data.result) {
      const msg = update.message || update.channel_post || update.my_chat_member;
      const chat = msg && msg.chat;
      if (chat) chats.set(chat.id, chat);
    }
    if (!chats.size) {
      console.log('Chưa có tin nhắn nào. Hãy nhắn cho bot một tin rồi chạy lại lệnh này.');
      return;
    }
    for (const chat of chats.values()) {
      const name = chat.title || [chat.first_name, chat.last_name].filter(Boolean).join(' ') || chat.username;
      console.log(`${chat.id}\t${chat.type}\t${name}`);
    }
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
