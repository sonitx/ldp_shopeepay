const fs = require('fs');
const path = require('path');

// Trên Netlify Functions code được bundle lại nên __dirname không còn trỏ về thư mục gốc.
// Tìm thư mục gốc chứa `views/` (được copy vào function nhờ `included_files` trong netlify.toml).
const candidates = [
  process.env.LAMBDA_TASK_ROOT,
  process.cwd(),
  path.resolve(__dirname, '..', '..'),
].filter(Boolean);

const ROOT = candidates.find((dir) => fs.existsSync(path.join(dir, 'views'))) || process.cwd();

const isProd =
  process.env.NODE_ENV === 'production' || Boolean(process.env.LAMBDA_TASK_ROOT || process.env.NETLIFY);

module.exports = { ROOT, isProd };
