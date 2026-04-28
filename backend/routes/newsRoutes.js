'use strict';

/**
 * routes/newsRoutes.js
 *
 * Public-facing news endpoints — no authentication required.
 * Only published articles are ever returned here.
 *
 * IMPORTANT: Named routes (/featured) must come before /:id
 * if added in the future — keep that ordering convention.
 *
 * GET /api/news       → list published articles
 * GET /api/news/:id   → single published article (404 for drafts)
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/newsController');

// GET /api/news
router.get('/', ctrl.publicList);

// GET /api/news/:id  — MUST be last
router.get('/:id', ctrl.publicGetOne);

module.exports = router;