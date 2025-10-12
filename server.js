// server.js
const app = require('./app');

// Use Render-assigned port in production, or 5000 locally
const PORT = process.env.PORT || 5000;

// Detect environment (for logging)
const ENV = process.env.NODE_ENV || 'development';

// Base URL — helpful for logs and redirect generation
const BASE_URL =
  process.env.APP_URL ||
  (ENV === 'production'
    ? `https://unzagym.onrender.com`
    : `http://localhost:${PORT}`);

app.listen(PORT, () => {
  console.log(`🚀 UNZA Gym server running in ${ENV} mode`);
  console.log(`🌍 Accessible at: ${BASE_URL}`);
});
