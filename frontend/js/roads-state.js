'use strict';

/* ============================================================
   roads-state.js — Single source of truth for roads.html
   Depends on: app-state.js (apiRequest)
============================================================ */

const STATE_KEY = 'caar_roads_state';

const INITIAL_STATE = {
  currentStep: 1,
  planId:      null,
  planData:    null,
  vehicle:     { license_plate: '', brand: '', model: '', year: '', wilaya: '' },
  driver:      { title: 'Mr', first_name: '', last_name: '', email: '', phone: '' },
  quoteId:     null,
  authToken:   null,
};

// ── State API ──────────────────────────────────────────────

function getAppState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    return raw ? { ...INITIAL_STATE, ...JSON.parse(raw) } : { ...INITIAL_STATE };
  } catch {
    return { ...INITIAL_STATE };
  }
}

function setAppState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function updateAppState(partial) {
  setAppState({ ...getAppState(), ...partial });
}

function clearAppState() {
  localStorage.removeItem(STATE_KEY);
}

// ── UI Helpers ─────────────────────────────────────────────

function showEl(id)  { const e = document.getElementById(id); if (e) e.style.display = ''; }
function hideEl(id)  { const e = document.getElementById(id); if (e) e.style.display = 'none'; }
function setText(id, v) { const e = document.getElementById(id); if (e) e.textContent = v; }
function getVal(id)  { const e = document.getElementById(id); return e ? e.value.trim() : ''; }

function showError(fieldId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(fieldId + '-error');
  if (field) field.classList.add('field-error');
  if (err)   { err.textContent = msg; err.style.display = 'flex'; }
}

function clearError(fieldId) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(fieldId + '-error');
  if (field) field.classList.remove('field-error');
  if (err)   err.style.display = 'none';
}

function clearAllErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.classList.remove('field-error'));
  document.querySelectorAll('.inline-error').forEach(el => el.style.display = 'none');
}

function setButtonLoading(btnId, loading, label) {
  const btn = document.getElementById(btnId);
  if (!btn) return;
  btn.disabled = loading;
  if (loading) {
    btn.dataset.orig = btn.innerHTML;
    btn.innerHTML = `<span class="btn-spinner"></span>${label || 'Processing…'}`;
  } else {
    btn.innerHTML = btn.dataset.orig || btn.innerHTML;
  }
}

function showPageError(containerId, msg) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `<div class="api-error-banner">⚠ ${msg}</div>`;
  el.style.display = 'block';
}

function hidePageError(containerId) {
  const el = document.getElementById(containerId);
  if (el) el.style.display = 'none';
}

// ── Step Navigation ────────────────────────────────────────

function goToStep(n) {
  const state = getAppState();
  if (n < 1 || n > 5) return;

  // Validate current step before advancing
  if (n > state.currentStep) {
    if (!validateStep(state.currentStep)) return;
    saveCurrentStepData(state.currentStep);
  }

  document.querySelectorAll('.road-step').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById(`form-step-${n}`);
  if (target) target.classList.remove('hidden');

  updateAppState({ currentStep: n });
  updateStepIndicators(n);

  if (n === 4) renderRecap();
  if (n === 3) restoreDriverFields();
  if (n === 2) restoreVehicleFields();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateStepIndicators(active) {
  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`step-indicator-${i}`);
    if (!el) continue;
    el.classList.remove('active', 'done');
    if (i < active)       el.classList.add('done');
    else if (i === active) el.classList.add('active');
  }
}

// ── Plan Loading ───────────────────────────────────────────

async function loadPlans() {
  const container = document.getElementById('plan-cards-container');
  const errBox    = document.getElementById('plans-error');
  if (!container) return;

  container.innerHTML = `
    <div class="plan-skeleton"></div>
    <div class="plan-skeleton"></div>
    <div class="plan-skeleton"></div>`;
  hidePageError('plans-error');

  let result;
  try {
    result = await apiRequest('/api/plans?product_name=Roadside+Assistance', 'GET');
  } catch {
    showPageError('plans-error', 'Network error — could not load plans. Please refresh.');
    container.innerHTML = '';
    return;
  }

  if (!result.ok || !result.data.plans || !result.data.plans.length) {
    showPageError('plans-error', result.data?.error || 'No plans available. Please contact support.');
    container.innerHTML = '';
    return;
  }

  const plans = result.data.plans;
  container.innerHTML = plans.map(plan => renderPlanCard(plan)).join('');

  container.querySelectorAll('.plan-card').forEach(card => {
    card.addEventListener('click', () => {
      const id    = parseInt(card.dataset.planId, 10);
      const price = parseFloat(card.dataset.price);
      const data  = plans.find(p => p.id === id);
      selectPlan(id, price, data);
    });
  });

  // Restore previously selected plan
  const state = getAppState();
  if (state.planId) {
    const card = container.querySelector(`[data-plan-id="${state.planId}"]`);
    if (card) card.classList.add('selected');
    document.getElementById('btn-step1-continue')?.removeAttribute('disabled');
  }
}

