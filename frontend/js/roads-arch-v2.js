'use strict';

/**
 * roads-arch-v2.js — Roadside Assistance subscription flow (refactored)
 *
 * Changes vs previous version:
 *  - Wilaya dropdown loaded dynamically via dropdowns.js
 *  - All fetch() calls carry Authorization header
 *  - Double-submit guard: window.__roadsProcessing
 *  - Plan selection uses real DB ids from /api/plans
 *  - Auth token always sourced from localStorage
 */

const ROADS_API = (typeof window.CAAR_API !== 'undefined')
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
  const KEY = 'caar_roads_v3';

  const DEFAULTS = () => ({
    step:    1,
    plan:    { id: null, name: null, price: 0 },
    vehicle: { plate: '', brand: '', model: '', year: '', wilaya_id: '' },
    driver:  { title: 'Mr', first_name: '', last_name: '', email: '', email_confirm: '', phone: '' },
    quoteId: null,
    token:   null,
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
      ['caar_quote_id', 'caar_auth_token', 'caar_plan_name'].forEach((k) =>
        localStorage.removeItem(k));
    },
  };
})();

/* ═══════════════════════════════════════════════════════════════
   UI HELPERS
   ═══════════════════════════════════════════════════════════════ */
const UI = {
  el:  (id)    => document.getElementById(id),
  val: (id)    => { const e = document.getElementById(id); return e ? e.value.trim() : ''; },
  txt: (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; },
  selText: (id) => {
    const e = document.getElementById(id);
    return (e && e.options && e.selectedIndex >= 0) ? e.options[e.selectedIndex].text : '';
  },
  fmtDZD(n) {
    return Number(n).toLocaleString('fr-DZ', {
      minimumFractionDigits: 2, maximumFractionDigits: 2,
    }) + ' DZD';
  },
  fmtDate(d) {
    return String(d.getDate()).padStart(2, '0') + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  },
  isoToDisplay(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return d + '/' + m + '/' + y;
  },
  showApiError(msg) {
    const box = UI.el('api-error-msg');
    const txt = UI.el('api-error-text');
    if (txt) txt.textContent = msg;
    if (box) box.style.display = 'block';
    console.error('[ROADS] API Error:', msg);
  },
  hideApiError() {
    const box = UI.el('api-error-msg');
    if (box) box.style.display = 'none';
  },
  showPayError(msg) {
    const box = UI.el('pay-error-msg');
    const txt = UI.el('pay-error-text');
    if (txt) txt.textContent = msg;
    if (box) box.style.display = 'block';
    console.error('[ROADS] Pay Error:', msg);
  },
  hidePayError() {
    const box = UI.el('pay-error-msg');
    if (box) box.style.display = 'none';
  },
  btnLoad(id, label) {
    const b = UI.el(id);
    if (!b) return;
    b.disabled = true;
    b._orig = b.innerHTML;
    b.innerHTML = '⏳ ' + (label || 'Processing…');
  },
  btnReset(id) {
    const b = UI.el(id);
    if (!b) return;
    b.disabled = false;
    if (b._orig) b.innerHTML = b._orig;
  },
  getStartDate() { return new Date(); },
  getEndDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d;
  },
};

/* ═══════════════════════════════════════════════════════════════
   PLAN LOADING  (real IDs from /api/plans)
   ═══════════════════════════════════════════════════════════════ */
const PLAN_SLOTS = [
  { cardId: 'plan-basic',   match: 'basic'   },
  { cardId: 'plan-plus',    match: 'plus'    },
  { cardId: 'plan-premium', match: 'premium' },
];

