#!/usr/bin/env node
// Kiểm tra các bài blog trong content/blog/ trước khi deploy.
// Chạy từ thư mục gốc project: node .claude/skills/new-blog/check-blog.js
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SVG_DIR = path.join(PUBLIC_DIR, 'images', 'blog', 'src');
const MAX_IMAGE_BYTES = 200 * 1024;
const COVER = { width: 1200, height: 630 };

let matter, slugify;
try {
  matter = require(path.join(ROOT, 'node_modules', 'gray-matter'));
  slugify = require(path.join(ROOT, 'src', 'lib', 'slugify'));
} catch (err) {
  console.error('Hãy chạy từ thư mục gốc project (đã `npm install`). ' + err.message);
  process.exit(2);
}

const errors = [];
const warnings = [];
const err = (file, msg) => errors.push(`${file}: ${msg}`);
const warn = (file, msg) => warnings.push(`${file}: ${msg}`);

/** Kích thước PNG đọc từ header IHDR (không cần thư viện). */
function pngSize(file) {
  const buf = Buffer.alloc(24);
  const fd = fs.openSync(file, 'r');
  fs.readSync(fd, buf, 0, 24, 0);
  fs.closeSync(fd);
  if (buf.toString('ascii', 1, 4) !== 'PNG') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

/** Kiểm tra một ảnh cục bộ; trả về kích thước nếu là PNG. */
function checkImage(file, src, label) {
  if (!src.startsWith('/')) {
    warn(file, `${label} "${src}" không phải đường dẫn nội bộ — bỏ qua kiểm tra`);
    return null;
  }
  const full = path.join(PUBLIC_DIR, src.split(/[?#]/)[0]);
  if (!fs.existsSync(full)) {
    err(file, `${label} không tồn tại: public${src}`);
    return null;
  }
  const bytes = fs.statSync(full).size;
  if (bytes > MAX_IMAGE_BYTES) err(file, `${label} nặng ${Math.round(bytes / 1024)}KB (tối đa ${MAX_IMAGE_BYTES / 1024}KB): ${src}`);
  return full.endsWith('.png') ? pngSize(full) : null;
}

if (!fs.existsSync(CONTENT_DIR)) {
  console.error('Không thấy thư mục content/blog/');
  process.exit(2);
}

const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md') && !f.startsWith('_'));
const posts = files.map((file) => {
  const { data, content } = matter(fs.readFileSync(path.join(CONTENT_DIR, file), 'utf8'));
  const slug = data.slug || slugify(file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
  const tags = (Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : []).map((t) => slugify(String(t)));
  return { file, slug, data, content, tags };
});
const slugs = new Set(posts.map((p) => p.slug));
const tagSlugs = new Set(posts.flatMap((p) => p.tags));

const seen = new Map();
for (const { file, slug, data, content } of posts) {
  if (seen.has(slug)) err(file, `trùng slug "${slug}" với ${seen.get(slug)}`);
  seen.set(slug, file);

  // Front matter
  const title = String(data.title || '');
  const desc = String(data.description || '');
  if (!title) err(file, 'thiếu title');
  else if (title.length > 65) err(file, `title dài ${title.length} ký tự (nên 50–60, tối đa 65)`);
  else if (title.length < 30) warn(file, `title ngắn ${title.length} ký tự (nên 50–60)`);
  if (!desc) err(file, 'thiếu description');
  else if (desc.length < 110 || desc.length > 170) err(file, `description dài ${desc.length} ký tự (nên 120–160)`);
  if (!data.date || Number.isNaN(new Date(data.date).getTime())) err(file, 'thiếu hoặc sai date (YYYY-MM-DD)');
  if (!data.tags || (Array.isArray(data.tags) && data.tags.length === 0)) warn(file, 'chưa có tags');

  // Ảnh bìa
  if (!data.image) err(file, 'thiếu image (ảnh bìa 1200×630)');
  else {
    const size = checkImage(file, String(data.image), 'ảnh bìa');
    if (size && (size.width !== COVER.width || size.height !== COVER.height)) {
      err(file, `ảnh bìa ${size.width}×${size.height}, cần ${COVER.width}×${COVER.height}`);
    }
  }

  // Ảnh trong bài
  const images = [...content.matchAll(/!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g)];
  if (images.length === 0) warn(file, 'chưa có ảnh minh hoạ trong bài');
  for (const [, alt, src] of images) {
    if (!alt.trim()) err(file, `ảnh thiếu alt text: ${src}`);
    const size = checkImage(file, src, 'ảnh trong bài');
    if (size && Math.abs(size.width / size.height - 16 / 9) > 0.02) {
      warn(file, `ảnh trong bài ${size.width}×${size.height} không phải 16:9 (nên 1200×675): ${src}`);
    }
  }

  // Link nội bộ
  const body = content.replace(/```[\s\S]*?```/g, '');
  for (const [, target] of body.matchAll(/\]\((\/blog\/[^)\s#?]+)/g)) {
    const tag = target.match(/^\/blog\/tags\/(.+)$/);
    if (tag ? !tagSlugs.has(tag[1]) : !slugs.has(target.replace(/^\/blog\//, ''))) {
      err(file, `link nội bộ hỏng: ${target}`);
    }
  }
  if (posts.length > 1 && !/\]\(\/blog\//.test(body)) warn(file, 'chưa có link nội bộ tới bài khác');
}

// Emoji trong SVG nguồn → rsvg-convert render lỗi
if (fs.existsSync(SVG_DIR)) {
  for (const f of fs.readdirSync(SVG_DIR).filter((x) => x.endsWith('.svg'))) {
    if (/\p{Extended_Pictographic}/u.test(fs.readFileSync(path.join(SVG_DIR, f), 'utf8'))) {
      err(`public/images/blog/src/${f}`, 'có emoji — rsvg-convert sẽ render lỗi, hãy vẽ bằng hình khối');
    }
  }
}

console.log(`Đã kiểm tra ${posts.length} bài viết.`);
if (warnings.length) console.log(`\n⚠ Cảnh báo (${warnings.length}):\n  ` + warnings.join('\n  '));
if (errors.length) console.log(`\n✘ Lỗi (${errors.length}):\n  ` + errors.join('\n  '));
console.log(errors.length ? '\nCần sửa các lỗi trên.' : '\n✔ Không có lỗi.');
process.exit(errors.length ? 1 : 0);
