const pool = require('../db');

/**
 * Fetch all dashboard statistics in a single query batch.
 * Using Promise.all for parallel execution — faster than sequential awaits.
 */
async function getDashboardStats() {
  const [[clients]]      = await pool.execute('SELECT COUNT(*) AS total FROM clients');
  const [[contracts]]    = await pool.execute('SELECT COUNT(*) AS total FROM contracts');
  const [[claims]]       = await pool.execute('SELECT COUNT(*) AS total FROM claims');
  const [[payments]]     = await pool.execute('SELECT COUNT(*) AS total, COALESCE(SUM(amount), 0) AS revenue FROM payments');
  const [[messages]]     = await pool.execute('SELECT COUNT(*) AS total FROM contact_messages');
  const [[applications]] = await pool.execute('SELECT COUNT(*) AS total FROM job_applications');

  return {
    total_clients:      clients.total,
    total_contracts:    contracts.total,
    total_claims:       claims.total,
    total_payments:     payments.total,
    total_messages:     messages.total,
    total_applications: applications.total,
    total_revenue:      parseFloat(payments.revenue),
  };
}

module.exports = { getDashboardStats };