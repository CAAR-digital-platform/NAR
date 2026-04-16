/**
 * models/roadsideModel.js
 *
 * Pure SQL layer for the Roadside Assistance subscription flow.
 *
 * Convention:
 *  - Functions that run OUTSIDE a transaction receive no `conn` argument
 *    and use the shared `pool` directly.
 *  - Functions that run INSIDE a transaction receive a `conn` argument
 *    (a connection obtained with pool.getConnection()) so they share the
 *    same connection as the BEGIN/COMMIT/ROLLBACK calls.
 */

const pool = require('../db');

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a user by email.
 * Returns the full row (including password_hash) or null.
 */
async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

/**
 * Create a new user inside a transaction.
 * Used when the quote form is submitted by someone without an account.
 * Returns the new user's id.
 */
async function createUser(conn, { first_name, last_name, email, password_hash, phone }) {
  const [result] = await conn.execute(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?, 'client')`,
    [first_name, last_name, email, password_hash, phone || null]
  );
  return result.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find a client record by user_id.
 * Returns the client row or null.
 */
async function findClientByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM clients WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

/**
 * Create a client profile inside a transaction.
 * Returns the new client's id.
 */
async function createClient(conn, { user_id, insurance_number }) {
  const [result] = await conn.execute(
    'INSERT INTO clients (user_id, insurance_number) VALUES (?, ?)',
    [user_id, insurance_number]
  );
  return result.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAN
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a plan by id.
 * Returns { id, name, price, description } or null.
 */
async function getPlanById(planId) {
  const [rows] = await pool.execute(
    'SELECT id, name, price, description FROM plans WHERE id = ?',
    [planId]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch the Roadside Assistance product.
 * We query by name so the id never needs to be hardcoded.
 */
async function getRoadsideProduct() {
  const [rows] = await pool.execute(
    "SELECT id, name FROM products WHERE name = 'Roadside Assistance' LIMIT 1"
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a vehicle inside a transaction.
 * Returns the new vehicle's id.
 */
async function createVehicle(conn, { client_id, license_plate, brand, model, year, wilaya }) {
  const [result] = await conn.execute(
    `INSERT INTO vehicles (client_id, license_plate, brand, model, year, wilaya)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [client_id, license_plate, brand, model, year, wilaya || null]
  );
  return result.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// QUOTE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a quote inside a transaction.
 * Returns the new quote's id.
 */
async function createQuote(conn, { client_id, vehicle_id, product_id, plan_id, estimated_amount }) {
  const [result] = await conn.execute(
    `INSERT INTO quotes (client_id, vehicle_id, product_id, plan_id, estimated_amount, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [client_id, vehicle_id, product_id, plan_id, estimated_amount]
  );
  return result.insertId;
}

/**
 * Fetch a quote by id with its client's user_id (for ownership checks).
 * Returns the full quote row joined to client, or null.
 */
async function getQuoteById(quoteId) {
  const [rows] = await pool.execute(
    `SELECT q.*, c.user_id
     FROM quotes q
     JOIN clients c ON c.id = q.client_id
     WHERE q.id = ?`,
    [quoteId]
  );
  return rows[0] || null;
}

/**
 * Same as getQuoteById but uses a transaction connection
 * (needed inside processPayment so we read the latest committed state).
 */
async function getQuoteByIdForUpdate(conn, quoteId) {
  const [rows] = await conn.execute(
    `SELECT q.*, c.user_id
     FROM quotes q
     JOIN clients c ON c.id = q.client_id
     WHERE q.id = ?
     FOR UPDATE`,
    [quoteId]
  );
  return rows[0] || null;
}

/**
 * Update a quote's status (outside a transaction, e.g. for confirmQuote).
 */
async function updateQuoteStatus(quoteId, status) {
  await pool.execute(
    'UPDATE quotes SET status = ? WHERE id = ?',
    [status, quoteId]
  );
}

/**
 * Update a quote's status inside a transaction.
 */
async function updateQuoteStatusTx(conn, quoteId, status) {
  await conn.execute(
    'UPDATE quotes SET status = ? WHERE id = ?',
    [status, quoteId]
  );
}

/**
 * Verify that an active roadside contract belongs to the authenticated user.
 */
async function getActiveRoadsideContractByIdAndUserId(contractId, userId) {
  const [rows] = await pool.execute(
    `SELECT
       co.id AS contract_id,
       co.client_id,
       co.policy_reference,
       u.id AS user_id,
       CONCAT(u.first_name, ' ', u.last_name) AS client_name
     FROM contracts co
     JOIN clients c ON c.id = co.client_id
     JOIN users u ON u.id = c.user_id
     JOIN products p ON p.id = co.product_id
     WHERE co.id = ?
       AND u.id = ?
       AND co.status = 'active'
       AND p.name = 'Roadside Assistance'`,
    [contractId, userId]
  );
  return rows[0] || null;
}

/**
 * Create a roadside request inside a transaction.
 */
async function createRoadsideRequest(
  conn,
  {
    contract_id,
    client_id,
    request_reference,
    problem_type,
    contact_phone,
    location_address,
    wilaya_code,
    city,
    description,
  }
) {
  const [result] = await conn.execute(
    `INSERT INTO roadside_requests
       (
         contract_id,
         client_id,
         request_reference,
         problem_type,
         contact_phone,
         location_address,
         wilaya_code,
         city,
         description,
         status
       )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      contract_id,
      client_id,
      request_reference,
      problem_type,
      contact_phone,
      location_address,
      wilaya_code,
      city || null,
      description,
    ]
  );
  return result.insertId;
}

