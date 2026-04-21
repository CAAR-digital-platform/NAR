'use strict';

const pool = require('../db');
const { generateInsuranceNumber } = require('../utils/subscriptionHelpers');

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, phone, role, is_active, must_change_password, created_at
     FROM users
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function findRoleById(id) {
  const [rows] = await pool.query(
    `SELECT id, role
     FROM users
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listForAdmin() {
  const [rows] = await pool.query(
    `SELECT id, first_name, last_name, email, phone, role, is_active, must_change_password, created_at
     FROM users
     ORDER BY created_at DESC`
  );
  return rows;
}

async function updateActiveStatus(userId, isActive) {
  const [result] = await pool.query(
    `UPDATE users
     SET is_active = ?
     WHERE id = ?`,
    [isActive ? 1 : 0, userId]
  );
  return result.affectedRows;
}

async function findAuthById(id) {
  const [rows] = await pool.query(
    `SELECT id, email, password_hash, must_change_password
     FROM users
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createUser({ first_name, last_name, email, password_hash, phone, role, must_change_password }) {
  const mustChange = must_change_password ? 1 : 0;
  const [result] = await pool.query(
    `INSERT INTO users (first_name, last_name, email, password_hash, phone, role, must_change_password)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [first_name, last_name, email, password_hash, phone || null, role || 'client', mustChange]
  );
  return result.insertId;
}

async function createClient(userId) {
  const [result] = await pool.query(
    'INSERT INTO clients (user_id, insurance_number) VALUES (?, ?)',
    [userId, generateInsuranceNumber()]
  );
  return result.insertId;
}

async function updateProfile(userId, { first_name, last_name, email, phone }) {
  await pool.query(
    `UPDATE users
     SET first_name = ?, last_name = ?, email = ?, phone = ?
     WHERE id = ?`,
    [first_name, last_name, email, phone || null, userId]
  );
}

async function updatePassword(userId, passwordHash) {
  await pool.query(
    `UPDATE users
     SET password_hash = ?,
         must_change_password = 0
     WHERE id = ?`,
    [passwordHash, userId]
  );
}

module.exports = {
  findByEmail,
  findById,
  findRoleById,
  findAuthById,
  createUser,
  createClient,
  updateProfile,
  updatePassword,
  listForAdmin,
  updateActiveStatus,
};