async function _loadPlans() {
  let plans = [];
  try {
    const res = await fetch(ROADS_API + '/api/plans?product_name=Roadside+Assistance');
    const data = await res.json();
    plans = (data.plans || []).filter((p) => Number(p.price) > 0);
    console.log('[ROADS] Plans from API:', plans.map((p) => p.name + '(id=' + p.id + ')').join(', '));
  } catch (err) {
    console.warn('[ROADS] Plan fetch failed, using positional fallback:', err.message);
  }

  PLAN_SLOTS.forEach((slot, idx) => {
    const plan = plans.length > 0
      ? (plans.find((p) => p.name.toLowerCase().startsWith(slot.match)) || plans[idx])
      : null;
    const card = UI.el(slot.cardId);
    if (!card) return;

    if (plan) {
      card.setAttribute('data-plan-id',    plan.id);
      card.setAttribute('data-plan-price', plan.price);
      card.setAttribute('data-plan-name',  plan.name);
      const nameEl  = card.querySelector('.plan-name');
      if (nameEl) nameEl.textContent = plan.name;
      const priceEl = card.querySelector('.plan-price');
      if (priceEl) priceEl.textContent = Number(plan.price).toLocaleString('fr-DZ') + ' DZD';
      if (Array.isArray(plan.features) && plan.features.length) {
        const listEl = card.querySelector('.plan-features');
        if (listEl) listEl.innerHTML = plan.features.map((f) => '<li>' + f + '</li>').join('');
      }
    } else {
      const rawPrice = (card.querySelector('.plan-price') || {}).textContent || '0';
      const nameEl   = card.querySelector('.plan-name');
      card.setAttribute('data-plan-id',    idx + 1);
      card.setAttribute('data-plan-price', rawPrice.replace(/[^\d]/g, ''));
      card.setAttribute('data-plan-name',  nameEl ? nameEl.textContent.trim() : slot.match);
    }

    card.removeAttribute('onclick');
    card.addEventListener('click', () => _selectPlanCard(card));
  });

  /* Restore previous selection or default to Plus */
  const savedId = AppState.get('plan') && AppState.get('plan').id;
  if (savedId) {
    const saved = document.querySelector('[data-plan-id="' + savedId + '"]');
    if (saved) { _selectPlanCard(saved); return; }
  }
  const plus = UI.el('plan-plus');
  if (plus && plus.getAttribute('data-plan-id')) _selectPlanCard(plus);
}

function _selectPlanCard(card) {
  const id    = parseInt(card.getAttribute('data-plan-id'), 10);
  const price = parseFloat(card.getAttribute('data-plan-price'));
  const name  = card.getAttribute('data-plan-name') || '';

  if (!id || isNaN(id) || isNaN(price)) {
    console.warn('[ROADS] _selectPlanCard: invalid attributes on', card.id);
    return;
  }

  AppState.set('plan', { id, name, price });
  console.log('[ROADS] Plan selected:', name, 'id=' + id, 'price=' + price);

  PLAN_SLOTS.forEach((slot) => {
    const c = UI.el(slot.cardId);
    if (!c) return;
    c.classList.remove('selected');
    const r = c.querySelector('input[type="radio"]');
    if (r) r.checked = false;
  });
  card.classList.add('selected');
  const radio = card.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;
  _refreshSummaryBar();
}

