/**
 * models/claimsModel.js
 *
 * Pure SQL layer for the Claims module.
 * Functions that run inside a transaction receive a `conn` argument.
 * Functions that run outside use the shared `pool` directly.
 */

const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// CLAIMS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new claim.
 * Status is always forced to 'pending' at creation — never trusted from input.
 * Returns the new claim's id.
 */
async function createClaim({ contract_id, description, claim_date }) {
  const [result] = await pool.execute(
    `INSERT INTO claims (contract_id, description, status, claim_date)
     VALUES (?, ?, 'pending', ?)`,
    [contract_id, description, claim_date]
  );
  return result.insertId;
}

/**
 * Fetch all claims joined with contract → client → user
 * so the admin sees the client's full name alongside each claim.
 */
async function getAllClaims() {
  const [rows] = await pool.execute(
    `SELECT
       cl.id            AS claim_id,
       cl.contract_id,
       cl.description,
       cl.status,
       cl.claim_date,
       CONCAT(u.first_name, ' ', u.last_name) AS client_name,
       u.email          AS client_email
     FROM claims cl
     JOIN contracts  co ON co.id      = cl.contract_id
     JOIN clients    c  ON c.id       = co.client_id
     JOIN users      u  ON u.id       = c.user_id
     ORDER BY cl.claim_date DESC`
  );
  return rows;
}

/**
 * Fetch a single claim by its id.
 * Used for ownership checks and status updates.
 */
async function getClaimById(claimId) {
  const [rows] = await pool.execute(
    `SELECT
       cl.id            AS claim_id,
       cl.contract_id,
       cl.description,
       cl.status,
       cl.claim_date,
       co.client_id,
       c.user_id
     FROM claims     cl
     JOIN contracts  co ON co.id = cl.contract_id
     JOIN clients    c  ON c.id  = co.client_id
     WHERE cl.id = ?`,
    [claimId]
  );
  return rows[0] || null;
}

/**
 * Update a claim's status (outside a transaction).
 */
async function updateClaimStatus(claimId, status) {
  await pool.execute(
    'UPDATE claims SET status = ? WHERE id = ?',
    [status, claimId]
  );
}

/**
 * Update a claim's status inside a transaction.
 * Used when the status change must be atomic with another write
 * (e.g. inserting an expert report).
 */
async function updateClaimStatusTx(conn, claimId, status) {
  await conn.execute(
    'UPDATE claims SET status = ? WHERE id = ?',
    [status, claimId]
  );
}

/**
 * Verify that a contract belongs to the authenticated client.
 * Returns the contract row or null.
 */
async function getContractByIdAndUserId(contractId, userId) {
  const [rows] = await pool.execute(
    `SELECT co.id
     FROM contracts co
     JOIN clients   c  ON c.id  = co.client_id
     JOIN users     u  ON u.id  = c.user_id
     WHERE co.id = ? AND u.id = ?`,
    [contractId, userId]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERT REPORTS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new expert report inside a transaction.
 * Returns the new report's id.
 */
async function createExpertReport(
  conn,
  { claim_id, expert_id, report, estimated_damage, report_date }
) {
  const [result] = await conn.execute(
    `INSERT INTO expert_reports
       (claim_id, expert_id, report, estimated_damage, report_date)
     VALUES (?, ?, ?, ?, ?)`,
    [claim_id, expert_id, report, estimated_damage, report_date]
  );
  return result.insertId;
}

/**
 * Fetch all expert reports with claim and expert info (admin view).
 */
async function getAllExpertReports() {
  const [rows] = await pool.execute(
    `SELECT
       er.id              AS report_id,
       er.claim_id,
       er.report,
       er.estimated_damage,
       er.report_date,
       cl.status          AS claim_status,
       cl.description     AS claim_description,
       CONCAT(u.first_name, ' ', u.last_name) AS expert_name,
       u.email            AS expert_email
     FROM expert_reports er
     JOIN claims  cl ON cl.id      = er.claim_id
     JOIN experts ex ON ex.id      = er.expert_id
     JOIN users   u  ON u.id       = ex.user_id
     ORDER BY er.report_date DESC`
  );
  return rows;
}

/**
 * Fetch the expert profile linked to a user_id.
 * Returns { id } (the experts.id PK) or null.
 */
async function getExpertByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT id FROM experts WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Check whether an expert report already exists for a given claim.
 * Prevents duplicate reports on the same claim.
 */
async function getReportByClaimId(claimId) {
  const [rows] = await pool.execute(
    'SELECT id FROM expert_reports WHERE claim_id = ?',
    [claimId]
  );
  return rows[0] || null;
}

module.exports = {
  // claims
  createClaim,
  getAllClaims,
  getClaimById,
  updateClaimStatus,
  updateClaimStatusTx,
  getContractByIdAndUserId,
  // expert reports
  createExpertReport,
  getAllExpertReports,
  getExpertByUserId,
  getReportByClaimId,
};