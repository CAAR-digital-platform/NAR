/**
 * routes/dashboardRoutes.js
 *
 * Exposes BOTH paths so the existing frontend (calls /api/dashboard/stats)
 * and any future clients (calling /api/dashboard) both work.
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl           = require('../controllers/dashboardController');

// GET /api/dashboard          (canonical backend path)
router.get('/', authMiddleware, ctrl.getDashboard);

// GET /api/dashboard/stats    (path called by frontend dashboard.js)
router.get('/stats', authMiddleware, ctrl.getDashboard);

module.exports = router;