function renderPlanCard(plan) {
  const features = Array.isArray(plan.features) ? plan.features : [];
  const popular  = plan.is_popular
    ? `<span class="plan-popular-badge">⭐ Most Popular</span>` : '';
  const featuresHtml = features
    .map(f => `<li>${f}</li>`)
    .join('');

  return `
    <div class="plan-card" data-plan-id="${plan.id}" data-price="${plan.price}">
      ${popular}
      <span class="plan-badge-selected">✓ Selected</span>
      <div class="plan-name">${plan.name}</div>
      <div class="plan-price">${Number(plan.price).toLocaleString('fr-DZ')} DZD</div>
      <div class="plan-price-sub">per year, taxes included</div>
      <ul class="plan-features">${featuresHtml}</ul>
    </div>`;
}

function selectPlan(planId, price, planData) {
  document.querySelectorAll('.plan-card').forEach(c => c.classList.remove('selected'));
  const card = document.querySelector(`[data-plan-id="${planId}"]`);
  if (card) card.classList.add('selected');

  updateAppState({ planId, planData });

  const continueBtn = document.getElementById('btn-step1-continue');
  if (continueBtn) continueBtn.removeAttribute('disabled');

  updateStep1Summary(price, planData?.name);
}

function updateStep1Summary(price, name) {
  setText('sum-plan-name',    name  || '—');
  setText('sum-annual',       price ? `${Number(price).toLocaleString('fr-DZ')} DZD` : '—');
  setText('sum-total-step1',  price ? `${Number(price).toLocaleString('fr-DZ')} DZD` : '—');
}

// ── Validation ─────────────────────────────────────────────

const VALIDATORS = {
  license_plate: v => /^[\d]{4,6}-\d{2}-\d{3}$/.test(v) || v.length >= 5,
  brand:         v => v.length > 0,
  model:         v => v.length > 0,
  year:          v => /^\d{4}$/.test(v) && parseInt(v) >= 1990 && parseInt(v) <= new Date().getFullYear(),
  wilaya:        v => v.length > 0,
  first_name:    v => v.length >= 2,
  last_name:     v => v.length >= 2,
  email:         v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  phone:         v => /^0[567]\d{8}$/.test(v.replace(/\s/g, '')),
};

const ERROR_MSGS = {
  license_plate: 'Enter a valid license plate (e.g. 12345-16-001)',
  brand:         'Please select a vehicle brand',
  model:         'Please enter the vehicle model',
  year:          'Enter a valid year (1990–present)',
  wilaya:        'Please select a wilaya',
  first_name:    'First name must be at least 2 characters',
  last_name:     'Last name must be at least 2 characters',
  email:         'Enter a valid email address',
  phone:         'Enter a valid Algerian phone number (05/06/07 + 8 digits)',
};

function validateStep(step) {
  clearAllErrors();
  let valid = true;

  if (step === 1) {
    const state = getAppState();
    if (!state.planId) {
      showPageError('plans-error', 'Please select a plan to continue.');
      return false;
    }
    if (!document.getElementById('terms-consent')?.checked) {
      showPageError('plans-error', 'Please accept the general terms and conditions.');
      return false;
    }
    return true;
  }

  if (step === 2) {
    const fields = ['license_plate', 'brand', 'model', 'year', 'wilaya'];
    fields.forEach(field => {
      const val = getVal(field);
      if (!VALIDATORS[field]?.(val)) {
        showError(field, ERROR_MSGS[field]);
        valid = false;
      }
    });
    return valid;
  }

  if (step === 3) {
    const fields = ['first_name', 'last_name', 'email', 'phone'];
    fields.forEach(field => {
      const val = getVal(field);
      if (!VALIDATORS[field]?.(val)) {
        showError(field, ERROR_MSGS[field]);
        valid = false;
      }
    });
    const email  = getVal('email');
    const confEl = document.getElementById('confirm_email');
    if (confEl && email !== confEl.value.trim()) {
      showError('confirm_email', 'Email addresses do not match');
      valid = false;
    }
    return valid;
  }

  return true;
}

// ── State Save / Restore ───────────────────────────────────

function saveCurrentStepData(step) {
  if (step === 2) {
    updateAppState({
      vehicle: {
        license_plate: getVal('license_plate'),
        brand:         getVal('brand'),
        model:         getVal('model'),
        year:          getVal('year'),
        wilaya:        getVal('wilaya'),
      }
    });
  }

  if (step === 3) {
    const titleEl = document.getElementById('title');
    updateAppState({
      driver: {
        title:      titleEl ? titleEl.value : 'Mr',
        first_name: getVal('first_name'),
        last_name:  getVal('last_name'),
        email:      getVal('email').toLowerCase(),
        phone:      getVal('phone').replace(/\s/g, ''),
      }
    });
  }
}

