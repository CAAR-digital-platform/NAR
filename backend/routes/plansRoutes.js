/**
 * routes/plansRoutes.js
 *
 * GET /api/plans                        — all active plans (with product info)
 * GET /api/plans?product_id=2           — plans for one product by ID
 * GET /api/plans?product_name=Roadside+Assistance  — plans by product name
 *
 * Public — no auth required.
 * Frontend should call this instead of hardcoding plan IDs.
 */

'use strict';

const express = require('express');
const router  = express.Router();
const pool    = require('../db');

// ─────────────────────────────────────────────────────────────
// Shared query builder
// ─────────────────────────────────────────────────────────────
async function fetchPlans({ product_id, product_name } = {}) {
  const conditions = ['pl.is_active = 1', 'pr.is_active = 1'];
  const params     = [];

  if (product_id) {
    conditions.push('pr.id = ?');
    params.push(parseInt(product_id, 10));
  }

  if (product_name) {
    conditions.push('pr.name = ?');
    params.push(product_name.trim());
  }

  const where = conditions.join(' AND ');

  const [rows] = await pool.execute(
    `SELECT
       pl.id,
       pl.name,
       pl.price,
       pl.description,
       pl.features,
       pl.is_popular,
       pr.id   AS product_id,
       pr.name AS product_name,
       pr.insurance_type
     FROM plans    pl
     JOIN products pr ON pr.id = pl.product_id
     WHERE ${where}
     ORDER BY pr.id ASC, pl.price ASC`,
    params
  );

  // Parse features JSON if MySQL returned it as a string
  return rows.map(r => ({
    ...r,
    price:      parseFloat(r.price),
    is_popular: Boolean(r.is_popular),
    features:   typeof r.features === 'string'
                  ? JSON.parse(r.features)
                  : (r.features || []),
  }));
}

// ─────────────────────────────────────────────────────────────
// GET /api/plans
// ─────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const plans = await fetchPlans({
      product_id:   req.query.product_id,
      product_name: req.query.product_name,
    });
    return res.status(200).json({ count: plans.length, plans });
  } catch (err) {
    console.error('[Plans] list error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;

/*
──────────────────────────────────────────────────────────────
HOW TO WIRE IT INTO server.js
──────────────────────────────────────────────────────────────

  const plansRoutes = require('./routes/plansRoutes');
  app.use('/api/plans', plansRoutes);

──────────────────────────────────────────────────────────────
HOW TO CALL IT FROM roads.html (replaces hardcoded plan IDs)
──────────────────────────────────────────────────────────────

  async function loadRoadsidePlans() {
    const res  = await fetch('/api/plans?product_name=Roadside+Assistance');
    const data = await res.json();          // { count: 3, plans: [...] }

    data.plans.forEach((plan, index) => {
      // plan.id  ← the REAL DB plan_id — use this, not 1/2/3
      // plan.name, plan.price, plan.features, plan.is_popular
      const card = document.getElementById('plan-' + plan.name.toLowerCase());
      if (card) {
        card.querySelector('.plan-name').textContent  = plan.name;
        card.querySelector('.plan-price').textContent =
          plan.price.toLocaleString('fr-DZ') + ' DZD';
        // store the real ID on the card so selectPlan() can read it:
        card.setAttribute('data-plan-id', plan.id);
      }
    });
  }

  // Updated selectPlan — reads the real ID from the card
  function selectPlan(cardEl) {
    const planId = parseInt(cardEl.getAttribute('data-plan-id'), 10);
    const name   = cardEl.querySelector('.plan-name').textContent;
    const price  = parseFloat(cardEl.getAttribute('data-price'));
    // ... rest of selection logic
  }

──────────────────────────────────────────────────────────────
EXAMPLE RESPONSES
──────────────────────────────────────────────────────────────

  GET /api/plans?product_name=Roadside+Assistance
  {
    "count": 3,
    "plans": [
      { "id": 1, "name": "Basic",   "price": 4900,  "is_popular": false, "features": [...] },
      { "id": 2, "name": "Plus",    "price": 7900,  "is_popular": true,  "features": [...] },
      { "id": 3, "name": "Premium", "price": 11500, "is_popular": false, "features": [...] }
    ]
  }

  GET /api/plans?product_id=1
  {
    "count": 3,
    "plans": [
      { "id": 4, "name": "RC Seule (Third Party Only)", "price": 25000, ... },
      { "id": 5, "name": "Tous Risques (Comprehensive)", "price": 55000, ... },
      { "id": 6, "name": "Tous Risques + Assistance",   "price": 65000, ... }
    ]
  }
*/