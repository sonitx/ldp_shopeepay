# LDP Template — Landing page + Blog Markdown trên Netlify

Template website giới thiệu sản phẩm, **render phía server bằng Node.js (Express + EJS)** và chạy trên **Netlify Functions**, nên có thể đọc/ghi database trực tiếp.

- **Trang chủ**: landing page (hero, tính năng, các bước, FAQ, bài viết mới) + form đăng ký khách hàng → gửi về **Telegram**
- **Blog**: mỗi bài là một file Markdown trong `content/blog/`, được render thành HTML có mục lục, tô màu code, tag, phân trang (tương tự Docusaurus)
- **SEO**: title/description, canonical, Open Graph, Twitter card, JSON-LD (Organization, WebSite, FAQPage, BlogPosting, BreadcrumbList), `sitemap.xml`, `robots.txt`, `rss.xml`
- **Google Analytics 4** và **Google Search Console** (thẻ meta xác minh)

## Bắt đầu nhanh

Trong Claude Code, chạy skill **`/new-website`**. Skill sẽ hỏi thông tin sản phẩm, form đăng ký, Telegram bot, Google Analytics, Google Search Console rồi tự cấu hình.

Hoặc cấu hình thủ công:

```bash
npm install
cp .env.example .env      # điền TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID
npm run dev               # http://localhost:3000
npm test                  # kiểm tra các route qua Netlify Function handler
```

## Cấu trúc

```
site.config.js            # toàn bộ cấu hình và nội dung landing page
content/blog/*.md         # bài viết blog
views/                    # template EJS (index, blog/list, blog/post, 404, partials)
public/                   # file tĩnh (Netlify CDN phục vụ trực tiếp)
src/app.js                # Express app: routes, SEO, API form
src/lib/                  # blog, markdown, seo, telegram, lead
netlify/functions/server.js  # bọc Express thành Netlify Function
netlify.toml              # cấu hình build, redirect, cache
scripts/                  # smoke test, công cụ Telegram
```

## Viết bài blog

Tạo file `content/blog/2026-10-01-ten-bai-viet.md` → URL `/blog/ten-bai-viet`:

```markdown
---
title: Tiêu đề (50–60 ký tự)
description: Mô tả hiển thị trên Google (120–160 ký tự)
date: 2026-10-01
updated: 2026-10-05          # tuỳ chọn
author: Tên tác giả          # tuỳ chọn
tags: [hướng dẫn, seo]       # tuỳ chọn
image: /images/blog/anh.png  # tuỳ chọn, 1200x630
slug: duong-dan-khac         # tuỳ chọn
draft: true                  # tuỳ chọn: chỉ hiện khi chạy local
---
```

Heading `##`/`###` tự vào mục lục. File bắt đầu bằng `_` bị bỏ qua. Bài mới xuất hiện sau khi deploy.

## Telegram

1. Tạo bot với **@BotFather** (`/newbot`) để lấy token, ghi vào `.env`
2. Nhắn một tin cho bot (hoặc thêm bot vào group) → `npm run telegram:chat-id` để lấy chat id
3. `npm run telegram:test` để gửi tin nhắn thử

Muốn gửi thông báo khác (đơn hàng, liên hệ...), dùng `sendTelegramMessage(text)` trong `src/lib/telegram.js`. Khi chạy local mà chưa cấu hình Telegram, thông tin khách hàng chỉ được in ra console. Trên production, thiếu cấu hình sẽ trả lỗi để bạn phát hiện sớm.

## Deploy lên Netlify

1. Đẩy code lên Git → Netlify → *Import an existing project* (build đọc từ `netlify.toml`)
2. *Site configuration → Environment variables*: `SITE_URL`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` → deploy lại
3. Search Console: *Verify* → gửi sitemap `https://<domain>/sitemap.xml`

Chạy giống production ở local: `npm i -g netlify-cli && netlify dev`.

### Cách hoạt động

- File trong `public/` được CDN phục vụ trực tiếp. Mọi đường dẫn khác được rewrite tới function `server` (Express).
- `views/` và `content/` được đóng gói kèm function (`included_files`).
- Trang blog, sitemap và RSS được cache trên CDN (`Netlify-CDN-Cache-Control`). Mỗi lần deploy cache tự xoá.

## Kết nối database

Function chạy Node.js đầy đủ nên có thể dùng bất kỳ driver nào. Ví dụ với Postgres serverless (Neon):

```bash
npm i @neondatabase/serverless
```

```js
// src/lib/db.js
const { neon } = require('@neondatabase/serverless');
module.exports = neon(process.env.DATABASE_URL);

// src/app.js
const sql = require('./lib/db');
app.get('/san-pham', async (req, res) => {
  const products = await sql`select * from products order by created_at desc`;
  res.render('products', { seo: seo.buildSeo({ title: 'Sản phẩm', path: '/san-pham' }), products });
});
```

Khai báo `DATABASE_URL` trong Netlify env vars. Không bật `cacheOnCdn` cho trang có dữ liệu thay đổi liên tục.
