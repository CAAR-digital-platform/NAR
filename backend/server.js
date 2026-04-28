const express = require('express');
const cors = require('cors');

require('dotenv').config({ path: '../.env' });
require('./db');

const app = express();

const LOCAL_ORIGIN_RE = /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/;

app.use(cors({
  origin(origin, callback) {
    if (!origin || LOCAL_ORIGIN_RE.test(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error('Origin not allowed by CORS: ' + origin));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authRoutes              = require('./routes/authRoutes');
const roadsideRoutes          = require('./routes/roadsideRoutes');
const dashboardRoutes         = require('./routes/dashboardRoutes');
const messageRoutes           = require('./routes/messageRoutes');
const applicationRoutes       = require('./routes/applicationRoutes');
const claimsRoutes            = require('./routes/claimsRoutes');
const agencyRoutes            = require('./routes/agencyRoutes');
const contractsRoutes         = require('./routes/contractsRoutes');
const plansRoutes             = require('./routes/plansRoutes');
const catnatRoutes            = require('./routes/catnatRoutes');
const assuranceRoutes         = require('./routes/assuranceRoutes');
const notificationRoutes      = require('./routes/notificationRoutes');
const adminRoutes             = require('./routes/adminRoutes');
const newsRoutes              = require('./routes/newsRoutes');
const homepageProductRoutes   = require('./routes/homepageProductRoutes');

const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth',               authRoutes);
app.use('/api/roadside',           roadsideRoutes);
app.use('/api/dashboard',          dashboardRoutes);
app.use('/api/messages',           messageRoutes);
app.use('/api/applications',       applicationRoutes);
app.use('/api/claims',             claimsRoutes);
app.use('/api/agencies',           agencyRoutes);
app.use('/api/contracts',          contractsRoutes);
app.use('/api/plans',              plansRoutes);
app.use('/api/catnat',             catnatRoutes);
app.use('/api/assurances',         assuranceRoutes);
app.use('/api/notifications',      notificationRoutes);
app.use('/api/admin',              adminRoutes);
app.use('/api/news',               newsRoutes);
app.use('/api/homepage-products',  homepageProductRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});