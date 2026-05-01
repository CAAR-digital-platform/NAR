/* ============================================================
   CAAR — dashboard.js  (v5 — ACTION CENTER)
   
   Transforms the client dashboard from a passive stats display
   into an actionable control center.
   
   What's new:
   - Contextual alert banners based on real state
   - Recent activity feed (claims + roadside requests)
   - Clickable stat cards → navigate to filtered views
   - Contextual "next step" prompts
   - Mini timeline inside claim detail panel
   ============================================================ */

'use strict';

/* ── STRICT AUTH GUARD ─────────────────────────────────────── */
const _authUser  = JSON.parse(localStorage.getItem('user')  || 'null');
const _authToken = localStorage.getItem('token');

if (!_authUser || !_authToken) {
  window.location.href = 'login.html';
}
if (_authUser && _authUser.role !== 'client') {
  window.location.href = 'index.html';
}

if (_authUser && (_authUser.must_change_password || localStorage.getItem('must_change_password') === '1')) {
  window.location.href = 'change-password.html';
}

if (typeof window.apiRequest === 'undefined') {
  console.error('[CAAR] dashboard.js — app-state.js not loaded!');
}

/* ── Global state ────────────────────────────────────────────── */
var ALL_CLAIMS          = [];
var ALL_CONTRACTS       = [];
var ALL_ROADSIDE        = [];
var ALL_MESSAGES        = [];
var _dashStats          = {};
var DASH_ALERT_ACTIONS  = [];

function getUiIcon(name) {
  var icons = {
    clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path></svg>',
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"></circle><path d="m20 20-3.5-3.5"></path></svg>',
    user: '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    clipboard: '<svg viewBox="0 0 24 24"><rect x="8" y="3" width="8" height="4" rx="1"></rect><path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"></path></svg>',
    check: '<svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M18 6 6 18"></path><path d="m6 6 12 12"></path></svg>',
    car: '<svg viewBox="0 0 24 24"><path d="M5 16h14l-1.2-5a2 2 0 0 0-1.94-1.53H8.14A2 2 0 0 0 6.2 11L5 16z"></path><circle cx="7.5" cy="17.5" r="1.5"></circle><circle cx="16.5" cy="17.5" r="1.5"></circle></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v6c0 5 3.5 8 7 9 3.5-1 7-4 7-9V6l-7-3z"></path></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>',
    info: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"></circle><path d="M12 11v5"></path><circle cx="12" cy="8" r="1"></circle></svg>',
    alert: '<svg viewBox="0 0 24 24"><path d="M12 3 3.5 19h17L12 3z"></path><path d="M12 9v5"></path><circle cx="12" cy="17" r="1"></circle></svg>',
  };
  return icons[name] || icons.file;
}

function t(key, fallbackOrVars) {
  var value = '';
  if (window.Language && typeof window.Language.t === 'function') {
    value = window.Language.t(key) || '';
  }

  var vars = null;
  var fallback = '';
  if (typeof fallbackOrVars === 'object' && fallbackOrVars !== null) {
    vars = fallbackOrVars;
  } else if (typeof fallbackOrVars === 'string') {
    fallback = fallbackOrVars;
  }

  if (!value) value = fallback || '';

  if (vars && value) {
    Object.keys(vars).forEach(function (k) {
      var re = new RegExp('{{\\s*' + k + '\\s*}}', 'g');
      value = value.replace(re, String(vars[k]));
    });
  }

  return value;
}

function statusText(config, fallbackKey, fallbackText) {
  if (!config) {
    return t(fallbackKey, fallbackText);
  }
  return t(config.labelKey || fallbackKey, config.labelFallback || fallbackText);
}

function _syncBodyLock() {
  var sidebar = document.getElementById('dashSidebar');
  var modal = document.getElementById('newClaimModal');
  var panel = document.getElementById('claimDetailPanel');
  var sidebarOpen = !!(sidebar && sidebar.classList.contains('open'));
  var modalOpen = !!(modal && modal.classList.contains('open'));
  var panelOpen = !!(panel && panel.classList.contains('open'));
  document.body.style.overflow = (sidebarOpen || modalOpen || panelOpen) ? 'hidden' : '';
}

/* ── Status config ───────────────────────────────────────────── */
var STATUS_CONFIG = {
  pending:         { cls: 'status-badge--pending',         labelKey: 'status.pending',         labelFallback: 'Pending',         icon: 'clock' },
  under_review:    { cls: 'status-badge--under-review',    labelKey: 'status.under_review',    labelFallback: 'Under Review',    icon: 'search' },
  expert_assigned: { cls: 'status-badge--expert-assigned', labelKey: 'status.assigned', labelFallback: 'Assigned', icon: 'user' },
  reported:        { cls: 'status-badge--approved',        labelKey: 'status.reported',        labelFallback: 'Reported',        icon: 'clipboard' },
  closed:          { cls: 'status-badge--closed',          labelKey: 'status.closed',          labelFallback: 'Closed',          icon: 'check' },
  rejected:        { cls: 'status-badge--rejected',        labelKey: 'status.rejected',        labelFallback: 'Rejected',        icon: 'x' },
  approved:        { cls: 'status-badge--closed',          labelKey: 'status.approved',        labelFallback: 'Approved',        icon: 'check' },
};

/* ── Roadside status config ──────────────────────────────────── */
var ROADSIDE_STATUS = {
  pending:    { cls: 'status-badge--pending',      labelKey: 'status.pending',      labelFallback: 'Pending',    icon: 'clock' },
  dispatched: { cls: 'status-badge--under-review', labelKey: 'status.dispatched', labelFallback: 'Dispatched', icon: 'car' },
  completed:  { cls: 'status-badge--closed',       labelKey: 'status.completed',  labelFallback: 'Completed',  icon: 'check' },
};

/* ============================================================
   BOOT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  renderUserIdentity();
  loadAllData();
  if (window.Language && typeof window.Language.applyTranslations === 'function') {
    window.Language.applyTranslations(document);
  }
});

/* ============================================================
   LOAD ALL DATA — parallel fetch
   ============================================================ */
async function loadAllData() {
  try {
    const [statsRes, claimsRes, contractsRes, roadsideRes] = await Promise.allSettled([
      apiRequest('/api/dashboard/stats'),
      apiRequest('/api/claims/my'),
      apiRequest('/api/contracts/my'),
      apiRequest('/api/roadside/requests/my'),
    ]);

    // Stats
    if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
      _dashStats = statsRes.value.data || {};
    }

    // Claims
    if (claimsRes.status === 'fulfilled' && claimsRes.value.ok) {
      ALL_CLAIMS = claimsRes.value.data.claims || [];
    }

    // Contracts
    if (contractsRes.status === 'fulfilled' && contractsRes.value.ok) {
      ALL_CONTRACTS = contractsRes.value.data.contracts || [];
    }

    // Roadside requests
    if (roadsideRes.status === 'fulfilled' && roadsideRes.value.ok) {
      ALL_ROADSIDE = roadsideRes.value.data.requests || [];
    }

  } catch (err) {
    console.error('[CAAR] loadAllData error:', err);
  }

  // Render everything
  renderSummaryCards();
  renderAlertBanners();
  renderRecentActivity();
  renderContextualNextStep();
  populateClaimModalContracts();
  populateRoadsideContractSelect();
  renderRoadsideRequests();
  if (window.Language && typeof window.Language.applyTranslations === 'function') {
    window.Language.applyTranslations(document);
  }
}

/* ============================================================
   SUMMARY CARDS — clickable, data-driven
   ============================================================ */
