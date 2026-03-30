const express = require('express');
const cors    = require('cors');
require('./db');

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const roadsideRoutes    = require('./routes/roadsideRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const messageRoutes     = require('./routes/messageRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const claimsRoutes      = require('./routes/claimsRoutes');      // ← NEW

const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/roadside',     roadsideRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/messages',     messageRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/claims',       claimsRoutes);                      // ← NEW

// ── Health check ───────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'CAAR backend running ✅' });
});

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});