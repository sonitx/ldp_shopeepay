---
name: new-website
description: Khởi tạo website mới từ template này (landing page + blog markdown + Netlify). Dùng khi người dùng gọi /new-website hoặc muốn tạo/cấu hình website mới — hỏi về form đăng ký khách hàng, Telegram bot, Google Analytics, Google Search Console rồi ghi cấu hình vào code.
---

# new-website

Cấu hình template này thành website cho một sản phẩm cụ thể. Mọi câu hỏi và trả lời với người dùng bằng **tiếng Việt**.

## Các file liên quan

| Việc | File |
| --- | --- |
| Tên, mô tả, nội dung landing, bật/tắt tính năng, GA, Search Console | `site.config.js` |
| Bí mật (Telegram token, chat id, SITE_URL) | `.env` (local) + Netlify Environment variables (production) |
| Ảnh chia sẻ mạng xã hội | `public/images/og-default.svg` → `public/images/og-default.png` |
| Kiểm tra | `npm test`, `npm run telegram:test`, `npm run telegram:chat-id` |

**Quy tắc bảo mật:** Telegram bot token là bí mật. Chỉ ghi vào `.env` (đã có trong `.gitignore`) và Netlify env vars. **Không bao giờ** ghi token vào `site.config.js`, view, README hay commit git. GA Measurement ID và mã xác minh Search Console là công khai nên được ghi thẳng vào `site.config.js`.

## Bước 1 — Thông tin sản phẩm

Hỏi ngắn gọn trong một tin nhắn (bỏ qua những gì người dùng đã cung cấp):
- Tên sản phẩm/website, slogan ngắn, mô tả 1–2 câu (dùng cho SEO)
- Domain chính thức (vd `https://tenmien.vn`, hoặc `https://<tên>.netlify.app` nếu chưa có)
- (Tuỳ chọn) các tính năng nổi bật, câu hỏi thường gặp — nếu không có, tự viết nội dung mẫu phù hợp với sản phẩm

## Bước 2 — Bốn câu hỏi cấu hình

Hỏi lần lượt. Câu có lựa chọn thì dùng `AskUserQuestion`; câu cần nhập giá trị thì hỏi bằng tin nhắn thường. Người dùng có thể trả lời "bỏ qua" cho câu 2–4 — khi đó để trống và nhắc họ ở phần tổng kết.

### Câu 1: Form để lại thông tin trên landing page

`AskUserQuestion`: "Người dùng có để lại thông tin trên landing page không?"
- **Có (Khuyến nghị)** — thêm form Họ và tên, Số điện thoại, Địa chỉ; khi khách nhấn gửi, thông tin được gửi thẳng về Telegram
- **Không** — landing page chỉ giới thiệu sản phẩm

→ Ghi `features.leadForm: true | false` trong `site.config.js`. Khi `false`, form, nút "Đăng ký" trên menu, CTA cuối bài blog và API `/api/lead` đều tự tắt; không cần xoá code.

### Câu 2: Telegram bot

Hỏi: "Cho tôi **bot token** Telegram để gửi thông báo khi có khách đăng ký (và các thông báo khác sau này)." Nếu người dùng chưa có bot, hướng dẫn:
1. Mở Telegram, chat với **@BotFather** → gửi `/newbot` → đặt tên → nhận token dạng `123456789:AA...`
2. Nhắn một tin bất kỳ cho bot vừa tạo (hoặc thêm bot vào group rồi nhắn trong group nếu muốn cả nhóm nhận thông báo)

Kiểm tra token khớp `^\d+:[A-Za-z0-9_-]{30,}$`. Sau đó lấy **chat id**:
1. Ghi token vào `.env` (`TELEGRAM_BOT_TOKEN=...`)
2. Chạy `npm run telegram:chat-id` — lệnh in ra danh sách `chat_id  loại  tên`
3. Nếu chỉ có 1 chat → dùng luôn. Nếu nhiều → hỏi người dùng chọn chat nào (có thể chọn nhiều, ghi cách nhau bằng dấu phẩy). Nếu rỗng → nhắc người dùng nhắn tin cho bot rồi chạy lại. Người dùng cũng có thể đưa thẳng chat id.
4. Ghi `TELEGRAM_CHAT_ID=...` vào `.env`, chạy `npm run telegram:test` và hỏi người dùng đã nhận được tin nhắn thử chưa.

Nếu câu 1 là "Không", vẫn hỏi câu này (bot dùng cho các thông báo khác sau này), nhưng nói rõ là có thể bỏ qua.

