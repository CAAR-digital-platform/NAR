'use strict';

/**
 * catnat-arch.js — CATNAT subscription flow (fixed v2)
 *
 * KEY FIXES:
 *  - AppState is the SINGLE SOURCE OF TRUTH for _cov and _yn
 *  - All event listeners attached in one place (_attachListeners)
 *  - goToStep defined ONCE, used everywhere
 *  - Premium recalculates whenever any relevant field changes
 *  - Step 2 summary reads from AppState, not local variables
 *  - No inline onclick attributes required
 */

const CATNAT_API = (typeof window.CAAR_API !== 'undefined')
  ? window.CAAR_API
  : 'http://localhost:3000';

/* ═══════════════════════════════════════════════════════════════
   AUTH HELPER
   ═══════════════════════════════════════════════════════════════ */
function _getToken() {
  return localStorage.getItem('caar_quote_token')
      || localStorage.getItem('token')
      || null;
}

function _authHeaders() {
  const h = { 'Content-Type': 'application/json' };
  const t = _getToken();
  if (t) h['Authorization'] = 'Bearer ' + t;
  return h;
}

/* ═══════════════════════════════════════════════════════════════
   APP STATE  — single source of truth
   ═══════════════════════════════════════════════════════════════ */
const AppState = (() => {
  const KEY = 'caar_catnat_v2';

  const DEFAULTS = () => ({
    step: 1,
    property: {
      construction_type:    'Individual Home',
      usage_type:           'Personal',
      built_area:           '',
      num_floors:           '',
      year_construction:    '',
      declared_value:       '',
      wilaya_id:            '',
      city_id:              '',
      // yn toggles live here — single source of truth
      is_seismic_compliant: false,
      has_notarial_deed:    false,
      is_commercial:        false,
      // coverage toggles live here — single source of truth
      extra_coverages:      [],   // array of 'floods'|'storms'|'ground'
    },
    client: {
      title:         'Mr',
      first_name:    '',
      last_name:     '',
      email:         '',
      email_confirm: '',
      phone:         '',
      address:       '',
      city:          '',
    },
    agency_id:        null,
    quoteId:          null,
    token:            null,
    estimated_amount: 0,
    policy_reference: null,
    start_date:       null,
    end_date:         null,
    amount_paid:      null,
  });

  let _s = DEFAULTS();

  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(_s)); } catch (_) {}
  }

  return {
    hydrate() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          _s = Object.assign(DEFAULTS(), parsed);
          // deep-merge property sub-object
          _s.property = Object.assign(DEFAULTS().property, parsed.property || {});
          _s.client   = Object.assign(DEFAULTS().client,   parsed.client   || {});
        }
      } catch (_) {}
      return this;
    },

    // Generic setter: 'property.built_area' or top-level 'quoteId'
    set(path, value) {
      const parts = path.split('.');
      if (parts.length === 1) {
        _s[path] = value;
      } else {
        const [ns, key] = parts;
        if (!_s[ns]) _s[ns] = {};
        _s[ns][key] = value;
      }
      _persist();
    },

    // Merge an object into a namespace
    merge(ns, obj) {
      _s[ns] = Object.assign({}, _s[ns] || {}, obj);
      _persist();
    },

    get(key) { return key ? _s[key] : _s; },

    // Convenience: get property sub-object
    prop() { return _s.property; },

    clear() {
      _s = DEFAULTS();
      localStorage.removeItem(KEY);
      localStorage.removeItem('caar_catnat_quote_id');
    },
  };
})();

/* ═══════════════════════════════════════════════════════════════
   UI HELPERS
   ═══════════════════════════════════════════════════════════════ */
