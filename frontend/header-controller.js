'use strict';

/* ============================================================
   CAAR — header-controller.js  (v6 — fixed active nav)
   ============================================================ */

const Header = (() => {

  let _initialized = false;

  // Maps each page filename (without .html) to a nav section key
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

  // Maps nav section key to the href used in the nav link
  const NAV_HREF_MAP = {
    'index':    'index.html',
    'products': 'products.html',
    'company':  'company.html',
    'network':  'network.html',
    'news':     'news.html',
    'contact':  'contact.html',
  };

  function _log(action, data) {
    console.log('[HEADER]', action, data !== undefined ? data : '');
  }

  function _setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function _buildInitials(name) {
    return (name || '').trim()
      .split(/\s+/).map(w => w[0] || '').join('')
      .toUpperCase().slice(0, 2) || '?';
  }

  function resetState() {
    document.getElementById('userDropdown')?.classList.remove('open');
    const sb = document.getElementById('searchBar');
    if (sb) { sb.classList.remove('open'); sb.setAttribute('aria-hidden', 'true'); }
    document.getElementById('langDropdownMenu')?.classList.remove('show');
    document.getElementById('langDropdown')?.classList.remove('lang-open');
    const mn = document.getElementById('mobileNav');
    const mo = document.getElementById('mobileNavOverlay');
    if (mn) { mn.classList.remove('open'); mn.setAttribute('aria-hidden', 'true'); }
    if (mo) mo.classList.remove('open');
    document.body.style.overflow = '';
    document.querySelectorAll('.dropdown.touch-open').forEach(dd => dd.classList.remove('touch-open'));
  }

  function render(user) {
    _log('render →', user ? user.email : 'guest');

    const loginBtn     = document.getElementById('loginBtn');
    const userMenu     = document.getElementById('userMenu');
    const dashboardBtn = document.getElementById('dashboardBtn');

    if (!loginBtn || !userMenu) {
      _log('render: DOM not ready');
      return;
    }

    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const token      = localStorage.getItem('token');
    const activeUser = storedUser && token ? storedUser : null;

    if (!activeUser) {
      loginBtn.style.display    = 'inline-flex';
      userMenu.style.display    = 'none';
      if (dashboardBtn) dashboardBtn.style.display = 'none';
      return;
    }

    loginBtn.style.display    = 'none';
    userMenu.style.display    = 'block';
    if (dashboardBtn) dashboardBtn.style.display = 'inline-flex';

    const name     = activeUser.first_name || activeUser.email.split('@')[0];
    const initials = _buildInitials(name);
    const role     = activeUser.role || 'client';
    const dashHref = (window.DASHBOARD_MAP && window.DASHBOARD_MAP[role])
      ? window.DASHBOARD_MAP[role] : 'client-dashboard.html';

    _setText('userName',     name.split(' ')[0]);
    _setText('userAvatar',   initials);
    _setText('dropUserName', name);
    _setText('dropUserRole', role);

    const dashLink = document.getElementById('dashboardLink');
    if (dashLink) dashLink.href = dashHref;

    _log('render: authenticated', { name, initials, role, dashHref });
  }

  /* ── Active nav — matches current page to the correct nav link ── */
  function _setActiveNav() {
    // Get current filename without extension
    const rawFile = window.location.pathname.split('/').pop() || '';
    const file    = rawFile.replace('.html', '') || 'index';
    const section = PAGE_MAP[file] || '';

    if (!section) return;

    // The href that corresponds to this section
    const targetHref = NAV_HREF_MAP[section];
    if (!targetHref) return;

    // Find the nav link whose href matches the section's main page
    document.querySelectorAll('.nav-links .nav-link').forEach(link => {
      const href = link.getAttribute('href') || '';
      // Match by the target href for this section
      const isActive = href === targetHref ||
                       href.endsWith('/' + targetHref) ||
                       (section === 'index' && (href === 'index.html' || href === '/' || href === ''));

      if (isActive) {
        link.classList.add('active');
        link.style.color = 'var(--hdr-orange)';
      } else {
        link.classList.remove('active');
        link.style.color = '';
      }
    });

    _log('_setActiveNav: section=', section, 'targetHref=', targetHref);
  }

  function bindEvents() {
    if (_initialized) { _log('bindEvents: already initialized'); return; }
    _initialized = true;
    _log('bindEvents: attaching all listeners');

    /* 1. User dropdown */
    const userTrigger  = document.getElementById('userTrigger');
    const userDropdown = document.getElementById('userDropdown');
    if (userTrigger && userDropdown) {
      userTrigger.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = userDropdown.classList.contains('open');
        resetState();
        if (!wasOpen) userDropdown.classList.add('open');
      });
    }

    document.addEventListener('click', e => {
      const um = document.getElementById('userMenu');
      if (um && !um.contains(e.target)) {
        document.getElementById('userDropdown')?.classList.remove('open');
      }
    });

    /* 2. Logout */
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        _log('logout triggered');
        if (typeof window.logout === 'function') window.logout();
      });
    }

    /* 3. Search bar */
    const searchBtn   = document.getElementById('searchBtn');
    const searchBar   = document.getElementById('searchBar');
    const searchClose = document.getElementById('searchCloseHdr');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn && searchBar) {
      searchBtn.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = searchBar.classList.contains('open');
        resetState();
        if (!wasOpen) {
          searchBar.classList.add('open');
          searchBar.setAttribute('aria-hidden', 'false');
          if (searchInput) setTimeout(() => searchInput.focus(), 60);
        }
      });
    }
    if (searchClose) {
      searchClose.addEventListener('click', () => {
        if (searchBar) { searchBar.classList.remove('open'); searchBar.setAttribute('aria-hidden', 'true'); }
      });
    }

    /* 4. Language dropdown */
    const langToggle  = document.getElementById('langToggleBtn');
    const langMenu    = document.getElementById('langDropdownMenu');
    const langDrop    = document.getElementById('langDropdown');
    const currentLang = document.getElementById('currentLang');
    if (langToggle && langMenu) {
      langToggle.addEventListener('click', e => {
        e.stopPropagation();
        const wasOpen = langMenu.classList.contains('show');
        resetState();
        if (!wasOpen) { langMenu.classList.add('show'); if (langDrop) langDrop.classList.add('lang-open'); }
      });
      langMenu.querySelectorAll('[data-lang]').forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          var selectedLang = link.getAttribute('data-lang');
          if (selectedLang && window.Language && typeof window.Language.setLanguage === 'function') {
            window.Language.setLanguage(selectedLang);
          } else if (currentLang) {
            currentLang.textContent = selectedLang;
          }
          langMenu.classList.remove('show');
          if (langDrop) langDrop.classList.remove('lang-open');
        });
      });

      document.addEventListener('click', e => {
        if (!langDrop || !langMenu) return;
        if (!langDrop.contains(e.target)) {
          langMenu.classList.remove('show');
          langDrop.classList.remove('lang-open');
        }
      });
    }

    /* 5. Mobile nav */
    const mobileBtn     = document.getElementById('mobileMenuBtn');
    const mobileNav     = document.getElementById('mobileNav');
    const mobileOverlay = document.getElementById('mobileNavOverlay');
    const mobileClose   = document.getElementById('mobileNavClose');

    function openMobile() {
      if (mobileNav)     { mobileNav.classList.add('open'); mobileNav.setAttribute('aria-hidden', 'false'); }
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
    if (mobileNav)     mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobile));

    /* 5b. Auto-close mobile nav on resize to desktop */
