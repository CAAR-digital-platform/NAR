/**
 * controllers/roadsideController.js
 *
 * Thin HTTP layer: validate inputs, call the service, return JSON.
 * No business logic lives here.
 */

const roadsideService = require('../services/roadsideService');

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/roadside/quote
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Create a new roadside assistance quote.
 * Public endpoint — no JWT required.
 *
 * Body: {
 *   first_name, last_name, email, phone,
 *   license_plate, brand, model, year, wilaya,
 *   plan_id
 * }
 *
 * Returns: { quote_id, estimated_amount, plan_name, token }
 * The token lets the user immediately call /confirm and /pay.
 */
async function createQuote(req, res) {
  const {
    first_name,
    last_name,
    email,
    phone,
    license_plate,
    brand,
    model,
    year,
    wilaya,
    plan_id,
  } = req.body;

  // ── Input validation ──────────────────────────────────────────────────────
  const missing = [];
  if (!first_name)    missing.push('first_name');
  if (!last_name)     missing.push('last_name');
  if (!email)         missing.push('email');
  if (!license_plate) missing.push('license_plate');
  if (!brand)         missing.push('brand');
  if (!model)         missing.push('model');
  if (!year)          missing.push('year');
  if (!plan_id)       missing.push('plan_id');

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const yearNum = parseInt(year, 10);
  const currentYear = new Date().getFullYear();
  if (isNaN(yearNum) || yearNum < 1900 || yearNum > currentYear) {
    return res.status(400).json({
      error: `Vehicle year must be between 1900 and ${currentYear}`,
    });
  }

  const planIdNum = parseInt(plan_id, 10);
  if (isNaN(planIdNum) || planIdNum < 1) {
    return res.status(400).json({ error: 'plan_id must be a positive integer' });
  }

  // ── Service call ──────────────────────────────────────────────────────────
  try {
    const result = await roadsideService.createQuote({
      first_name:    first_name.trim(),
      last_name:     last_name.trim(),
      email:         email.trim().toLowerCase(),
      phone:         phone ? phone.trim() : null,
      license_plate: license_plate.trim().toUpperCase(),
      brand:         brand.trim(),
      model:         model.trim(),
      year:          yearNum,
      wilaya:        wilaya ? wilaya.trim() : null,
      plan_id:       planIdNum,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/roadside/confirm/:quoteId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Confirm a quote (moves status from 'pending' to 'confirmed').
 * Protected — requires a valid JWT.
 *
 * Returns: { message, quote_id }
 */
async function confirmQuote(req, res) {
  const quoteId = parseInt(req.params.quoteId, 10);

  if (isNaN(quoteId) || quoteId < 1) {
    return res.status(400).json({ error: 'quoteId must be a positive integer' });
  }

  try {
    const result = await roadsideService.confirmQuote(quoteId, req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/roadside/pay/:quoteId
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process payment for a confirmed quote.
 * Protected — requires a valid JWT.
 *
 * Body (all optional):
 *   document: { file_name, file_path, file_type }
 *
 * Returns: {
 *   message, policy_reference, contract_id,
 *   start_date, end_date, amount_paid
 * }
 */
async function processPayment(req, res) {
  const quoteId = parseInt(req.params.quoteId, 10);

  if (isNaN(quoteId) || quoteId < 1) {
    return res.status(400).json({ error: 'quoteId must be a positive integer' });
  }

  // Optional document upload data
  const documentData = req.body.document || null;

  // Basic document validation if provided
  if (documentData) {
    if (!documentData.file_name || !documentData.file_path) {
      return res.status(400).json({
        error: 'If providing a document, file_name and file_path are required',
      });
    }
  }

  try {
    const result = await roadsideService.processPayment(
      quoteId,
      req.user.id,
      documentData
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = { createQuote, confirmQuote, processPayment };