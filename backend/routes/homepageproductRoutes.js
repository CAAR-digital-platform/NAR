'use strict';

/**
 * routes/homepageProductRoutes.js
 *
 * Public-facing homepage products endpoint — no authentication required.
 * Returns only active products ordered by display_order.
 *
 * GET /api/homepage-products
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/homepageProductController');

// GET /api/homepage-products
router.get('/', ctrl.publicList);

module.exports = router;