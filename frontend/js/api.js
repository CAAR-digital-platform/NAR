/* ============================================================
   CAAR — api.js  (Centralized API helper)
   Load this AFTER app-state.js on every page that needs API calls.
   <script src="api.js"></script>
   ============================================================ */
'use strict';

var CAAR_API_BASE = 'http://localhost:3000';

/* ── Get stored token ── */
function getToken() {
  return localStorage.getItem('token') || localStorage.getItem('caar_auth_token') || null;
}

/* ── Core request helper ── */
async function apiRequest(path, method, body) {
  method = method || 'GET';
  var token = getToken();
  var headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  var opts = { method: method, headers: headers };
  if (body && method !== 'GET') opts.body = JSON.stringify(body);

  var res, data;
  try {
    res = await fetch(CAAR_API_BASE + path, opts);
  } catch (e) {
    alert('Network error. Please check your connection.');
    throw e;
  }

  try { data = await res.json(); } catch (_) { data = {}; }

  if (res.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (!window.location.pathname.includes('login')) {
      window.location.href = 'login.html';
    }
    throw new Error('Unauthorized');
  }

  return { ok: res.ok, status: res.status, data: data };
}

/* ── Button loading helpers ── */
function btnLoading(btn, msg) {
  if (!btn) return;
  btn.disabled = true;
  btn._orig = btn.textContent;
  btn.textContent = msg || 'Loading…';
}
function btnReset(btn) {
  if (!btn) return;
  btn.disabled = false;
  btn.textContent = btn._orig || 'Submit';
}

/* ── Show inline error/success ── */
function showMsg(elId, msg, isError) {
  var el = document.getElementById(elId);
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.color = isError ? '#e53e3e' : '#276749';
  el.style.background = isError ? '#fff5f5' : '#f0fff4';
  el.style.border = '1px solid ' + (isError ? '#fed7d7' : '#9ae6b4');
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.fontSize = '0.84rem';
  el.style.fontWeight = '600';
  el.style.marginTop = '12px';
}
function hideMsg(elId) {
  var el = document.getElementById(elId);
  if (el) el.style.display = 'none';
}

window.CAAR_API_BASE = CAAR_API_BASE;
window.apiRequest    = apiRequest;
window.getToken      = getToken;
window.btnLoading    = btnLoading;
window.btnReset      = btnReset;
window.showMsg       = showMsg;
window.hideMsg       = hideMsg;