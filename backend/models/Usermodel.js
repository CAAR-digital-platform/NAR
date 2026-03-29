const pool = require('../db');

/**
 * Find a user by their email address.
 * Returns the full row (including password_hash) — callers must not expose it.
 */
async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

/**
 * Find a user by their id.
 * Excludes the password_hash for safety.
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
 * Returns the insertId of the new record.
 */
async function createUser({ first_name, last_name, email, password_hash, phone, role }) {
  const [result] = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, email, password_hash, phone || null, role || 'client']
  );
  return result.insertId;
}

module.exports = { findByEmail, findById, createUser };