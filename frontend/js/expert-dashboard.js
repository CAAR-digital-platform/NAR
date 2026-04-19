'use strict';

(function () {
  const ROLE_HOME = {
    client: 'client-dashboard.html',
    admin: 'admin-dashboard.html',
    expert: 'expert-dashboard.html',
  };

  let LAST_EXPERT = null;

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

  function badge(status) {
    return '<span class="status ' + esc(status) + '">' + esc((status || '').replace(/_/g, ' ')) + '</span>';
  }

  function renderExpertProfile(expert) {
    const box = document.getElementById('expertProfile');
    if (!box) return;

    if (!expert) {
      box.innerHTML = '<div class="kv-row"><span>Profile</span><strong>Not found</strong></div>';
      return;
    }

    box.innerHTML = [
      '<div class="kv-row"><span>Specialization</span><strong>' + esc(expert.specialization || '-') + '</strong></div>',
      '<div class="kv-row"><span>Agency</span><strong>' + esc(expert.agency_name || '-') + '</strong></div>',
      '<div class="kv-row"><span>Wilaya</span><strong>' + esc(expert.wilaya_name || '-') + '</strong></div>'
    ].join('');

    const av = document.getElementById('expertAvailability');
    if (av) {
      av.value = expert.is_available ? 'true' : 'false';
    }
  }

  function renderClaims(claims) {
    const body = document.getElementById('expertClaimsBody');
    if (!body) return;

    if (!claims || !claims.length) {
      body.innerHTML = '<tr><td colspan="5">No assigned claims yet.</td></tr>';
      return;
    }

    body.innerHTML = claims.map((c) => [
      '<tr>',
      '  <td>#' + esc(c.claim_id) + '<br/><small>' + esc(c.contract_id) + '</small></td>',
      '  <td>' + esc(c.client_name || '-') + '<br/><small>' + esc(c.client_email || '-') + '</small></td>',
      '  <td>' + badge(c.status) + '</td>',
      '  <td>' + esc(c.description || '-') + '</td>',
      '  <td><button class="btn btn-light" style="padding:6px 8px;font-size:.72rem;" onclick="window.__expertPickClaim(' + c.claim_id + ')">Fill Form</button></td>',
      '</tr>'
    ].join('')).join('');
  }

  async function loadAll() {
    setMsg('Loading expert data...', false);

    const [statsRes, assignedRes] = await Promise.all([
      api('/api/dashboard/stats'),
      api('/api/claims/expert/my-assignments'),
    ]);

    if (!statsRes.ok) {
      setMsg((statsRes.data && statsRes.data.error) || 'Failed to load expert stats.', true);
      return;
    }

    const stats = statsRes.data || {};
    setStat('esAssigned', stats.assigned_claims || 0);
    setStat('esProgress', stats.in_progress_claims || 0);
    setStat('esCompleted', stats.completed_claims || 0);
    setStat('esReports', stats.reports_submitted || 0);

    if (!assignedRes.ok) {
      setMsg((assignedRes.data && assignedRes.data.error) || 'Failed to load assigned claims.', true);
      renderClaims([]);
      return;
    }

    LAST_EXPERT = assignedRes.data.expert || null;
    renderExpertProfile(LAST_EXPERT);
    renderClaims(assignedRes.data.claims || []);

    setMsg('Expert data loaded.', false);
    setTimeout(() => setMsg('', false), 1400);
  }

  async function submitReport() {
    const claimId = parseInt((document.getElementById('reportClaimId') || {}).value, 10);
    const reportDate = (document.getElementById('reportDate') || {}).value;
    const estimatedDamage = parseFloat((document.getElementById('reportDamage') || {}).value);
    const conclusion = (document.getElementById('reportConclusion') || {}).value;
    const report = (document.getElementById('reportText') || {}).value || '';

    if (!claimId || isNaN(claimId)) {
      setMsg('Please choose a valid claim ID.', true);
      return;
    }
    if (!reportDate) {
      setMsg('Please choose report date.', true);
      return;
    }
    if (isNaN(estimatedDamage) || estimatedDamage < 0) {
      setMsg('Please provide a valid estimated damage amount.', true);
      return;
    }
    if (report.trim().length < 10) {
      setMsg('Report details must be at least 10 characters.', true);
      return;
    }

    const res = await api('/api/claims/expert-reports', {
      method: 'POST',
      body: {
        claim_id: claimId,
        report,
        estimated_damage: estimatedDamage,
        report_date: reportDate,
        conclusion: conclusion || null,
      },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to submit report.', true);
      return;
    }

    setMsg('Report submitted successfully.', false);
    document.getElementById('reportText').value = '';
    document.getElementById('reportDamage').value = '';
    loadAll();
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

  function pickClaim(claimId) {
    const field = document.getElementById('reportClaimId');
    if (field) field.value = claimId;
    const reportDate = document.getElementById('reportDate');
    if (reportDate && !reportDate.value) {
      reportDate.value = new Date().toISOString().slice(0, 10);
    }
    setMsg('Claim #' + claimId + ' selected. Complete the report form.', false);
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

  window.__expertPickClaim = pickClaim;

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
