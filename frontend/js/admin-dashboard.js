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
    news: [],
    products: [],
    editingNewsId: null,
    editingProductId: null,
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
    draft: 'Draft',
    published: 'Published',
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
    draft: 'clock',
    published: 'checkCircle',
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

  function setInlineMsg(id, message, isError) {
    const el = document.getElementById(id);
    if (!el) return;

    if (!message) {
      el.className = 'cms-inline-msg';
      el.textContent = '';
      return;
    }

    el.className = 'cms-inline-msg show ' + (isError ? 'err' : 'ok');
    el.textContent = message;
  }

  function normalizeText(value) {
    return String(value == null ? '' : value).replace(/\s+/g, ' ').trim();
  }

  function truncateText(value, maxLength) {
    const text = normalizeText(value);
    if (text.length <= maxLength) return text;
    return text.slice(0, Math.max(0, maxLength - 3)).trimEnd() + '...';
  }

  function formatDate(value) {
    if (!value) return '-';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);

    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });
  }

  function formatPrice(value) {
    if (value == null || value === '') return '-';

    const amount = Number(value);
    if (Number.isNaN(amount)) return String(value);

    return amount.toLocaleString() + ' DZD';
  }

  function findNewsById(newsId) {
    return (STATE.news || []).find((item) => Number(item.id) === Number(newsId));
  }

  function findProductById(productId) {
    return (STATE.products || []).find((item) => Number(item.id) === Number(productId));
  }

  function resetNewsForm() {
    STATE.editingNewsId = null;
    const form = document.getElementById('newsForm');
    const submitBtn = document.getElementById('newsSubmitBtn');
    const cancelBtn = document.getElementById('newsCancelEditBtn');

    if (form) form.reset();
    if (submitBtn) submitBtn.textContent = 'Create Article';
    if (cancelBtn) cancelBtn.hidden = true;
    setInlineMsg('newsFormMsg', '', false);
  }

  function openNewsForm(article) {
    if (!article) return;

    STATE.editingNewsId = Number(article.id);

    const form = document.getElementById('newsForm');
    const title = document.getElementById('newsTitleInput');
    const status = document.getElementById('newsStatusInput');
    const image = document.getElementById('newsImageInput');
    const content = document.getElementById('newsContentInput');
    const submitBtn = document.getElementById('newsSubmitBtn');
    const cancelBtn = document.getElementById('newsCancelEditBtn');

    if (title) title.value = article.title || '';
    if (status) status.value = article.status || 'draft';
    if (image) image.value = article.image_url || '';
    if (content) content.value = article.content || '';
    if (submitBtn) submitBtn.textContent = 'Update Article';
    if (cancelBtn) cancelBtn.hidden = false;
    setInlineMsg('newsFormMsg', '', false);

    if (form && typeof form.scrollIntoView === 'function') {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function resetProductForm() {
    STATE.editingProductId = null;
    const form = document.getElementById('productForm');
    const submitBtn = document.getElementById('productSubmitBtn');
    const cancelBtn = document.getElementById('productCancelEditBtn');

    if (form) form.reset();
    if (submitBtn) submitBtn.textContent = 'Create Product';
    if (cancelBtn) cancelBtn.hidden = true;
    setInlineMsg('productFormMsg', '', false);
  }

  function openProductForm(product) {
    if (!product) return;

    STATE.editingProductId = Number(product.id);

    const form = document.getElementById('productForm');
    const name = document.getElementById('productNameInput');
    const type = document.getElementById('productTypeInput');
    const price = document.getElementById('productPriceInput');
    const description = document.getElementById('productDescriptionInput');
    const submitBtn = document.getElementById('productSubmitBtn');
    const cancelBtn = document.getElementById('productCancelEditBtn');

    if (name) name.value = product.name || '';
    if (type) type.value = product.insurance_type || '';
    if (price) price.value = product.base_price == null ? '' : product.base_price;
    if (description) description.value = product.description || '';
    if (submitBtn) submitBtn.textContent = 'Update Product';
    if (cancelBtn) cancelBtn.hidden = false;
    setInlineMsg('productFormMsg', '', false);

    if (form && typeof form.scrollIntoView === 'function') {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function renderNews(list) {
    const body = document.getElementById('newsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, 'No news articles available yet.');
      return;
    }

    body.innerHTML = list.map((article) => {
      const publishVariant = article.status === 'published' ? 'unpublish' : 'publish';
      const publishLabel = article.status === 'published' ? 'Unpublish' : 'Publish';
      const publishIcon = article.status === 'published' ? 'toggleOff' : 'toggleOn';
      const articleSummary = truncateText(article.content || '', 110);

      return [
        '<tr>',
        '  <td><strong>' + esc(article.title || '-') + '</strong><br/><small>' + esc(articleSummary || '-') + '</small></td>',
        '  <td>' + badge(article.status || 'draft') + '</td>',
        '  <td>' + esc(formatDate(article.updated_at || article.created_at)) + '</td>',
        '  <td>',
        '    <div class="row-actions">',
        '      <button class="action-btn" data-variant="edit" data-action="edit-news" data-news-id="' + article.id + '">Edit</button>',
        '      <button class="action-btn" data-variant="delete" data-action="delete-news" data-news-id="' + article.id + '">' + ICON('xCircle', 14, '') + 'Delete</button>',
        '      <button class="action-btn" data-variant="' + publishVariant + '" data-action="toggle-news-status" data-news-id="' + article.id + '">' + ICON(publishIcon, 14, '') + publishLabel + '</button>',
        '    </div>',
        '  </td>',
        '</tr>',
      ].join('');
    }).join('');
  }

  function renderProducts(list) {
    const body = document.getElementById('productsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(5, 'No products available yet.');
      return;
    }

    body.innerHTML = list.map((product) => {
      const toggleVariant = product.is_active ? 'deactivate' : 'activate';
      const toggleLabel = product.is_active ? 'Deactivate' : 'Activate';
      const toggleIcon = product.is_active ? 'toggleOff' : 'toggleOn';
      const productSummary = truncateText(product.description || '', 105);

      return [
        '<tr>',
        '  <td><strong>' + esc(product.name || '-') + '</strong><br/><small>' + esc(productSummary || '-') + '</small></td>',
        '  <td>' + esc(product.insurance_type || '-') + '</td>',
        '  <td>' + esc(formatPrice(product.base_price)) + '</td>',
        '  <td>' + badge(product.is_active ? 'active' : 'inactive') + '</td>',
        '  <td>',
        '    <div class="row-actions">',
        '      <button class="action-btn" data-variant="edit" data-action="edit-product" data-product-id="' + product.id + '">Edit</button>',
        '      <button class="action-btn" data-variant="delete" data-action="delete-product" data-product-id="' + product.id + '">' + ICON('xCircle', 14, '') + 'Delete</button>',
        '      <button class="action-btn" data-variant="' + toggleVariant + '" data-action="toggle-product-status" data-product-id="' + product.id + '">' + ICON(toggleIcon, 14, '') + toggleLabel + '</button>',
        '    </div>',
        '  </td>',
        '</tr>',
      ].join('');
    }).join('');
  }

  async function loadAll() {
    setMsg('Loading admin data...', false);

    const [statsRes, claimsRes, reportsRes, messagesRes, appsRes, roadsideRes, usersRes, expertsRes, newsRes, productsRes] = await Promise.all([
      api('/api/dashboard/stats'),
      api('/api/claims'),
      api('/api/claims/expert-reports'),
      api('/api/messages'),
      api('/api/applications'),
      api('/api/roadside/requests'),
      api('/api/admin/users'),
      api('/api/admin/experts'),
      api('/api/admin/news'),
      api('/api/admin/products'),
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
    STATE.news = newsRes.ok ? (Array.isArray(newsRes.data) ? newsRes.data : (newsRes.data.articles || [])) : [];
    STATE.products = productsRes.ok ? (Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data.products || [])) : [];
    renderNews(STATE.news);
    renderProducts(STATE.products);

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

  async function saveNewsForm(e) {
    e.preventDefault();

    const titleInput = document.getElementById('newsTitleInput');
    const statusInput = document.getElementById('newsStatusInput');
    const imageInput = document.getElementById('newsImageInput');
    const contentInput = document.getElementById('newsContentInput');

    const title = normalizeText(titleInput && titleInput.value);
    const status = normalizeText(statusInput && statusInput.value) || 'draft';
    const image_url = normalizeText(imageInput && imageInput.value);
    const content = String(contentInput && contentInput.value ? contentInput.value : '').trim();

    if (!title || !content) {
      setInlineMsg('newsFormMsg', 'Title and content are required.', true);
      return;
    }

    const isEditing = Boolean(STATE.editingNewsId);
    const res = await api(isEditing ? '/api/admin/news/' + STATE.editingNewsId : '/api/admin/news', {
      method: isEditing ? 'PUT' : 'POST',
      body: {
        title,
        content,
        image_url: image_url || null,
        status,
      },
    });

    if (!res.ok) {
      const msg = (res.data && res.data.error) || 'Failed to save article.';
      setInlineMsg('newsFormMsg', msg, true);
      setMsg(msg, true);
      return;
    }

    resetNewsForm();
    setInlineMsg('newsFormMsg', isEditing ? 'Article updated successfully.' : 'Article created successfully.', false);
    setMsg(isEditing ? 'Article updated successfully.' : 'Article created successfully.', false);
    loadAll();
  }

  async function saveProductForm(e) {
    e.preventDefault();

    const nameInput = document.getElementById('productNameInput');
    const typeInput = document.getElementById('productTypeInput');
    const priceInput = document.getElementById('productPriceInput');
    const descriptionInput = document.getElementById('productDescriptionInput');

    const name = normalizeText(nameInput && nameInput.value);
    const insurance_type = normalizeText(typeInput && typeInput.value);
    const base_price = normalizeText(priceInput && priceInput.value);
    const description = String(descriptionInput && descriptionInput.value ? descriptionInput.value : '').trim();

    if (!name || !description) {
      setInlineMsg('productFormMsg', 'Name and description are required.', true);
      return;
    }

    const isEditing = Boolean(STATE.editingProductId);
    const res = await api(isEditing ? '/api/admin/products/' + STATE.editingProductId : '/api/admin/products', {
      method: isEditing ? 'PUT' : 'POST',
      body: {
        name,
        description,
        insurance_type: insurance_type || null,
        base_price: base_price === '' ? null : base_price,
      },
    });

    if (!res.ok) {
      const msg = (res.data && res.data.error) || 'Failed to save product.';
      setInlineMsg('productFormMsg', msg, true);
      setMsg(msg, true);
      return;
    }

    resetProductForm();
    setInlineMsg('productFormMsg', isEditing ? 'Product updated successfully.' : 'Product created successfully.', false);
    setMsg(isEditing ? 'Product updated successfully.' : 'Product created successfully.', false);
    loadAll();
  }

  function editNews(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg('Article not found.', true);
      return;
    }

    openNewsForm(article);
  }

  async function deleteNews(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg('Article not found.', true);
      return;
    }

    if (!window.confirm('Delete this article permanently?')) {
      return;
    }

    const res = await api('/api/admin/news/' + newsId, { method: 'DELETE' });
    if (!res.ok) {
      const msg = (res.data && res.data.error) || 'Failed to delete article.';
      setMsg(msg, true);
      return;
    }

    if (STATE.editingNewsId && Number(STATE.editingNewsId) === Number(newsId)) {
      resetNewsForm();
    }

    setMsg('Article deleted successfully.', false);
    loadAll();
  }

  async function toggleNewsStatus(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg('Article not found.', true);
      return;
    }

    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    const res = await api('/api/admin/news/' + newsId, {
      method: 'PUT',
      body: {
        title: article.title,
        content: article.content,
        image_url: article.image_url || null,
        status: nextStatus,
      },
    });

    if (!res.ok) {
      const msg = (res.data && res.data.error) || 'Failed to update article status.';
      setMsg(msg, true);
      return;
    }

    if (STATE.editingNewsId && Number(STATE.editingNewsId) === Number(newsId)) {
      openNewsForm(res.data.article || article);
    }

    setMsg('Article status updated.', false);
    loadAll();
  }

  function editProduct(productId) {
    const product = findProductById(productId);
    if (!product) {
      setMsg('Product not found.', true);
      return;
    }

    openProductForm(product);
  }

  async function deleteProduct(productId) {
    const product = findProductById(productId);
    if (!product) {
      setMsg('Product not found.', true);
      return;
    }

    if (!window.confirm('Delete this product permanently?')) {
      return;
    }

    const res = await api('/api/admin/products/' + productId, { method: 'DELETE' });
    if (!res.ok) {
      const msg = (res.data && res.data.error) || 'Failed to delete product.';
      setMsg(msg, true);
      return;
    }

    if (STATE.editingProductId && Number(STATE.editingProductId) === Number(productId)) {
      resetProductForm();
    }

    setMsg('Product deleted successfully.', false);
    loadAll();
  }

  async function toggleProductStatus(productId) {
    const product = findProductById(productId);
    if (!product) {
      setMsg('Product not found.', true);
      return;
    }

    const res = await api('/api/admin/products/' + productId + '/status', {
      method: 'PATCH',
      body: { is_active: !product.is_active },
    });

    if (!res.ok) {
      const msg = (res.data && res.data.error) || 'Failed to update product status.';
      setMsg(msg, true);
      return;
    }

    if (STATE.editingProductId && Number(STATE.editingProductId) === Number(productId)) {
      openProductForm(res.data.product || product);
    }

    setMsg('Product status updated.', false);
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
        return;
      }

      if (action === 'edit-news') {
        const newsId = parseInt(trigger.getAttribute('data-news-id'), 10);
        if (!isNaN(newsId)) editNews(newsId);
        return;
      }

      if (action === 'delete-news') {
        const newsId = parseInt(trigger.getAttribute('data-news-id'), 10);
        if (!isNaN(newsId)) deleteNews(newsId);
        return;
      }

      if (action === 'toggle-news-status') {
        const newsId = parseInt(trigger.getAttribute('data-news-id'), 10);
        if (!isNaN(newsId)) toggleNewsStatus(newsId);
        return;
      }

      if (action === 'edit-product') {
        const productId = parseInt(trigger.getAttribute('data-product-id'), 10);
        if (!isNaN(productId)) editProduct(productId);
        return;
      }

      if (action === 'delete-product') {
        const productId = parseInt(trigger.getAttribute('data-product-id'), 10);
        if (!isNaN(productId)) deleteProduct(productId);
        return;
      }

      if (action === 'toggle-product-status') {
        const productId = parseInt(trigger.getAttribute('data-product-id'), 10);
        if (!isNaN(productId)) toggleProductStatus(productId);
      }
    });
  }

  function bindContentManagementActions() {
    const newsForm = document.getElementById('newsForm');
    const productForm = document.getElementById('productForm');
    const newsCancel = document.getElementById('newsCancelEditBtn');
    const productCancel = document.getElementById('productCancelEditBtn');

    if (newsForm) newsForm.addEventListener('submit', saveNewsForm);
    if (productForm) productForm.addEventListener('submit', saveProductForm);
    if (newsCancel) newsCancel.addEventListener('click', resetNewsForm);
    if (productCancel) productCancel.addEventListener('click', resetProductForm);
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
    bindContentManagementActions();
    bindExpertCreateActions();
    loadAll();
  });
})();
