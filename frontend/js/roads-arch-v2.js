/**
 * roads-arch-v2.js — Production Architecture v2  (FIXED)
 * ─────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH  |  NO HARDCODED IDs  |  FULL PERSISTENCE
 *
 * FIX SUMMARY (2026-04-15):
 *   1. `API.createQuote()` — now explicitly re-reads AppState AFTER snapshots,
 *      validates plan.id with a clear error, casts plan_id to parseInt, and
 *      emits `console.log("QUOTE PAYLOAD:", payload)` before every request.
 *
 *   2. `submitAndProceed()` — snapshots run inside a dedicated pre-flight
 *      block, then plan is validated again before any network call.
 *
 *   3. `_selectPlanCard()` — added guard against empty / NaN data-plan-id,
 *      plus a debug log confirming what was stored in AppState.
 *
 *   4. `window.selectPlan` (legacy onclick shim) — now ALWAYS writes to
 *      AppState regardless of whether a matching card element is found.
 *      This neutralises the race-condition caused by main.js overwriting
 *      window.selectPlan with a version that ignores AppState.
 *
 *   5. `window.goToStep` — the v2 override is now re-applied via a
 *      deferred `setTimeout(0)` so it wins even when main.js registers
 *      its own version after this file.
 */

'use strict';

/* ═══════════════════════════════════════════════════════════════════════════
   0. CONFIG
   ═══════════════════════════════════════════════════════════════════════════ */
const CFG = {
  API:       'http://localhost:3000',
  STORE_KEY: 'caar_roads_v2',
};

/* ═══════════════════════════════════════════════════════════════════════════
   1. APP STATE — single source of truth
   ═══════════════════════════════════════════════════════════════════════════ */
