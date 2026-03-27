/* ============================================================
   CAAR — main.js  (v6 — Robust Header Injection)

   KEY FIXES vs v5:
   ─────────────────────────────────────────────────────────
   ▸ initHeader() is called INSIDE the fetch().then() callback,
     AFTER innerHTML is set — guarantees DOM elements exist
   ▸ All querySelector calls are scoped to the injected <header>
     element, not document — prevents stale-reference bugs
   ▸ One-time guard (data-header-init) prevents duplicate
     listener attachment if script somehow runs twice
   ▸ Fetch path is resolved relative to main.js location via
     import.meta is not available in classic scripts, so we
     derive the base URL from the <script> src attribute
   ▸ CSS class toggles documented at bottom of file
   ▸ Pages must NOT wire their own search/lang/mobile listeners

   CSS CLASSES TOGGLED BY THIS FILE:
     .search-bar.open          — shows the search overlay bar
     .lang-dropdown.lang-open  — shows language menu
     .mobile-nav.open          — slides in the mobile drawer
     .mobile-nav-overlay.open  — dims the background
     .dropdown.touch-open      — opens nav dropdowns on touch
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     HELPERS
  ────────────────────────────────────────────────────────── */

  /** Resolve the URL of components/header.html relative to
   *  wherever main.js lives, so it works from any sub-page. */
  function getHeaderURL() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var src = scripts[i].getAttribute('src');
      if (src && src.indexOf('main.js') !== -1) {
        // src is e.g. "js/main.js" or "../js/main.js"
        // Strip the filename and go up one directory (out of js/)
        var base = src.replace(/js\/main\.js.*$/, '');
        return base + 'components/header.html';
      }
    }
    // Fallback — same origin, try to derive from pathname
    var path = window.location.pathname; // e.g. /frontend/contact.html
    var dir  = path.substring(0, path.lastIndexOf('/') + 1);
    return dir + 'components/header.html';
  }

  /* ──────────────────────────────────────────────────────────
     1. DETERMINE ACTIVE PAGE
  ────────────────────────────────────────────────────────── */
  function getActivePage() {
    var file = window.location.pathname.split('/').pop().replace('.html', '') || 'index';
    var map = {
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
    return map[file] || '';
  }

  /* ──────────────────────────────────────────────────────────
     2. MARK ACTIVE NAV LINK (scoped to a root element)
  ────────────────────────────────────────────────────────── */
  function setActiveNav(root) {
    var activePage = getActivePage();
    if (!activePage) return;
    root = root || document;
    root.querySelectorAll('.nav-link[data-page]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-page') === activePage);
    });
    root.querySelectorAll('.mobile-nav a[data-page]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-page') === activePage);
    });
  }

  /* ──────────────────────────────────────────────────────────
     3. WIRE ALL HEADER INTERACTIONS
        Called ONLY after header HTML exists in the DOM.
        All queries are scoped to `header` element.
  ────────────────────────────────────────────────────────── */
  function initHeader(header) {
    // Guard: prevent double-init
    if (header.dataset.headerInit === '1') return;
    header.dataset.headerInit = '1';

    /* ── 3a. Search bar ────────────────────────────────── */
    var searchBtn   = header.querySelector('#searchBtn');
    var searchBar   = header.querySelector('#searchBar');
    var searchClose = header.querySelector('#searchCloseHdr');
    var searchInput = header.querySelector('#searchInput');

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
    // Close search when clicking outside the header
    document.addEventListener('click', function (e) {
      if (!searchBar || !searchBar.classList.contains('open')) return;
      if (!header.contains(e.target)) closeSearch();
    });

    /* ── 3b. Language dropdown ─────────────────────────── */
    var langDropdown = header.querySelector('.lang-dropdown');
    var langToggle   = langDropdown ? langDropdown.querySelector('.lang-toggle-btn') : null;
    var langMenu     = langDropdown ? langDropdown.querySelector('.lang-menu')       : null;
    var currentLang  = header.querySelector('#currentLang');

    function closeLang() {
      if (langDropdown) langDropdown.classList.remove('lang-open');
    }

    if (langToggle && langDropdown) {
      langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        langDropdown.classList.toggle('lang-open');
      });

      if (langMenu) {
        langMenu.querySelectorAll('[data-lang]').forEach(function (link) {
          link.addEventListener('click', function (e) {
            e.preventDefault();
            if (currentLang) currentLang.textContent = this.getAttribute('data-lang');
            closeLang();
          });
        });
      }

      document.addEventListener('click', function (e) {
        if (langDropdown && !langDropdown.contains(e.target)) closeLang();
      });
    }

    /* ── 3c. Mobile nav drawer ─────────────────────────── */
    var mobileMenuBtn = header.querySelector('#mobileMenuBtn');
    // Drawer and overlay live outside the <header> in the injected HTML
    var mobileNav     = document.getElementById('mobileNav');
    var mobileOverlay = document.getElementById('mobileNavOverlay');
    var mobileClose   = document.getElementById('mobileNavClose');

    function openMobileMenu() {
      if (mobileNav)     mobileNav.classList.add('open');
      if (mobileOverlay) mobileOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeMobileMenu() {
      if (mobileNav)     mobileNav.classList.remove('open');
      if (mobileOverlay) mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    /* ── 3d. Escape key ────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeSearch();
      closeLang();
      closeMobileMenu();
    });

    /* ── 3e. Desktop nav dropdowns — touch support ─────── */
    header.querySelectorAll('.dropdown').forEach(function (dropdown) {
      dropdown.addEventListener('touchstart', function (e) {
        var isOpen = dropdown.classList.contains('touch-open');
        header.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
          if (d !== dropdown) d.classList.remove('touch-open');
        });
        if (!isOpen) {
          e.preventDefault();
          dropdown.classList.add('touch-open');
        } else {
          dropdown.classList.remove('touch-open');
        }
      }, { passive: false });
    });

    document.addEventListener('touchstart', function (e) {
      if (!e.target.closest('.dropdown')) {
        header.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
          d.classList.remove('touch-open');
        });
      }
    }, { passive: true });

    // Set active nav state
    setActiveNav(header);
  }

  /* ──────────────────────────────────────────────────────────
     4. LOAD HEADER
  ────────────────────────────────────────────────────────── */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');

    // No placeholder → page has a hardcoded header; just set active nav
    if (!placeholder) {
      setActiveNav(document);
      return;
    }

    var url = getHeaderURL();

    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('Header fetch ' + res.status + ' for ' + url);
        return res.text();
      })
      .then(function (html) {
        // 1. Inject HTML
        placeholder.innerHTML = html;

        // 2. The <header> element is now in the DOM — wire everything
        var header = placeholder.querySelector('header');
        if (header) {
          initHeader(header);
        } else {
          // header.html root might be the header itself
          initHeader(placeholder);
          setActiveNav(placeholder);
        }
      })
      .catch(function (err) {
        console.warn('[CAAR] Header load failed:', err.message);
        // Still mark active nav on whatever is in the DOM
        setActiveNav(document);
      });
  }

  /* ──────────────────────────────────────────────────────────
     5. BOOT
  ────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }

})();

/* ============================================================
   CSS CLASSES MANAGED BY THIS FILE — reference for designers
   ─────────────────────────────────────────────────────────
   .search-bar.open         → search input bar slides down
   .lang-dropdown.lang-open → language menu appears
   .mobile-nav.open         → drawer slides in from right
   .mobile-nav-overlay.open → semi-transparent dark backdrop
   .dropdown.touch-open     → desktop nav submenu on touch
   header[data-header-init] → set to "1" after init; prevents
                               duplicate listener attachment
   ============================================================ */