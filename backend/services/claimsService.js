/**
 * services/claimsService.js
 *
 * Business logic only. All SQL goes through claimsModel.
 * Notifications are dispatched via notificationService.
 */

const pool               = require('../db');
const claimsModel        = require('../models/claimsModel');
const agencyModel        = require('../models/agencyModel');
const notificationService = require('./notificationService');
const { assertClaimStatusTransition } = require('../utils/claimLifecycle');

// ─── Status machine ──────────────────────────────────────────────────────────
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
  const contract = await claimsModel.getActiveContractByIdAndUserId(contractIdNum, authUserId);
  if (!contract) {
    const err = new Error(
      'Contract not found, does not belong to your account, or is not active'
    );
    err.status = 403; throw err;
  }

  // Auto-assign nearest Claims-capable agency
  let nearestAgencyId = null;
  const lat = parseFloat(incident_lat);
  const lng = parseFloat(incident_lng);
  if (!isNaN(lat) && !isNaN(lng)) {
    try {
      const nearest = await agencyModel.getNearestAgency(lat, lng, 'Claims');
      if (nearest) nearestAgencyId = nearest.id;
    } catch { /* non-fatal */ }
  }

  const claimId = await claimsModel.createClaim({
    contract_id:        contractIdNum,
    client_id:          contract.client_id,
    agency_id:          nearestAgencyId,
    description:        description.trim(),
    claim_date,
    incident_location:  incident_location  || null,
    incident_wilaya_id: incident_wilaya_id ? parseInt(incident_wilaya_id, 10) : null,
  });

  // ── NOTIFICATION: notify all admins about new claim ──────────────────────
  try {
    // Resolve the user's display name
    const [userRows] = await pool.execute(
      `SELECT CONCAT(u.first_name, ' ', u.last_name) AS full_name
       FROM users u WHERE u.id = ?`,
      [authUserId]
    );
    const clientName = userRows[0] ? userRows[0].full_name : `User #${authUserId}`;

    await notificationService.claimCreated(pool, {
      claim_id:    claimId,
      client_name: clientName,
      contract_id: contractIdNum,
    });
  } catch (notifErr) {
    // Non-fatal — claim is already saved, notification failure must not abort
    console.error('[Claims] claimCreated notification failed:', notifErr.message);
  }

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
  await claimsModel.promotePendingClaimsToUnderReview();
  return claimsModel.getAllClaims();
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. LIST MY CLAIMS — client
// ─────────────────────────────────────────────────────────────────────────────

