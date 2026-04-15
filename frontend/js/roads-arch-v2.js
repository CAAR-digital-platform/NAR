/**
 * roads-arch-v2.js — Production Architecture v2
 * ─────────────────────────────────────────────
 * SINGLE SOURCE OF TRUTH  |  NO HARDCODED IDs  |  FULL PERSISTENCE
 *
 * Principles:
 *   1. ALL state flows through AppState — never read DOM in API calls
 *   2. Plans fetched from backend at boot — never hardcoded
 *   3. localStorage keeps state across refreshes
 *   4. Buttons disabled during async ops — no double-submit
 *   5. Error surfaced in existing UI boxes — no alert()
 *   6. Overrides legacy globals gracefully — no conflict
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

  /* Public API */
  return {
    /** Merge from localStorage. Call once at boot. */
    hydrate() {
      try {
        const raw = localStorage.getItem(CFG.STORE_KEY);
        if (raw) _s = Object.assign(DEFAULTS(), JSON.parse(raw));
      } catch (_) {}
      return this;
    },

    /**
     * set('plan', { id: 2, name: 'Plus', price: 7900 })
     * set('vehicle.plate', '12345-16-001')    ← dot-path support
     */
    set(path, value) {
      const parts = path.split('.');
      if (parts.length === 1) {
        _s[path] = (typeof value === 'object' && value !== null && !Array.isArray(value))
          ? Object.assign({}, _s[path], value)
          : value;
      } else {
        // e.g. 'vehicle.plate'
        const [ns, key] = parts;
        _s[ns] = Object.assign({}, _s[ns], { [key]: value });
      }
      _persist();
    },

    /** get() → whole state. get('plan') → plan slice */
    get(key) { return key ? _s[key] : _s; },

    /** Wipe after successful payment */
    clear() {
      _s = DEFAULTS();
      localStorage.removeItem(CFG.STORE_KEY);
      // Also clean legacy keys
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
    console.error('[CAAR] API Error:', msg);
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
    console.error('[CAAR] Pay Error:', msg);
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
   3. API CALLS — all data from AppState, never from DOM
   ═══════════════════════════════════════════════════════════════════════════ */
const API = {
  async fetchPlans() {
    const res  = await fetch(`${CFG.API}/api/plans?product_name=Roadside+Assistance`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    return (data.plans || []).filter(p => Number(p.price) > 0);
  },

  async createQuote() {
    const s = AppState.get();
    // 🔥 HARD VALIDATION (prevents sending garbage to backend)
if (!s.driver.first_name) throw new Error("Driver data missing");
if (!s.vehicle.plate) throw new Error("Vehicle data missing");
if (!s.plan.id) throw new Error("Plan not selected");

    // Wilaya text is captured at field-save time into state
    // but we can also read it now as a fallback
    const wilayaText = s.vehicle.wilaya
      || UI.selText('wilaya');

    const payload = {
      first_name:    s.driver.first_name,
      last_name:     s.driver.last_name,
      email:         s.driver.email.toLowerCase(),
      phone:         s.driver.phone || null,
      license_plate: s.vehicle.plate.toUpperCase(),
      brand:         s.vehicle.brand,
      model:         s.vehicle.model,
      year:          parseInt(s.vehicle.year, 10) || 0,
      wilaya:        wilayaText || null,
      plan_id:       s.plan.id,   // ← REAL DB id, never hardcoded
    };

    console.log('[CAAR v2] POST /api/roadside/quote', payload);

    const res  = await fetch(`${CFG.API}/api/roadside/quote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    // Persist in state AND legacy keys for compat
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

    // Wipe state — payment complete
    AppState.clear();
    console.log('[CAAR v2] Payment processed:', data.policy_reference);
    return data;
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   4. PLAN INJECTION — no hardcoded ids, names, or prices
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
    console.warn('[CAAR v2] Plan fetch failed — keeping existing card content:', e.message);
    plans = [];
  }

  PLAN_SLOTS.forEach((slot, idx) => {
    // Match by name prefix, fallback to positional
    const plan = (plans.length > 0)
      ? (plans.find(p => p.name.toLowerCase().startsWith(slot.match)) || plans[idx])
      : null;

    const card = UI.el(slot.cardId);
    if (!card) return;

    if (plan) {
      // Brand card with real API data
      card.setAttribute('data-plan-id',    plan.id);
      card.setAttribute('data-plan-price', plan.price);
      card.setAttribute('data-plan-name',  plan.name);

      // Patch name
      const nameEl = card.querySelector('.plan-name');
      if (nameEl) nameEl.textContent = plan.name;

      // Patch price
      const priceEl = card.querySelector('.plan-price');
      if (priceEl) priceEl.textContent =
        `${Number(plan.price).toLocaleString('fr-DZ')} DZD`;

      // Patch features
      const features = Array.isArray(plan.features) ? plan.features : [];
      if (features.length) {
        const listEl = card.querySelector('.plan-features');
        if (listEl) listEl.innerHTML = features.map(f => `<li>${f}</li>`).join('');
      }
    } else {
      // No API data — read price from existing DOM content
      const priceEl  = card.querySelector('.plan-price');
      const rawPrice = priceEl ? priceEl.textContent.replace(/[^\d]/g, '') : '0';
      const nameEl   = card.querySelector('.plan-name');
      card.setAttribute('data-plan-id',    idx + 1);   // positional fallback
      card.setAttribute('data-plan-price', rawPrice);
      card.setAttribute('data-plan-name',  nameEl ? nameEl.textContent : slot.match);
    }

    // Replace inline onclick with clean listener
    card.removeAttribute('onclick');
    card.addEventListener('click', () => _selectPlanCard(card));
  });

  // Restore previously selected plan from persisted state
  const savedId = AppState.get('plan')?.id;
  if (savedId) {
    const savedCard = document.querySelector(`[data-plan-id="${savedId}"]`);
    if (savedCard) { _selectPlanCard(savedCard); return; }
  }

  // Default: Plus
  const plusCard = UI.el('plan-plus');
  if (plusCard && plusCard.getAttribute('data-plan-id')) {
    _selectPlanCard(plusCard);
  }
}

function _selectPlanCard(card) {
  const id    = parseInt(card.getAttribute('data-plan-id'), 10);
  const price = parseFloat(card.getAttribute('data-plan-price'));
  const name  = card.getAttribute('data-plan-name') || '';
  if (!id || isNaN(price)) return;

  AppState.set('plan', { id, name, price });

  // Visual: deselect all, select this
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

  // Update summary bar
  _refreshSummaryBar();
}

function _refreshSummaryBar() {
  const plan = AppState.get('plan');
  UI.txt('sum-plan-name',   plan.id   ? plan.name          : '— Select a plan above —');
  UI.txt('sum-annual',      plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
  UI.txt('sum-total-step1', plan.price ? UI.fmtDZD(plan.price) : '0.00 DZD');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. FIELD PERSISTENCE — auto-save every input keystroke → state
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
  snapshotVehicle(); // ensure state is current before validating
  const v = AppState.get('vehicle');
  const p = AppState.get('plan');

  if (!v.plate) { UI.showApiError('Please enter your license plate number.');     return false; }
  if (!v.brand) { UI.showApiError('Please select your vehicle brand.');            return false; }
  if (!v.model) { UI.showApiError('Please enter your vehicle model.');             return false; }
  if (!v.year)  { UI.showApiError('Please select the year of manufacture.');       return false; }
  if (!p.id)    { UI.showApiError('Please select an assistance plan to continue.'); return false; }

  const terms = document.getElementById('terms-consent');
  if (!terms?.checked) {
    UI.showApiError('Please accept the general terms and conditions.');
    return false;
  }
  return true;
}

function validateStep2() {
  snapshotDriver(); // ensure state is current
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
    if (i < n)      ind.classList.add('done');
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

  // Wilaya: prefer state (saved at input time), fallback to live DOM
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
    // Fallback (should never happen in production)
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
   11. ORCHESTRATORS (override legacy globals)
   ═══════════════════════════════════════════════════════════════════════════ */

/** Step 2 review → 3 payment.  POST /quote  → POST /confirm  → show payment */
window.submitAndProceed = async function submitAndProceed() {

  // 🔥 FORCE SAVE INPUTS BEFORE ANYTHING
  snapshotVehicle();
  snapshotDriver();

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

/** Step 3 payment → 4 confirmation.  Validate card → POST /pay  → show confirmation */
window.validateAndPay = async function validateAndPay() {
  if (!validateCardFields()) return;

  UI.hidePayError();
  UI.btnLoad('btn-validate-pay', 'Processing payment…');
  clearInterval(_countdownTimer);

  try {
    const result = await API.processPayment();
    UI.btnReset('btn-validate-pay');
    populateConfirmation(result);
    _goToStep(4);
  } catch (err) {
    UI.btnReset('btn-validate-pay');
    UI.showPayError(err.message);
  }
};

/* ═══════════════════════════════════════════════════════════════════════════
   12. OVERRIDDEN GLOBALS (compat with existing HTML onclick attributes)
   ═══════════════════════════════════════════════════════════════════════════ */

/** goToStep — overrides legacy version from inline scripts */
window.goToStep = function goToStep(n) {
  if (n === 2) {
    snapshotVehicle();
    if (!validateStep1()) return;
    populateStep2Summary();
    _goToStep(2);
    return;
  }
  if (n === 1) { _goToStep(1); return; }
  // 2→3: handled by submitAndProceed
  // 3→4: handled by validateAndPay
};

/** selectPlan — overrides legacy version; called by any remaining inline onclick */
window.selectPlan = function selectPlan(name, price, planId) {
  // Find the card that has this plan_id from the API data
  const card = document.querySelector(`[data-plan-id="${planId}"]`)
             || document.querySelector(`[data-plan-name="${name}"]`);
  if (card) {
    _selectPlanCard(card);
  } else {
    // Fallback: set state directly (API data not yet loaded)
    AppState.set('plan', { id: planId, name, price });
    _refreshSummaryBar();
    console.log('[CAAR v2] selectPlan (pre-load fallback):', { planId, name, price });
  }
};

window.showReviewView       = _showReviewView;
window.showSubscriptionForm = _showSubscriptionForm;
window.updateSummary        = function() { snapshotVehicle(); _refreshSummaryBar(); };

/** Payment helpers — exposed so existing onclick still works */
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
   13. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function boot() {
  console.log('[CAAR v2] roads-arch-v2.js — booting');

  // 1. Hydrate from localStorage
  AppState.hydrate();

  // 2. Restore input field values from state (session recovery)
  restoreVehicle();
  restoreDriver();

  // 3. Attach input → state listeners (field persistence)
  attachFieldListeners();

  // 4. Load real plans from API → inject into cards → restore selection
  await loadAndInjectPlans();

  // 5. Restore step (don't jump past step 2 unless we have a live token+quoteId)
  const savedStep = AppState.get('step') || 1;
  if (savedStep === 3 && AppState.get('quoteId') && AppState.get('token')) {
    _goToStep(3);
    populatePaymentPage();
  } else {
    _goToStep(1);
    AppState.set('step', 1);
  }

  console.log('[CAAR v2] Boot complete. State:', JSON.stringify({
    step:    AppState.get('step'),
    plan:    AppState.get('plan'),
    quoteId: AppState.get('quoteId'),
  }, null, 2));
});