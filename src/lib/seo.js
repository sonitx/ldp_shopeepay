const site = require('../../site.config');

const absUrl = (p = '/') => (/^https?:\/\//.test(p) ? p : `${site.siteUrl.replace(/\/$/, '')}${p}`);

/** Chuẩn hoá thông tin SEO cho từng trang (dùng trong views/partials/head.ejs). */
function buildSeo({ title, description, path = '/', image, type = 'website', jsonLd = [], noindex = false, article } = {}) {
  return {
    title: title || site.name,
    fullTitle: title ? `${title} | ${site.name}` : `${site.name} — ${site.tagline}`,
    description: description || site.description,
    canonical: absUrl(path),
    image: absUrl(image || site.ogImage),
    type,
    article,
    noindex,
    jsonLd,
  };
}

const organizationLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: site.name,
  url: absUrl('/'),
  logo: absUrl(site.logo),
  sameAs: Object.values(site.social || {}).filter(Boolean),
});

const websiteLd = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: site.name,
  url: absUrl('/'),
  inLanguage: site.lang,
});

const faqLd = (faq) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faq.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
});

const blogPostingLd = (post) => ({
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: post.title,
  description: post.description,
  image: absUrl(post.image || site.ogImage),
  datePublished: post.date.toISOString(),
  dateModified: post.updated.toISOString(),
  author: { '@type': 'Person', name: post.author || site.author },
  publisher: { '@type': 'Organization', name: site.name, logo: { '@type': 'ImageObject', url: absUrl(site.logo) } },
  mainEntityOfPage: absUrl(post.url),
  keywords: post.tags.map((t) => t.name).join(', '),
  inLanguage: site.lang,
});

const breadcrumbLd = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: item.name,
    item: absUrl(item.path),
  })),
});

const escapeXml = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

function sitemapXml(posts, tags) {
  const urls = [
    { loc: absUrl('/'), priority: '1.0' },
    { loc: absUrl('/blog'), lastmod: posts[0] && posts[0].updated, priority: '0.8' },
    ...posts.map((p) => ({ loc: absUrl(p.url), lastmod: p.updated, priority: '0.7' })),
    ...tags.map((t) => ({ loc: absUrl(`/blog/tags/${t.slug}`), priority: '0.3' })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${u.lastmod.toISOString()}</lastmod>` : ''}<priority>${u.priority}</priority></url>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function rssXml(posts) {
  const items = posts
    .slice(0, 20)
    .map(
      (p) => `    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${absUrl(p.url)}</link>
      <guid isPermaLink="true">${absUrl(p.url)}</guid>
      <pubDate>${p.date.toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(`${site.blog.title} | ${site.name}`)}</title>
    <link>${absUrl('/blog')}</link>
    <atom:link href="${absUrl('/rss.xml')}" rel="self" type="application/rss+xml" />
    <description>${escapeXml(site.blog.description)}</description>
    <language>${site.lang}</language>
${items}
  </channel>
</rss>
`;
}

function robotsTxt() {
  return `User-agent: *\nAllow: /\nDisallow: /api/\n\nSitemap: ${absUrl('/sitemap.xml')}\n`;
}

module.exports = {
  absUrl,
  buildSeo,
  organizationLd,
  websiteLd,
  faqLd,
  blogPostingLd,
  breadcrumbLd,
  sitemapXml,
  rssXml,
  robotsTxt,
};