function renderSummaryCards() {
  const activeClaims   = ALL_CLAIMS.filter(c => !['closed','rejected'].includes(c.status));
  const pendingClaims  = ALL_CLAIMS.filter(c => c.status === 'pending');
  const activeContracts = ALL_CONTRACTS.filter(c => c.status === 'active');

  // Update card values
  safeSetText('.summary-card--orange .sc-value', ALL_CLAIMS.length);
  safeSetText('.summary-card--amber  .sc-value', activeClaims.length);
  safeSetText('.summary-card--blue   .sc-value', ALL_CONTRACTS.length);
  safeSetText('.summary-card--green  .sc-value', _dashStats.total_payments || 0);

  // Update sub-labels
  safeSetText('.summary-card--orange .sc-sub', activeClaims.length + ' ' + t('status.active', 'active'));
  safeSetText('.summary-card--amber  .sc-sub', pendingClaims.length + ' ' + t('status.under_review', 'awaiting review'));
  safeSetText('.summary-card--blue   .sc-sub', activeContracts.length + ' ' + t('status.active', 'active'));

  // Make cards clickable
  const orangeCard = document.querySelector('.summary-card--orange');
  const amberCard  = document.querySelector('.summary-card--amber');
  const blueCard   = document.querySelector('.summary-card--blue');

  if (orangeCard) {
    orangeCard.style.cursor = 'pointer';
    orangeCard.addEventListener('click', function () { switchSection('claims', document.querySelector('[data-section="claims"]')); });
    orangeCard.title = t('dashboard.view_all_claims', 'View all claims');
  }
  if (amberCard) {
    amberCard.style.cursor = 'pointer';
    amberCard.addEventListener('click', function () {
      switchSection('claims', document.querySelector('[data-section="claims"]'));
      setTimeout(function () {
        var sel = document.getElementById('claimsFilterSelect');
        if (sel) { sel.value = 'pending'; filterClaims('pending'); }
      }, 300);
    });
    amberCard.title = t('dashboard.view_active_claims', 'View active claims');
  }
  if (blueCard) {
    blueCard.style.cursor = 'pointer';
    blueCard.addEventListener('click', function () { switchSection('contracts', document.querySelector('[data-section="contracts"]')); });
    blueCard.title = t('dashboard.view_all_contracts', 'View all contracts');
  }

  // Badge on claims nav item
  const badge = document.querySelector('[data-section="claims"] .dash-nav-item__badge');
  const openCount = activeClaims.length;
  if (badge) badge.textContent = openCount || '';
}

/* ============================================================
   ALERT BANNERS — contextual, state-driven
   ============================================================ */
function renderAlertBanners() {
  const container = document.getElementById('dashAlertContainer');
  if (!container) return;

  const alerts = [];
  const pendingClaims  = ALL_CLAIMS.filter(c => c.status === 'pending');
  const expertClaims   = ALL_CLAIMS.filter(c => c.status === 'expert_assigned');
  const activeClaims   = ALL_CLAIMS.filter(c => !['closed','rejected'].includes(c.status));
  const activeContracts = ALL_CONTRACTS.filter(c => c.status === 'active');
  const pendingRoadside = ALL_ROADSIDE.filter(r => r.status === 'pending');

  // Alert: no contracts at all
  if (ALL_CONTRACTS.length === 0) {
    alerts.push({
      type: 'info',
      icon: 'shield',
      title: t('dashboard.get_insured_today', 'Get insured today'),
      message: t('dashboard.no_contracts_message', 'You have no insurance contracts yet. Explore our products to protect what matters.'),
      action: { label: t('dashboard.browse_products', 'Browse Products'), fn: function () { window.location.href = 'Online_subscription.html'; } },
    });
  }

  // Alert: pending claims awaiting review
  if (pendingClaims.length > 0) {
    alerts.push({
      type: 'warning',
      icon: 'clock',
      title: pendingClaims.length === 1
        ? t('dashboard.one_claim_awaiting', 'You have 1 claim awaiting review')
        : t('dashboard.claims_awaiting', 'You have ') + pendingClaims.length + t('dashboard.claims_awaiting_suffix', ' claims awaiting review'),
      message: t('dashboard.claims_review_message', 'Our team will review your claim shortly. You\'ll be notified when the status changes.'),
      action: { label: t('dashboard.view_claims', 'View Claims'), fn: function () { openLatestClaimPanelFromApi(['pending', 'under_review', 'expert_assigned', 'reported']); } },
    });
  }

  // Alert: expert assigned
  if (expertClaims.length > 0) {
    alerts.push({
      type: 'success',
      icon: 'user',
      title: expertClaims.length === 1
        ? t('dashboard.expert_assigned_single', 'An expert has been assigned to your claim')
        : t('dashboard.expert_assigned_many_prefix', '') + expertClaims.length + t('dashboard.expert_assigned_many_suffix', ' of your claims have an expert assigned'),
      message: t('dashboard.expert_assigned_message', 'Your claim is being actively handled. The expert will contact you soon.'),
      action: { label: t('dashboard.view_claims', 'View Claims'), fn: function () { openLatestClaimPanelFromApi(['expert_assigned']); } },
    });
  }

  // Alert: active roadside request
  if (pendingRoadside.length > 0) {
    alerts.push({
      type: 'warning',
      icon: 'car',
      title: t('dashboard.roadside_pending', 'Roadside request pending'),
      message: t('dashboard.roadside_message', 'Your roadside assistance request is being processed. Our team will dispatch help shortly.'),
      action: { label: t('dashboard.view_request', 'View Request'), fn: function () { openLatestRoadsidePanelFromApi(); } },
    });
  }

  // Alert: no active claims and has contract — prompt to file
  if (ALL_CONTRACTS.length > 0 && activeClaims.length === 0 && ALL_CLAIMS.length === 0) {
    alerts.push({
      type: 'info',
      icon: 'clipboard',
      title: t('dashboard.no_active_claims_title', 'No active claims'),
      message: t('dashboard.no_active_claims_message', 'Experienced an incident? File a claim now and our team will guide you through the process.'),
      action: { label: t('dashboard.file_a_claim', 'File a Claim'), fn: openNewClaimModalGeneric },
    });
  }

  // Render alerts
  if (alerts.length === 0) {
    container.innerHTML = '';
    return;
  }

  DASH_ALERT_ACTIONS = alerts.map(function (a) { return a.action ? a.action.fn : null; });

  container.innerHTML = alerts.map(function (a, i) {
    var alertClass = 'dash-alert dash-alert--' + (a.type || 'info');
    return '<div class="' + alertClass + '" style="animation:alertSlideIn .3s ease ' + (i * 0.08) + 's both;">' +
      '<div class="dash-alert-icon">' + getUiIcon(a.icon) + '</div>' +
      '<div class="dash-alert-content">' +
        '<div class="dash-alert-title">' + escapeHTML(a.title) + '</div>' +
        '<div class="dash-alert-desc">' + escapeHTML(a.message) + '</div>' +
      '</div>' +
      (a.action ? '<button type="button" data-alert-action="' + i + '" class="dash-alert-btn">' +
        escapeHTML(a.action.label) + '</button>' : '') +
    '</div>';
  }).join('');

  container.querySelectorAll('[data-alert-action]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var idx = parseInt(btn.getAttribute('data-alert-action'), 10);
      var actionFn = DASH_ALERT_ACTIONS[idx];
      if (typeof actionFn === 'function') {
        actionFn();
      }
    });
  });
}

async function _refreshClaimsFromApi() {
  try {
    var result = await apiRequest('/api/claims/my');
    if (result.ok) {
      ALL_CLAIMS = result.data.claims || [];
      return ALL_CLAIMS;
    }
  } catch (_) {}
  return ALL_CLAIMS;
}

async function _refreshRoadsideFromApi() {
  try {
    var result = await apiRequest('/api/roadside/requests/my');
    if (result.ok) {
      ALL_ROADSIDE = result.data.requests || [];
      return ALL_ROADSIDE;
    }
  } catch (_) {}
  return ALL_ROADSIDE;
}

