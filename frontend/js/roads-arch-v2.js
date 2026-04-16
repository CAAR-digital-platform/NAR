'use strict';

/**
 * roads-arch-v2.js — Roadside Assistance subscription flow (fixed v2)
 *
 * KEY FIXES:
 *  - AppState is the SINGLE SOURCE OF TRUTH for plan, vehicle, driver
 *  - All event listeners attached in _attachListeners() — no onclick needed
 *  - goToStep defined ONCE, exposed globally
 *  - Plan selection persisted to AppState immediately on click
 *  - Premium bar updated immediately when plan selected
 *  - Step 2 summary reads from AppState
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
    vehicle: { plate: '', brand: '', model: '', year: '', wilaya_id: '', wilaya_text: '' },
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
        if (raw) {
          const parsed = JSON.parse(raw);
          _s = Object.assign(DEFAULTS(), parsed);
          _s.plan    = Object.assign(DEFAULTS().plan,    parsed.plan    || {});
          _s.vehicle = Object.assign(DEFAULTS().vehicle, parsed.vehicle || {});
          _s.driver  = Object.assign(DEFAULTS().driver,  parsed.driver  || {});
        }
      } catch (_) {}
      return this;
    },
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
    merge(ns, obj) {
      _s[ns] = Object.assign({}, _s[ns] || {}, obj);
      _persist();
    },
    get(key) { return key ? _s[key] : _s; },
    clear() {
      _s = DEFAULTS();
      localStorage.removeItem(KEY);
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
    const [y, m, d] = String(iso).split('-');
    return `${d}/${m}/${y}`;
  },
  showError(id, msg) {
    const box = document.getElementById(id);
    if (!box) return;
    box.textContent = msg;
    box.style.cssText = 'display:block;background:#fff0f0;border:1px solid #e53e3e;' +
      'border-radius:8px;padding:12px 16px;color:#c53030;font-size:0.82rem;' +
      'font-weight:600;margin-top:12px;margin-bottom:12px;';
  },
  hideError(id) {
    const box = document.getElementById(id);
    if (box) box.style.display = 'none';
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
  getStartDate() { return new Date(); },
  getEndDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d;
  },
};

/* ═══════════════════════════════════════════════════════════════
   STEP NAVIGATION — defined ONCE
   ═══════════════════════════════════════════════════════════════ */
let _currentStep    = 1;
let _countdownTimer = null;

function goToStep(n) {
  if (n < 1 || n > 4) return;

  // Validation gates
  if (n === 2) {
    _snapshotVehicle();
    if (!_validateStep1()) return;
    _populateStep2Summary();
  }
  if (n === 3) {
    _snapshotDriver();
    if (!_validateStep2()) return;
  }

  _doGoToStep(n);
}

