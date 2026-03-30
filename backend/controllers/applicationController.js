const applicationService = require('../services/applicationService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/applications  — public
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Submit a job application.
 * Body: { first_name, last_name, email, phone?, field_of_interest?,
 *         position_sought?, message?, cv_file? }
 */
async function submit(req, res) {
  const {
    first_name,
    last_name,
    email,
    phone,
    field_of_interest,
    position_sought,
    message,
    cv_file,
  } = req.body;

  try {
    const result = await applicationService.submitApplication({
      first_name,
      last_name,
      email,
      phone,
      field_of_interest,
      position_sought,
      message,
      cv_file,
    });
    return res.status(201).json({
      message: 'Your application has been submitted successfully. Our HR team will review it shortly.',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications  — admin only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List all job applications.
 */
async function list(req, res) {
  try {
    const applications = await applicationService.listApplications();
    return res.status(200).json({ count: applications.length, applications });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/applications/:id  — admin only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get a single application by id.
 */
async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const app = await applicationService.getApplicationById(id);
    return res.status(200).json(app);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/applications/:id/status  — admin only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Update the status of a job application.
 * Body: { status }  — one of: 'pending' | 'reviewed' | 'accepted' | 'rejected'
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
    const result = await applicationService.updateStatus(id, status);
    return res.status(200).json({
      message: 'Application status updated successfully',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { submit, list, getOne, updateStatus };