async function openLatestClaimPanelFromApi(preferredStatuses) {
  var claims = await _refreshClaimsFromApi();
  if (!claims.length) {
    showToast(t('dashboard.no_claims_available', 'No claims available to display.'), 'error');
    return;
  }

  var selected = null;
  if (Array.isArray(preferredStatuses) && preferredStatuses.length) {
    selected = claims.find(function (c) { return preferredStatuses.includes(c.status); }) || null;
  }
  if (!selected) {
    selected = claims[0];
  }

  switchSection('claims', document.querySelector('[data-section="claims"]'));
  setTimeout(function () {
    openClaimPanel(selected.claim_id);
  }, 180);
}

window.openRoadsidePanel = function (requestId) {
  var request = ALL_ROADSIDE.find(function (r) {
    return String(r.request_id) === String(requestId);
  });
  if (!request) return;

  var sc = ROADSIDE_STATUS[request.status] || { cls: 'status-badge--pending', labelKey: 'status.pending', labelFallback: 'Pending' };
  document.getElementById('cdpTitle').textContent = t('dashboard.roadside_title_prefix', 'Roadside ') + (request.request_reference || ('#' + request.request_id));
  document.getElementById('cdpSubtitle').textContent = t('expert.contract_prefix', 'Contract') + ' #' + (request.contract_id || '—');

  document.getElementById('cdpBody').innerHTML =
    '<div class="cdp-section"><div class="cdp-section-title">' + t('dashboard.request_details', 'Request Details') + '</div>' +
    '<div class="cdp-info-grid">' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + t('dashboard.status_label', 'Status') + '</div><div class="cdp-info-value"><span class="status-badge ' + sc.cls + '">' + escapeHTML(statusText(sc, 'status.' + request.status, request.status)) + '</span></div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + t('dashboard.created_label', 'Created') + '</div><div class="cdp-info-value">' + escapeHTML(request.created_at ? new Date(request.created_at).toLocaleDateString('en-GB') : '—') + '</div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + t('dashboard.problem_type_label', 'Problem Type') + '</div><div class="cdp-info-value">' + escapeHTML(request.problem_type || '—') + '</div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + t('dashboard.vehicle_label', 'Vehicle') + '</div><div class="cdp-info-value">' + escapeHTML(request.vehicle_label || request.license_plate || '—') + '</div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + t('dashboard.location_label', 'Location') + '</div><div class="cdp-info-value">' + escapeHTML(request.location_address || request.city || '—') + '</div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + t('dashboard.phone_label', 'Phone') + '</div><div class="cdp-info-value">' + escapeHTML(request.phone || '—') + '</div></div>' +
    '</div></div>' +
    '<div class="cdp-section"><div class="cdp-section-title">' + t('dashboard.description_label', 'Description') + '</div>' +
      '<div class="cdp-description">' + escapeHTML(request.description || t('dashboard.no_description_provided', 'No description provided.')) + '</div></div>';

  document.getElementById('claimPanelOverlay').classList.add('open');
  document.getElementById('claimDetailPanel').classList.add('open');
  _syncBodyLock();
};

async function openLatestRoadsidePanelFromApi() {
  var requests = await _refreshRoadsideFromApi();
  if (!requests.length) {
    showToast(t('dashboard.no_roadside_requests', 'No roadside requests available to display.'), 'error');
    return;
  }

  switchSection('roadside', document.querySelector('[data-section="roadside"]'));
  setTimeout(function () {
    window.openRoadsidePanel(requests[0].request_id);
  }, 180);
}

/* ============================================================
   RECENT ACTIVITY — last 5 combined (claims + roadside)
   ============================================================ */
function renderRecentActivity() {
  const container = document.getElementById('recentActivityList');
  if (!container) return;

  // Build unified activity list
  var items = [];

  ALL_CLAIMS.slice(0, 5).forEach(function (c) {
    var sc = STATUS_CONFIG[c.status] || { label: c.status, icon: 'file' };
    items.push({
      type:    'claim',
      id:      c.claim_id,
      icon:    sc.icon,
      title:   t('dashboard.claim_prefix', 'Claim #') + c.claim_id,
      sub:     t('dashboard.contract_prefix', 'Contract #') + c.contract_id,
      status:  statusText(sc, 'status.' + c.status, c.status),
      cls:     sc.cls,
      date:    c.claim_date,
      raw:     c,
    });
  });

  ALL_ROADSIDE.slice(0, 3).forEach(function (r) {
    var sc = ROADSIDE_STATUS[r.status] || { label: r.status, icon: 'car' };
    items.push({
      type:   'roadside',
      id:     r.request_id,
      icon:   sc.icon,
      title:  t('dashboard.roadside_title_prefix', 'Roadside ') + (r.request_reference || '#' + r.request_id),
      sub:    r.problem_type || t('dashboard.assistance_request', 'Assistance request'),
      status: statusText(sc, 'status.' + r.status, r.status),
      cls:    sc.cls,
      date:   r.created_at,
      raw:    r,
    });
  });

  // Sort by date descending
  items.sort(function (a, b) {
    return new Date(b.date || 0) - new Date(a.date || 0);
  });

  items = items.slice(0, 5);

  if (items.length === 0) {
    container.innerHTML =
      '<div class="activity-item">' +
        '<div class="activity-dot activity-dot--amber">' +
          '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
          '<polyline points="14 2 14 8 20 8"/></svg></div>' +
        '<div class="activity-body">' +
          '<div class="activity-body-title">' + escapeHTML(t('dashboard.no_recent_activity_title', 'No recent activity')) + '</div>' +
          '<div class="activity-body-sub">' + escapeHTML(t('dashboard.no_recent_activity_sub', 'Your claims and roadside requests will appear here')) + '</div>' +
        '</div>' +
      '</div>';
    return;
  }

  container.innerHTML = items.map(function (item) {
    var dotCls = item.type === 'roadside' ? 'activity-dot--blue' : 'activity-dot--amber';
    var dateStr = item.date ? new Date(item.date).toLocaleDateString('en-GB') : '';

    return '<div class="activity-item activity-item--clickable" onclick="' +
      (item.type === 'claim'
        ? 'openClaimPanel(' + item.id + ')'
        : 'switchSection(\'roadside\', document.querySelector(\'[data-section="roadside"]\'))') +
      '">' +
      '<div class="activity-dot ' + dotCls + '">' + getUiIcon(item.icon) + '</div>' +
      '<div class="activity-body">' +
        '<div class="activity-body-title">' + escapeHTML(item.title) + '</div>' +
        '<div class="activity-body-sub">' + escapeHTML(item.sub) + '</div>' +
      '</div>' +
      '<div class="activity-meta">' +
        '<span class="status-badge ' + item.cls + '">' + escapeHTML(item.status) + '</span>' +
        '<span class="activity-time">' + escapeHTML(dateStr) + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

/* ============================================================
   CONTEXTUAL NEXT STEP
   ============================================================ */
function renderContextualNextStep() {
  const container = document.getElementById('nextStepWidget');
  if (!container) return;

  var step = null;
  const activeContracts = ALL_CONTRACTS.filter(c => c.status === 'active');

  if (ALL_CONTRACTS.length === 0) {
    step = {
      icon: 'shield',
      title: t('dashboard.next_start_policy_title', 'Start your first policy'),
      desc:  t('dashboard.next_start_policy_desc', 'Subscribe to an insurance product to unlock all dashboard features.'),
      btnLabel: t('dashboard.next_browse_products', 'Browse Products'),
      btnFn: 'window.location.href="Online_subscription.html"',
    };
  } else if (activeContracts.length > 0 && ALL_CLAIMS.length === 0) {
    step = {
      icon: 'clipboard',
      title: t('dashboard.next_file_first_claim_title', 'File your first claim'),
      desc:  t('dashboard.next_file_first_claim_desc', 'Had an incident? File a claim in minutes and our team will take care of it.'),
      btnLabel: t('dashboard.next_file_claim_btn', 'File a Claim'),
      btnFn: 'openNewClaimModalGeneric()',
    };
  } else if (activeContracts.length > 0 && ALL_ROADSIDE.length === 0) {
    step = {
      icon: 'car',
      title: t('dashboard.next_request_roadside_title', 'Request roadside assistance'),
      desc:  t('dashboard.next_request_roadside_desc', 'Stranded on the road? Get immediate help from our 24/7 assistance team.'),
      btnLabel: t('dashboard.next_request_roadside_btn', 'Request Assistance'),
      btnFn: 'switchSection("roadside", document.querySelector("[data-section=roadside]"))',
    };
  } else {
    step = {
      icon: 'check',
      title: t('dashboard.next_account_active_title', 'Your account is active'),
      desc:  t('dashboard.next_account_active_desc', 'All your contracts and services are running. Contact us if you need anything.'),
      btnLabel: t('dashboard.next_contact_support_btn', 'Contact Support'),
      btnFn: 'window.location.href="contact.html"',
    };
  }

  container.innerHTML =
    '<div class="next-step-row">' +
      '<div class="next-step-icon">' + getUiIcon(step.icon) + '</div>' +
      '<div class="next-step-content">' +
        '<div class="next-step-title">' + escapeHTML(step.title) + '</div>' +
        '<div class="next-step-desc">' + escapeHTML(step.desc) + '</div>' +
        '<button onclick="' + step.btnFn + '" class="next-step-btn">' +
          escapeHTML(step.btnLabel) + '</button>' +
      '</div>' +
    '</div>';
}

/* ============================================================
   USER IDENTITY
   ============================================================ */
function renderUserIdentity() {
  var user = _authUser;
  if (!user) return;

  var name = user.first_name
    ? (user.first_name + ' ' + (user.last_name || '')).trim()
    : (user.email || 'Client');
  var initials = name.trim().split(/\s+/).map(function (w) { return w[0]; }).join('').toUpperCase().slice(0, 2) || 'CL';

  safeSetText('.dash-sidebar__user-name', name);
  safeSetText('.dash-sidebar__user-role', user.role || 'client');
  var sideAvatar = document.querySelector('.dash-sidebar__avatar');
  if (sideAvatar) sideAvatar.textContent = initials;

  safeSetText('.dash-topbar__user-name', name.split(' ')[0]);
  var topAvatar = document.querySelector('.dash-topbar__user-avatar');
  if (topAvatar) topAvatar.textContent = initials;

  safeSetText('.dash-content__header-title', t('dashboard.welcome_back_prefix', 'Welcome back, ') + (user.first_name || t('dashboard.welcome_back_anonymous', 'there')));

  safeSetValue('pf-first', user.first_name || '');
  safeSetValue('pf-last',  user.last_name  || '');
  safeSetValue('pf-email', user.email      || '');
  safeSetValue('pf-phone', user.phone      || '');

  var pac = document.querySelector('.pac-circle');
  if (pac) pac.textContent = initials;
  var pacName = document.querySelector('.pac-name');
  if (pacName) pacName.textContent = name;
}

function safeSetText(selector, value) {
  var el = document.querySelector(selector);
  if (el) el.textContent = value;
}

function safeSetValue(id, value) {
  var el = document.getElementById(id);
  if (el && !el.value) el.value = value;
}

function escapeHTML(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }[ch];
  });
}

