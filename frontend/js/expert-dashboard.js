'use strict';

(function () {
  const ROLE_HOME = {
    client: 'client-dashboard.html',
    admin: 'admin-dashboard.html',
    expert: 'expert-dashboard.html',
  };

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
      noClaimsEl.textContent = show ? 'No claims available for reporting' : '';
    }
    if (claimSelect) claimSelect.disabled = show;
    if (submitBtn) submitBtn.disabled = show;
  }

  function badge(status) {
    const key = (status || '').toLowerCase();
    return '<span class="status ' + esc(key) + '">' + esc(STATUS_LABELS[key] || key.replace(/_/g, ' ')) + '</span>';
  }

  function renderClaims(claims) {
    const body = document.getElementById('expertClaimsBody');
    if (!body) return;

    if (!claims || !claims.length) {
      body.innerHTML = '<tr><td colspan="4">No claims available for reporting</td></tr>';
      return;
    }

    body.innerHTML = claims.map((c) => [
      '<tr>',
      '  <td>#' + esc(c.claim_id) + '<br/><small>' + esc(c.contract_id) + '</small></td>',
      '  <td>' + esc(c.client_name || '-') + '<br/><small>' + esc(c.client_email || '-') + '</small></td>',
      '  <td>' + badge(c.status) + '</td>',
      '  <td>' + esc(c.description || '-') + '</td>',
      '</tr>'
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

  function updateMetrics(claims, actionableClaims) {
    const assignedCount = claims.length;
    const inProgressCount = claims.filter((c) => c.status === 'reported').length;
    const completedCount = claims.filter((c) => c.status === 'approved' || c.status === 'rejected').length;

    setStat('esAssigned', assignedCount);
    setStat('esProgress', inProgressCount);
    setStat('esCompleted', completedCount);
    setStat('esReports', actionableClaims.length);
  }

  async function loadAll() {
    setMsg('Loading expert data...', false);

    const assignedRes = await api('/api/claims/expert/my-assignments');
    console.log('[Expert Dashboard] /api/claims/expert/my-assignments response:', assignedRes);

    if (!assignedRes.ok) {
      setMsg((assignedRes.data && assignedRes.data.error) || 'Failed to load assigned claims.', true);
      renderClaims([]);
      renderClaimSelection([]);
      updateMetrics([], []);
      return;
    }

    ASSIGNED_CLAIMS = Array.isArray(assignedRes.data.claims) ? assignedRes.data.claims : [];
    ACTIONABLE_CLAIMS = ASSIGNED_CLAIMS.filter((claim) => claim.status === 'expert_assigned');
    console.log('[Expert Dashboard] filtered actionable claims:', ACTIONABLE_CLAIMS);

    const expert = assignedRes.data.expert || null;
    const av = document.getElementById('expertAvailability');
    if (av && expert) {
      av.value = expert.is_available ? 'true' : 'false';
    }

    renderClaims(ACTIONABLE_CLAIMS);
    renderClaimSelection(ACTIONABLE_CLAIMS);
    updateMetrics(ASSIGNED_CLAIMS, ACTIONABLE_CLAIMS);

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
    console.log('[Expert Dashboard] selected claim:', selectedClaim || null);
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

    console.log('[Expert Dashboard] /api/claims/expert-reports response:', res);

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
    const av = (document.getElementById('expertAvailability') || {}).value;
    const isAvailable = av === 'true';

    const res = await api('/api/claims/expert/availability', {
      method: 'PATCH',
      body: { is_available: isAvailable },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to update availability.', true);
      return;
    }

    setMsg('Availability updated.', false);
    loadAll();
  }

  function bindTopActions() {
    const refresh = document.getElementById('expertRefresh');
    const logoutBtn = document.getElementById('expertLogout');
    const home = document.getElementById('expertHome');
    const submitBtn = document.getElementById('submitReportBtn');
    const availabilityBtn = document.getElementById('saveAvailabilityBtn');

    if (refresh) refresh.addEventListener('click', loadAll);
    if (home) home.addEventListener('click', function () { window.location.href = 'index.html'; });
    if (submitBtn) submitBtn.addEventListener('click', submitReport);
    if (availabilityBtn) availabilityBtn.addEventListener('click', saveAvailability);

    const claimSelect = document.getElementById('reportClaimSelect');
    if (claimSelect) {
      claimSelect.addEventListener('change', function () {
        const claimId = parseInt(claimSelect.value, 10);
        const selectedClaim = ACTIONABLE_CLAIMS.find((claim) => claim.claim_id === claimId) || null;
        console.log('[Expert Dashboard] selected claim:', selectedClaim);
      });
    }

    if (logoutBtn) logoutBtn.addEventListener('click', function () {
      if (typeof window.logout === 'function') {
        window.logout();
        return;
      }
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('user');
      localStorage.removeItem('caar_auth_token');
      window.location.href = 'index.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!guardExpert()) return;
    bindTopActions();

    const reportDate = document.getElementById('reportDate');
    if (reportDate) {
      reportDate.value = new Date().toISOString().slice(0, 10);
    }

    loadAll();
  });
})();
