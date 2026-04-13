/**
 * routes/dashboardRoutes.js
 *
 * Single route — role logic handled internally by the service.
 * No roleMiddleware: every authenticated user gets their own view.
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl           = require('../controllers/dashboardController');

// GET /api/dashboard
// Header: Authorization: Bearer <token>
// Returns role-appropriate stats — no role param needed
router.get('/', authMiddleware, ctrl.getDashboard);

module.exports = router;