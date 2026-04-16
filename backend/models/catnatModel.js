/**
 * models/catnatModel.js
 *
 * Pure SQL layer for the CATNAT (Natural Disaster) subscription flow.
 * Mirrors roadsideModel.js — properties replace vehicles.
 *
 * Convention:
 *   - No `conn` param  → uses shared pool (reads / single writes)
 *   - `conn` param     → runs inside a caller-managed transaction
 */

'use strict';

const pool = require('../db');

// ─── USER ─────────────────────────────────────────────────────────────────────

async function findUserByEmail(email) {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function createUser(conn, { first_name, last_name, email, password_hash, phone }) {
  const [result] = await conn.execute(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?, 'client')`,
    [first_name, last_name, email, password_hash, phone || null]
  );
  return result.insertId;
}

// ─── CLIENT ───────────────────────────────────────────────────────────────────

async function findClientByUserId(userId) {
  const [rows] = await pool.execute(
    'SELECT * FROM clients WHERE user_id = ?',
    [userId]
  );
  return rows[0] || null;
}

async function createClient(conn, { user_id, insurance_number }) {
  const [result] = await conn.execute(
    'INSERT INTO clients (user_id, insurance_number) VALUES (?, ?)',
    [user_id, insurance_number]
  );
  return result.insertId;
}

// ─── PLAN & PRODUCT ───────────────────────────────────────────────────────────

async function getPlanById(planId) {
  const [rows] = await pool.execute(
    'SELECT id, name, price, description FROM plans WHERE id = ? AND is_active = 1',
    [planId]
  );
  return rows[0] || null;
}

async function getCatnatProduct() {
  const [rows] = await pool.execute(
    `SELECT id, name FROM products
     WHERE name = 'Natural Disaster (CATNAT)' AND is_active = 1
     LIMIT 1`
  );
  return rows[0] || null;
}

// ─── PROPERTY ─────────────────────────────────────────────────────────────────

async function createProperty(conn, {
  client_id,
  construction_type,
  usage_type,
  built_area,
  num_floors,
  year_construction,
  declared_value,
  address,
  wilaya_id,
  city_id,
  is_seismic_compliant,
  has_notarial_deed,
  is_commercial,
  extra_coverages,
}) {
  const [result] = await conn.execute(
    `INSERT INTO properties
       (client_id, construction_type, usage_type, built_area, num_floors,
        year_construction, declared_value, address, wilaya_id, city_id,
        is_seismic_compliant, has_notarial_deed, is_commercial, extra_coverages)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      client_id,
      construction_type  || null,
      usage_type         || null,
      built_area         || null,
      num_floors         || null,
      year_construction  || null,
      declared_value     || null,
      address            || null,
      wilaya_id          || null,
      city_id            || null,
      is_seismic_compliant ? 1 : 0,
      has_notarial_deed    ? 1 : 0,
      is_commercial        ? 1 : 0,
      extra_coverages ? JSON.stringify(extra_coverages) : null,
    ]
  );
  return result.insertId;
}

// ─── QUOTE ────────────────────────────────────────────────────────────────────

async function createQuote(conn, {
  client_id,
  property_id,
  product_id,
  plan_id,
  estimated_amount,
}) {
  const [result] = await conn.execute(
    `INSERT INTO quotes
       (client_id, property_id, product_id, plan_id, estimated_amount, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [client_id, property_id, product_id, plan_id, estimated_amount]
  );
  return result.insertId;
}

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

async function updateQuoteStatus(quoteId, status) {
  await pool.execute(
    'UPDATE quotes SET status = ? WHERE id = ?',
    [status, quoteId]
  );
}

async function updateQuoteStatusTx(conn, quoteId, status) {
  await conn.execute(
    'UPDATE quotes SET status = ? WHERE id = ?',
    [status, quoteId]
  );
}

// ─── CONTRACT ─────────────────────────────────────────────────────────────────

async function createContract(conn, {
  client_id,
  property_id,
  product_id,
  plan_id,
  start_date,
  end_date,
  premium_amount,
  policy_reference,
}) {
  const [result] = await conn.execute(
    `INSERT INTO contracts
       (client_id, property_id, product_id, plan_id,
        start_date, end_date, status, premium_amount, policy_reference)
     VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
    [
      client_id, property_id, product_id, plan_id,
      start_date, end_date, premium_amount, policy_reference,
    ]
  );
  return result.insertId;
}

// ─── PAYMENT ──────────────────────────────────────────────────────────────────

async function createPayment(conn, { contract_id, amount, payment_date }) {
  const [result] = await conn.execute(
    `INSERT INTO payments (contract_id, amount, payment_date, status)
     VALUES (?, ?, ?, 'paid')`,
    [contract_id, amount, payment_date]
  );
  return result.insertId;
}

// ─── NOTIFICATION ─────────────────────────────────────────────────────────────

async function createNotification(conn, { user_id, title, message, type }) {
  const [result] = await conn.execute(
    `INSERT INTO notifications (user_id, title, message, type, is_read)
     VALUES (?, ?, ?, ?, 0)`,
    [user_id, title, message, type || null]
  );
  return result.insertId;
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

async function createAuditLog(conn, {
  user_id, action, table_name, record_id, description,
}) {
  await conn.execute(
    `INSERT INTO audit_logs (user_id, action, table_name, record_id, description)
     VALUES (?, ?, ?, ?, ?)`,
    [user_id, action, table_name || null, record_id || null, description || null]
  );
}

// ─── DOCUMENT ─────────────────────────────────────────────────────────────────

async function createDocument(conn, {
  client_id, contract_id, file_name, file_path, file_type,
}) {
  const [result] = await conn.execute(
    `INSERT INTO documents (client_id, contract_id, file_name, file_path, file_type)
     VALUES (?, ?, ?, ?, ?)`,
    [client_id, contract_id, file_name, file_path, file_type || null]
  );
  return result.insertId;
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
  getCatnatProduct,
  // property
  createProperty,
  // quote
  createQuote,
  getQuoteById,
  getQuoteByIdForUpdate,
  updateQuoteStatus,
  updateQuoteStatusTx,
  // contract
  createContract,
  // payment
  createPayment,
  // notification
  createNotification,
  // audit
  createAuditLog,
  // document
  createDocument,
};