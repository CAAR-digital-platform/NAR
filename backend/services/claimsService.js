/**
 * services/claimsService.js
 *
 * Key improvements over v1:
 *  - When a claim is created, the nearest agency that handles
 *    'Claims' is found automatically and stored on the claim.
 *  - Admin can assign an expert (moves status to expert_assigned).
 *  - Status machine is enforced — only valid transitions allowed.
 */

const pool        = require('../db');
const claimsModel = require('../models/claimsModel');
const agencyModel = require('../models/agencyModel');

// ─── Status machine ───────────────────────────────────────────────────────────
const VALID_TRANSITIONS = {
  pending:         ['under_review', 'rejected'],
  under_review:    ['expert_assigned', 'rejected'],
  expert_assigned: ['reported', 'rejected'],
  reported:        ['closed'],
  closed:          [],
  rejected:        [],
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE CLAIM — client
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a claim.
 * - Verifies contract ownership.
 * - Auto-assigns nearest Claims-capable agency using incident location.
 * - If no coordinates provided, falls back to the client's home wilaya centroid.
 *
 * @param {object} data  { contract_id, description, claim_date,
 *                         incident_location?, incident_lat?, incident_lng?,
 *                         incident_wilaya_id? }
 * @param {number} authUserId
 */
async function createClaim(
  { contract_id, description, claim_date, incident_location,
    incident_lat, incident_lng, incident_wilaya_id },
  authUserId
) {
  // ── Validation ──────────────────────────────────────────────────────────────
  const missing = [];
  if (!contract_id)  missing.push('contract_id');
  if (!description)  missing.push('description');
  if (!claim_date)   missing.push('claim_date');
  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const contractIdNum = parseInt(contract_id, 10);
  if (isNaN(contractIdNum) || contractIdNum < 1) {
    const err = new Error('contract_id must be a positive integer');
    err.status = 400;
    throw err;
  }

  if (description.trim().length < 10) {
    const err = new Error('Description must be at least 10 characters');
    err.status = 400;
    throw err;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(claim_date)) {
    const err = new Error('claim_date must be YYYY-MM-DD');
    err.status = 400;
    throw err;
  }

  // ── Ownership check ──────────────────────────────────────────────────────────
  const contract = await claimsModel.getContractByIdAndUserId(contractIdNum, authUserId);
  if (!contract) {
    const err = new Error('Contract not found or does not belong to your account');
    err.status = 403;
    throw err;
  }

  // ── Find nearest agency automatically ────────────────────────────────────────
  let nearestAgencyId = null;
  const lat = parseFloat(incident_lat);
  const lng = parseFloat(incident_lng);

  if (!isNaN(lat) && !isNaN(lng)) {
    try {
      const nearestAgency = await agencyModel.getNearestAgency(lat, lng, 'Claims');
      if (nearestAgency) nearestAgencyId = nearestAgency.id;
    } catch {
      // Non-fatal — claim still created without agency assignment
    }
  }

  // ── Insert ────────────────────────────────────────────────────────────────────
  const claimId = await claimsModel.createClaim({
    contract_id:        contractIdNum,
    agency_id:          nearestAgencyId,
    description:        description.trim(),
    claim_date,
    incident_location:  incident_location  || null,
    incident_wilaya_id: incident_wilaya_id ? parseInt(incident_wilaya_id, 10) : null,
  });

  return {
    claim_id:    claimId,
    contract_id: contractIdNum,
    agency_id:   nearestAgencyId,
    status:      'pending',
    claim_date,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIST ALL CLAIMS — admin
// ─────────────────────────────────────────────────────────────────────────────

async function listAllClaims() {
  return claimsModel.getAllClaims();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. UPDATE CLAIM STATUS — admin
// ─────────────────────────────────────────────────────────────────────────────

async function updateClaimStatus(claimId, status) {
  if (!status) {
    const err = new Error('status is required'); err.status = 400; throw err;
  }

  const claim = await claimsModel.getClaimById(claimId);
  if (!claim) {
    const err = new Error('Claim not found'); err.status = 404; throw err;
  }

  const allowed = VALID_TRANSITIONS[claim.status];
  if (!allowed || !allowed.includes(status)) {
    const err = new Error(
      `Cannot transition from '${claim.status}' to '${status}'. ` +
      `Allowed: ${(VALID_TRANSITIONS[claim.status] || []).join(', ') || 'none'}`
    );
    err.status = 409;
    throw err;
  }

  await claimsModel.updateClaimStatus(claimId, status);
  return { claim_id: claimId, status };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ASSIGN EXPERT — admin
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assign an expert to a claim.
 * Moves status: under_review → expert_assigned.
 * Both writes are atomic inside a transaction.
 */
async function assignExpert(claimId, expertId) {
  const claim = await claimsModel.getClaimById(claimId);
  if (!claim) {
    const err = new Error('Claim not found'); err.status = 404; throw err;
  }

  if (!['pending', 'under_review'].includes(claim.status)) {
    const err = new Error(
      `Expert can only be assigned when claim is pending or under_review (current: ${claim.status})`
    );
    err.status = 409;
    throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.execute(
      'UPDATE claims SET expert_id = ?, status = ? WHERE id = ?',
      [expertId, 'expert_assigned', claimId]
    );

    // Mark expert as unavailable (optional: depends on business rules)
    await conn.execute(
      'UPDATE experts SET is_available = 0 WHERE id = ?',
      [expertId]
    );

    await conn.commit();
    return { claim_id: claimId, expert_id: expertId, status: 'expert_assigned' };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CREATE EXPERT REPORT — expert
// ─────────────────────────────────────────────────────────────────────────────

async function createExpertReport(
  { claim_id, report, estimated_damage, report_date, conclusion },
  authUserId
) {
  const missing = [];
  if (!claim_id)               missing.push('claim_id');
  if (!report)                 missing.push('report');
  if (estimated_damage == null) missing.push('estimated_damage');
  if (!report_date)            missing.push('report_date');
  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const claimIdNum = parseInt(claim_id, 10);
  const damageNum  = parseFloat(estimated_damage);

  if (isNaN(claimIdNum) || claimIdNum < 1) {
    const err = new Error('claim_id must be a positive integer'); err.status = 400; throw err;
  }
  if (isNaN(damageNum) || damageNum < 0) {
    const err = new Error('estimated_damage must be a non-negative number'); err.status = 400; throw err;
  }
  if (report.trim().length < 10) {
    const err = new Error('report must be at least 10 characters'); err.status = 400; throw err;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(report_date)) {
    const err = new Error('report_date must be YYYY-MM-DD'); err.status = 400; throw err;
  }

  const expert = await claimsModel.getExpertByUserId(authUserId);
  if (!expert) {
    const err = new Error('No expert profile for your account'); err.status = 403; throw err;
  }

  const claim = await claimsModel.getClaimById(claimIdNum);
  if (!claim) {
    const err = new Error('Claim not found'); err.status = 404; throw err;
  }

  // Expert must be the assigned one
  if (claim.expert_id !== expert.id) {
    const err = new Error('You are not assigned to this claim'); err.status = 403; throw err;
  }

  if (claim.status === 'closed' || claim.status === 'rejected') {
    const err = new Error(`Cannot report on a ${claim.status} claim`); err.status = 409; throw err;
  }

  const existing = await claimsModel.getReportByClaimId(claimIdNum);
  if (existing) {
    const err = new Error('An expert report already exists for this claim'); err.status = 409; throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const reportId = await claimsModel.createExpertReport(conn, {
      claim_id:         claimIdNum,
      expert_id:        expert.id,
      report:           report.trim(),
      estimated_damage: damageNum,
      report_date,
      conclusion:       conclusion || null,
    });

    await claimsModel.updateClaimStatusTx(conn, claimIdNum, 'reported');

    // Free the expert
    await conn.execute(
      'UPDATE experts SET is_available = 1 WHERE id = ?',
      [expert.id]
    );

    await conn.commit();

    return {
      report_id:        reportId,
      claim_id:         claimIdNum,
      expert_id:        expert.id,
      estimated_damage: damageNum,
      report_date,
      conclusion:       conclusion || null,
      claim_status:     'reported',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. LIST EXPERT REPORTS — admin
// ─────────────────────────────────────────────────────────────────────────────

async function listAllExpertReports() {
  return claimsModel.getAllExpertReports();
}

module.exports = {
  createClaim,
  listAllClaims,
  updateClaimStatus,
  assignExpert,
  createExpertReport,
  listAllExpertReports,
};