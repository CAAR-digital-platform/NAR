const dashboardModel = require('../models/dashboardModel');

/**
 * Retrieves all dashboard statistics.
 * Business logic layer — here you can add formatting, caching, etc. later.
 */
async function getDashboardStats() {
  const stats = await dashboardModel.getDashboardStats();
  return stats;
}

module.exports = { getDashboardStats };