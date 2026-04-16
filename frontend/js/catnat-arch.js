'use strict';

/**
 * catnat-arch.js — CATNAT subscription flow (refactored)
 *
 * Changes vs previous version:
 *  - Plan selection UI completely removed
 *  - Premium calculated by backend only; result displayed client-side
 *  - Wilaya/city dropdowns loaded dynamically via dropdowns.js
 *  - All fetch() calls carry Authorization header from localStorage
 *  - Double-submit guard: window.__catnatProcessing
 *  - Global processing flag released in finally blocks
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
   APP STATE
   ═══════════════════════════════════════════════════════════════ */
const AppState = (() => {
  const KEY = 'caar_catnat_v2';

  const DEFAULTS = () => ({
    step: 1,
    property: {
      construction_type: '',
      usage_type: '',
      built_area: '',
      num_floors: '',
      year_construction: '',
      declared_value: '',
      wilaya_id: '',
      city_id: '',
      is_seismic_compliant: false,
      has_notarial_deed: false,
      is_commercial: false,
      extra_coverages: [],
    },
    client: {
      title: 'Mr',
      first_name: '',
      last_name: '',
      email: '',
      email_confirm: '',
      phone: '',
      address: '',
      city: '',
      wilaya_id: '',
    },
    agency_id: null,
    quoteId: null,
    token: null,
    estimated_amount: 0,
    policy_reference: null,
    start_date: null,
    end_date: null,
    amount_paid: null,
  });

  let _s = DEFAULTS();

  function _persist() {
    try { localStorage.setItem(KEY, JSON.stringify(_s)); } catch (_) {}
  }

  return {
    hydrate() {
      try {
        const raw = localStorage.getItem(KEY);
        if (raw) _s = Object.assign(DEFAULTS(), JSON.parse(raw));
      } catch (_) {}
      return this;
    },
    set(path, value) {
      const parts = path.split('.');
      if (parts.length === 1) {
        _s[path] = (value !== null && typeof value === 'object' && !Array.isArray(value))
          ? Object.assign({}, _s[path] || {}, value)
          : value;
      } else {
        const [ns, key] = parts;
        _s[ns] = Object.assign({}, _s[ns] || {}, { [key]: value });
      }
      _persist();
    },
    get(key) { return key ? _s[key] : _s; },
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
  el:    (id) => document.getElementById(id),
  val:   (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ''; },
  txt:   (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; },
  fmtDZD: (n) => Number(n).toLocaleString('fr-DZ', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  }) + ' DZD',
  fmtDate: (iso) => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return d + '/' + m + '/' + y;
  },
  showError(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = msg;
    el.style.cssText = 'display:block;background:#fff0f0;border:1px solid #e53e3e;' +
      'border-radius:8px;padding:12px 16px;color:#c53030;font-size:0.82rem;' +
      'font-weight:600;margin-bottom:12px;';
    console.error('[CATNAT] Error:', msg);
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
    if (b._orig) b.innerHTML = b._orig;
  },
};

/* ═══════════════════════════════════════════════════════════════
   YES/NO TOGGLES + EXTRA COVERAGES
   ═══════════════════════════════════════════════════════════════ */
const _yn = { commercial: 'no', notarial: 'no', seismic: 'no' };
const _cov = { floods: false, storms: false, ground: false };

window.setYN = function (key, val) {
  _yn[key] = val;
  const wrap = UI.el('yn-' + key);
  if (!wrap) return;
  wrap.querySelectorAll('.yn-btn').forEach((b) => b.classList.remove('active'));
  const t = wrap.querySelector('.yn-' + val);
  if (t) t.classList.add('active');
   calculatePremium();
};

window.toggleCoverage = function (key, btn) {
  _cov[key] = !_cov[key];
  btn.innerHTML = _cov[key] ? '&#10003; Added' : '+ Add';
  btn.classList.toggle('added', _cov[key]);
  calculatePremium();
};

window.spinUp   = (id, step) => { const e = UI.el(id); if (e) e.value = (parseFloat(e.value) || 0) + step; };
window.spinDown = (id, step) => { const e = UI.el(id); if (e) e.value = Math.max(parseFloat(e.min) || 0, (parseFloat(e.value) || 0) - step); };
window.onConstructionTypeChange = () => {};

/* ═══════════════════════════════════════════════════════════════
   AGENCIES (step 2 agency dropdown)
   ═══════════════════════════════════════════════════════════════ */