// Internal jump without validation (used post-API)
function _doGoToStep(n, amount) {
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

  if (n === 3) _populatePaymentPage(amount || AppState.get('plan').price || 0);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Expose globally
window.goToStep = goToStep;

/* ═══════════════════════════════════════════════════════════════
   PLAN SELECTION — write to AppState immediately
   ═══════════════════════════════════════════════════════════════ */
const PLAN_SLOTS = [
  { cardId: 'plan-basic',   match: 'basic'   },
  { cardId: 'plan-plus',    match: 'plus'    },
  { cardId: 'plan-premium', match: 'premium' },
];

function _selectPlanCard(card) {
  const id    = parseInt(card.getAttribute('data-plan-id'), 10);
  const price = parseFloat(card.getAttribute('data-plan-price'));
  const name  = card.getAttribute('data-plan-name') || '';

  if (!id || isNaN(id) || isNaN(price) || price <= 0) {
    console.warn('[ROADS] _selectPlanCard: invalid plan attributes on', card.id,
      '— id:', id, 'price:', price);
    return;
  }

  // Write to AppState — single source of truth
  AppState.merge('plan', { id, name, price });
  console.log('[ROADS] Plan selected:', name, 'id=' + id, 'price=' + price);

  // Update visuals
  PLAN_SLOTS.forEach(slot => {
    const c = UI.el(slot.cardId);
    if (!c) return;
    c.classList.remove('selected');
    const r = c.querySelector('input[type="radio"]');
    if (r) r.checked = false;
  });
  card.classList.add('selected');
  const radio = card.querySelector('input[type="radio"]');
  if (radio) radio.checked = true;

  // Update premium bar immediately
  _refreshSummaryBar();
}

function _refreshSummaryBar() {
  const plan = AppState.get('plan');
  UI.txt('sum-plan-name',   plan.id ? plan.name : '— Select a plan above —');
  UI.txt('sum-annual',      plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
  UI.txt('sum-total-step1', plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
}

async function _loadPlans() {
  let plans = [];
  try {
    const res  = await fetch(ROADS_API + '/api/plans?product_name=Roadside+Assistance');
    const data = await res.json();
    plans = (data.plans || []).filter(p => Number(p.price) > 0);
    console.log('[ROADS] Plans from API:', plans.map(p => p.name + '(id=' + p.id + ')').join(', '));
  } catch (err) {
    console.warn('[ROADS] Plan fetch failed, using static fallback:', err.message);
  }

  PLAN_SLOTS.forEach((slot, idx) => {
    const plan = plans.length > 0
      ? (plans.find(p => p.name.toLowerCase().startsWith(slot.match)) || plans[idx])
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
        if (listEl) listEl.innerHTML = plan.features.map(f => `<li>${f}</li>`).join('');
      }
    }
    // If no API plan, data-plan-id / data-plan-price already set in HTML — keep them

    // Attach click listener
    card.addEventListener('click', () => _selectPlanCard(card));
  });

  // Restore saved selection or default to Plus
  const savedPlan = AppState.get('plan');
  if (savedPlan && savedPlan.id) {
    const saved = document.querySelector(`[data-plan-id="${savedPlan.id}"]`);
    if (saved) { _selectPlanCard(saved); return; }
  }
  const plus = UI.el('plan-plus');
  if (plus && plus.getAttribute('data-plan-id')) _selectPlanCard(plus);
}

/* ═══════════════════════════════════════════════════════════════
   FIELD SNAPSHOT — DOM → AppState
   ═══════════════════════════════════════════════════════════════ */
function _snapshotVehicle() {
  const wilayaEl  = UI.el('wilaya');
  const wilayaTxt = wilayaEl && wilayaEl.options[wilayaEl.selectedIndex]
    ? wilayaEl.options[wilayaEl.selectedIndex].text
    : '';

  AppState.merge('vehicle', {
    plate:       UI.val('license_plate'),
    brand:       UI.val('vehicle_brand') || UI.selText('vehicle_brand'),
    model:       UI.val('vehicle_model'),
    year:        UI.val('vehicle_year')  || UI.selText('vehicle_year'),
    wilaya_id:   (UI.el('wilaya') || {}).value || '',
    wilaya_text: wilayaTxt,
  });
}

function _snapshotDriver() {
  AppState.merge('driver', {
    title:         UI.val('title'),
    first_name:    UI.val('first_name'),
    last_name:     UI.val('last_name'),
    email:         UI.val('email'),
    email_confirm: UI.val('confirm_email'),
    phone:         UI.val('mobile_1'),
  });
}

/* ═══════════════════════════════════════════════════════════════
   RESTORE FIELDS from AppState → DOM
   ═══════════════════════════════════════════════════════════════ */
function _restoreFields() {
  const v = AppState.get('vehicle') || {};
  const d = AppState.get('driver')  || {};

  const vehicleMap = [
    { id: 'license_plate', key: 'plate'     },
    { id: 'vehicle_brand', key: 'brand'     },
    { id: 'vehicle_model', key: 'model'     },
    { id: 'vehicle_year',  key: 'year'      },
  ];
  vehicleMap.forEach(({ id, key }) => {
    const el = UI.el(id);
    if (el && v[key]) el.value = v[key];
  });

  const driverMap = [
    { id: 'title',         key: 'title'         },
    { id: 'first_name',    key: 'first_name'    },
    { id: 'last_name',     key: 'last_name'     },
    { id: 'email',         key: 'email'         },
    { id: 'confirm_email', key: 'email_confirm' },
    { id: 'mobile_1',      key: 'phone'         },
  ];
  driverMap.forEach(({ id, key }) => {
    const el = UI.el(id);
    if (el && d[key]) el.value = d[key];
  });
}

/* ═══════════════════════════════════════════════════════════════
   VALIDATION
   ═══════════════════════════════════════════════════════════════ */
function _validateStep1() {
  const v      = AppState.get('vehicle');
  const planId = parseInt(AppState.get('plan').id, 10);
  const errId  = 'api-error-msg';

  if (!v.plate) {
    UI.showError(errId, 'Please enter your license plate number.'); return false;
  }
  if (!v.brand) {
    UI.showError(errId, 'Please select your vehicle brand.'); return false;
  }
  if (!v.model) {
    UI.showError(errId, 'Please enter your vehicle model.'); return false;
  }
  if (!v.year) {
    UI.showError(errId, 'Please select the year of manufacture.'); return false;
  }
  if (!planId || isNaN(planId)) {
    UI.showError(errId, 'Please select an assistance plan to continue.'); return false;
  }
  const terms = UI.el('terms-consent');
  if (!terms || !terms.checked) {
    UI.showError(errId, 'Please accept the general terms and conditions.'); return false;
  }
  UI.hideError(errId);
  return true;
}

function _validateStep2() {
  const errId = 'api-error-msg';
  const fn    = UI.val('first_name');
  const ln    = UI.val('last_name');
  const em    = UI.val('email');
  const emC   = UI.val('confirm_email');
  const ph    = UI.val('mobile_1');

  if (!fn || !ln) {
    UI.showError(errId, 'Please enter your full name.'); return false;
  }
  if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    UI.showError(errId, 'Please enter a valid email address.'); return false;
  }
  if (emC && emC !== em) {
    UI.showError(errId, 'Email addresses do not match.'); return false;
  }
  if (!ph) {
    UI.showError(errId, 'Please enter your phone number.'); return false;
  }

  const confirmInfo  = UI.el('confirm-info');
  const confirmTerms = UI.el('confirm-terms');
  if (!confirmInfo || !confirmInfo.checked) {
    UI.showError(errId, 'Please confirm that all information is correct.'); return false;
  }
  if (!confirmTerms || !confirmTerms.checked) {
    UI.showError(errId, 'Please accept the general terms and conditions.'); return false;
  }

  UI.hideError(errId);
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
   SUMMARY POPULATION — reads from AppState
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

function _populatePaymentPage(amount) {
  const plan = AppState.get('plan');
  UI.txt('pay-amount', UI.fmtDZD(amount || plan.price));
  UI.txt('pay-ref', `New Contract — Roadside Assistance (${plan.name || 'Plus'})`);
  _startCountdown(300);
}

function _populateConfirmation(apiData) {
  const plan = AppState.get('plan');
  if (apiData) {
    UI.txt('confirm-policy-ref', apiData.policy_reference || '—');
    UI.txt('confirm-dates',
      'Issued: ' + UI.isoToDisplay(apiData.start_date) +
      ' · Valid until: ' + UI.isoToDisplay(apiData.end_date));
    UI.txt('confirm-amount', UI.fmtDZD(apiData.amount_paid || 0));
    UI.txt('confirm-plan',   plan.name || '—');
  } else {
    const ref = 'RSA-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-XXXX';
    UI.txt('confirm-policy-ref', ref);
    UI.txt('confirm-dates',
      'Issued: ' + UI.fmtDate(UI.getStartDate()) +
      ' · Valid until: ' + UI.fmtDate(UI.getEndDate()));
    UI.txt('confirm-amount', UI.fmtDZD(plan.price || 0));
    UI.txt('confirm-plan',   plan.name || '—');
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
   MAIN FLOW — API CALLS
   ═══════════════════════════════════════════════════════════════ */
async function _submitAndProceed() {
  if (window.__roadsProcessing) return;

  _snapshotVehicle();
  _snapshotDriver();

  const s      = AppState.get();
  const planId = parseInt(s.plan.id, 10);

  if (!planId || isNaN(planId)) {
    UI.showError('api-error-msg', 'Please select an assistance plan before continuing.');
    return;
  }

  UI.hideError('api-error-msg');
const parsedYear = parseInt(s.vehicle.year, 10);

if (!parsedYear || isNaN(parsedYear)) {
  UI.showError('api-error-msg', 'Please select a valid vehicle year.');
  window.__roadsProcessing = false;
  UI.btnReset('btn-pay-cib');
  return;
}

const payload = {
    first_name:    s.driver.first_name.trim(),
    last_name:     s.driver.last_name.trim(),
    email:         s.driver.email.trim().toLowerCase(),
    phone:         s.driver.phone ? s.driver.phone.trim() : null,
    license_plate: s.vehicle.plate.trim().toUpperCase(),
    brand:         s.vehicle.brand.trim(),
    model:         s.vehicle.model.trim(),
    year:          parsedYear,
    wilaya:        s.vehicle.wilaya_text || s.vehicle.wilaya_id || null,
    plan_id:       planId,
  };

  window.__roadsProcessing = true;
  UI.btnLoad('btn-pay-cib', 'Creating quote…');

  try {
    // 1. Create quote  
     console.log("QUOTE PAYLOAD:", payload);
    const quoteRes  = await fetch(ROADS_API + '/api/roadside/quote', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const quoteData = await quoteRes.json();

    if (!quoteRes.ok) {
      UI.showError('api-error-msg', quoteData.error || `Quote failed (HTTP ${quoteRes.status})`);
      return;
    }

    AppState.set('quoteId', quoteData.quote_id);
    AppState.set('token',   quoteData.token);
    localStorage.setItem('caar_quote_token', quoteData.token);
    localStorage.setItem('caar_quote_id',    String(quoteData.quote_id));

    // 2. Confirm quote
    UI.btnLoad('btn-pay-cib', 'Confirming…');
    const confirmRes  = await fetch(
      ROADS_API + '/api/roadside/confirm/' + quoteData.quote_id, {
        method:  'POST',
        headers: _authHeaders(),
      });
    const confirmData = await confirmRes.json();

    if (!confirmRes.ok) {
      UI.showError('api-error-msg',
        confirmData.error || `Confirmation failed (HTTP ${confirmRes.status})`);
      return;
    }

    _doGoToStep(3, s.plan.price);

  } catch (err) {
    UI.showError('api-error-msg', 'Network error — ' + err.message);
    console.error('[ROADS] submitAndProceed:', err);
  } finally {
    window.__roadsProcessing = false;
    UI.btnReset('btn-pay-cib');
  }
}

async function _validateAndPay() {
  if (window.__roadsProcessing) return;
  if (!_validateCard()) return;

  UI.hideError('pay-error-msg');
  clearInterval(_countdownTimer);

  const s = AppState.get();
  if (!s.quoteId || !s.token) {
    UI.showError('pay-error-msg', 'Session expired — please go back to Step 1 and start again.');
    return;
  }

  window.__roadsProcessing = true;
  UI.btnLoad('btn-validate-pay', 'Processing payment…');

  try {
    const res  = await fetch(ROADS_API + '/api/roadside/pay/' + s.quoteId, {
      method:  'POST',
      headers: _authHeaders(),
      body:    JSON.stringify({}),
    });
    const data = await res.json();

    if (!res.ok) {
      UI.showError('pay-error-msg', data.error || `Payment failed (HTTP ${res.status})`);
      return;
    }

    AppState.clear(); // clear roads flow only, not auth
    _populateConfirmation(data);
    _doGoToStep(4);

  } catch (err) {
    UI.showError('pay-error-msg', 'Payment error — ' + err.message);
    console.error('[ROADS] validateAndPay:', err);
  } finally {
    window.__roadsProcessing = false;
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
   EVENT WIRING — ALL listeners in one place
   ═══════════════════════════════════════════════════════════════ */
function _attachListeners() {

  // ── Step navigation ────────────────────────────────────────
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

  // ── Vehicle field → AppState sync ─────────────────────────
  [
    { id: 'license_plate', key: 'vehicle.plate'  },
    { id: 'vehicle_model', key: 'vehicle.model'  },
  ].forEach(({ id, key }) => {
    const el = UI.el(id);
    if (el) el.addEventListener('input', function () {
      AppState.set(key, this.value.trim());
    });
  });

  [
    { id: 'vehicle_brand', key: 'vehicle.brand' },
    { id: 'vehicle_year',  key: 'vehicle.year'  },
  ].forEach(({ id, key }) => {
    const el = UI.el(id);
    if (el) el.addEventListener('change', function () {
      AppState.set(key, this.value);
    });
  });

  // ── Driver field → AppState sync ──────────────────────────
  [
    { id: 'title',         key: 'driver.title'         },
    { id: 'first_name',    key: 'driver.first_name'    },
    { id: 'last_name',     key: 'driver.last_name'     },
    { id: 'email',         key: 'driver.email'         },
    { id: 'confirm_email', key: 'driver.email_confirm' },
    { id: 'mobile_1',      key: 'driver.phone'         },
  ].forEach(({ id, key }) => {
    const el = UI.el(id);
    if (!el) return;
    const evt = (el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(evt, function () {
      AppState.set(key, this.value);
    });
  });

  // ── Wilaya → AppState ──────────────────────────────────────
  const wilayaEl = UI.el('wilaya');
  if (wilayaEl) {
    wilayaEl.addEventListener('change', function () {
      AppState.set('vehicle.wilaya_id', this.value);
      const txt = this.options[this.selectedIndex]
        ? this.options[this.selectedIndex].text : '';
      AppState.set('vehicle.wilaya_text', txt);
    });
  }

  // ── Download / Print ───────────────────────────────────────
  const dlBtn = UI.el('btn-download-cert');
  if (dlBtn) dlBtn.addEventListener('click', () => {
    alert('Your certificate will be sent to your email shortly.');
  });

  const printBtn = UI.el('btn-print');
  if (printBtn) printBtn.addEventListener('click', () => window.print());
}

/* ═══════════════════════════════════════════════════════════════
   WILAYA DROPDOWN (via dropdown.js)
   ═══════════════════════════════════════════════════════════════ */
async function _loadWilayaDropdown() {
  if (typeof window.loadWilayas !== 'function') return;
  await window.loadWilayas('wilaya', {
    placeholder: 'Select Wilaya of Registration',
    onChange: (id, name) => {
      AppState.set('vehicle.wilaya_id',   id);
      AppState.set('vehicle.wilaya_text', name);
    },
  });
}

/* ═══════════════════════════════════════════════════════════════
   BOOT
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function () {
  // 1. Always start fresh (clear any stale roads state)
  AppState.clear();

  // 2. Load wilaya dropdown
  await _loadWilayaDropdown();

  // 3. Restore persisted fields (no-op since we cleared, but safe)
  _restoreFields();

  // 4. Load plans from API (sets data-plan-id on cards + attaches click listeners)
  await _loadPlans();

  // 5. Attach all other event listeners
  _attachListeners();

  // 6. Ensure step 1 is visible, others hidden
  _currentStep = 1;
  for (let i = 1; i <= 4; i++) {
    const s = UI.el('form-step-' + i);
    if (!s) continue;
    if (i === 1) s.classList.remove('hidden');
    else          s.classList.add('hidden');
  }

  // 7. Update step indicators
  for (let i = 1; i <= 4; i++) {
    const ind = UI.el('step-indicator-' + i);
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i === 1) ind.classList.add('active');
  }

  // 8. Refresh summary bar (shows plan name from any restored state)
  _refreshSummaryBar();

  window.__roadsProcessing = false;
  console.log('[ROADS] roads-arch-v2.js (fixed v2) booted.');
});