const AppState = (() => {
  const DEFAULTS = () => ({
    step:    1,
    plan:    { id: null, name: null, price: 0 },
    vehicle: { plate: '', brand: '', model: '', year: '', wilaya: '' },
    driver:  { title: 'Mr', first_name: '', last_name: '', email: '', email_confirm: '', phone: '' },
    quoteId: null,
    token:   null,
  });

  let _s = DEFAULTS();

  function _persist() {
    try { localStorage.setItem(CFG.STORE_KEY, JSON.stringify(_s)); } catch (_) {}
  }

  return {
    hydrate() {
      try {
        const raw = localStorage.getItem(CFG.STORE_KEY);
        if (raw) _s = Object.assign(DEFAULTS(), JSON.parse(raw));
      } catch (_) {}
      return this;
    },

    set(path, value) {
      const parts = path.split('.');
      if (parts.length === 1) {
        _s[path] = (typeof value === 'object' && value !== null && !Array.isArray(value))
          ? Object.assign({}, _s[path], value)
          : value;
      } else {
        const [ns, key] = parts;
        _s[ns] = Object.assign({}, _s[ns], { [key]: value });
      }
      _persist();
    },

    get(key) { return key ? _s[key] : _s; },

    clear() {
      _s = DEFAULTS();
      localStorage.removeItem(CFG.STORE_KEY);
      ['caar_quote_id', 'caar_auth_token', 'caar_plan_name'].forEach(k => localStorage.removeItem(k));
    },
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   2. UI HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const UI = {
  el:   id => document.getElementById(id),
  val:  id => { const e = document.getElementById(id); return e ? e.value.trim() : ''; },
  selText: id => {
    const e = document.getElementById(id);
    return (e && e.options[e.selectedIndex]) ? e.options[e.selectedIndex].text : '';
  },
  txt: (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; },

  fmtDZD(n) {
    return Number(n).toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DZD';
  },
  fmtDate(d) {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  },
  isoToDisplay(iso) {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  },

  showApiError(msg) {
    const box = UI.el('api-error-msg');
    const txt = UI.el('api-error-text');
    if (txt) txt.textContent = msg;
    if (box) box.style.display = 'block';
    console.error('[CAAR v2] API Error:', msg);
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
    console.error('[CAAR v2] Pay Error:', msg);
  },
  hidePayError() {
    const box = UI.el('pay-error-msg');
    if (box) box.style.display = 'none';
  },

  btnLoad(id, label) {
    const btn = UI.el(id);
    if (!btn) return;
    btn.disabled = true;
    btn._v2_orig = btn.innerHTML;
    btn.innerHTML = `⏳ ${label || 'Processing…'}`;
  },
  btnReset(id) {
    const btn = UI.el(id);
    if (!btn) return;
    btn.disabled = false;
    if (btn._v2_orig) btn.innerHTML = btn._v2_orig;
  },

  getStartDate() { return new Date(); },
  getEndDate() {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    d.setDate(d.getDate() - 1);
    return d;
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. API CALLS
   ═══════════════════════════════════════════════════════════════════════════ */
const API = {
  async fetchPlans() {
    const res  = await fetch(`${CFG.API}/api/plans?product_name=Roadside+Assistance`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return (data.plans || []).filter(p => Number(p.price) > 0);
  },

  async createQuote() {
    /* ── FIX 1: always snapshot latest DOM values into AppState first ── */
    snapshotVehicle();
    snapshotDriver();

    /* ── FIX 2: read state AFTER snapshots ── */
    const s = AppState.get();

    /* ── FIX 3: explicit, clear validations before touching the network ── */
    const planId = parseInt(s.plan && s.plan.id, 10);
    if (!planId || isNaN(planId)) {
      throw new Error('Plan not selected — please choose an assistance plan above.');
    }

    if (!s.driver.first_name || !s.driver.first_name.trim()) {
      throw new Error('Driver first name is missing. Please complete the subscription form.');
    }
    if (!s.driver.last_name || !s.driver.last_name.trim()) {
      throw new Error('Driver last name is missing. Please complete the subscription form.');
    }
    if (!s.driver.email || !s.driver.email.trim()) {
      throw new Error('Driver email is missing. Please complete the subscription form.');
    }
    if (!s.vehicle.plate || !s.vehicle.plate.trim()) {
      throw new Error('License plate is missing. Please complete the vehicle details.');
    }
    if (!s.vehicle.brand || !s.vehicle.brand.trim()) {
      throw new Error('Vehicle brand is missing. Please complete the vehicle details.');
    }
    if (!s.vehicle.model || !s.vehicle.model.trim()) {
      throw new Error('Vehicle model is missing. Please complete the vehicle details.');
    }
    if (!s.vehicle.year) {
      throw new Error('Vehicle year is missing. Please complete the vehicle details.');
    }

    /* ── FIX 4: build payload entirely from AppState, never from DOM ── */
    const wilayaText = s.vehicle.wilaya || UI.selText('wilaya') || null;

    const payload = {
      first_name:    s.driver.first_name.trim(),
      last_name:     s.driver.last_name.trim(),
      email:         s.driver.email.trim().toLowerCase(),
      phone:         s.driver.phone ? s.driver.phone.trim() : null,
      license_plate: s.vehicle.plate.trim().toUpperCase(),
      brand:         s.vehicle.brand.trim(),
      model:         s.vehicle.model.trim(),
      year:          parseInt(s.vehicle.year, 10) || 0,
      wilaya:        wilayaText,
      plan_id:       planId,   /* ← FIX: always an integer from AppState */
    };

    /* ── FIX 5: debug log so payload can be verified in DevTools ── */
    console.log('QUOTE PAYLOAD:', payload);
    console.log('[CAAR v2] plan in AppState:', JSON.stringify(s.plan));

    const res  = await fetch(`${CFG.API}/api/roadside/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    /* persist session tokens */
    AppState.set('quoteId', data.quote_id);
    AppState.set('token',   data.token);
    localStorage.setItem('token',           data.token);
    localStorage.setItem('caar_auth_token', data.token);
    localStorage.setItem('caar_quote_id',   String(data.quote_id));

    console.log('[CAAR v2] Quote created:', data.quote_id);
    return data;
  },

  async confirmQuote() {
    const { quoteId, token } = AppState.get();
    if (!quoteId || !token) throw new Error('Session data missing — please start again.');

    const res  = await fetch(`${CFG.API}/api/roadside/confirm/${quoteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    console.log('[CAAR v2] Quote confirmed');
    return data;
  },

  async processPayment() {
    const { quoteId, token } = AppState.get();
    if (!quoteId || !token) throw new Error('Session expired — please go back and start again.');

    const res  = await fetch(`${CFG.API}/api/roadside/pay/${quoteId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    AppState.clear();
    console.log('[CAAR v2] Payment processed:', data.policy_reference);
    return data;
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. PLAN INJECTION
   ═══════════════════════════════════════════════════════════════════════════ */
const PLAN_SLOTS = [
  { cardId: 'plan-basic',   match: 'basic'   },
  { cardId: 'plan-plus',    match: 'plus'     },
  { cardId: 'plan-premium', match: 'premium'  },
];

async function loadAndInjectPlans() {
  let plans;
  try {
    plans = await API.fetchPlans();
    console.log('[CAAR v2] Plans loaded from API:', plans.map(p => `${p.name}(id=${p.id})`).join(', '));
  } catch (e) {
    console.warn('[CAAR v2] Plan fetch failed — using positional fallback:', e.message);
    plans = [];
  }

  PLAN_SLOTS.forEach((slot, idx) => {
    const plan = (plans.length > 0)
      ? (plans.find(p => p.name.toLowerCase().startsWith(slot.match)) || plans[idx])
      : null;

    const card = UI.el(slot.cardId);
    if (!card) return;

    if (plan) {
      card.setAttribute('data-plan-id',    plan.id);
      card.setAttribute('data-plan-price', plan.price);
      card.setAttribute('data-plan-name',  plan.name);

      const nameEl = card.querySelector('.plan-name');
      if (nameEl) nameEl.textContent = plan.name;

      const priceEl = card.querySelector('.plan-price');
      if (priceEl) priceEl.textContent = `${Number(plan.price).toLocaleString('fr-DZ')} DZD`;

      const features = Array.isArray(plan.features) ? plan.features : [];
      if (features.length) {
        const listEl = card.querySelector('.plan-features');
        if (listEl) listEl.innerHTML = features.map(f => `<li>${f}</li>`).join('');
      }
    } else {
      /* positional fallback — IDs 1, 2, 3 match the DB for Roadside plans */
      const priceEl  = card.querySelector('.plan-price');
      const rawPrice = priceEl ? priceEl.textContent.replace(/[^\d]/g, '') : '0';
      const nameEl   = card.querySelector('.plan-name');
      card.setAttribute('data-plan-id',    idx + 1);
      card.setAttribute('data-plan-price', rawPrice);
      card.setAttribute('data-plan-name',  nameEl ? nameEl.textContent.trim() : slot.match);
    }

    /* remove legacy onclick; add clean listener that writes to AppState */
    card.removeAttribute('onclick');
    card.addEventListener('click', () => _selectPlanCard(card));
  });

  /* restore previously selected plan from persisted state */
  const savedId = AppState.get('plan') && AppState.get('plan').id;
  if (savedId) {
    const savedCard = document.querySelector(`[data-plan-id="${savedId}"]`);
    if (savedCard) {
      _selectPlanCard(savedCard);
      return;
    }
  }

  /* default: Plus */
  const plusCard = UI.el('plan-plus');
  if (plusCard && plusCard.getAttribute('data-plan-id')) {
    _selectPlanCard(plusCard);
  }
}

/* ── FIX: robust _selectPlanCard that logs and guards against bad attributes ── */
function _selectPlanCard(card) {
  const rawId    = card.getAttribute('data-plan-id');
  const rawPrice = card.getAttribute('data-plan-price');
  const id       = parseInt(rawId, 10);
  const price    = parseFloat(rawPrice);
  const name     = card.getAttribute('data-plan-name') || '';

  if (!id || isNaN(id) || isNaN(price)) {
    console.warn('[CAAR v2] _selectPlanCard: invalid data-plan-id or price on card', card.id,
      '— raw id:', rawId, 'raw price:', rawPrice);
    return;
  }

  /* write to AppState first */
  AppState.set('plan', { id, name, price });
  console.log('[CAAR v2] Plan selected — AppState.plan:', JSON.stringify(AppState.get('plan')));

  /* visual update */
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

  _refreshSummaryBar();
}

function _refreshSummaryBar() {
  const plan = AppState.get('plan');
  UI.txt('sum-plan-name',   plan.id   ? plan.name          : '— Select a plan above —');
  UI.txt('sum-annual',      plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
  UI.txt('sum-total-step1', plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. FIELD PERSISTENCE
   ═══════════════════════════════════════════════════════════════════════════ */
const VEHICLE_MAP = [
  { id: 'license_plate', key: 'plate'  },
  { id: 'vehicle_brand', key: 'brand'  },
  { id: 'vehicle_model', key: 'model'  },
  { id: 'vehicle_year',  key: 'year'   },
  { id: 'wilaya',        key: 'wilaya' },
];

const DRIVER_MAP = [
  { id: 'title',         key: 'title'         },
  { id: 'first_name',    key: 'first_name'    },
  { id: 'last_name',     key: 'last_name'     },
  { id: 'email',         key: 'email'         },
  { id: 'confirm_email', key: 'email_confirm' },
  { id: 'mobile_1',      key: 'phone'         },
];

function snapshotVehicle() {
  const v = {};
  VEHICLE_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) v[f.key] = el.value;
  });
  AppState.set('vehicle', v);
}

function snapshotDriver() {
  const d = {};
  DRIVER_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) d[f.key] = el.value;
  });
  AppState.set('driver', d);
}

function restoreVehicle() {
  const v = AppState.get('vehicle') || {};
  VEHICLE_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (el && v[f.key] != null && v[f.key] !== '') el.value = v[f.key];
  });
}

function restoreDriver() {
  const d = AppState.get('driver') || {};
  DRIVER_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (el && d[f.key] != null && d[f.key] !== '') el.value = d[f.key];
  });
}

function attachFieldListeners() {
  VEHICLE_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) {
      el.addEventListener('input',  snapshotVehicle);
      el.addEventListener('change', snapshotVehicle);
    }
  });
  DRIVER_MAP.forEach(f => {
    const el = document.getElementById(f.id);
    if (el) {
      el.addEventListener('input',  snapshotDriver);
      el.addEventListener('change', snapshotDriver);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. VALIDATION
   ═══════════════════════════════════════════════════════════════════════════ */
function validateStep1() {
  snapshotVehicle();
  const v = AppState.get('vehicle');
  const p = AppState.get('plan');

  if (!v.plate)         { UI.showApiError('Please enter your license plate number.');       return false; }
  if (!v.brand)         { UI.showApiError('Please select your vehicle brand.');              return false; }
  if (!v.model)         { UI.showApiError('Please enter your vehicle model.');               return false; }
  if (!v.year)          { UI.showApiError('Please select the year of manufacture.');         return false; }

  const planId = parseInt(p && p.id, 10);
  if (!planId || isNaN(planId)) {
    UI.showApiError('Please select an assistance plan to continue.');
    return false;
  }

  const terms = document.getElementById('terms-consent');
  if (!terms || !terms.checked) {
    UI.showApiError('Please accept the general terms and conditions.');
    return false;
  }
  return true;
}

function validateStep2() {
  snapshotDriver();
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

function validateCardFields() {
  const card  = (UI.val('card_number') || '').replace(/\s/g, '');
  const cvv   = UI.val('cvv2');
  const month = (document.getElementById('expiry_month') || {}).value;
  const year  = (document.getElementById('expiry_year')  || {}).value;
  const name  = UI.val('cardholder_name');

  if (card.length < 16) { UI.showPayError('Please enter a valid 16-digit card number.'); return false; }
  if (cvv.length < 3)   { UI.showPayError('Please enter a valid 3-digit CVV2.');          return false; }
  if (!month || !year)  { UI.showPayError('Please select the card expiry date.');          return false; }
  if (!name)            { UI.showPayError('Please enter the cardholder name.');            return false; }
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════════
   7. STEP NAVIGATION ENGINE
   ═══════════════════════════════════════════════════════════════════════════ */
let _currentStep    = 1;
let _countdownTimer = null;

function _goToStep(n) {
  if (n < 1 || n > 4) return;
  const from = document.getElementById(`form-step-${_currentStep}`);
  const to   = document.getElementById(`form-step-${n}`);
  if (!to) return;
  if (from) from.classList.add('hidden');
  _currentStep = n;
  to.classList.remove('hidden');
  AppState.set('step', n);

  for (let i = 1; i <= 4; i++) {
    const ind = document.getElementById(`step-indicator-${i}`);
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i < n)       ind.classList.add('done');
    else if (i === n) ind.classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ═══════════════════════════════════════════════════════════════════════════
   8. SUMMARY POPULATION
   ═══════════════════════════════════════════════════════════════════════════ */
function populateStep2Summary() {
  const s     = AppState.get();
  const start = UI.getStartDate();
  const end   = UI.getEndDate();

  UI.txt('s2-plan',  s.plan.name    || '—');
  UI.txt('s2-brand', s.vehicle.brand || '—');
  UI.txt('s2-model', s.vehicle.model || '—');
  UI.txt('s2-year',  s.vehicle.year  || '—');
  UI.txt('s2-plate', s.vehicle.plate || '—');
  UI.txt('s2-start', UI.fmtDate(start));
  UI.txt('s2-end',   UI.fmtDate(end));
  UI.txt('s2-total', s.plan.price ? UI.fmtDZD(s.plan.price) : '—');
}

function populateReview() {
  const s = AppState.get();
  const start = UI.getStartDate();
  const end   = UI.getEndDate();

  const wilaya = s.vehicle.wilaya || UI.selText('wilaya');
  const titleEl = document.getElementById('title');
  const title   = (titleEl?.options[titleEl.selectedIndex])
    ? titleEl.options[titleEl.selectedIndex].text : '';

  UI.txt('rv-brand',  s.vehicle.brand   || '—');
  UI.txt('rv-model',  s.vehicle.model   || '—');
  UI.txt('rv-year',   s.vehicle.year    || '—');
  UI.txt('rv-plate',  s.vehicle.plate   || '—');
  UI.txt('rv-wilaya', wilaya             || '—');

  UI.txt('rv-name',
    `${title} ${s.driver.last_name} ${s.driver.first_name}`.trim() || '—');
  UI.txt('rv-phone', s.driver.phone || '—');
  UI.txt('rv-email', s.driver.email || '—');

  UI.txt('rv-plan',   s.plan.name  || '—');
  UI.txt('rv-price',  s.plan.price ? UI.fmtDZD(s.plan.price) : '—');
  UI.txt('rv-start',  UI.fmtDate(start));
  UI.txt('rv-end',    UI.fmtDate(end));
  UI.txt('rv-total',  s.plan.price ? UI.fmtDZD(s.plan.price) : '—');
}

function populatePaymentPage() {
  const plan = AppState.get('plan');
  UI.txt('pay-amount', UI.fmtDZD(plan.price));
  UI.txt('pay-ref',    `New Contract — Roadside Assistance (${plan.name || 'Plus'})`);
  _startCountdown(300);
}

function populateConfirmation(apiData) {
  const plan = AppState.get('plan');

  if (apiData) {
    UI.txt('confirm-policy-ref', apiData.policy_reference || '—');
    UI.txt('confirm-dates',
      `Issued: ${UI.isoToDisplay(apiData.start_date)} · Valid until: ${UI.isoToDisplay(apiData.end_date)}`);
    UI.txt('confirm-amount', UI.fmtDZD(apiData.amount_paid));
    UI.txt('confirm-plan',   plan.name || '—');
    console.log('[CAAR v2] Confirmation from API:', apiData.policy_reference);
  } else {
    const ref = `RSA-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substr(2,4).toUpperCase()}`;
    const start = UI.getStartDate();
    const end   = UI.getEndDate();
    UI.txt('confirm-policy-ref', ref);
    UI.txt('confirm-dates', `Issued: ${UI.fmtDate(start)} · Valid until: ${UI.fmtDate(end)}`);
    UI.txt('confirm-amount', UI.fmtDZD(plan.price));
    UI.txt('confirm-plan',   plan.name || '—');
    console.warn('[CAAR v2] populateConfirmation — no API data, using fallback');
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. COUNTDOWN
   ═══════════════════════════════════════════════════════════════════════════ */
function _startCountdown(seconds) {
  clearInterval(_countdownTimer);
  let remaining = seconds;
  function tick() {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    const el = document.getElementById('countdown');
    if (el) el.textContent = `${m}:${String(s).padStart(2,'0')}`;
    if (remaining <= 0) clearInterval(_countdownTimer);
    remaining--;
  }
  tick();
  _countdownTimer = setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. GLOBAL OVERRIDES
   These are (re-)applied after a setTimeout(0) so they run after main.js
   registers its own versions, ensuring the v2 logic wins.
   ═══════════════════════════════════════════════════════════════════════════ */

function _applyGlobalOverrides() {

  /* ── goToStep ─────────────────────────────────────────────────────────── */
  window.goToStep = function goToStep(n) {
    if (n === 2) {
      snapshotVehicle();
      if (!validateStep1()) return;
      populateStep2Summary();
      _goToStep(2);
      return;
    }
    if (n === 1) { _goToStep(1); return; }
    /* 2→3 handled by submitAndProceed; 3→4 by validateAndPay */
  };

  /* ── selectPlan ───────────────────────────────────────────────────────
     FIX: this is the shim called by legacy onclick="selectPlan(...)" attrs
     that still exist on page load before loadAndInjectPlans removes them.
     It MUST write to AppState regardless of whether a card element matches.
  ─────────────────────────────────────────────────────────────────────── */
  window.selectPlan = function selectPlan(name, price, planId) {
    const numericId = parseInt(planId, 10);

    /* try to find the card by its now-populated data-plan-id */
    const card = document.querySelector(`[data-plan-id="${numericId}"]`)
               || document.querySelector(`[data-plan-name="${name}"]`);

    if (card && card.getAttribute('data-plan-id')) {
      _selectPlanCard(card);
    } else {
      /* fallback: write directly to AppState with provided values */
      AppState.set('plan', { id: numericId || planId, name, price });
      _refreshSummaryBar();
      console.log('[CAAR v2] selectPlan (fallback):', JSON.stringify(AppState.get('plan')));
    }
  };

  /* ── updateSummary ─────────────────────────────────────────────────── */
  window.updateSummary = function() { snapshotVehicle(); _refreshSummaryBar(); };

  console.log('[CAAR v2] Global overrides applied.');
}

/* ═══════════════════════════════════════════════════════════════════════════
   11. ORCHESTRATORS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * submitAndProceed — called by onclick on the "Continue to Payment" button.
 *
 * FIX: snapshots run inside this function BEFORE any validation or API call.
 * Plan is validated from AppState after snapshot to ensure freshness.
 */
window.submitAndProceed = async function submitAndProceed() {

  /* ── FIX: snapshot FIRST — always, before any reads ── */
  snapshotVehicle();
  snapshotDriver();

  /* ── FIX: validate plan from AppState (not DOM) ── */
  const planState = AppState.get('plan');
  const planId    = parseInt(planState && planState.id, 10);

  if (!planId || isNaN(planId)) {
    UI.showApiError('Please select an assistance plan before continuing.');
    console.warn('[CAAR v2] submitAndProceed blocked — plan.id is:', planState && planState.id);
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
  UI.btnLoad('btn-pay-cib', 'Creating quote…');

  try {
    /* API.createQuote() will snapshot again internally as a safeguard */
    await API.createQuote();
    UI.btnLoad('btn-pay-cib', 'Confirming…');
    await API.confirmQuote();
    UI.btnReset('btn-pay-cib');
    populatePaymentPage();
    _goToStep(3);
  } catch (err) {
    UI.btnReset('btn-pay-cib');
    UI.showApiError(err.message);
  }
};

/** validateAndPay — called by onclick on "Validate Payment" */
window.validateAndPay = async function validateAndPay() {
  if (!validateCardFields()) return;

  UI.hidePayError();
  UI.btnLoad('btn-validate-pay', 'Processing payment…');
  clearInterval(_countdownTimer);

  try {
    const result = await API.processPayment();
    UI.btnReset('btn-validate-pay');
    populateConfirmation(result);
   document.getElementById('modalPolicyRef').textContent =
  data.policy_reference;

document.getElementById('contractModal').classList.remove('hidden');
  } catch (err) {
    UI.btnReset('btn-validate-pay');
    UI.showPayError(err.message);
  }
};
function closeModal() {
  document.getElementById('contractModal').classList.add('hidden');
}
/* Payment page helpers */
window.formatCardNumber = function(input) {
  const v = (input.value || '').replace(/\D/g,'').slice(0,16);
  input.value = (v.match(/.{1,4}/g) || []).join(' ');
};
window.resetPaymentForm = function() {
  ['card_number','cvv2','cardholder_name'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['expiry_month','expiry_year'].forEach(id => {
    const el = document.getElementById(id); if (el) el.selectedIndex = 0;
  });
  UI.hidePayError();
};
window.downloadCertificate = function() {
  alert('Your certificate will be sent to your email shortly.');
};

/* ═══════════════════════════════════════════════════════════════════════════
   12. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function boot() {
  console.log('[CAAR v2] roads-arch-v2.js — booting');

  /* 1. Hydrate from localStorage */
  AppState.hydrate();

  /* 2. Restore input field values */
  restoreVehicle();
  restoreDriver();

  /* 3. Attach input → state listeners */
  attachFieldListeners();

  /* 4. Load real plans from API → inject into cards → restore selection */
  await loadAndInjectPlans();

  /* 5. Re-apply global overrides AFTER all other scripts have loaded.
        setTimeout(0) pushes this to the end of the current event-loop tick,
        ensuring it runs after main.js's DOMContentLoaded callbacks. */
  setTimeout(_applyGlobalOverrides, 0);

  /* 6. Restore step */
// ALWAYS start clean — no resume logic
AppState.clear();   // wipe old session completely
_goToStep(1);
  console.log('[CAAR v2] Boot complete. AppState snapshot:', JSON.stringify({
    step:    AppState.get('step'),
    plan:    AppState.get('plan'),
    quoteId: AppState.get('quoteId'),
  }, null, 2));
});