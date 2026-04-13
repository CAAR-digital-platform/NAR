/**
 * services/claimsService.js
 *
 * Business logic only. All SQL goes through claimsModel.
 * No pool references here.
 */

const pool        = require('../db');   // only for getConnection() — transactions
const claimsModel = require('../models/claimsModel');
const agencyModel = require('../models/agencyModel');

// ─── Status machine ──────────────────────────────────────────────────────────
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

async function createClaim(
  { contract_id, description, claim_date,
    incident_location, incident_lat, incident_lng, incident_wilaya_id },
  authUserId
) {
  // Validation
  const missing = [];
  if (!contract_id) missing.push('contract_id');
  if (!description) missing.push('description');
  if (!claim_date)  missing.push('claim_date');
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400; throw err;
  }

  const contractIdNum = parseInt(contract_id, 10);
  if (isNaN(contractIdNum) || contractIdNum < 1) {
    const err = new Error('contract_id must be a positive integer');
    err.status = 400; throw err;
  }

  if (description.trim().length < 10) {
    const err = new Error('Description must be at least 10 characters');
    err.status = 400; throw err;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(claim_date)) {
    const err = new Error('claim_date must be YYYY-MM-DD');
    err.status = 400; throw err;
  }

  // Ownership check — also validates contract is active
  // Returns { id: contractId, client_id } or null
  const contract = await claimsModel.getActiveContractByIdAndUserId(
    contractIdNum,
    authUserId
  );
  if (!contract) {
    const err = new Error(
      'Contract not found, does not belong to your account, or is not active'
    );
    err.status = 403; throw err;
  }

  // Auto-assign nearest Claims-capable agency from incident coordinates
  let nearestAgencyId = null;
  const lat = parseFloat(incident_lat);
  const lng = parseFloat(incident_lng);
  if (!isNaN(lat) && !isNaN(lng)) {
    try {
      const nearest = await agencyModel.getNearestAgency(lat, lng, 'Claims');
      if (nearest) nearestAgencyId = nearest.id;
    } catch {
      // non-fatal — claim still created without agency
    }
  }

  const claimId = await claimsModel.createClaim({
    contract_id:        contractIdNum,
    client_id:          contract.client_id,   // FIX: resolved from contract row
    agency_id:          nearestAgencyId,
    description:        description.trim(),
    claim_date,
    incident_location:  incident_location  || null,
    incident_wilaya_id: incident_wilaya_id ? parseInt(incident_wilaya_id, 10) : null,
  });

  return {
    claim_id:    claimId,
    contract_id: contractIdNum,
    client_id:   contract.client_id,
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
// 3. LIST MY CLAIMS — client
// ─────────────────────────────────────────────────────────────────────────────

async function listMyClaims(authUserId) {
  // Resolve client_id from user_id
  const pool_ = require('../db');
  const [rows] = await pool_.execute(
    'SELECT id FROM clients WHERE user_id = ?',
    [authUserId]
  );
  if (!rows.length) {
    const err = new Error('Client profile not found');
    err.status = 404; throw err;
  }
  return claimsModel.getClaimsByClientId(rows[0].id);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. UPDATE CLAIM STATUS — admin
// ─────────────────────────────────────────────────────────────────────────────

async function updateClaimStatus(claimId, status) {
  if (!status) {
    const err = new Error('status is required'); err.status = 400; throw err;
  }

  const claim = await claimsModel.getClaimById(claimId);
  if (!claim) {
    const err = new Error('Claim not found'); err.status = 404; throw err;
  }

  const allowed = VALID_TRANSITIONS[claim.status] || [];
  if (!allowed.includes(status)) {
    const err = new Error(
      `Cannot transition from '${claim.status}' to '${status}'. ` +
      `Allowed: ${allowed.join(', ') || 'none'}`
    );
    err.status = 409; throw err;
  }

  await claimsModel.updateClaimStatus(claimId, status);
  return { claim_id: claimId, status };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ASSIGN EXPERT — admin
// ─────────────────────────────────────────────────────────────────────────────

async function assignExpert(claimId, expertId) {
  const claim = await claimsModel.getClaimById(claimId);
  if (!claim) {
    const err = new Error('Claim not found'); err.status = 404; throw err;
  }

  if (!['pending', 'under_review'].includes(claim.status)) {
    const err = new Error(
      `Expert can only be assigned when claim is pending or under_review ` +
      `(current: ${claim.status})`
    );
    err.status = 409; throw err;
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // FIX: use model method — no raw SQL in service
    await claimsModel.assignExpertTx(conn, claimId, expertId);
    await claimsModel.setExpertAvailabilityTx(conn, expertId, false);

    await conn.commit();
    return { claim_id: claimId, expert_id: expertId, status: 'expert_assigned' };
  } catch (err) {
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CREATE EXPERT REPORT — expert
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
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400; throw err;
  }

  const claimIdNum = parseInt(claim_id, 10);
  const damageNum  = parseFloat(estimated_damage);

  if (isNaN(claimIdNum) || claimIdNum < 1) {
    const err = new Error('claim_id must be a positive integer');
    err.status = 400; throw err;
  }
  if (isNaN(damageNum) || damageNum < 0) {
    const err = new Error('estimated_damage must be a non-negative number');
    err.status = 400; throw err;
  }
  if (report.trim().length < 10) {
    const err = new Error('report must be at least 10 characters');
    err.status = 400; throw err;
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(report_date)) {
    const err = new Error('report_date must be YYYY-MM-DD');
    err.status = 400; throw err;
  }

  const expert = await claimsModel.getExpertByUserId(authUserId);
  if (!expert) {
    const err = new Error('No expert profile for your account');
    err.status = 403; throw err;
  }

  const claim = await claimsModel.getClaimById(claimIdNum);
  if (!claim) {
    const err = new Error('Claim not found'); err.status = 404; throw err;
  }
  if (claim.expert_id !== expert.id) {
    const err = new Error('You are not assigned to this claim');
    err.status = 403; throw err;
  }
  if (['closed', 'rejected'].includes(claim.status)) {
    const err = new Error(`Cannot report on a ${claim.status} claim`);
    err.status = 409; throw err;
  }

  const existing = await claimsModel.getReportByClaimId(claimIdNum);
  if (existing) {
    const err = new Error('An expert report already exists for this claim');
    err.status = 409; throw err;
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

    // FIX: use model method — no raw pool call here
    await claimsModel.setExpertAvailabilityTx(conn, expert.id, true);

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
    await conn.rollback(); throw err;
  } finally {
    conn.release();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. LIST EXPERT REPORTS — admin
// ─────────────────────────────────────────────────────────────────────────────

async function listAllExpertReports() {
  return claimsModel.getAllExpertReports();
}

module.exports = {
  createClaim,
  listAllClaims,
  listMyClaims,
  updateClaimStatus,
  assignExpert,
  createExpertReport,
  listAllExpertReports,
};