'use strict';

/**
 * routes/adminRoutes.js
 *
 * All routes here require:
 *   1. A valid JWT (authMiddleware)
 *   2. role = 'admin'   (requireRole)
 *
 * Mounted at /api/admin
 *
 * ── User management ───────────────────────────────────────────
 * GET    /api/admin/users
 * PATCH  /api/admin/users/:id/status
 *
 * ── Expert management ─────────────────────────────────────────
 * GET    /api/admin/experts
 * POST   /api/admin/experts
 * POST   /api/admin/experts/consistency-check
 *
 * ── News CMS ──────────────────────────────────────────────────
 * GET    /api/admin/news             list all (draft + published)
 * POST   /api/admin/news             create article
 * PUT    /api/admin/news/:id         update article
 * DELETE /api/admin/news/:id         delete article
 *
 * ── Insurance products CMS ────────────────────────────────────
 * GET    /api/admin/products         list all products
 * GET    /api/admin/products/:id     get one product
 * POST   /api/admin/products         create product
 * PUT    /api/admin/products/:id     update product
 * DELETE /api/admin/products/:id     delete product
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const requireRole    = require('../middleware/roleMiddleware');

const userModel      = require('../models/userModel');
const adminModel     = require('../models/adminModel');
const adminService   = require('../services/adminService');
const newsCtrl       = require('../controllers/newsController');
const assuranceCtrl  = require('../controllers/assuranceController');

// ── Shared guard — applies to every route in this file ────────────────────────
// Declared once here rather than repeating on every route.
const adminGuard = [authMiddleware, requireRole('admin')];

// ─── User management ──────────────────────────────────────────────────────────

router.get('/users', ...adminGuard, async (req, res) => {
  try {
    const users = await userModel.listForAdmin();
    return res.status(200).json({ count: users.length, users });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.patch('/users/:id/status', ...adminGuard, async (req, res) => {
  const userId   = parseInt(req.params.id, 10);
  const isActive = req.body.is_active;

  if (isNaN(userId) || userId < 1) {
    return res.status(400).json({ error: 'User id must be a positive integer' });
  }
  if (typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'is_active must be boolean' });
  }
  if (userId === req.user.id && isActive === false) {
    return res.status(400).json({ error: 'You cannot deactivate your own account' });
  }

  try {
    const affected = await userModel.updateActiveStatus(userId, isActive);
    if (!affected) return res.status(404).json({ error: 'User not found' });

    const updated = await userModel.findById(userId);
    return res.status(200).json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: updated,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── Expert management ────────────────────────────────────────────────────────

router.get('/experts', ...adminGuard, async (req, res) => {
  try {
    const rows = await adminModel.listExpertsForAssignment();
    return res.status(200).json({ count: rows.length, experts: rows });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/experts', ...adminGuard, async (req, res) => {
  try {
    const result = await adminService.createExpert(req.body || {});
    return res.status(201).json({
      message:            'Expert created successfully',
      user_id:            result.user_id,
      expert_id:          result.expert_id,
      temporary_password: result.temporary_password,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.post('/experts/consistency-check', ...adminGuard, async (req, res) => {
  try {
    const result = await adminService.runExpertConsistencyCheck();
    return res.status(200).json({
      message: 'Expert consistency check completed',
      ...result,
    });
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

// ─── News CMS ─────────────────────────────────────────────────────────────────
// Named routes (/experts/consistency-check above) already before any :id param.
// News routes are self-contained and follow the same ordering rule.

// GET  /api/admin/news
router.get('/news', ...adminGuard, newsCtrl.adminList);

// POST /api/admin/news
router.post('/news', ...adminGuard, newsCtrl.adminCreate);

// PUT  /api/admin/news/:id   — param route AFTER root routes
router.put('/news/:id', ...adminGuard, newsCtrl.adminUpdate);

// DELETE /api/admin/news/:id
router.delete('/news/:id', ...adminGuard, newsCtrl.adminDelete);

// ─── Insurance products CMS ───────────────────────────────────────────────────
// Delegates to the existing assuranceController which already contains all
// the business logic. These routes are an additional admin-namespaced alias
// alongside /api/assurances — nothing is duplicated in the service layer.

// GET /api/admin/products
router.get('/products', ...adminGuard, assuranceCtrl.list);

// GET /api/admin/products/:id — MUST be after root routes
router.get('/products/:id', ...adminGuard, assuranceCtrl.getOne);

// POST /api/admin/products
router.post('/products', ...adminGuard, assuranceCtrl.create);

// PUT /api/admin/products/:id
router.put('/products/:id', ...adminGuard, assuranceCtrl.update);

// DELETE /api/admin/products/:id
router.delete('/products/:id', ...adminGuard, assuranceCtrl.remove);

// ─────────────────────────────────────────────────────────────────────────────

module.exports = router;