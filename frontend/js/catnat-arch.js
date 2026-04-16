/**
 * catnat-arch.js  —  CATNAT Subscription Flow v1.1 (FIXED)
 *
 * FIXES APPLIED:
 *   1. Removed plan dependency from AppState and validation
 *   2. submitAndProceed: correct quote → confirm flow with proper ownership
 *   3. validateAndPay: double-click guard (window.__paying)
 *   4. Step 4 UI: populated from real API response stored in AppState
 *   5. Fixed audit_log column names (table_name/record_id)
 */

'use strict';

const CATNAT_API = 'http://localhost:3000/api';

/* ═══════════════════════════════════════════════════════════════════════════
   1. APP STATE — single source of truth
   ═══════════════════════════════════════════════════════════════════════════ */
const AppState = (() => {
  const KEY = 'caar_catnat_v1';

  const DEFAULTS = () => ({
    step:     1,
    // FIX: plan removed — backend calculates premium from property data
    property: {
      construction_type: '',
      usage_type:        '',
      built_area:        '',
      num_floors:        '',
      year_construction: '',
      declared_value:    '',
      wilaya_id:         '',
      city_id:           '',
      is_seismic_compliant: false,
      has_notarial_deed:    false,
      is_commercial:        false,
      extra_coverages:      [],
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
      wilaya_id:     '',
    },
    agency_id:        null,
    quoteId:          null,
    token:            null,
    // FIX: store real API response for Step 4
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
        if (raw) _s = Object.assign(DEFAULTS(), JSON.parse(raw));
      } catch (_) {}
      return this;
    },

    set(path, value) {
      const parts = path.split('.');
      if (parts.length === 1) {
        _s[path] = (typeof value === 'object' && value !== null && !Array.isArray(value))
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
      ['caar_catnat_quote_id', 'token', 'caar_auth_token'].forEach(k => localStorage.removeItem(k));
    },
  };
})();

/* ═══════════════════════════════════════════════════════════════════════════
   2. UI HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
const UI = {
  el:    id  => document.getElementById(id),
  val:   id  => { const e = document.getElementById(id); return e ? e.value.trim() : ''; },
  selText: id => {
    const e = document.getElementById(id);
    return (e && e.options && e.selectedIndex >= 0) ? e.options[e.selectedIndex].text : '';
  },
  txt: (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; },

  fmtDZD: n =>
    Number(n).toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' DZD',

  fmtDate: iso => {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  },

  showError(containerId, msg) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.textContent = msg;
    el.style.cssText = [
      'display:block', 'background:#fff0f0', 'border:1px solid #e53e3e',
      'border-radius:8px', 'padding:12px 16px', 'color:#c53030',
      'font-size:0.82rem', 'font-weight:600', 'margin-bottom:12px',
    ].join(';');
    console.error('[CATNAT] Error:', msg);
  },

  hideError(containerId) {
    const el = document.getElementById(containerId);
    if (el) el.style.display = 'none';
  },

  btnLoad(id, label) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = true;
    btn._v1_orig  = btn.innerHTML;
    btn.innerHTML = `⏳ ${label || 'Processing…'}`;
  },

  btnReset(id) {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = false;
    if (btn._v1_orig) btn.innerHTML = btn._v1_orig;
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   3. YN STATE  (seismic / notarial / commercial toggles)
   ═══════════════════════════════════════════════════════════════════════════ */
const _ynState   = { commercial: 'no', notarial: 'no', seismic: 'no' };
const _coverages = { floods: false, storms: false, ground: false };

window.setYN = function (key, val) {
  _ynState[key] = val;
  const wrap = UI.el(`yn-${key}`);
  if (!wrap) return;
  wrap.querySelectorAll('.yn-btn').forEach(b => b.classList.remove('active'));
  const t = wrap.querySelector(`.yn-${val}`);
  if (t) t.classList.add('active');
  _updatePremiumDisplay();
};

