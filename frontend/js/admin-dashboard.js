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

  function t(key, fallback) {
    if (window.Language && typeof window.Language.t === 'function') {
      const value = window.Language.t(key);
      if (value) return value;
    }
    return fallback || '';
  }

  /* Status key mapping — uses translation keys, NOT direct translations */
  const STATUS_KEYS = {
    pending: 'status.pending',
    under_review: 'status.under_review',
    expert_assigned: 'status.assigned',
    reported: 'status.reported',
    approved: 'status.approved',
    rejected: 'status.rejected',
    closed: 'status.closed',
    active: 'status.active',
    inactive: 'status.inactive',
    draft: 'status.draft',
    published: 'status.published',
    new: 'status.pending',
    reviewed: 'status.under_review',
    accepted: 'status.approved',
    completed: 'status.closed',
    dispatched: 'status.dispatched',
  };

  function getStatusKey(status) {
    return STATUS_KEYS[status] || 'status.' + status;
  }

  /* Status icon mapping — purely visual, no logic */
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

  function badge(status) {
    const key = getStatusKey(status);
    const icon = STATUS_ICON[status] || 'file';
    const label = t(key, String(status));
    return '<span class="status-badge status-badge--' + esc(status) + '" title="' + esc(label) + '">' + ICON(icon, 12, '') + esc(label) + '</span>';
  }

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

  // Shared runtime state for admin dashboard — must always exist
  var STATE = {
    experts: [],
    news: [],
    products: [],
    claims: [],
    reports: [],
    messages: [],
    applications: [],
    roadside: [],
    users: []
  };

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

  function resetNewsForm() {
    STATE.editingNewsId = null;
    const form = document.getElementById('newsForm');
    const submitBtn = document.getElementById('newsSubmitBtn');
    const cancelBtn = document.getElementById('newsCancelEditBtn');

    if (form) form.reset();
    if (submitBtn) submitBtn.textContent = t('admin.news.create_article', 'Create Article');
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
    if (submitBtn) submitBtn.textContent = t('admin.news.update_article', 'Update Article');
    if (cancelBtn) cancelBtn.hidden = false;
    setInlineMsg('newsFormMsg', '', false);

    if (form && typeof form.scrollIntoView === 'function') {
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function homepageFieldId(productId, fieldName) {
    return 'homepage-product-' + fieldName + '-' + productId;
  }

  function renderNews(list) {
    if (Array.isArray(list)) STATE.news = list;
    list = STATE.news || [];
    const body = document.getElementById('newsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, t('admin.news.no_articles', 'No news articles available yet.'));
      window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((article) => {
      const publishVariant = article.status === 'published' ? 'unpublish' : 'publish';
      const publishLabel = article.status === 'published' ? t('admin.news.unpublish', 'Unpublish') : t('admin.news.publish', 'Publish');
      const publishIcon = article.status === 'published' ? 'toggleOff' : 'toggleOn';
      const articleSummary = truncateText(article.content || '', 110);

      return [
        '<tr>',
        '  <td><strong>' + esc(article.title || '-') + '</strong><br/><small>' + esc(articleSummary || '-') + '</small></td>',
        '  <td>' + badge(article.status || 'draft') + '</td>',
        '  <td>' + esc(formatDate(article.updated_at || article.created_at)) + '</td>',
        '  <td>',
        '    <div class="row-actions">',
        '      <button class="action-btn" data-variant="edit" data-action="edit-news" data-news-id="' + article.id + '">' + t('admin.news.edit', 'Edit') + '</button>',
        '      <button class="action-btn" data-variant="delete" data-action="delete-news" data-news-id="' + article.id + '">' + ICON('xCircle', 14, '') + t('admin.news.delete', 'Delete') + '</button>',
        '      <button class="action-btn" data-variant="' + publishVariant + '" data-action="toggle-news-status" data-news-id="' + article.id + '">' + ICON(publishIcon, 14, '') + publishLabel + '</button>',
        '    </div>',
        '  </td>',
        '</tr>',
      ].join('');
    }).join('');
    window.Language.applyTranslations(body);
  }

  function renderProducts(list) {
    if (Array.isArray(list)) STATE.products = list;
    list = STATE.products || [];
    const body = document.getElementById('productsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(7, t('admin.products.no_products', 'No homepage products available.'));
      window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((product) => {
      const id = Number(product.id);
      const nameId = homepageFieldId(id, 'name');
      const descriptionId = homepageFieldId(id, 'description');
      const imageId = homepageFieldId(id, 'image');
      const ctaId = homepageFieldId(id, 'cta');
      const orderId = homepageFieldId(id, 'order');
      const activeId = homepageFieldId(id, 'active');
      const msgId = homepageFieldId(id, 'msg');

      return [
        '<tr>',
        '  <td><input class="cms-table-input cms-table-input--readonly" id="' + nameId + '" type="text" value="' + esc(product.name || '') + '" readonly /></td>',
        '  <td><textarea class="cms-table-textarea" id="' + descriptionId + '" rows="4" placeholder="' + t('admin.products.description_placeholder', 'Description') + '">' + esc(product.description || '') + '</textarea></td>',
        '  <td><input class="cms-table-input" id="' + imageId + '" type="url" value="' + esc(product.image_url || '') + '" placeholder="' + t('admin.products.image_placeholder', 'https://example.com/image.jpg') + '" /></td>',
        '  <td><input class="cms-table-input" id="' + ctaId + '" type="text" maxlength="80" value="' + esc(product.cta_label || '') + '" placeholder="' + t('admin.products.cta_placeholder', 'CTA label') + '" /></td>',
        '  <td><input class="cms-table-input cms-table-input--number" id="' + orderId + '" type="number" min="0" step="1" value="' + esc(product.display_order == null ? 0 : product.display_order) + '" /></td>',
        '  <td><label class="cms-checkbox-wrap"><input id="' + activeId + '" type="checkbox" ' + (product.is_active ? 'checked ' : '') + '/><span>' + t('admin.products.active', 'Active') + '</span></label></td>',
        '  <td>',
        '    <div class="row-actions">',
        '      <button class="action-btn" data-variant="save" data-action="save-homepage-product" data-product-id="' + id + '">' + ICON('save', 14, '') + t('admin.products.save', 'Save') + '</button>',
        '    </div>',
        '    <div id="' + msgId + '" class="cms-inline-msg"></div>',
        '  </td>',
        '</tr>',
      ].join('');
    }).join('');
    window.Language.applyTranslations(body);
  }

  async function loadAll() {
    setMsg(t('admin.loading', 'Loading admin data...'), false);

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
      api('/api/admin/homepage-products'),
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

    // Safely normalize API responses into STATE; never assume .data exists
    STATE.experts = expertsRes && expertsRes.ok && expertsRes.data && Array.isArray(expertsRes.data.experts) ? expertsRes.data.experts : [];
    STATE.claims = claimsRes && claimsRes.ok && claimsRes.data && Array.isArray(claimsRes.data.claims) ? claimsRes.data.claims : [];
    STATE.reports = reportsRes && reportsRes.ok && reportsRes.data && Array.isArray(reportsRes.data.reports) ? reportsRes.data.reports : [];
    STATE.messages = messagesRes && messagesRes.ok && messagesRes.data && Array.isArray(messagesRes.data.messages) ? messagesRes.data.messages : [];
    STATE.applications = appsRes && appsRes.ok && appsRes.data && Array.isArray(appsRes.data.applications) ? appsRes.data.applications : [];
    STATE.roadside = roadsideRes && roadsideRes.ok && roadsideRes.data && Array.isArray(roadsideRes.data.requests) ? roadsideRes.data.requests : [];
    STATE.users = usersRes && usersRes.ok && usersRes.data && Array.isArray(usersRes.data.users) ? usersRes.data.users : [];
    STATE.news = newsRes && newsRes.ok && (Array.isArray(newsRes.data) ? newsRes.data : (newsRes.data && Array.isArray(newsRes.data.articles) ? newsRes.data.articles : [])) ? (Array.isArray(newsRes.data) ? newsRes.data : (newsRes.data && Array.isArray(newsRes.data.articles) ? newsRes.data.articles : [])) : [];
    STATE.products = productsRes && productsRes.ok && (Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data && Array.isArray(productsRes.data.products) ? productsRes.data.products : [])) ? (Array.isArray(productsRes.data) ? productsRes.data : (productsRes.data && Array.isArray(productsRes.data.products) ? productsRes.data.products : [])) : [];

    // Render from STATE only
    renderClaims();
    renderReports();
    renderMessages();
    renderApplications();
    renderRoadside();
    renderUsers();
    renderNews();
    renderProducts();

    setMsg(t('admin.data_loaded', 'Admin data loaded.'), false);
    setTimeout(() => setMsg('', false), 1400);
  }

  function renderClaims(list) {
    if (Array.isArray(list)) STATE.claims = list;
    list = STATE.claims || [];
    const body = document.getElementById('claimsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, t('admin.no_claims_available', 'No claims available yet.'));
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

      const expertOptions = ['<option value="">' + t('admin.assign_expert_placeholder', 'Assign expert...') + '</option>']
        .concat(allExperts.map((ex) => {
          const selectable = Boolean(ex.is_available) && Boolean(ex.is_active);
          const busySuffix = selectable ? '' : ' ' + t('admin.status.busy', '(Busy)');
          const label = (ex.full_name || (String(ex.first_name || '') + ' ' + String(ex.last_name || '')).trim() || 'Expert') + busySuffix;
          return '<option value="' + ex.expert_id + '" ' + (selectable ? '' : 'disabled ') + '>' +
            esc(label) +
          '</option>';
        }))
        .join('');

      let actionsHtml = '';

      if (c.status === 'pending') {
        hasPendingClaims = true;
        actionsHtml = '<small>' + t('admin.status.auto_moving', 'Automatically moving to under review...') + '</small>';
      }

      if (canAssign) {
        actionsHtml += [
          '<div class="row-actions">',
          '  <select class="expert-select" id="' + expertSelectId + '">' + expertOptions + '</select>',
          '  <button class="action-btn" data-variant="assign" data-action="assign-expert" data-claim-id="' + c.claim_id + '" ' + (allExperts.length ? '' : 'disabled ') + '>' + ICON('userCheck', 14, '') + t('admin.actions.assign', 'Assign') + '</button>',
          '</div>',
          allExperts.length ? '' : '<span class="muted-note">' + ICON('alert', 13, '') + t('admin.status.no_experts', 'No experts found.') + '</span>',
        ].join('');
      } else if (isWaitingExpertReport) {
        actionsHtml = '<span class="muted-note">' + ICON('clock', 13, '') + t('admin.status.waiting_report', 'Waiting for expert report.') + '</span>';
      } else if (canDecide) {
        actionsHtml = [
          '<div class="row-actions">',
          '  <button class="action-btn" data-variant="approve" data-action="approve-claim" data-claim-id="' + c.claim_id + '">' + ICON('checkCircle', 14, '') + t('admin.actions.approve', 'Approve') + '</button>',
          '  <button class="action-btn" data-variant="reject" data-action="reject-claim" data-claim-id="' + c.claim_id + '">' + ICON('xCircle', 14, '') + t('admin.actions.reject', 'Reject') + '</button>',
          '</div>',
        ].join('');
      } else if (isLocked) {
        actionsHtml = '<span class="muted-note">' + ICON('checkCircle', 13, '') + t('admin.status.final_state', 'Final state. No actions available.') + '</span>';
      } else if (!actionsHtml) {
        actionsHtml = '<span class="muted-note">' + ICON('alert', 13, '') + t('admin.status.no_actions', 'No actions available.') + '</span>';
      }

      return [
        '<tr>',
        '  <td>#' + esc(c.claim_id) + '<br/><small>' + esc(c.contract_id) + '</small></td>',
        '  <td><strong>' + esc(c.client_name || '-') + '</strong><br/><small>' + esc(c.client_email || '-') + '</small></td>',
        '  <td>' + badge(c.status) + (c.status === 'pending' ? ' <span class="priority-chip">' + t('admin.priority_chip', 'Priority') + '</span>' : '') + '</td>',
        '  <td>',
        (!canAssign && c.expert_id && c.status === 'under_review') ? '    <div><small>' + t('admin.status.expert_assigned', 'Expert already assigned') + ' (#' + esc(c.expert_id) + ').</small></div>' : '',
        '    ' + actionsHtml,
        '  </td>',
        '</tr>'
      ].join('');
    }).join('');
    window.Language.applyTranslations(body);

    if (hasPendingClaims) {
      setTimeout(loadAll, 350);
    }
  }

  function renderReports(list) {
    if (Array.isArray(list)) STATE.reports = list;
    list = STATE.reports || [];
    const body = document.getElementById('reportsTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, t('admin.no_reports', 'No expert reports submitted yet.'));
      window.Language.applyTranslations(body);
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
    window.Language.applyTranslations(body);
  }

  function renderMessages(list) {
    if (Array.isArray(list)) STATE.messages = list;
    list = STATE.messages || [];
    const body = document.getElementById('messagesTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, t('admin.no_messages', 'No messages found.'));
      window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((m) => [
      '<tr>',
      '  <td>' + esc(m.name || '-') + '<br/><small>' + esc(m.email || '-') + '</small></td>',
      '  <td>' + esc(m.subject || '-') + '</td>',
      '  <td>' + badge(m.status || 'new') + '</td>',
      '  <td>',
      '    <select id="msg-status-' + m.id + '">',
      '      <option value="new">' + t('admin.message_status.new', 'New') + '</option>',
      '      <option value="read">' + t('admin.message_status.read', 'Read') + '</option>',
      '      <option value="replied">' + t('admin.message_status.replied', 'Replied') + '</option>',
      '    </select>',
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-message" data-message-id="' + m.id + '">' + ICON('send', 14, '') + t('admin.common.save', 'Save') + '</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
    window.Language.applyTranslations(body);
  }

  function renderApplications(list) {
    if (Array.isArray(list)) STATE.applications = list;
    list = STATE.applications || [];
    const body = document.getElementById('applicationsTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, t('admin.no_applications', 'No job applications found.'));
      window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((a) => [
      '<tr>',
      '  <td>' + esc((a.first_name || '') + ' ' + (a.last_name || '')) + '</td>',
      '  <td>' + esc(a.position_sought || a.field_of_interest || '-') + '</td>',
      '  <td>' + badge(a.status || 'pending') + '</td>',
      '  <td>',
      '    <select id="app-status-' + a.id + '">',
      '      <option value="pending">' + t('admin.application_status.pending', 'Pending') + '</option>',
      '      <option value="reviewed">' + t('admin.application_status.reviewed', 'Reviewed') + '</option>',
      '      <option value="accepted">' + t('admin.application_status.accepted', 'Accepted') + '</option>',
      '      <option value="rejected">' + t('admin.application_status.rejected', 'Rejected') + '</option>',
      '    </select>',
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-application" data-application-id="' + a.id + '">' + ICON('send', 14, '') + t('admin.common.save', 'Save') + '</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
    window.Language.applyTranslations(body);
  }

  function renderRoadside(list) {
    if (Array.isArray(list)) STATE.roadside = list;
    list = STATE.roadside || [];
    const body = document.getElementById('roadsideTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, t('admin.no_roadside_requests', 'No roadside requests found.'));
      window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((r) => [
      '<tr>',
      '  <td>' + esc(r.request_reference || ('#' + r.id)) + '</td>',
      '  <td>' + esc(r.problem_type || '-') + '</td>',
      '  <td>' + badge(r.status || 'pending') + '</td>',
      '  <td>',
      '    <select id="road-status-' + r.id + '">',
      '      <option value="pending">' + t('admin.roadside_status.pending', 'Pending') + '</option>',
      '      <option value="dispatched">' + t('admin.roadside_status.dispatched', 'Dispatched') + '</option>',
      '      <option value="completed">' + t('admin.roadside_status.completed', 'Completed') + '</option>',
      '    </select>',
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-roadside" data-request-id="' + r.id + '">' + ICON('send', 14, '') + t('admin.common.save', 'Save') + '</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
    window.Language.applyTranslations(body);
  }

  function renderUsers(list) {
    if (Array.isArray(list)) STATE.users = list;
    list = STATE.users || [];
    const body = document.getElementById('usersTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, t('admin.users.no_users', 'No users found.'));
      window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((u) => [
      '<tr>',
      '  <td>' + esc((u.first_name || '') + ' ' + (u.last_name || '')) + '<br/><small>' + esc(u.email || '-') + '</small></td>',
      '  <td>' + esc(u.role) + '</td>',
      '  <td>' + badge(u.is_active ? 'active' : 'inactive') + '</td>',
      '  <td><button class="action-btn" data-action="toggle-user" data-user-id="' + u.id + '" data-next-active="' + (u.is_active ? '0' : '1') + '">' +
          (u.is_active ? (ICON('userX', 14, '') + t('admin.common.deactivate', 'Deactivate')) : (ICON('userCheck', 14, '') + t('admin.common.activate', 'Activate'))) +
      '</button></td>',
      '</tr>'
    ].join('')).join('');
    window.Language.applyTranslations(body);
  }

  async function decideClaim(claimId, decision) {
    const res = await api('/api/claims/' + claimId + '/status', {
      method: 'PUT',
      body: { status: decision },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || t('admin.claim_decision_failed', 'Failed to apply claim decision.'), true);
      return;
    }

    setMsg(t('admin.claim_decision_applied', 'Claim decision applied.'), false);
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
      setMsg(t('admin.choose_expert', 'Please choose an expert before assigning.'), true);
      return;
    }

    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.disabled) {
      setMsg(t('admin.expert_busy', 'Expert is currently busy'), true);
      return;
    }

    const res = await api('/api/claims/' + claimId + '/assign-expert', {
      method: 'POST',
      body: { expert_id: parseInt(select.value, 10) },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || t('admin.assign_expert_failed', 'Failed to assign expert.'), true);
      return;
    }

    setMsg(t('admin.expert_assigned', 'Expert assigned successfully.'), false);
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
      setMsg((res.data && res.data.error) || t('admin.message_status_failed', 'Failed to update message status.'), true);
      return;
    }

    setMsg(t('admin.message_status_updated', 'Message status updated.'), false);
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
      setMsg((res.data && res.data.error) || t('admin.application_status_failed', 'Failed to update application status.'), true);
      return;
    }

    setMsg(t('admin.application_status_updated', 'Application status updated.'), false);
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
      setMsg((res.data && res.data.error) || t('admin.roadside_status_failed', 'Failed to update roadside request status.'), true);
      return;
    }

    setMsg(t('admin.roadside_status_updated', 'Roadside status updated.'), false);
    loadAll();
  }

  async function toggleUser(userId, nextIsActive) {
    const res = await api('/api/admin/users/' + userId + '/status', {
      method: 'PATCH',
      body: { is_active: !!nextIsActive },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || t('admin.user_status_failed', 'Failed to update user status.'), true);
      return;
    }

    setMsg(t('admin.user_status_updated', 'User status updated.'), false);
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

    if (title.length < 3 || title.length > 255) {
      setInlineMsg('newsFormMsg', t('admin.news.title_invalid', 'Title must be between 3 and 255 characters.'), true);
      return;
    }

    if (content.length < 10) {
      setInlineMsg('newsFormMsg', t('admin.news.content_invalid', 'Content must be at least 10 characters.'), true);
      return;
    }

    if (!['draft', 'published'].includes(status)) {
      setInlineMsg('newsFormMsg', t('admin.news.status_invalid', 'Status must be draft or published.'), true);
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
      const msg = (res.data && res.data.error) || t('admin.news.save_failed', 'Failed to save article.');
      setInlineMsg('newsFormMsg', msg, true);
      setMsg(msg, true);
      return;
    }

    resetNewsForm();
    setInlineMsg('newsFormMsg', isEditing ? t('admin.news.updated_success', 'Article updated successfully.') : t('admin.news.created_success', 'Article created successfully.'), false);
    setMsg(isEditing ? t('admin.news.updated_success', 'Article updated successfully.') : t('admin.news.created_success', 'Article created successfully.'), false);
    loadAll();
  }

  async function saveHomepageProduct(productId) {
    const id = Number(productId);
    if (!id) return;

    const nameInput = document.getElementById(homepageFieldId(id, 'name'));
    const descriptionInput = document.getElementById(homepageFieldId(id, 'description'));
    const imageInput = document.getElementById(homepageFieldId(id, 'image'));
    const ctaInput = document.getElementById(homepageFieldId(id, 'cta'));
    const orderInput = document.getElementById(homepageFieldId(id, 'order'));
    const activeInput = document.getElementById(homepageFieldId(id, 'active'));
    const msgId = homepageFieldId(id, 'msg');

    const name = normalizeText(nameInput && nameInput.value);
    const description = String(descriptionInput && descriptionInput.value ? descriptionInput.value : '').trim();
    const image_url = normalizeText(imageInput && imageInput.value);
    const cta_label = normalizeText(ctaInput && ctaInput.value);
    const rawOrder = normalizeText(orderInput && orderInput.value);
    const display_order = rawOrder === '' ? 0 : parseInt(rawOrder, 10);
    const is_active = Boolean(activeInput && activeInput.checked);

    if (!name) {
      setInlineMsg(msgId, t('admin.products.name_required', 'Name is required.'), true);
      return;
    }

    if (Number.isNaN(display_order) || display_order < 0) {
      setInlineMsg(msgId, t('admin.products.order_invalid', 'Display order must be a non-negative number.'), true);
      return;
    }

    setInlineMsg(msgId, '', false);

    const res = await api('/api/admin/homepage-products/' + id, {
      method: 'PUT',
      body: {
        name,
        description: description || null,
        image_url: image_url || null,
        cta_label: cta_label || t('online.subscribe', 'Subscribe'),
        is_active,
        display_order,
      },
    });

    if (!res.ok) {
      const msg = (res.data && res.data.error) || t('admin.products.save_failed', 'Failed to save homepage product.');
      setInlineMsg(msgId, msg, true);
      setMsg(msg, true);
      return;
    }

    setInlineMsg(msgId, t('admin.products.saved', 'Saved.'), false);
    setMsg(t('admin.products.updated_success', 'Homepage product updated successfully.'), false);
    loadAll();
  }

  function editNews(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg(t('admin.news.not_found', 'Article not found.'), true);
      return;
    }

    openNewsForm(article);
  }

  async function deleteNews(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg(t('admin.news.not_found', 'Article not found.'), true);
      return;
    }

    if (!window.confirm(t('admin.news.delete_confirm', 'Delete this article permanently?'))) {
      return;
    }

    const res = await api('/api/admin/news/' + newsId, { method: 'DELETE' });
    if (!res.ok) {
      const msg = (res.data && res.data.error) || t('admin.news.delete_failed', 'Failed to delete article.');
      setMsg(msg, true);
      return;
    }

    if (STATE.editingNewsId && Number(STATE.editingNewsId) === Number(newsId)) {
      resetNewsForm();
    }

    setMsg(t('admin.news.deleted_success', 'Article deleted successfully.'), false);
    loadAll();
  }

  async function toggleNewsStatus(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg(t('admin.news.not_found', 'Article not found.'), true);
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
      const msg = (res.data && res.data.error) || t('admin.news.status_update_failed', 'Failed to update article status.');
      setMsg(msg, true);
      return;
    }

    if (STATE.editingNewsId && Number(STATE.editingNewsId) === Number(newsId)) {
      openNewsForm(res.data.article || article);
    }

    setMsg(t('admin.news.status_updated', 'Article status updated.'), false);
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

      if (action === 'save-homepage-product') {
        const productId = parseInt(trigger.getAttribute('data-product-id'), 10);
        if (!isNaN(productId)) saveHomepageProduct(productId);
      }
    });
  }

  function bindContentManagementActions() {
    const newsForm = document.getElementById('newsForm');
    const newsCancel = document.getElementById('newsCancelEditBtn');

    if (newsForm) newsForm.addEventListener('submit', saveNewsForm);
    if (newsCancel) newsCancel.addEventListener('click', resetNewsForm);
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
        setExpertInlineMsg(t('admin.expert.create.error_missing_fields', 'First name, last name and email are required.'), true);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setExpertInlineMsg(t('admin.expert.invalid_email', 'Please enter a valid email address.'), true);
        return;
      }

      setExpertInlineMsg('');
      submitBtn.disabled = true;
      submitBtn.textContent = t('actions.creating', 'Creating...');

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
      submitBtn.textContent = t('actions.create_expert', 'Create Expert');

      if (!res.ok) {
        const msg = (res.data && res.data.error) || t('admin.expert.create_failed', 'Failed to create expert.');
        setExpertInlineMsg(msg, true);
        setMsg(msg, true);
        return;
      }

      const tempPassword = (res.data && res.data.temporary_password) || '(not provided)';
      var createdMsgTemplate = t('admin.expert.created_with_password', 'Expert created. Default password: {{password}}');
      var createdMsg = createdMsgTemplate.replace(/{{\s*password\s*}}/g, tempPassword);
      setExpertInlineMsg(createdMsg);
      setMsg(t('admin.expert.created_success', 'Expert created successfully.'), false);
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
    if (window.Language && typeof window.Language.applyTranslations === 'function') {
      window.Language.applyTranslations(document);
    }
  });
})();
