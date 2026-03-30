/**
 * services/claimsService.js
 *
 * Business logic for the Claims module.
 * All DB access goes through claimsModel — never directly here.
 */

const pool  = require('../db');
const model = require('../models/claimsModel');

// ─── Allowed status transitions for admin updates ──────────────────────────
const ALLOWED_STATUSES = ['pending', 'under_review', 'expert_assigned', 'closed'];

// ─────────────────────────────────────────────────────────────────────────────
// 1. CREATE CLAIM  (client)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validates input and creates a new claim.
 *
 * Ownership rule: the contract must belong to the authenticated client.
 * Status is always forced to 'pending' — the model layer enforces this.
 *
 * @param {object} data        - { contract_id, description, claim_date }
 * @param {number} authUserId  - id of the authenticated user (req.user.id)
 */
async function createClaim({ contract_id, description, claim_date }, authUserId) {
  // ── Input validation ──────────────────────────────────────────────────────
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

  // Basic date format check (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(claim_date)) {
    const err = new Error('claim_date must be in YYYY-MM-DD format');
    err.status = 400;
    throw err;
  }

  // ── Ownership check ───────────────────────────────────────────────────────
  const contract = await model.getContractByIdAndUserId(contractIdNum, authUserId);
  if (!contract) {
    const err = new Error(
      'Contract not found or does not belong to your account'
    );
    err.status = 403;
    throw err;
  }

  // ── Create the claim ──────────────────────────────────────────────────────
  const claimId = await model.createClaim({
    contract_id:  contractIdNum,
    description:  description.trim(),
    claim_date,
  });

  return {
    claim_id:    claimId,
    contract_id: contractIdNum,
    status:      'pending',
    claim_date,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. LIST ALL CLAIMS  (admin)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all claims with client name resolved via JOIN.
 */
async function listAllClaims() {
  return model.getAllClaims();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. UPDATE CLAIM STATUS  (admin)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a claim's status.
 * Only transitions to the four defined statuses are allowed.
 *
 * @param {number} claimId - target claim
 * @param {string} status  - new status value
 */
async function updateClaimStatus(claimId, status) {
  // ── Validate status value ─────────────────────────────────────────────────
  if (!status) {
    const err = new Error('status is required');
    err.status = 400;
    throw err;
  }

  if (!ALLOWED_STATUSES.includes(status)) {
    const err = new Error(
      `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
    );
    err.status = 400;
    throw err;
  }

  // ── Confirm claim exists ──────────────────────────────────────────────────
  const claim = await model.getClaimById(claimId);
  if (!claim) {
    const err = new Error('Claim not found');
    err.status = 404;
    throw err;
  }

  // Prevent pointless no-op updates
  if (claim.status === status) {
    const err = new Error(`Claim is already in '${status}' status`);
    err.status = 409;
    throw err;
  }

  await model.updateClaimStatus(claimId, status);

  return { claim_id: claimId, status };
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CREATE EXPERT REPORT  (expert)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates an expert report and atomically updates the related claim
 * status to 'under_review' — all inside a single DB transaction.
 *
 * @param {object} data       - { claim_id, report, estimated_damage, report_date }
 * @param {number} authUserId - id of the authenticated expert user
 */
async function createExpertReport(
  { claim_id, report, estimated_damage, report_date },
  authUserId
) {
  // ── Input validation ──────────────────────────────────────────────────────
  const missing = [];
  if (!claim_id)         missing.push('claim_id');
  if (!report)           missing.push('report');
  if (estimated_damage == null) missing.push('estimated_damage');
  if (!report_date)      missing.push('report_date');

  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const claimIdNum     = parseInt(claim_id, 10);
  const damageNum      = parseFloat(estimated_damage);

  if (isNaN(claimIdNum) || claimIdNum < 1) {
    const err = new Error('claim_id must be a positive integer');
    err.status = 400;
    throw err;
  }

  if (isNaN(damageNum) || damageNum < 0) {
    const err = new Error('estimated_damage must be a non-negative number');
    err.status = 400;
    throw err;
  }

  if (report.trim().length < 10) {
    const err = new Error('report must be at least 10 characters');
    err.status = 400;
    throw err;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(report_date)) {
    const err = new Error('report_date must be in YYYY-MM-DD format');
    err.status = 400;
    throw err;
  }

  // ── Resolve expert profile from user id ───────────────────────────────────
  const expert = await model.getExpertByUserId(authUserId);
  if (!expert) {
    const err = new Error(
      'No expert profile found for your account. Contact an administrator.'
    );
    err.status = 403;
    throw err;
  }

  // ── Confirm claim exists and is in a reportable state ────────────────────
  const claim = await model.getClaimById(claimIdNum);
  if (!claim) {
    const err = new Error('Claim not found');
    err.status = 404;
    throw err;
  }

  if (claim.status === 'closed') {
    const err = new Error('Cannot submit a report for a closed claim');
    err.status = 409;
    throw err;
  }

  // ── Prevent duplicate reports on the same claim ───────────────────────────
  const existing = await model.getReportByClaimId(claimIdNum);
  if (existing) {
    const err = new Error(
      'An expert report already exists for this claim'
    );
    err.status = 409;
    throw err;
  }

  // ── Transaction: insert report + update claim status ──────────────────────
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const reportId = await model.createExpertReport(conn, {
      claim_id:         claimIdNum,
      expert_id:        expert.id,
      report:           report.trim(),
      estimated_damage: damageNum,
      report_date,
    });

    // Automatically move the claim to 'under_review'
    await model.updateClaimStatusTx(conn, claimIdNum, 'under_review');

    await conn.commit();

    return {
      report_id:        reportId,
      claim_id:         claimIdNum,
      expert_id:        expert.id,
      estimated_damage: damageNum,
      report_date,
      claim_status:     'under_review',
    };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. LIST ALL EXPERT REPORTS  (admin)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all expert reports with claim and expert info.
 */
async function listAllExpertReports() {
  return model.getAllExpertReports();
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  createClaim,
  listAllClaims,
  updateClaimStatus,
  createExpertReport,
  listAllExpertReports,
};