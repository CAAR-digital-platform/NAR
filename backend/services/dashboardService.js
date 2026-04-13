/**
 * services/dashboardService.js
 *
 * Core routing logic: maps each role to its own data fetcher.
 * Adding a new role = adding one case + one model function. Nothing else changes.
 *
 * SECURITY RULES enforced here:
 *   - userId is always sourced from the verified JWT (user.id), never from input.
 *   - Non-admin roles never receive global aggregates.
 *   - Unknown roles are explicitly rejected with 403.
 */

const dashboardModel = require('../models/dashboardModel');

// ─── Role → handler map ───────────────────────────────────────────────────────
// Clean alternative to switch-case; adding a role is a one-liner.
const ROLE_HANDLERS = {
  admin:  (_user) => dashboardModel.getAdminStats(),
  client: (user)  => dashboardModel.getClientStats(user.id),
  expert: (user)  => dashboardModel.getExpertStats(user.id),
};

/**
 * Returns dashboard statistics scoped to the authenticated user's role.
 *
 * @param {{ id: number, email: string, role: string }} user — from JWT
 * @returns {Promise<object>} Role-appropriate stats payload
 * @throws  {Error} 403 if role is unrecognised
 */
async function getDashboardStats(user) {
  const handler = ROLE_HANDLERS[user.role];

  if (!handler) {
    const err = new Error(`Access denied: unknown role '${user.role}'`);
    err.status = 403;
    throw err;
  }

  // Each handler receives the full user object so it can extract
  // whatever it needs (id, email, etc.) without touching req.
  const data = await handler(user);

  // Attach meta so the frontend knows which view to render
  return {
    role: user.role,
    ...data,
  };
}

module.exports = { getDashboardStats };