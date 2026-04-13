/**
 * routes/claimsRoutes.js
 *
 * POST   /api/claims                       client   — submit claim
 * GET    /api/claims/my                    client   — own claims only
 * GET    /api/claims                       admin    — all claims
 * PUT    /api/claims/:id/status            admin    — status machine
 * POST   /api/claims/:id/assign-expert     admin    — assign expert
 * POST   /api/claims/expert-reports        expert   — submit report
 * GET    /api/claims/expert-reports        admin    — all reports
 *
 * ROUTE ORDER RULES:
 *   1. Named segments (/my, /expert-reports) BEFORE param routes (/:id)
 *   2. POST /expert-reports before GET /expert-reports
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole    = require('../middleware/roleMiddleware');
const ctrl           = require('../controllers/claimsController');

// ── Named routes first ─────────────────────────────────────────────────────

// GET  /api/claims/my
router.get('/my',
  authMiddleware,
  requireRole('client'),
  ctrl.listMyClaims
);

// POST /api/claims/expert-reports
router.post('/expert-reports',
  authMiddleware,
  requireRole('expert'),
  ctrl.createExpertReport
);

// GET  /api/claims/expert-reports
router.get('/expert-reports',
  authMiddleware,
  requireRole('admin'),
  ctrl.listExpertReports
);

// ── Root claim routes ──────────────────────────────────────────────────────

// POST /api/claims
router.post('/',
  authMiddleware,
  requireRole('client'),
  ctrl.createClaim
);

// GET  /api/claims
router.get('/',
  authMiddleware,
  requireRole('admin'),
  ctrl.listClaims
);

// ── Param routes LAST ──────────────────────────────────────────────────────

// PUT  /api/claims/:id/status
router.put('/:id/status',
  authMiddleware,
  requireRole('admin'),
  ctrl.updateClaimStatus
);

// POST /api/claims/:id/assign-expert
router.post('/:id/assign-expert',
  authMiddleware,
  requireRole('admin'),
  ctrl.assignExpert
);

module.exports = router;