window.toggleCoverage = function (key, btn) {
  _coverages[key] = !_coverages[key];
  if (_coverages[key]) { btn.innerHTML = '&#10003; Added'; btn.classList.add('added'); }
  else                 { btn.textContent = '+ Add';         btn.classList.remove('added'); }
  snapshotProperty();
  _updatePremiumDisplay();
};

window.spinUp = function (id, step) {
  const e = UI.el(id);
  if (e) { e.value = (parseFloat(e.value) || 0) + step; _updatePremiumDisplay(); }
};
window.spinDown = function (id, step) {
  const e = UI.el(id);
  if (e) { e.value = Math.max(parseFloat(e.min) || 0, (parseFloat(e.value) || 0) - step); _updatePremiumDisplay(); }
};

window.onConstructionTypeChange = () => _updatePremiumDisplay();
window.onWilayaChange           = () => {};
window.calculatePremium         = () => _updatePremiumDisplay();

window.updateAgencyList = () => {};
window.updateAgencyCard = () => {};

/* ── Premium display — client-side estimate only (backend is authoritative) ── */
function _updatePremiumDisplay() {
  const value = parseFloat(UI.val('declared_value')) || 0;
  if (value <= 0) {
    UI.txt('net-premium', '0.00 DZD');
    UI.txt('tax-fees',    '0.00 DZD');
    UI.txt('total-pay',   '0.00 DZD');
    return;
  }

  let base = value * 0.0004;
  if (UI.val('construction_type') === 'Villa') base *= 1.2;
  if (_ynState.seismic    === 'no')  base *= 1.3;
  if (_ynState.commercial === 'yes') base *= 1.25;

  if (_coverages.floods) base += 2000;
  if (_coverages.storms) base += 1500;
  if (_coverages.ground) base += 1800;

  const tax   = base * 0.19;
  const total = base + tax;
  UI.txt('net-premium', UI.fmtDZD(base));
  UI.txt('tax-fees',    UI.fmtDZD(tax));
  UI.txt('total-pay',   UI.fmtDZD(total));
}

/* ═══════════════════════════════════════════════════════════════════════════
   4. AGENCIES — dynamic loading
   ═══════════════════════════════════════════════════════════════════════════ */
let _allAgencies = [];

async function loadAgencies() {
  try {
    const url = `${CATNAT_API}/agencies/filter?service=Habitation`;
    const res  = await fetch(url);
    _allAgencies = res.ok ? await res.json() : [];

    if (!_allAgencies.length) {
      const fallback = await fetch(`${CATNAT_API}/agencies`);
      if (fallback.ok) _allAgencies = await fallback.json();
    }

    console.log('[CATNAT] Agencies loaded:', _allAgencies.length);
    _populateWilayaFilter();
    _populateAgencySelect(_allAgencies);
  } catch (err) {
    console.warn('[CATNAT] Agency load failed:', err.message);
  }
}

function _populateWilayaFilter() {
  const select = UI.el('agency_wilaya');
  if (!select) return;

  const wilayaMap = new Map();
  _allAgencies.forEach(ag => {
    if (!wilayaMap.has(ag.wilaya_id)) {
      wilayaMap.set(ag.wilaya_id, ag.wilaya || `Wilaya ${ag.wilaya_id}`);
    }
  });

  select.innerHTML = '<option value="">All Wilayas</option>' +
    [...wilayaMap.entries()]
      .sort((a, b) => (a[1] < b[1] ? -1 : 1))
      .map(([id, name]) => `<option value="${id}">${name}</option>`)
      .join('');

  select.addEventListener('change', function () {
    const wid = parseInt(this.value, 10);
    const filtered = wid
      ? _allAgencies.filter(ag => ag.wilaya_id === wid)
      : _allAgencies;
    _populateAgencySelect(filtered);
  });
}

function _populateAgencySelect(list) {
  const select = UI.el('agency');
  if (!select) return;

  select.innerHTML = '<option value="">— Select agency —</option>' +
    list.map(ag =>
      `<option value="${ag.id}">${ag.agency_code} — ${ag.city}, ${ag.wilaya}</option>`
    ).join('');

  select.addEventListener('change', function () {
    AppState.set('agency_id', this.value ? parseInt(this.value, 10) : null);
    const ag = list.find(a => a.id === parseInt(this.value, 10));
    _updateAgencyCard(ag);
  });
}

