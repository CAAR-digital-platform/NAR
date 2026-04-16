/**
 * services/notificationService.js
 *
 * Centralized event-based notification dispatcher.
 * All callers pass a pool connection (conn) so notifications are written
 * inside the same transaction as the triggering event — ensuring
 * no notification is ever orphaned if the main operation rolls back.
 *
 * Supported triggers:
 *   claimCreated       → notify every admin user
 *   claimStatusUpdated → notify the client who owns the claim
 *   expertAssigned     → notify the assigned expert
 *   roadsideCreated    → notify every admin user
 *   roadsideRequestCreated → notify every admin user
 *   roadsideRequestStatusUpdated → notify the client who owns the request
 *   messageReceived    → notify every admin user
 *
 * Storage: notifications table (already in the DB).
 * No real-time — text-only rows, polled by the frontend.
 */

'use strict';

const pool = require('../db');

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Insert a single notification row.
 * Uses `conn` when inside a transaction, falls back to `pool` otherwise.
 */
async function _insert(connOrPool, { user_id, title, message, type }) {
  await connOrPool.execute(
    `INSERT INTO notifications (user_id, title, message, type, is_read)
     VALUES (?, ?, ?, ?, 0)`,
    [user_id, title, message, type || 'system']
  );
}

/**
 * Fetch all user IDs with a given role.
 * Uses the shared pool (read-only — safe outside any transaction).
 */
