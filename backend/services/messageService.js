const pool = require('../db');
const messageModel = require('../models/messageModel');
const notificationService = require('./notificationService');

const VALID_STATUSES = ['new', 'read', 'replied'];

async function submitMessage({ name, email, phone, subject, message, sender_user_id, sender_role }) {
  const missing = [];
  if (!name) missing.push('name');
  if (!email) missing.push('email');
  if (!subject) missing.push('subject');
  if (!message) missing.push('message');

  if (missing.length > 0) {
    const err = new Error(`Missing required fields: ${missing.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    const err = new Error('Invalid email format');
    err.status = 400;
    throw err;
  }

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
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone ? phone.trim() : null,
    subject: subject.trim(),
    message: message.trim(),
    sender_user_id: sender_user_id || null,
    sender_role: sender_role || null,
  });

  try {
    await notificationService.messageReceived(pool, {
      message_id: newId,
      sender_name: name.trim(),
      subject: subject.trim(),
    });
  } catch (notifErr) {
    console.error('[Messages] messageReceived notification failed:', notifErr.message);
  }

  return { message_id: newId };
}

async function listMessages() {
  return messageModel.getAllMessages();
}

async function listMyMessages(userId) {
  return messageModel.getMessagesByUserId(userId);
}

async function getMessageById(id) {
  const msg = await messageModel.getMessageById(id);
  if (!msg) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }
  return msg;
}

async function updateStatus(id, status) {
  if (!VALID_STATUSES.includes(status)) {
    const err = new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
    err.status = 400;
    throw err;
  }

  const msg = await messageModel.getMessageById(id);
  if (!msg) {
    const err = new Error('Message not found');
    err.status = 404;
    throw err;
  }

  await messageModel.updateMessageStatus(id, status);
  return { message_id: id, status };
}

module.exports = {
  submitMessage,
  listMessages,
  listMyMessages,
  getMessageById,
  updateStatus,
};
