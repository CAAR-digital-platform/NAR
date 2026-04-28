'use strict';

/**
 * models/newsModel.js
 *
 * Pure SQL layer for news_articles.
 * No business logic — validation lives in newsService.
 *
 * Column convention:
 *   status ENUM('draft','published') — only published rows are exposed publicly.
 */

const pool = require('../db');

// ─── READ ─────────────────────────────────────────────────────────────────────

/**
 * Return ALL articles (draft + published) for admin use.
 * Newest first.
 */
async function getAllArticles() {
  const [rows] = await pool.execute(
    `SELECT id, title, content, image_url, status, created_at, updated_at
     FROM news_articles
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Return only PUBLISHED articles for public use.
 * Newest first.
 */
async function getPublishedArticles() {
  const [rows] = await pool.execute(
    `SELECT id, title, content, image_url, status, created_at, updated_at
     FROM news_articles
     WHERE status = 'published'
     ORDER BY created_at DESC`
  );
  return rows;
}

/**
 * Return a single article by id regardless of status (admin internal use).
 */
async function getArticleById(id) {
  const [rows] = await pool.execute(
    `SELECT id, title, content, image_url, status, created_at, updated_at
     FROM news_articles
     WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
}

/**
 * Return a single PUBLISHED article by id (public use).
 * Returns null if the article exists but is still a draft.
 */
async function getPublishedArticleById(id) {
  const [rows] = await pool.execute(
    `SELECT id, title, content, image_url, status, created_at, updated_at
     FROM news_articles
     WHERE id = ? AND status = 'published'`,
    [id]
  );
  return rows[0] || null;
}

// ─── WRITE ────────────────────────────────────────────────────────────────────

/**
 * Insert a new article.
 * Returns the new row's id.
 *
 * @param {{ title, content, image_url, status }} data
 */
async function createArticle({ title, content, image_url, status }) {
  const [result] = await pool.execute(
    `INSERT INTO news_articles (title, content, image_url, status)
     VALUES (?, ?, ?, ?)`,
    [
      title,
      content,
      image_url || null,
      status || 'draft',
    ]
  );
  return result.insertId;
}

/**
 * Update an existing article.
 * Returns the number of affected rows (0 = not found).
 *
 * @param {number} id
 * @param {{ title, content, image_url, status }} data
 */
async function updateArticle(id, { title, content, image_url, status }) {
  const [result] = await pool.execute(
    `UPDATE news_articles
     SET title     = ?,
         content   = ?,
         image_url = ?,
         status    = ?
     WHERE id = ?`,
    [
      title,
      content,
      image_url || null,
      status,
      id,
    ]
  );
  return result.affectedRows;
}

/**
 * Permanently delete an article by id.
 * Returns the number of affected rows (0 = not found).
 */
async function deleteArticle(id) {
  const [result] = await pool.execute(
    'DELETE FROM news_articles WHERE id = ?',
    [id]
  );
  return result.affectedRows;
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getAllArticles,
  getPublishedArticles,
  getArticleById,
  getPublishedArticleById,
  createArticle,
  updateArticle,
  deleteArticle,
};