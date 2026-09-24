const MarkdownIt = require('markdown-it');
const markdownItAnchor = require('markdown-it-anchor');
const hljs = require('highlight.js');
const slugify = require('./slugify');

const anchor = markdownItAnchor.default || markdownItAnchor;

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: false,
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    }
    return ''; // markdown-it tự escape
  },
});

md.use(anchor, {
  level: [2, 3, 4],
  slugify,
  permalink: anchor.permalink.linkInsideHeader({
    symbol: '#',
    placement: 'after',
    ariaHidden: true,
    class: 'heading-anchor',
  }),
});

// Ảnh: lazy-load để tăng tốc độ tải trang (Core Web Vitals).
const defaultImage = md.renderer.rules.image;
md.renderer.rules.image = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('loading', 'lazy');
  tokens[idx].attrSet('decoding', 'async');
  return defaultImage(tokens, idx, options, env, self);
};

// Link ngoài: mở tab mới + rel an toàn.
const defaultLinkOpen =
  md.renderer.rules.link_open || ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const href = tokens[idx].attrGet('href') || '';
  if (/^https?:\/\//i.test(href)) {
    tokens[idx].attrSet('target', '_blank');
    tokens[idx].attrSet('rel', 'noopener noreferrer');
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

/** Render markdown → { html, toc, text } (toc gồm các heading h2/h3 để làm mục lục như Docusaurus). */
function renderMarkdown(source) {
  const env = {};
  const tokens = md.parse(source, env);
  const toc = [];
  const textParts = [];

  tokens.forEach((token, i) => {
    if (token.type === 'heading_open' && (token.tag === 'h2' || token.tag === 'h3')) {
      const inline = tokens[i + 1];
      const text = inline.children
        .filter((t) => t.type === 'text' || t.type === 'code_inline')
        .map((t) => t.content)
        .join('');
      toc.push({ id: token.attrGet('id'), text, level: Number(token.tag.slice(1)) });
    }
    if (token.type === 'inline' && tokens[i - 1] && tokens[i - 1].type === 'paragraph_open') {
      textParts.push(token.children.filter((t) => t.type === 'text').map((t) => t.content).join(''));
    }
  });

  return { html: md.renderer.render(tokens, md.options, env), toc, text: textParts.join(' ') };
}

module.exports = { renderMarkdown };