async function listMyClaims(authUserId) {
  const [rows] = await pool.execute(
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
  const nextStatus = typeof status === 'string' ? status.trim() : status;
  const ADMIN_DECISIONS = ['approved', 'rejected'];

  if (!nextStatus) {
    const err = new Error('status is required'); err.status = 400; throw err;
  }

  if (!ADMIN_DECISIONS.includes(nextStatus)) {
    const err = new Error("Admin can only set claim status to 'approved' or 'rejected'");
    err.status = 400;
    throw err;
  }

  const claim = await claimsModel.getClaimById(claimId);
  if (!claim) {
    const err = new Error('Claim not found'); err.status = 404; throw err;
  }

  if (claim.status !== 'reported') {
    const err = new Error("Claim can only be approved/rejected after expert report submission");
    err.status = 409;
    throw err;
  }

  const report = await claimsModel.getReportByClaimId(claimId);
  if (!report) {
    const err = new Error('Cannot approve/reject claim without an expert report');
    err.status = 409;
    throw err;
  }

  assertClaimStatusTransition(claim.status, nextStatus);

  await claimsModel.updateClaimStatus(claimId, nextStatus);

  // ── NOTIFICATION: notify the client about status change ─────────────────
  try {
    await notificationService.claimStatusUpdated(pool, {
      claim_id:        claimId,
      new_status:      nextStatus,
      client_user_id:  claim.user_id,   // claim row carries user_id via JOIN
    });
  } catch (notifErr) {
    console.error('[Claims] claimStatusUpdated notification failed:', notifErr.message);
  }

  return { claim_id: claimId, status: nextStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. ASSIGN EXPERT — admin
// ─────────────────────────────────────────────────────────────────────────────

async function assignExpert(claimId, expertId) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const claim = await claimsModel.getClaimByIdForUpdateTx(conn, claimId);
    if (!claim) {
      const err = new Error('Claim not found');
      err.status = 404;
      throw err;
    }

    if (claim.expert_id) {
      const err = new Error('This claim already has an assigned expert');
      err.status = 409;
      throw err;
    }

    let currentStatus = claim.status;
    if (currentStatus === 'pending') {
      assertClaimStatusTransition(currentStatus, 'under_review');
      await claimsModel.updateClaimStatusTx(conn, claimId, 'under_review');
      currentStatus = 'under_review';
    }

    if (currentStatus !== 'under_review') {
      const err = new Error('Claim must be under review before assigning an expert');
      err.status = 409;
      throw err;
    }

    assertClaimStatusTransition(currentStatus, 'expert_assigned');

    const expertRow = await claimsModel.getAvailableExpertForUpdateTx(conn, expertId);
    if (!expertRow) {
      const err = new Error('Expert is currently busy');
      err.status = 409;
      throw err;
    }

    await claimsModel.assignExpertTx(conn, claimId, expertId);
    await claimsModel.updateClaimStatusTx(conn, claimId, 'expert_assigned');
    await claimsModel.setExpertAvailabilityTx(conn, expertId, false);

    // ── NOTIFICATION: notify the expert ───────────────────────────────────
    await notificationService.expertAssigned(conn, {
      claim_id:        claimId,
      expert_user_id:  expertRow.user_id,
    });

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
  if (!claim_id)                missing.push('claim_id');
  if (!report)                  missing.push('report');
  if (estimated_damage == null) missing.push('estimated_damage');
  if (!report_date)             missing.push('report_date');
  if (missing.length) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400; throw err;
  }

  const claimIdNum = parseInt(claim_id, 10);
  const damageNum  = parseFloat(estimated_damage);

  if (isNaN(claimIdNum) || claimIdNum < 1) {
    const err = new Error('claim_id must be a positive integer'); err.status = 400; throw err;
  }
  if (isNaN(damageNum) || damageNum <= 0) {
    const err = new Error('estimated_damage must be greater than 0'); err.status = 400; throw err;
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
  if (claim.expert_id !== expert.id) {
    const err = new Error('You are not assigned to this claim'); err.status = 403; throw err;
  }
  assertClaimStatusTransition(claim.status, 'reported');

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

// ─────────────────────────────────────────────────────────────────────────────
// 8. LIST ASSIGNED CLAIMS — expert
// ─────────────────────────────────────────────────────────────────────────────

async function listAssignedClaims(authUserId) {
  const expert = await claimsModel.getExpertByUserId(authUserId);
  if (!expert) {
    const err = new Error('No expert profile for your account');
    err.status = 403;
    throw err;
  }

  const claims = await claimsModel.getAssignedClaimsByExpertId(expert.id);
  return {
    expert,
    claims,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. UPDATE EXPERT AVAILABILITY — expert
// ─────────────────────────────────────────────────────────────────────────────

async function updateExpertAvailability(authUserId, isAvailable) {
  if (typeof isAvailable !== 'boolean') {
    const err = new Error('is_available must be boolean');
    err.status = 400;
    throw err;
  }

  const expert = await claimsModel.getExpertByUserId(authUserId);
  if (!expert) {
    const err = new Error('No expert profile for your account');
    err.status = 403;
    throw err;
  }

  await claimsModel.updateExpertAvailability(expert.id, isAvailable);

  return {
    expert_id: expert.id,
    is_available: isAvailable,
  };
}

module.exports = {
  createClaim,
  listAllClaims,
  listMyClaims,
  updateClaimStatus,
  assignExpert,
  createExpertReport,
  listAllExpertReports,
  listAssignedClaims,
  updateExpertAvailability,
};
