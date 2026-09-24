// Kiểm tra nhanh: gọi thẳng Netlify Function handler với các request giả lập. `npm test`
const assert = require('assert');
const { handler } = require('../netlify/functions/server');
const site = require('../site.config');

function call(path, { method = 'GET', body, headers = {} } = {}) {
  const [pathname, query = ''] = path.split('?');
  return handler(
    {
      httpMethod: method,
      path: pathname,
      rawQuery: query,
      queryStringParameters: Object.fromEntries(new URLSearchParams(query)),
      headers: { host: 'localhost', ...headers },
      body: body || null,
      isBase64Encoded: false,
    },
    {}
  );
}

const checks = [
  ['GET /', async () => {
    const res = await call('/');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.body, /<link rel="canonical"/);
    assert.match(res.body, /application\/ld\+json/);
    if (site.analytics.gaMeasurementId) assert.match(res.body, new RegExp(site.analytics.gaMeasurementId));
    if (site.seo.googleSiteVerification) assert.match(res.body, /google-site-verification/);
    assert.strictEqual(/data-lead-form/.test(res.body), Boolean(site.features.leadForm), 'lead form hiển thị sai cấu hình');
    const downloads = res.body.match(/<a [^>]*data-download="[^"]+"[^>]*>/g) || [];
    assert.ok(downloads.length >= 6, `cần nhiều nút "Tải ứng dụng", thấy ${downloads.length}`);
    downloads.forEach((a) => {
      assert.ok(a.includes(`href="${site.appDownload.url}"`), 'nút tải sai link');
      assert.ok(a.includes('target="_blank"'), 'nút tải phải mở tab mới');
    });
    assert.match(res.body, /\/js\/download\.js/);
  }],
  ['POST /api/download-click', async () => {
    // Đã có Telegram thì giả làm bot để không gửi thông báo "khách tải app" giả.
    const ua = process.env.TELEGRAM_BOT_TOKEN ? 'SmokeTest bot' : 'SmokeTest (Android)';
    const res = await call('/api/download-click', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', 'sec-fetch-site': 'same-origin', 'user-agent': ua },
      body: 'placement=hero&page=' + encodeURIComponent(site.siteUrl + '/'),
    });
    assert.strictEqual(res.statusCode, 204);
  }],
  ['GET /blog', async () => {
    const res = await call('/blog');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.body, /post-card/);
  }],
  ['GET /blog/:slug', async () => {
    const res = await call('/blog/huong-dan-dang-ky-shopeepay');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.body, /BlogPosting/);
    assert.match(res.body, /class="toc"/);
    assert.match(res.body, /data-download="blog"/);
  }],
  ['GET với prefix function', async () => {
    const res = await call('/.netlify/functions/server/blog');
    assert.strictEqual(res.statusCode, 200);
  }],
  ['GET /blog/tags/:tag', async () => {
    const res = await call('/blog/tags/huong-dan');
    assert.strictEqual(res.statusCode, 200);
  }],
  ['GET /sitemap.xml', async () => {
    const res = await call('/sitemap.xml');
    assert.strictEqual(res.statusCode, 200);
    assert.match(res.body, /<urlset/);
    assert.match(res.body, /\/blog\/shopeepay-la-gi/);
  }],
  ['GET /robots.txt', async () => {
    const res = await call('/robots.txt');
    assert.match(res.body, /Sitemap: /);
  }],
  ['GET /rss.xml', async () => {
    const res = await call('/rss.xml');
    assert.match(res.body, /<rss/);
  }],
  ['GET 404', async () => {
    const res = await call('/khong-ton-tai');
    assert.strictEqual(res.statusCode, 404);
  }],
  ['POST /api/lead dữ liệu sai', async () => {
    const res = await call('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: '', phone: 'abc', address: '' }),
    });
    assert.strictEqual(res.statusCode, site.features.leadForm ? 400 : 404);
  }],
];

if (site.features.leadForm && !process.env.TELEGRAM_BOT_TOKEN) {
  checks.push(['POST /api/lead hợp lệ (Telegram chưa cấu hình → chỉ log)', async () => {
    const res = await call('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ fullName: 'Nguyễn Văn A', phone: '0912 345 678', address: '1 Lê Lợi, Q1, TP.HCM' }),
    });
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(JSON.parse(res.body).ok, true);
  }]);
}

(async () => {
  let failed = 0;
  for (const [name, fn] of checks) {
    try {
      await fn();
      console.log(`✔ ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`✘ ${name}\n  ${err.message}`);
    }
  }
  console.log(failed ? `\n${failed} kiểm tra thất bại` : '\nTất cả kiểm tra đều đạt');
  process.exit(failed ? 1 : 0);
})();
