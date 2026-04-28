'use strict';

/**
 * services/newsService.js
 *
 * All business rules and validation for news articles.
 * SQL access is delegated entirely to newsModel.
 *
 * Rules enforced here:
 *   - title and content are required
 *   - title  ≤ 255 characters
 *   - content ≥ 10 characters
 *   - status must be 'draft' or 'published'
 *   - image_url is optional; if provided it must look like a URL
 *   - Public callers never receive draft articles
 */

const newsModel = require('../models/newsModel');

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_STATUSES = Object.freeze(['draft', 'published']);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeError(message, status) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * Normalise and validate the fields common to create & update.
 * Throws a 400 error on any violation.
 * Returns cleaned values ready for the model.
 */
function validateAndNormalise({ title, content, image_url, status }) {
  const missing = [];
  if (!title)   missing.push('title');
  if (!content) missing.push('content');
  if (missing.length) throw makeError(`Missing required fields: ${missing.join(', ')}`, 400);

  const cleanTitle   = String(title).trim();
  const cleanContent = String(content).trim();

  if (cleanTitle.length < 3) {
    throw makeError('title must be at least 3 characters', 400);
  }
  if (cleanTitle.length > 255) {
    throw makeError('title must not exceed 255 characters', 400);
  }
  if (cleanContent.length < 10) {
    throw makeError('content must be at least 10 characters', 400);
  }

  // Normalise status — default to 'draft' for create, require valid value
  const cleanStatus = status ? String(status).trim() : 'draft';
  if (!VALID_STATUSES.includes(cleanStatus)) {
    throw makeError(`status must be one of: ${VALID_STATUSES.join(', ')}`, 400);
  }

  // Optional image URL — basic sanity check only (no hard dependency on format)
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
    title:     cleanTitle,
    content:   cleanContent,
    image_url: cleanImageUrl,
    status:    cleanStatus,
  };
}

// ─── Admin operations ─────────────────────────────────────────────────────────

/**
 * List ALL articles (draft + published) — admin only.
 */
async function listAllArticles() {
  return newsModel.getAllArticles();
}

/**
 * Create a new article — admin only.
 * Returns the newly created article row.
 */
async function createArticle({ title, content, image_url, status }) {
  const data = validateAndNormalise({ title, content, image_url, status });
  const newId = await newsModel.createArticle(data);
  return newsModel.getArticleById(newId);
}

/**
 * Update an existing article — admin only.
 * Throws 404 if the article does not exist.
 * Returns the updated article row.
 */
async function updateArticle(id, { title, content, image_url, status }) {
  // Confirm the article exists before running the update
  const existing = await newsModel.getArticleById(id);
  if (!existing) throw makeError('Article not found', 404);

  const data = validateAndNormalise({ title, content, image_url, status });
  await newsModel.updateArticle(id, data);
  return newsModel.getArticleById(id);
}

/**
 * Delete an article — admin only.
 * Throws 404 if the article does not exist.
 */
async function deleteArticle(id) {
  const existing = await newsModel.getArticleById(id);
  if (!existing) throw makeError('Article not found', 404);

  await newsModel.deleteArticle(id);
}

// ─── Public operations ────────────────────────────────────────────────────────

/**
 * List only PUBLISHED articles — public.
 */
async function listPublishedArticles() {
  return newsModel.getPublishedArticles();
}

/**
 * Return a single PUBLISHED article — public.
 * Throws 404 if missing or still a draft.
 */
async function getPublishedArticle(id) {
  const article = await newsModel.getPublishedArticleById(id);
  if (!article) throw makeError('Article not found', 404);
  return article;
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  // admin
  listAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  // public
  listPublishedArticles,
  getPublishedArticle,
};