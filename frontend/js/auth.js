/* ============================================================
   CAAR — auth.js  (v2 — backward-compatible wrapper)
   ─────────────────────────────────────────────────────────
   This file is LOADED AFTER app-state.js on every page.
   It keeps the old function names that HTML onclick="" and
   other scripts reference, but delegates to the new module.

   LOAD ORDER (in every HTML file):
     <script src="app-state.js"></script>   ← state engine
     <script src="auth.js"></script>         ← this file
     <script src="main.js"></script>         ← header injection
   ============================================================ */

'use strict';

/* ── Keep these for backward compatibility with existing HTML ── */
var AUTH_API = window.CAAR && window.CAAR.API
  ? window.CAAR.API
  : 'http://localhost:3000';

/* ── Re-export as globals for pages that call auth.* directly ── */

// These are already set by app-state.js, but we keep them here
// in case auth.js is loaded without app-state.js on old pages.
if (typeof window.getToken === 'undefined') {
  window.getToken = function() {
    return localStorage.getItem('token') || localStorage.getItem('caar_auth_token') || null;
  };
}

if (typeof window.getRole === 'undefined') {
  window.getRole = function() {
    var user = window.getUser ? window.getUser() : null;
    if (user && user.role) return user.role;
    return localStorage.getItem('role') || null;
  };
}

if (typeof window.isLoggedIn === 'undefined') {
  window.isLoggedIn = function() {
    return typeof window.isAuthenticated === 'function'
      ? window.isAuthenticated()
      : !!window.getToken();
  };
}

/* ── getDashboardUrl — kept for main.js and header component ── */
window.getDashboardUrl = function(role) {
  var map = {
    client: 'client-dashboard.html',
    admin:  'admin-dashboard.html',
    expert: 'expert-dashboard.html',
  };
  return map[role] || 'client-dashboard.html';
};

/* ── redirectToDashboard ── */
window.redirectToDashboard = function() {
  if (typeof window.mustChangePassword === 'function' && window.mustChangePassword()) {
    window.location.href = 'change-password.html';
    return;
  }

  var user = window.getUser ? window.getUser() : null;
  var role = user ? user.role : (localStorage.getItem('role') || 'client');
  window.location.href = window.getDashboardUrl(role);
};

/* ── requireAuth guard — kept for pages not yet using initApp() ── */
window.requireAuth = function() {
  if (typeof window.isAuthenticated === 'function') {
    if (!window.isAuthenticated()) {
      window.location.href = 'login.html';
      return;
    }
  } else {
    if (!window.getToken()) {
      window.location.href = 'login.html';
      return;
    }
  }

  if (typeof window.mustChangePassword === 'function' && window.mustChangePassword()) {
    window.location.href = 'change-password.html';
  }
};

/* ── logout — kept so existing onclick="logout()" works ── */
if (typeof window.logout === 'undefined' || window.logout.name !== 'logout') {
  window.logout = function() {
    if (window.initHeaderAuth && typeof window.logout === 'function' && window.logout !== this) {
      return window.logout();
    }
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('caar_auth_token');
    localStorage.removeItem('must_change_password');
    window.location.href = 'index.html';
  };
}

/* ── renderAuthHeader — old name used by some pages ── */
window.renderAuthHeader = function() {
  if (typeof window.renderHeader === 'function') {
    window.renderHeader();
  }
};

/* ── initUserMenuToggle — kept for header component ── */
window.initUserMenuToggle = function() {
  // Now handled inside renderHeader() via app-state.js
  // Kept as no-op for compatibility
};