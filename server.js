// server.js
const app = require('./app');

// Render provides PORT automatically
const PORT = process.env.PORT || 10000; // fallback only if PORT not set

app.listen(PORT, () => {
  console.log(`🚀 Server running live at: https://unzagym.onrender.com`);
});
