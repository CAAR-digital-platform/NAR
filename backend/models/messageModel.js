const pool = require('../db');

/**
 * Insert a new contact message.
 * sender_user_id and sender_role are optional — only set when a logged-in
 * user submits the form.
 */
async function createMessage({ name, email, phone, subject, message, sender_user_id, sender_role }) {
  const [result] = await pool.execute(
    `INSERT INTO contact_messages
       (full_name, email, phone, subject, message, status, sender_user_id, sender_role)
     VALUES (?, ?, ?, ?, ?, 'new', ?, ?)`,
    [name, email, phone || null, subject, message,
     sender_user_id || null,
     sender_role    || null]
  );
  return result.insertId;
}

/**
 * Fetch all contact messages, newest first. (Admin)
 */
async function getAllMessages() {
  const [rows] = await pool.execute(
    `SELECT id, full_name AS name, email, phone, subject, message,
            status, sender_user_id, sender_role, created_at
     FROM contact_messages
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Fetch messages sent by a specific user. (Client — "my messages")
 */
async function getMessagesByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT id, full_name AS name, email, phone, subject,
            message, message AS content, status,
            sender_user_id, sender_role, created_at
     FROM contact_messages
     WHERE sender_user_id = ?
     ORDER BY created_at DESC`,
    [userId]
  );
  return rows;
}

/**
 * Fetch a single message by id.
 */
async function getMessageById(id) {
  const [rows] = await pool.execute(
    `SELECT id, full_name AS name, email, phone, subject, message,
            status, sender_user_id, sender_role, created_at
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
  getMessagesByUserId,
  getMessageById,
  updateMessageStatus,
};
