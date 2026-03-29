const express = require('express');
const cors = require('cors');
require('./db');

const authRoutes     = require('./routes/auth');
const roadsideRoutes = require('./routes/roadsideRoutes');

const app = express();

// ── CORS (VERY IMPORTANT) ───────────────────────────────────
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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