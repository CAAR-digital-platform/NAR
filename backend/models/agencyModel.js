/**
 * models/agencyModel.js
 *
 * All agency queries.  Uses the normalized schema:
 *   agencies → cities → wilayas
 *
 * Key change from v1:
 *   - NO more string-based wilaya/city on the agencies table.
 *     We JOIN to cities and wilayas for consistent names.
 *   - services is a MySQL SET column; it arrives as a plain
 *     comma-separated string which we split in the API layer.
 *   - Nearest-agency uses the Haversine approximation in SQL
 *     (fast enough for Algeria's ~46 agencies; no PostGIS needed).
 */

const pool = require('../db');

// ─── Base SELECT — reused by every query ──────────────────────────────────────
const BASE_SELECT = `
  SELECT
    a.id,
    a.agency_code,
    a.name,
    a.address,
    a.phone,
    a.fax,
    a.email,
    a.agency_type   AS type,
    a.services,
    a.opening_hours,
    w.id            AS wilaya_id,
    w.code          AS wilaya_code,
    w.name_fr       AS wilaya,
    c.id            AS city_id,
    c.name_fr       AS city,
    CAST(a.latitude  AS DOUBLE) AS latitude,
    CAST(a.longitude AS DOUBLE) AS longitude
  FROM agencies a
  JOIN wilayas w ON w.id = a.wilaya_id
  JOIN cities  c ON c.id = a.city_id
  WHERE a.is_active = 1
`;

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET ALL AGENCIES (for map load)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return every active agency with coordinates.
 * Used by GET /api/agencies
 */
async function getAllAgencies() {
  const [rows] = await pool.execute(
    `${BASE_SELECT} ORDER BY w.name_fr, c.name_fr, a.agency_code`
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET FILTERED AGENCIES
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter agencies by any combination of:
 *   wilaya_id, city_id, agency_type, service (one service tag)
 *
 * All params are optional.  Passed as an object:
 *   { wilaya_id, city_id, type, service }
 *
 * Used by GET /api/agencies?wilaya_id=5&type=Main+Agency
 */
async function getFilteredAgencies({ wilaya_id, city_id, type, service } = {}) {
  const conditions = ['a.is_active = 1'];
  const params = [];

  if (wilaya_id) {
    conditions.push('a.wilaya_id = ?');
    params.push(parseInt(wilaya_id, 10));
  }

  if (city_id) {
    conditions.push('a.city_id = ?');
    params.push(parseInt(city_id, 10));
  }

  if (type) {
    conditions.push('a.agency_type = ?');
    params.push(type);
  }

  // MySQL SET column: FIND_IN_SET checks for one value inside the set
  if (service) {
    conditions.push('FIND_IN_SET(?, a.services) > 0');
    params.push(service);
  }

  const whereClause = conditions.join(' AND ');

  const [rows] = await pool.execute(
    `SELECT
       a.id, a.agency_code, a.name, a.address, a.phone,
       a.agency_type AS type, a.services, a.opening_hours,
       w.id AS wilaya_id, w.name_fr AS wilaya,
       c.id AS city_id, c.name_fr  AS city,
       CAST(a.latitude  AS DOUBLE) AS latitude,
       CAST(a.longitude AS DOUBLE) AS longitude
     FROM agencies a
     JOIN wilayas w ON w.id = a.wilaya_id
     JOIN cities  c ON c.id = a.city_id
     WHERE ${whereClause}
     ORDER BY w.name_fr, c.name_fr, a.agency_code`,
    params
  );

  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. NEAREST AGENCY
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Find the closest active agency to (lat, lng) using the Haversine formula.
 *
 * optionally filter to agencies that handle a specific service
 * (e.g. 'Claims' when auto-assigning a claim).
 *
 * Returns a single agency row + distance_km, or null.
 */
async function getNearestAgency(lat, lng, service = null) {
  const params = [lat, lat, lng];

  let serviceClause = '';
  if (service) {
    serviceClause = 'AND FIND_IN_SET(?, a.services) > 0';
    params.push(service);
  }

  const [rows] = await pool.execute(
    `SELECT
       a.id, a.agency_code, a.name, a.address, a.phone,
       a.agency_type AS type, a.services, a.opening_hours,
       w.name_fr AS wilaya, c.name_fr AS city,
       CAST(a.latitude  AS DOUBLE) AS latitude,
       CAST(a.longitude AS DOUBLE) AS longitude,
       (
         6371 * ACOS(
           COS(RADIANS(?)) * COS(RADIANS(a.latitude)) *
           COS(RADIANS(a.longitude) - RADIANS(?)) +
           SIN(RADIANS(?)) * SIN(RADIANS(a.latitude))
         )
       ) AS distance_km
     FROM agencies a
     JOIN wilayas w ON w.id = a.wilaya_id
     JOIN cities  c ON c.id = a.city_id
     WHERE a.is_active = 1
       ${serviceClause}
     ORDER BY distance_km ASC
     LIMIT 1`,
    params
  );

  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET ONE AGENCY BY ID
// ─────────────────────────────────────────────────────────────────────────────

async function getAgencyById(id) {
  const [rows] = await pool.execute(
    `${BASE_SELECT} AND a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET ALL WILAYAS (for filter dropdown)
// ─────────────────────────────────────────────────────────────────────────────

async function getWilayas() {
  const [rows] = await pool.execute(
    `SELECT w.id, w.code, w.name_fr AS name,
            COUNT(a.id) AS agency_count
     FROM wilayas w
     LEFT JOIN agencies a ON a.wilaya_id = w.id AND a.is_active = 1
     GROUP BY w.id
     ORDER BY w.name_fr`
  );
  return rows;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET CITIES FOR A WILAYA
// ─────────────────────────────────────────────────────────────────────────────

async function getCitiesByWilaya(wilayaId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.name_fr AS name,
            COUNT(a.id) AS agency_count
     FROM cities c
     LEFT JOIN agencies a ON a.city_id = c.id AND a.is_active = 1
     WHERE c.wilaya_id = ?
     GROUP BY c.id
     ORDER BY c.name_fr`,
    [parseInt(wilayaId, 10)]
  );
  return rows;
}

module.exports = {
  getAllAgencies,
  getFilteredAgencies,
  getNearestAgency,
  getAgencyById,
  getWilayas,
  getCitiesByWilaya,
};