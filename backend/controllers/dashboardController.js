const dashboardService = require('../services/dashboardService');

/**
 * GET /api/dashboard/stats
 * Protected — admin only.
 * Returns aggregated platform statistics.
 */
async function getStats(req, res) {
  try {
    const stats = await dashboardService.getDashboardStats();
    return res.status(200).json(stats);
  } catch (err) {
    console.error('[Dashboard] Error fetching stats:', err.message);
    return res.status(err.status || 500).json({ error: err.message });
  }
}

module.exports = { getStats };