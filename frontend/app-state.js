'use strict';

/* ============================================================
   CAAR — app-state.js  (REFACTORED — v4)

   RESPONSIBILITIES:
     • JWT decode + expiry check
     • Auth primitives: getToken(), getUser(), isAuthenticated()
     • logout()
     • apiRequest() — attaches Bearer token automatically
     • loadContracts() — client contract grid
     • renderAuthHeader() — delegates to header-controller.js

   NOT responsible for:
     • Header DOM manipulation  → header-controller.js
     • Component injection       → main.js
     • cloneNode / replaceChild  → REMOVED
   ============================================================ */

var CAAR_API   = 'http://localhost:3000';
var CAAR_DEBUG = true;

/* ── esc (safe HTML escape) ───────────────────────────────── */
function esc(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

var DASHBOARD_MAP = {
  client: 'client-dashboard.html',
  admin:  'admin-dashboard.html',
  expert: 'expert-dashboard.html',
};

/* ── JWT ─────────────────────────────────────────────────── */
function _decodeJWT(token) {
  try {
    var b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    return JSON.parse(atob(b64));
  } catch (_) { return null; }
}

function _expired(p) {
  return !p || !p.exp || p.exp * 1000 < Date.now();
}

/* ── Logging ─────────────────────────────────────────────── */
function _log() {
  if (!CAAR_DEBUG) return;
  console.log.apply(console, ['[CAAR]'].concat(Array.prototype.slice.call(arguments)));
}

/* ── Auth primitives ─────────────────────────────────────── */
function getToken() {
  return localStorage.getItem('token') || null;
}

function getUser() {
  var t = getToken();
  if (!t) return null;
  var p = _decodeJWT(t);
  if (_expired(p)) { _clearAuth(); return null; }
  return p;
}

function isAuthenticated() {
  return getUser() !== null;
}

function _clearAuth() {
  ['token', 'role', 'user', 'caar_auth_token', 'must_change_password'].forEach(function (k) {
    localStorage.removeItem(k);
  });
}

function mustChangePassword() {
  var raw = localStorage.getItem('must_change_password');
  if (raw === '1') return true;

  try {
    var u = JSON.parse(localStorage.getItem('user') || 'null');
    return !!(u && u.must_change_password);
  } catch (_) {
    return false;
  }
}

/* ── renderAuthHeader ────────────────────────────────────────
   Delegates entirely to header-controller.js.
   NO direct DOM manipulation here.
   Safe to call at any time — guards against header not ready.
   ──────────────────────────────────────────────────────────── */
function renderAuthHeader() {
  if (!window.__caarHeaderReady) {
    _log('renderAuthHeader: header not ready yet — will be called by Header.init()');
    return;
  }
  var payload = getUser();
  if (window.Header && typeof window.Header.render === 'function') {
    window.Header.render(payload);
  }
}

/* ── logout ──────────────────────────────────────────────── */
function logout() {
  _log('logout()');
  _clearAuth();
  window.location.href = 'index.html';
}

/* ── apiRequest ──────────────────────────────────────────── */
async function apiRequest(path, opts) {
  opts = opts || {};
  var token   = getToken();
  var headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (token) headers['Authorization'] = 'Bearer ' + token;

  _log('→', (opts.method || 'GET'), path);

  var res, data;
  try {
    res = await fetch(CAAR_API + path, {
      method:  opts.method || 'GET',
      headers: headers,
      body:    opts.body ? JSON.stringify(opts.body) : undefined,
    });
  } catch (e) {
    _log('network error:', e.message);
    throw e;
  }

  try { data = await res.json(); } catch (_) { data = {}; }
  _log('←', res.status, path);

  if (res.status === 401) {
    _log('401 — clearing session');
    _clearAuth();
    if (!window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
  }

  return { ok: res.ok, status: res.status, data: data };
}

/* ── initApp ─────────────────────────────────────────────── */
async function initApp(opts) {
  opts = opts || {};
  var payload = getUser();

  if (!payload) {
    renderAuthHeader();
    if (opts.requireAuth) window.location.href = 'login.html';
    return;
  }

  if (opts.requireRole && payload.role !== opts.requireRole) {
    window.location.href = DASHBOARD_MAP[payload.role] || 'client-dashboard.html';
    return;
  }

  if (mustChangePassword() && !window.location.pathname.includes('change-password')) {
    window.location.href = 'change-password.html';
    return;
  }

  renderAuthHeader();
  _refreshProfile();
}

async function _refreshProfile() {
  try {
    var r = await apiRequest('/api/auth/me');
    if (r.ok && r.data && r.data.user) {
      localStorage.setItem('user', JSON.stringify(r.data.user));
    }
  } catch (_) {}
}

/* ── loadContracts ───────────────────────────────────────── */
async function loadContracts(gridId) {
  var grid = document.getElementById(gridId || 'contracts-cards-grid');
  if (!grid) return [];

  grid.innerHTML =
    '<div style="padding:40px;text-align:center;color:#999;grid-column:1/-1;">' +
    '<div style="width:22px;height:22px;border:2px solid #f0ece6;border-top-color:#E8761E;border-radius:50%;animation:spin .8s linear infinite;margin:0 auto 10px;"></div>' +
    (window.i18nSpan ? window.i18nSpan('contracts.loading', 'Loading your contracts…') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.loading', 'Loading your contracts…') : 'Loading your contracts…')) + '</div>';

  var r;
  try { r = await apiRequest('/api/contracts/my'); }
  catch (_) {
    grid.innerHTML = '<div style="padding:32px;text-align:center;color:#e53e3e;grid-column:1/-1;">' +
      (window.i18nSpan ? window.i18nSpan('contracts.network_error', '⚠ Network error.') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.network_error', '⚠ Network error.') : '⚠ Network error.')) +
      '</div>';
    return [];
  }

  if (!r.ok) {
    grid.innerHTML = '<div style="padding:32px;text-align:center;color:#e53e3e;grid-column:1/-1;">⚠ HTTP ' + r.status + (r.data.error ? ' — ' + r.data.error : '') + '</div>';
    return [];
  }

  var list = r.data.contracts || [];
  if (!list.length) {
    grid.innerHTML =
      '<div style="grid-column:1/-1;text-align:center;padding:52px 24px;border:1.5px dashed #e0e0e0;border-radius:14px;color:#888;font-size:.84rem;">' +
      '<div style="font-size:2rem;margin-bottom:12px;">📄</div><strong>' + (window.i18nSpan ? window.i18nSpan('contracts.no_contracts', 'No contracts yet') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.no_contracts', 'No contracts yet') : 'No contracts yet')) + '</strong>' +
      '<p style="margin-top:6px;">' + (window.i18nSpan ? window.i18nSpan('contracts.subscribe_message', 'Subscribe to a product to see your contracts here.') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.subscribe_message', 'Subscribe to a product to see your contracts here.') : 'Subscribe to a product to see your contracts here.')) + '</p>' +
      '<a href="Online_subscription.html" style="display:inline-block;margin-top:16px;padding:10px 22px;background:#E8761E;color:#fff;border-radius:8px;font-weight:700;text-decoration:none;">' + (window.i18nSpan ? window.i18nSpan('actions.browse_products', 'Browse Products →') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('actions.browse_products', 'Browse Products →') : 'Browse Products →')) + '</a></div>';
    return [];
  }

  try {
    grid.innerHTML = list.map(function (co) {
      var a       = co.status === 'active';
      var startFmt = co.start_date ? new Date(co.start_date).toLocaleDateString('en-GB') : '—';
      var endFmt   = co.end_date   ? new Date(co.end_date).toLocaleDateString('en-GB')   : '—';
      var prem     = co.premium_amount != null
        ? Number(co.premium_amount).toLocaleString('fr-DZ', { minimumFractionDigits: 2 }) + ' DZD' : '—';
      return (
        '<div class="contract-full-card' + (a ? '' : ' contract-full-card--expired') + '">' +
        '<div class="cfc-header"><div class="cfc-icon ' + (a ? 'cfc-icon--blue' : 'cfc-icon--gray') + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
        '<polyline points="14 2 14 8 20 8"/></svg></div>' +
        '<div class="cfc-meta"><div class="cfc-type">' + (co.product_name || 'Contract') + '</div>' +
        '<div class="cfc-ref">' + (co.policy_reference || '#' + co.contract_id) + '</div></div>' +
        '<span class="cfc-badge ' + (a ? 'cfc-badge--active' : 'cfc-badge--expired') + '">' + (a ? (window.i18nSpan ? window.i18nSpan('status.active','Active') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('status.active', 'Active') : 'Active')) : esc(co.status)) + '</span></div>' +
        '<div class="cfc-body">' +
        (co.plan_name ? '<div class="cfc-row"><span class="cfc-label">' + (window.i18nSpan ? window.i18nSpan('contracts.plan_label','Plan') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.plan_label', 'Plan') : 'Plan')) + '</span><span class="cfc-value">' + co.plan_name + '</span></div>' : '') +
        '<div class="cfc-row"><span class="cfc-label">' + (window.i18nSpan ? window.i18nSpan('contracts.start_label','Start') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.start_label', 'Start') : 'Start')) + '</span><span class="cfc-value">' + startFmt + '</span></div>' +
        '<div class="cfc-row"><span class="cfc-label">' + (window.i18nSpan ? window.i18nSpan('contracts.end_label','End') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.end_label', 'End') : 'End')) + '</span><span class="cfc-value">' + endFmt + '</span></div>' +
        '<div class="cfc-row"><span class="cfc-label">' + (window.i18nSpan ? window.i18nSpan('contracts.premium_label','Premium') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('contracts.premium_label', 'Premium') : 'Premium')) + '</span><span class="cfc-value">' + prem + ' / yr</span></div></div>' +
        '<div class="cfc-footer">' +
        (a ? '<button class="cfc-btn-doc" onclick="window.__openClaimForContract(' + co.contract_id + ',\'' + (co.policy_reference || '') + '\')">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' + (window.i18nSpan ? window.i18nSpan('actions.file_claim','File a Claim') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('actions.file_claim', 'File a Claim') : 'File a Claim')) + '</button>' : '') +
        '<button class="cfc-btn-sec" onclick="window.location.href=\'contact.html\'">' + (window.i18nSpan ? window.i18nSpan('actions.renew','Renew') : (window.Language && typeof window.Language.t === 'function' ? window.Language.t('actions.renew', 'Renew') : 'Renew')) + '</button>' +
        '</div></div>'
      );
    }).join('');
  } catch (renderErr) {
    _log('[Contracts] Rendering error:', renderErr.message);
    console.error('[Contracts] Failed to render contracts:', renderErr);
    grid.innerHTML = '<div style="padding:32px;text-align:center;color:#e53e3e;grid-column:1/-1;">⚠ Failed to display contracts. Please refresh the page.</div>';
    return [];
  }

  return list;
}

/* ── Expose globals ──────────────────────────────────────── */
window.CAAR_API         = CAAR_API;
window.DASHBOARD_MAP    = DASHBOARD_MAP;
window.getToken         = getToken;
window.getUser          = getUser;
window.isAuthenticated  = isAuthenticated;
window.logout           = logout;
window.renderAuthHeader = renderAuthHeader;
window.initApp          = initApp;
window.apiRequest       = apiRequest;
window.loadContracts    = loadContracts;
window.mustChangePassword = mustChangePassword;
