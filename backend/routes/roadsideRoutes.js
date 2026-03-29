/**
 * routes/roadsideRoutes.js
 *
 * Three endpoints:
 *   POST /api/roadside/quote          — public  (creates user if needed)
 *   POST /api/roadside/confirm/:quoteId — protected (JWT)
 *   POST /api/roadside/pay/:quoteId   — protected (JWT + DB transaction)
 */

const express        = require('express');
const router         = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const ctrl           = require('../controllers/roadsideController');

// ── Public ────────────────────────────────────────────────────────────────────

// POST /api/roadside/quote
// Body: { first_name, last_name, email, phone, license_plate, brand, model, year, wilaya, plan_id }
// Returns: { quote_id, estimated_amount, plan_name, token }
router.post('/quote', ctrl.createQuote);

// ── Protected (valid JWT required) ───────────────────────────────────────────

// POST /api/roadside/confirm/:quoteId
// Header: Authorization: Bearer <token>
// Returns: { message, quote_id }
router.post('/confirm/:quoteId', authMiddleware, ctrl.confirmQuote);

// POST /api/roadside/pay/:quoteId
// Header: Authorization: Bearer <token>
// Body (optional): { document: { file_name, file_path, file_type } }
// Returns: { message, policy_reference, contract_id, start_date, end_date, amount_paid }
router.post('/pay/:quoteId', authMiddleware, ctrl.processPayment);

module.exports = router;