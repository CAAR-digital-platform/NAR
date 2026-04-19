'use strict';

(function () {
  const ROLE_HOME = {
    client: 'client-dashboard.html',
    admin: 'admin-dashboard.html',
    expert: 'expert-dashboard.html',
  };

  const STATE = {
    experts: [],
  };

  function guardAdmin() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');

    if (!token || !user) {
      window.location.href = 'login.html?returnTo=' + encodeURIComponent('admin-dashboard.html');
      return false;
    }

    if (user.role !== 'admin') {
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
    const el = document.getElementById('adminApiMsg');
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

  async function loadAll() {
    setMsg('Loading admin data...', false);

    const [statsRes, claimsRes, reportsRes, messagesRes, appsRes, roadsideRes, usersRes, expertsRes] = await Promise.all([
      api('/api/dashboard/stats'),
      api('/api/claims'),
      api('/api/claims/expert-reports'),
      api('/api/messages'),
      api('/api/applications'),
      api('/api/roadside/requests'),
      api('/api/admin/users'),
      api('/api/admin/experts'),
    ]);

    if (!statsRes.ok) {
      setMsg(statsRes.data && statsRes.data.error ? statsRes.data.error : 'Failed to load admin dashboard stats.', true);
      return;
    }

    const stats = statsRes.data || {};
    setStat('sClients', stats.total_clients || 0);
    setStat('sContracts', stats.total_contracts || 0);
    setStat('sClaims', stats.total_claims || 0);
    setStat('sPayments', stats.total_payments || 0);
    setStat('sMessages', stats.total_messages || 0);
    setStat('sApplications', stats.total_applications || 0);

    renderClaims(claimsRes.ok ? claimsRes.data.claims : []);
    renderReports(reportsRes.ok ? reportsRes.data.reports : []);
    renderMessages(messagesRes.ok ? messagesRes.data.messages : []);
    renderApplications(appsRes.ok ? appsRes.data.applications : []);
    renderRoadside(roadsideRes.ok ? roadsideRes.data.requests : []);
    renderUsers(usersRes.ok ? usersRes.data.users : []);

    STATE.experts = expertsRes.ok ? (expertsRes.data.experts || []) : [];
    if (claimsRes.ok) {
      renderClaims(claimsRes.data.claims || []);
    }

    setMsg('Admin data loaded.', false);
    setTimeout(() => setMsg('', false), 1400);
  }

  function renderClaims(list) {
    const body = document.getElementById('claimsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = '<tr><td colspan="4">No claims found.</td></tr>';
      return;
    }

    const expertOptions = ['<option value="">Assign expert...</option>']
      .concat((STATE.experts || [])
        .filter((ex) => ex.is_active)
        .map((ex) => '<option value="' + ex.expert_id + '">' +
          esc(ex.first_name + ' ' + ex.last_name + ' (#' + ex.expert_id + ')') +
        '</option>'))
      .join('');

    body.innerHTML = list.map((c) => {
      const statusSelectId = 'claim-status-' + c.claim_id;
      const expertSelectId = 'claim-expert-' + c.claim_id;
      return [
        '<tr>',
        '  <td>#' + esc(c.claim_id) + '<br/><small>' + esc(c.contract_id) + '</small></td>',
        '  <td><strong>' + esc(c.client_name || '-') + '</strong><br/><small>' + esc(c.client_email || '-') + '</small></td>',
        '  <td>' + badge(c.status) + '</td>',
        '  <td>',
        '    <select id="' + statusSelectId + '">',
        '      <option value="under_review">under_review</option>',
        '      <option value="expert_assigned">expert_assigned</option>',
        '      <option value="reported">reported</option>',
        '      <option value="approved">approved</option>',
        '      <option value="rejected">rejected</option>',
        '      <option value="closed">closed</option>',
        '    </select>',
        '    <div class="row-actions">',
        '      <button class="tiny-btn" onclick="window.__adminUpdateClaimStatus(' + c.claim_id + ')">Update</button>',
        '    </div>',
        '    <div class="row-actions">',
        '      <select id="' + expertSelectId + '">' + expertOptions + '</select>',
        '      <button class="tiny-btn" onclick="window.__adminAssignExpert(' + c.claim_id + ')">Assign</button>',
        '    </div>',
        '  </td>',
        '</tr>'
      ].join('');
    }).join('');
  }

  function renderReports(list) {
    const body = document.getElementById('reportsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = '<tr><td colspan="4">No reports yet.</td></tr>';
      return;
    }

    body.innerHTML = list.map((r) => [
      '<tr>',
      '  <td>#' + esc(r.claim_id) + '</td>',
      '  <td>' + esc(r.expert_name || '-') + '</td>',
      '  <td>' + esc(r.estimated_damage || 0) + ' DZD</td>',
      '  <td>' + badge(r.conclusion || 'pending_review') + '</td>',
      '</tr>'
    ].join('')).join('');
  }

  function renderMessages(list) {
    const body = document.getElementById('messagesTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = '<tr><td colspan="4">No messages found.</td></tr>';
      return;
    }

    body.innerHTML = list.map((m) => [
      '<tr>',
      '  <td>' + esc(m.name || '-') + '<br/><small>' + esc(m.email || '-') + '</small></td>',
      '  <td>' + esc(m.subject || '-') + '</td>',
      '  <td>' + badge(m.status || 'new') + '</td>',
      '  <td>',
      '    <select id="msg-status-' + m.id + '">',
      '      <option value="new">new</option>',
      '      <option value="read">read</option>',
      '      <option value="replied">replied</option>',
      '    </select>',
      '    <div class="row-actions"><button class="tiny-btn" onclick="window.__adminUpdateMessageStatus(' + m.id + ')">Save</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
  }

  function renderApplications(list) {
    const body = document.getElementById('applicationsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = '<tr><td colspan="4">No applications found.</td></tr>';
      return;
    }

    body.innerHTML = list.map((a) => [
      '<tr>',
      '  <td>' + esc((a.first_name || '') + ' ' + (a.last_name || '')) + '</td>',
      '  <td>' + esc(a.position_sought || a.field_of_interest || '-') + '</td>',
      '  <td>' + badge(a.status || 'pending') + '</td>',
      '  <td>',
      '    <select id="app-status-' + a.id + '">',
      '      <option value="pending">pending</option>',
      '      <option value="reviewed">reviewed</option>',
      '      <option value="accepted">accepted</option>',
      '      <option value="rejected">rejected</option>',
      '    </select>',
      '    <div class="row-actions"><button class="tiny-btn" onclick="window.__adminUpdateApplicationStatus(' + a.id + ')">Save</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
  }

  function renderRoadside(list) {
    const body = document.getElementById('roadsideTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = '<tr><td colspan="4">No roadside requests found.</td></tr>';
      return;
    }

    body.innerHTML = list.map((r) => [
      '<tr>',
      '  <td>' + esc(r.request_reference || ('#' + r.id)) + '</td>',
      '  <td>' + esc(r.problem_type || '-') + '</td>',
      '  <td>' + badge(r.status || 'pending') + '</td>',
      '  <td>',
      '    <select id="road-status-' + r.id + '">',
      '      <option value="pending">pending</option>',
      '      <option value="dispatched">dispatched</option>',
      '      <option value="completed">completed</option>',
      '    </select>',
      '    <div class="row-actions"><button class="tiny-btn" onclick="window.__adminUpdateRoadsideStatus(' + r.id + ')">Save</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
  }

  function renderUsers(list) {
    const body = document.getElementById('usersTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = '<tr><td colspan="4">No users found.</td></tr>';
      return;
    }

    body.innerHTML = list.map((u) => [
      '<tr>',
      '  <td>' + esc((u.first_name || '') + ' ' + (u.last_name || '')) + '<br/><small>' + esc(u.email || '-') + '</small></td>',
      '  <td>' + esc(u.role) + '</td>',
      '  <td>' + badge(u.is_active ? 'active' : 'inactive') + '</td>',
      '  <td><button class="tiny-btn" onclick="window.__adminToggleUser(' + u.id + ', ' + (u.is_active ? 'false' : 'true') + ')">' +
          (u.is_active ? 'Deactivate' : 'Activate') +
      '</button></td>',
      '</tr>'
    ].join('')).join('');
  }

  async function updateClaimStatus(claimId) {
    const select = document.getElementById('claim-status-' + claimId);
    if (!select) return;

    const res = await api('/api/claims/' + claimId + '/status', {
      method: 'PUT',
      body: { status: select.value },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to update claim status.', true);
      return;
    }

    setMsg('Claim status updated.', false);
    loadAll();
  }

  async function assignExpert(claimId) {
    const select = document.getElementById('claim-expert-' + claimId);
    if (!select || !select.value) {
      setMsg('Please choose an expert before assigning.', true);
      return;
    }

    const res = await api('/api/claims/' + claimId + '/assign-expert', {
      method: 'POST',
      body: { expert_id: parseInt(select.value, 10) },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to assign expert.', true);
      return;
    }

    setMsg('Expert assigned successfully.', false);
    loadAll();
  }

  async function updateMessageStatus(messageId) {
    const select = document.getElementById('msg-status-' + messageId);
    if (!select) return;

    const res = await api('/api/messages/' + messageId + '/status', {
      method: 'PATCH',
      body: { status: select.value },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to update message status.', true);
      return;
    }

    setMsg('Message status updated.', false);
    loadAll();
  }

  async function updateApplicationStatus(applicationId) {
    const select = document.getElementById('app-status-' + applicationId);
    if (!select) return;

    const res = await api('/api/applications/' + applicationId + '/status', {
      method: 'PATCH',
      body: { status: select.value },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to update application status.', true);
      return;
    }

    setMsg('Application status updated.', false);
    loadAll();
  }

  async function updateRoadsideStatus(requestId) {
    const select = document.getElementById('road-status-' + requestId);
    if (!select) return;

    const res = await api('/api/roadside/requests/' + requestId + '/status', {
      method: 'PATCH',
      body: { status: select.value },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to update roadside request status.', true);
      return;
    }

    setMsg('Roadside status updated.', false);
    loadAll();
  }

  async function toggleUser(userId, nextIsActive) {
    const res = await api('/api/admin/users/' + userId + '/status', {
      method: 'PATCH',
      body: { is_active: !!nextIsActive },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to update user status.', true);
      return;
    }

    setMsg('User status updated.', false);
    loadAll();
  }

  function bindTopActions() {
    const refresh = document.getElementById('adminRefresh');
    const logoutBtn = document.getElementById('adminLogout');
    const home = document.getElementById('goHome');

    if (refresh) refresh.addEventListener('click', loadAll);
    if (home) home.addEventListener('click', function () { window.location.href = 'index.html'; });
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

  window.__adminUpdateClaimStatus = updateClaimStatus;
  window.__adminAssignExpert = assignExpert;
  window.__adminUpdateMessageStatus = updateMessageStatus;
  window.__adminUpdateApplicationStatus = updateApplicationStatus;
  window.__adminUpdateRoadsideStatus = updateRoadsideStatus;
  window.__adminToggleUser = toggleUser;

  document.addEventListener('DOMContentLoaded', function () {
    if (!guardAdmin()) return;
    bindTopActions();
    loadAll();
  });
})();