function restoreVehicleFields() {
  const { vehicle } = getAppState();
  if (!vehicle) return;
  Object.keys(vehicle).forEach(key => {
    const el = document.getElementById(key);
    if (el && vehicle[key]) el.value = vehicle[key];
  });
}

function restoreDriverFields() {
  const { driver } = getAppState();
  if (!driver) return;
  Object.keys(driver).forEach(key => {
    const el = document.getElementById(key);
    if (el && driver[key]) el.value = driver[key];
  });
}

// ── Recap ──────────────────────────────────────────────────

function renderRecap() {
  const state = getAppState();
  const { vehicle, driver, planData } = state;

  // Plan
  setText('rv-plan',  planData?.name  || '—');
  setText('rv-price', planData?.price ? `${Number(planData.price).toLocaleString('fr-DZ')} DZD` : '—');

  // Vehicle
  setText('rv-plate',  vehicle?.license_plate || '—');
  setText('rv-brand',  vehicle?.brand         || '—');
  setText('rv-model',  vehicle?.model         || '—');
  setText('rv-year',   vehicle?.year          || '—');
  setText('rv-wilaya', vehicle?.wilaya        || '—');

  // Driver
  const fullName = [driver?.title, driver?.first_name, driver?.last_name].filter(Boolean).join(' ');
  setText('rv-name',  fullName         || '—');
  setText('rv-phone', driver?.phone    || '—');
  setText('rv-email', driver?.email    || '—');

  // Dates
  const startD = new Date();
  const endD   = new Date();
  endD.setFullYear(endD.getFullYear() + 1);
  endD.setDate(endD.getDate() - 1);
  const fmt = d => `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  setText('rv-start', fmt(startD));
  setText('rv-end',   fmt(endD));
  setText('rv-total', planData?.price ? `${Number(planData.price).toLocaleString('fr-DZ')} DZD` : '—');
}

// ── Contract Submission ────────────────────────────────────

async function submitContract() {
  if (!validateStep(3)) return;
  saveCurrentStepData(3);

  const state = getAppState();
  const { vehicle, driver, planId, planData } = state;

  if (!planId) {
    showPageError('recap-error', 'No plan selected. Please go back and select a plan.');
    return;
  }

  hidePageError('recap-error');
  setButtonLoading('btn-recap-continue', true, 'Creating quote…');

  // Step A: Create quote
  const quotePayload = {
    first_name:    driver.first_name,
    last_name:     driver.last_name,
    email:         driver.email,
    phone:         driver.phone || null,
    license_plate: vehicle.license_plate.toUpperCase(),
    brand:         vehicle.brand,
    model:         vehicle.model,
    year:          parseInt(vehicle.year, 10),
    wilaya:        vehicle.wilaya || null,
    plan_id:       planId,
  };

  let quoteResult;
  try {
    quoteResult = await apiRequest('/api/roadside/quote', 'POST', quotePayload);
  } catch {
    showPageError('recap-error', 'Network error — please check your connection.');
    setButtonLoading('btn-recap-continue', false);
    return;
  }

  if (!quoteResult.ok) {
    showPageError('recap-error', quoteResult.data?.error || `Failed to create quote (HTTP ${quoteResult.status})`);
    setButtonLoading('btn-recap-continue', false);
    return;
  }

  const { quote_id, token } = quoteResult.data;
  updateAppState({ quoteId: quote_id, authToken: token });
  // Merge token into localStorage so apiRequest() picks it up
  localStorage.setItem('token', token);

  setButtonLoading('btn-recap-continue', true, 'Confirming quote…');

  // Step B: Confirm quote
  let confirmResult;
  try {
    confirmResult = await apiRequest(`/api/roadside/confirm/${quote_id}`, 'POST');
  } catch {
    showPageError('recap-error', 'Network error during confirmation.');
    setButtonLoading('btn-recap-continue', false);
    return;
  }

  if (!confirmResult.ok) {
    showPageError('recap-error', confirmResult.data?.error || 'Failed to confirm quote.');
    setButtonLoading('btn-recap-continue', false);
    return;
  }

  setButtonLoading('btn-recap-continue', false);
  populatePaymentStep();
  goToStep(5);
}

async function processPayment() {
  const state = getAppState();

  if (!validatePaymentForm()) return;

  hidePageError('payment-error');
  setButtonLoading('btn-validate-pay', true, 'Processing payment…');

  let payResult;
  try {
    payResult = await apiRequest(`/api/roadside/pay/${state.quoteId}`, 'POST', {});
  } catch {
    showPageError('payment-error', 'Network error during payment.');
    setButtonLoading('btn-validate-pay', false);
    return;
  }

  if (!payResult.ok) {
    showPageError('payment-error', payResult.data?.error || 'Payment failed. Please try again.');
    setButtonLoading('btn-validate-pay', false);
    return;
  }

  const result = payResult.data;
  clearAppState();

  // Populate confirmation
  setText('confirm-policy-ref', result.policy_reference || '—');
  const startFmt = result.start_date?.split('-').reverse().join('/') || '—';
  const endFmt   = result.end_date?.split('-').reverse().join('/')   || '—';
  setText('confirm-dates',  `Issued: ${startFmt} · Valid until: ${endFmt}`);
  setText('confirm-amount', result.amount_paid ? `${Number(result.amount_paid).toLocaleString('fr-DZ')} DZD` : '—');
  setText('confirm-plan',   state.planData?.name || '—');

  goToStep(5);
  // Replace step 5 content with confirmation
  const payBox = document.getElementById('form-step-5');
  if (payBox) payBox.classList.add('hidden');
  document.getElementById('form-step-confirm')?.classList.remove('hidden');
}

function validatePaymentForm() {
  clearAllErrors();
  let valid = true;
  const card = document.getElementById('card_number')?.value.replace(/\s/g,'') || '';
  const cvv  = document.getElementById('cvv2')?.value || '';
  const month = document.getElementById('expiry_month')?.value || '';
  const year  = document.getElementById('expiry_year')?.value  || '';
  const name  = document.getElementById('cardholder_name')?.value.trim() || '';

  if (card.length < 16) { showError('card_number', 'Invalid card number'); valid = false; }
  if (cvv.length < 3)   { showError('cvv2', 'Invalid CVV'); valid = false; }
  if (!month)           { showPageError('payment-error', 'Select expiry month'); valid = false; }
  if (!year)            { showPageError('payment-error', 'Select expiry year'); valid = false; }
  if (!name)            { showError('cardholder_name', 'Enter cardholder name'); valid = false; }
  return valid;
}

function populatePaymentStep() {
  const { planData } = getAppState();
  const price = planData?.price || 0;
  setText('pay-amount', `${Number(price).toLocaleString('fr-DZ')} DZD`);
  setText('pay-ref', `New Contract — Roadside Assistance (${planData?.name || ''})`);
  startCountdown(300);
}

// ── Countdown ──────────────────────────────────────────────

let _countdownTimer = null;

function startCountdown(seconds) {
  clearInterval(_countdownTimer);
  let remaining = seconds;
  const tick = () => {
    const el = document.getElementById('countdown');
    if (el) el.textContent = `${Math.floor(remaining/60)}:${String(remaining%60).padStart(2,'0')}`;
    if (remaining <= 0) clearInterval(_countdownTimer);
    remaining--;
  };
  tick();
  _countdownTimer = setInterval(tick, 1000);
}

// ── Live validation ────────────────────────────────────────

function attachLiveValidation() {
  Object.keys(VALIDATORS).forEach(field => {
    const el = document.getElementById(field);
    if (!el) return;
    el.addEventListener('input', () => {
      const val = el.value.trim();
      if (VALIDATORS[field](val)) clearError(field);
      else showError(field, ERROR_MSGS[field]);
    });
  });
}

// ── Init ───────────────────────────────────────────────────

function initRoadsPage() {
  // Restore step
  const state = getAppState();
  updateStepIndicators(state.currentStep);
  document.querySelectorAll('.road-step').forEach(el => el.classList.add('hidden'));
  const activeStep = document.getElementById(`form-step-${state.currentStep}`);
  if (activeStep) activeStep.classList.remove('hidden');

  // Load plans
  loadPlans();

  // Restore field values if returning to mid-flow
  if (state.currentStep === 2) restoreVehicleFields();
  if (state.currentStep === 3) restoreDriverFields();
  if (state.currentStep === 4) renderRecap();

  // Wire navigation buttons
  document.getElementById('btn-step1-continue')?.addEventListener('click', () => goToStep(2));
  document.getElementById('btn-step2-back')?.addEventListener('click',     () => goToStep(1));
  document.getElementById('btn-step2-continue')?.addEventListener('click', () => goToStep(3));
  document.getElementById('btn-step3-back')?.addEventListener('click',     () => goToStep(2));
  document.getElementById('btn-step3-continue')?.addEventListener('click', () => goToStep(4));
  document.getElementById('btn-recap-back')?.addEventListener('click',     () => goToStep(3));
  document.getElementById('btn-recap-continue')?.addEventListener('click', submitContract);
  document.getElementById('btn-pay-back')?.addEventListener('click',       () => goToStep(4));
  document.getElementById('btn-validate-pay')?.addEventListener('click',   processPayment);

  attachLiveValidation();
}

document.addEventListener('DOMContentLoaded', initRoadsPage);