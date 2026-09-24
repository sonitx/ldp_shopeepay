// Netlify Function: toàn bộ request (trừ file tĩnh trong public/) được render bởi Express app.
const serverless = require('serverless-http');
const app = require('../../src/app');

module.exports.handler = serverless(app);
