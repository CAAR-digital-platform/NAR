/**
 * routes/applicationRoutes.js
 *
 * POST /api/applications             — public (submit an application)
 * GET  /api/applications             — admin  (list all applications)
 * GET  /api/applications/:id         — admin  (get one application)
 * PATCH /api/applications/:id/status — admin  (update status)
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole    = require('../middleware/roleMiddleware');
const ctrl           = require('../controllers/applicationController');

// ── Public ────────────────────────────────────────────────────────────────────

// POST /api/applications
// Body: { first_name, last_name, email, phone?, field_of_interest?,
//         position_sought?, message?, cv_file? }
router.post('/', ctrl.submit);

// ── Admin only ────────────────────────────────────────────────────────────────

// GET /api/applications
router.get('/', authMiddleware, requireRole('admin'), ctrl.list);

// GET /api/applications/:id
router.get('/:id', authMiddleware, requireRole('admin'), ctrl.getOne);

// PATCH /api/applications/:id/status
// Body: { status }
router.patch('/:id/status', authMiddleware, requireRole('admin'), ctrl.updateStatus);

module.exports = router;