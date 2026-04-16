/**
 * models/contractsModel.js
 *
 * SQL layer for the contracts endpoint.
 * Security rule: always filter through client → user join.
 * The caller NEVER passes a client_id directly — only the JWT's user_id.
 */

const pool = require('../db');

/**
 * Return all contracts that belong to a given user (via client profile).
 * Joins products + plans so the frontend has human-readable names.
 *
 * @param {number} userId  — comes from the verified JWT, never from the request body
 */
async function getContractsByUserId(userId) {
  const [rows] = await pool.execute(
    `SELECT
       co.id                AS contract_id,
       co.policy_reference,
       co.status,
       co.start_date,
       co.end_date,
       co.premium_amount,
       p.name               AS product_name,
       p.insurance_type,
       pl.name              AS plan_name,
       v.license_plate,
       CONCAT(v.brand, ' ', v.model) AS vehicle_label
     FROM contracts  co
     JOIN clients    c   ON c.id  = co.client_id
     JOIN products   p   ON p.id  = co.product_id
     LEFT JOIN plans pl  ON pl.id = co.plan_id
     LEFT JOIN vehicles v ON v.id  = co.vehicle_id
     WHERE c.user_id = ?
     ORDER BY co.start_date DESC`,
    [userId]
  );
  return rows;
}

module.exports = { getContractsByUserId };
