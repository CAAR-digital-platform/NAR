const pool = require('../db');

/**
 * Insert a new contact message.
 * Returns the insertId of the new record.
 */
async function createMessage({ name, email, subject, message }) {
  const [result] = await pool.execute(
    `INSERT INTO contact_messages (full_name, email, subject, message, status)
     VALUES (?, ?, ?, ?, 'new')`,
    [name, email, subject, message]
  );
  return result.insertId;
}

/**
 * Fetch all contact messages, newest first.
 */
async function getAllMessages() {
  const [rows] = await pool.execute(
    `SELECT id, full_name AS name, email, subject, message, status, created_at
     FROM contact_messages
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Fetch a single message by id.
 */
async function getMessageById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name AS name, email, subject, message, status, created_at
     FROM contact_messages
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Update message status (new → read → replied).
 */
async function updateMessageStatus(id, status) {
  await pool.execute(
    'UPDATE contact_messages SET status = ? WHERE id = ?',
    [status, id]
  );
}

module.exports = {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessageStatus,
};