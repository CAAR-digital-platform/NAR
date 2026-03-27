/* ============================================================
   CAAR — main.js  (v4 — Unified Dynamic Header)

   HOW IT WORKS
   ────────────
   1. loadHeader()          — fetch components/header.html → inject into #site-header
   2. initHeaderFunctions() — wire ALL header interactions (called AFTER injection)
   3. setActiveNav()        — highlight the current page nav link

   RULE: Every page must have exactly ONE of:
     A) <div id="site-header"></div>   ← header is injected here by this file
     B) A hardcoded <header> block     ← page manages its own header events inline
                                          (legacy; migrate to A over time)

   If a page uses (A), it must NOT have any inline scripts that touch
   searchBtn / searchCloseHdr / mobileMenuBtn / toggleMobileMenu / langMenu,
   and it must NOT have a hardcoded mobile-nav drawer at the bottom —
   those are already included inside components/header.html.
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
     2. SET ACTIVE NAV LINK (called after header is in DOM)
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
        Called once, immediately after header HTML is in the DOM.
        Pages must not duplicate any of this logic inline.
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
          setTimeout(function () { searchInput.focus(); }, 50);
        }
      });
    }

    if (searchClose && searchBar) {
      searchClose.addEventListener('click', function () {
        searchBar.classList.remove('open');
      });
    }

    // Close search bar when clicking outside the header
    document.addEventListener('click', function (e) {
      if (!searchBar) return;
      if (searchBar.classList.contains('open')) {
        var header = document.querySelector('.header');
        if (header && !header.contains(e.target)) {
          searchBar.classList.remove('open');
        }
      }
    });

    /* ── 3b. Language dropdown ──────────────────────────── */
    var langDropdown = document.querySelector('.lang-dropdown');
    var langMenu     = langDropdown ? langDropdown.querySelector('.lang-menu') : null;
    var langToggle   = langDropdown ? langDropdown.querySelector('.lang-toggle-btn') : null;
    var currentLang  = document.getElementById('currentLang');

    if (langToggle && langMenu) {
      langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = langMenu.style.display === 'block';
        langMenu.style.display = isOpen ? '' : 'block';
      });

      langMenu.querySelectorAll('[data-lang]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentLang) currentLang.textContent = this.getAttribute('data-lang');
          langMenu.style.display = '';
        });
      });

      document.addEventListener('click', function (e) {
        if (langDropdown && !langDropdown.contains(e.target)) {
          langMenu.style.display = '';
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

    // Close drawer when any link inside it is tapped
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
      }
      if (mobileNav && mobileNav.classList.contains('open')) {
        closeMobileMenu();
      }
      if (langMenu) {
        langMenu.style.display = '';
      }
    });

    /* ── 3e. Desktop dropdowns (touch support) ──────────── */
    document.querySelectorAll('.dropdown').forEach(function (dropdown) {
      dropdown.addEventListener('touchstart', function (e) {
        var isOpen = dropdown.classList.contains('touch-open');
        document.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
          d.classList.remove('touch-open');
        });
        if (!isOpen) {
          e.preventDefault();
          dropdown.classList.add('touch-open');
        }
      }, { passive: false });
    });

    document.addEventListener('touchstart', function (e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
          d.classList.remove('touch-open');
        });
      }
    });
  }

  /* ──────────────────────────────────────────────────────────
     4. LOAD HEADER
        Fetches components/header.html, injects it into
        #site-header, then wires all interactions.
        If no #site-header exists the page has a hardcoded
        header — skip silently.
  ────────────────────────────────────────────────────────── */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');
    if (!placeholder) {
      /*
       * Page uses a hardcoded <header> block.
       * main.js is still loaded for setActiveNav on those pages
       * that call it manually, but we don't touch the DOM here.
       */
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