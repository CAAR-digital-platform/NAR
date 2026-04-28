'use strict';

const pool = require('../db');

async function getAllProducts() {
  const [rows] = await pool.execute(
    `SELECT id, name, description, insurance_type, base_price, is_active, created_at
     FROM products
     ORDER BY name ASC`
  );
  return rows;
}

async function getActiveProducts() {
  const [rows] = await pool.execute(
    `SELECT id, name, description, insurance_type, base_price, is_active, created_at
     FROM products
     WHERE is_active = 1
     ORDER BY name ASC`
  );
  return rows;
}

async function getProductById(productId) {
  const [rows] = await pool.execute(
    `SELECT id, name, description, insurance_type, base_price, is_active, created_at
     FROM products
     WHERE id = ?`,
    [productId]
  );
  return rows[0] || null;
}

async function getActiveProductById(productId) {
  const [rows] = await pool.execute(
    `SELECT id, name, description, insurance_type, base_price, is_active, created_at
     FROM products
     WHERE id = ?
       AND is_active = 1`,
    [productId]
  );
  return rows[0] || null;
}

async function createProduct({ name, description, insurance_type, base_price }) {
  const [result] = await pool.execute(
    `INSERT INTO products (name, description, insurance_type, base_price, is_active)
     VALUES (?, ?, ?, ?, 1)`,
    [name, description, insurance_type || null, base_price]
  );
  return result.insertId;
}

async function updateProduct(productId, { name, description, insurance_type, base_price }) {
  const [result] = await pool.execute(
    `UPDATE products
     SET name = ?, description = ?, insurance_type = ?, base_price = ?
     WHERE id = ?`,
    [name, description, insurance_type || null, base_price, productId]
  );
  return result.affectedRows;
}

async function updateProductStatus(productId, isActive) {
  const [result] = await pool.execute(
    `UPDATE products
     SET is_active = ?
     WHERE id = ?`,
    [isActive ? 1 : 0, productId]
  );
  return result.affectedRows;
}

async function deleteProduct(productId) {
  const [result] = await pool.execute(
    'DELETE FROM products WHERE id = ?',
    [productId]
  );
  return result.affectedRows;
}

module.exports = {
  getAllProducts,
  getActiveProducts,
  getProductById,
  getActiveProductById,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
};
