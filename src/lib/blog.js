const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const { ROOT, isProd } = require('./paths');
const { renderMarkdown } = require('./markdown');
const slugify = require('./slugify');

const CONTENT_DIR = path.join(ROOT, 'content', 'blog');
const WORDS_PER_MINUTE = 220;

let cache = null;

function toDate(value, fallback) {
  const d = value ? new Date(value) : fallback;
  return Number.isNaN(d.getTime()) ? fallback : d;
}

function parsePost(file) {
  const fullPath = path.join(CONTENT_DIR, file);
  const raw = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(raw);
  const stat = fs.statSync(fullPath);

  // "2026-01-15-ten-bai-viet.md" -> "ten-bai-viet"
  const slug = data.slug || slugify(file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, ''));
  const { html, toc, text } = renderMarkdown(content);
  const words = text.split(/\s+/).filter(Boolean).length;
  const date = toDate(data.date, stat.mtime);
  const tags = (Array.isArray(data.tags) ? data.tags : data.tags ? [data.tags] : []).map(String);

  return {
    slug,
    url: `/blog/${slug}`,
    title: data.title || slug,
    description: data.description || text.slice(0, 160).trim(),
    date,
    updated: toDate(data.updated, date),
    author: data.author || null,
    image: data.image || null,
    tags: tags.map((name) => ({ name, slug: slugify(name) })),
    draft: Boolean(data.draft),
    readingTime: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    html,
    toc,
  };
}

/** Tất cả bài viết (mới nhất trước). Trên production bài `draft: true` bị ẩn. Cache khi chạy production. */
function getAllPosts() {
  if (cache && isProd) return cache;
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const posts = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .map(parsePost)
    .filter((p) => !(isProd && p.draft))
    .sort((a, b) => b.date - a.date);

  cache = posts;
  return posts;
}

function getPost(slug) {
  const posts = getAllPosts();
  const index = posts.findIndex((p) => p.slug === slug);
  if (index === -1) return null;
  return { post: posts[index], newer: posts[index - 1] || null, older: posts[index + 1] || null };
}

function getTags() {
  const map = new Map();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      const entry = map.get(tag.slug) || { ...tag, count: 0 };
      entry.count += 1;
      map.set(tag.slug, entry);
    }
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

function getPostsByTag(tagSlug) {
  return getAllPosts().filter((p) => p.tags.some((t) => t.slug === tagSlug));
}

module.exports = { getAllPosts, getPost, getTags, getPostsByTag };
