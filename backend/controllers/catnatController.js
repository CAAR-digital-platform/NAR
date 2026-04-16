/**
 * controllers/catnatController.js
 *
 * Thin HTTP layer for the CATNAT subscription flow.
 * POST /api/catnat/quote
 * POST /api/catnat/confirm/:quoteId
 * POST /api/catnat/pay/:quoteId
 */

'use strict';

const catnatService = require('../services/catnatService');

// ── POST /api/catnat/quote ────────────────────────────────────────────────────
async function createQuote(req, res) {
  const {
    // Policyholder
    first_name, last_name, email, phone,
    // Property
    construction_type, usage_type,
    built_area, num_floors, year_construction, declared_value,
    address, wilaya_id, city_id,
    is_seismic_compliant, has_notarial_deed, is_commercial,
    extra_coverages,
    // Plan
    plan_id,
  } = req.body;

  // Input validation
  const missing = [];
  if (!first_name)       missing.push('first_name');
  if (!last_name)        missing.push('last_name');
  if (!email)            missing.push('email');
  if (!construction_type) missing.push('construction_type');
  if (!usage_type)       missing.push('usage_type');
  if (!built_area)       missing.push('built_area');
  if (!year_construction) missing.push('year_construction');
  if (!declared_value)   missing.push('declared_value');
  if (!plan_id)          missing.push('plan_id');

  if (missing.length > 0) {
    return res.status(400).json({
      error: `Missing required fields: ${missing.join(', ')}`,
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  const year    = parseInt(year_construction, 10);
  const curYear = new Date().getFullYear();
  if (isNaN(year) || year < 1900 || year > curYear) {
    return res.status(400).json({
      error: `year_construction must be between 1900 and ${curYear}`,
    });
  }

  const planIdNum = parseInt(plan_id, 10);
  if (isNaN(planIdNum) || planIdNum < 1) {
    return res.status(400).json({ error: 'plan_id must be a positive integer' });
  }

  try {
    const result = await catnatService.createQuote({
      first_name:    first_name.trim(),
      last_name:     last_name.trim(),
      email:         email.trim().toLowerCase(),
      phone:         phone ? phone.trim() : null,
      construction_type,
      usage_type,
      built_area:        parseFloat(built_area),
      num_floors:        num_floors || null,
      year_construction: year,
      declared_value:    parseFloat(declared_value),
      address:           address    ? address.trim()    : null,
      wilaya_id:         wilaya_id  ? parseInt(wilaya_id,  10) : null,
      city_id:           city_id    ? parseInt(city_id,    10) : null,
      is_seismic_compliant: !!is_seismic_compliant,
      has_notarial_deed:    !!has_notarial_deed,
      is_commercial:        !!is_commercial,
      extra_coverages:      Array.isArray(extra_coverages) ? extra_coverages : [],
      plan_id:           planIdNum,
    });

    return res.status(201).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ── POST /api/catnat/confirm/:quoteId ────────────────────────────────────────
async function confirmQuote(req, res) {
  const quoteId = parseInt(req.params.quoteId, 10);
  if (isNaN(quoteId) || quoteId < 1) {
    return res.status(400).json({ error: 'quoteId must be a positive integer' });
  }

  try {
    const result = await catnatService.confirmQuote(quoteId, req.user.id);
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ── POST /api/catnat/pay/:quoteId ────────────────────────────────────────────
async function processPayment(req, res) {
  const quoteId = parseInt(req.params.quoteId, 10);
  if (isNaN(quoteId) || quoteId < 1) {
    return res.status(400).json({ error: 'quoteId must be a positive integer' });
  }

  const documentData = req.body.document || null;
  if (documentData && (!documentData.file_name || !documentData.file_path)) {
    return res.status(400).json({
      error: 'If providing a document, file_name and file_path are required',
    });
  }

  try {
    const result = await catnatService.processPayment(
      quoteId,
      req.user.id,
      documentData
    );
    return res.status(200).json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { createQuote, confirmQuote, processPayment };