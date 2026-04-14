/* ============================================================
   CAAR — dashboard-client-api.js
   Real API connections for client-dashboard.html
   Replaces/extends dashboard.js API calls.
   Add AFTER dashboard.js in client-dashboard.html.
   ============================================================ */
'use strict';

/* ============================================================
   TASK 7 — DASHBOARD STATS  GET /api/dashboard/stats
   ============================================================ */
async function loadDashboardStats() {
  var result = await apiRequest('/api/dashboard/stats', 'GET');
  if (!result.ok) return;

  var stats = result.data;

  /* Map stats to summary cards */
  var cards = document.querySelectorAll('.summary-card');
  var map = {
    0: stats.active_claims  != null ? stats.active_claims  : (stats.total_claims || '—'),
    1: stats.active_claims  != null ? stats.active_claims  : '—',
    2: stats.total_contracts != null ? stats.total_contracts : '—',
    3: stats.total_payments  != null ? stats.total_payments  : '—'
  };
  cards.forEach(function (card, i) {
    var valEl = card.querySelector('.sc-value');
    if (valEl && map[i] != null) valEl.textContent = map[i];
  });
}

/* ============================================================
   TASK 1 — CLAIMS  GET /api/claims/my
   ============================================================ */
async function loadMyClaims() {
  var tbody   = document.getElementById('claimsTableBody');
  var emptyEl = document.getElementById('claimsEmpty');
  var countEl = document.getElementById('claimsCountNum');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:28px;color:#999;">Loading…</td></tr>';

  var result = await apiRequest('/api/claims/my', 'GET');

  if (!result.ok) {
    tbody.innerHTML = '<tr><td colspan="5" style="color:#e53e3e;padding:20px;text-align:center;">Failed to load claims.</td></tr>';
    return;
  }

  var claims = result.data.claims || [];
  window.ALL_CLAIMS = claims;

  if (countEl) countEl.textContent = claims.length;

  if (!claims.length) {
    tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  var STATUS_MAP = {
    pending:         { cls: 'status-badge--pending',         label: 'Pending' },
    under_review:    { cls: 'status-badge--under-review',    label: 'Under Review' },
    expert_assigned: { cls: 'status-badge--expert-assigned', label: 'Expert Assigned' },
    reported:        { cls: 'status-badge--approved',        label: 'Reported' },
    closed:          { cls: 'status-badge--closed',          label: 'Closed' },
    rejected:        { cls: 'status-badge--rejected',        label: 'Rejected' }
  };

  tbody.innerHTML = claims.map(function (c) {
    var sc   = STATUS_MAP[c.status] || { cls: 'status-badge--pending', label: c.status };
    var date = c.claim_date ? new Date(c.claim_date).toLocaleDateString('en-GB') : '—';
    return '<tr>' +
      '<td><span class="claim-id-cell">#' + c.claim_id + '</span></td>' +
      '<td>' + date + '</td>' +
      '<td><span class="type-chip">Contract #' + c.contract_id + '</span></td>' +
      '<td><span class="status-badge ' + sc.cls + '">' + sc.label + '</span></td>' +
      '<td><button class="btn-claim-view" onclick="openClaimPanel(' + c.claim_id + ')">' +
      'View</button></td></tr>';
  }).join('');
}

/* ============================================================
   TASK 1 — NEW CLAIM  POST /api/claims
   ============================================================ */
async function submitNewClaimAPI() {
  var contractId  = (document.getElementById('ncContractSelect') || {}).value;
  var description = ((document.getElementById('ncDescription')   || {}).value || '').trim();
  var claimDate   = (document.getElementById('ncClaimDate')       || {}).value;
  var location    = ((document.getElementById('ncLocation')       || {}).value || '').trim();
  var errEl       = document.getElementById('claimFormError');
  var submitBtn   = document.getElementById('ncSubmitBtn');

  function showErr(msg) {
    if (errEl) { errEl.textContent = msg; errEl.style.display = 'block'; }
  }

  if (!contractId)              { showErr('Please select a contract.'); return; }
  if (description.length < 10) { showErr('Description must be at least 10 characters.'); return; }
  if (!claimDate)               { showErr('Please enter the incident date.'); return; }

  if (errEl) errEl.style.display = 'none';
  btnLoading(submitBtn, 'Submitting…');

  var result = await apiRequest('/api/claims', 'POST', {
    contract_id:       parseInt(contractId, 10),
    description:       description,
    claim_date:        claimDate,
    incident_location: location || null
  });

  btnReset(submitBtn);

  if (!result.ok) {
    showErr(result.data.error || 'Failed to submit claim.');
    return;
  }

  /* Success: close modal, reload claims */
  if (typeof closeNewClaimModal === 'function') closeNewClaimModal();
  showMsg('claimsApiMsg', '✓ Claim #' + result.data.claim_id + ' submitted successfully!', false);
  window.ALL_CLAIMS = [];
  await loadMyClaims();
}

/* ============================================================
   TASK 3 — CONTRACTS  GET /api/contracts/my
   Already handled by loadContracts() in app-state.js.
   This just pre-populates the claim modal dropdown.
   ============================================================ */
async function loadContractsForModal() {
  var select = document.getElementById('ncContractSelect');
  if (!select) return;

  select.innerHTML = '<option value="">Loading…</option>';

  var result = await apiRequest('/api/contracts/my', 'GET');

  if (!result.ok || !result.data.contracts) {
    select.innerHTML = '<option value="">No contracts found</option>';
    return;
  }

  var active = result.data.contracts.filter(function (c) { return c.status === 'active'; });
  window.ALL_CONTRACTS = result.data.contracts;

  if (!active.length) {
    select.innerHTML = '<option value="">No active contracts</option>';
    return;
  }

  select.innerHTML = '<option value="">— Select a contract —</option>' +
    active.map(function (c) {
      return '<option value="' + c.contract_id + '">' +
        (c.policy_reference || '#' + c.contract_id) +
        ' — ' + (c.product_name || 'Insurance') + '</option>';
    }).join('');
}

/* ============================================================
   WIRE UP: override submitNewClaim from dashboard.js
   ============================================================ */
window.submitNewClaim = submitNewClaimAPI;

/* ============================================================
   INIT: auto-load when section is shown
   ============================================================ */
var _origSwitchSection = window.switchSection;
window.switchSection = function (key, el) {
  if (typeof _origSwitchSection === 'function') _origSwitchSection(key, el);
  if (key === 'claims')    loadMyClaims();
  if (key === 'contracts') { /* loadContracts() already called by dashboard.js */ }
  if (key === 'dashboard') loadDashboardStats();
};

/* Auto-load on page open */
document.addEventListener('DOMContentLoaded', function () {
  setTimeout(function () {
    loadDashboardStats();
  }, 300);
});