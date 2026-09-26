#!/usr/bin/env node
// Lấy khuyến mãi mới nhất từ shopeepay.vn/khuyen-mai và check trùng với processed.json.
//   node fetch-promos.js [--limit 5] [--out <dir>]
//   node fetch-promos.js --mark <id> [--blog /blog/<slug>] [--status written|skipped]
const fs = require('fs');
const os = require('os');
const path = require('path');

const LIST_URL = 'https://deo.shopeemobile.com/shopee/shopeepay-website/article_list_published.json';
const IMAGE_BASE = 'https://deo.shopeemobile.com/shopee/shopeepay-website/';
const ARTICLE_BASE = 'https://shopeepay.vn/khuyen-mai-dang-dien-ra/';
const PROCESSED = path.join(__dirname, 'processed.json');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const key = argv[i].slice(2);
    const next = argv[i + 1];
    args[key] = next && !next.startsWith('--') ? argv[++i] : true;
  }
  return args;
}

function loadProcessed() {
  try {
    return JSON.parse(fs.readFileSync(PROCESSED, 'utf8'));
  } catch {
    return { articles: {} };
  }
}

async function fetchArticles() {
  const res = await fetch(LIST_URL, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!res.ok) throw new Error(`Không tải được danh sách khuyến mãi: HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data.articles)) throw new Error('JSON khuyến mãi không có mảng "articles" — cấu trúc nguồn đã đổi?');
  return data.articles;
}

// Entity Latin-1 + dấu câu hay gặp trong nội dung TinyMCE của shopeepay.vn
const LATIN1 = 'nbsp iexcl cent pound curren yen brvbar sect uml copy ordf laquo not shy reg macr deg plusmn sup2 sup3 acute micro para middot cedil sup1 ordm raquo frac14 frac12 frac34 iquest Agrave Aacute Acirc Atilde Auml Aring AElig Ccedil Egrave Eacute Ecirc Euml Igrave Iacute Icirc Iuml ETH Ntilde Ograve Oacute Ocirc Otilde Ouml times Oslash Ugrave Uacute Ucirc Uuml Yacute THORN szlig agrave aacute acirc atilde auml aring aelig ccedil egrave eacute ecirc euml igrave iacute icirc iuml eth ntilde ograve oacute ocirc otilde ouml divide oslash ugrave uacute ucirc uuml yacute thorn yuml'.split(' ');
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'",
  ndash: '–', mdash: '—', lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', hellip: '…', bull: '•', rarr: '→', larr: '←',
};
LATIN1.forEach((name, i) => { ENTITIES[name] = String.fromCharCode(160 + i); });

function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z0-9]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e] ?? m;
  });
}

function htmlToText(html) {
  return decodeEntities(
    html
      .replace(/\r/g, '')
      .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
      .replace(/<a\s[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<li[^>]*>/gi, '\n- ')
      .replace(/<\/(p|div|h[1-6]|tr|ul|ol|table)>/gi, '\n')
      .replace(/<\/(td|th)>/gi, '\n')
      .replace(/<[^>]+>/g, '')
  )
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/ *\n */g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const fmtDate = (ts) => (ts ? new Date(ts * 1000).toISOString().slice(0, 10) : '');
const sourceUrl = (a) => ARTICLE_BASE + a.url;
// Cùng id nhưng khác ngày bắt đầu = đợt khuyến mãi mới → viết bài mới
const promoKey = (a) => `${a.id}_${a.promotion_start_date || 0}`;

async function list(args) {
  const limit = Number(args.limit) || 5;
  const outDir = typeof args.out === 'string' ? args.out : path.join(os.tmpdir(), 'shopeepay-khuyen-mai');
  const processed = loadProcessed().articles;

  const latest = (await fetchArticles())
    .sort((a, b) => (b.promotion_start_date || 0) - (a.promotion_start_date || 0) || (b.created_at || 0) - (a.created_at || 0))
    .slice(0, limit);

  fs.mkdirSync(outDir, { recursive: true });
  const fresh = [];
  const label = { written: 'ĐÃ VIẾT', skipped: 'ĐÃ BỎ QUA' };

  console.log(`${limit} khuyến mãi mới nhất trên shopeepay.vn/khuyen-mai:\n`);
  for (const a of latest) {
    const done = processed[promoKey(a)];
    const earlier = done ? [] : Object.values(processed).filter((p) => p.id === a.id && p.blog);
    const status = done ? label[done.status] || done.status : earlier.length ? 'MỚI – đợt mới' : 'MỚI';
    console.log(`[${status}] #${a.id} ${a.title.trim()}`);
    console.log(`    đăng ${fmtDate(a.created_at)} · bắt đầu ${fmtDate(a.promotion_start_date)} · ${sourceUrl(a)}`);
    if (done?.blog) console.log(`    → ${done.blog}`);
    for (const p of earlier) console.log(`    đợt trước (bắt đầu ${p.promotionStartDate}): ${p.blog}`);
    if (done) continue;

    const file = path.join(outDir, `${promoKey(a)}-${a.url}.md`);
    fs.writeFileSync(
      file,
      [
        `# ${a.title.trim()}`,
        '',
        `- ID: ${a.id}`,
        `- Nguồn: ${sourceUrl(a)}`,
        `- Ảnh: ${IMAGE_BASE}${a.image}`,
        `- Ngày đăng: ${fmtDate(a.created_at)}`,
        `- Ngày bắt đầu khuyến mãi: ${fmtDate(a.promotion_start_date)}`,
        ...earlier.map((p) => `- Bài blog đợt trước (bắt đầu ${p.promotionStartDate}): ${p.blog}`),
        '',
        '## Nội dung',
        '',
        htmlToText(a.description || ''),
        '',
      ].join('\n')
    );
    console.log(`    nội dung: ${file}`);
    fresh.push({ id: a.id, promotionStartDate: fmtDate(a.promotion_start_date), title: a.title.trim(), url: sourceUrl(a), file, earlierBlogs: earlier.map((p) => p.blog) });
  }

  console.log(`\n${fresh.length} bài mới.`);
  console.log(JSON.stringify(fresh));
}

async function mark(args) {
  const id = String(args.mark);
  const status = typeof args.status === 'string' ? args.status : 'written';
  if (!['written', 'skipped'].includes(status)) throw new Error('--status phải là written hoặc skipped');
  if (status === 'written' && typeof args.blog !== 'string') throw new Error('Cần --blog /blog/<slug> khi đánh dấu đã viết');

  const article = (await fetchArticles()).find((a) => String(a.id) === id);
  if (!article) throw new Error(`Không tìm thấy khuyến mãi #${id} trong danh sách đang diễn ra`);

  const data = loadProcessed();
  const key = promoKey(article);
  data.articles[key] = {
    id: article.id,
    promotionStartDate: fmtDate(article.promotion_start_date),
    slug: article.url,
    title: article.title.trim(),
    sourceUrl: sourceUrl(article),
    ...(status === 'written' && { blog: args.blog }),
    status,
    date: new Date().toISOString().slice(0, 10),
  };
  fs.writeFileSync(PROCESSED, JSON.stringify(data, null, 2) + '\n');
  console.log(`Đã lưu ${key} (${status}) vào ${path.relative(process.cwd(), PROCESSED)}`);
}

const args = parseArgs(process.argv.slice(2));
(args.mark ? mark(args) : list(args)).catch((err) => {
  console.error(err.message);
  process.exit(1);
});