var _mobileBreakpoint = 768;
var _resizeTimer = null;

window.addEventListener('resize', function () {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(function () {
    if (window.innerWidth > _mobileBreakpoint) {
      var nav = document.getElementById('mobileNav');
      if (nav && nav.classList.contains('open')) {
        closeMobile();
      }
    }
  }, 100);
});

    /* 6. Touch-friendly dropdowns */
    document.querySelectorAll('.dropdown').forEach(dd => {
      dd.addEventListener('touchstart', e => {
        const wasOpen = dd.classList.contains('touch-open');
        document.querySelectorAll('.dropdown.touch-open').forEach(x => { if (x !== dd) x.classList.remove('touch-open'); });
        if (!wasOpen) { e.preventDefault(); dd.classList.add('touch-open'); }
        else dd.classList.remove('touch-open');
      }, { passive: false });
    });
    document.addEventListener('touchstart', e => {
      if (!e.target.closest?.('.dropdown')) {
        document.querySelectorAll('.dropdown.touch-open').forEach(dd => dd.classList.remove('touch-open'));
      }
    }, { passive: true });

    /* 7. Escape */
    document.addEventListener('keydown', e => { if (e.key === 'Escape') resetState(); });
    /* 7b. Mobile login link — hide when authenticated */
var mobileLoginLink = document.getElementById('mobileLoginLink');
if (mobileLoginLink) {
  var _token = localStorage.getItem('token');
  if (_token) mobileLoginLink.style.display = 'none';
}

    /* 8. Active nav */
    _setActiveNav();

    _log('bindEvents: complete');
  }

  function init() {
    _log('init: starting');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    const token      = localStorage.getItem('token');
    const user       = (storedUser && token) ? storedUser : null;

    bindEvents();
    render(user);

    window.__caarHeaderReady = true;
    _log('init: complete —', user ? 'authenticated as ' + user.role : 'guest');
  }

  return { init, render, resetState };

})();

window.Header = Header;

window.renderAuthHeader = function () {
  if (!window.__caarHeaderReady) return;
  const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
  const token      = localStorage.getItem('token');
  const user       = (storedUser && token) ? storedUser : null;
  Header.render(user);
};