function _refreshSummaryBar() {
  const plan = AppState.get('plan');
  UI.txt('sum-plan-name',   plan.id ? plan.name           : '— Select a plan above —');
  UI.txt('sum-annual',      plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
  UI.txt('sum-total-step1', plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
}

/* ═══════════════════════════════════════════════════════════════
   FIELD PERSISTENCE
   ═══════════════════════════════════════════════════════════════ */
const VEHICLE_FIELDS = [
  { id: 'license_plate', key: 'plate'     },
  { id: 'vehicle_brand', key: 'brand'     },
  { id: 'vehicle_model', key: 'model'     },
  { id: 'vehicle_year',  key: 'year'      },
  { id: 'wilaya',        key: 'wilaya_id' },
];

const DRIVER_FIELDS = [
  { id: 'title',         key: 'title'         },
  { id: 'first_name',    key: 'first_name'    },
  { id: 'last_name',     key: 'last_name'     },
  { id: 'email',         key: 'email'         },
  { id: 'confirm_email', key: 'email_confirm' },
  { id: 'mobile_1',      key: 'phone'         },
];

function _snapshotVehicle() {
  const v = {};
  VEHICLE_FIELDS.forEach((f) => { const el = UI.el(f.id); if (el) v[f.key] = el.value; });
  AppState.set('vehicle', v);
}

function _snapshotDriver() {
  const d = {};
  DRIVER_FIELDS.forEach((f) => { const el = UI.el(f.id); if (el) d[f.key] = el.value; });
  AppState.set('driver', d);
}

function _attachFieldListeners() {
  [...VEHICLE_FIELDS, ...DRIVER_FIELDS].forEach((f) => {
    const el = UI.el(f.id);
    if (el) {
      el.addEventListener('input',  () => f.id.startsWith('vehicle') || f.id === 'license_plate' || f.id === 'wilaya' ? _snapshotVehicle() : _snapshotDriver());
      el.addEventListener('change', () => f.id.startsWith('vehicle') || f.id === 'license_plate' || f.id === 'wilaya' ? _snapshotVehicle() : _snapshotDriver());
    }
  });
}

function _restoreFields() {
  const v = AppState.get('vehicle') || {};
  const d = AppState.get('driver')  || {};
  VEHICLE_FIELDS.forEach((f) => { const el = UI.el(f.id); if (el && v[f.key]) el.value = v[f.key]; });
  DRIVER_FIELDS.forEach((f)  => { const el = UI.el(f.id); if (el && d[f.key]) el.value = d[f.key]; });
}

/* ═══════════════════════════════════════════════════════════════
   VALIDATION
   ═══════════════════════════════════════════════════════════════ */
function _validateStep1() {
  _snapshotVehicle();
  const v = AppState.get('vehicle');
  const p = AppState.get('plan');

  if (!v.plate) { UI.showApiError('Please enter your license plate number.'); return false; }
  if (!v.brand) { UI.showApiError('Please select your vehicle brand.');        return false; }
  if (!v.model) { UI.showApiError('Please enter your vehicle model.');         return false; }
  if (!v.year)  { UI.showApiError('Please select the year of manufacture.');   return false; }

  const planId = parseInt(p && p.id, 10);
  if (!planId || isNaN(planId)) {
    UI.showApiError('Please select an assistance plan to continue.');
    return false;
  }

  const terms = UI.el('terms-consent');
  if (!terms || !terms.checked) {
    UI.showApiError('Please accept the general terms and conditions.');
    return false;
  }
  return true;
}

function _validateStep2() {
  _snapshotDriver();
  const d = AppState.get('driver');

  if (!d.last_name || !d.first_name) {
    UI.showApiError('Please enter your full name.'); return false;
  }
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) {
    UI.showApiError('Please enter a valid email address.'); return false;
  }
  if (d.email_confirm && d.email_confirm !== d.email) {
    UI.showApiError('Email addresses do not match.'); return false;
  }
  if (!d.phone) {
    UI.showApiError('Please enter your phone number.'); return false;
  }
  return true;
}

function _validateCard() {
  const card  = (UI.val('card_number') || '').replace(/\s/g, '');
  const cvv   = UI.val('cvv2');
  const month = (UI.el('expiry_month') || {}).value;
  const year  = (UI.el('expiry_year')  || {}).value;
  const name  = UI.val('cardholder_name');

  if (card.length < 16) { UI.showPayError('Please enter a valid 16-digit card number.'); return false; }
  if (cvv.length   < 3) { UI.showPayError('Please enter a valid 3-digit CVV2.');          return false; }
  if (!month || !year)  { UI.showPayError('Please select the card expiry date.');          return false; }
  if (!name)            { UI.showPayError('Please enter the cardholder name.');            return false; }
  return true;
}

/* ═══════════════════════════════════════════════════════════════
   STEP NAVIGATION
   ═══════════════════════════════════════════════════════════════ */
let _currentStep    = 1;
let _countdownTimer = null;

function _goToStep(n) {
  if (n < 1 || n > 4) return;
  const from = document.getElementById('form-step-' + _currentStep);
  const to   = document.getElementById('form-step-' + n);
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

/* ═══════════════════════════════════════════════════════════════
   SUMMARY POPULATION
   ═══════════════════════════════════════════════════════════════ */
function _populateStep2Summary() {
  const s = AppState.get();
  UI.txt('s2-plan',  s.plan.name        || '—');
  UI.txt('s2-brand', s.vehicle.brand    || '—');
  UI.txt('s2-model', s.vehicle.model    || '—');
  UI.txt('s2-year',  s.vehicle.year     || '—');
  UI.txt('s2-plate', s.vehicle.plate    || '—');
  UI.txt('s2-start', UI.fmtDate(UI.getStartDate()));
  UI.txt('s2-end',   UI.fmtDate(UI.getEndDate()));
  UI.txt('s2-total', s.plan.price ? UI.fmtDZD(s.plan.price) : '—');
}

function _populatePaymentPage() {
  const plan = AppState.get('plan');
  UI.txt('pay-amount', UI.fmtDZD(plan.price));
  UI.txt('pay-ref', 'New Contract — Roadside Assistance (' + (plan.name || 'Plus') + ')');
  _startCountdown(300);
}

function _populateConfirmation(apiData) {
  const plan = AppState.get('plan');
  if (apiData) {
    UI.txt('confirm-policy-ref', apiData.policy_reference || '—');
    UI.txt('confirm-dates',
      'Issued: ' + UI.isoToDisplay(apiData.start_date) +
      ' · Valid until: ' + UI.isoToDisplay(apiData.end_date));
    UI.txt('confirm-amount', UI.fmtDZD(apiData.amount_paid));
    UI.txt('confirm-plan', plan.name || '—');
  } else {
    const ref = 'RSA-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') +
      '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    UI.txt('confirm-policy-ref', ref);
    UI.txt('confirm-dates',
      'Issued: ' + UI.fmtDate(UI.getStartDate()) +
      ' · Valid until: ' + UI.fmtDate(UI.getEndDate()));
    UI.txt('confirm-amount', UI.fmtDZD(plan.price));
    UI.txt('confirm-plan', plan.name || '—');
  }
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
 * POST /api/roadside/quote → confirm → payment page
 */
window.submitAndProceed = async function () {
  if (window.__roadsProcessing) return;

  _snapshotVehicle();
  _snapshotDriver();

  const planState = AppState.get('plan');
  const planId    = parseInt(planState && planState.id, 10);
  if (!planId || isNaN(planId)) {
    UI.showApiError('Please select an assistance plan before continuing.');
    return;
  }

  if (!document.getElementById('confirm-info')?.checked) {
    UI.showApiError('Please confirm that all information is correct.');
    return;
  }
  if (!document.getElementById('confirm-terms')?.checked) {
    UI.showApiError('Please accept the general terms and conditions.');
    return;
  }

  UI.hideApiError();

  const s = AppState.get();
  const wilayaEl  = UI.el('wilaya');
  const wilayaTxt = wilayaEl && wilayaEl.options[wilayaEl.selectedIndex]
    ? wilayaEl.options[wilayaEl.selectedIndex].text
    : null;

  const payload = {
    first_name:    s.driver.first_name.trim(),
    last_name:     s.driver.last_name.trim(),
    email:         s.driver.email.trim().toLowerCase(),
    phone:         s.driver.phone ? s.driver.phone.trim() : null,
    license_plate: s.vehicle.plate.trim().toUpperCase(),
    brand:         s.vehicle.brand.trim(),
    model:         s.vehicle.model.trim(),
    year:          parseInt(s.vehicle.year, 10) || 0,
    wilaya:        wilayaTxt || s.vehicle.wilaya_id || null,
    plan_id:       planId,
  };

  console.log('[ROADS] Quote payload:', payload);

  window.__roadsProcessing = true;
  UI.btnLoad('btn-pay-cib', 'Creating quote…');

  try {
    /* 1. Create quote (public — no auth needed here) */
    const quoteRes  = await fetch(ROADS_API + '/api/roadside/quote', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const quoteData = await quoteRes.json();

    if (!quoteRes.ok) {
      UI.showApiError(quoteData.error || 'Quote failed (HTTP ' + quoteRes.status + ')');
      return;
    }

    AppState.set('quoteId', quoteData.quote_id);
    AppState.set('token',   quoteData.token);
   localStorage.setItem('caar_quote_token', quoteData.token);
    localStorage.setItem('caar_quote_id',   String(quoteData.quote_id));

    /* 2. Confirm quote */
    UI.btnLoad('btn-pay-cib', 'Confirming…');

    const confirmRes  = await fetch(
      ROADS_API + '/api/roadside/confirm/' + quoteData.quote_id, {
        method:  'POST',
        headers: _authHeaders(),
      });
    const confirmData = await confirmRes.json();

    if (!confirmRes.ok) {
      UI.showApiError(confirmData.error || 'Confirmation failed (HTTP ' + confirmRes.status + ')');
      return;
    }

    _populatePaymentPage();
    _goToStep(3);

  } catch (err) {
    UI.showApiError('Network error — ' + err.message);
    console.error('[ROADS] submitAndProceed:', err);
  } finally {
    window.__roadsProcessing = false;
    UI.btnReset('btn-pay-cib');
  }
};

/**
 * validateAndPay — Step 3 → Step 4
 * POST /api/roadside/pay/:quoteId
 */
window.validateAndPay = async function () {
  if (window.__roadsProcessing) return;
  if (!_validateCard()) return;

  UI.hidePayError();
  clearInterval(_countdownTimer);

  const { quoteId, token } = AppState.get();
  if (!quoteId || !token) {
    UI.showPayError('Session expired — please go back to Step 1 and start again.');
    return;
  }

  window.__roadsProcessing = true;
  UI.btnLoad('btn-validate-pay', 'Processing payment…');

  try {
    const res  = await fetch(ROADS_API + '/api/roadside/pay/' + quoteId, {
      method:  'POST',
      headers: _authHeaders(),
      body:    JSON.stringify({}),
    });
    const data = await res.json();

    if (!res.ok) {
      UI.showPayError(data.error || 'Payment failed (HTTP ' + res.status + ')');
      return;
    }

   // Only reset roads flow, NOT auth
localStorage.removeItem('caar_roads_v3');
    _populateConfirmation(data);
    _goToStep(4);

  } catch (err) {
    UI.showPayError('Payment error — ' + err.message);
    console.error('[ROADS] validateAndPay:', err);
  } finally {
    window.__roadsProcessing = false;
    UI.btnReset('btn-validate-pay');
  }
};

/* ═══════════════════════════════════════════════════════════════
   GLOBAL OVERRIDES (legacy onclick shims)
   ═══════════════════════════════════════════════════════════════ */
function _applyGlobalOverrides() {
  window.goToStep = function (n) {
    if (n === 2) {
      _snapshotVehicle();
      if (!_validateStep1()) return;
      _populateStep2Summary();
      _goToStep(2);
      return;
    }
    if (n === 1) { _goToStep(1); return; }
  };

  /* Shim for any remaining onclick="selectPlan(...)" attrs */
  window.selectPlan = function (name, price, planId) {
    const numericId = parseInt(planId, 10);
    const card = document.querySelector('[data-plan-id="' + numericId + '"]')
               || document.querySelector('[data-plan-name="' + name + '"]');
    if (card && card.getAttribute('data-plan-id')) {
      _selectPlanCard(card);
    } else {
      AppState.set('plan', { id: numericId || planId, name, price });
      _refreshSummaryBar();
    }
  };

  window.updateSummary = () => { _snapshotVehicle(); _refreshSummaryBar(); };
}

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
  UI.hidePayError();
};

window.downloadCertificate = () => {
  alert('Your certificate will be sent to your email shortly.');
};

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {
  AppState.hydrate();

  /* Dynamic wilaya dropdown */
  await window.loadWilayas('wilaya', {
    placeholder: 'Select Wilaya of Registration',
  });

  /* Restore persisted field values */
  _restoreFields();

  /* Attach field → state listeners */
  _attachFieldListeners();

  /* Load plans from API */
  await _loadPlans();

  /* Apply overrides after all other scripts */
  setTimeout(_applyGlobalOverrides, 0);

  /* Always start clean */
  // Only reset roads flow, NOT auth
localStorage.removeItem('caar_roads_v3');
  _goToStep(1);

  window.__roadsProcessing = false;
  console.log('[ROADS] roads-arch-v2.js (refactored) booted.');
});