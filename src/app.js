const path = require('path');
const express = require('express');
const ejs = require('ejs');
const site = require('../site.config');
const { ROOT, isProd } = require('./lib/paths');
const blog = require('./lib/blog');
const seo = require('./lib/seo');
const { validateLead } = require('./lib/lead');
const { isTelegramConfigured, notifyNewLead, notifyAppDownload } = require('./lib/telegram');
const download = require('./lib/download');

const app = express();
const FUNCTION_PREFIX = '/.netlify/functions/server';

// Đăng ký engine trực tiếp (không để Express tự require động) để esbuild của Netlify bundle được.
app.engine('ejs', ejs.__express);
app.set('view engine', 'ejs');
app.set('views', path.join(ROOT, 'views'));
app.set('trust proxy', true);
app.disable('x-powered-by');

// Netlify có thể chuyển request tới function kèm prefix — bỏ đi để routing như bình thường.
app.use((req, res, next) => {
  if (req.url.startsWith(FUNCTION_PREFIX)) req.url = req.url.slice(FUNCTION_PREFIX.length) || '/';
  next();
});

app.use((req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'X-Frame-Options': 'SAMEORIGIN',
  });
  res.locals.site = site;
  res.locals.currentPath = req.path;
  res.locals.formatDate = (d) => d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  next();
});

// Khi deploy, Netlify CDN phục vụ thư mục public/ trực tiếp. Dòng này dành cho chạy local.
app.use(express.static(path.join(ROOT, 'public'), { maxAge: isProd ? '1d' : 0 }));

// Nội dung blog chỉ đổi khi deploy (mỗi lần deploy Netlify tự xoá cache) → cache trên CDN.
function cacheOnCdn(res) {
  res.set('Cache-Control', 'public, max-age=0, must-revalidate');
  res.set('Netlify-CDN-Cache-Control', 'public, durable, s-maxage=3600, stale-while-revalidate=86400');
}

// ---------- Trang chủ (landing page) ----------
app.get('/', (req, res) => {
  const jsonLd = [seo.organizationLd(), seo.websiteLd()];
  if (site.landing.faq && site.landing.faq.length) jsonLd.push(seo.faqLd(site.landing.faq));
  res.render('index', {
    seo: seo.buildSeo({ path: '/', jsonLd }),
    latestPosts: blog.getAllPosts().slice(0, 3),
    leadStatus: req.query.lead || null,
  });
});

// ---------- Blog ----------
app.get('/blog', (req, res) => {
  const all = blog.getAllPosts();
  const perPage = site.blog.postsPerPage;
  const totalPages = Math.max(1, Math.ceil(all.length / perPage));
  const page = Math.min(Math.max(1, parseInt(req.query.page, 10) || 1), totalPages);
  cacheOnCdn(res);
  res.render('blog/list', {
    seo: seo.buildSeo({
      title: page > 1 ? `${site.blog.title} — Trang ${page}` : site.blog.title,
      description: site.blog.description,
      path: page > 1 ? `/blog?page=${page}` : '/blog',
      jsonLd: [seo.breadcrumbLd([{ name: 'Trang chủ', path: '/' }, { name: site.blog.title, path: '/blog' }])],
    }),
    heading: site.blog.title,
    intro: site.blog.description,
    posts: all.slice((page - 1) * perPage, page * perPage),
    tags: blog.getTags(),
    activeTag: null,
    pagination: { page, totalPages, baseUrl: '/blog' },
  });
});

app.get('/blog/tags/:tag', (req, res, next) => {
  const tag = blog.getTags().find((t) => t.slug === req.params.tag);
  if (!tag) return next();
  const tagPath = `/blog/tags/${tag.slug}`;
  cacheOnCdn(res);
  res.render('blog/list', {
    seo: seo.buildSeo({
      title: `Chủ đề: ${tag.name}`,
      description: `Các bài viết về ${tag.name} trên ${site.name}.`,
      path: tagPath,
      jsonLd: [
        seo.breadcrumbLd([
          { name: 'Trang chủ', path: '/' },
          { name: site.blog.title, path: '/blog' },
          { name: tag.name, path: tagPath },
        ]),
      ],
    }),
    heading: `Chủ đề: ${tag.name}`,
    intro: `${tag.count} bài viết`,
    posts: blog.getPostsByTag(tag.slug),
    tags: blog.getTags(),
    activeTag: tag.slug,
    pagination: null,
  });
});

