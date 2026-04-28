'use strict';

/**
 * controllers/homepageProductController.js
 *
 * Thin HTTP layer — validate param types, call service, return JSON.
 * No business logic or SQL lives here.
 *
 * Admin handlers   → used by /api/admin/homepage-products routes
 * Public handlers  → used by /api/homepage-products routes
 */

const homepageProductService = require('../services/homepageProductService');

// ─── Admin handlers ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/homepage-products
 * Returns ALL products (active + inactive).
 */
async function adminList(req, res) {
  try {
    const products = await homepageProductService.listAll();
    return res.status(200).json({ count: products.length, products });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * PUT /api/admin/homepage-products/:id
 * Body: { name, description?, image_url?, cta_label?, is_active, display_order }
 */
async function adminUpdate(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const product = await homepageProductService.updateProduct(id, req.body || {});
    return res.status(200).json({
      message: 'Homepage product updated successfully',
      product,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─── Public handlers ──────────────────────────────────────────────────────────

/**
 * GET /api/homepage-products
 * Returns only active products, ordered by display_order.
 */
async function publicList(req, res) {
  try {
    const products = await homepageProductService.listActive();
    return res.status(200).json({ count: products.length, products });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  adminList,
  adminUpdate,
  publicList,
};