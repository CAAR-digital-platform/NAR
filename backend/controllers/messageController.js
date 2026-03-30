const messageService = require('../services/messageService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages  — public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a contact message.
 * Body: { name, email, subject, message }
 */
async function submit(req, res) {
  const { name, email, subject, message } = req.body;

  try {
    const result = await messageService.submitMessage({
      name,
      email,
      subject,
      message,
    });
    return res.status(201).json({
      message: 'Your message has been received. We will get back to you shortly.',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages  — admin only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all contact messages.
 */
async function list(req, res) {
  try {
    const messages = await messageService.listMessages();
    return res.status(200).json({ count: messages.length, messages });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages/:id  — admin only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a single contact message by id.
 */
async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const msg = await messageService.getMessageById(id);
    return res.status(200).json(msg);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/messages/:id/status  — admin only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the status of a contact message.
 * Body: { status }  — one of: 'new' | 'read' | 'replied'
 */
async function updateStatus(req, res) {
  const id     = parseInt(req.params.id, 10);
  const { status } = req.body;

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  if (!status) {
    return res.status(400).json({ error: 'status is required' });
  }

  try {
    const result = await messageService.updateStatus(id, status);
    return res.status(200).json({
      message: 'Status updated successfully',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { submit, list, getOne, updateStatus };