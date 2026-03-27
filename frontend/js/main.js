/* ============================================================
   CAAR — main.js  (v7)

   WHAT THIS FILE DOES
   ───────────────────
   • Fetches components/header.html into #site-header
   • Calls initHeader() ONCE after the HTML is in the DOM
   • Uses window.__caarHeaderReady as a global guard so
     initHeader() can NEVER run twice, even if main.js is
     accidentally loaded on multiple pages or called twice.

   CSS CLASSES MANAGED HERE
   ─────────────────────────
   .search-bar.open              → search input visible
   .lang-dropdown-menu.show      → language menu visible
   .mobile-nav.open              → drawer slides in
   .mobile-nav-overlay.open      → dark backdrop visible
   .dropdown.touch-open          → desktop submenu (touch)
   ============================================================ */

(function () {
  'use strict';

  /* ── Already initialised? Stop immediately. ── */
  if (window.__caarHeaderReady) return;

  /* ──────────────────────────────────────────────────────────
     UTIL: Resolve the URL of header.html from the script src
     so it works regardless of which sub-page we are on.
  ────────────────────────────────────────────────────────── */
  function resolveHeaderURL() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src');
      if (s && s.indexOf('main.js') !== -1) {
        var base = s.replace(/js\/main\.js.*$/, '');
        return base + 'components/header.html';
      }
    }
    var dir = window.location.pathname.slice(
      0,
      window.location.pathname.lastIndexOf('/') + 1
    );
    return dir + 'components/header.html';
  }

  /* ──────────────────────────────────────────────────────────
     ACTIVE PAGE DETECTION
  ────────────────────────────────────────────────────────── */
  function getActivePage() {
    var file =
      window.location.pathname.split('/').pop().replace('.html', '') || 'index';

    var map = {
      'index'              : 'index',
      ''                   : 'index',
      'products'           : 'products',
      'individual-risks'   : 'products',
      'auto-insurance'     : 'products',
      'transport-insurance': 'products',
      'technical-risks'    : 'products',
      'industrial-risks'   : 'products',
      'Online_subscription': 'products',
      'catnat-subscription': 'products',
      'roads'              : 'products',
      'company'            : 'company',
      'company-careers'    : 'company',
      'network'            : 'network',
      'news'               : 'news',
      'article-accident'   : 'news',
      'article-home'       : 'news',
      'article-business'   : 'news',
      'article-basics'     : 'news',
      'contact'            : 'contact',
    };

    return map[file] || '';
  }

  function setActiveNav() {
    var page = getActivePage();
    if (!page) return;
    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });
  }

  /* ──────────────────────────────────────────────────────────
     INIT HEADER — called ONCE after HTML is in the DOM
  ────────────────────────────────────────────────────────── */
  function initHeader() {
    /* Double-entry hard stop */
    if (window.__caarHeaderReady) return;
    window.__caarHeaderReady = true;

    /* ── Grab every element we need ── */
    var searchBtn     = document.getElementById('searchBtn');
    var searchBar     = document.getElementById('searchBar');
    var searchClose   = document.getElementById('searchCloseHdr');
    var searchInput   = document.getElementById('searchInput');

    var langDropdown  = document.getElementById('langDropdown');
    var langToggle    = document.getElementById('langToggleBtn');
    var langMenu      = document.getElementById('langDropdownMenu');
    var currentLang   = document.getElementById('currentLang');

    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
    var mobileNav     = document.getElementById('mobileNav');
    var mobileOverlay = document.getElementById('mobileNavOverlay');
    var mobileClose   = document.getElementById('mobileNavClose');
    var header        = document.getElementById('caar-header');

    /* ── Log which elements are missing (debug only) ── */
    var required = {
      searchBtn:searchBtn, searchBar:searchBar,
      langToggle:langToggle, langMenu:langMenu,
      mobileMenuBtn:mobileMenuBtn, mobileNav:mobileNav
    };
    Object.keys(required).forEach(function(k) {
      if (!required[k]) console.warn('[CAAR] initHeader: #' + k + ' not found');
    });

    /* ────────────────────────────────────────────────────
       SEARCH
    ──────────────────────────────────────────────────── */
    function openSearch() {
      if (!searchBar) return;
      searchBar.classList.add('open');
      if (searchInput) setTimeout(function () { searchInput.focus(); }, 60);
    }

    function closeSearch() {
      if (!searchBar) return;
      searchBar.classList.remove('open');
      if (searchInput) searchInput.value = '';
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        searchBar && searchBar.classList.contains('open') ? closeSearch() : openSearch();
      });
    }
    if (searchClose) {
      searchClose.addEventListener('click', closeSearch);
    }

    /* ────────────────────────────────────────────────────
       LANGUAGE DROPDOWN
       Toggle .show on #langDropdownMenu
       Toggle .lang-open on #langDropdown (for CSS arrow rotate)
    ──────────────────────────────────────────────────── */
    function openLang() {
      if (!langMenu) return;
      langMenu.classList.add('show');
      if (langDropdown) langDropdown.classList.add('lang-open');
      if (langToggle)   langToggle.setAttribute('aria-expanded', 'true');
    }

    function closeLang() {
      if (!langMenu) return;
      langMenu.classList.remove('show');
      if (langDropdown) langDropdown.classList.remove('lang-open');
      if (langToggle)   langToggle.setAttribute('aria-expanded', 'false');
    }

    if (langToggle) {
      langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        langMenu && langMenu.classList.contains('show') ? closeLang() : openLang();
      });
    }

    if (langMenu) {
      langMenu.querySelectorAll('[data-lang]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentLang) currentLang.textContent = this.getAttribute('data-lang');
          closeLang();
        });
      });
    }

    /* ────────────────────────────────────────────────────
       MOBILE NAV DRAWER
       Toggle .open on #mobileNav and #mobileNavOverlay
    ──────────────────────────────────────────────────── */
    function openMobile() {
      if (mobileNav)     mobileNav.classList.add('open');
      if (mobileOverlay) mobileOverlay.classList.add('open');
      if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMobile() {
      if (mobileNav)     mobileNav.classList.remove('open');
      if (mobileOverlay) mobileOverlay.classList.remove('open');
      if (mobileMenuBtn) mobileMenuBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobile);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobile);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);

    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMobile);
      });
    }

    /* ────────────────────────────────────────────────────
       ESCAPE KEY — close everything
    ──────────────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeSearch();
      closeLang();
      closeMobile();
    });

    /* ────────────────────────────────────────────────────
       CLICK OUTSIDE — close search & lang
    ──────────────────────────────────────────────────── */
    document.addEventListener('click', function (e) {
      /* close search when clicking outside the header */
      if (searchBar && searchBar.classList.contains('open')) {
        if (header && !header.contains(e.target)) closeSearch();
      }
      /* close lang when clicking outside the dropdown */
      if (langDropdown && !langDropdown.contains(e.target)) closeLang();
    });

    /* ────────────────────────────────────────────────────
       DESKTOP DROPDOWN — touch support
    ──────────────────────────────────────────────────── */
    if (header) {
      header.querySelectorAll('.dropdown').forEach(function (dd) {
        dd.addEventListener('touchstart', function (e) {
          var already = dd.classList.contains('touch-open');
          header.querySelectorAll('.dropdown.touch-open').forEach(function (x) {
            if (x !== dd) x.classList.remove('touch-open');
          });
          if (!already) {
            e.preventDefault();
            dd.classList.add('touch-open');
          } else {
            dd.classList.remove('touch-open');
          }
        }, { passive: false });
      });

      document.addEventListener('touchstart', function (e) {
        if (!e.target.closest('.dropdown')) {
          header.querySelectorAll('.dropdown.touch-open').forEach(function (dd) {
            dd.classList.remove('touch-open');
          });
        }
      }, { passive: true });
    }

    /* ────────────────────────────────────────────────────
       ACTIVE NAV STATE
    ──────────────────────────────────────────────────── */
    setActiveNav();

  } /* end initHeader() */

  /* ──────────────────────────────────────────────────────────
     LOAD HEADER
  ────────────────────────────────────────────────────────── */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');

    if (!placeholder) {
      /* Hardcoded header — skip fetch, just mark active nav */
      if (!window.__caarHeaderReady) {
        window.__caarHeaderReady = true;
        setActiveNav();
      }
      return;
    }

    fetch(resolveHeaderURL())
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        placeholder.innerHTML = html;   /* 1. HTML in DOM */
        initHeader();                   /* 2. Wire listeners */
      })
      .catch(function (err) {
        console.warn('[CAAR] Header load failed:', err.message);
        if (!window.__caarHeaderReady) {
          window.__caarHeaderReady = true;
          setActiveNav();
        }
      });
  }

  /* ──────────────────────────────────────────────────────────
     BOOT
  ────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }

}());