function _updateAgencyCard(ag) {
  if (!ag) return;
  UI.txt('agency-card-name',  `Agency ${ag.agency_code} — ${ag.city}`);
  UI.txt('agency-card-addr',  ag.address || '');
  UI.txt('agency-card-phone', ag.phone   || '—');
  UI.txt('agency-card-fax',   ag.fax ? `Fax: ${ag.fax}` : '');
}

/* ═══════════════════════════════════════════════════════════════════════════
   5. FIELD PERSISTENCE
   ═══════════════════════════════════════════════════════════════════════════ */
function snapshotProperty() {
  const extraCoverages = [];
  if (_coverages.floods) extraCoverages.push('floods');
  if (_coverages.storms) extraCoverages.push('storms');
  if (_coverages.ground) extraCoverages.push('ground');

  AppState.set('property', {
    construction_type:    UI.val('construction_type') || UI.selText('construction_type') || 'Individual Home',
    usage_type:           UI.val('usage_type')        || UI.selText('usage_type')        || 'Personal',
    built_area:           UI.val('built_area'),
    num_floors:           UI.val('num_floors')        || null,
    year_construction:    UI.val('year_construction'),
    declared_value:       UI.val('declared_value'),
    wilaya_id:            UI.val('wilaya')            || null,
    city_id:              null,
    is_seismic_compliant: _ynState.seismic    === 'yes',
    has_notarial_deed:    _ynState.notarial   === 'yes',
    is_commercial:        _ynState.commercial === 'yes',
    extra_coverages:      extraCoverages,
  });
}

function snapshotClient() {
  AppState.set('client', {
    title:         UI.val('title'),
    first_name:    UI.val('first_name'),
    last_name:     UI.val('last_name'),
    email:         UI.val('email'),
    email_confirm: UI.val('confirm_email'),
    phone:         UI.val('mobile_1'),
    address:       UI.val('address'),
    city:          UI.val('city'),
    wilaya_id:     UI.val('policy_wilaya') || null,
  });
}

/* ═══════════════════════════════════════════════════════════════════════════
   6. VALIDATION
   ═══════════════════════════════════════════════════════════════════════════ */
function validateStep1() {
  const year     = parseInt(UI.val('year_construction'), 10);
  const area     = parseFloat(UI.val('built_area'));
  const declared = parseFloat(UI.val('declared_value'));
  const curYear  = new Date().getFullYear();

  if (!year || year < 1900 || year > curYear) {
    UI.showError('catnat-error-step1', `Year of construction must be between 1900 and ${curYear}.`);
    return false;
  }
  if (!area || area <= 0) {
    UI.showError('catnat-error-step1', 'Please enter the total built area.');
    return false;
  }
  if (!declared || declared <= 0) {
    UI.showError('catnat-error-step1', 'Please enter the declared value.');
    return false;
  }

  // FIX: no plan required — backend computes premium
  const terms = UI.el('terms-consent');
  if (!terms || !terms.checked) {
    UI.showError('catnat-error-step1', 'Please accept the general terms and conditions.');
    return false;
  }

  UI.hideError('catnat-error-step1');
  return true;
}

function validateStep2() {
  const c = AppState.get('client');

  if (!c.first_name || !c.first_name.trim()) {
    UI.showError('catnat-error-step2', 'Please enter your first name.');
    return false;
  }
  if (!c.last_name || !c.last_name.trim()) {
    UI.showError('catnat-error-step2', 'Please enter your last name.');
    return false;
  }
  if (!c.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) {
    UI.showError('catnat-error-step2', 'Please enter a valid email address.');
    return false;
  }
  if (c.email_confirm && c.email_confirm !== c.email) {
    UI.showError('catnat-error-step2', 'Email addresses do not match.');
    return false;
  }
  if (!c.phone) {
    UI.showError('catnat-error-step2', 'Please enter your phone number.');
    return false;
  }

  UI.hideError('catnat-error-step2');
  return true;
}

