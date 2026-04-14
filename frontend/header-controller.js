'use strict';

/* ============================================================
   CAAR — header-controller.js  (REFACTORED — v4)

   SINGLE SOURCE OF TRUTH for all header behaviour.

   RESPONSIBILITIES:
     • Resolve auth state from JWT (via app-state.js)
     • Render login/user UI in the injected header HTML
     • Bind ALL header events exactly once (_initialized guard)
     • Manage every interactive state via CSS class toggles:
         - .open  on #userDropdown
         - .open  on #searchBar  (via header-extras.css)
         - .show  on #langDropdownMenu
         - .open  on #mobileNav
     • Set active nav link from current URL
     • Expose:  Header.init()  Header.render(user)

   NOT responsible for:
     • Auth storage      → app-state.js
     • Component inject  → main.js
     • Page utilities    → main.js
   ============================================================ */

const Header = (() => {

  /* ── State ─────────────────────────────────────────────── */
  let _initialized = false;

  /* ── PAGE → NAV section map ────────────────────────────── */
  const PAGE_MAP = {
    'index':               'index',
    '':                    'index',
    'products':            'products',
    'individual-risks':    'products',
    'auto-insurance':      'products',
    'transport-insurance': 'products',
    'technical-risks':     'products',
    'industrial-risks':    'products',
    'Online_subscription': 'products',
    'catnat-subscription': 'products',
    'roads':               'products',
    'company':             'company',
    'company-careers':     'company',
    'network':             'network',
    'news':                'news',
    'article-accident':    'news',
    'article-home':        'news',
    'article-business':    'news',
    'article-basics':      'news',
    'contact':             'contact',
  };

  /* ── Helpers ────────────────────────────────────────────── */
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

  /* ── Close everything ───────────────────────────────────── */
  function resetState() {
    /* Dropdown */
    document.getElementById('userDropdown')?.classList.remove('open');

    /* Search bar */
    const sb = document.getElementById('searchBar');
    if (sb) { sb.classList.remove('open'); sb.setAttribute('aria-hidden', 'true'); }

    /* Lang */
    document.getElementById('langDropdownMenu')?.classList.remove('show');
    document.getElementById('langDropdown')?.classList.remove('lang-open');

    /* Mobile */
    const mn = document.getElementById('mobileNav');
    const mo = document.getElementById('mobileNavOverlay');
    if (mn) { mn.classList.remove('open'); mn.setAttribute('aria-hidden', 'true'); }
    if (mo) mo.classList.remove('open');
    document.body.style.overflow = '';

    /* Touch dropdowns */
    document.querySelectorAll('.dropdown.touch-open').forEach(dd => {
      dd.classList.remove('touch-open');
    });
  }

  /* ── render(user) — update auth UI in-place ─────────────── */
  function render(user) {
    _log('render →', user ? user.email : 'guest');

    const loginBtn = document.getElementById('loginBtn');
    const userMenu = document.getElementById('userMenu');

    if (!loginBtn || !userMenu) {
      _log('render: DOM not ready (header not injected yet)');
      return;
    }

    /* Guest */
    if (!user) {
      loginBtn.style.display = 'inline-flex';
      userMenu.style.display = 'none';
      return;
    }

    /* Authenticated */
   const dashboardBtn = document.getElementById('dashboardBtn');

if (!user) {
  loginBtn.style.display = 'inline-flex';
  userMenu.style.display = 'none';
  if (dashboardBtn) dashboardBtn.style.display = 'none';
  return;
}

loginBtn.style.display = 'none';
userMenu.style.display = 'block';
if (dashboardBtn) dashboardBtn.style.display = 'inline-flex';
   const name = user.first_name || user.email.split('@')[0];
    const initials = _buildInitials(name);
    const role     = user.role || 'client';
    const dashHref = (window.DASHBOARD_MAP && window.DASHBOARD_MAP[role])
      ? window.DASHBOARD_MAP[role]
      : 'client-dashboard.html';

    /* Fill without cloneNode / replaceChild */
    _setText('userName',     name.split(' ')[0]);
    _setText('userAvatar',   initials);
    _setText('dropUserName', name);
    _setText('dropUserRole', role);

    const dashLink = document.getElementById('dashboardLink');
    if (dashLink) dashLink.href = dashHref;

    _log('render: authenticated', { name, initials, role, dashHref });
  }

  /* ── setActiveNav — mark current page in nav ────────────── */
  function _setActiveNav() {
    const file = window.location.pathname.split('/').pop().replace('.html', '') || '';
    const page = PAGE_MAP[file] || '';
    if (!page) return;
    document.querySelectorAll('[data-page]').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });
  }

  /* ── bindEvents — attach listeners ONCE ─────────────────── */
  function bindEvents() {
    if (_initialized) {
      _log('bindEvents: already initialized — skip');
      return;
    }
    _initialized = true;
    _log('bindEvents: attaching all listeners');

    /* 1. User dropdown ──────────────────────────────────── */
    const userTrigger  = document.getElementById('userTrigger');
    const userDropdown = document.getElementById('userDropdown');

    if (userTrigger && userDropdown) {
      userTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = userDropdown.classList.contains('open');
        resetState();
        if (!wasOpen) {
          userDropdown.classList.add('open');
          _log('dropdown: opened');
        }
      });
    }

    /* Close dropdown on outside click */
    document.addEventListener('click', (e) => {
      const um = document.getElementById('userMenu');
      if (um && !um.contains(e.target)) {
        const dd = document.getElementById('userDropdown');
        if (dd?.classList.contains('open')) {
          dd.classList.remove('open');
        }
      }
    });

    /* 2. Logout ─────────────────────────────────────────── */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        _log('logout triggered');
        if (typeof window.logout === 'function') window.logout();
      });
    }

    /* 3. Search bar ─────────────────────────────────────── */
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
        if (searchBar) { searchBar.classList.remove('open'); searchBar.setAttribute('aria-hidden', 'true'); }
        _log('search: closed');
      });
    }

    /* 4. Language dropdown ──────────────────────────────── */
    const langToggle  = document.getElementById('langToggleBtn');
    const langMenu    = document.getElementById('langDropdownMenu');
    const langDrop    = document.getElementById('langDropdown');
    const currentLang = document.getElementById('currentLang');

    if (langToggle && langMenu) {
      langToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const wasOpen = langMenu.classList.contains('show');
        resetState();
        if (!wasOpen) {
          langMenu.classList.add('show');
          if (langDrop) langDrop.classList.add('lang-open');
          _log('lang: opened');
        }
      });

      langMenu.querySelectorAll('[data-lang]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (currentLang) currentLang.textContent = link.getAttribute('data-lang');
          langMenu.classList.remove('show');
          if (langDrop) langDrop.classList.remove('lang-open');
        });
      });
    }

    /* 5. Mobile nav ─────────────────────────────────────── */
    const mobileBtn     = document.getElementById('mobileMenuBtn');
    const mobileNav     = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileNavOverlay');
    const mobileClose   = document.getElementById('mobileNavClose');

    function openMobile() {
      if (mobileNav)     { mobileNav.classList.add('open');    mobileNav.setAttribute('aria-hidden', 'false'); }
      if (mobileOverlay)   mobileOverlay.classList.add('open');
      if (mobileBtn)       mobileBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMobile() {
      if (mobileNav)     { mobileNav.classList.remove('open'); mobileNav.setAttribute('aria-hidden', 'true'); }
      if (mobileOverlay)   mobileOverlay.classList.remove('open');
      if (mobileBtn)       mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (mobileBtn)     mobileBtn.addEventListener('click', openMobile);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobile);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobile));
    }

    /* 6. Touch-friendly desktop dropdowns ──────────────── */
    document.querySelectorAll('.dropdown').forEach(dd => {
      dd.addEventListener('touchstart', (e) => {
        const wasOpen = dd.classList.contains('touch-open');
        document.querySelectorAll('.dropdown.touch-open').forEach(x => {
          if (x !== dd) x.classList.remove('touch-open');
        });
        if (!wasOpen) { e.preventDefault(); dd.classList.add('touch-open'); }
        else dd.classList.remove('touch-open');
      }, { passive: false });
    });

    document.addEventListener('touchstart', (e) => {
      if (!e.target.closest?.('.dropdown')) {
        document.querySelectorAll('.dropdown.touch-open').forEach(dd => {
          dd.classList.remove('touch-open');
        });
      }
    }, { passive: true });

    /* 7. Escape key — close everything ─────────────────── */
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') resetState();
    });

    /* 8. Active nav ─────────────────────────────────────── */
    _setActiveNav();

    _log('bindEvents: complete');
  }

  /* ── init() — called once after header HTML is injected ── */
  function init() {
    _log('init: starting');

    /* Resolve current auth state */
    const user = (typeof window.getUser === 'function') ? window.getUser() : null;

    /* Wire up all events */
    bindEvents();

    /* Render login / user UI */
    render(user);

    /* Signal that the header is ready for renderAuthHeader() calls */
    window.__caarHeaderReady = true;

    _log('init: complete —', user ? 'authenticated as ' + user.role : 'guest');
  }

  /* ── Public API ──────────────────────────────────────────── */
  return { init, render, resetState };

})();

/* ── Global exposure ─────────────────────────────────────── */
window.Header = Header;

/* ── Backward-compat shim ────────────────────────────────── */
window.renderAuthHeader = function () {
  if (!window.__caarHeaderReady) return;
  const user = (typeof window.getUser === 'function') ? window.getUser() : null;
  Header.render(user);
};