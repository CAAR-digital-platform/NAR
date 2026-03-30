const messageModel = require('../models/messageModel');

// ─── Valid status values ───────────────────────────────────────────────────
const VALID_STATUSES = ['new', 'read', 'replied'];

/**
 * Submit a new contact message.
 * Validates required fields before writing to DB.
 */
async function submitMessage({ name, email, subject, message }) {
  // Field presence
  const missing = [];
  if (!name)    missing.push('name');
  if (!email)   missing.push('email');
  if (!subject) missing.push('subject');
  if (!message) missing.push('message');

  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  // Basic email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const err = new Error('Invalid email format');
    err.status = 400;
    throw err;
  }

  // Field length guards
  if (name.trim().length < 2) {
    const err = new Error('Name must be at least 2 characters');
    err.status = 400;
    throw err;
  }
  if (message.trim().length < 10) {
    const err = new Error('Message must be at least 10 characters');
    err.status = 400;
    throw err;
  }

  const newId = await messageModel.createMessage({
    name:    name.trim(),
    email:   email.trim().toLowerCase(),
    subject: subject.trim(),
    message: message.trim(),
  });

  return { message_id: newId };
}

/**
 * Retrieve all contact messages (admin only).
 */
async function listMessages() {
  return messageModel.getAllMessages();
}

/**
 * Retrieve a single message by id (admin only).
 */
async function getMessageById(id) {
  const msg = await messageModel.getMessageById(id);
  if (!msg) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }
  return msg;
}

/**
 * Update the status of a contact message (admin only).
 */
async function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(
      `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
    );
    err.status = 400;
    throw err;
  }

  // Confirm the message exists first
  const msg = await messageModel.getMessageById(id);
  if (!msg) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }

  await messageModel.updateMessageStatus(id, status);
  return { message_id: id, status };
}

module.exports = { submitMessage, listMessages, getMessageById, updateStatus };