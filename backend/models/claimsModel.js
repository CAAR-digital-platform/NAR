/**
 * models/claimsModel.js
 *
 * All SQL for Claims, ExpertReports, and Expert availability.
 * Functions that run inside a transaction receive a `conn` argument.
 */

const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// CLAIMS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Insert a new claim with ALL schema columns.
 * client_id is resolved in the service from the contract and stored
 * directly on the claim row for fast ownership lookups.
 */
async function createClaim({
  contract_id,
  client_id,
  agency_id,
  description,
  claim_date,
  incident_location,
  incident_wilaya_id,
}) {
  const [result] = await pool.execute(
    `INSERT INTO claims
       (contract_id, client_id, agency_id, description, status, claim_date,
        incident_location, incident_wilaya_id)
     VALUES (?, ?, ?, ?, 'pending', ?, ?, ?)`,
    [
      contract_id,
      client_id,
      agency_id          || null,
      description,
      claim_date,
      incident_location  || null,
      incident_wilaya_id ? parseInt(incident_wilaya_id, 10) : null,
    ]
  );
  return result.insertId;
}

/**
 * All claims for admin — joins to resolve client name.
 */
async function getAllClaims() {
  const [rows] = await pool.execute(
    `SELECT
       cl.id              AS claim_id,
       cl.contract_id,
       cl.client_id,
       cl.agency_id,
       cl.expert_id,
       cl.description,
       cl.status,
       cl.claim_date,
       cl.incident_location,
       cl.incident_wilaya_id,
       cl.rejection_reason,
       CONCAT(u.first_name, ' ', u.last_name) AS client_name,
       u.email            AS client_email
     FROM claims cl
     JOIN clients   c  ON c.id  = cl.client_id
     JOIN users     u  ON u.id  = c.user_id
     ORDER BY cl.claim_date DESC`
  );
  return rows;
}

/**
 * Claims that belong to a specific client (for the client dashboard).
 */
async function getClaimsByClientId(clientId) {
  const [rows] = await pool.execute(
    `SELECT
       cl.id              AS claim_id,
       cl.contract_id,
       cl.description,
       cl.status,
       cl.claim_date,
       cl.incident_location,
       cl.rejection_reason
     FROM claims cl
     WHERE cl.client_id = ?
     ORDER BY cl.claim_date DESC`,
    [clientId]
  );
  return rows;
}

/**
 * Single claim by id — includes client_id and user_id for ownership checks.
 */
async function getClaimById(claimId) {
  const [rows] = await pool.execute(
    `SELECT
       cl.id              AS claim_id,
       cl.contract_id,
       cl.client_id,
       cl.expert_id,
       cl.description,
       cl.status,
       cl.claim_date,
       c.user_id
     FROM claims     cl
     JOIN clients    c  ON c.id  = cl.client_id
     WHERE cl.id = ?`,
    [claimId]
  );
  return rows[0] || null;
}

/**
 * Update status (outside transaction — admin status machine).
 */
async function updateClaimStatus(claimId, status) {
  await pool.execute(
    'UPDATE claims SET status = ? WHERE id = ?',
    [status, claimId]
  );
}

/**
 * Update status inside a transaction.
 */
async function updateClaimStatusTx(conn, claimId, status) {
  await conn.execute(
    'UPDATE claims SET status = ? WHERE id = ?',
    [status, claimId]
  );
}

/**
 * Assign expert inside a transaction.
 */
async function assignExpertTx(conn, claimId, expertId) {
  await conn.execute(
    'UPDATE claims SET expert_id = ? WHERE id = ?',
    [expertId, claimId]
  );
}

/**
 * Verify that a contract belongs to the authenticated user
 * AND is active (prevents claims on expired contracts).
 * Returns { id, client_id } or null.
 */
async function getActiveContractByIdAndUserId(contractId, userId) {
  const [rows] = await pool.execute(
    `SELECT co.id, c.id AS client_id
     FROM contracts co
     JOIN clients   c  ON c.id  = co.client_id
     JOIN users     u  ON u.id  = c.user_id
     WHERE co.id = ? AND u.id = ? AND co.status = 'active'`,
    [contractId, userId]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERT REPORTS
// ─────────────────────────────────────────────────────────────────────────────

async function createExpertReport(
  conn,
  { claim_id, expert_id, report, estimated_damage, report_date, conclusion }
) {
  const [result] = await conn.execute(
    `INSERT INTO expert_reports
       (claim_id, expert_id, report, estimated_damage, report_date, conclusion)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [claim_id, expert_id, report, estimated_damage, report_date, conclusion || null]
  );
  return result.insertId;
}

async function getAllExpertReports() {
  const [rows] = await pool.execute(
    `SELECT
       er.id              AS report_id,
       er.claim_id,
       er.report,
       er.estimated_damage,
       er.report_date,
       er.conclusion,
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

async function getExpertByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT ex.id, ex.user_id, ex.specialization, ex.agency_id, ex.wilaya_id, ex.is_available,
            ag.name AS agency_name, w.name_fr AS wilaya_name
     FROM experts ex
     LEFT JOIN agencies ag ON ag.id = ex.agency_id
     LEFT JOIN wilayas w ON w.id = ex.wilaya_id
     WHERE ex.user_id = ?`,
    [userId]
  );
  return rows[0] || null;
}

async function getAssignedClaimsByExpertId(expertId) {
  const [rows] = await pool.execute(
    `SELECT
       cl.id AS claim_id,
       cl.contract_id,
       cl.description,
       cl.status,
       cl.claim_date,
       cl.incident_location,
       CONCAT(u.first_name, ' ', u.last_name) AS client_name,
       u.email AS client_email
     FROM claims cl
     JOIN clients c ON c.id = cl.client_id
     JOIN users u ON u.id = c.user_id
     WHERE cl.expert_id = ?
     ORDER BY cl.claim_date DESC, cl.id DESC`,
    [expertId]
  );
  return rows;
}

async function updateExpertAvailability(expertId, isAvailable) {
  const [result] = await pool.execute(
    'UPDATE experts SET is_available = ? WHERE id = ?',
    [isAvailable ? 1 : 0, expertId]
  );
  return result.affectedRows;
}

async function getReportByClaimId(claimId) {
  const [rows] = await pool.execute(
    'SELECT id FROM expert_reports WHERE claim_id = ?',
    [claimId]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPERT AVAILABILITY  (was raw SQL in claimsService — now lives here)
// ─────────────────────────────────────────────────────────────────────────────

async function setExpertAvailabilityTx(conn, expertId, isAvailable) {
  await conn.execute(
    'UPDATE experts SET is_available = ? WHERE id = ?',
    [isAvailable ? 1 : 0, expertId]
  );
}

module.exports = {
  // claims
  createClaim,
  getAllClaims,
  getClaimsByClientId,
  getClaimById,
  updateClaimStatus,
  updateClaimStatusTx,
  assignExpertTx,
  getActiveContractByIdAndUserId,
  // expert reports
  createExpertReport,
  getAllExpertReports,
  getExpertByUserId,
  getReportByClaimId,
  getAssignedClaimsByExpertId,
  updateExpertAvailability,
  // expert availability
  setExpertAvailabilityTx,
};