### Câu 3: Google Analytics

Hỏi: "Cho tôi **Measurement ID** của Google Analytics 4 (dạng `G-XXXXXXXXXX`)." Nếu chưa có, hướng dẫn: analytics.google.com → Admin → Tạo property → Data streams → Web → nhập domain → copy Measurement ID.

Kiểm tra khớp `^G-[A-Z0-9]{4,}$` (tự viết hoa). Nếu người dùng đưa mã `UA-...` thì báo đó là Universal Analytics đã ngừng hoạt động và xin mã GA4. Nếu người dùng dán cả đoạn script gtag thì tự tách ID `G-...` ra.

→ Ghi vào `analytics.gaMeasurementId`. Template tự chèn gtag.js vào `<head>` và gửi event `generate_lead` khi khách gửi form.

### Câu 4: Google Search Console

Hỏi: "Cho tôi **mã xác minh** Google Search Console (phương thức *HTML tag*)." Nếu chưa có, hướng dẫn: search.google.com/search-console → Add property → **URL prefix** → nhập domain → chọn *HTML tag* → copy.

Chấp nhận các dạng sau:
- Cả thẻ `<meta name="google-site-verification" content="abc123" />` → lấy giá trị `content`
- Chỉ chuỗi `abc123`
- Nếu người dùng chọn phương thức *HTML file* (`googleXXXX.html`) → tạo file đó trong `public/` với đúng nội dung Google cung cấp (`google-site-verification: googleXXXX.html`)
- Nếu người dùng xác minh bằng **Domain property (DNS)** → không cần sửa code, chỉ ghi chú lại

→ Ghi vào `seo.googleSiteVerification`.

## Bước 3 — Áp dụng cấu hình

1. **`site.config.js`**: cập nhật `name`, `tagline`, `description`, `author`, giá trị mặc định của `siteUrl`, `features.leadForm`, `analytics.gaMeasurementId`, `seo.googleSiteVerification`, và viết lại nội dung `landing` (hero, features, steps, faq), `blog.description`, `lead` cho đúng sản phẩm. Giữ nguyên cấu trúc object.
2. **`.env`**: tạo từ `.env.example` nếu chưa có; ghi `SITE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
3. **Ảnh OG**: sửa tên và slogan trong `public/images/og-default.svg`, rồi chạy `rsvg-convert -w 1200 -h 630 public/images/og-default.svg -o public/images/og-default.png` (nếu thiếu `rsvg-convert`: `brew install librsvg`, hoặc nhắc người dùng tự thay ảnh PNG 1200×630).
4. **Blog**: sửa 2 bài mẫu trong `content/blog/` cho đúng tên sản phẩm (hoặc hỏi người dùng có muốn xoá không).
5. **Kiểm tra**: `npm install` (nếu chưa có `node_modules`) rồi `npm test`. Phải đạt hết; nếu lỗi thì sửa trước khi báo xong. Nếu có Telegram, chạy `npm run telegram:test`.

## Bước 4 — Hướng dẫn deploy lên Netlify

Trình bày cho người dùng (chỉ tự chạy lệnh `netlify` khi người dùng đồng ý, vì các lệnh này thay đổi site thật):

1. Đẩy code lên GitHub/GitLab (không commit `.env`) → Netlify → **Add new site → Import an existing project** → chọn repo. Build settings được đọc từ `netlify.toml`, không cần sửa.
2. **Site configuration → Environment variables** → thêm `SITE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (scope có **Functions**). Bằng CLI:
   ```bash
   netlify env:set SITE_URL https://tenmien.vn
   netlify env:set TELEGRAM_BOT_TOKEN <token>
   netlify env:set TELEGRAM_CHAT_ID <chat_id>
   ```
   Sau khi thêm biến môi trường phải **deploy lại**.
3. Gắn domain riêng (nếu có) trong **Domain management**.
4. Sau khi site chạy: vào Search Console → bấm **Verify** → mục **Sitemaps** → gửi `https://<domain>/sitemap.xml`.
5. Kiểm tra GA: mở website → Google Analytics → Reports → **Realtime** phải thấy 1 người dùng.

## Bước 5 — Tổng kết

Báo ngắn gọn: đã bật/tắt những gì, file nào đã sửa, kết quả `npm test` / `telegram:test`, các mục người dùng đã bỏ qua (và cách bổ sung sau: sửa `site.config.js` hoặc `.env`), và các bước deploy còn lại.