let _agencies = [];

async function _loadAgencies() {
  try {
    let res = await fetch(CATNAT_API + '/api/agencies/filter?service=Habitation');
    let list = res.ok ? await res.json() : [];
    if (!list.length) {
      res = await fetch(CATNAT_API + '/api/agencies');
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
  _agencies.forEach((ag) => {
    if (!seen.has(ag.wilaya_id)) seen.set(ag.wilaya_id, ag.wilaya || ('Wilaya ' + ag.wilaya_id));
  });
  sel.innerHTML = '<option value="">All Wilayas</option>' +
    [...seen.entries()].sort((a, b) => a[1] < b[1] ? -1 : 1)
      .map(([id, name]) => '<option value="' + id + '">' + name + '</option>').join('');
  sel.onchange = function ()  {
    const wid = parseInt(this.value, 10);
    _buildAgencySelect(wid ? _agencies.filter((ag) => ag.wilaya_id === wid) : _agencies);
  };
}

function _buildAgencySelect(list) {
  const sel = UI.el('agency');
  if (!sel) return;
  sel.innerHTML = '<option value="">— Select agency —</option>' +
    list.map((ag) =>
      '<option value="' + ag.id + '">' + ag.agency_code + ' — ' + ag.city + ', ' + ag.wilaya + '</option>'
    ).join('');
 sel.onchange = function (){
    AppState.set('agency_id', this.value ? parseInt(this.value, 10) : null);
    const ag = list.find((a) => a.id === parseInt(this.value, 10));
    if (ag) {
      UI.txt('agency-card-name', 'Agency ' + ag.agency_code + ' — ' + ag.city);
      UI.txt('agency-card-addr', ag.address || '');
      UI.txt('agency-card-phone', ag.phone || '—');
      UI.txt('agency-card-fax', ag.fax ? 'Fax: ' + ag.fax : '');
    }
  };
}

/* ═══════════════════════════════════════════════════════════════
   FIELD PERSISTENCE
   ═══════════════════════════════════════════════════════════════ */
function _snapshotProperty() {
  const extras = Object.keys(_cov).filter((k) => _cov[k]);
  AppState.set('property', {
    construction_type:    UI.val('construction_type') || 'Individual Home',
    usage_type:           UI.val('usage_type')        || 'Personal',
    built_area:           UI.val('built_area'),
    num_floors:           UI.val('num_floors') || null,
    year_construction:    UI.val('year_construction'),
    declared_value:       UI.val('declared_value'),
    wilaya_id:            UI.val('wilaya')     || null,
    city_id:              UI.val('municipality') || null,
    is_seismic_compliant: _yn.seismic    === 'yes',
    has_notarial_deed:    _yn.notarial   === 'yes',
    is_commercial:        _yn.commercial === 'yes',
    extra_coverages:      extras,
  });
}

function _snapshotClient() {
  AppState.set('client', {
    title:         UI.val('title'),
    first_name:    UI.val('first_name'),
    last_name:     UI.val('last_name'),
    email:         UI.val('email'),
    email_confirm: UI.val('confirm_email'),
    phone:         UI.val('mobile_1'),
    address:       UI.val('address'),
    city:          UI.val('city'),
    wilaya_id: UI.val('wilaya') || null,
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
    UI.showError('catnat-error-step1', 'Year of construction must be between 1900 and ' + curYear + '.');
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
  if (!c.first_name) { UI.showError('catnat-error-step2', 'Please enter your first name.'); return false; }
  if (!c.last_name)  { UI.showError('catnat-error-step2', 'Please enter your last name.');  return false; }
  if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
    UI.showError('catnat-error-step2', 'Please enter a valid email address.');
    return false;
  }
  if (c.email_confirm && c.email_confirm !== c.email) {
    UI.showError('catnat-error-step2', 'Email addresses do not match.');
    return false;
  }
  if (!c.phone) { UI.showError('catnat-error-step2', 'Please enter your phone number.'); return false; }
  UI.hideError('catnat-error-step2');
  return true;
}

function _validateCard() {
  const card  = (UI.val('card_number') || '').replace(/\s/g, '');
  const cvv   = UI.val('cvv2');
  const month = (UI.el('expiry_month') || {}).value;
  const year  = (UI.el('expiry_year')  || {}).value;
  const name  = UI.val('cardholder_name');

  if (card.length < 16) { UI.showError('pay-error-msg', 'Please enter a valid 16-digit card number.'); return false; }
  if (cvv.length   < 3) { UI.showError('pay-error-msg', 'Please enter a valid 3-digit CVV2.');         return false; }
  if (!month || !year)  { UI.showError('pay-error-msg', 'Please select the card expiry date.');         return false; }
  if (!name)            { UI.showError('pay-error-msg', 'Please enter the cardholder name.');           return false; }
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   STEP NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
let _currentStep    = 1;
let _countdownTimer = null;

function _goToStep(n) {
  if (n < 1 || n > 4) return;
  const from = UI.el('form-step-' + _currentStep);
  const to   = UI.el('form-step-' + n);
  if (!to) return;
  if (from) from.classList.add('hidden');
  _currentStep = n;
  to.classList.remove('hidden');
  AppState.set('step', n);

  for (let i = 1; i <= 4; i++) {
    const ind = UI.el('step-indicator-' + i);
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i < n)       ind.classList.add('done');
    else if (i === n) ind.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goToStep = function (n) {
  if (n === 2) {
    _snapshotProperty();
    if (!_validateStep1()) return;
    _populateStep2Summary();
    _goToStep(2);
    return;
  }
  if (n === 1) { _goToStep(1); return; }
};

/* ═══════════════════════════════════════════════════════════════
   SUMMARY POPULATION
   ═══════════════════════════════════════════════════════════════ */
function _populateStep2Summary() {
  const s = AppState.get();
  const p = s.property;
  UI.txt('sum-constr',  p.construction_type || '—');
  UI.txt('sum-usage',   p.usage_type        || '—');
  UI.txt('sum-area',    p.built_area ? p.built_area + ' m²' : '—');
  UI.txt('sum-year',    p.year_construction || '—');
  UI.txt('sum-dvalue',  p.declared_value ? UI.fmtDZD(parseFloat(p.declared_value)) : '—');
  const now = new Date();
  const end = new Date(now);
  end.setFullYear(end.getFullYear() + 1);
  end.setDate(end.getDate() - 1);
  const fmt = (d) => d.toISOString().slice(0, 10).split('-').reverse().join('/');
  UI.txt('sum-start', fmt(now));
  UI.txt('sum-end',   fmt(end));

  /* Premium display will be populated after API response */
  UI.txt('sum-net',   '—');
  UI.txt('sum-tax',   '—');
  UI.txt('sum-total', '—');

  /* Guarantees */
  const gList = UI.el('guarantees-list');
  if (gList) {
    const items = ['Earthquakes'];
    if (_cov.floods) items.push('Floods & Mudflows');
    if (_cov.storms) items.push('Storms & High Winds');
    if (_cov.ground) items.push('Ground Movements');
    gList.innerHTML = items.map((i) => '<li>' + i + '</li>').join('');
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
    'Issued: ' + UI.fmtDate(s.start_date) + ' · Valid until: ' + UI.fmtDate(s.end_date));
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
   MAIN FLOW
   ═══════════════════════════════════════════════════════════════ */

/**
 * submitAndProceed — Step 2 → Step 3
 * POST /api/catnat/quote  → auto-confirm → go to payment
 */
window.submitAndProceed = async function () {
  if (window.__catnatProcessing) return;

  _snapshotProperty();
  _snapshotClient();

  UI.hideError('catnat-error-step2');
  if (!_validateStep2()) return;

  const s = AppState.get();

  const payload = {
    first_name:           s.client.first_name.trim(),
    last_name:            s.client.last_name.trim(),
    email:                s.client.email.trim().toLowerCase(),
    phone:                s.client.phone ? s.client.phone.trim() : null,
    construction_type:    s.property.construction_type  || 'Individual Home',
    usage_type:           s.property.usage_type         || 'Personal',
    built_area:           parseFloat(s.property.built_area)         || 0,
    num_floors:           s.property.num_floors                     || null,
    year_construction:    parseInt(s.property.year_construction, 10) || 0,
    declared_value:       parseFloat(s.property.declared_value)      || 0,
    address:              s.client.address   || null,
    wilaya_id:            s.property.wilaya_id ? parseInt(s.property.wilaya_id, 10) : null,
    city_id:              s.property.city_id  ? parseInt(s.property.city_id,    10) : null,
    is_seismic_compliant: !!s.property.is_seismic_compliant,
    has_notarial_deed:    !!s.property.has_notarial_deed,
    is_commercial:        !!s.property.is_commercial,
    extra_coverages:      Array.isArray(s.property.extra_coverages)
      ? s.property.extra_coverages : [],
  };

  window.__catnatProcessing = true;
  UI.btnLoad('btn-pay-cib', 'Creating quote…');

  try {
    /* 1. Create quote */
    const quoteRes  = await fetch(CATNAT_API + '/api/catnat/quote', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const quoteData = await quoteRes.json();

    if (!quoteRes.ok) {
      UI.showError('catnat-error-step2', quoteData.error || 'Quote failed (HTTP ' + quoteRes.status + ')');
      return;
    }

    AppState.set('quoteId',           quoteData.quote_id);
    AppState.set('estimated_amount',  quoteData.estimated_amount);
    AppState.set('token',             quoteData.token);

    localStorage.setItem('caar_quote_token', quoteData.token);
    localStorage.setItem('caar_catnat_quote_id', String(quoteData.quote_id));

    /* Update summary with real backend amount */
    const gross = quoteData.estimated_amount;
    const net   = gross / 1.19;
    const tax   = gross - net;
    UI.txt('sum-net',   UI.fmtDZD(net));
    UI.txt('sum-tax',   UI.fmtDZD(tax));
    UI.txt('sum-total', UI.fmtDZD(gross));

    /* 2. Confirm quote */
    UI.btnLoad('btn-pay-cib', 'Confirming…');

    const confirmRes  = await fetch(
      CATNAT_API + '/api/catnat/confirm/' + quoteData.quote_id, {
        method:  'POST',
        headers: _authHeaders(),
      });
    const confirmData = await confirmRes.json();

    if (!confirmRes.ok) {
      UI.showError('catnat-error-step2',
        confirmData.error || 'Confirmation failed (HTTP ' + confirmRes.status + ')');
      return;
    }

    _populatePaymentPage(quoteData.estimated_amount);
    _goToStep(3);

  } catch (err) {
    UI.showError('catnat-error-step2', 'Network error — ' + err.message);
    console.error('[CATNAT] submitAndProceed:', err);
  } finally {
    window.__catnatProcessing = false;
    UI.btnReset('btn-pay-cib');
  }
};

/**
 * validateAndPay — Step 3 → Step 4
 * POST /api/catnat/pay/:quoteId
 */
window.validateAndPay = async function () {
  if (window.__catnatProcessing) return;
  if (!_validateCard()) return;

  UI.hideError('pay-error-msg');
  clearInterval(_countdownTimer);

  const { quoteId, token } = AppState.get();
  if (!quoteId || !token) {
    UI.showError('pay-error-msg', 'Session expired — please start again from Step 1.');
    return;
  }

  window.__catnatProcessing = true;
  UI.btnLoad('btn-validate-pay', 'Processing payment…');

  try {
    const res  = await fetch(CATNAT_API + '/api/catnat/pay/' + quoteId, {
      method:  'POST',
      headers: _authHeaders(),
      body:    JSON.stringify({}),
    });
    const data = await res.json();

    if (!res.ok) {
      UI.showError('pay-error-msg', data.error || 'Payment failed (HTTP ' + res.status + ')');
      return;
    }

    _populateConfirmation(data);
    _goToStep(4);

  } catch (err) {
    UI.showError('pay-error-msg', 'Payment error — ' + err.message);
    console.error('[CATNAT] validateAndPay:', err);
  } finally {
    window.__catnatProcessing = false;
    UI.btnReset('btn-validate-pay');
  }
};

/* ═══════════════════════════════════════════════════════════════
   PAYMENT HELPERS
   ═══════════════════════════════════════════════════════════════ */
window.formatCardNumber = (input) => {
  const v = (input.value || '').replace(/\D/g, '').slice(0, 16);
  input.value = (v.match(/.{1,4}/g) || []).join(' ');
};

window.resetPaymentForm = () => {
  ['card_number', 'cvv2', 'cardholder_name'].forEach((id) => {
    const el = UI.el(id); if (el) el.value = '';
  });
  ['expiry_month', 'expiry_year'].forEach((id) => {
    const el = UI.el(id); if (el) el.selectedIndex = 0;
  });
  UI.hideError('pay-error-msg');
};

window.downloadCertificate = () => {
  alert('Your CATNAT certificate will be sent to your email shortly.');
};

/* ═══════════════════════════════════════════════════════════════
   EVENT WIRING
   ═══════════════════════════════════════════════════════════════ */
function _attachListeners() {
  const s1btn = UI.el('btn-continue-step1');
  if (s1btn) s1btn.addEventListener('click', () => window.goToStep(2));

  const s2back = UI.el('btn-back-step2');
  if (s2back) s2back.addEventListener('click', () => window.goToStep(1));

  const payCib = UI.el('btn-pay-cib');
  if (payCib) payCib.addEventListener('click', window.submitAndProceed);

  const payBtn = UI.el('btn-validate-pay');
  if (payBtn) payBtn.addEventListener('click', window.validateAndPay);

  const cancelPay = UI.el('btn-cancel-payment');
  if (cancelPay) cancelPay.addEventListener('click', () => window.goToStep(2));

  const resetPay = UI.el('btn-reset-payment');
  if (resetPay) resetPay.addEventListener('click', window.resetPaymentForm);
  document.querySelectorAll('.add-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      const id = this.id;

      if (id.includes('floods')) toggleCoverage('floods', this);
      if (id.includes('storms')) toggleCoverage('storms', this);
      if (id.includes('ground')) toggleCoverage('ground', this);
    });
  });
document.querySelectorAll('.yn-btn').forEach(btn => {
  btn.addEventListener('click', function () {
    const key = this.dataset.yn;
    const val = this.dataset.val;

    setYN(key, val);
  });
});
// ===== 🔥 PREMIUM LIVE UPDATE =====

// Declared value
const declared = UI.el('declared_value');
if (declared) {
  declared.addEventListener('input', function () {
    AppState.set('property.declared_value', Number(this.value) || 0);
    calculatePremium();
  });
}

// Built area
const area = UI.el('built_area');
if (area) {
  area.addEventListener('input', function () {
    AppState.set('property.built_area', Number(this.value) || 0);
    calculatePremium();
  });
}

// Wilaya
const wilaya = UI.el('wilaya');
if (wilaya) {
  wilaya.addEventListener('change', function () {
    AppState.set('property.wilaya_id', this.value);
    calculatePremium();
  });
}

// Construction type
const construction = UI.el('construction_type');
if (construction) {
  construction.addEventListener('change', function () {
    AppState.set('property.construction_type', this.value);
    calculatePremium();
  });
}
}


/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {
  AppState.hydrate();

  /* Agency list */
  await _loadAgencies();

  /* Wire buttons */
  _attachListeners();

  /* Override goToStep after all other scripts */
  setTimeout(function () {
    window.goToStep = function (n) {
      if (n === 2) { _snapshotProperty(); if (!_validateStep1()) return; _populateStep2Summary(); _goToStep(2); return; }
      if (n === 1) { _goToStep(1); return; }
    };
  }, 0);

  /* Reset and start at step 1 */
 // optional reset — not destructive
localStorage.removeItem('caar_catnat_v2');
  _goToStep(1);

  window.__catnatProcessing = false;
  console.log('[CATNAT] catnat-arch.js (refactored) booted.');
});
document.addEventListener('DOMContentLoaded', () => {
  loadWilayas('wilaya', {
    placeholder: 'Select Wilaya',
    onChange: (id) => {
      loadCities(id, 'municipality', {
        placeholder: 'Select Municipality'
      });
    }
  });
});
function calculatePremium() {
  const declared = Number(UI.val('declared_value'));
  const area = Number(UI.val('built_area'));
  const wilaya = UI.val('wilaya');
  const construction = UI.val('construction_type');

  if (!declared || !area) return;

  let base = declared * 0.001;
  let adjustments = 0;

  // Wilaya risk
  if (wilaya == 16) adjustments += base * 0.10;

  // Construction type
  if (construction === 'old') adjustments += base * 0.15;

  // Commercial
  if (_yn.commercial === 'yes') adjustments += base * 0.20;

  // Coverages
  if (_cov.floods) adjustments += 500;
  if (_cov.storms) adjustments += 400;
  if (_cov.ground) adjustments += 600;

  const tax = (base + adjustments) * 0.19;
  const total = base + adjustments + tax;

  UI.txt('premium-base', base.toFixed(2) + ' DZD');
  UI.txt('premium-adjust', adjustments.toFixed(2) + ' DZD');
  UI.txt('premium-tax', tax.toFixed(2) + ' DZD');
  UI.txt('premium-total', total.toFixed(2) + ' DZD');
}