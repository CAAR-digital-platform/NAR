'use strict';

(function () {
  const ROLE_HOME = {
    client: 'client-dashboard.html',
    admin: 'admin-dashboard.html',
    expert: 'expert-dashboard.html',
  };

  const ICON = window.CAARIcons && typeof window.CAARIcons.render === 'function'
    ? window.CAARIcons.render
    : function () { return ''; };

  let ASSIGNED_CLAIMS = [];
  let ACTIONABLE_CLAIMS = [];

  const STATUS_LABELS = {
    pending: 'Pending',
    under_review: 'Under Review',
    expert_assigned: 'Assigned',
    reported: 'Reported',
    approved: 'Approved',
    rejected: 'Rejected',
    closed: 'Closed',
  };

  const STATUS_ICON = {
    pending: 'clock',
    under_review: 'search',
    expert_assigned: 'userCheck',
    reported: 'fileText',
    approved: 'checkCircle',
    rejected: 'xCircle',
    closed: 'checkCircle',
  };

  function guardExpert() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
      window.location.href = 'login.html?returnTo=' + encodeURIComponent('expert-dashboard.html');
      return false;
    }

    if (user.role !== 'expert') {
      window.location.href = ROLE_HOME[user.role] || 'index.html';
      return false;
    }

    const mustChange = Boolean(user.must_change_password) || localStorage.getItem('must_change_password') === '1';
    if (mustChange) {
      window.location.href = 'change-password.html';
      return false;
    }

    return true;
  }

  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function paintStaticIcons() {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      const name = el.getAttribute('data-icon');
      if (!name) return;
      el.innerHTML = ICON(name, 16, 'ui-icon');
    });
  }

  function api(path, opts) {
    if (typeof window.apiRequest === 'function') {
      return window.apiRequest(path, opts || {});
    }

    const token = localStorage.getItem('token');
    const headers = Object.assign({ 'Content-Type': 'application/json' }, (opts && opts.headers) || {});
    if (token) headers.Authorization = 'Bearer ' + token;

    return fetch('http://localhost:3000' + path, {
      method: (opts && opts.method) || 'GET',
      headers,
      body: opts && opts.body ? JSON.stringify(opts.body) : undefined,
    })
      .then(async (res) => ({ ok: res.ok, status: res.status, data: await res.json().catch(() => ({})) }));
  }

  function setMsg(message, isError) {
    const el = document.getElementById('expertApiMsg');
    if (!el) return;
    if (!message) {
      el.className = 'api-msg';
      el.textContent = '';
      return;
    }
    el.className = 'api-msg ' + (isError ? 'err' : 'ok');
    el.textContent = message;
  }

  function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null ? '-' : String(value);
  }

  function setNoClaimsState(show) {
    const noClaimsEl = document.getElementById('noClaimsMsg');
    const claimSelect = document.getElementById('reportClaimSelect');
    const submitBtn = document.getElementById('submitReportBtn');
    if (noClaimsEl) {
      noClaimsEl.style.display = show ? 'block' : 'none';
      noClaimsEl.textContent = show ? 'No assigned claims ready for report submission' : '';
    }
    if (claimSelect) claimSelect.disabled = show;
    if (submitBtn) submitBtn.disabled = show;
  }

  function normalizeStatus(status) {
    return String(status || '')
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, '_');
  }

  function badge(status) {
    const key = normalizeStatus(status);
    const icon = STATUS_ICON[key] ? ICON(STATUS_ICON[key], 14, 'status-icon') : '';
    return '<span class="status status--' + esc(key) + '">' + icon + esc(STATUS_LABELS[key] || key.replace(/_/g, ' ')) + '</span>';
  }

  function renderClaims(claims) {
    const cards = document.getElementById('expertClaimsCards');
    if (!cards) return;

    if (!claims || !claims.length) {
      cards.innerHTML = '<div class="empty-state">No assigned claims available yet.</div>';
      return;
    }

    cards.innerHTML = claims.map((c) => [
      '<article class="claim-card">',
      '  <div class="claim-card-head">',
      '    <div>',
      '      <div class="claim-card-id">Claim #' + esc(c.claim_id) + ' - Contract ' + esc(c.contract_id || '-') + '</div>',
      '      <div class="claim-client">' + ICON('user', 14, '') + esc(c.client_name || '-') + '</div>',
      '      <div class="claim-email">' + esc(c.client_email || '-') + '</div>',
      '    </div>',
      '    <div>' + badge(c.status) + '</div>',
      '  </div>',
      '  <div class="claim-desc">' + esc(c.description || 'No claim description provided.') + '</div>',
      '</article>'
    ].join('')).join('');
  }

  function renderClaimSelection(claims) {
    const select = document.getElementById('reportClaimSelect');
    if (!select) return;

    if (!claims.length) {
      select.innerHTML = '<option value="">No claims available for reporting</option>';
      setNoClaimsState(true);
      return;
    }

    setNoClaimsState(false);
    select.innerHTML = ['<option value="">Select assigned claim...</option>']
      .concat(claims.map((c) => '<option value="' + c.claim_id + '">Claim #' + esc(c.claim_id) + ' - ' + esc(c.client_name || 'Unknown client') + '</option>'))
      .join('');
  }

  function updateMetrics(actionableClaims) {
    const assignedCount = ASSIGNED_CLAIMS.length;
    const inProgress = ASSIGNED_CLAIMS.filter(function (c) { return normalizeStatus(c.status) === 'expert_assigned'; }).length;
    const completed = ASSIGNED_CLAIMS.filter(function (c) {
      const s = normalizeStatus(c.status);
      return s === 'approved' || s === 'rejected' || s === 'closed';
    }).length;
    const reports = ASSIGNED_CLAIMS.filter(function (c) {
      const s = normalizeStatus(c.status);
      return s === 'reported' || s === 'approved' || s === 'rejected' || s === 'closed';
    }).length;

    setStat('esAssigned', assignedCount);
    setStat('esProgress', inProgress);
    setStat('esCompleted', completed);
    setStat('esReports', reports);
  }

  function setAvailabilityView(isAvailable) {
    const toggle = document.getElementById('expertAvailabilityToggle');
    const stateLabel = document.getElementById('availabilityStateLabel');
    if (toggle) toggle.checked = Boolean(isAvailable);
    if (stateLabel) stateLabel.textContent = isAvailable ? 'Available' : 'Busy';
  }

  async function loadAll() {
    setMsg('Loading expert data...', false);

    const assignedRes = await api('/api/claims/expert/my-assignments');

    if (!assignedRes.ok) {
      setMsg((assignedRes.data && assignedRes.data.error) || 'Failed to load assigned claims.', true);
      renderClaims([]);
      renderClaimSelection([]);
      updateMetrics([]);
      return;
    }

    ASSIGNED_CLAIMS = Array.isArray(assignedRes.data.claims) ? assignedRes.data.claims : [];

    ACTIONABLE_CLAIMS = ASSIGNED_CLAIMS;

    const expert = assignedRes.data.expert || null;
    if (expert) setAvailabilityView(Boolean(expert.is_available));

    renderClaims(ACTIONABLE_CLAIMS);
    renderClaimSelection(ACTIONABLE_CLAIMS);
    updateMetrics(ACTIONABLE_CLAIMS);

    setMsg('Expert data loaded.', false);
    setTimeout(() => setMsg('', false), 1400);
  }

  async function submitReport() {
    const claimId = parseInt((document.getElementById('reportClaimSelect') || {}).value, 10);
    const reportDate = (document.getElementById('reportDate') || {}).value;
    const estimatedDamage = parseFloat((document.getElementById('reportDamage') || {}).value);
    const conclusion = (document.getElementById('reportConclusion') || {}).value;
    const reportValue = ((document.getElementById('reportValue') || {}).value || '').trim();
    const reportDetails = ((document.getElementById('reportDetails') || {}).value || '').trim();

    if (!claimId || isNaN(claimId)) {
      setMsg('Please choose an assigned claim.', true);
      return;
    }

    const selectedClaim = ACTIONABLE_CLAIMS.find((claim) => claim.claim_id === claimId);
    if (!selectedClaim) {
      setMsg('Invalid claim selection for this account.', true);
      return;
    }
    if (!reportDate) {
      setMsg('Please choose report date.', true);
      return;
    }
    if (isNaN(estimatedDamage) || estimatedDamage <= 0) {
      setMsg('Estimated damage must be greater than 0.', true);
      return;
    }
    if (reportDetails.length < 10) {
      setMsg('Report details must be at least 10 characters.', true);
      return;
    }

    const res = await api('/api/claims/expert-reports', {
      method: 'POST',
      body: {
        claim_id: claimId,
        report: reportValue || reportDetails,
        estimated_damage: estimatedDamage,
        report_date: reportDate,
        conclusion: conclusion || null,
        report_details: reportDetails,
      },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to submit report.', true);
      return;
    }

    setMsg('Report submitted successfully.', false);
    const reportField = document.getElementById('reportValue');
    const reportDetailsField = document.getElementById('reportDetails');
    const damageField = document.getElementById('reportDamage');
    if (reportField) reportField.value = '';
    if (reportDetailsField) reportDetailsField.value = '';
    if (damageField) damageField.value = '';
    const claimSelect = document.getElementById('reportClaimSelect');
    if (claimSelect) claimSelect.value = '';
    await loadAll();
  }

  async function saveAvailability() {
    const toggle = document.getElementById('expertAvailabilityToggle');
    if (!toggle) return;
    const isAvailable = Boolean(toggle.checked);

    const res = await api('/api/claims/expert/availability', {
      method: 'PATCH',
      body: { is_available: isAvailable },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to update availability.', true);
      return;
    }

    setMsg('Availability updated.', false);
    setAvailabilityView(isAvailable);
    setTimeout(function () { setMsg('', false); }, 1300);
  }

  function bindTopActions() {
    const refresh = document.getElementById('expertRefresh');
    const logoutBtn = document.getElementById('expertLogout');
    const home = document.getElementById('expertHome');
    const submitBtn = document.getElementById('submitReportBtn');
    const availabilityToggle = document.getElementById('expertAvailabilityToggle');

    if (refresh) refresh.addEventListener('click', loadAll);
    if (home) home.addEventListener('click', function () { window.location.href = 'index.html'; });
    if (submitBtn) submitBtn.addEventListener('click', submitReport);
    if (availabilityToggle) availabilityToggle.addEventListener('change', saveAvailability);

    if (logoutBtn) logoutBtn.addEventListener('click', function () {
      if (typeof window.logout === 'function') {
        window.logout();
        return;
      }
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('caar_auth_token');
      localStorage.removeItem('must_change_password');
      window.location.href = 'index.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!guardExpert()) return;
    paintStaticIcons();
    bindTopActions();

    const reportDate = document.getElementById('reportDate');
    if (reportDate) {
      reportDate.value = new Date().toISOString().slice(0, 10);
    }

    loadAll();
  });
})();
