---
name: shopeepay-khuyen-mai
description: Dùng khi người dùng gọi /shopeepay-khuyen-mai hoặc muốn viết bài blog từ các khuyến mãi mới trên shopeepay.vn/khuyen-mai — lấy 5 khuyến mãi mới nhất, bỏ những bài đã viết, rồi dùng skill new-blog viết bài cho bài mới.
---

# shopeepay-khuyen-mai

Biến khuyến mãi mới trên https://shopeepay.vn/khuyen-mai thành bài blog chuẩn SEO. Mọi câu hỏi và trả lời với người dùng bằng **tiếng Việt**.

**Nguồn dữ liệu:** trang /khuyen-mai là SPA, HTML không có bài. Script đọc thẳng JSON mà trang dùng (`article_list_published.json` trên deo.shopeemobile.com) — một request có cả danh sách lẫn nội dung, **không cần WebFetch từng trang**.

**Check trùng:** `processed.json` (cùng thư mục skill) lưu theo khoá `<id>_<promotion_start_date>`. Cùng `id` nhưng khác ngày bắt đầu = **đợt khuyến mãi mới → viết bài mới**. `status` = `written` (đã viết, kèm link blog) hoặc `skipped` (người dùng bỏ qua — lần sau không hỏi lại).

## Bước 1 — Lấy 5 khuyến mãi mới nhất
```bash
node .claude/skills/shopeepay-khuyen-mai/fetch-promos.js --out <scratchpad>/khuyen-mai
```
Script sắp theo ngày bắt đầu khuyến mãi (`promotion_start_date`) mới nhất, in trạng thái `MỚI` / `MỚI – đợt mới` / `ĐÃ VIẾT` / `ĐÃ BỎ QUA`, và ghi nội dung (đã chuyển HTML → text) của từng bài mới ra `<id>_<start>-<slug>.md`. `MỚI – đợt mới` kèm link bài blog của đợt trước. Dòng cuối là JSON các bài mới.

Không có bài MỚI → báo người dùng rồi dừng.

## Bước 2 — Đọc và chọn bài
1. Read từng file nội dung bài MỚI.
2. Đối chiếu `content/blog/`: khuyến mãi trùng chủ đề với bài đã có (vd cùng chương trình voucher tải app) → gợi ý **cập nhật bài cũ** thay vì viết bài mới.
3. Hỏi **một lần** bằng `AskUserQuestion` (multiSelect): viết bài nào. Mỗi lựa chọn ghi tiêu đề khuyến mãi + từ khoá dài đề xuất (vd "cách nhận ưu đãi Phúc Long khi quét ShopeePay").
4. Bài không được chọn → đánh dấu bỏ qua:
   ```bash
   node .claude/skills/shopeepay-khuyen-mai/fetch-promos.js --mark <id> --status skipped
   ```

## Bước 3 — Viết bài bằng `new-blog`
Với từng bài được chọn, invoke skill `new-blog` và làm theo đúng quy trình của nó, với đầu vào đã có sẵn (bỏ qua Bước 1 của new-blog):
- **Chủ đề / từ khoá:** như người dùng đã chọn ở Bước 2.
- **Nguồn:** link khuyến mãi + nội dung trong file đã tải (không cần WebFetch lại).

Lưu ý riêng cho bài khuyến mãi:
- Mức giảm, thời gian áp dụng, điều kiện, đối tác, phương thức thanh toán: **chép đúng số liệu từ nguồn**; không có trong nguồn thì không ghi.
- Viết lại theo góc hướng dẫn ("cách nhận…", "ưu đãi … có gì"), không sao chép nguyên văn; không tự xưng là trang chính thức của ShopeePay.
- Nêu rõ thời hạn chương trình và câu "ưu đãi có thể kết thúc sớm khi hết ngân sách, xem chi tiết trong ứng dụng ShopeePay".
- Không dùng ảnh gốc của khuyến mãi (có logo đối tác) — tự vẽ ảnh theo Bước 5 của new-blog.
- Nhiều bài → viết lần lượt từng bài; các bài cùng đợt có thể link nội bộ với nhau.
- Bài `MỚI – đợt mới`: viết bài mới cho đợt này (slug khác bài cũ, vd thêm tháng/năm), ghi rõ thời gian đợt mới, và link qua lại với bài đợt trước.

## Bước 4 — Cập nhật file check trùng
Chỉ sau khi bài đã qua `check-blog.js` và `npm test`:
```bash
node .claude/skills/shopeepay-khuyen-mai/fetch-promos.js --mark <id> --blog /blog/<slug>
```

## Bước 5 — Tổng kết
Liệt kê: bài mới viết (URL blog ↔ link khuyến mãi nguồn), bài bỏ qua, bài đã viết từ trước. Nhắc Request indexing trên Search Console sau khi deploy. Chỉ commit/push (gồm cả `processed.json`) khi người dùng đồng ý.

## Lỗi hay gặp
| Lỗi | Cách xử lý |
| --- | --- |
| Script báo HTTP lỗi / thiếu `articles` | Nguồn JSON đổi → mở bundle `https://shopeepay.vn/static/js/main.*.js` và các chunk, tìm `article_list_published.json` để lấy URL mới |
| `--mark` báo không tìm thấy id | Khuyến mãi đã hết hạn và bị gỡ khỏi danh sách; sửa tay `processed.json` nếu cần |
| `--mark` lưu sai đợt | `--mark` luôn lấy `promotion_start_date` hiện tại trong nguồn → chạy ngay sau khi viết xong, đừng để sang đợt sau |
| Viết bài xong quên `--mark` | Lần chạy sau bài vẫn hiện MỚI → kiểm tra `content/blog/` trước khi viết lại |
