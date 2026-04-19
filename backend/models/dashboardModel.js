/**
 * models/dashboardModel.js
 *
 * One model, three query sets — each strictly scoped to its role.
 *
 * DATABASE RULES:
 *   - Admin  → global COUNT aggregates, no WHERE clause.
 *   - Client → all queries filtered by client_id resolved from user_id.
 *   - Expert → all queries filtered by expert_id resolved from user_id.
 *
 * Promise.all is used in every function so queries run in parallel.
 */

const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN — global platform overview
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns aggregate counts across the entire platform.
 * Never scoped to a specific user — admin only.
 */
async function getAdminStats() {
  const [
    [[clients]],
    [[contracts]],
    [[claims]],
    [[pendingClaims]],
    [[activeExperts]],
    [[payments]],
    [[messages]],
    [[applications]],
  ] = await Promise.all([
    pool.execute('SELECT COUNT(*) AS total FROM clients'),
    pool.execute('SELECT COUNT(*) AS total FROM contracts'),
    pool.execute('SELECT COUNT(*) AS total FROM claims'),
    pool.execute("SELECT COUNT(*) AS total FROM claims WHERE status = 'pending'"),
    pool.execute("SELECT COUNT(*) AS total FROM experts WHERE is_available = 1"),
    pool.execute(
      'SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS revenue FROM payments'
    ),
    pool.execute('SELECT COUNT(*) AS total FROM contact_messages'),
    pool.execute('SELECT COUNT(*) AS total FROM job_applications'),
  ]);

  return {
    total_clients:      clients.total,
    total_contracts:    contracts.total,
    total_claims:       claims.total,
    pending_claims:     pendingClaims.total,
    active_experts:     activeExperts.total,
    total_payments:     payments.total,
    total_messages:     messages.total,
    total_applications: applications.total,
    total_revenue:      parseFloat(payments.revenue),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT — data scoped to a single client's user_id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns stats visible to one client.
 * All queries resolve client_id from the JWT's user_id via a JOIN —
 * the caller never passes a client_id directly.
 *
 * @param {number} userId — from JWT, never from request body
 */
async function getClientStats(userId) {
  // Resolve client profile first; fail fast if none exists
  const [clientRows] = await pool.execute(
    'SELECT id FROM clients WHERE user_id = ?',
    [userId]
  );

  if (!clientRows.length) {
    const err = new Error('Client profile not found for this account');
    err.status = 404;
    throw err;
  }

  const clientId = clientRows[0].id;

  const [
    [[contracts]],
    [[activeClaims]],
    [[pendingClaims]],
    [[payments]],
  ] = await Promise.all([
    // All contracts belonging to this client
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM contracts
       WHERE client_id = ?`,
      [clientId]
    ),
    // Claims currently open (not closed / rejected)
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM claims cl
       JOIN contracts co ON co.id = cl.contract_id
       WHERE co.client_id = ?
         AND cl.status NOT IN ('closed', 'rejected')`,
      [clientId]
    ),
    // Claims awaiting initial review
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM claims cl
       JOIN contracts co ON co.id = cl.contract_id
       WHERE co.client_id = ? AND cl.status = 'pending'`,
      [clientId]
    ),
    // Total premiums paid
    pool.execute(
      `SELECT COUNT(*) AS total,
              COALESCE(SUM(p.amount), 0) AS total_paid
       FROM payments p
       JOIN contracts co ON co.id = p.contract_id
       WHERE co.client_id = ?`,
      [clientId]
    ),
  ]);

  return {
    client_id:          clientId,
    total_contracts:    contracts.total,
    active_claims:      activeClaims.total,
    pending_claims:     pendingClaims.total,
    total_payments:     payments.total,
    total_paid:         parseFloat(payments.total_paid),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERT — data scoped to a single expert's user_id
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns stats visible to one expert.
 * expert_id is resolved internally — never trusted from the request.
 *
 * @param {number} userId — from JWT, never from request body
 */
async function getExpertStats(userId) {
  // Resolve expert profile first
  const [expertRows] = await pool.execute(
    'SELECT id, is_available FROM experts WHERE user_id = ?',
    [userId]
  );

  if (!expertRows.length) {
    const err = new Error('Expert profile not found for this account');
    err.status = 404;
    throw err;
  }

  const expertId    = expertRows[0].id;
  const isAvailable = expertRows[0].is_available;

  const [
    [[assigned]],
    [[inProgress]],
    [[completed]],
    [[reportsSubmitted]],
  ] = await Promise.all([
    // Assigned = strictly expert_assigned
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM claims
       WHERE expert_id = ?
         AND status = 'expert_assigned'`,
      [expertId]
    ),
    // In progress = reported only
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM claims
       WHERE expert_id = ?
         AND status = 'reported'`,
      [expertId]
    ),
    // Completed = approved + rejected
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM claims
       WHERE expert_id = ?
         AND status IN ('approved', 'rejected')`,
      [expertId]
    ),
    // Expert reports submitted by this expert
    pool.execute(
      `SELECT COUNT(*) AS total
       FROM expert_reports
       WHERE expert_id = ?`,
      [expertId]
    ),
  ]);

  return {
    expert_id:          expertId,
    is_available:       Boolean(isAvailable),
    assigned_claims:    assigned.total,
    in_progress_claims: inProgress.total,
    completed_claims:   completed.total,
    reports_submitted:  reportsSubmitted.total,
  };
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getAdminStats,
  getClientStats,
  getExpertStats,
};