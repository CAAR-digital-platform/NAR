/**
 * controllers/dashboardController.js
 *
 * Thin HTTP layer — validates nothing beyond auth (middleware handles that).
 * Passes the full req.user object to the service; never trusts the request body.
 */

const dashboardService = require('../services/dashboardService');

/**
 * GET /api/dashboard
 * Protected — any authenticated role (admin | client | expert).
 * Returns a role-scoped view of platform statistics.
 */
async function getDashboard(req, res) {
  try {
    // req.user is guaranteed by authMiddleware: { id, email, role }
    const stats = await dashboardService.getDashboardStats(req.user);
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[Dashboard] Error:', err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { getDashboard };