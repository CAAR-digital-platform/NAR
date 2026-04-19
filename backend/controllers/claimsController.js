/**
 * controllers/claimsController.js
 * Thin HTTP layer — validate param types, call service, return JSON.
 */

const claimsService = require('../services/claimsService');


// ─── POST /api/claims — client ─────────────────────────────
async function createClaim(req, res) {
  const {
    contract_id,
    description,
    claim_date,
    incident_location,
    incident_lat,
    incident_lng,
    incident_wilaya_id,
  } = req.body;

  try {
    const result = await claimsService.createClaim(
      {
        contract_id,
        description,
        claim_date,
        incident_location,
        incident_lat,
        incident_lng,
        incident_wilaya_id,
      },
      req.user.id
    );

    return res.status(201).json({
      message: 'Claim submitted successfully',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}


// ─── GET /api/claims/my — client ───────────────────────────
async function listMyClaims(req, res) {
  try {
    const claims = await claimsService.listMyClaims(req.user.id);
    return res.status(200).json({ count: claims.length, claims });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}


// ─── GET /api/claims — admin ───────────────────────────────
async function listClaims(req, res) {
  try {
    const claims = await claimsService.listAllClaims();
    return res.status(200).json({ count: claims.length, claims });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}


// ─── PUT /api/claims/:id/status — admin ────────────────────
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


// ─── POST /api/claims/:id/assign-expert — admin ────────────
async function assignExpert(req, res) {
  const claimId = parseInt(req.params.id, 10);

  if (isNaN(claimId) || claimId < 1) {
    return res.status(400).json({ error: 'Claim id must be a positive integer' });
  }

  const expertId = parseInt(req.body.expert_id, 10);

  if (isNaN(expertId) || expertId < 1) {
    return res.status(400).json({ error: 'expert_id must be a positive integer' });
  }

  try {
    const result = await claimsService.assignExpert(claimId, expertId);
    return res.status(200).json({
      message: 'Expert assigned successfully',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}


// ─── POST /api/claims/expert-reports — expert ──────────────
async function createExpertReport(req, res) {
  const { claim_id, report, estimated_damage, report_date, conclusion } = req.body;

  try {
    const result = await claimsService.createExpertReport(
      { claim_id, report, estimated_damage, report_date, conclusion },
      req.user.id
    );

    return res.status(201).json({
      message: 'Expert report submitted. Claim status updated to reported.',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}


// ─── GET /api/claims/expert-reports — admin ────────────────
async function listExpertReports(req, res) {
  try {
    const reports = await claimsService.listAllExpertReports();
    return res.status(200).json({ count: reports.length, reports });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─── GET /api/claims/expert/my-assignments — expert ──────────────────────
async function listAssignedClaims(req, res) {
  try {
    const result = await claimsService.listAssignedClaims(req.user.id);
    return res.status(200).json({
      count: result.claims.length,
      expert: result.expert,
      claims: result.claims,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─── PATCH /api/claims/expert/availability — expert ──────────────────────
async function updateExpertAvailability(req, res) {
  try {
    const result = await claimsService.updateExpertAvailability(
      req.user.id,
      req.body.is_available
    );
    return res.status(200).json({
      message: 'Availability updated successfully',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}


// ─── EXPORT ────────────────────────────────────────────────
module.exports = {
  createClaim,
  listMyClaims,
  listClaims,
  updateClaimStatus,
  assignExpert,
  createExpertReport,
  listExpertReports,
  listAssignedClaims,
  updateExpertAvailability,
};