const UI = {
  el:   (id)    => document.getElementById(id),
  val:  (id)    => { const e = document.getElementById(id); return e ? e.value.trim() : ''; },
  txt:  (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; },
  fmtDZD: (n)   => Number(n).toLocaleString('fr-DZ', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }) + ' DZD',
  fmtDate: (iso) => {
    if (!iso) return '—';
    const [y, m, d] = String(iso).split('-');
    return `${d}/${m}/${y}`;
  },
  showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.cssText = 'display:block;background:#fff0f0;border:1px solid #e53e3e;' +
      'border-radius:8px;padding:12px 16px;color:#c53030;font-size:0.82rem;' +
      'font-weight:600;margin-top:12px;margin-bottom:12px;';
  },
  hideError(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },
  btnLoad(id, label) {
    const b = document.getElementById(id);
    if (!b) return;
    b.disabled = true;
    b._orig = b.innerHTML;
    b.innerHTML = '⏳ ' + (label || 'Processing…');
  },
  btnReset(id) {
    const b = document.getElementById(id);
    if (!b) return;
    b.disabled = false;
    if (b._orig !== undefined) b.innerHTML = b._orig;
  },
};

/* ═══════════════════════════════════════════════════════════════
   STEP NAVIGATION  — defined ONCE, used everywhere
   ═══════════════════════════════════════════════════════════════ */
let _currentStep    = 1;
let _countdownTimer = null;

function goToStep(n) {
  if (n < 1 || n > 4) return;

  // Validation gates
  if (n === 2) {
    _snapshotProperty();
    if (!_validateStep1()) return;
    _populateStep2Summary();
  }
  if (n === 3) {
    _snapshotClient();
    if (!_validateStep2()) return;
  }

  const from = UI.el('form-step-' + _currentStep);
  const to   = UI.el('form-step-' + n);
  if (!to) return;
  if (from) from.classList.add('hidden');
  _currentStep = n;
  AppState.set('step', n);
  to.classList.remove('hidden');

  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const ind = UI.el('step-indicator-' + i);
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i < n)        ind.classList.add('done');
    else if (i === n) ind.classList.add('active');
  }

  if (n === 3) _populatePaymentPage(AppState.get('estimated_amount') || 0);

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Expose globally so HTML can still call it if needed
window.goToStep = goToStep;

/* ═══════════════════════════════════════════════════════════════
   YES/NO TOGGLES — write to AppState, re-render button, recalc
   ═══════════════════════════════════════════════════════════════ */
function _setYN(key, val) {
  // key is 'commercial'|'notarial'|'seismic'
  const propKey = key === 'commercial' ? 'is_commercial'
                : key === 'notarial'   ? 'has_notarial_deed'
                : 'is_seismic_compliant';

  AppState.set('property.' + propKey, val === 'yes');

  // Update button visuals
  const wrap = UI.el('yn-' + key);
  if (!wrap) return;
  wrap.querySelectorAll('.yn-btn').forEach(b => b.classList.remove('active'));
  const t = wrap.querySelector('.yn-' + val);
  if (t) t.classList.add('active');

  calculatePremium();
}

/* ═══════════════════════════════════════════════════════════════
   COVERAGE TOGGLES — write to AppState.property.extra_coverages
   ═══════════════════════════════════════════════════════════════ */
function _toggleCoverage(key) {
  const coverages = [...(AppState.prop().extra_coverages || [])];
  const idx = coverages.indexOf(key);

  if (idx === -1) {
    coverages.push(key);
  } else {
    coverages.splice(idx, 1);
  }
  AppState.set('property.extra_coverages', coverages);

  // Update button visual
  const btn = UI.el('btn-' + key);
  if (btn) {
    const added = coverages.includes(key);
    btn.innerHTML = added ? '&#10003; Added' : '+ Add';
    btn.classList.toggle('added', added);
  }

  calculatePremium();
}

/* ═══════════════════════════════════════════════════════════════
   FIELD SNAPSHOT — DOM → AppState
   ═══════════════════════════════════════════════════════════════ */
function _snapshotProperty() {
  AppState.merge('property', {
    construction_type:  UI.val('construction_type') || 'Individual Home',
    usage_type:         UI.val('usage_type')        || 'Personal',
    built_area:         UI.val('built_area'),
    num_floors:         UI.val('num_floors') || null,
    year_construction:  UI.val('year_construction'),
    declared_value:     UI.val('declared_value'),
    wilaya_id:          UI.val('wilaya')       || null,
    city_id:            UI.val('municipality') || null,
    // yn and extra_coverages are already in AppState (updated on toggle)
  });
}

