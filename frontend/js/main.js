/* ============================================================
   CAAR — main.js  (v5 — Fixed & Unified)

   WHAT CHANGED from v4:
   ─────────────────────
   ▸ Lang dropdown now uses CSS class toggle (.open) instead of
     inline style — eliminates conflict with :hover CSS rule
   ▸ Nav dropdowns: added .touch-open support via JS (CSS rule
     must mirror .dropdown:hover .dropdown-menu)
   ▸ All header interactions unified here — pages must NOT
     duplicate searchBtn / lang / mobile-menu listeners inline
   ▸ Added null-guard on every getElementById call
   ▸ Escape key closes search, mobile-nav, lang dropdown

   RULE: Every page must have exactly ONE of:
     A) <div id="site-header"></div>  ← injected by this file
     B) A hardcoded <header> block    ← LEGACY; migrate to A

   If a page uses (A) it must NOT have:
     • inline scripts touching searchBtn/mobileMenuBtn/langMenu
     • a hardcoded mobile-nav drawer at the bottom
     • a toggleMobileMenu() global function
   ============================================================ */

(function () {
  'use strict';

  /* ──────────────────────────────────────────────────────────
     1. DETERMINE ACTIVE PAGE
  ────────────────────────────────────────────────────────── */
  function getActivePage() {
    var path = window.location.pathname;
    var file = path.split('/').pop().replace('.html', '') || 'index';

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
     2. SET ACTIVE NAV LINK
  ────────────────────────────────────────────────────────── */
  function setActiveNav() {
    var activePage = getActivePage();
    if (!activePage) return;

    document.querySelectorAll('.nav-link[data-page]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-page') === activePage);
    });
    document.querySelectorAll('.mobile-nav a[data-page]').forEach(function (link) {
      link.classList.toggle('active', link.getAttribute('data-page') === activePage);
    });
  }

  /* ──────────────────────────────────────────────────────────
     3. WIRE ALL HEADER INTERACTIONS
  ────────────────────────────────────────────────────────── */
  function initHeaderFunctions() {

    /* ── 3a. Search bar ─────────────────────────────────── */
    var searchBtn   = document.getElementById('searchBtn');
    var searchBar   = document.getElementById('searchBar');
    var searchClose = document.getElementById('searchCloseHdr');
    var searchInput = document.getElementById('searchInput');

    if (searchBtn && searchBar) {
      searchBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        var opening = !searchBar.classList.contains('open');
        searchBar.classList.toggle('open', opening);
        if (opening && searchInput) {
          setTimeout(function () { searchInput.focus(); }, 60);
        }
      });
    }

    if (searchClose && searchBar) {
      searchClose.addEventListener('click', function () {
        searchBar.classList.remove('open');
        if (searchInput) searchInput.value = '';
      });
    }

    /* Close search when clicking outside header */
    document.addEventListener('click', function (e) {
      if (!searchBar) return;
      if (!searchBar.classList.contains('open')) return;
      var header = document.querySelector('.header');
      if (header && !header.contains(e.target)) {
        searchBar.classList.remove('open');
      }
    });

    /* ── 3b. Language dropdown — CLASS-BASED (no inline style) ── */
    var langDropdown = document.querySelector('.lang-dropdown');
    var langToggle   = langDropdown ? langDropdown.querySelector('.lang-toggle-btn') : null;
    var langMenu     = langDropdown ? langDropdown.querySelector('.lang-menu')       : null;
    var currentLang  = document.getElementById('currentLang');

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
            langDropdown.classList.remove('lang-open');
          });
        });
      }

      document.addEventListener('click', function (e) {
        if (langDropdown && !langDropdown.contains(e.target)) {
          langDropdown.classList.remove('lang-open');
        }
      });
    }

    /* ── 3c. Mobile nav drawer ──────────────────────────── */
    var mobileMenuBtn = document.getElementById('mobileMenuBtn');
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

    /* Close drawer when any link inside is tapped */
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    /* ── 3d. Escape key ─────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (searchBar && searchBar.classList.contains('open')) {
        searchBar.classList.remove('open');
        if (searchInput) searchInput.value = '';
      }
      if (mobileNav && mobileNav.classList.contains('open')) {
        closeMobileMenu();
      }
      if (langDropdown) {
        langDropdown.classList.remove('lang-open');
      }
    });

    /* ── 3e. Desktop nav dropdowns — touch support ──────── */
    document.querySelectorAll('.dropdown').forEach(function (dropdown) {
      dropdown.addEventListener('touchstart', function (e) {
        var isOpen = dropdown.classList.contains('touch-open');
        /* Close all other open dropdowns */
        document.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
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
        document.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
          d.classList.remove('touch-open');
        });
      }
    }, { passive: true });
  }

  /* ──────────────────────────────────────────────────────────
     4. LOAD HEADER
  ────────────────────────────────────────────────────────── */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');
    if (!placeholder) {
      /*
       * Page has a hardcoded <header> — still set active nav
       * (search/lang/mobile wired by page's own inline script)
       */
      setActiveNav();
      return;
    }

    fetch('components/header.html')
      .then(function (res) {
        if (!res.ok) throw new Error('Header fetch failed: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        placeholder.innerHTML = html;
        initHeaderFunctions();
        setActiveNav();
      })
      .catch(function (err) {
        console.warn('[CAAR] Could not load header component:', err.message);
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