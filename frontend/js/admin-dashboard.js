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
    const fallback = String(status);
    // Use i18nSpan so the label updates when translations become available.
    const labelHtml = (window.i18nSpan && typeof window.i18nSpan === 'function')
      ? window.i18nSpan(key, fallback)
      : (window.Language && typeof window.Language.t === 'function' ? window.Language.t(key, fallback) : fallback);
    return '<span class="status-badge status-badge--' + esc(status) + '" data-i18n-title="' + esc(key) + '" title="' + esc(fallback) + '">' + ICON(icon, 12, '') + labelHtml + '</span>';
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

  const PENDING_CLAIMS_POLL_DELAY_MS = 350;
  const PENDING_CLAIMS_POLL_MAX_ATTEMPTS = 20;
  var pendingClaimsPollTimer = null;
  var pendingClaimsPollAttempts = 0;

  function stopPendingClaimsPolling(resetAttempts) {
    if (pendingClaimsPollTimer) {
      clearTimeout(pendingClaimsPollTimer);
      pendingClaimsPollTimer = null;
    }
    if (resetAttempts) {
      pendingClaimsPollAttempts = 0;
    }
  }

  function schedulePendingClaimsPolling() {
    if (pendingClaimsPollTimer) return;

    if (pendingClaimsPollAttempts >= PENDING_CLAIMS_POLL_MAX_ATTEMPTS) {
      stopPendingClaimsPolling(false);
      setMsg(window.i18nSpan ? window.i18nSpan('admin.polling_limit_reached', 'Auto-refresh paused to reduce API load. Use Refresh to continue monitoring pending claims.') : 'Auto-refresh paused to reduce API load. Use Refresh to continue monitoring pending claims.', false);
      return;
    }

    pendingClaimsPollAttempts += 1;
    pendingClaimsPollTimer = setTimeout(function () {
      pendingClaimsPollTimer = null;
      loadAll({ fromPolling: true });
    }, PENDING_CLAIMS_POLL_DELAY_MS);
  }

  function hasPendingClaimsInState() {
    return Array.isArray(STATE.claims) && STATE.claims.some(function (claim) {
      return claim && claim.status === 'pending';
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
    const el = document.getElementById('adminApiMsg');
    if (!el) return;
    if (!message) {
      el.className = 'api-msg';
      el.textContent = '';
      return;
    }
    el.className = 'api-msg ' + (isError ? 'err' : 'ok');
    // If message contains a translatable span, set as HTML so applyTranslations can update it later.
    try {
      if (typeof message === 'string' && message.indexOf('data-i18n') !== -1) {
        el.innerHTML = message;
      } else {
        el.textContent = message;
      }
    } catch (e) {
      el.textContent = String(message);
    }
  }

  // Update option elements that include a translatable suffix stored in data-i18n-suffix.
  function updateOptionSuffixes(root) {
    root = root && root.querySelectorAll ? root : document;
    Array.from(root.querySelectorAll('option[data-i18n-suffix]')).forEach(function (opt) {
      try {
        var key = opt.getAttribute('data-i18n-suffix') || '';
        var base = opt.getAttribute('data-base-label') || opt.getAttribute('data-base') || opt.textContent || '';
        var suffix = '';
        if (window.Language && typeof window.Language.t === 'function') {
          suffix = window.Language.t(key) || '';
        } else if (typeof window.t === 'function') {
          suffix = window.t(key) || '';
        }
        opt.textContent = base + (suffix ? ' ' + suffix : '');
      } catch (ex) {
        // defensive: skip problematic option
      }
    });
  }

  // Listen for language applied events to refresh option suffixes.
  document.addEventListener('caar:language-applied', function (e) {
    updateOptionSuffixes(document);
  });

  function setExpertInlineMsg(message) {
    const el = document.getElementById('expertCreateInlineMsg');
    if (!el) return;

    if (!message) {
      el.classList.remove('show');
      el.textContent = '';
      return;
    }

    if (typeof message === 'string' && message.indexOf('data-i18n') !== -1) {
      el.innerHTML = message;
    } else {
      el.textContent = message;
    }
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

  function emptyRow(colspan, key, fallback) {
    var textHtml = window.i18nSpan ? window.i18nSpan(key, fallback) : esc(fallback || '');
    return '<tr><td colspan="' + colspan + '"><div class="empty-state">' + textHtml + '</div></td></tr>';
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
    if (typeof message === 'string' && message.indexOf('data-i18n') !== -1) {
      el.innerHTML = message;
    } else {
      el.textContent = message;
    }
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
    if (submitBtn) submitBtn.innerHTML = window.i18nSpan ? window.i18nSpan('admin.news.create_article', 'Create Article') : esc('Create Article');
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
    if (submitBtn) submitBtn.innerHTML = window.i18nSpan ? window.i18nSpan('admin.news.update_article', 'Update Article') : esc('Update Article');
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
      body.innerHTML = '<tr><td colspan="4"><div class="empty-state">' + (window.i18nSpan ? window.i18nSpan('admin.news.no_articles','No news articles available yet.') : esc('No news articles available yet.')) + '</div></td></tr>';
        if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
      updateOptionSuffixes(body);
      return;
    }

    // Build rows via DOM to ensure translatable pieces are marked for later updates.
    body.innerHTML = '';
    list.forEach(function (article) {
      var tr = document.createElement('tr');

      var td1 = document.createElement('td');
      td1.innerHTML = '<strong>' + esc(article.title || '-') + '</strong><br/><small>' + esc(truncateText(article.content || '', 110) || '-') + '</small>';

      var td2 = document.createElement('td');
      td2.innerHTML = badge(article.status || 'draft');

      var td3 = document.createElement('td');
      td3.textContent = formatDate(article.updated_at || article.created_at) || '';

      var td4 = document.createElement('td');
      var actionsWrap = document.createElement('div');
      actionsWrap.className = 'row-actions';

      var btnEdit = document.createElement('button');
      btnEdit.className = 'action-btn';
      btnEdit.setAttribute('data-variant','edit');
      btnEdit.setAttribute('data-action','edit-news');
      btnEdit.setAttribute('data-news-id', String(article.id));
      btnEdit.innerHTML = (window.i18nSpan ? window.i18nSpan('admin.news.edit','Edit') : esc('Edit'));

      var btnDelete = document.createElement('button');
      btnDelete.className = 'action-btn';
      btnDelete.setAttribute('data-variant','delete');
      btnDelete.setAttribute('data-action','delete-news');
      btnDelete.setAttribute('data-news-id', String(article.id));
      btnDelete.innerHTML = ICON('xCircle', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.news.delete','Delete') : esc('Delete'));

      var publishVariant = article.status === 'published' ? 'unpublish' : 'publish';
      var publishIcon = article.status === 'published' ? 'toggleOff' : 'toggleOn';
      var btnPublish = document.createElement('button');
      btnPublish.className = 'action-btn';
      btnPublish.setAttribute('data-variant', publishVariant);
      btnPublish.setAttribute('data-action', 'toggle-news-status');
      btnPublish.setAttribute('data-news-id', String(article.id));
      btnPublish.innerHTML = ICON(publishIcon, 14, '') + (window.i18nSpan ? window.i18nSpan(article.status === 'published' ? 'admin.news.unpublish' : 'admin.news.publish', article.status === 'published' ? 'Unpublish' : 'Publish') : esc(article.status === 'published' ? 'Unpublish' : 'Publish'));

      actionsWrap.appendChild(btnEdit);
      actionsWrap.appendChild(btnDelete);
      actionsWrap.appendChild(btnPublish);

      td4.appendChild(actionsWrap);

      tr.appendChild(td1);
      tr.appendChild(td2);
      tr.appendChild(td3);
      tr.appendChild(td4);

      body.appendChild(tr);
    });

    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
    updateOptionSuffixes(body);
  }

  function renderProducts(list) {
    if (Array.isArray(list)) STATE.products = list;
    list = STATE.products || [];
    const body = document.getElementById('productsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(7, 'admin.products.no_products', 'No homepage products available.');
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
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
        '  <td><textarea class="cms-table-textarea" id="' + descriptionId + '" rows="4" placeholder="' + esc('Description') + '" data-i18n-placeholder="admin.products.description_placeholder">' + esc(product.description || '') + '</textarea></td>',
        '  <td><input class="cms-table-input" id="' + imageId + '" type="url" value="' + esc(product.image_url || '') + '" placeholder="' + esc('https://example.com/image.jpg') + '" data-i18n-placeholder="admin.products.image_placeholder" /></td>',
        '  <td><input class="cms-table-input" id="' + ctaId + '" type="text" maxlength="80" value="' + esc(product.cta_label || '') + '" placeholder="' + esc('CTA label') + '" data-i18n-placeholder="admin.products.cta_placeholder" /></td>',
        '  <td><input class="cms-table-input cms-table-input--number" id="' + orderId + '" type="number" min="0" step="1" value="' + esc(product.display_order == null ? 0 : product.display_order) + '" /></td>',
        '  <td><label class="cms-checkbox-wrap"><input id="' + activeId + '" type="checkbox" ' + (product.is_active ? 'checked ' : '') + '/><span data-i18n="admin.products.active">' + esc('Active') + '</span></label></td>',
        '  <td>',
        '    <div class="row-actions">',
        '      <button class="action-btn" data-variant="save" data-action="save-homepage-product" data-product-id="' + id + '">' + ICON('save', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.products.save','Save') : esc('Save')) + '</button>',
        '    </div>',
        '    <div id="' + msgId + '" class="cms-inline-msg"></div>',
        '  </td>',
        '</tr>',
      ].join('');
    }).join('');
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
  }

  async function loadAll(opts) {
    opts = opts || {};
    if (!opts.fromPolling) {
      stopPendingClaimsPolling(true);
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.loading','Loading admin data...') : 'Loading admin data...', false);

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
      var statsErrorMsg = statsRes.data && statsRes.data.error ? statsRes.data.error : 'Failed to load admin dashboard stats.';
      var shouldRetryPolling = opts.fromPolling || hasPendingClaimsInState();

      if (shouldRetryPolling) {
        var retryMsgHtml = (typeof statsErrorMsg === 'string' ? esc(statsErrorMsg) : '') + ' ' + (window.i18nSpan ? window.i18nSpan('admin.polling_retrying','Auto-refresh will retry shortly.') : 'Auto-refresh will retry shortly.');
        setMsg(retryMsgHtml, true);
        schedulePendingClaimsPolling();
        return;
      }

      setMsg(statsErrorMsg, true);
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
    STATE.claims = claimsRes && claimsRes.ok && claimsRes.data && Array.isArray(claimsRes.data.claims)
      ? claimsRes.data.claims
      : (Array.isArray(STATE.claims) ? STATE.claims : []);
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

    setMsg(window.i18nSpan ? window.i18nSpan('admin.data_loaded','Admin data loaded.') : 'Admin data loaded.', false);
    setTimeout(() => setMsg('', false), 1400);
  }

  function renderClaims(list) {
    if (Array.isArray(list)) STATE.claims = list;
    list = STATE.claims || [];
    const body = document.getElementById('claimsTableBody');
    if (!body) return;

    if (!list || !list.length) {
      body.innerHTML = emptyRow(4, 'admin.no_claims_available', 'No claims available yet.');
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

      // Build expert options; for names we store base label and a translatable suffix key for later updates.
      var expertOptionsArr = [];
      expertOptionsArr.push('<option value="" data-i18n="admin.assign_expert_placeholder">' + esc('Assign expert...') + '</option>');
      allExperts.forEach(function (ex) {
        var selectable = Boolean(ex.is_available) && Boolean(ex.is_active);
        var baseName = (ex.full_name || (String(ex.first_name || '') + ' ' + String(ex.last_name || '')).trim() || 'Expert');
        var optionAttrs = ' value="' + esc(ex.expert_id) + '" ' + (selectable ? '' : 'disabled ');
        // Use data-base-label and data-i18n-suffix for update after translations
        var suffixAttr = selectable ? '' : ' data-i18n-suffix="admin.status.busy" data-base-label="' + esc(baseName) + '"';
        expertOptionsArr.push('<option' + optionAttrs + suffixAttr + '>' + esc(baseName) + '</option>');
      });
      const expertOptions = expertOptionsArr.join('');

      let actionsHtml = '';

      if (c.status === 'pending') {
        hasPendingClaims = true;
        actionsHtml = '<small>' + (window.i18nSpan ? window.i18nSpan('admin.status.auto_moving', 'Automatically moving to under review...') : esc('Automatically moving to under review...')) + '</small>';
      }

      if (canAssign) {
        actionsHtml += [
            '<div class="row-actions">',
            '  <select class="expert-select" id="' + expertSelectId + '">' + expertOptions + '</select>',
            '  <button class="action-btn" data-variant="assign" data-action="assign-expert" data-claim-id="' + c.claim_id + '" ' + (allExperts.length ? '' : 'disabled ') + '>' + ICON('userCheck', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.actions.assign','Assign') : esc('Assign')) + '</button>',
            '</div>',
            allExperts.length ? '' : '<span class="muted-note">' + ICON('alert', 13, '') + (window.i18nSpan ? window.i18nSpan('admin.status.no_experts','No experts found.') : esc('No experts found.')) + '</span>',
          ].join('');
      } else if (isWaitingExpertReport) {
        actionsHtml = '<span class="muted-note">' + ICON('clock', 13, '') + (window.i18nSpan ? window.i18nSpan('admin.status.waiting_report','Waiting for expert report.') : esc('Waiting for expert report.')) + '</span>';
      } else if (canDecide) {
        actionsHtml = [
          '<div class="row-actions">',
          '  <button class="action-btn" data-variant="approve" data-action="approve-claim" data-claim-id="' + c.claim_id + '">' + ICON('checkCircle', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.actions.approve','Approve') : esc('Approve')) + '</button>',
          '  <button class="action-btn" data-variant="reject" data-action="reject-claim" data-claim-id="' + c.claim_id + '">' + ICON('xCircle', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.actions.reject','Reject') : esc('Reject')) + '</button>',
          '</div>',
        ].join('');
      } else if (isLocked) {
        actionsHtml = '<span class="muted-note">' + ICON('checkCircle', 13, '') + (window.i18nSpan ? window.i18nSpan('admin.status.final_state','Final state. No actions available.') : esc('Final state. No actions available.')) + '</span>';
      } else if (!actionsHtml) {
        actionsHtml = '<span class="muted-note">' + ICON('alert', 13, '') + (window.i18nSpan ? window.i18nSpan('admin.status.no_actions','No actions available.') : esc('No actions available.')) + '</span>';
      }

      return [
        '<tr>',
        '  <td>#' + esc(c.claim_id) + '<br/><small>' + esc(c.contract_id) + '</small></td>',
        '  <td><strong>' + esc(c.client_name || '-') + '</strong><br/><small>' + esc(c.client_email || '-') + '</small></td>',
        '  <td>' + badge(c.status) + (c.status === 'pending' ? ' <span class="priority-chip">' + (window.i18nSpan ? window.i18nSpan('admin.priority_chip', 'Priority') : esc('Priority')) + '</span>' : '') + '</td>',
        '  <td>',
        (!canAssign && c.expert_id && c.status === 'under_review') ? '    <div><small>' + (window.i18nSpan ? window.i18nSpan('admin.status.expert_assigned', 'Expert already assigned') : esc('Expert already assigned')) + ' (#' + esc(c.expert_id) + ').</small></div>' : '',
        '    ' + actionsHtml,
        '  </td>',
        '</tr>'
      ].join('');
    }).join('');
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
    updateOptionSuffixes(body);

    if (hasPendingClaims) {
      schedulePendingClaimsPolling();
      return;
    }

    stopPendingClaimsPolling(true);
  }

  function renderReports(list) {
    if (Array.isArray(list)) STATE.reports = list;
    list = STATE.reports || [];
    const body = document.getElementById('reportsTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, 'admin.no_reports', 'No expert reports submitted yet.');
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
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
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
  }

  function renderMessages(list) {
    if (Array.isArray(list)) STATE.messages = list;
    list = STATE.messages || [];
    const body = document.getElementById('messagesTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, 'admin.no_messages', 'No messages found.');
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((m) => [
      '<tr>',
      '  <td>' + esc(m.name || '-') + '<br/><small>' + esc(m.email || '-') + '</small></td>',
      '  <td>' + esc(m.subject || '-') + '</td>',
      '  <td>' + badge(m.status || 'new') + '</td>',
      '  <td>',
      '    <select id="msg-status-' + m.id + '">',
      '      <option value="new" data-i18n="admin.message_status.new">' + esc('New') + '</option>',
      '      <option value="read" data-i18n="admin.message_status.read">' + esc('Read') + '</option>',
      '      <option value="replied" data-i18n="admin.message_status.replied">' + esc('Replied') + '</option>',
      '    </select>',
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-message" data-message-id="' + m.id + '">' + ICON('send', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.common.save','Save') : esc('Save')) + '</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
  }

  function renderApplications(list) {
    if (Array.isArray(list)) STATE.applications = list;
    list = STATE.applications || [];
    const body = document.getElementById('applicationsTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, 'admin.no_applications', 'No job applications found.');
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((a) => [
      '<tr>',
      '  <td>' + esc((a.first_name || '') + ' ' + (a.last_name || '')) + '</td>',
      '  <td>' + esc(a.position_sought || a.field_of_interest || '-') + '</td>',
      '  <td>' + badge(a.status || 'pending') + '</td>',
      '  <td>',
      '    <select id="app-status-' + a.id + '">',
      '      <option value="pending" data-i18n="admin.application_status.pending">' + esc('Pending') + '</option>',
      '      <option value="reviewed" data-i18n="admin.application_status.reviewed">' + esc('Reviewed') + '</option>',
      '      <option value="accepted" data-i18n="admin.application_status.accepted">' + esc('Accepted') + '</option>',
      '      <option value="rejected" data-i18n="admin.application_status.rejected">' + esc('Rejected') + '</option>',
      '    </select>',
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-application" data-application-id="' + a.id + '">' + ICON('send', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.common.save','Save') : esc('Save')) + '</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
  }

  function renderRoadside(list) {
    if (Array.isArray(list)) STATE.roadside = list;
    list = STATE.roadside || [];
    const body = document.getElementById('roadsideTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, 'admin.no_roadside_requests', 'No roadside requests found.');
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((r) => [
      '<tr>',
      '  <td>' + esc(r.request_reference || ('#' + r.id)) + '</td>',
      '  <td>' + esc(r.problem_type || '-') + '</td>',
      '  <td>' + badge(r.status || 'pending') + '</td>',
      '  <td>',
      '    <select id="road-status-' + r.id + '">',
      '      <option value="pending" data-i18n="admin.roadside_status.pending">' + esc('Pending') + '</option>',
      '      <option value="dispatched" data-i18n="admin.roadside_status.dispatched">' + esc('Dispatched') + '</option>',
      '      <option value="completed" data-i18n="admin.roadside_status.completed">' + esc('Completed') + '</option>',
      '    </select>',
      '    <div class="row-actions"><button class="action-btn" data-variant="save" data-action="save-roadside" data-request-id="' + r.id + '">' + ICON('send', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.common.save','Save') : esc('Save')) + '</button></div>',
      '  </td>',
      '</tr>'
    ].join('')).join('');
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
  }

  function renderUsers(list) {
    if (Array.isArray(list)) STATE.users = list;
    list = STATE.users || [];
    const body = document.getElementById('usersTableBody');
    if (!body) return;

    if (!list.length) {
      body.innerHTML = emptyRow(4, 'admin.users.no_users', 'No users found.');
      if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
      return;
    }

    body.innerHTML = list.map((u) => [
      '<tr>',
      '  <td>' + esc((u.first_name || '') + ' ' + (u.last_name || '')) + '<br/><small>' + esc(u.email || '-') + '</small></td>',
      '  <td>' + esc(u.role) + '</td>',
      '  <td>' + badge(u.is_active ? 'active' : 'inactive') + '</td>',
        '  <td><button class="action-btn" data-action="toggle-user" data-user-id="' + u.id + '" data-next-active="' + (u.is_active ? '0' : '1') + '">' +
          (u.is_active ? (ICON('userX', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.common.deactivate', 'Deactivate') : esc('Deactivate'))) : (ICON('userCheck', 14, '') + (window.i18nSpan ? window.i18nSpan('admin.common.activate', 'Activate') : esc('Activate')))) +
      '</button></td>',
      '</tr>'
    ].join('')).join('');
    if (window.Language && typeof window.Language.applyTranslations === 'function') window.Language.applyTranslations(body);
  }

  async function decideClaim(claimId, decision) {
    const res = await api('/api/claims/' + claimId + '/status', {
      method: 'PUT',
      body: { status: decision },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.claim_decision_failed', 'Failed to apply claim decision.') : 'Failed to apply claim decision.'), true);
      return;
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.claim_decision_applied', 'Claim decision applied.') : 'Claim decision applied.', false);
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
      setMsg(window.i18nSpan ? window.i18nSpan('admin.choose_expert', 'Please choose an expert before assigning.') : 'Please choose an expert before assigning.', true);
      return;
    }

    const selectedOption = select.options[select.selectedIndex];
    if (selectedOption && selectedOption.disabled) {
      setMsg(window.i18nSpan ? window.i18nSpan('admin.expert_busy', 'Expert is currently busy') : 'Expert is currently busy', true);
      return;
    }

    const res = await api('/api/claims/' + claimId + '/assign-expert', {
      method: 'POST',
      body: { expert_id: parseInt(select.value, 10) },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.assign_expert_failed', 'Failed to assign expert.') : 'Failed to assign expert.'), true);
      return;
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.expert_assigned', 'Expert assigned successfully.') : 'Expert assigned successfully.', false);
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
      setMsg((res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.message_status_failed', 'Failed to update message status.') : 'Failed to update message status.'), true);
      return;
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.message_status_updated', 'Message status updated.') : 'Message status updated.', false);
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
      setMsg((res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.application_status_failed', 'Failed to update application status.') : 'Failed to update application status.'), true);
      return;
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.application_status_updated', 'Application status updated.') : 'Application status updated.', false);
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
      setMsg((res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.roadside_status_failed', 'Failed to update roadside request status.') : 'Failed to update roadside request status.'), true);
      return;
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.roadside_status_updated', 'Roadside status updated.') : 'Roadside status updated.', false);
    loadAll();
  }

  async function toggleUser(userId, nextIsActive) {
    const res = await api('/api/admin/users/' + userId + '/status', {
      method: 'PATCH',
      body: { is_active: !!nextIsActive },
    });

    if (!res.ok) {
      setMsg((res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.user_status_failed', 'Failed to update user status.') : 'Failed to update user status.'), true);
      return;
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.user_status_updated', 'User status updated.') : 'User status updated.', false);
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
      setInlineMsg('newsFormMsg', window.i18nSpan ? window.i18nSpan('admin.news.title_invalid', 'Title must be between 3 and 255 characters.') : 'Title must be between 3 and 255 characters.', true);
      return;
    }

    if (content.length < 10) {
      setInlineMsg('newsFormMsg', window.i18nSpan ? window.i18nSpan('admin.news.content_invalid', 'Content must be at least 10 characters.') : 'Content must be at least 10 characters.', true);
      return;
    }

    if (!['draft', 'published'].includes(status)) {
      setInlineMsg('newsFormMsg', window.i18nSpan ? window.i18nSpan('admin.news.status_invalid', 'Status must be draft or published.') : 'Status must be draft or published.', true);
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
      const msg = (res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.news.save_failed', 'Failed to save article.') : 'Failed to save article.');
      setInlineMsg('newsFormMsg', msg, true);
      setMsg(msg, true);
      return;
    }

    resetNewsForm();
    setInlineMsg('newsFormMsg', isEditing ? (window.i18nSpan ? window.i18nSpan('admin.news.updated_success', 'Article updated successfully.') : 'Article updated successfully.') : (window.i18nSpan ? window.i18nSpan('admin.news.created_success', 'Article created successfully.') : 'Article created successfully.'), false);
    setMsg(isEditing ? (window.i18nSpan ? window.i18nSpan('admin.news.updated_success', 'Article updated successfully.') : 'Article updated successfully.') : (window.i18nSpan ? window.i18nSpan('admin.news.created_success', 'Article created successfully.') : 'Article created successfully.'), false);
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
      setInlineMsg(msgId, window.i18nSpan ? window.i18nSpan('admin.products.name_required', 'Name is required.') : 'Name is required.', true);
      return;
    }

    if (Number.isNaN(display_order) || display_order < 0) {
      setInlineMsg(msgId, window.i18nSpan ? window.i18nSpan('admin.products.order_invalid', 'Display order must be a non-negative number.') : 'Display order must be a non-negative number.', true);
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
      const msg = (res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.products.save_failed', 'Failed to save homepage product.') : 'Failed to save homepage product.');
      setInlineMsg(msgId, msg, true);
      setMsg(msg, true);
      return;
    }

    setInlineMsg(msgId, window.i18nSpan ? window.i18nSpan('admin.products.saved', 'Saved.') : 'Saved.', false);
    setMsg(window.i18nSpan ? window.i18nSpan('admin.products.updated_success', 'Homepage product updated successfully.') : 'Homepage product updated successfully.', false);
    loadAll();
  }

  function editNews(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg(window.i18nSpan ? window.i18nSpan('admin.news.not_found', 'Article not found.') : 'Article not found.', true);
      return;
    }

    openNewsForm(article);
  }

  async function deleteNews(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg(window.i18nSpan ? window.i18nSpan('admin.news.not_found', 'Article not found.') : 'Article not found.', true);
      return;
    }

    if (!window.confirm(t('admin.news.delete_confirm', 'Delete this article permanently?'))) {
      return;
    }

    const res = await api('/api/admin/news/' + newsId, { method: 'DELETE' });
    if (!res.ok) {
      const msg = (res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.news.delete_failed', 'Failed to delete article.') : 'Failed to delete article.');
      setMsg(msg, true);
      return;
    }

    if (STATE.editingNewsId && Number(STATE.editingNewsId) === Number(newsId)) {
      resetNewsForm();
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.news.deleted_success', 'Article deleted successfully.') : 'Article deleted successfully.', false);
    loadAll();
  }

  async function toggleNewsStatus(newsId) {
    const article = findNewsById(newsId);
    if (!article) {
      setMsg(window.i18nSpan ? window.i18nSpan('admin.news.not_found', 'Article not found.') : 'Article not found.', true);
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
      const msg = (res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.news.status_update_failed', 'Failed to update article status.') : 'Failed to update article status.');
      setMsg(msg, true);
      return;
    }

    if (STATE.editingNewsId && Number(STATE.editingNewsId) === Number(newsId)) {
      openNewsForm(res.data.article || article);
    }

    setMsg(window.i18nSpan ? window.i18nSpan('admin.news.status_updated', 'Article status updated.') : 'Article status updated.', false);
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
        setExpertInlineMsg(window.i18nSpan ? window.i18nSpan('admin.expert.create.error_missing_fields', 'First name, last name and email are required.') : 'First name, last name and email are required.', true);
        return;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setExpertInlineMsg(window.i18nSpan ? window.i18nSpan('admin.expert.invalid_email', 'Please enter a valid email address.') : 'Please enter a valid email address.', true);
        return;
      }

      setExpertInlineMsg('');
      submitBtn.disabled = true;
      submitBtn.innerHTML = window.i18nSpan ? window.i18nSpan('actions.creating', 'Creating...') : esc('Creating...');

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
      submitBtn.innerHTML = window.i18nSpan ? window.i18nSpan('actions.create_expert', 'Create Expert') : esc('Create Expert');

      if (!res.ok) {
        const msg = (res.data && res.data.error) || (window.i18nSpan ? window.i18nSpan('admin.expert.create_failed', 'Failed to create expert.') : 'Failed to create expert.');
        setExpertInlineMsg(msg, true);
        setMsg(msg, true);
        return;
      }

      const tempPassword = (res.data && res.data.temporary_password) || '(not provided)';
      var createdMsgTemplate = t('admin.expert.created_with_password', 'Expert created. Default password: {{password}}');
      var createdMsg = createdMsgTemplate.replace(/{{\s*password\s*}}/g, tempPassword);
      setExpertInlineMsg(createdMsg);
      setMsg(window.i18nSpan ? window.i18nSpan('admin.expert.created_success', 'Expert created successfully.') : 'Expert created successfully.', false);
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