function _snapshotClient() {
  AppState.merge('client', {
    title:         UI.val('title'),
    first_name:    UI.val('first_name'),
    last_name:     UI.val('last_name'),
    email:         UI.val('email'),
    email_confirm: UI.val('confirm_email'),
    phone:         UI.val('mobile_1'),
    address:       UI.val('address'),
    city:          UI.val('city'),
  });
}

/* ═══════════════════════════════════════════════════════════════
   VALIDATION
   ═══════════════════════════════════════════════════════════════ */
function _validateStep1() {
  const year    = parseInt(UI.val('year_construction'), 10);
  const area    = parseFloat(UI.val('built_area'));
  const value   = parseFloat(UI.val('declared_value'));
  const curYear = new Date().getFullYear();

  if (!year || year < 1900 || year > curYear) {
    UI.showError('catnat-error-step1', `Year of construction must be between 1900 and ${curYear}.`);
    return false;
  }
  if (!area || area <= 0) {
    UI.showError('catnat-error-step1', 'Please enter the total built area.');
    return false;
  }
  if (!value || value <= 0) {
    UI.showError('catnat-error-step1', 'Please enter the declared value.');
    return false;
  }
  const terms = UI.el('terms-consent');
  if (!terms || !terms.checked) {
    UI.showError('catnat-error-step1', 'Please accept the general terms and conditions.');
    return false;
  }
  UI.hideError('catnat-error-step1');
  return true;
}

function _validateStep2() {
  const c = AppState.get('client');
  // Use live DOM values since snapshot happens just before calling this
  const fn   = UI.val('first_name');
  const ln   = UI.val('last_name');
  const em   = UI.val('email');
  const emC  = UI.val('confirm_email');
  const ph   = UI.val('mobile_1');

  // Determine which error container to use
  const errId = 'catnat-error-step2';

  if (!fn) { UI.showError(errId, 'Please enter your first name.'); return false; }
  if (!ln) { UI.showError(errId, 'Please enter your last name.');  return false; }
  if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    UI.showError(errId, 'Please enter a valid email address.'); return false;
  }
  if (emC && emC !== em) {
    UI.showError(errId, 'Email addresses do not match.'); return false;
  }
  if (!ph) { UI.showError(errId, 'Please enter your phone number.'); return false; }

  UI.hideError(errId);
  // Also hide API error
  const apiErr = UI.el('api-error-msg');
  if (apiErr) apiErr.style.display = 'none';
  return true;
}

