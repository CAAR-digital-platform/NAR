/**
 * routes/catnatRoutes.js
 *
 * POST /api/catnat/quote         — public  (creates user/client/property/quote)
 * POST /api/catnat/confirm/:quoteId — protected (JWT)
 * POST /api/catnat/pay/:quoteId     — protected (JWT)
 */

'use strict';

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl           = require('../controllers/catnatController');

// Public — no token required
// Body: { first_name, last_name, email, phone?,
//         construction_type, usage_type, built_area, num_floors?,
//         year_construction, declared_value, address?,
//         wilaya_id?, city_id?,
//         is_seismic_compliant, has_notarial_deed, is_commercial,
//         extra_coverages?, plan_id }
// Returns: { quote_id, estimated_amount, plan_name, token }
router.post('/quote', ctrl.createQuote);

// Protected — JWT required from /quote response
// Returns: { message, quote_id }
router.post('/confirm/:quoteId', authMiddleware, ctrl.confirmQuote);

// Protected — JWT required
// Body (optional): { document: { file_name, file_path, file_type } }
// Returns: { message, policy_reference, contract_id, start_date, end_date, amount_paid }
router.post('/pay/:quoteId', authMiddleware, ctrl.processPayment);

module.exports = router;