/**
 * Fetch one roadside request with ownership metadata.
 */
async function getRoadsideRequestById(requestId) {
  const [rows] = await pool.execute(
    `SELECT
       rr.id AS request_id,
       rr.request_reference,
       rr.contract_id,
       rr.client_id,
       rr.problem_type,
       rr.contact_phone,
       rr.location_address,
       rr.wilaya_code,
       rr.city,
       rr.description,
       rr.status,
       rr.created_at,
       rr.updated_at,
       c.user_id,
       co.policy_reference
     FROM roadside_requests rr
     JOIN clients c ON c.id = rr.client_id
     JOIN contracts co ON co.id = rr.contract_id
     WHERE rr.id = ?`,
    [requestId]
  );
  return rows[0] || null;
}

/**
 * List roadside requests for a client.
 */
async function getRoadsideRequestsByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
       rr.id AS request_id,
       rr.request_reference,
       rr.contract_id,
       co.policy_reference,
       rr.problem_type,
       rr.contact_phone,
       rr.location_address,
       rr.wilaya_code,
       rr.city,
       rr.description,
       rr.status,
       rr.created_at,
       rr.updated_at,
       v.license_plate,
       CONCAT(v.brand, ' ', v.model) AS vehicle_label
     FROM roadside_requests rr
     JOIN clients c ON c.id = rr.client_id
     JOIN contracts co ON co.id = rr.contract_id
     LEFT JOIN vehicles v ON v.id = co.vehicle_id
     WHERE c.user_id = ?
     ORDER BY rr.created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * List all roadside requests for admins.
 */
async function getAllRoadsideRequests() {
  const [rows] = await pool.execute(
    `SELECT
       rr.id AS request_id,
       rr.request_reference,
       rr.contract_id,
       co.policy_reference,
       rr.client_id,
       CONCAT(u.first_name, ' ', u.last_name) AS client_name,
       u.email AS client_email,
       rr.problem_type,
       rr.contact_phone,
       rr.location_address,
       rr.wilaya_code,
       rr.city,
       rr.description,
       rr.status,
       rr.created_at,
       rr.updated_at,
       v.license_plate,
       CONCAT(v.brand, ' ', v.model) AS vehicle_label
     FROM roadside_requests rr
     JOIN clients c ON c.id = rr.client_id
     JOIN users u ON u.id = c.user_id
     JOIN contracts co ON co.id = rr.contract_id
     LEFT JOIN vehicles v ON v.id = co.vehicle_id
     ORDER BY rr.created_at DESC`
  );
  return rows;
}

/**
 * Update a roadside request status inside a transaction.
 */
async function updateRoadsideRequestStatusTx(conn, requestId, status) {
  await conn.execute(
    'UPDATE roadside_requests SET status = ? WHERE id = ?',
    [status, requestId]
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONTRACT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a contract inside a transaction.
 * Returns the new contract's id.
 */
async function createContract(conn, {
  client_id,
  vehicle_id,
  product_id,
  plan_id,
  start_date,
  end_date,
  premium_amount,
  policy_reference,
}) {
  const [result] = await conn.execute(
    `INSERT INTO contracts
       (client_id, vehicle_id, product_id, plan_id, start_date, end_date, status, premium_amount, policy_reference)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [client_id, vehicle_id, product_id, plan_id, start_date, end_date, premium_amount, policy_reference]
  );
  return result.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a payment record inside a transaction.
 * Returns the new payment's id.
 */
async function createPayment(conn, { contract_id, amount, payment_date }) {
  const [result] = await conn.execute(
    `INSERT INTO payments (contract_id, amount, payment_date, status)
     VALUES (?, ?, ?, 'paid')`,
    [contract_id, amount, payment_date]
  );
  return result.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// DOCUMENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a document record inside a transaction.
 * Returns the new document's id.
 */
async function createDocument(conn, { client_id, contract_id, file_name, file_path, file_type }) {
  const [result] = await conn.execute(
    `INSERT INTO documents (client_id, contract_id, file_name, file_path, file_type)
     VALUES (?, ?, ?, ?, ?)`,
    [client_id, contract_id, file_name, file_path, file_type || null]
  );
  return result.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a notification inside a transaction.
 * Returns the new notification's id.
 */
async function createNotification(conn, { user_id, title, message, type }) {
  const [result] = await conn.execute(
    `INSERT INTO notifications (user_id, title, message, type, is_read)
     VALUES (?, ?, ?, ?, 0)`,
    [user_id, title, message, type || null]
  );
  return result.insertId;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUDIT LOG
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create an audit log entry inside a transaction.
 */
async function createAuditLog(conn, { user_id, action, table_name, record_id, description }) {
  await conn.execute(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, description)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, action, table_name || null, record_id || null, description || null]
  );
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // user
  findUserByEmail,
  createUser,
  // client
  findClientByUserId,
  createClient,
  // plan / product
  getPlanById,
  getRoadsideProduct,
  // vehicle
  createVehicle,
  // quote
  createQuote,
  getQuoteById,
  getQuoteByIdForUpdate,
  updateQuoteStatus,
  updateQuoteStatusTx,
  // roadside requests
  getActiveRoadsideContractByIdAndUserId,
  createRoadsideRequest,
  getRoadsideRequestById,
  getRoadsideRequestsByUserId,
  getAllRoadsideRequests,
  updateRoadsideRequestStatusTx,
  // contract
  createContract,
  // payment
  createPayment,
  // document
  createDocument,
  // notification
  createNotification,
  // audit
  createAuditLog,
};
