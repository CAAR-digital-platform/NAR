/**
 * routes/agencyRoutes.js
 *
 * All routes are PUBLIC — the agency map is accessible without login.
 *
 * IMPORTANT: Static named routes (/filter, /nearest, /wilayas)
 * MUST come before the /:id param route, otherwise Express will
 * try to parse "filter" and "nearest" as numeric IDs.
 */

const express = require('express');
const router  = express.Router();
const ctrl    = require('../controllers/agencyController');

// GET /api/agencies
router.get('/', ctrl.list);

// GET /api/agencies/filter?wilaya_id=&city_id=&type=&service=
router.get('/filter', ctrl.filter);

// GET /api/agencies/nearest?lat=&lng=&service=
router.get('/nearest', ctrl.nearest);

// GET /api/agencies/wilayas
router.get('/wilayas', ctrl.listWilayas);

// GET /api/agencies/cities/:wilayaId
router.get('/cities/:wilayaId', ctrl.listCities);

// GET /api/agencies/:id  — MUST be last
router.get('/:id', ctrl.getOne);

module.exports = router;