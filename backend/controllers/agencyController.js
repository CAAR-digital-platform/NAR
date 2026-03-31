/**
 * controllers/agencyController.js
 *
 * Endpoints:
 *   GET  /api/agencies                     — all agencies (map load)
 *   GET  /api/agencies/filter              — filtered list
 *   GET  /api/agencies/nearest?lat=&lng=   — nearest agency
 *   GET  /api/agencies/wilayas             — all wilayas for dropdown
 *   GET  /api/agencies/cities/:wilayaId    — cities for a wilaya
 *   GET  /api/agencies/:id                 — single agency
 */

const agencyModel = require('../models/agencyModel');

// ─── Normalizer ───────────────────────────────────────────────────────────────
// Convert DB row to the exact shape the frontend expects.
// services arrives as a SET string "Auto,Habitation" — split to array.
function normalize(row) {
  return {
    ...row,
    services: row.services
      ? row.services.split(',').map(s => s.trim()).filter(Boolean)
      : [],
    latitude:  Number(row.latitude),
    longitude: Number(row.longitude),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agencies
// ─────────────────────────────────────────────────────────────────────────────
async function list(req, res) {
  try {
    const agencies = await agencyModel.getAllAgencies();
    return res.status(200).json(agencies.map(normalize));
  } catch (err) {
    console.error('[Agencies] list error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agencies/filter?wilaya_id=&city_id=&type=&service=
// ─────────────────────────────────────────────────────────────────────────────
async function filter(req, res) {
  try {
    const { wilaya_id, city_id, type, service } = req.query;
    const agencies = await agencyModel.getFilteredAgencies({ wilaya_id, city_id, type, service });
    return res.status(200).json(agencies.map(normalize));
  } catch (err) {
    console.error('[Agencies] filter error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agencies/nearest?lat=36.76&lng=3.05&service=Claims
// ─────────────────────────────────────────────────────────────────────────────
async function nearest(req, res) {
  const { lat, lng, service } = req.query;

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return res.status(400).json({ error: 'lat and lng must be valid numbers' });
  }

  // Algeria bounding box sanity check
  if (latNum < 19 || latNum > 38 || lngNum < -9 || lngNum > 12) {
    return res.status(400).json({ error: 'Coordinates outside Algeria bounds' });
  }

  try {
    const agency = await agencyModel.getNearestAgency(latNum, lngNum, service || null);
    if (!agency) {
      return res.status(404).json({ error: 'No agency found near those coordinates' });
    }
    return res.status(200).json(normalize(agency));
  } catch (err) {
    console.error('[Agencies] nearest error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agencies/wilayas
// ─────────────────────────────────────────────────────────────────────────────
async function listWilayas(req, res) {
  try {
    const wilayas = await agencyModel.getWilayas();
    return res.status(200).json(wilayas);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agencies/cities/:wilayaId
// ─────────────────────────────────────────────────────────────────────────────
async function listCities(req, res) {
  const wilayaId = parseInt(req.params.wilayaId, 10);
  if (isNaN(wilayaId) || wilayaId < 1) {
    return res.status(400).json({ error: 'wilayaId must be a positive integer' });
  }
  try {
    const cities = await agencyModel.getCitiesByWilaya(wilayaId);
    return res.status(200).json(cities);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/agencies/:id
// ─────────────────────────────────────────────────────────────────────────────
async function getOne(req, res) {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id) || id < 1) {
    return res.status(400).json({ error: 'id must be a positive integer' });
  }
  try {
    const agency = await agencyModel.getAgencyById(id);
    if (!agency) return res.status(404).json({ error: 'Agency not found' });
    return res.status(200).json(normalize(agency));
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { list, filter, nearest, listWilayas, listCities, getOne };