function formatDateTime(value) {
  if (!value) return '';
  var d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB') + ' ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

/* ============================================================
   SPA NAVIGATION
   ============================================================ */
var SECTION_CONFIG = {
  dashboard: { titleKey: 'section.dashboard',    icon: '<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>' },
  claims:    { titleKey: 'section.claims',       icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
  roadside:  { titleKey: 'section.roadside',     icon: '<circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/>' },
  messages:  { titleKey: 'section.messages',     icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
  contracts: { titleKey: 'section.contracts',    icon: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>' },
  profile:   { titleKey: 'section.profile',      icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' },
};

window.switchSection = function (key, _el) {
  document.querySelectorAll('.dash-section').forEach(function (s) { s.classList.remove('active'); });
  document.querySelectorAll('.dash-nav-item').forEach(function (i) { i.classList.remove('active'); });

  var target = document.getElementById(key + '-section');
  if (target) target.classList.add('active');

  var navItem = document.querySelector('[data-section="' + key + '"]');
  if (navItem) navItem.classList.add('active');

  var cfg = SECTION_CONFIG[key] || SECTION_CONFIG.dashboard;
  var sectionTitle = cfg.titleKey ? t(cfg.titleKey, cfg.title) : cfg.title;
  safeSetText('#topbarTitle', sectionTitle);
  var iconEl = document.getElementById('topbarIcon');
  if (iconEl) iconEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + cfg.icon + '</svg>';

  closeSidebar();
  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (key === 'claims')    loadClaims();
  if (key === 'contracts') loadContractsSection();
  if (key === 'roadside')  loadRoadsideRequests();
  if (key === 'messages')  loadMessages();
};

window.openSidebar = function () {
  var sidebar = document.getElementById('dashSidebar');
  var overlay = document.getElementById('dashSidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.add('open');
  overlay.classList.add('show');
  _syncBodyLock();
};

window.closeSidebar = function () {
  var sidebar = document.getElementById('dashSidebar');
  var overlay = document.getElementById('dashSidebarOverlay');
  if (!sidebar || !overlay) return;
  sidebar.classList.remove('open');
  overlay.classList.remove('show');
  _syncBodyLock();
};

/* ============================================================
   CONTRACTS
   ============================================================ */
async function loadContractsSection() {
  var contracts = await loadContracts('contracts-cards-grid');
  ALL_CONTRACTS = contracts;
  populateClaimModalContracts();
  populateRoadsideContractSelect();
  window.__openClaimForContract = function (contractId, policyRef) {
    openNewClaimModal(contractId, policyRef);
  };
}

function populateClaimModalContracts() {
  var select = document.getElementById('ncContractSelect');
  if (!select) return;

  var active = ALL_CONTRACTS.filter(function (c) { return c.status === 'active'; });

  if (!active.length) {
    select.innerHTML = '<option value="">' + (window.Language && typeof window.Language.t === 'function' ? window.Language.t('dashboard.no_active_contracts', '— No active contracts found —') : '— No active contracts found —') + '</option>';
    return;
  }
  select.innerHTML = '<option value="">' + (window.Language && typeof window.Language.t === 'function' ? window.Language.t('dashboard.select_contract_placeholder', '— Select a contract —') : '— Select a contract —') + '</option>' +
    active.map(function (c) {
      return '<option value="' + c.contract_id + '">' +
        (c.policy_reference || '#' + c.contract_id) +
        ' — ' + (c.product_name || (window.Language && typeof window.Language.t === 'function' ? window.Language.t('dashboard.contract_product_default', 'Insurance') : 'Insurance')) +
        ' (expires ' + (c.end_date ? new Date(c.end_date).toLocaleDateString('en-GB') : '') + ')' +
        '</option>';
    }).join('');
}

function getActiveRoadsideContracts() {
  return ALL_CONTRACTS.filter(function (c) {
    return c.status === 'active' && /roadside assistance/i.test(c.product_name || '');
  });
}

function populateRoadsideContractSelect() {
  var select = document.getElementById('rfContractSelect');
  if (!select) return;

  var active = getActiveRoadsideContracts();
  if (!active.length) {
    select.innerHTML = '<option value="">' + (window.Language && typeof window.Language.t === 'function' ? window.Language.t('dashboard.no_active_roadside_contract_found', 'No active roadside assistance contract found') : 'No active roadside assistance contract found') + '</option>';
    syncRoadsideVehicleFields(null);
    return;
  }

  select.innerHTML = active.map(function (c, idx) {
    return '<option value="' + c.contract_id + '"' + (idx === 0 ? ' selected' : '') + '>' +
    escapeHTML(c.policy_reference || '#' + c.contract_id) +
    ' - ' + escapeHTML(c.product_name || (window.Language && typeof window.Language.t === 'function' ? window.Language.t('dashboard.roadside_product_default', 'Roadside Assistance') : 'Roadside Assistance')) +
    '</option>';
  }).join('');

  select.onchange = function () {
    var contract = active.find(function (c) { return String(c.contract_id) === String(select.value); });
    syncRoadsideVehicleFields(contract || null);
  };

  syncRoadsideVehicleFields(active[0]);
}

function syncRoadsideVehicleFields(contract) {
  var plate = document.getElementById('rfLicensePlate');
  var brand = document.getElementById('rfBrand');
  if (!contract) {
    if (plate) plate.value = '';
    if (brand) brand.value = '';
    return;
  }

  if (plate && contract.license_plate) {
    plate.value = contract.license_plate;
  }
  if (brand && contract.vehicle_label) {
    brand.value = contract.vehicle_label;
  }
}

/* ============================================================
   CLAIMS
   ============================================================ */
async function loadClaims() {
  var tbody   = document.getElementById('claimsTableBody');
  var emptyEl = document.getElementById('claimsEmpty');
  var countEl = document.getElementById('claimsCountNum');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#999;font-size:.82rem;">' +
    '<div style="width:22px;height:22px;border:2px solid #f0ece6;border-top-color:#E8761E;' +
    'border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px;"></div>' +
    escapeHTML(t('dashboard.loading_claims', 'Loading your claims…')) + '</td></tr>';

  var result;
  try {
    result = await apiRequest('/api/claims/my');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#e53e3e;">' + escapeHTML(t('dashboard.network_error_refresh', 'Network error. Please refresh.')) + '</td></tr>';
    return;
  }

  if (result.status === 404) { ALL_CLAIMS = []; renderClaimsTable([]); return; }
  if (!result.ok) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:32px;color:#e53e3e;">' + escapeHTML(t('dashboard.unable_load_claims', 'Unable to load claims (HTTP ' + result.status + ').')) + '</td></tr>';
    return;
  }

  ALL_CLAIMS = result.data.claims || [];
  renderClaimsTable(ALL_CLAIMS);

  // Refresh the badge
  var badge = document.querySelector('[data-section="claims"] .dash-nav-item__badge');
  var open  = ALL_CLAIMS.filter(function (c) { return !['closed','rejected'].includes(c.status); }).length;
  if (badge) badge.textContent = open || '';

  // Refresh alerts on the dashboard section too
  renderAlertBanners();
  renderRecentActivity();
  renderContextualNextStep();
}

function renderClaimsTable(claims) {
  var tbody   = document.getElementById('claimsTableBody');
  var emptyEl = document.getElementById('claimsEmpty');
  var countEl = document.getElementById('claimsCountNum');

  if (countEl) countEl.textContent = claims.length;

  if (!claims.length) {
    if (tbody)   tbody.innerHTML = '';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';

  tbody.innerHTML = claims.map(function (c) {
    var sc   = STATUS_CONFIG[c.status] || { cls: 'status-badge--pending', label: c.status };
    var date = c.claim_date ? new Date(c.claim_date).toLocaleDateString('en-GB') : '';
    return '<tr>' +
      '<td><span class="claim-id-cell">#' + c.claim_id + '</span></td>' +
      '<td>' + date + '</td>' +
      '<td><span class="type-chip">Contract #' + c.contract_id + '</span></td>' +
      '<td><span class="status-badge ' + sc.cls + '">' + escapeHTML(statusText(sc, 'status.' + c.status, c.status)) + '</span></td>' +
      '<td><button class="btn-claim-view" onclick="openClaimPanel(' + c.claim_id + ')">' +
      '<svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>' +
      '<circle cx="12" cy="12" r="3"/></svg>' + escapeHTML(t('dashboard.view_button', 'View')) + '</button></td>' +
      '</tr>';
  }).join('');
}

window.filterClaims = function (status) {
  var filtered = status === 'all'
    ? ALL_CLAIMS
    : ALL_CLAIMS.filter(function (c) { return c.status === status; });
  renderClaimsTable(filtered);
};

/* ============================================================
   CLAIM DETAIL PANEL — with mini timeline
   ============================================================ */
var TIMELINE_STEPS = [
  { key: 'pending',         labelKey: 'timeline.claim_filed' },
  { key: 'under_review',    labelKey: 'timeline.under_review' },
  { key: 'expert_assigned', labelKey: 'timeline.expert_assigned' },
  { key: 'reported',        labelKey: 'timeline.report_submitted' },
  { key: 'approved',        labelKey: 'timeline.approved' },
  { key: 'closed',          labelKey: 'timeline.closed' },
];

window.openClaimPanel = function (claimId) {
  var claim = ALL_CLAIMS.find(function (c) {
    return c.claim_id === claimId || c.claim_id === String(claimId);
  });
  if (!claim) return;

  document.getElementById('cdpTitle').textContent    = t('dashboard.claim_prefix', 'Claim #') + claim.claim_id;
  document.getElementById('cdpSubtitle').textContent = t('dashboard.contract_prefix', 'Contract #') + claim.contract_id + ' · ' + statusText(STATUS_CONFIG[claim.status], 'status.' + claim.status, claim.status);

  var sc = STATUS_CONFIG[claim.status] || { cls: 'status-badge--pending', label: claim.status };

  // Build timeline — handle rejected path
  var isRejected  = claim.status === 'rejected';
  var curIdx      = TIMELINE_STEPS.findIndex(function (s) { return s.key === claim.status; });
  var stepsToShow = isRejected ? TIMELINE_STEPS.slice(0, 4) : TIMELINE_STEPS;

  var timelineHTML = stepsToShow.map(function (step, i) {
    var stepIdx = TIMELINE_STEPS.findIndex(function (s) { return s.key === step.key; });
    var dotCls;
    if (isRejected && i === stepsToShow.length - 1) {
      dotCls = 'cdp-timeline-dot--rejected';
    } else if (stepIdx < curIdx) {
      dotCls = 'cdp-timeline-dot--done';
    } else if (stepIdx === curIdx) {
      dotCls = 'cdp-timeline-dot--current';
    } else {
      dotCls = 'cdp-timeline-dot--pending';
    }
    var label = isRejected && i === stepsToShow.length - 1 ? t('status.rejected', 'Rejected') : t(step.labelKey, step.label || step.key);
    var isCur = stepIdx === curIdx;
    return '<div class="cdp-timeline-item">' +
      '<div class="cdp-timeline-dot ' + dotCls + '">' +
        (dotCls === 'cdp-timeline-dot--done' ? getUiIcon('check') : String(i + 1)) +
      '</div>' +
      '<div class="cdp-timeline-content">' +
        '<div class="cdp-timeline-event">' + label + '</div>' +
        (isCur ? '<div class="cdp-timeline-date">' + escapeHTML(t('dashboard.current_status', 'Current status')) + '</div>' : '') +
      '</div>' +
    '</div>';
  }).join('');

  // If rejected, add rejected badge at end
  if (isRejected) {
    timelineHTML += '<div class="cdp-timeline-item">' +
      '<div class="cdp-timeline-dot" style="background:#f43f5e;color:#fff;">' + getUiIcon('x') + '</div>' +
      '<div class="cdp-timeline-content">' +
        '<div class="cdp-timeline-event" style="color:#be123c;">' + escapeHTML(t('timeline.rejected_event', 'Claim Rejected')) + '</div>' +
        '<div class="cdp-timeline-date">' + escapeHTML(t('timeline.final_status', 'Final status')) + '</div>' +
      '</div>' +
    '</div>';
  }

  document.getElementById('cdpBody').innerHTML =
    // Status + details
    '<div class="cdp-section"><div class="cdp-section-title">' + escapeHTML(t('dashboard.claim_details_title', 'Claim Details')) + '</div>' +
    '<div class="cdp-info-grid">' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + escapeHTML(t('dashboard.status_label', 'Status')) + '</div>' +
        '<div class="cdp-info-value"><span class="status-badge ' + sc.cls + '">' + escapeHTML(statusText(sc, 'status.' + claim.status, claim.status)) + '</span></div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + escapeHTML(t('dashboard.date_filed_label', 'Date Filed')) + '</div>' +
        '<div class="cdp-info-value">' + (claim.claim_date ? new Date(claim.claim_date).toLocaleDateString('en-GB') : '—') + '</div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + escapeHTML(t('dashboard.contract_label', 'Contract')) + '</div>' +
        '<div class="cdp-info-value">#' + escapeHTML(claim.contract_id) + '</div></div>' +
      '<div class="cdp-info-item"><div class="cdp-info-label">' + escapeHTML(t('dashboard.location_label', 'Location')) + '</div>' +
        '<div class="cdp-info-value">' + escapeHTML(claim.incident_location || t('dashboard.not_specified', 'Not specified')) + '</div></div>' +
    '</div></div>' +
    // Description
    '<div class="cdp-section"><div class="cdp-section-title">' + escapeHTML(t('dashboard.description_label', 'Description')) + '</div>' +
      '<div class="cdp-description">' + escapeHTML(claim.description || t('dashboard.no_description_provided', 'No description provided.')) + '</div></div>' +
    // Rejection reason
    (claim.rejection_reason ?
      '<div class="cdp-section"><div class="cdp-section-title">' + escapeHTML(t('dashboard.rejection_reason_title', 'Rejection Reason')) + '</div>' +
      '<div class="cdp-description" style="border-color:#f43f5e;background:#fff1f2;color:#be123c;">' +
      escapeHTML(claim.rejection_reason) + '</div></div>' : '') +
    // Mini timeline
    '<div class="cdp-section"><div class="cdp-section-title">' + escapeHTML(t('dashboard.progress_timeline_title', 'Progress Timeline')) + '</div>' +
      '<div class="cdp-timeline">' + timelineHTML + '</div></div>' +
    // Action hint based on status
    _buildClaimActionHint(claim);

  document.getElementById('claimPanelOverlay').classList.add('open');
  document.getElementById('claimDetailPanel').classList.add('open');
  _syncBodyLock();
};

function _buildClaimActionHint(claim) {
  var hints = {
    pending:         { icon: 'clock', text: t('dashboard.hint_pending', 'Your claim is in the queue. We\'ll notify you when our team starts the review.') },
    under_review:    { icon: 'search', text: t('dashboard.hint_under_review', 'Our team is reviewing your claim. An expert may be assigned shortly.') },
    expert_assigned: { icon: 'user', text: t('dashboard.hint_expert_assigned', 'An expert has been assigned and will contact you. Please be available.') },
    reported:        { icon: 'clipboard', text: t('dashboard.hint_reported', 'The expert has submitted their report. A decision will follow shortly.') },
    approved:        { icon: 'check', text: t('dashboard.hint_approved', 'Your claim has been approved. Compensation details will be communicated soon.') },
    closed:          { icon: 'check', text: t('dashboard.hint_closed', 'This claim has been closed. Contact support if you have questions.') },
    rejected:        { icon: 'x', text: t('dashboard.hint_rejected', 'This claim was rejected. Contact our support team if you believe this is an error.') },
  };
  var hint = hints[claim.status];
  if (!hint) return '';

  return '<div style="background:#f8f9fa;border:1px solid #e8ebef;border-radius:10px;padding:12px 14px;margin-top:4px;' +
    'display:flex;align-items:flex-start;gap:10px;">' +
    '<span class="cdp-hint-icon">' + getUiIcon(hint.icon) + '</span>' +
    '<div style="font-size:.78rem;color:#555;line-height:1.5;">' + escapeHTML(hint.text) + '</div>' +
  '</div>';
}

window.closeClaimPanel = function () {
  document.getElementById('claimPanelOverlay').classList.remove('open');
  document.getElementById('claimDetailPanel').classList.remove('open');
  _syncBodyLock();
};

/* ============================================================
   NEW CLAIM MODAL
   ============================================================ */
window.openNewClaimModalGeneric = async function () {
  // Use already-loaded contracts, fallback to API
  var active = ALL_CONTRACTS.filter(function (c) { return c.status === 'active'; });

  if (!active.length) {
    // Try fetching
    try {
      var result = await apiRequest('/api/contracts/my');
      ALL_CONTRACTS = (result.ok && result.data.contracts) ? result.data.contracts : [];
      active = ALL_CONTRACTS.filter(function (c) { return c.status === 'active'; });
    } catch (e) {
      showToast(t('dashboard.contracts_load_error', 'Unable to load your contracts. Please try again.'), 'error');
      return;
    }
  }

  if (!active.length) {
    showToast(t('dashboard.no_active_contracts_modal', 'You have no active contracts. Please subscribe to an insurance product first.'), 'error');
    return;
  }

  openNewClaimModal(null, null, active);
};

window.openNewClaimModal = function (contractId, policyRef, contractList) {
  var modal = document.getElementById('newClaimModal');
  if (!modal) return;

  document.getElementById('claimFormError').style.display = 'none';
  document.getElementById('claimFormError').textContent   = '';
  document.getElementById('ncDescription').value          = '';
  document.getElementById('ncClaimDate').value            = new Date().toISOString().slice(0, 10);
  document.getElementById('ncLocation').value             = '';

  var select = document.getElementById('ncContractSelect');
  var pool   = contractList || ALL_CONTRACTS.filter(function (c) { return c.status === 'active'; });

  select.innerHTML = !pool.length
    ? '<option value="">— No active contracts found —</option>'
    : '<option value="">— Select a contract —</option>' +
      pool.map(function (c) {
        return '<option value="' + c.contract_id + '">' +
          (c.policy_reference || '#' + c.contract_id) +
          ' — ' + (c.product_name || 'Insurance') +
          ' (expires ' + (c.end_date ? new Date(c.end_date).toLocaleDateString('en-GB') : '') + ')' +
          '</option>';
      }).join('');

  if (contractId) select.value = String(contractId);

  modal.classList.add('open');
  _syncBodyLock();
  setTimeout(function () { document.getElementById('ncDescription').focus(); }, 100);
};

window.closeNewClaimModal = function () {
  var modal = document.getElementById('newClaimModal');
  if (modal) modal.classList.remove('open');
  _syncBodyLock();
};

window.submitNewClaim = async function () {
  var contractId  = document.getElementById('ncContractSelect').value;
  var description = document.getElementById('ncDescription').value.trim();
  var claimDate   = document.getElementById('ncClaimDate').value;
  var location    = document.getElementById('ncLocation').value.trim();
  var errEl       = document.getElementById('claimFormError');
  var submitBtn   = document.getElementById('ncSubmitBtn');

  function showErr(msg) { errEl.textContent = msg; errEl.style.display = 'block'; }
  if (!contractId)              { showErr(t('dashboard.err_select_contract', 'Please select a contract.')); return; }
  if (description.length < 10) { showErr(t('dashboard.err_description_length', 'Description must be at least 10 characters.')); return; }
  if (!claimDate)               { showErr(t('dashboard.err_enter_incident_date', 'Please enter the incident date.')); return; }

  errEl.style.display = 'none';
  submitBtn.disabled    = true;
  submitBtn.textContent = t('dashboard.submitting', 'Submitting…');

  var result;
  try {
    result = await apiRequest('/api/claims', {
      method: 'POST',
      body: {
        contract_id:       parseInt(contractId, 10),
        description:       description,
        claim_date:        claimDate,
        incident_location: location || null,
      }
    });
  } catch (e) {
    showErr(t('dashboard.network_error_check_connection', 'Network error — please check your connection.'));
    submitBtn.disabled = false; submitBtn.textContent = t('dashboard.submit_claim_button', 'Submit Claim');
    return;
  }

  if (!result.ok) {
    showErr(result.data.error || t('dashboard.failed_submit_claim', 'Failed to submit claim (HTTP ' + result.status + ').'));
    submitBtn.disabled = false; submitBtn.textContent = t('dashboard.submit_claim_button', 'Submit Claim');
    return;
  }

  closeNewClaimModal();
  showToast(t('dashboard.claim_submitted_success', 'Claim submitted successfully!'));
  await loadClaims();
  renderAlertBanners();
  renderRecentActivity();
  renderContextualNextStep();
  if (typeof window.refreshNotifications === 'function') window.refreshNotifications();
  submitBtn.disabled = false; submitBtn.textContent = t('dashboard.submit_claim_button', 'Submit Claim');
};

/* ============================================================
   TOAST
   ============================================================ */
function showToast(msg, type) {
  var t = document.getElementById('caar-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'caar-toast';
    t.style.cssText = 'position:fixed;bottom:28px;right:28px;z-index:9999;' +
      'padding:14px 22px;border-radius:10px;font-size:.84rem;font-weight:600;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.18);transition:opacity .3s ease;max-width:340px;';
    document.body.appendChild(t);
  }
  t.style.background = (type === 'error') ? '#c53030' : '#1a1a1a';
  t.style.color      = '#fff';
  t.style.opacity    = '1';
  t.textContent      = msg;
  clearTimeout(t._timer);
  t._timer = setTimeout(function () { t.style.opacity = '0'; }, 3500);
}

/* ============================================================
   ROADSIDE
   ============================================================ */
var selectedProblemType = '';

async function loadRoadsideRequests() {
  var list = document.getElementById('roadsideRequestsList');
  if (list) {
    list.innerHTML = '<div class="roadside-list-empty">' + escapeHTML(t('dashboard.loading_roadside', 'Loading your requests...')) + '</div>';
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
  }

  var result;
  try {
    result = await apiRequest('/api/roadside/requests/my');
  } catch (e) {
    if (list) {
      list.innerHTML = '<div class="roadside-list-empty" style="color:#c53030;">' + escapeHTML(t('dashboard.network_error_loading_roadside', 'Network error while loading requests.')) + '</div>';
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
    }
    return;
  }

  if (!result.ok) {
    if (list) {
      list.innerHTML = '<div class="roadside-list-empty" style="color:#c53030;">' + escapeHTML(t('dashboard.unable_load_roadside', { status: result.status })) + '</div>';
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
    }
    return;
  }

  ALL_ROADSIDE = result.data.requests || [];
  renderRoadsideRequests();
  renderRecentActivity();
  renderAlertBanners();
}

function renderRoadsideRequests() {
  var list = document.getElementById('roadsideRequestsList');
  if (!list) return;

  if (!ALL_ROADSIDE.length) {
    list.innerHTML = '<div class="roadside-list-empty">' + escapeHTML(t('dashboard.roadside_empty', 'Your roadside requests will appear here after submission.')) + '</div>';
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
    return;
  }

  list.innerHTML = ALL_ROADSIDE.map(function (r) {
    var sc = ROADSIDE_STATUS[r.status] || { cls: 'status-badge--pending', label: r.status || 'Pending' };
    var created = r.created_at ? new Date(r.created_at).toLocaleDateString('en-GB') : '';
    var vehicle = r.vehicle_label || r.license_plate || ('Contract #' + r.contract_id);
    return '<div class="roadside-request-item">' +
      '<div class="roadside-request-top">' +
        '<div>' +
          '<div class="roadside-request-ref">' + escapeHTML(r.request_reference || '#' + r.request_id) + '</div>' +
          '<div class="roadside-request-meta">' + escapeHTML(created) + ' - ' + escapeHTML(vehicle) + '</div>' +
        '</div>' +
        '<span class="status-badge ' + sc.cls + '">' + escapeHTML(statusText(sc, 'status.' + r.status, r.status)) + '</span>' +
      '</div>' +
      '<div class="roadside-request-desc">' + escapeHTML(r.problem_type ? r.problem_type : t('dashboard.assistance_request', 'Assistance')) + ' - ' + escapeHTML(r.location_address || r.city || '') + '</div>' +
    '</div>';
  }).join('');
  if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
}

window.submitRoadsideRequest = async function () {
  var contractId = (document.getElementById('rfContractSelect') || {}).value || '';
  var plate   = (document.getElementById('rfLicensePlate') || {}).value || '';
  var brand   = ((document.getElementById('rfBrand') || {}).value || '').trim();
  var wilaya  = (document.getElementById('rfWilaya') || {}).value || '';
  var city    = ((document.getElementById('rfCity') || {}).value || '').trim();
  var address = ((document.getElementById('rfAddress') || {}).value || '').trim();
  var desc    = ((document.getElementById('rfDescription') || {}).value || '').trim();
  var phone   = ((document.getElementById('rfPhone') || {}).value || '').trim();

  if (!selectedProblemType) { showToast(t('dashboard.roadside_err_select_problem', 'Please select the type of problem.'), 'error'); return; }
  if (!contractId) { showToast(t('dashboard.roadside_err_select_contract', 'Please select an active roadside assistance contract.'), 'error'); return; }
  if (!plate)   { showToast(t('dashboard.roadside_err_enter_plate', 'Please enter your license plate.'), 'error'); return; }
  if (!wilaya)  { showToast(t('dashboard.roadside_err_select_wilaya', 'Please select your wilaya.'), 'error'); return; }
  if (!address) { showToast(t('dashboard.roadside_err_enter_location', 'Please enter your location.'), 'error'); return; }
  if (!desc)    { showToast(t('dashboard.roadside_err_describe_problem', 'Please describe the problem.'), 'error'); return; }
  if (!phone)   { showToast(t('dashboard.roadside_err_enter_phone', 'Please enter your phone number.'), 'error'); return; }

  var btn = document.getElementById('btnRoadsideSubmit');
  if (btn) { btn.disabled = true; btn.textContent = t('dashboard.roadside_sending', 'Sending...'); }

  try {
    var activeRoadside = ALL_CONTRACTS.filter(function (co) {
      return co.status === 'active' && /roadside assistance/i.test(co.product_name || '');
    });

    if (!activeRoadside.length) {
      showToast(t('dashboard.roadside_err_need_contract', 'You need an active Roadside Assistance contract before submitting a request.'), 'error');
      return;
    }

    var contract = activeRoadside.find(function (co) {
      return String(co.contract_id) === String(contractId);
    });
    if (!contract) {
      showToast(t('dashboard.roadside_err_contract_unavailable', 'Selected roadside contract is not available.'), 'error');
      return;
    }

    var result = await apiRequest('/api/roadside/requests', {
      method: 'POST',
      body: {
        contract_id:      parseInt(contract.contract_id, 10),
        problem_type:     selectedProblemType,
        description:      desc,
        phone:            phone,
        address:          address,
        wilaya:           wilaya,
        city:             city || null,
        license_plate:    plate,
        vehicle_label:    brand || null,
      }
    });

    if (!result.ok) {
      showToast((result.data && result.data.error) || t('dashboard.roadside_failed_submit', 'Failed to submit roadside request.'), 'error');
      return;
    }

    var refEl = document.getElementById('rsRequestRef');
    if (refEl) refEl.textContent = result.data.request_reference || ('REQ #' + result.data.request_id);
    var body = document.getElementById('roadsideFormBody');
    if (body) body.style.display = 'none';
    var success = document.getElementById('roadsideSuccess');
    if (success) { success.style.display = 'block'; success.classList.add('show'); }

    // Add to local list and refresh alerts
    ALL_ROADSIDE.unshift({
      request_id: result.data.request_id,
      request_reference: result.data.request_reference,
      contract_id: contract.contract_id,
      problem_type: selectedProblemType,
      location_address: address,
      city: city || null,
      description: desc,
      status: 'pending',
      created_at: new Date().toISOString(),
      license_plate: plate,
      vehicle_label: brand || contract.vehicle_label || null,
    });
    renderRoadsideRequests();
    renderAlertBanners();
    renderRecentActivity();
    renderContextualNextStep();
    if (typeof window.refreshNotifications === 'function') window.refreshNotifications();
    showToast(t('dashboard.roadside_submitted_success', 'Roadside request submitted successfully.'));

  } catch (_) {
    showToast(t('dashboard.roadside_network_error', 'Network error while sending the roadside request.'), 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = t('dashboard.roadside_send_button', 'Send Assistance Request'); }
  }
};

window.resetRoadsideForm = function () {
  ['rfLicensePlate', 'rfBrand', 'rfAddress', 'rfDescription', 'rfPhone', 'rfCity']
    .forEach(function (id) { var el = document.getElementById(id); if (el) el.value = ''; });
  selectedProblemType = '';
  document.querySelectorAll('.rf-problem-chip').forEach(function (c) { c.classList.remove('selected'); });
  var problem = document.getElementById('rfProblemType');
  if (problem) problem.value = '';
  populateRoadsideContractSelect();
  var body = document.getElementById('roadsideFormBody');
  if (body) body.style.display = '';
  var success = document.getElementById('roadsideSuccess');
  if (success) { success.style.display = 'none'; success.classList.remove('show'); }
};

/* ============================================================
   MESSAGES
   ============================================================ */
window.loadMessages = async function () {
  var list = document.getElementById('messagesList');
  if (!list) return;
  list.innerHTML = '<div class="messages-empty">' + escapeHTML(t('dashboard.loading_messages', 'Loading your messages...')) + '</div>';
  if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);

  var result;
  try {
    result = await apiRequest('/api/messages/my');
  } catch (e) {
    list.innerHTML = '<div class="messages-empty" style="color:#c53030;">' + escapeHTML(t('dashboard.network_error_loading_messages', 'Network error while loading messages.')) + '</div>';
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
    return;
  }

  if (!result.ok) {
    list.innerHTML = '<div class="messages-empty" style="color:#c53030;">' + escapeHTML(t('dashboard.unable_load_messages', { status: result.status })) + '</div>';
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
    return;
  }

  ALL_MESSAGES = result.data.messages || [];
  renderMessages();
};

function renderMessages() {
  var list = document.getElementById('messagesList');
  if (!list) return;

  if (!ALL_MESSAGES.length) {
    list.innerHTML = '<div class="messages-empty">' + escapeHTML(t('dashboard.no_messages_yet', 'No messages yet. Send your first message using the form.')) + '</div>';
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(list);
    return;
  }

  list.innerHTML = ALL_MESSAGES.map(function (m) {
    var role = m.sender_role || 'client';
    var status = m.status || 'new';
    return '<article class="message-item">' +
      '<div class="message-item-head">' +
        '<div class="message-item-subject">' + escapeHTML(m.subject || 'Message') + '</div>' +
        '<div class="message-item-date">' + escapeHTML(formatDateTime(m.created_at)) + '</div>' +
      '</div>' +
      '<div class="message-item-meta">' +
        '<span class="message-role-chip">' + escapeHTML(role) + '</span>' +
        '<span class="message-status-chip">' + escapeHTML(status) + '</span>' +
      '</div>' +
      '<div class="message-item-content">' + escapeHTML(m.content || m.message || '') + '</div>' +
    '</article>';
  }).join('');
}

window.submitDashboardMessage = async function () {
  var subjectEl = document.getElementById('msgSubject');
  var contentEl = document.getElementById('msgContent');
  var submitBtn = document.getElementById('msgSubmitBtn');
  var subject = (subjectEl ? subjectEl.value : '').trim();
  var message = (contentEl ? contentEl.value : '').trim();

  if (!subject) {
    showToast(t('dashboard.err_enter_message_subject', 'Please enter a message subject.'), 'error');
    return;
  }
  if (message.length < 10) {
    showToast(t('dashboard.err_message_length', 'Message must be at least 10 characters.'), 'error');
    return;
  }

  var user = JSON.parse(localStorage.getItem('user') || 'null') || _authUser || {};
  var name = ((user.first_name || '') + ' ' + (user.last_name || '')).trim() || user.email || 'Client';
  var email = user.email || '';
  if (!email) {
    showToast(t('dashboard.err_account_email_missing', 'Your account email is missing. Please refresh and sign in again.'), 'error');
    return;
  }

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = t('dashboard.sending', 'Sending...'); }

  var result;
  try {
    result = await apiRequest('/api/messages', {
      method: 'POST',
      body: {
        name: name,
        email: email,
        phone: user.phone || null,
        subject: subject,
        message: message,
      },
    });
  } catch (e) {
    showToast(t('dashboard.network_error_sending_message', 'Network error while sending your message.'), 'error');
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = t('dashboard.send_message_button', 'Send Message'); }
    return;
  }

  if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = t('dashboard.send_message_button', 'Send Message'); }

  if (!result.ok) {
    showToast((result.data && result.data.error) || t('dashboard.unable_send_message', 'Unable to send message.'), 'error');
    return;
  }

  if (subjectEl) subjectEl.value = '';
  if (contentEl) contentEl.value = '';
  showToast(t('dashboard.message_sent_success', 'Message sent successfully.'));
  await window.loadMessages();
};

/* ============================================================
   PROFILE
   ============================================================ */
window.saveProfile = function () {
  var first = (document.getElementById('pf-first') || {}).value || '';
  var last  = (document.getElementById('pf-last')  || {}).value || '';
  if (!first || !last) { showToast(t('profile.err_name_empty', 'Name fields cannot be empty.'), 'error'); return; }
  var ok = document.getElementById('pfb-success');
  if (ok) { ok.style.display = 'flex'; setTimeout(function () { ok.style.display = 'none'; }, 3000); }
  showToast(t('profile.saved', 'Profile saved.'));
};

window.cancelProfile = function () {
  var user = JSON.parse(localStorage.getItem('user') || 'null') || _authUser || {};
  var values = {
    'pf-first': user.first_name || '',
    'pf-last':  user.last_name  || '',
    'pf-email': user.email      || '',
    'pf-phone': user.phone      || '',
  };
  Object.keys(values).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.value = values[id];
  });
};

window.changePassword = function () {
  var pw1   = (document.getElementById('pf-pw-new')     || {}).value || '';
  var pw2   = (document.getElementById('pf-pw-confirm') || {}).value || '';
  var errEl = document.getElementById('pfb-pw-error');
  var okEl  = document.getElementById('pfb-pw-success');
  if (pw1 !== pw2) {
    if (errEl) errEl.style.display = 'flex';
    setTimeout(function () { if (errEl) errEl.style.display = 'none'; }, 3000);
    return;
  }
  if (okEl) { okEl.style.display = 'flex'; setTimeout(function () { okEl.style.display = 'none'; }, 3000); }
  showToast(t('profile.password_updated', 'Password updated.'));
};

/* ============================================================
   KEYBOARD
   ============================================================ */
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    if (typeof window.closeClaimPanel    === 'function') window.closeClaimPanel();
    if (typeof window.closeNewClaimModal === 'function') window.closeNewClaimModal();
  }
});

window.addEventListener('resize', function () {
  if (window.innerWidth > 768) {
    window.closeSidebar();
  } else {
    _syncBodyLock();
  }
});
