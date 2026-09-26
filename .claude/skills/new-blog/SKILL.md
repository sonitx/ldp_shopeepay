---
name: new-blog
description: Dùng khi người dùng gọi /new-blog hoặc muốn viết thêm bài blog chuẩn SEO (kèm hình ảnh) cho website dựng từ template này (content/blog/*.md).
---

# new-blog

Viết bài blog chuẩn SEO có ảnh tự tạo cho template landing page + blog Markdown. Mọi câu hỏi và trả lời với người dùng bằng **tiếng Việt**.

**Nguyên tắc:** mỗi bài nhắm **một từ khoá dài** mà khách thật hay tìm, chỉ viết thông tin **đã xác minh**, và dẫn khách tới CTA chính của site.

## Bước 1 — Đầu vào
Hỏi trong một tin nhắn (bỏ qua những gì đã có): số bài / chủ đề, từ khoá mục tiêu, URL nguồn chính thức để lấy số liệu.
Nếu chưa có từ khoá → tự đề xuất danh sách (từ khoá dài, ý định tìm kiếm rõ: "cách…", "… là gì", "… có an toàn không") và cho người dùng chọn bằng `AskUserQuestion` (multiSelect).

## Bước 2 — Đọc bối cảnh
- `site.config.js`: `name`, `author`, `description`, CTA (`appDownload` hoặc `lead`).
- `public/css/style.css`: màu `--color-primary`, `--color-primary-dark` (dùng cho ảnh).
- `content/blog/`: bài và tag hiện có → tái dùng tag, không trùng chủ đề/slug.

## Bước 3 — Nghiên cứu
WebFetch các URL nguồn. Chỉ ghi con số/điều kiện có trong nguồn. Không chắc → viết chung + "xem chi tiết trong ứng dụng/trang chính thức". Không tự xưng là trang chính thức của thương hiệu người khác.

## Bước 4 — Viết bài
File `content/blog/YYYY-MM-DD-<slug>.md` (ngày hôm nay; slug không dấu, chứa từ khoá):
```markdown
---
title: <50–60 ký tự, có từ khoá>
description: <120–160 ký tự, hấp dẫn, có từ khoá>
date: YYYY-MM-DD
author: <site.author>
tags: [<tag có sẵn>, <tối đa 1 tag mới>]
image: /images/blog/<slug>.png
---
```
- 600–900 từ; từ khoá xuất hiện trong 1–2 câu đầu; chỉ dùng `##` / `###` (mục lục tự sinh).
- 1 câu kêu gọi hành động giữa bài (nút CTA cuối bài đã có sẵn trong template).
- Kết bằng `## Câu hỏi thường gặp` (2–3 câu ngắn).
- 2–3 link nội bộ `[...](/blog/<slug>)`; sửa bài cũ liên quan để link ngược lại + cập nhật `updated:`.

## Bước 5 — Hình ảnh
| Loại | Kích thước | File | Cách dùng |
| --- | --- | --- | --- |
| Ảnh bìa | **1200×630** | `public/images/blog/<slug>.png` | `image:` → đầu bài + og:image (Facebook/Zalo/Google) |
| Ảnh minh hoạ | **1200×675** (16:9) | `public/images/blog/<slug>-<ten>.png` | `![alt có từ khoá](...)`, 1–2 ảnh/bài |

1. Ảnh bìa: copy `cover-template.svg` (cùng thư mục skill) → `public/images/blog/src/<slug>.svg`, thay placeholder, vẽ phần minh hoạ bằng hình khối (điện thoại, thẻ, QR, khiên, biểu đồ…).
2. Ảnh minh hoạ: tự vẽ SVG 1200×675 cùng tông màu (vd sơ đồ các bước đánh số, mockup màn hình, thẻ so sánh).
3. Nhiều ảnh → viết một script tạm (Python/Node, để ở scratchpad) với các hàm vẽ dùng chung (điện thoại, thẻ, QR, đồng xu, khiên, sơ đồ bước) rồi sinh SVG + PNG một lượt; sửa bố cục thì chạy lại script.
4. Xuất: `rsvg-convert -w <W> -h <H> in.svg -o out.png` (thiếu thì `brew install librsvg`).
5. **Mở từng PNG bằng Read** để xem — `check-blog.js` không phát hiện lỗi bố cục. Soát: dấu tiếng Việt đúng; chữ không tràn khỏi thẻ/khung; thẻ nổi không che nút hay chữ; icon không lòi ra ngoài hình; tiêu đề không đè hình minh hoạ. Sửa rồi xem lại đến khi sạch.

Quy tắc: không emoji trong SVG; font `Helvetica, Arial, sans-serif`; không dùng logo thật của thương hiệu; mỗi PNG ≤ 200KB.

## Bước 6 — Kiểm tra
```bash
node .claude/skills/new-blog/check-blog.js   # front matter, kích thước ảnh, dung lượng, alt, link nội bộ, emoji trong SVG
npm test
```
Sửa hết **Lỗi** trước khi báo xong; **Cảnh báo** thì cân nhắc.

## Bước 7 — Tổng kết
Liệt kê URL bài mới và ảnh đã tạo. Nhắc: sau khi deploy → Search Console → URL inspection → **Request indexing** từng bài. Chỉ commit/push khi người dùng đồng ý.

## Lỗi hay gặp
| Lỗi | Cách tránh |
| --- | --- |
| Emoji hiện thành ô vuông/hình méo trong PNG | Vẽ icon bằng `rect`/`circle`/`path` |
| Ảnh bìa sai tỉ lệ → Facebook cắt xấu | Luôn đúng 1200×630 |
| Tiêu đề trên ảnh đè hình minh hoạ | ≤ 17 ký tự/dòng ở cỡ 64px, xem lại bằng Read |
| Chữ tràn khỏi thẻ, thẻ nổi che nút | Ước ~0.55 × cỡ chữ mỗi ký tự để tính bề rộng thẻ; đặt thẻ nổi ngoài vùng nút |
| Link nội bộ hỏng | Slug = tên file bỏ ngày; chạy `check-blog.js` |
| Bịa số liệu/điều kiện ưu đãi | Chỉ dùng thông tin từ nguồn đã WebFetch |
