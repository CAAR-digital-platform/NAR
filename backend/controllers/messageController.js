const messageService = require('../services/messageService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/messages  — public (unauthenticated) OR authenticated
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a contact message.
 * Body: { name, email, subject, message }
 *
 * If the request carries a valid JWT (authMiddleware ran), req.user will be
 * set and we attach sender_user_id + sender_role automatically.
 * The route is kept public — unauthenticated submissions still work.
 */
async function submit(req, res) {
  const { name, email, phone, subject, message } = req.body;

  // Attach sender identity when the user is logged in
  const sender_user_id = req.user ? req.user.id   : null;
  const sender_role    = req.user ? req.user.role  : null;

  try {
    const result = await messageService.submitMessage({
      name,
      email,
      phone,
      subject,
      message,
      sender_user_id,
      sender_role,
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
// GET /api/messages/my  — authenticated clients
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List messages submitted by the current authenticated user.
 */
async function listMy(req, res) {
  try {
    const messages = await messageService.listMyMessages(req.user.id);
    return res.status(200).json({ count: messages.length, messages });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/messages  — admin only
// ─────────────────────────────────────────────────────────────────────────────

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
    return res.status(200).json({ message: 'Status updated successfully', ...result });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { submit, listMy, list, getOne, updateStatus };
