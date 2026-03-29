const express = require('express');
require('./db'); // Initialize the MySQL pool on startup

const authRoutes     = require('./routes/auth');
const roadsideRoutes = require('./routes/roadsideRoutes');

const app = express();

// ── Middleware ──────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',     authRoutes);
app.use('/api/roadside', roadsideRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'CAAR backend running ✅' });
});

// ── Start server ───────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});