function _validateCard() {
  const card  = (UI.val('card_number') || '').replace(/\s/g, '');
  const cvv   = UI.val('cvv2');
  const month = (UI.el('expiry_month') || {}).value;
  const year  = (UI.el('expiry_year')  || {}).value;
  const name  = UI.val('cardholder_name');

  if (card.length < 16) { UI.showError('pay-error-msg', 'Please enter a valid 16-digit card number.'); return false; }
  if (cvv.length   < 3) { UI.showError('pay-error-msg', 'Please enter a valid 3-digit CVV2.'); return false; }
  if (!month || !year)  { UI.showError('pay-error-msg', 'Please select the card expiry date.'); return false; }
  if (!name)            { UI.showError('pay-error-msg', 'Please enter the cardholder name.'); return false; }
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   PREMIUM CALCULATION  — reads from AppState + live DOM
   ═══════════════════════════════════════════════════════════════ */
function calculatePremium() {
  const declared = parseFloat(UI.val('declared_value')) || 0;
  const area     = parseFloat(UI.val('built_area'))     || 0;

  if (!declared || !area) {
    UI.txt('premium-base',   '0.00 DZD');
    UI.txt('premium-adjust', '0.00 DZD');
    UI.txt('premium-tax',    '0.00 DZD');
    UI.txt('premium-total',  '0.00 DZD');
    return;
  }

  const prop = AppState.prop();
  const cov  = prop.extra_coverages || [];

  let base = declared * 0.0004;

  // Construction type surcharge
  const cType = UI.val('construction_type') || prop.construction_type;
  if (cType === 'Villa') base *= 1.2;

  let adjustments = 0;

  // YN factors (read from AppState — single source of truth)
  if (!prop.is_seismic_compliant) adjustments += base * 0.30;
  if (prop.is_commercial)         adjustments += base * 0.25;

  // Extra coverages
  if (cov.includes('floods')) adjustments += 2000;
  if (cov.includes('storms')) adjustments += 1500;
  if (cov.includes('ground')) adjustments += 1800;

  const tax   = (base + adjustments) * 0.19;
  const total = base + adjustments + tax;

  UI.txt('premium-base',   UI.fmtDZD(base));
  UI.txt('premium-adjust', UI.fmtDZD(adjustments));
  UI.txt('premium-tax',    UI.fmtDZD(tax));
  UI.txt('premium-total',  UI.fmtDZD(total));
}

// Expose for external calls if needed
window.calculatePremium = calculatePremium;

/* ═══════════════════════════════════════════════════════════════
   SUMMARY POPULATION  — reads from AppState
   ═══════════════════════════════════════════════════════════════ */
function _populateStep2Summary() {
  const p = AppState.prop();

  UI.txt('sum-constr',  p.construction_type || '—');
  UI.txt('sum-usage',   p.usage_type        || '—');
  UI.txt('sum-area',    p.built_area   ? p.built_area + ' m²' : '—');
  UI.txt('sum-year',    p.year_construction || '—');
  UI.txt('sum-dvalue',  p.declared_value
    ? UI.fmtDZD(parseFloat(p.declared_value)) : '—');

  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  const fmt = d => d.toISOString().slice(0, 10).split('-').reverse().join('/');
  UI.txt('sum-start', fmt(now));
  UI.txt('sum-end',   fmt(end));

  // Premium amounts — recalculate from AppState values
  // (declared_value is already snapshotted into AppState.property)
  const declared = parseFloat(p.declared_value) || 0;
  const cType    = p.construction_type || 'Individual Home';
  const cov      = p.extra_coverages || [];

  let base = declared * 0.0004;
  if (cType === 'Villa') base *= 1.2;
  let adj = 0;
  if (!p.is_seismic_compliant) adj += base * 0.30;
  if (p.is_commercial)         adj += base * 0.25;
  if (cov.includes('floods'))  adj += 2000;
  if (cov.includes('storms'))  adj += 1500;
  if (cov.includes('ground'))  adj += 1800;
  const tax   = (base + adj) * 0.19;
  const total = base + adj + tax;

  UI.txt('sum-net',   UI.fmtDZD(base + adj));
  UI.txt('sum-tax',   UI.fmtDZD(tax));
  UI.txt('sum-total', UI.fmtDZD(total));

  // Guarantees list — reads from AppState
  const gList = UI.el('guarantees-list');
  if (gList) {
    const items = ['Earthquakes'];
    if (cov.includes('floods')) items.push('Floods &amp; Mudflows');
    if (cov.includes('storms')) items.push('Storms &amp; High Winds');
    if (cov.includes('ground')) items.push('Ground Movements');
    gList.innerHTML = items.map(i => `<li>${i}</li>`).join('');
  }
}

function _populatePaymentPage(amount) {
  UI.txt('pay-amount', UI.fmtDZD(amount));
  UI.txt('pay-ref', 'New Contract — CATNAT');
  _startCountdown(300);
}

function _populateConfirmation(data) {
  if (data) {
    AppState.set('policy_reference', data.policy_reference || '—');
    AppState.set('start_date',       data.start_date       || null);
    AppState.set('end_date',         data.end_date         || null);
    AppState.set('amount_paid',      data.amount_paid      || 0);
  }
  const s = AppState.get();
  UI.txt('confirm-policy-ref', s.policy_reference || '—');
  UI.txt('confirm-dates',
    'Issued: ' + UI.fmtDate(s.start_date) +
    ' · Valid until: ' + UI.fmtDate(s.end_date));
  UI.txt('confirm-amount', UI.fmtDZD(s.amount_paid || 0));
}

/* ═══════════════════════════════════════════════════════════════
   COUNTDOWN
   ═══════════════════════════════════════════════════════════════ */
function _startCountdown(seconds) {
  clearInterval(_countdownTimer);
  let r = seconds;
  const tick = () => {
    const el = UI.el('countdown');
    if (el) el.textContent = Math.floor(r / 60) + ':' + String(r % 60).padStart(2, '0');
    if (r-- <= 0) clearInterval(_countdownTimer);
  };
  tick();
  _countdownTimer = setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════════
   AGENCIES
   ═══════════════════════════════════════════════════════════════ */
let _agencies = [];

async function _loadAgencies() {
  try {
    let res  = await fetch(CATNAT_API + '/api/agencies/filter?service=Habitation');
    let list = res.ok ? await res.json() : [];
    if (!list.length) {
      res  = await fetch(CATNAT_API + '/api/agencies');
      list = res.ok ? await res.json() : [];
    }
    _agencies = list;
    _buildWilayaFilter();
    _buildAgencySelect(_agencies);
  } catch (err) {
    console.warn('[CATNAT] agencies load failed:', err.message);
  }
}

function _buildWilayaFilter() {
  const sel = UI.el('agency_wilaya');
  if (!sel) return;
  const seen = new Map();
  _agencies.forEach(ag => {
    if (!seen.has(ag.wilaya_id)) seen.set(ag.wilaya_id, ag.wilaya || ('Wilaya ' + ag.wilaya_id));
  });
  sel.innerHTML = '<option value="">All Wilayas</option>' +
    [...seen.entries()].sort((a, b) => a[1] < b[1] ? -1 : 1)
      .map(([id, name]) => `<option value="${id}">${name}</option>`).join('');

  sel.addEventListener('change', function () {
    const wid = parseInt(this.value, 10);
    _buildAgencySelect(wid ? _agencies.filter(ag => ag.wilaya_id === wid) : _agencies);
  });
}

function _buildAgencySelect(list) {
  const sel = UI.el('agency');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select agency —</option>' +
    list.map(ag =>
      `<option value="${ag.id}">${ag.agency_code} — ${ag.city}, ${ag.wilaya}</option>`
    ).join('');

  sel.addEventListener('change', function () {
    AppState.set('agency_id', this.value ? parseInt(this.value, 10) : null);
    const ag = list.find(a => a.id === parseInt(this.value, 10));
    if (ag) {
      UI.txt('agency-card-name', `Agency ${ag.agency_code} — ${ag.city}`);
      UI.txt('agency-card-addr', ag.address || '');
      UI.txt('agency-card-phone', ag.phone || '—');
      UI.txt('agency-card-fax', ag.fax ? 'Fax: ' + ag.fax : '');
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   SYNC COVERAGE BUTTON VISUALS from AppState
   (called after hydrate so UI matches restored state)
   ═══════════════════════════════════════════════════════════════ */
function _syncCoverageButtons() {
  const cov = AppState.prop().extra_coverages || [];
  ['floods', 'storms', 'ground'].forEach(key => {
    const btn = UI.el('btn-' + key);
    if (!btn) return;
    const added = cov.includes(key);
    btn.innerHTML = added ? '&#10003; Added' : '+ Add';
    btn.classList.toggle('added', added);
  });
}

function _syncYNButtons() {
  const p = AppState.prop();
  const map = [
    { key: 'commercial', prop: 'is_commercial' },
    { key: 'notarial',   prop: 'has_notarial_deed' },
    { key: 'seismic',    prop: 'is_seismic_compliant' },
  ];
  map.forEach(({ key, prop }) => {
    const val  = p[prop] ? 'yes' : 'no';
    const wrap = UI.el('yn-' + key);
    if (!wrap) return;
    wrap.querySelectorAll('.yn-btn').forEach(b => b.classList.remove('active'));
    const t = wrap.querySelector('.yn-' + val);
    if (t) t.classList.add('active');
  });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN FLOW — API CALLS
   ═══════════════════════════════════════════════════════════════ */
async function _submitAndProceed() {
  if (window.__catnatProcessing) return;

  _snapshotClient();
  if (!_validateStep2()) return;

  const s    = AppState.get();
  const p    = s.property;
  const c    = s.client;

  const payload = {
    first_name:           c.first_name.trim(),
    last_name:            c.last_name.trim(),
    email:                c.email.trim().toLowerCase(),
    phone:                c.phone ? c.phone.trim() : null,
    construction_type:    p.construction_type  || 'Individual Home',
    usage_type:           p.usage_type         || 'Personal',
    built_area:           parseFloat(p.built_area)          || 0,
    num_floors:           p.num_floors                       || null,
    year_construction:    parseInt(p.year_construction, 10)  || 0,
    declared_value:       parseFloat(p.declared_value)       || 0,
    address:              c.address || null,
    wilaya_id:            p.wilaya_id ? parseInt(p.wilaya_id, 10) : null,
    city_id:              p.city_id   ? parseInt(p.city_id,   10) : null,
    is_seismic_compliant: !!p.is_seismic_compliant,
    has_notarial_deed:    !!p.has_notarial_deed,
    is_commercial:        !!p.is_commercial,
    extra_coverages:      Array.isArray(p.extra_coverages) ? p.extra_coverages : [],
  };

  window.__catnatProcessing = true;
  UI.btnLoad('btn-pay-cib', 'Creating quote…');
  const errId = 'api-error-msg';
  UI.hideError(errId);

  try {
    // 1. Create quote
    const quoteRes  = await fetch(CATNAT_API + '/api/catnat/quote', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const quoteData = await quoteRes.json();

    if (!quoteRes.ok) {
      UI.showError(errId, quoteData.error || `Quote failed (HTTP ${quoteRes.status})`);
      return;
    }

    AppState.set('quoteId',           quoteData.quote_id);
    AppState.set('estimated_amount',  quoteData.estimated_amount);
    AppState.set('token',             quoteData.token);
    localStorage.setItem('caar_quote_token', quoteData.token);
    localStorage.setItem('caar_catnat_quote_id', String(quoteData.quote_id));

    // Update summary with real backend amount
    const gross = quoteData.estimated_amount;
    const net   = gross / 1.19;
    const tax   = gross - net;
    UI.txt('sum-net',   UI.fmtDZD(net));
    UI.txt('sum-tax',   UI.fmtDZD(tax));
    UI.txt('sum-total', UI.fmtDZD(gross));

    // 2. Confirm quote
    UI.btnLoad('btn-pay-cib', 'Confirming…');
    const confirmRes  = await fetch(
      CATNAT_API + '/api/catnat/confirm/' + quoteData.quote_id, {
        method:  'POST',
        headers: _authHeaders(),
      });
    const confirmData = await confirmRes.json();

    if (!confirmRes.ok) {
      UI.showError(errId,
        confirmData.error || `Confirmation failed (HTTP ${confirmRes.status})`);
      return;
    }

    // Move to payment step (no validation needed — goToStep(3) only validates step2)
    _goDirectToStep(3, quoteData.estimated_amount);

  } catch (err) {
    UI.showError(errId, 'Network error — ' + err.message);
    console.error('[CATNAT] submitAndProceed:', err);
  } finally {
    window.__catnatProcessing = false;
    UI.btnReset('btn-pay-cib');
  }
}

// Direct step jump that SKIPS validation (used after API confirms)
function _goDirectToStep(n, amount) {
  const from = UI.el('form-step-' + _currentStep);
  const to   = UI.el('form-step-' + n);
  if (!to) return;
  if (from) from.classList.add('hidden');
  _currentStep = n;
  AppState.set('step', n);
  to.classList.remove('hidden');

  for (let i = 1; i <= 4; i++) {
    const ind = UI.el('step-indicator-' + i);
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i < n)        ind.classList.add('done');
    else if (i === n) ind.classList.add('active');
  }

  if (n === 3 && amount) _populatePaymentPage(amount);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function _validateAndPay() {
  if (window.__catnatProcessing) return;
  if (!_validateCard()) return;

  UI.hideError('pay-error-msg');
  clearInterval(_countdownTimer);

  const s = AppState.get();
  if (!s.quoteId || !s.token) {
    UI.showError('pay-error-msg', 'Session expired — please start again from Step 1.');
    return;
  }

  window.__catnatProcessing = true;
  UI.btnLoad('btn-validate-pay', 'Processing payment…');

  try {
    const res  = await fetch(CATNAT_API + '/api/catnat/pay/' + s.quoteId, {
      method:  'POST',
      headers: _authHeaders(),
      body:    JSON.stringify({}),
    });
    const data = await res.json();

    if (!res.ok) {
      UI.showError('pay-error-msg', data.error || `Payment failed (HTTP ${res.status})`);
      return;
    }

    _populateConfirmation(data);
    _goDirectToStep(4);

  } catch (err) {
    UI.showError('pay-error-msg', 'Payment error — ' + err.message);
    console.error('[CATNAT] validateAndPay:', err);
  } finally {
    window.__catnatProcessing = false;
    UI.btnReset('btn-validate-pay');
  }
}

/* ═══════════════════════════════════════════════════════════════
   PAYMENT HELPERS
   ═══════════════════════════════════════════════════════════════ */
function _formatCardNumber(input) {
  const v = (input.value || '').replace(/\D/g, '').slice(0, 16);
  input.value = (v.match(/.{1,4}/g) || []).join(' ');
}

function _resetPaymentForm() {
  ['card_number', 'cvv2', 'cardholder_name'].forEach(id => {
    const el = UI.el(id); if (el) el.value = '';
  });
  ['expiry_month', 'expiry_year'].forEach(id => {
    const el = UI.el(id); if (el) el.selectedIndex = 0;
  });
  UI.hideError('pay-error-msg');
}

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING — all listeners in one place
   ═══════════════════════════════════════════════════════════════ */
function _attachListeners() {

  // ── Step navigation buttons ────────────────────────────────
  const s1Btn = UI.el('btn-continue-step1');
  if (s1Btn) s1Btn.addEventListener('click', () => goToStep(2));

  const s2Back = UI.el('btn-back-step2');
  if (s2Back) s2Back.addEventListener('click', () => goToStep(1));

  const payCib = UI.el('btn-pay-cib');
  if (payCib) payCib.addEventListener('click', _submitAndProceed);

  const payBtn = UI.el('btn-validate-pay');
  if (payBtn) payBtn.addEventListener('click', _validateAndPay);

  const cancelPay = UI.el('btn-cancel-payment');
  if (cancelPay) cancelPay.addEventListener('click', () => goToStep(2));

  const resetPay = UI.el('btn-reset-payment');
  if (resetPay) resetPay.addEventListener('click', _resetPaymentForm);

  // ── Card number formatting ─────────────────────────────────
  const cardInput = UI.el('card_number');
  if (cardInput) cardInput.addEventListener('input', () => _formatCardNumber(cardInput));

  // ── YES/NO toggles (event delegation on each yn-toggle) ───
  document.querySelectorAll('.yn-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const key = this.dataset.yn;
      const val = this.dataset.val;
      if (key && val) _setYN(key, val);
    });
  });

  // ── Coverage add buttons ───────────────────────────────────
  ['floods', 'storms', 'ground'].forEach(key => {
    const btn = UI.el('btn-' + key);
    if (btn) btn.addEventListener('click', () => _toggleCoverage(key));
  });

  // ── Premium recalculation triggers ────────────────────────
  const recalcFields = ['declared_value', 'built_area', 'construction_type', 'usage_type'];
  recalcFields.forEach(id => {
    const el = UI.el(id);
    if (el) el.addEventListener('input',  calculatePremium);
    if (el) el.addEventListener('change', calculatePremium);
  });

  // Wilaya change also triggers recalc (even though premium doesn't use it
  // directly, it triggers _snapshotProperty which updates AppState)
  const wilayaEl = UI.el('wilaya');
  if (wilayaEl) {
    wilayaEl.addEventListener('change', function () {
      AppState.set('property.wilaya_id', this.value);
    });
  }

  // Municipality
  const muniEl = UI.el('municipality');
  if (muniEl) {
    muniEl.addEventListener('change', function () {
      AppState.set('property.city_id', this.value);
    });
  }

  // Spin buttons
  const spinMap = [
    { upId: 'spin-year-up',    dnId: 'spin-year-down',   inputId: 'year_construction', step: 1 },
    { upId: 'spin-area-up',    dnId: 'spin-area-down',   inputId: 'built_area',         step: 10 },
    { upId: 'spin-dvalue-up',  dnId: 'spin-dvalue-down', inputId: 'declared_value',     step: 100000 },
  ];
  spinMap.forEach(({ upId, dnId, inputId, step }) => {
    const up  = UI.el(upId);
    const dn  = UI.el(dnId);
    const inp = UI.el(inputId);
    if (up && inp) up.addEventListener('click', () => {
      inp.value = (parseFloat(inp.value) || 0) + step;
      calculatePremium();
    });
    if (dn && inp) dn.addEventListener('click', () => {
      inp.value = Math.max(parseFloat(inp.min) || 0, (parseFloat(inp.value) || 0) - step);
      calculatePremium();
    });
  });

  // Download certificate button
  const dlBtn = UI.el('btn-download-cert');
  if (dlBtn) dlBtn.addEventListener('click', () => {
    alert('Your CATNAT certificate will be sent to your email shortly.');
  });

  // Print button
  const printBtn = UI.el('btn-print');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
}

/* ═══════════════════════════════════════════════════════════════
   WILAYA / MUNICIPALITY DROPDOWNS (via dropdown.js)
   ═══════════════════════════════════════════════════════════════ */
async function _loadLocationDropdowns() {
  if (typeof window.loadWilayas !== 'function') return;

  await window.loadWilayas('wilaya', {
    placeholder: 'Select Wilaya',
    onChange: (id) => {
      AppState.set('property.wilaya_id', id);
      if (typeof window.loadCities === 'function') {
        window.loadCities(id, 'municipality', {
          placeholder: 'Select Municipality',
          onChange: (cityId) => {
            AppState.set('property.city_id', cityId);
          },
        });
      }
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {
  // 1. Restore any persisted state
  AppState.hydrate();

  // 2. Load agencies for step 2 dropdown
  await _loadAgencies();

  // 3. Load wilaya/municipality dropdowns
  await _loadLocationDropdowns();

  // 4. Attach all event listeners
  _attachListeners();

  // 5. Sync button visuals to restored AppState
  _syncCoverageButtons();
  _syncYNButtons();

  // 6. Initial premium calculation
  calculatePremium();

  // 7. Always start at step 1 (fresh flow)
  localStorage.removeItem('caar_catnat_v2');
  AppState.clear();
  _currentStep = 1;

  // Ensure step 1 is visible, others hidden
  for (let i = 1; i <= 4; i++) {
    const s = UI.el('form-step-' + i);
    if (!s) continue;
    if (i === 1) s.classList.remove('hidden');
    else          s.classList.add('hidden');
  }

  // Update step indicators
  for (let i = 1; i <= 4; i++) {
    const ind = UI.el('step-indicator-' + i);
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i === 1) ind.classList.add('active');
  }

  window.__catnatProcessing = false;
  console.log('[CATNAT] catnat-arch.js (fixed v2) booted.');
});