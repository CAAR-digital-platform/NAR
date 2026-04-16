'use strict';

/**
 * dropdowns.js — Reusable wilaya/city loaders
 * Depends on: CAAR_API (set in app-state.js, default http://localhost:3000)
 */

const DROPDOWN_API = (typeof window.CAAR_API !== 'undefined')
  ? window.CAAR_API
  : 'http://localhost:3000';

/**
 * Populate a <select> with wilayas from /api/agencies/wilayas.
 * @param {string} selectId   - DOM id of the <select> element
 * @param {object} [opts]
 * @param {string} [opts.placeholder='All Wilayas'] - first blank option text
 * @param {Function} [opts.onChange]  - called with (wilayaId, wilayaName) on change
 * @returns {Promise<Array>}  resolved wilaya list
 */
function _authHeaders() {
  const h = {};
  const t = localStorage.getItem('token');
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}
async function loadWilayas(selectId, opts) {
  opts = opts || {};
  const sel = document.getElementById(selectId);
  if (!sel) return [];

  sel.innerHTML = '<option value="">Loading…</option>';
  sel.disabled = true;

  let wilayas = [];
  try {
    const res = await fetch(
  DROPDOWN_API + '/api/agencies/wilayas',
  { headers: _authHeaders() }
);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    wilayas = await res.json();
  } catch (err) {
    console.error('[dropdowns] loadWilayas:', err.message);
    sel.innerHTML = '<option value="">Error loading wilayas</option>';
    sel.disabled = false;
    return [];
  }

  const placeholder = opts.placeholder || 'Select Wilaya';
  sel.innerHTML = '<option value="">' + placeholder + '</option>' +
    wilayas.map(function (w) {
      return '<option value="' + w.id + '">' +
        (w.code ? w.code + ' — ' : '') + (w.name || w.name_fr || '') +
        '</option>';
    }).join('');

  sel.disabled = false;

  if (typeof opts.onChange === 'function') {
  sel.onchange = function ()  {
      const id = this.value;
      const name = id
        ? (this.options[this.selectedIndex] || {}).text || ''
        : '';
      opts.onChange(id, name);
    };
  }

  return wilayas;
}

/**
 * Populate a <select> with cities for a given wilaya.
 * @param {string|number} wilayaId
 * @param {string} selectId
 * @param {object} [opts]
 * @param {string} [opts.placeholder='All Cities']
 * @param {Function} [opts.onChange] - called with (cityId, cityName) on change
 * @returns {Promise<Array>}
 */
async function loadCities(wilayaId, selectId, opts) {
  opts = opts || {};
  const sel = document.getElementById(selectId);
  if (!sel) return [];

  if (!wilayaId) {
    sel.innerHTML = '<option value="">' + (opts.placeholder || 'Select City') + '</option>';
    sel.disabled = true;
    return [];
  }

  sel.innerHTML = '<option value="">Loading…</option>';
  sel.disabled = true;

  let cities = [];
  try {
    const res = await fetch(DROPDOWN_API + '/api/agencies/cities/' + wilayaId);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    cities = await res.json();
  } catch (err) {
    console.error('[dropdowns] loadCities:', err.message);
    sel.innerHTML = '<option value="">Error loading cities</option>';
    sel.disabled = false;
    return [];
  }

  const placeholder = opts.placeholder || 'All Cities';
  sel.innerHTML = '<option value="">' + placeholder + '</option>' +
    cities.map(function (c) {
      return '<option value="' + c.id + '">' + (c.name || c.name_fr || '') + '</option>';
    }).join('');

  sel.disabled = false;

  if (typeof opts.onChange === 'function') {
    sel.onchange = function ()  {
      const id = this.value;
      const name = id
        ? (this.options[this.selectedIndex] || {}).text || ''
        : '';
      opts.onChange(id, name);
    };
  }

  return cities;
}

window.loadWilayas = loadWilayas;
window.loadCities  = loadCities;