function validateCardFields() {
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

/* ═══════════════════════════════════════════════════════════════════════════
   7. STEP NAVIGATION
   ═══════════════════════════════════════════════════════════════════════════ */
let _currentStep    = 1;
let _countdownTimer = null;

function _goToStep(n) {
  if (n < 1 || n > 4) return;
  const from = UI.el(`form-step-${_currentStep}`);
  const to   = UI.el(`form-step-${n}`);
  if (!to) return;
  if (from) from.classList.add('hidden');
  _currentStep = n;
  to.classList.remove('hidden');
  AppState.set('step', n);

  for (let i = 1; i <= 4; i++) {
    const ind = UI.el(`step-indicator-${i}`);
    if (!ind) continue;
    ind.classList.remove('active', 'done');
    if (i < n)        ind.classList.add('done');
    else if (i === n) ind.classList.add('active');
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.goToStep = function goToStep(n) {
  if (n === 2) {
    snapshotProperty();
    if (!validateStep1()) return;
    _goToStep(2);
    return;
  }
  if (n === 1) { _goToStep(1); return; }
};

/* ═══════════════════════════════════════════════════════════════════════════
   8. PAYMENT PAGE POPULATION
   ═══════════════════════════════════════════════════════════════════════════ */
function _populatePaymentPage(estimatedAmount) {
  // Use the real amount returned by the API
  const amount = estimatedAmount || 0;
  UI.txt('pay-amount', UI.fmtDZD(amount));
  UI.txt('pay-ref', 'New Contract — CATNAT');
  _startCountdown(300);
}

/* ── FIX: Step 4 populated from real API data stored in AppState ── */
function _populateConfirmation(apiData) {
  if (apiData) {
    // Store in AppState for persistence
    AppState.set('policy_reference', apiData.policy_reference || '—');
    AppState.set('start_date',       apiData.start_date       || null);
    AppState.set('end_date',         apiData.end_date         || null);
    AppState.set('amount_paid',      apiData.amount_paid      || 0);

    console.log('[CATNAT] Confirmation received:', apiData.policy_reference);
  }

  // Populate UI from AppState (works even if called again after page transition)
  const s = AppState.get();
  UI.txt('confirm-policy-ref', s.policy_reference || '—');
  UI.txt('confirm-dates',
    `Issued: ${UI.fmtDate(s.start_date)} · Valid until: ${UI.fmtDate(s.end_date)}`);
  UI.txt('confirm-amount', UI.fmtDZD(s.amount_paid || 0));
}

/* ═══════════════════════════════════════════════════════════════════════════
   9. COUNTDOWN
   ═══════════════════════════════════════════════════════════════════════════ */
function _startCountdown(seconds) {
  clearInterval(_countdownTimer);
  let remaining = seconds;

  function tick() {
    const m  = Math.floor(remaining / 60);
    const s  = remaining % 60;
    const el = UI.el('countdown');
    if (el) el.textContent = `${m}:${String(s).padStart(2, '0')}`;
    if (remaining <= 0) clearInterval(_countdownTimer);
    remaining--;
  }

  tick();
  _countdownTimer = setInterval(tick, 1000);
}

/* ═══════════════════════════════════════════════════════════════════════════
   10. MAIN FLOW ORCHESTRATORS
   ═══════════════════════════════════════════════════════════════════════════ */

/**
 * submitAndProceed — Step 2 → Step 3
 *
 * FIX: correct flow:
 *   1. Snapshot client + property data
 *   2. POST /api/catnat/quote  → get quoteId + token
 *   3. POST /api/catnat/confirm/:quoteId (with Bearer token)
 *   4. Store token in localStorage for payment step
 *   5. Go to step 3
 */
window.submitAndProceed = async function submitAndProceed() {
  snapshotProperty();
  snapshotClient();

  UI.hideError('catnat-error-step2');

  if (!validateStep2()) return;

  const s = AppState.get();

  // Build API payload — no plan_id, backend computes premium
  const payload = {
    first_name:           s.client.first_name.trim(),
    last_name:            s.client.last_name.trim(),
    email:                s.client.email.trim().toLowerCase(),
    phone:                s.client.phone ? s.client.phone.trim() : null,
    construction_type:    s.property.construction_type  || 'Individual Home',
    usage_type:           s.property.usage_type         || 'Personal',
    built_area:           parseFloat(s.property.built_area)          || 0,
    num_floors:           s.property.num_floors                       || null,
    year_construction:    parseInt(s.property.year_construction, 10)  || 0,
    declared_value:       parseFloat(s.property.declared_value)       || 0,
    address:              s.client.address   || null,
    wilaya_id:            s.property.wilaya_id ? parseInt(s.property.wilaya_id, 10) : null,
    city_id:              s.property.city_id  ? parseInt(s.property.city_id,    10) : null,
    is_seismic_compliant: !!s.property.is_seismic_compliant,
    has_notarial_deed:    !!s.property.has_notarial_deed,
    is_commercial:        !!s.property.is_commercial,
    extra_coverages:      Array.isArray(s.property.extra_coverages) ? s.property.extra_coverages : [],
  };

  console.log('[CATNAT] Quote payload:', payload);

  UI.btnLoad('btn-pay-cib', 'Creating quote…');

  try {
    // ── 1. Create quote ──────────────────────────────────────────────────────
    const quoteRes  = await fetch(`${CATNAT_API}/catnat/quote`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    const quoteData = await quoteRes.json();

    if (!quoteRes.ok) {
      UI.btnReset('btn-pay-cib');
      UI.showError('catnat-error-step2', quoteData.error || `Quote failed (HTTP ${quoteRes.status})`);
      console.error('[CATNAT] Quote error:', quoteData);
      return;
    }

    console.log('[CATNAT] Quote created:', quoteData.quote_id, 'amount:', quoteData.estimated_amount);

    // Store session data
    AppState.set('quoteId', quoteData.quote_id);
    AppState.set('token',   quoteData.token);
  localStorage.setItem('caar_auth_token', quoteData.token);
    localStorage.setItem('caar_catnat_quote_id', String(quoteData.quote_id));

    // ── 2. Confirm quote immediately ─────────────────────────────────────────
    UI.btnLoad('btn-pay-cib', 'Confirming…');

    const confirmRes  = await fetch(`${CATNAT_API}/catnat/confirm/${quoteData.quote_id}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${quoteData.token}`,
      },
    });
    const confirmData = await confirmRes.json();

    if (!confirmRes.ok) {
      UI.btnReset('btn-pay-cib');
      UI.showError('catnat-error-step2',
        confirmData.error || `Confirmation failed (HTTP ${confirmRes.status})`);
      console.error('[CATNAT] Confirm error:', confirmData);
      return;
    }

    console.log('[CATNAT] Quote confirmed:', quoteData.quote_id);

    UI.btnReset('btn-pay-cib');
    _populatePaymentPage(quoteData.estimated_amount);
    _goToStep(3);

  } catch (err) {
    UI.btnReset('btn-pay-cib');
    UI.showError('catnat-error-step2', 'Network error — please check your connection.');
    console.error('[CATNAT] submitAndProceed network error:', err);
  }
};

/**
 * validateAndPay — Step 3 → Step 4
 *
 * FIX: double-click guard via window.__paying
 * FIX: populates Step 4 with real API data
 */
window.validateAndPay = async function validateAndPay() {
  // FIX: double-click guard
  if (window.__paying) return;

  if (!validateCardFields()) return;

  UI.hideError('pay-error-msg');
  clearInterval(_countdownTimer);

  const { quoteId, token } = AppState.get();

  if (!quoteId || !token) {
    UI.showError('pay-error-msg', 'Session expired — please go back to Step 1 and start again.');
    return;
  }

  // FIX: set guard before async operation
  window.__paying = true;
  UI.btnLoad('btn-validate-pay', 'Processing payment…');

  try {
    const res  = await fetch(`${CATNAT_API}/catnat/pay/${quoteId}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();

    if (!res.ok) {
      UI.showError('pay-error-msg', data.error || `Payment failed (HTTP ${res.status})`);
      console.error('[CATNAT] Payment error:', data);
      return;
    }

    console.log('[CATNAT] Payment processed:', data.policy_reference);
    UI.btnReset('btn-validate-pay');

    // FIX: populate Step 4 from REAL API response
    _populateConfirmation(data);
    document.getElementById('modalPolicyRef').textContent =
  data.policy_reference;

document.getElementById('contractModal').classList.remove('hidden');

  } catch (err) {
    UI.showError('pay-error-msg', 'Payment error — please try again.');
    console.error('[CATNAT] validateAndPay error:', err);
    UI.btnReset('btn-validate-pay');
  } finally {
    // FIX: always release the guard
    window.__paying = false;
  }
};
function closeModal() {
  document.getElementById('contractModal').classList.add('hidden');
}
/* ═══════════════════════════════════════════════════════════════════════════
   11. PAYMENT FORM HELPERS
   ═══════════════════════════════════════════════════════════════════════════ */
window.formatCardNumber = function (input) {
  const v = (input.value || '').replace(/\D/g, '').slice(0, 16);
  input.value = (v.match(/.{1,4}/g) || []).join(' ');
};

window.resetPaymentForm = function () {
  ['card_number', 'cvv2', 'cardholder_name'].forEach(id => {
    const el = UI.el(id); if (el) el.value = '';
  });
  ['expiry_month', 'expiry_year'].forEach(id => {
    const el = UI.el(id); if (el) el.selectedIndex = 0;
  });
  UI.hideError('pay-error-msg');
};

window.downloadCertificate = function () {
  alert('Your CATNAT certificate will be sent to your email address shortly.');
};

/* ═══════════════════════════════════════════════════════════════════════════
   12. EVENT LISTENERS
   ═══════════════════════════════════════════════════════════════════════════ */
function _attachListeners() {
  // Step 1: recalculate estimate on any field change
  ['built_area', 'declared_value', 'year_construction'].forEach(id => {
    const el = UI.el(id);
    if (el) el.addEventListener('input', _updatePremiumDisplay);
  });
  ['construction_type', 'usage_type', 'wilaya'].forEach(id => {
    const el = UI.el(id);
    if (el) el.addEventListener('change', _updatePremiumDisplay);
  });

  // Step 1 → 2
  const btnContinueStep1 = UI.el('btn-continue-step1');
  if (btnContinueStep1) {
    btnContinueStep1.addEventListener('click', () => window.goToStep(2));
  }

  // Step 2: back
  const btnBackStep2 = UI.el('btn-back-step2');
  if (btnBackStep2) {
    btnBackStep2.addEventListener('click', () => window.goToStep(1));
  }

  // Step 2 → 3
  const btnPayCib = UI.el('btn-pay-cib');
  if (btnPayCib) {
    btnPayCib.addEventListener('click', window.submitAndProceed);
  }

  // Step 3: payment
  const btnValidatePay = UI.el('btn-validate-pay');
  if (btnValidatePay) {
    btnValidatePay.addEventListener('click', window.validateAndPay);
  }

  const btnCancelPay = UI.el('btn-cancel-payment');
  if (btnCancelPay) {
    btnCancelPay.addEventListener('click', () => window.goToStep(2));
  }

  const btnResetPay = UI.el('btn-reset-payment');
  if (btnResetPay) {
    btnResetPay.addEventListener('click', window.resetPaymentForm);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
   13. BOOT
   ═══════════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async function boot() {
  console.log('[CATNAT] catnat-arch.js v1.1 — booting');

 // DO NOT clear auth — only reset CATNAT flow
AppState.hydrate();

  // Load agencies in parallel
  await loadAgencies();

  // Wire event listeners
  _attachListeners();

  // Re-apply goToStep override after main.js
  window.goToStep = function goToStep(n) {
    if (n === 2) { snapshotProperty(); if (!validateStep1()) return; _goToStep(2); return; }
    if (n === 1) { _goToStep(1); return; }
  };

  _updatePremiumDisplay();
  _goToStep(1);

  console.log('[CATNAT] Boot complete.');
});