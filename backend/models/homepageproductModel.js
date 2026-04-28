'use strict';

/**
 * models/homepageProductModel.js
 *
 * Pure SQL layer for the homepage_products table.
 * No business logic — validation lives in homepageProductService.
 */

const pool = require('../db');

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Return ALL rows (active + inactive) — admin use only.
 */
async function getAll() {
  const [rows] = await pool.execute(
    `SELECT id, name, description, image_url, cta_label,
            is_active, display_order, created_at, updated_at
     FROM homepage_products
     ORDER BY display_order ASC, id ASC`
  );
  return rows;
}

/**
 * Return only ACTIVE rows ordered by display_order — public use.
 */
async function getActive() {
  const [rows] = await pool.execute(
    `SELECT id, name, description, image_url, cta_label,
            is_active, display_order, created_at, updated_at
     FROM homepage_products
     WHERE is_active = 1
     ORDER BY display_order ASC, id ASC`
  );
  return rows;
}

/**
 * Return a single row by id regardless of active flag (admin use).
 */
async function getById(id) {
  const [rows] = await pool.execute(
    `SELECT id, name, description, image_url, cta_label,
            is_active, display_order, created_at, updated_at
     FROM homepage_products
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Update an existing homepage product.
 * Returns the number of affected rows (0 = not found).
 *
 * @param {number} id
 * @param {{ name, description, image_url, cta_label, is_active, display_order }} data
 */
async function update(id, { name, description, image_url, cta_label, is_active, display_order }) {
  const [result] = await pool.execute(
    `UPDATE homepage_products
     SET name          = ?,
         description   = ?,
         image_url     = ?,
         cta_label     = ?,
         is_active     = ?,
         display_order = ?
     WHERE id = ?`,
    [
      name,
      description   || null,
      image_url     || null,
      cta_label     || 'Subscribe',
      is_active ? 1 : 0,
      display_order ?? 0,
      id,
    ]
  );
  return result.affectedRows;
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getAll,
  getActive,
  getById,
  update,
};