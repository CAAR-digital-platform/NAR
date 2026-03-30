/**
 * routes/claimsRoutes.js
 *
 * Claims and expert-report endpoints in one router.
 *
 * POST   /api/claims                  — client  (submit claim)
 * GET    /api/claims                  — admin   (all claims + client name)
 * PUT    /api/claims/:id/status       — admin   (update status)
 * POST   /api/claims/expert-reports   — expert  (submit report)
 * GET    /api/claims/expert-reports   — admin   (all reports)
 *
 * NOTE: the two /expert-reports routes are defined BEFORE /:id routes so
 * Express does not try to parse "expert-reports" as a numeric :id param.
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole    = require('../middleware/roleMiddleware');
const ctrl           = require('../controllers/claimsController');

// ── Expert-report routes (must come before /:id) ──────────────────────────

// POST /api/claims/expert-reports
// Body: { claim_id, report, estimated_damage, report_date }
// Returns: { report_id, claim_id, expert_id, estimated_damage,
//            report_date, claim_status }
router.post(
  '/expert-reports',
  authMiddleware,
  requireRole('expert'),
  ctrl.createExpertReport
);

// GET /api/claims/expert-reports
// Returns: { count, reports: [...] }
router.get(
  '/expert-reports',
  authMiddleware,
  requireRole('admin'),
  ctrl.listExpertReports
);

// ── Claim routes ──────────────────────────────────────────────────────────

// POST /api/claims
// Body: { contract_id, description, claim_date }
// Returns: { message, claim_id, contract_id, status, claim_date }
router.post(
  '/',
  authMiddleware,
  requireRole('client'),
  ctrl.createClaim
);

// GET /api/claims
// Returns: { count, claims: [...] }
router.get(
  '/',
  authMiddleware,
  requireRole('admin'),
  ctrl.listClaims
);

// PUT /api/claims/:id/status
// Body: { status }
// Returns: { message, claim_id, status }
router.put(
  '/:id/status',
  authMiddleware,
  requireRole('admin'),
  ctrl.updateClaimStatus
);

module.exports = router;