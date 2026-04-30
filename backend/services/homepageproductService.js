'use strict';

/**
 * services/homepageProductService.js
 *
 * Business rules for the homepage_products feature.
 * SQL access is delegated entirely to homepageProductModel.
 *
 * Rules enforced here:
 *   - name is required and must be ≤ 120 chars
 *   - cta_label defaults to 'Subscribe' if empty
 *   - display_order must be a non-negative integer
 *   - image_url is optional; if provided must be a valid HTTP/HTTPS URL
 *   - is_active must be boolean
 *   - Admin callers receive all rows; public callers receive only active rows
 */

const model = require('../models/homepageProductModel');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function sanitizeImageUrl(imageUrl) {
  if (typeof imageUrl !== 'string') {
    return imageUrl;
  }

  return imageUrl.replace(/^frontend\//, '');
}

function normalize(row) {
  return {
    ...row,
    image_url: sanitizeImageUrl(row.image_url),
    is_active:     Boolean(row.is_active),
    display_order: Number(row.display_order),
  };
}

/**
 * Validate and clean update payload.
 * Throws 400 on any violation.
 * Returns sanitised values ready for the model.
 */
function validateAndNormalise({ name, description, image_url, cta_label, is_active, display_order }) {
  if (!name || !String(name).trim()) {
    throw makeError('name is required', 400);
  }

  const cleanName = String(name).trim();
  if (cleanName.length > 120) {
    throw makeError('name must not exceed 120 characters', 400);
  }

  const cleanDesc     = description ? String(description).trim() : null;
  const cleanCtaLabel = cta_label   ? String(cta_label).trim()   : 'Subscribe';

  if (cleanCtaLabel.length > 80) {
    throw makeError('cta_label must not exceed 80 characters', 400);
  }

  // is_active — accept boolean or 0/1
  const cleanActive =
    typeof is_active === 'boolean'
      ? is_active
      : is_active === 1 || is_active === '1' || is_active === 'true';

  // display_order — must be non-negative integer
  const orderNum = display_order != null ? parseInt(display_order, 10) : 0;
  if (isNaN(orderNum) || orderNum < 0) {
    throw makeError('display_order must be a non-negative integer', 400);
  }

  // Optional image URL
  let cleanImageUrl = null;
  if (image_url && String(image_url).trim()) {
    cleanImageUrl = String(image_url).trim();
    if (cleanImageUrl.length > 512) {
      throw makeError('image_url must not exceed 512 characters', 400);
    }
    if (!/^https?:\/\/.+/.test(cleanImageUrl)) {
      throw makeError('image_url must be a valid HTTP/HTTPS URL', 400);
    }
  }

  return {
    name:          cleanName,
    description:   cleanDesc,
    image_url:     cleanImageUrl,
    cta_label:     cleanCtaLabel,
    is_active:     cleanActive,
    display_order: orderNum,
  };
}

// ─── Admin operations ─────────────────────────────────────────────────────────

/**
 * Return all homepage products (active + inactive) — admin.
 */
async function listAll() {
  const rows = await model.getAll();
  return rows.map(normalize);
}

/**
 * Update a homepage product — admin only.
 * Throws 404 if not found.
 * Returns the updated row.
 */
async function updateProduct(id, payload) {
  const existing = await model.getById(id);
  if (!existing) throw makeError('Homepage product not found', 404);

  const data = validateAndNormalise(payload);
  const affected = await model.update(id, data);

  if (!affected) throw makeError('Homepage product not found', 404);

  const updated = await model.getById(id);
  return normalize(updated);
}

// ─── Public operations ────────────────────────────────────────────────────────

/**
 * Return only active homepage products ordered by display_order — public.
 */
async function listActive() {
  const rows = await model.getActive();
  return rows.map(normalize);
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  listAll,
  updateProduct,
  listActive,
};