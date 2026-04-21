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

  const STATE = {
    experts: [],
  };

  const STATUS_LABELS = {
    pending: 'Pending',
    under_review: 'Under Review',
    expert_assigned: 'Assigned',
    reported: 'Reported',
    approved: 'Approved',
    rejected: 'Rejected',
    closed: 'Closed',
    active: 'Active',
    inactive: 'Inactive',
    new: 'Pending',
    reviewed: 'Under Review',
    accepted: 'Approved',
    completed: 'Closed',
  };

  const STATUS_ICON = {
    pending: 'clock',
    new: 'clock',
    under_review: 'search',
    reviewed: 'search',
    expert_assigned: 'userCheck',
    reported: 'alert',
    approved: 'checkCircle',
    accepted: 'checkCircle',
    active: 'checkCircle',
    completed: 'checkCircle',
    closed: 'checkCircle',
    rejected: 'xCircle',
    inactive: 'xCircle',
    dispatched: 'activity',
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

    const mustChange = Boolean(user.must_change_password) || localStorage.getItem('must_change_password') === '1';
    if (mustChange) {
      window.location.href = 'change-password.html';
      return false;
    }

    return true;
  }

  function paintStaticIcons() {
    document.querySelectorAll('[data-icon]').forEach(function (el) {
      const name = el.getAttribute('data-icon');
      if (!name) return;
      el.innerHTML = ICON(name, 16, 'ui-icon');
    });
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

  function setExpertInlineMsg(message) {
    const el = document.getElementById('expertCreateInlineMsg');
    if (!el) return;

    if (!message) {
      el.classList.remove('show');
      el.textContent = '';
      return;
    }

    el.textContent = message;
    el.classList.add('show');
  }

  function setStat(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value == null ? '-' : String(value);
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

  function emptyRow(colspan, message) {
    return '<tr><td colspan="' + colspan + '"><div class="empty-state">' + esc(message) + '</div></td></tr>';
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
    setStat('sPendingClaims', stats.pending_claims || 0);
    setStat('sActiveExperts', stats.active_experts || 0);
    setStat('sPayments', stats.total_payments || 0);
    setStat('sRevenue', (stats.total_revenue || 0).toLocaleString() + ' DZD');
    setStat('sMessages', stats.total_messages || 0);
    setStat('sApplications', stats.total_applications || 0);

    STATE.experts = expertsRes.ok ? (expertsRes.data.experts || []) : [];
    renderClaims(claimsRes.ok ? claimsRes.data.claims : []);
    renderReports(reportsRes.ok ? reportsRes.data.reports : []);
    renderMessages(messagesRes.ok ? messagesRes.data.messages : []);
    renderApplications(appsRes.ok ? appsRes.data.applications : []);
    renderRoadside(roadsideRes.ok ? roadsideRes.data.requests : []);
    renderUsers(usersRes.ok ? usersRes.data.users : []);

    setMsg('Admin data loaded.', false);
    setTimeout(() => setMsg('', false), 1400);
  }

  function renderClaims(list) {
    const body = document.getElementById('claimsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, 'No claims available yet.');
      return;
    }

    let hasPendingClaims = false;

    body.innerHTML = list.map((c) => {
      const allExperts = (STATE.experts || []);
      const isLocked = c.status === 'approved' || c.status === 'rejected' || c.status === 'closed';
      const canAssign = c.status === 'under_review' && !c.expert_id;
      const isWaitingExpertReport = c.status === 'expert_assigned';
      const canDecide = c.status === 'reported';
      const expertSelectId = 'claim-expert-' + c.claim_id;

      const expertOptions = ['<option value="">Assign expert...</option>']
        .concat(allExperts.map((ex) => {
          const selectable = Boolean(ex.is_available) && Boolean(ex.is_active);
          const busySuffix = selectable ? '' : ' (Busy)';
          const label = (ex.full_name || (String(ex.first_name || '') + ' ' + String(ex.last_name || '')).trim() || 'Expert') + busySuffix;
          return '<option value="' + ex.expert_id + '" ' + (selectable ? '' : 'disabled ') + '>' +
            esc(label) +
          '</option>';
        }))
        .join('');

      let actionsHtml = '';

      if (c.status === 'pending') {
        hasPendingClaims = true;
        actionsHtml = '<small>Automatically moving to under review...</small>';
      }

      if (canAssign) {
        actionsHtml += [
          '<div class="row-actions">',
          '  <select class="expert-select" id="' + expertSelectId + '">' + expertOptions + '</select>',
          '  <button class="action-btn" data-variant="assign" data-action="assign-expert" data-claim-id="' + c.claim_id + '" ' + (allExperts.length ? '' : 'disabled ') + '>' + ICON('userCheck', 14, '') + 'Assign</button>',
          '</div>',
          allExperts.length ? '' : '<span class="muted-note">' + ICON('alert', 13, '') + 'No experts found.</span>',
        ].join('');
      } else if (isWaitingExpertReport) {
        actionsHtml = '<span class="muted-note">' + ICON('clock', 13, '') + 'Waiting for expert report.</span>';
      } else if (canDecide) {
        actionsHtml = [
          '<div class="row-actions">',
          '  <button class="action-btn" data-variant="approve" data-action="approve-claim" data-claim-id="' + c.claim_id + '">' + ICON('checkCircle', 14, '') + 'Approve</button>',
          '  <button class="action-btn" data-variant="reject" data-action="reject-claim" data-claim-id="' + c.claim_id + '">' + ICON('xCircle', 14, '') + 'Reject</button>',
          '</div>',
        ].join('');
      } else if (isLocked) {
        actionsHtml = '<span class="muted-note">' + ICON('checkCircle', 13, '') + 'Final state. No actions available.</span>';
      } else if (!actionsHtml) {
        actionsHtml = '<span class="muted-note">' + ICON('alert', 13, '') + 'No actions available.</span>';
      }

      return [
        '<tr>',
        '  <td>#' + esc(c.claim_id) + '<br/><small>' + esc(c.contract_id) + '</small></td>',
        '  <td><strong>' + esc(c.client_name || '-') + '</strong><br/><small>' + esc(c.client_email || '-') + '</small></td>',
        '  <td>' + badge(c.status) + (c.status === 'pending' ? ' <span class="priority-chip">Priority</span>' : '') + '</td>',
        '  <td>',
        (!canAssign && c.expert_id && c.status === 'under_review') ? '    <div><small>Expert already assigned (#' + esc(c.expert_id) + ').</small></div>' : '',
        '    ' + actionsHtml,
        '  </td>',
        '</tr>'
      ].join('');
    }).join('');

    if (hasPendingClaims) {
      setTimeout(loadAll, 350);
    }
  }

  function renderReports(list) {
    const body = document.getElementById('reportsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, 'No expert reports submitted yet.');
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
      body.innerHTML = emptyRow(4, 'No messages found.');
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
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-message" data-message-id="' + m.id + '">' + ICON('send', 14, '') + 'Save</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
  }

  function renderApplications(list) {
    const body = document.getElementById('applicationsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, 'No job applications found.');
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
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-application" data-application-id="' + a.id + '">' + ICON('send', 14, '') + 'Save</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
  }

  function renderRoadside(list) {
    const body = document.getElementById('roadsideTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, 'No roadside requests found.');
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
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-roadside" data-request-id="' + r.id + '">' + ICON('send', 14, '') + 'Save</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
  }

  function renderUsers(list) {
    const body = document.getElementById('usersTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, 'No users found.');
      return;
    }

    body.innerHTML = list.map((u) => [
      '<tr>',
      '  <td>' + esc((u.first_name || '') + ' ' + (u.last_name || '')) + '<br/><small>' + esc(u.email || '-') + '</small></td>',
      '  <td>' + esc(u.role) + '</td>',
      '  <td>' + badge(u.is_active ? 'active' : 'inactive') + '</td>',
      '  <td><button class="action-btn" data-action="toggle-user" data-user-id="' + u.id + '" data-next-active="' + (u.is_active ? '0' : '1') + '">' +
          (u.is_active ? (ICON('userX', 14, '') + 'Deactivate') : (ICON('userCheck', 14, '') + 'Activate')) +
      '</button></td>',
      '</tr>'
    ].join('')).join('');
  }

  async function decideClaim(claimId, decision) {
    const res = await api('/api/claims/' + claimId + '/status', {
      method: 'PUT',
      body: { status: decision },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || 'Failed to apply claim decision.', true);
      return;
    }

    setMsg('Claim decision applied.', false);
    loadAll();
  }

  async function approveClaim(claimId) {
    return decideClaim(claimId, 'approved');
  }

  async function rejectClaim(claimId) {
    return decideClaim(claimId, 'rejected');
  }

  async function assignExpert(claimId) {
    const select = document.getElementById('claim-expert-' + claimId);
    if (!select || !select.value) {
      setMsg('Please choose an expert before assigning.', true);
      return;
    }

    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.disabled) {
      setMsg('Expert is currently busy', true);
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

  function bindTableActions() {
    document.addEventListener('click', function (e) {
      const trigger = e.target.closest('[data-action]');
      if (!trigger) return;

      const action = trigger.getAttribute('data-action');
      if (!action) return;

      if (action === 'assign-expert') {
        const claimId = parseInt(trigger.getAttribute('data-claim-id'), 10);
        if (!isNaN(claimId)) assignExpert(claimId);
        return;
      }

      if (action === 'approve-claim') {
        const claimId = parseInt(trigger.getAttribute('data-claim-id'), 10);
        if (!isNaN(claimId)) approveClaim(claimId);
        return;
      }

      if (action === 'reject-claim') {
        const claimId = parseInt(trigger.getAttribute('data-claim-id'), 10);
        if (!isNaN(claimId)) rejectClaim(claimId);
        return;
      }

      if (action === 'save-message') {
        const messageId = parseInt(trigger.getAttribute('data-message-id'), 10);
        if (!isNaN(messageId)) updateMessageStatus(messageId);
        return;
      }

      if (action === 'save-application') {
        const applicationId = parseInt(trigger.getAttribute('data-application-id'), 10);
        if (!isNaN(applicationId)) updateApplicationStatus(applicationId);
        return;
      }

      if (action === 'save-roadside') {
        const requestId = parseInt(trigger.getAttribute('data-request-id'), 10);
        if (!isNaN(requestId)) updateRoadsideStatus(requestId);
        return;
      }

      if (action === 'toggle-user') {
        const userId = parseInt(trigger.getAttribute('data-user-id'), 10);
        const nextActive = trigger.getAttribute('data-next-active') === '1';
        if (!isNaN(userId)) toggleUser(userId, nextActive);
      }
    });
  }

  function bindExpertCreateActions() {
    const openBtn = document.getElementById('createExpertBtn');
    const modal = document.getElementById('expertCreateModal');
    const closeBtn = document.getElementById('closeExpertModalBtn');
    const cancelBtn = document.getElementById('cancelExpertCreateBtn');
    const form = document.getElementById('expertCreateForm');
    const submitBtn = document.getElementById('submitExpertCreateBtn');

    if (!openBtn || !modal || !form || !submitBtn) return;

    function openModal() {
      setExpertInlineMsg('');
      form.reset();
      modal.hidden = false;
      const first = document.getElementById('expertFirstName');
      if (first) first.focus();
    }

    function closeModal() {
      modal.hidden = true;
      setExpertInlineMsg('');
    }

    openBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !modal.hidden) {
        closeModal();
      }
    });

    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const first_name = (document.getElementById('expertFirstName').value || '').trim();
      const last_name = (document.getElementById('expertLastName').value || '').trim();
      const email = (document.getElementById('expertEmail').value || '').trim();
      const specialization = (document.getElementById('expertSpecialization').value || '').trim();

      if (!first_name || !last_name || !email) {
        setExpertInlineMsg('First name, last name and email are required.');
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setExpertInlineMsg('Please enter a valid email address.');
        return;
      }

      setExpertInlineMsg('');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Creating...';

      const res = await api('/api/admin/experts', {
        method: 'POST',
        body: {
          first_name,
          last_name,
          email,
          specialization,
        },
      });

      submitBtn.disabled = false;
      submitBtn.textContent = 'Create Expert';

      if (!res.ok) {
        const msg = (res.data && res.data.error) || 'Failed to create expert.';
        setExpertInlineMsg(msg);
        setMsg(msg, true);
        return;
      }

      const tempPassword = (res.data && res.data.temporary_password) || '(not provided)';
      setExpertInlineMsg('Expert created. Default password: ' + tempPassword);
      setMsg('Expert created successfully.', false);
      setTimeout(function () {
        window.location.reload();
      }, 900);
    });
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
      localStorage.removeItem('must_change_password');
      window.location.href = 'index.html';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (!guardAdmin()) return;
    paintStaticIcons();
    bindTopActions();
    bindTableActions();
    bindExpertCreateActions();
    loadAll();
  });
})();