app.get('/blog/:slug', (req, res, next) => {
  const found = blog.getPost(req.params.slug);
  if (!found) return next();
  const { post, newer, older } = found;
  cacheOnCdn(res);
  res.render('blog/post', {
    seo: seo.buildSeo({
      title: post.title,
      description: post.description,
      path: post.url,
      image: post.image,
      type: 'article',
      noindex: post.draft,
      article: {
        publishedTime: post.date.toISOString(),
        modifiedTime: post.updated.toISOString(),
        tags: post.tags.map((t) => t.name),
      },
      jsonLd: [
        seo.blogPostingLd(post),
        seo.breadcrumbLd([
          { name: 'Trang chủ', path: '/' },
          { name: site.blog.title, path: '/blog' },
          { name: post.title, path: post.url },
        ]),
      ],
    }),
    post,
    newer,
    older,
  });
});

// ---------- SEO files ----------
app.get('/sitemap.xml', (req, res) => {
  cacheOnCdn(res);
  res.type('application/xml').send(seo.sitemapXml(blog.getAllPosts(), blog.getTags()));
});

app.get('/rss.xml', (req, res) => {
  cacheOnCdn(res);
  res.type('application/rss+xml').send(seo.rssXml(blog.getAllPosts()));
});

app.get('/robots.txt', (req, res) => {
  res.type('text/plain').send(seo.robotsTxt());
});

// ---------- API: khách hàng để lại thông tin → Telegram ----------
app.post(
  '/api/lead',
  express.json({ limit: '10kb' }),
  express.urlencoded({ extended: false, limit: '10kb' }),
  async (req, res) => {
    const wantsJson = req.is('application/json');
    const reply = (status, body) =>
      wantsJson ? res.status(status).json(body) : res.redirect(303, `/?lead=${body.ok ? 'success' : 'error'}#dang-ky`);

    if (!site.features.leadForm) return reply(404, { ok: false, message: 'Not found' });

    const body = req.body || {};
    // Honeypot chống bot spam: trường ẩn "website" phải để trống.
    if (body.website) return reply(200, { ok: true, message: site.lead.successMessage });

    const { lead, errors } = validateLead(body);
    if (Object.keys(errors).length) return reply(400, { ok: false, errors, message: 'Thông tin chưa hợp lệ' });

    lead.source = req.get('referer') || site.siteUrl;
    try {
      if (isTelegramConfigured()) {
        await notifyNewLead(lead);
      } else if (isProd) {
        throw new Error('Telegram chưa được cấu hình trên môi trường production');
      } else {
        console.warn('[lead] Telegram chưa cấu hình — chỉ log ra console:', lead);
      }
      return reply(200, { ok: true, message: site.lead.successMessage });
    } catch (err) {
      console.error('[lead] Gửi Telegram thất bại:', err.message);
      return reply(502, { ok: false, message: site.lead.errorMessage });
    }
  }
);

// ---------- API: khách nhấn nút "Tải ứng dụng" → Telegram ----------
// Trình duyệt gửi bằng navigator.sendBeacon nên không cần chờ phản hồi; luôn trả 204.
app.post(
  '/api/download-click',
  express.urlencoded({ extended: false, limit: '2kb' }),
  express.json({ limit: '2kb' }),
  async (req, res) => {
    const ua = req.get('user-agent') || '';
    const body = req.body || {};
    // Chỉ nhận request từ chính website (trình duyệt gửi Sec-Fetch-Site / Origin khi sendBeacon).
    const fetchSite = req.get('sec-fetch-site');
    const crossSite = fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'same-site';
    if (crossSite || download.BOT_UA.test(ua) || !download.shouldNotify(req.ip)) return res.status(204).end();

    const click = {
      placement: download.PLACEMENTS[body.placement] || 'Khác',
      device: download.detectDevice(ua),
      source: String(body.page || req.get('referer') || site.siteUrl).slice(0, 300),
      url: site.appDownload.url,
    };
    try {
      if (isTelegramConfigured()) {
        await notifyAppDownload(click);
      } else {
        console.warn('[download] Telegram chưa cấu hình — chỉ log ra console:', click);
      }
    } catch (err) {
      console.error('[download] Gửi Telegram thất bại:', err.message);
    }
    res.status(204).end();
  }
);

// ---------- 404 & lỗi ----------
app.use((req, res) => {
  res.status(404).render('404', { seo: seo.buildSeo({ title: 'Không tìm thấy trang', path: req.path, noindex: true }) });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Đã có lỗi xảy ra. Vui lòng thử lại sau.');
});

module.exports = app;
