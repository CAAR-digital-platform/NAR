/* ============================================================
   CAAR — api.js  (UI utilities only)
   Keep app-state.js as the single source of truth for apiRequest().
   This file only provides loading and inline message helpers.
   ============================================================ */
'use strict';

var CAAR_API_BASE = 'http://localhost:3000';

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
window.btnLoading    = btnLoading;
window.btnReset      = btnReset;
window.showMsg       = showMsg;
window.hideMsg       = hideMsg;
