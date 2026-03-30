/**
 * routes/dashboardRoutes.js
 *
 * All routes under /api/dashboard.
 * Every route here requires a valid JWT AND the 'admin' role.
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole    = require('../middleware/roleMiddleware');
const ctrl           = require('../controllers/dashboardController');

// GET /api/dashboard/stats
// Header: Authorization: Bearer <token>
// Returns: { total_clients, total_contracts, total_claims,
//            total_payments, total_messages, total_applications, total_revenue }
router.get('/stats', authMiddleware, requireRole('admin'), ctrl.getStats);

module.exports = router;