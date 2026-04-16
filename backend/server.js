const express = require('express');
const cors    = require('cors');

require('dotenv').config({ path: '../.env' });
require('./db');

const app = express(); // ✅ MUST BE HERE FIRST

// ── CORS ─────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Body parsers ─────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Route imports ────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const roadsideRoutes    = require('./routes/roadsideRoutes');
const dashboardRoutes   = require('./routes/dashboardRoutes');
const messageRoutes     = require('./routes/messageRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const claimsRoutes      = require('./routes/claimsRoutes');
const agencyRoutes      = require('./routes/agencyRoutes');
const contractsRoutes   = require('./routes/Contractsroutes');
const plansRoutes       = require('./routes/plansRoutes');
const catnatRoutes = require('./routes/catnatRoutes');
// ── Routes ───────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/roadside',     roadsideRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/messages',     messageRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/claims',       claimsRoutes);
app.use('/api/agencies',     agencyRoutes);
app.use('/api/contracts',    contractsRoutes);
app.use('/api/plans',        plansRoutes);
app.use('/api/catnat', catnatRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: 'CAAR backend running ✅' });
});

// ── Start ────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});