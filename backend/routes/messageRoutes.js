/**
 * routes/messageRoutes.js
 *
 * POST /api/messages          — public  (submit a contact message)
 * GET  /api/messages          — admin   (list all messages)
 * GET  /api/messages/:id      — admin   (get one message)
 * PATCH /api/messages/:id/status — admin (update status)
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole    = require('../middleware/roleMiddleware');
const ctrl           = require('../controllers/messageController');

// ── Public ────────────────────────────────────────────────────────────────────

// POST /api/messages
// Body: { name, email, subject, message }
router.post('/', ctrl.submit);

// ── Admin only ────────────────────────────────────────────────────────────────

// GET /api/messages
router.get('/', authMiddleware, requireRole('admin'), ctrl.list);

// GET /api/messages/:id
router.get('/:id', authMiddleware, requireRole('admin'), ctrl.getOne);

// PATCH /api/messages/:id/status
// Body: { status }
router.patch('/:id/status', authMiddleware, requireRole('admin'), ctrl.updateStatus);

module.exports = router;