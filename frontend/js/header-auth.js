/**
 * CAAR — header-auth.js
 * Centralized source of truth for auth state and header UI synchronization.
 */

'use strict';

/**
 * Safely parses the auth state from localStorage.
 * Handles double-stringified user payloads and malformed data.
 */
function getAuthState() {
  const token = localStorage.getItem('token');
  let user = null;
  const rawUser = localStorage.getItem('user');

  if (rawUser) {
    try {
      user = JSON.parse(rawUser);
      // Handle double-stringification
      if (typeof user === 'string') {
        user = JSON.parse(user);
      }
    } catch (e) {
      console.error('[HeaderAuth] Failed to parse user payload:', e);
      user = null;
    }
  }

  return {
    token,
    user,
    isLoggedIn: !!(token && user)
  };
}

/**
 * Centralized logout handler.
 */
function logout() {
  console.log('[HeaderAuth] Logging out...');
  ['token', 'role', 'user', 'caar_auth_token', 'must_change_password'].forEach(k => {
    localStorage.removeItem(k);
  });
  window.location.href = 'login.html';
}

/**
 * Synchronizes both desktop and mobile auth UI based on the current state.
 */
function syncAuthUI() {
  const { user, isLoggedIn } = getAuthState();
  
  // Desktop elements
  const loginBtn = document.getElementById('loginBtn');
  const dashboardBtn = document.getElementById('dashboardBtn');
  const userMenu = document.getElementById('userMenu');
  const userNameEl = document.getElementById('userName');
  const userAvatarEl = document.getElementById('userAvatar');
  const dropUserNameEl = document.getElementById('dropUserName');
  const dropUserRoleEl = document.getElementById('dropUserRole');
  const logoutBtn = document.getElementById('logoutBtn');

  // Mobile elements
  const mobileLoginBtn = document.getElementById('mobileLoginBtn');
  const mobileDashboardBtn = document.getElementById('mobileDashboardBtn');
  const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');

  const role = user?.role || 'client';
  const dashHref = {
    admin: 'admin-dashboard.html',
    expert: 'expert-dashboard.html',
    client: 'client-dashboard.html'
  }[role] || 'client-dashboard.html';

  if (isLoggedIn) {
    // Desktop: Logged In
    if (loginBtn) loginBtn.style.display = 'none';
    if (dashboardBtn) {
      dashboardBtn.style.display = 'inline-flex';
      dashboardBtn.href = dashHref;
    }
    if (userMenu) userMenu.style.display = 'block';
    
    // Update user info
    const firstName = user.first_name || user.email?.split('@')[0] || 'User';
    const initials = firstName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    
    if (userNameEl) userNameEl.textContent = firstName.split(' ')[0];
    if (userAvatarEl) userAvatarEl.textContent = initials || '?';
    if (dropUserNameEl) dropUserNameEl.textContent = user.first_name + ' ' + (user.last_name || '');
    if (dropUserRoleEl) dropUserRoleEl.textContent = role;

    // Mobile: Logged In
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'none';
    if (mobileDashboardBtn) {
      mobileDashboardBtn.style.display = 'block';
      mobileDashboardBtn.href = dashHref;
    }
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'block';

  } else {
    // Desktop: Logged Out
    if (loginBtn) loginBtn.style.display = 'inline-flex';
    if (dashboardBtn) dashboardBtn.style.display = 'none';
    if (userMenu) userMenu.style.display = 'none';

    // Mobile: Logged Out
    if (mobileLoginBtn) mobileLoginBtn.style.display = 'block';
    if (mobileDashboardBtn) mobileDashboardBtn.style.display = 'none';
    if (mobileLogoutBtn) mobileLogoutBtn.style.display = 'none';
  }

  // Bind logout events
  [logoutBtn, mobileLogoutBtn].forEach(btn => {
    if (btn && !btn.dataset.authBound) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        logout();
      });
      btn.dataset.authBound = 'true';
    }
  });

  // Bind dashboard events
  [dashboardBtn, mobileDashboardBtn].forEach(btn => {
    if (btn && !btn.dataset.authBound) {
      btn.addEventListener('click', e => {
        const { isLoggedIn, user } = getAuthState();
        if (!isLoggedIn) {
          e.preventDefault();
          window.location.href = 'login.html';
          return;
        }
        // If must change password, redirect there
        if (localStorage.getItem('must_change_password') === '1' || (user && user.must_change_password)) {
          e.preventDefault();
          window.location.href = 'change-password.html';
        }
      });
      btn.dataset.authBound = 'true';
    }
  });
}

/**
 * Initializes header auth logic.
 * Should be called AFTER the header component is injected into the DOM.
 */
function initHeaderAuth() {
  console.log('[HeaderAuth] Initializing...');
  syncAuthUI();
  
  // Expose to window for global access if needed
  window.getAuthState = getAuthState;
  window.logout = logout;
  window.syncAuthUI = syncAuthUI;
}

// Ensure initHeaderAuth is available globally
window.initHeaderAuth = initHeaderAuth;