async function _getAdminUserIds() {
  const [rows] = await pool.execute(
    `SELECT id FROM users WHERE role = 'admin' AND is_active = 1`
  );
  return rows.map(r => r.id);
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Trigger: client submits a new claim.
 * Notifies all admin users.
 *
 * @param {object} conn         - transaction connection (or pool)
 * @param {object} opts
 * @param {number} opts.claim_id
 * @param {number} opts.client_id
 * @param {string} opts.client_name   - human-readable name for the message
 * @param {number} opts.contract_id
 */
async function claimCreated(conn, { claim_id, client_name, contract_id }) {
  const adminIds = await _getAdminUserIds();
  for (const admin_id of adminIds) {
    await _insert(conn, {
      user_id: admin_id,
      title:   'New Claim Submitted',
      message: `Claim #${claim_id} was submitted by ${client_name || 'a client'} (contract #${contract_id}).`,
      type:    'claim',
    });
  }
}

/**
 * Trigger: admin updates a claim's status.
 * Notifies the client who owns the claim.
 *
 * @param {object} conn
 * @param {object} opts
 * @param {number} opts.claim_id
 * @param {string} opts.new_status
 * @param {number} opts.client_user_id   - users.id of the claim owner
 */
async function claimStatusUpdated(conn, { claim_id, new_status, client_user_id }) {
  const statusLabels = {
    under_review:    'is now under review',
    expert_assigned: 'has been assigned to an expert',
    reported:        'has received an expert report',
    approved:        'has been approved',
    closed:          'has been closed',
    rejected:        'has been rejected',
  };
  const label = statusLabels[new_status] || `status changed to "${new_status}"`;

  await _insert(conn, {
    user_id: client_user_id,
    title:   'Claim Status Updated',
    message: `Your claim #${claim_id} ${label}.`,
    type:    'claim',
  });
}

/**
 * Trigger: admin assigns an expert to a claim.
 * Notifies the expert.
 *
 * @param {object} conn
 * @param {object} opts
 * @param {number} opts.claim_id
 * @param {number} opts.expert_user_id   - users.id of the expert
 */
async function expertAssigned(conn, { claim_id, expert_user_id }) {
  await _insert(conn, {
    user_id: expert_user_id,
    title:   'New Claim Assignment',
    message: `You have been assigned to claim #${claim_id}. Please review it at your earliest convenience.`,
    type:    'claim',
  });
}

/**
 * Trigger: a roadside assistance subscription quote is created.
 * Notifies all admin users.
 *
 * @param {object} conn
 * @param {object} opts
 * @param {number} opts.quote_id
 * @param {string} opts.client_name
 */
async function roadsideCreated(conn, { quote_id, client_name }) {
  const adminIds = await _getAdminUserIds();
  for (const admin_id of adminIds) {
    await _insert(conn, {
      user_id: admin_id,
      title:   'New Roadside Assistance Request',
      message: `${client_name || 'A client'} submitted a new Roadside Assistance subscription (quote #${quote_id}).`,
      type:    'contract',
    });
  }
}

/**
 * Trigger: client submits a contract-backed roadside assistance request.
 * Notifies all admin users.
 *
 * @param {object} conn
 * @param {object} opts
 * @param {number} opts.request_id
 * @param {string} opts.request_reference
 * @param {string} opts.client_name
 * @param {number} opts.contract_id
 */
async function roadsideRequestCreated(
  conn,
  { request_id, request_reference, client_name, contract_id }
) {
  const adminIds = await _getAdminUserIds();
  for (const admin_id of adminIds) {
    await _insert(conn, {
      user_id: admin_id,
      title: 'New Roadside Request',
      message: `${client_name || 'A client'} submitted roadside request ${request_reference || '#' + request_id} for contract #${contract_id}.`,
      type: 'roadside',
    });
  }
}

/**
 * Trigger: admin updates a roadside request status.
 * Notifies the client who owns the request.
 *
 * @param {object} conn
 * @param {object} opts
 * @param {number} opts.request_id
 * @param {string} opts.request_reference
 * @param {string} opts.new_status
 * @param {number} opts.client_user_id
 */
async function roadsideRequestStatusUpdated(
  conn,
  { request_id, request_reference, new_status, client_user_id }
) {
  const statusLabels = {
    dispatched: 'has been dispatched',
    completed: 'has been completed',
  };
  const label = statusLabels[new_status] || `status changed to "${new_status}"`;
  const ref = request_reference || `#${request_id}`;

  await _insert(conn, {
    user_id: client_user_id,
    title: 'Roadside Request Updated',
    message: `Your roadside request ${ref} ${label}.`,
    type: 'roadside',
  });
}

/**
 * Trigger: a contact message is received.
 * Notifies all admin users.
 *
 * @param {object} conn         - can be pool (this runs outside a transaction)
 * @param {object} opts
 * @param {number} opts.message_id
 * @param {string} opts.sender_name
 * @param {string} opts.subject
 */
async function messageReceived(conn, { message_id, sender_name, subject }) {
  const adminIds = await _getAdminUserIds();
  for (const admin_id of adminIds) {
    await _insert(conn, {
      user_id: admin_id,
      title:   'New Contact Message',
      message: `${sender_name || 'A visitor'} sent a message: "${subject}". (Message #${message_id})`,
      type:    'system',
    });
  }
}

async function listForUser(userId, limit = 25) {
  const safeLimit = Math.max(1, Math.min(parseInt(limit, 10) || 25, 100));
  const [rows] = await pool.execute(
    `SELECT id, user_id, title, message, type, event_type, entity_type,
            entity_id, is_read, created_at
     FROM notifications
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ${safeLimit}`,
    [userId]
  );
  return rows.map(row => ({
    ...row,
    is_read: Boolean(row.is_read),
  }));
}

async function markReadForUser(notificationId, userId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE id = ? AND user_id = ?`,
    [notificationId, userId]
  );

  if (result.affectedRows === 0) {
    const err = new Error('Notification not found');
    err.status = 404;
    throw err;
  }

  return { notification_id: notificationId, is_read: true };
}

async function markAllReadForUser(userId) {
  const [result] = await pool.execute(
    `UPDATE notifications
     SET is_read = 1
     WHERE user_id = ? AND is_read = 0`,
    [userId]
  );

  return { updated: result.affectedRows };
}

module.exports = {
  claimCreated,
  claimStatusUpdated,
  expertAssigned,
  roadsideCreated,
  roadsideRequestCreated,
  roadsideRequestStatusUpdated,
  messageReceived,
  listForUser,
  markReadForUser,
  markAllReadForUser,
};
