const pool = require('../db');
const crypto = require('crypto');

/**
 * Find a user by their email address.
 */
async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

/**
 * Find a user by their id (no password_hash).
 */
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, phone, role, created_at
     FROM users WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Insert a new user row.
 */
async function createUser({ first_name, last_name, email, password_hash, phone, role }) {
  const [result] = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, email, password_hash, phone || null, role || 'client']
  );
  return result.insertId;
}

/**
 * Insert a client profile row for a newly registered user.
 * Generates a unique insurance number: CAAR-YYYYMMDD-XXXX
 */
async function createClient(userId) {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase().slice(0, 4);
  const insurance_number = `CAAR-${date}-${rand}`;

  const [result] = await pool.query(
    'INSERT INTO clients (user_id, insurance_number) VALUES (?, ?)',
    [userId, insurance_number]
  );
  return result.insertId;
}

module.exports = { findByEmail, findById, createUser, createClient };