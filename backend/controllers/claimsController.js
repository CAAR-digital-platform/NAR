/**
 * controllers/claimsController.js
 *
 * Thin HTTP layer — validate basic param types, call the service,
 * return JSON. No business logic lives here.
 */

const claimsService = require('../services/claimsService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/claims  —  client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new claim.
 * Body: { contract_id, description, claim_date }
 * Returns: { claim_id, contract_id, status, claim_date }
 */
async function createClaim(req, res) {
  const { contract_id, description, claim_date } = req.body;

  try {
    const result = await claimsService.createClaim(
      { contract_id, description, claim_date },
      req.user.id   // ownership check uses the authenticated user's id
    );
    return res.status(201).json({
      message: 'Claim submitted successfully',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/claims  —  admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all claims with client name resolved.
 * Returns: { count, claims: [...] }
 */
async function listClaims(req, res) {
  try {
    const claims = await claimsService.listAllClaims();
    return res.status(200).json({ count: claims.length, claims });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/claims/:id/status  —  admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update a claim's status.
 * Body: { status }
 * Returns: { message, claim_id, status }
 */
async function updateClaimStatus(req, res) {
  const claimId = parseInt(req.params.id, 10);

  if (isNaN(claimId) || claimId < 1) {
    return res.status(400).json({ error: 'Claim id must be a positive integer' });
  }

  const { status } = req.body;

  try {
    const result = await claimsService.updateClaimStatus(claimId, status);
    return res.status(200).json({
      message: 'Claim status updated successfully',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/expert-reports  —  expert
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an expert report.
 * Body: { claim_id, report, estimated_damage, report_date }
 * Side effect: claim status automatically changes to 'under_review'.
 * Returns: { report_id, claim_id, expert_id, estimated_damage,
 *            report_date, claim_status }
 */
async function createExpertReport(req, res) {
  const { claim_id, report, estimated_damage, report_date } = req.body;

  try {
    const result = await claimsService.createExpertReport(
      { claim_id, report, estimated_damage, report_date },
      req.user.id   // expert profile is resolved from this user id
    );
    return res.status(201).json({
      message: 'Expert report submitted. Claim status updated to under_review.',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/expert-reports  —  admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all expert reports.
 * Returns: { count, reports: [...] }
 */
async function listExpertReports(req, res) {
  try {
    const reports = await claimsService.listAllExpertReports();
    return res.status(200).json({ count: reports.length, reports });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = {
  createClaim,
  listClaims,
  updateClaimStatus,
  createExpertReport,
  listExpertReports,
};