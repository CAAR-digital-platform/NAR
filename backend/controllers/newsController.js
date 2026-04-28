'use strict';

/**
 * controllers/newsController.js
 *
 * Thin HTTP layer — parse request, call service, return JSON.
 * No business logic or SQL lives here.
 *
 * Admin handlers   → used by /api/admin/news routes
 * Public handlers  → used by /api/news routes
 */

const newsService = require('../services/newsService');

// ─── Admin handlers ───────────────────────────────────────────────────────────

/**
 * GET /api/admin/news
 * Returns ALL articles including drafts.
 */
async function adminList(req, res) {
  try {
    const articles = await newsService.listAllArticles();
    return res.status(200).json({ count: articles.length, articles });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * POST /api/admin/news
 * Body: { title, content, image_url?, status? }
 */
async function adminCreate(req, res) {
  try {
    const article = await newsService.createArticle(req.body || {});
    return res.status(201).json({
      message: 'Article created successfully',
      article,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * PUT /api/admin/news/:id
 * Body: { title, content, image_url?, status }
 */
async function adminUpdate(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const article = await newsService.updateArticle(id, req.body || {});
    return res.status(200).json({
      message: 'Article updated successfully',
      article,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * DELETE /api/admin/news/:id
 */
async function adminDelete(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    await newsService.deleteArticle(id);
    return res.status(200).json({ message: 'Article deleted successfully' });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─── Public handlers ──────────────────────────────────────────────────────────

/**
 * GET /api/news
 * Returns only published articles.
 */
async function publicList(req, res) {
  try {
    const articles = await newsService.listPublishedArticles();
    return res.status(200).json({ count: articles.length, articles });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

/**
 * GET /api/news/:id
 * Returns a single published article. 404 for drafts.
 */
async function publicGetOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }

  try {
    const article = await newsService.getPublishedArticle(id);
    return res.status(200).json(article);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  adminList,
  adminCreate,
  adminUpdate,
  adminDelete,
  publicList,
  publicGetOne,
};