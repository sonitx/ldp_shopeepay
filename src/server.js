// Chạy local: `npm run dev` → http://localhost:3000
try {
  process.loadEnvFile('.env');
} catch {
  // không có file .env — bỏ qua
}

const app = require('./app');

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`▶ http://localhost:${port}`);
});
