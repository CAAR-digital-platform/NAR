/* ============================================================
   CAAR — dashboard.js  (v4 — auth-guarded, real API data)
   ============================================================ */

'use strict';

/* ── FIX 2: STRICT AUTH GUARD — runs immediately, before anything else ── */
const _authUser  = JSON.parse(localStorage.getItem('user')  || 'null');
const _authToken = localStorage.getItem('token');

if (!_authUser || !_authToken) {
  window.location.href = 'login.html';
}
if (_authUser && _authUser.role !== 'client') {
  window.location.href = 'index.html';
}

/* ── Verify state module is loaded ── */
if (typeof window.apiRequest === 'undefined') {
  console.error('[CAAR] dashboard.js — app-state.js not loaded!');
}

/* ── Global state ── */
var ALL_CLAIMS    = [];
var ALL_CONTRACTS = [];

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  renderUserIdentity();
  loadDashboard();
});

/* ============================================================
   FIX 3 + 6: REAL DATA — loadDashboard
   ============================================================ */
async function loadDashboard() {
  try {
    const res = await fetch('/api/claims/my', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    /* FIX 4: log raw text if parsing fails */
    if (!res.ok) {
      const text = await res.text();
      console.log('[CAAR] /api/claims/my raw response:', text);
      return;
    }

    const data = await res.json();
    const claims = data.claims || data || [];

    ALL_CLAIMS = claims;

    /* FIX 6: only real values, never hardcoded */
    const totalEl  = document.querySelector('.summary-card--orange .sc-value');
    const activeEl = document.querySelector('.summary-card--amber  .sc-value');

    if (totalEl)  totalEl.textContent  = claims.length;
    if (activeEl) activeEl.textContent = claims.filter(
      c => !['closed', 'rejected'].includes(c.status)
    ).length;

    /* Update sidebar badge */
    const badge = document.querySelector('[data-section="claims"] .dash-nav-item__badge');
    const open  = claims.filter(c => !['closed', 'rejected'].includes(c.status)).length;
    if (badge) badge.textContent = open || '';

  } catch (err) {
    console.error('[CAAR] Dashboard error:', err);
  }

  /* Load contracts count separately */
  try {
    const res2 = await fetch('/api/contracts/my', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (!res2.ok) {
      const text = await res2.text();
      console.log('[CAAR] /api/contracts/my raw response:', text);
      return;
    }

    const data2 = await res2.json();
    const contracts = data2.contracts || [];
    ALL_CONTRACTS = contracts;

    const contractEl = document.querySelector('.summary-card--blue .sc-value');
    if (contractEl) contractEl.textContent = contracts.length;

  } catch (err) {
    console.error('[CAAR] Contracts load error:', err);
  }

  /* Load payments count */
  try {
    const statsRes = await fetch('/api/dashboard/stats', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });

    if (statsRes.ok) {
      const stats = await statsRes.json();
      const payEl = document.querySelector('.summary-card--green .sc-value');
      if (payEl && stats.total_payments != null) payEl.textContent = stats.total_payments;
    }
  } catch (err) {
    console.error('[CAAR] Stats error:', err);
  }
}

/* ============================================================
   USER IDENTITY
   ============================================================ */
function renderUserIdentity() {
  const user = _authUser;
  if (!user) return;

  const name = user.first_name
    ? (user.first_name + ' ' + (user.last_name || '')).trim()
    : (user.email || 'Client');

  const initials = name.trim().split(/\s+/)
    .map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'CL';

  safeSetText('.dash-sidebar__user-name', name);
  safeSetText('.dash-sidebar__user-role', user.role || 'client');
  const sideAvatar = document.querySelector('.dash-sidebar__avatar');
  if (sideAvatar) sideAvatar.textContent = initials;

  safeSetText('.dash-topbar__user-name', name.split(' ')[0]);
  const topAvatar = document.querySelector('.dash-topbar__user-avatar');
  if (topAvatar) topAvatar.textContent = initials;

  safeSetText('.dash-content__header-title',
    'Welcome back, ' + (user.first_name || 'there') + ' 👋');

  safeSetValue('pf-first', user.first_name || '');
  safeSetValue('pf-last',  user.last_name  || '');
  safeSetValue('pf-email', user.email      || '');
  safeSetValue('pf-phone', user.phone      || '');

  const pac = document.querySelector('.pac-circle');
  if (pac) pac.textContent = initials;
  const pacName = document.querySelector('.pac-name');
  if (pacName) pacName.textContent = name;
}

function safeSetText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function safeSetValue(id, value) {
  const el = document.getElementById(id);
  if (el && !el.value) el.value = value;
}

/* ============================================================
   SPA NAVIGATION
   ============================================================ */
var SECTION_CONFIG = {
  dashboard: { title: 'Dashboard',       icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
  claims:    { title: 'My Claims',        icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
  roadside:  { title: 'Request Roadside', icon: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>' },
  messages:  { title: 'Messages',         icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
  contracts: { title: 'My Contracts',     icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
  profile:   { title: 'Profile',          icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
};

window.switchSection = function (key, _el) {
  document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.dash-nav-item').forEach(i => i.classList.remove('active'));

  const target = document.getElementById(key + '-section');
  if (target) target.classList.add('active');

  const navItem = document.querySelector('[data-section="' + key + '"]');
  if (navItem) navItem.classList.add('active');

  const cfg = SECTION_CONFIG[key] || SECTION_CONFIG.dashboard;
  safeSetText('#topbarTitle', cfg.title);
  safeSetText('#topbarBreadcrumb', cfg.title);
  const iconEl = document.getElementById('topbarIcon');
  if (iconEl) iconEl.innerHTML =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"'
    + ' stroke-linecap="round" stroke-linejoin="round">' + cfg.icon + '</svg>';

  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (key === 'claims')    loadClaims();
  if (key === 'contracts') loadContractsSection();
};

window.openSidebar = function () {
  document.getElementById('dashSidebar').classList.add('open');
  document.getElementById('dashSidebarOverlay').classList.add('show');
  document.body.style.overflow = 'hidden';
};

window.closeSidebar = function () {
  document.getElementById('dashSidebar').classList.remove('open');
  document.getElementById('dashSidebarOverlay').classList.remove('show');
  document.body.style.overflow = '';
};

/* ============================================================
   CONTRACTS
   ============================================================ */
async function loadContractsSection() {
  const contracts = await loadContracts('contracts-cards-grid');
  ALL_CONTRACTS = contracts;
  window.__openClaimForContract = function (contractId, policyRef) {
    openNewClaimModal(contractId, policyRef);
  };
}

/* ============================================================
   CLAIMS
   ============================================================ */
var STATUS_CONFIG = {
  pending:         { cls: 'status-badge--pending',         label: 'Pending' },
  under_review:    { cls: 'status-badge--under-review',    label: 'Under Review' },
  expert_assigned: { cls: 'status-badge--expert-assigned', label: 'Expert Assigned' },
  reported:        { cls: 'status-badge--approved',        label: 'Reported' },
  closed:          { cls: 'status-badge--closed',          label: 'Closed' },
  rejected:        { cls: 'status-badge--rejected',        label: 'Rejected' },
};

async function loadClaims() {
  const tbody   = document.getElementById('claimsTableBody');
  const emptyEl = document.getElementById('claimsEmpty');
  const countEl = document.getElementById('claimsCountNum');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#999;font-size:.82rem;">'
    + '<div style="width:22px;height:22px;border:2px solid #f0ece6;border-top-color:#E8761E;'
    + 'border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px;"></div>'
    + 'Loading your claims…</td></tr>';

  let result;
  try {
    result = await apiRequest('/api/claims/my');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#e53e3e;">'
      + '⚠ Network error. Please refresh.</td></tr>';
    return;
  }

  if (result.status === 404) { ALL_CLAIMS = []; renderClaimsTable([]); return; }
  if (!result.ok) {
    console.log('[CAAR] Claims raw:', result.data);
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#e53e3e;">'
      + '⚠ Unable to load claims (HTTP ' + result.status + ').</td></tr>';
    return;
  }

  ALL_CLAIMS = result.data.claims || [];
  renderClaimsTable(ALL_CLAIMS);

  const badge = document.querySelector('[data-section="claims"] .dash-nav-item__badge');
  const open  = ALL_CLAIMS.filter(c => !['closed', 'rejected'].includes(c.status)).length;
  if (badge) badge.textContent = open || '';
}

function renderClaimsTable(claims) {
  const tbody   = document.getElementById('claimsTableBody');
  const emptyEl = document.getElementById('claimsEmpty');
  const countEl = document.getElementById('claimsCountNum');

  if (countEl) countEl.textContent = claims.length;

  if (!claims.length) {
    if (tbody)   tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = claims.map(c => {
    const sc   = STATUS_CONFIG[c.status] || { cls: 'status-badge--pending', label: c.status };
    const date = c.claim_date ? new Date(c.claim_date).toLocaleDateString('en-GB') : '';
    return '<tr>'
      + '<td><span class="claim-id-cell">#' + c.claim_id + '</span></td>'
      + '<td>' + date + '</td>'
      + '<td><span class="type-chip">Contract #' + c.contract_id + '</span></td>'
      + '<td><span class="status-badge ' + sc.cls + '">' + sc.label + '</span></td>'
      + '<td><button class="btn-claim-view" onclick="openClaimPanel(' + c.claim_id + ')">'
      + '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>'
      + '<circle cx="12" cy="12" r="3"/></svg>View</button></td>'
      + '</tr>';
  }).join('');
}

window.filterClaims = function (status) {
  const filtered = status === 'all'
    ? ALL_CLAIMS
    : ALL_CLAIMS.filter(c => c.status === status);
  renderClaimsTable(filtered);
};

/* ============================================================
   CLAIM DETAIL PANEL
   ============================================================ */
window.openClaimPanel = function (claimId) {
  const claim = ALL_CLAIMS.find(c =>
    c.claim_id === claimId || c.claim_id === String(claimId));
  if (!claim) return;

  document.getElementById('cdpTitle').textContent    = 'Claim #' + claim.claim_id;
  document.getElementById('cdpSubtitle').textContent =
    'Contract #' + claim.contract_id + ' · ' + (STATUS_CONFIG[claim.status] || {}).label;

  const sc    = STATUS_CONFIG[claim.status] || { cls: 'status-badge--pending', label: claim.status };
  const STEPS = ['pending', 'under_review', 'expert_assigned', 'reported', 'closed'];
  const curIdx = STEPS.indexOf(claim.status);

  const timelineHTML = STEPS.map((step, i) => {
    const dotCls = i < curIdx ? 'cdp-timeline-dot--done'
      : i === curIdx ? 'cdp-timeline-dot--current' : 'cdp-timeline-dot--pending';
    const label = (STATUS_CONFIG[step] || {}).label || step;
    return '<div class="cdp-timeline-item"><div class="cdp-timeline-dot ' + dotCls + '">'
      + (i < curIdx ? '✓' : (i + 1)) + '</div>'
      + '<div class="cdp-timeline-content"><div class="cdp-timeline-event">' + label + '</div>'
      + (i === curIdx ? '<div class="cdp-timeline-date">Current status</div>' : '')
      + '</div></div>';
  }).join('');

  document.getElementById('cdpBody').innerHTML =
    '<div class="cdp-section"><div class="cdp-section-title">Claim Details</div>'
    + '<div class="cdp-info-grid">'
    + '<div class="cdp-info-item"><div class="cdp-info-label">Status</div>'
    + '<div class="cdp-info-value"><span class="status-badge ' + sc.cls + '">' + sc.label + '</span></div></div>'
    + '<div class="cdp-info-item"><div class="cdp-info-label">Date Filed</div>'
    + '<div class="cdp-info-value">' + (claim.claim_date ? new Date(claim.claim_date).toLocaleDateString('en-GB') : '') + '</div></div>'
    + '<div class="cdp-info-item"><div class="cdp-info-label">Contract</div>'
    + '<div class="cdp-info-value">#' + claim.contract_id + '</div></div>'
    + '<div class="cdp-info-item"><div class="cdp-info-label">Location</div>'
    + '<div class="cdp-info-value">' + (claim.incident_location || 'Not specified') + '</div></div>'
    + '</div></div>'
    + '<div class="cdp-section"><div class="cdp-section-title">Description</div>'
    + '<div class="cdp-description">' + (claim.description || 'No description.') + '</div></div>'
    + (claim.rejection_reason
      ? '<div class="cdp-section"><div class="cdp-section-title">Rejection Reason</div>'
        + '<div class="cdp-description" style="border-color:#f43f5e;background:#fff1f2;color:#be123c;">'
        + claim.rejection_reason + '</div></div>' : '')
    + '<div class="cdp-section"><div class="cdp-section-title">Progress</div>'
    + '<div class="cdp-timeline">' + timelineHTML + '</div></div>';

  document.getElementById('claimPanelOverlay').classList.add('open');
  document.getElementById('claimDetailPanel').classList.add('open');
  document.body.style.overflow = 'hidden';
};

window.closeClaimPanel = function () {
  document.getElementById('claimPanelOverlay').classList.remove('open');
  document.getElementById('claimDetailPanel').classList.remove('open');
  document.body.style.overflow = '';
};

/* ============================================================
   NEW CLAIM MODAL
   ============================================================ */
window.openNewClaimModalGeneric = async function () {
  let result;

  try {
    result = await apiRequest('/api/contracts/my');
    ALL_CONTRACTS = (result.ok && result.data.contracts) ? result.data.contracts : [];
  } catch (e) {
    ALL_CONTRACTS = [];
  }

  const active = ALL_CONTRACTS.filter(c => c.status === 'active');

  if (!active.length) {
    showToast('You have no active contracts. Please subscribe first.', 'error');
    return;
  }

  if (active.length === 1) {
    openNewClaimModal(active[0].contract_id, active[0].policy_reference);
    return;
  }

  openNewClaimModal(null, null, active);
};

window.openNewClaimModal = function (contractId, policyRef, contractList) {
  const modal = document.getElementById('newClaimModal');
  if (!modal) return;

  document.getElementById('claimFormError').style.display = 'none';
  document.getElementById('claimFormError').textContent   = '';
  document.getElementById('ncDescription').value          = '';
  document.getElementById('ncClaimDate').value            = new Date().toISOString().slice(0, 10);
  document.getElementById('ncLocation').value             = '';

  const select = document.getElementById('ncContractSelect');
  const pool   = contractList || ALL_CONTRACTS.filter(c => c.status === 'active');

  select.innerHTML = !pool.length
    ? '<option value="">— No active contracts found —</option>'
    : '<option value="">— Select a contract —</option>'
      + pool.map(c =>
          '<option value="' + c.contract_id + '">'
          + (c.policy_reference || '#' + c.contract_id)
          + ' — ' + (c.product_name || 'Insurance')
          + ' (expires ' + (c.end_date ? new Date(c.end_date).toLocaleDateString('en-GB') : '') + ')'
          + '</option>').join('');

  if (contractId) select.value = String(contractId);

  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('ncDescription').focus(), 100);
};

window.closeNewClaimModal = function () {
  const modal = document.getElementById('newClaimModal');
  if (modal) modal.classList.remove('open');
  document.body.style.overflow = '';
};

window.submitNewClaim = async function () {
  const contractId  = document.getElementById('ncContractSelect').value;
  const description = document.getElementById('ncDescription').value.trim();
  const claimDate   = document.getElementById('ncClaimDate').value;
  const location    = document.getElementById('ncLocation').value.trim();
  const errEl       = document.getElementById('claimFormError');
  const submitBtn   = document.getElementById('ncSubmitBtn');

  function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
  if (!contractId)              { showErr('Please select a contract.'); return; }
  if (description.length < 10) { showErr('Description must be at least 10 characters.'); return; }
  if (!claimDate)               { showErr('Please enter the incident date.'); return; }

  errEl.style.display = 'none';

  submitBtn.disabled    = true;
  submitBtn.textContent = 'Submitting…';

  let result;
  try {
    result = await apiRequest('/api/claims', {
      method: 'POST',
      body: { contract_id: parseInt(contractId, 10), description, claim_date: claimDate, incident_location: location || null }
    });
  } catch (e) {
    showErr('Network error — please check your connection.');
    submitBtn.disabled = false; submitBtn.textContent = 'Submit Claim';
    return;
  }

  if (!result.ok) {
    showErr(result.data.error || 'Failed to submit claim (HTTP ' + result.status + ').');
    submitBtn.disabled = false; submitBtn.textContent = 'Submit Claim';
    return;
  }

  closeNewClaimModal();
  showToast('Claim #' + result.data.claim_id + ' submitted successfully!');
  ALL_CLAIMS = [];
  loadClaims();
  submitBtn.disabled = false; submitBtn.textContent = 'Submit Claim';
};

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type) {
  let t = document.getElementById('caar-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'caar-toast';
    t.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;'
      + 'padding:14px 22px;border-radius:10px;font-size:.84rem;font-weight:600;'
      + 'box-shadow:0 8px 24px rgba(0,0,0,.18);transition:opacity .3s ease;max-width:340px;';
    document.body.appendChild(t);
  }
  t.style.background = (type === 'error') ? '#c53030' : '#1a1a1a';
  t.style.color      = '#fff';
  t.style.opacity    = '1';
  t.textContent      = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 3500);
}

/* ============================================================
   ROADSIDE
   ============================================================ */
var selectedProblemType = '';

window.selectProblemChip = function (el, value) {
  document.querySelectorAll('.rf-problem-chip').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  selectedProblemType = value;
};

window.submitRoadsideRequest = function () {
  const plate   = (document.getElementById('rfLicensePlate') || {}).value || '';
  const wilaya  = (document.getElementById('rfWilaya') || {}).value || '';
  const address = ((document.getElementById('rfAddress') || {}).value || '').trim();
  const desc    = ((document.getElementById('rfDescription') || {}).value || '').trim();
  const phone   = ((document.getElementById('rfPhone') || {}).value || '').trim();

  if (!selectedProblemType) { showToast('Please select the type of problem.', 'error'); return; }
  if (!plate)   { showToast('Please enter your license plate.', 'error'); return; }
  if (!wilaya)  { showToast('Please select your wilaya.', 'error'); return; }
  if (!address) { showToast('Please enter your location.', 'error'); return; }
  if (!desc)    { showToast('Please describe the problem.', 'error'); return; }
  if (!phone)   { showToast('Please enter your phone number.', 'error'); return; }

  const btn = document.getElementById('btnRoadsideSubmit');
  if (btn) { btn.disabled = true; btn.textContent = 'Sending…'; }

  setTimeout(() => {
    if (btn) { btn.disabled = false; btn.textContent = 'Send Assistance Request'; }
    const ref = 'RSA-REQ-' + Date.now().toString(36).toUpperCase();
    const refEl = document.getElementById('rsRequestRef');
    if (refEl) refEl.textContent = ref;
    const body = document.getElementById('roadsideFormBody');
    if (body) body.style.display = 'none';
    const success = document.getElementById('roadsideSuccess');
    if (success) { success.style.display = 'block'; success.classList.add('show'); }
  }, 1400);
};

window.resetRoadsideForm = function () {
  ['rfLicensePlate', 'rfBrand', 'rfAddress', 'rfDescription', 'rfPhone', 'rfCity']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  selectedProblemType = '';
  document.querySelectorAll('.rf-problem-chip').forEach(c => c.classList.remove('selected'));
  const body = document.getElementById('roadsideFormBody');
  if (body) body.style.display = '';
  const success = document.getElementById('roadsideSuccess');
  if (success) { success.style.display = 'none'; success.classList.remove('show'); }
};

/* ============================================================
   PROFILE
   ============================================================ */
window.saveProfile = function () {
  const first = (document.getElementById('pf-first') || {}).value || '';
  const last  = (document.getElementById('pf-last')  || {}).value || '';
  if (!first || !last) { showToast('Name fields cannot be empty.', 'error'); return; }
  const ok = document.getElementById('pfb-success');
  if (ok) { ok.style.display = 'flex'; setTimeout(() => { ok.style.display = 'none'; }, 3000); }
  showToast('Profile saved.');
};

window.cancelProfile = function () {
  const user = _authUser || {};
  safeSetValue('pf-first', user.first_name || '');
  safeSetValue('pf-last',  user.last_name  || '');
  safeSetValue('pf-email', user.email      || '');
  safeSetValue('pf-phone', user.phone      || '');
};

window.changePassword = function () {
  const pw1  = (document.getElementById('pf-pw-new')     || {}).value || '';
  const pw2  = (document.getElementById('pf-pw-confirm') || {}).value || '';
  const errEl = document.getElementById('pfb-pw-error');
  const okEl  = document.getElementById('pfb-pw-success');
  if (pw1 !== pw2) {
    if (errEl) errEl.style.display = 'flex';
    setTimeout(() => { if (errEl) errEl.style.display = 'none'; }, 3000);
    return;
  }
  if (okEl) { okEl.style.display = 'flex'; setTimeout(() => { okEl.style.display = 'none'; }, 3000); }
  showToast('Password updated.');
};

/* ============================================================
   KEYBOARD
   ============================================================ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (typeof window.closeClaimPanel    === 'function') window.closeClaimPanel();
    if (typeof window.closeNewClaimModal === 'function') window.closeNewClaimModal();
  }
});