/* ============================================================
   CAAR — header-controller.js
   Single source of truth for all header behaviour.

   LOAD ORDER (every HTML page):
     <script src="app-state.js"></script>
     <script src="auth.js"></script>
     <script src="header-controller.js"></script>   ← NEW (before main.js)
     <script src="main.js"></script>
   ============================================================ */

'use strict';

const Header = (() => {

  /* ── Guard: bindEvents runs ONCE per page lifetime ── */
  let _initialized = false;

  /* ── Single source of truth for auth state ── */
  const AuthState = {
    user:            null,
    isAuthenticated: false,
  };

  /* ── Helpers ─────────────────────────────────────────────────── */

  function _log(action, data) {
    console.log('[HEADER]', action, data !== undefined ? data : '');
  }

  function _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function _buildInitials(name) {
    return (name || '').trim()
      .split(/\s+/)
      .map(w => w[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2) || '?';
  }

  function _resolveUserFromJWT() {
    const user = (typeof window.getUser === 'function') ? window.getUser() : null;
    AuthState.user            = user;
    AuthState.isAuthenticated = !!user;
    _log('AuthState resolved →', AuthState.isAuthenticated
      ? (user.email + ' / ' + user.role)
      : 'guest'
    );
    return user;
  }

  /* ── resetState: close EVERYTHING ───────────────────────────── */

  function resetState() {
    /* Dropdown — toggle ONLY on #userDropdown, never on #userMenu */
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.remove('open');

    /* Search bar */
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
      searchBar.classList.remove('open');
      searchBar.setAttribute('aria-hidden', 'true');
    }

    /* Language menu */
    const langMenu     = document.getElementById('langDropdownMenu');
    const langDropdown = document.getElementById('langDropdown');
    if (langMenu)     langMenu.classList.remove('show');
    if (langDropdown) langDropdown.classList.remove('lang-open');

    /* Mobile nav */
    const mobileNav     = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileNavOverlay');
    if (mobileNav)     { mobileNav.classList.remove('open'); mobileNav.setAttribute('aria-hidden', 'true'); }
    if (mobileOverlay)   mobileOverlay.classList.remove('open');
    document.body.style.overflow = '';

    /* Touch dropdowns */
    document.querySelectorAll('.dropdown.touch-open').forEach(dd => {
      dd.classList.remove('touch-open');
    });
  }

  /* ── render(user): update auth UI — NO DOM replacement ──────── */

  function render(user) {
    _log('render →', user ? user.email : 'guest');

    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');

    if (!loginBtn || !userMenu) {
      _log('render: DOM not ready yet, aborting');
      return;
    }

    /* ── Guest state ── */
    if (!user) {
      loginBtn.style.display = 'inline-flex';
      userMenu.style.display = 'none';
      _log('render: displayed as guest');
      return;
    }

    /* ── Authenticated state ── */
    loginBtn.style.display = 'none';
    userMenu.style.display = 'block';

    const name = user.first_name
      ? (user.first_name + ' ' + (user.last_name || '')).trim()
      : (user.email || 'User');

    const initials = _buildInitials(name);
    const role     = user.role || 'client';
    const dashHref = (window.DASHBOARD_MAP && window.DASHBOARD_MAP[role])
      ? window.DASHBOARD_MAP[role]
      : 'client-dashboard.html';

    /* Fill elements directly — no cloneNode, no replaceChild */
    _setText('userName',     name.split(' ')[0]);
    _setText('userAvatar',   initials);
    _setText('dropUserName', name);
    _setText('dropUserRole', role);

    const dashLink = document.getElementById('dashboardLink');
    if (dashLink) dashLink.href = dashHref;

    _log('render: displayed as authenticated', { name, initials, role, dashHref });
  }

  /* ── bindEvents: attach listeners ONCE ──────────────────────── */

  function bindEvents() {
    if (_initialized) {
      _log('bindEvents: already initialized — skip');
      return;
    }
    _initialized = true;
    _log('bindEvents: attaching all listeners');

    /* ── 1. User dropdown toggle ─────────────────────────────── */
    const userTrigger  = document.getElementById('userTrigger');
    const userDropdown = document.getElementById('userDropdown');

    if (userTrigger && userDropdown) {
      userTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = userDropdown.classList.contains('open');
        resetState();                     // close everything else first
        if (!wasOpen) {
          userDropdown.classList.add('open');
          _log('dropdown: opened');
        } else {
          _log('dropdown: closed (toggle)');
        }
      });
    }

    /* Close dropdown on outside click */
    document.addEventListener('click', (e) => {
      const um = document.getElementById('userMenu');
      if (um && !um.contains(e.target)) {
        const dd = document.getElementById('userDropdown');
        if (dd && dd.classList.contains('open')) {
          dd.classList.remove('open');
          _log('dropdown: closed (outside click)');
        }
      }
    });

    /* ── 2. Logout ───────────────────────────────────────────── */
    /*
      Attach directly — NO cloneNode, NO replaceChild.
      Works because bindEvents() is called exactly once
      after header HTML is injected.
    */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        _log('logout: triggered');
        if (typeof window.logout === 'function') window.logout();
      });
    }

    /* ── 3. Search bar ───────────────────────────────────────── */
    const searchBtn   = document.getElementById('searchBtn');
    const searchBar   = document.getElementById('searchBar');
    const searchClose = document.getElementById('searchCloseHdr');
    const searchInput = document.getElementById('searchInput');

    if (searchBtn && searchBar) {
      searchBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = searchBar.classList.contains('open');
        resetState();
        if (!wasOpen) {
          searchBar.classList.add('open');
          searchBar.setAttribute('aria-hidden', 'false');
          if (searchInput) setTimeout(() => searchInput.focus(), 60);
          _log('search: opened');
        }
      });
    }

    if (searchClose) {
      searchClose.addEventListener('click', () => {
        if (searchBar) {
          searchBar.classList.remove('open');
          searchBar.setAttribute('aria-hidden', 'true');
        }
        _log('search: closed');
      });
    }

    /* ── 4. Language dropdown ────────────────────────────────── */
    const langToggle   = document.getElementById('langToggleBtn');
    const langMenu     = document.getElementById('langDropdownMenu');
    const langDropdown = document.getElementById('langDropdown');
    const currentLang  = document.getElementById('currentLang');

    if (langToggle && langMenu) {
      langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = langMenu.classList.contains('show');
        resetState();
        if (!wasOpen) {
          langMenu.classList.add('show');
          if (langDropdown) langDropdown.classList.add('lang-open');
          _log('lang dropdown: opened');
        }
      });

      langMenu.querySelectorAll('[data-lang]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentLang) currentLang.textContent = link.getAttribute('data-lang');
          langMenu.classList.remove('show');
          if (langDropdown) langDropdown.classList.remove('lang-open');
          _log('lang: selected', link.getAttribute('data-lang'));
        });
      });
    }

    /* ── 5. Mobile nav ───────────────────────────────────────── */
    const mobileBtn     = document.getElementById('mobileMenuBtn');
    const mobileNav     = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileNavOverlay');
    const mobileClose   = document.getElementById('mobileNavClose');

    function openMobile() {
      if (mobileNav)     { mobileNav.classList.add('open');     mobileNav.setAttribute('aria-hidden', 'false'); }
      if (mobileOverlay)   mobileOverlay.classList.add('open');
      if (mobileBtn)       mobileBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      _log('mobile nav: opened');
    }

    function closeMobile() {
      if (mobileNav)     { mobileNav.classList.remove('open');  mobileNav.setAttribute('aria-hidden', 'true'); }
      if (mobileOverlay)   mobileOverlay.classList.remove('open');
      if (mobileBtn)       mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      _log('mobile nav: closed');
    }

    if (mobileBtn)     mobileBtn.addEventListener('click', openMobile);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobile);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(a => {
        a.addEventListener('click', closeMobile);
      });
    }

    /* ── 6. Touch-friendly desktop dropdowns ─────────────────── */
    document.querySelectorAll('.dropdown').forEach(dd => {
      dd.addEventListener('touchstart', (e) => {
        const wasOpen = dd.classList.contains('touch-open');
        document.querySelectorAll('.dropdown.touch-open').forEach(x => {
          if (x !== dd) x.classList.remove('touch-open');
        });
        if (!wasOpen) { e.preventDefault(); dd.classList.add('touch-open'); }
        else            dd.classList.remove('touch-open');
      }, { passive: false });
    });

    document.addEventListener('touchstart', (e) => {
      if (!e.target.closest || !e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.touch-open').forEach(dd => {
          dd.classList.remove('touch-open');
        });
      }
    }, { passive: true });

    /* ── 7. Escape key: close everything ─────────────────────── */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        resetState();
        _log('escape: all panels closed');
      }
    });

    /* ── 8. Active nav link ──────────────────────────────────── */
    _setActiveNav();

    _log('bindEvents: complete');
  }

  /* ── Active nav helper ───────────────────────────────────────── */

  function _setActiveNav() {
    const PAGE_MAP = {
      'index': 'index',               '': 'index',
      'products': 'products',         'individual-risks': 'products',
      'auto-insurance': 'products',   'transport-insurance': 'products',
      'technical-risks': 'products',  'industrial-risks': 'products',
      'Online_subscription': 'products',
      'catnat-subscription': 'products',
      'roads': 'products',
      'company': 'company',           'company-careers': 'company',
      'network': 'network',
      'news': 'news',                 'article-accident': 'news',
      'article-home': 'news',         'article-business': 'news',
      'article-basics': 'news',
      'contact': 'contact',
    };

    const file = window.location.pathname.split('/').pop().replace('.html', '') || '';
    const page = PAGE_MAP[file] || '';
    if (!page) return;

    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });
  }

  /* ── Public: init (called once after header HTML is injected) ── */

  function init() {
    _log('init: starting');
    const user = _resolveUserFromJWT();
    bindEvents();   // attaches listeners exactly once
    render(user);   // sets correct auth UI
    window.__caarHeaderReady = true;
    _log('init: complete');
  }

  /* ── Expose public API ───────────────────────────────────────── */
  return { init, render, resetState };

})();

/* ── Global exposure ─────────────────────────────────────────────────────── */
window.Header = Header;

/*
  renderAuthHeader() — backwards-compatible shim.
  All existing onclick="logout()" etc. still work.
  Delegates to Header.render() instead of duplicating logic.
*/
window.renderAuthHeader = function () {
  _log_compat('renderAuthHeader (legacy compat) called');
  if (!window.__caarHeaderReady) return; // header not injected yet — init() will handle it
  const user = (typeof window.getUser === 'function') ? window.getUser() : null;
  Header.render(user);
};

function _log_compat(msg) {
  console.log('[HEADER]', msg);
}