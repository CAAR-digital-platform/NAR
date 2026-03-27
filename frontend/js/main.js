/* ============================================================
   CAAR — main.js  (v3 — Fixed Dynamic Header)
   
   Architecture:
     1. loadHeader()          — fetch + inject header.html into #site-header
     2. initHeaderFunctions() — wire ALL header interactions (called after injection)
     3. setActiveNav()        — highlight the current page nav link
   
   Pages using #site-header: all header behaviour is managed here.
   Pages with hardcoded headers: their inline scripts handle their own events
     (main.js detects no #site-header and skips injection gracefully).
   
   IMPORTANT: Pages that used to have inline header JS (catnat-subscription.html,
   roads.html) should have those duplicate listeners removed — main.js handles them.
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     1. DETERMINE ACTIVE PAGE from the current URL
  ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     2. SET ACTIVE NAV LINK
     Called after header injection so elements exist in DOM.
  ---------------------------------------------------------- */
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

  /* ----------------------------------------------------------
     3. INIT ALL HEADER FUNCTIONS
     This is the single source of truth for every interactive
     header element. Called once after the header HTML is in DOM.
  ---------------------------------------------------------- */
  function initHeaderFunctions() {

    /* ── 3a. Search bar ── */
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

    /* Close search bar when clicking anywhere outside it */
    document.addEventListener('click', function (e) {
      if (!searchBar) return;
      if (searchBar.classList.contains('open')) {
        var header = document.querySelector('.header');
        if (header && !header.contains(e.target)) {
          searchBar.classList.remove('open');
        }
      }
    });

    /* ── 3b. Language dropdown (JS-driven for reliability) ── */
    var langDropdown = document.querySelector('.lang-dropdown');
    var langMenu     = langDropdown ? langDropdown.querySelector('.lang-menu') : null;
    var langToggle   = langDropdown ? langDropdown.querySelector('.lang-toggle-btn') : null;
    var currentLang  = document.getElementById('currentLang');

    if (langToggle && langMenu) {
      /* Toggle on button click */
      langToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        var isOpen = langMenu.style.display === 'block';
        langMenu.style.display = isOpen ? '' : 'block';
      });

      /* Select language */
      langMenu.querySelectorAll('[data-lang]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentLang) {
            currentLang.textContent = this.getAttribute('data-lang');
          }
          langMenu.style.display = '';
        });
      });

      /* Close when clicking outside */
      document.addEventListener('click', function (e) {
        if (langDropdown && !langDropdown.contains(e.target)) {
          langMenu.style.display = '';
        }
      });
    }

    /* ── 3c. Mobile nav drawer ── */
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

    /* Close drawer when any link inside it is tapped */
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    /* ── 3d. Escape key — closes search bar AND mobile drawer ── */
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

    /* ── 3e. Desktop dropdown menus (Products, Company) ── */
    /* CSS :hover handles the visual toggle; JS adds keyboard/touch support */
    document.querySelectorAll('.dropdown').forEach(function (dropdown) {
      var menu = dropdown.querySelector('.dropdown-menu');
      if (!menu) return;

      /* Touch devices: first tap opens, second navigates */
      dropdown.addEventListener('touchstart', function (e) {
        var isOpen = dropdown.classList.contains('touch-open');
        /* Close all other dropdowns */
        document.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
          d.classList.remove('touch-open');
        });
        if (!isOpen) {
          e.preventDefault();
          dropdown.classList.add('touch-open');
        }
      }, { passive: false });
    });

    /* Close touch dropdowns when tapping outside */
    document.addEventListener('touchstart', function (e) {
      if (!e.target.closest('.dropdown')) {
        document.querySelectorAll('.dropdown.touch-open').forEach(function (d) {
          d.classList.remove('touch-open');
        });
      }
    });
  }

  /* ----------------------------------------------------------
     4. LOAD HEADER
     Fetches components/header.html, injects it, then calls
     initHeaderFunctions() and setActiveNav().
  ---------------------------------------------------------- */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');
    if (!placeholder) return; /* page uses hardcoded header — nothing to do */

    fetch('components/header.html')
      .then(function (res) {
        if (!res.ok) throw new Error('Header fetch failed: ' + res.status);
        return res.text();
      })
      .then(function (html) {
        placeholder.innerHTML = html;

        /* Run initialisation now that elements are in the DOM */
        initHeaderFunctions();
        setActiveNav();
      })
      .catch(function (err) {
        console.warn('[CAAR] Could not load header component:', err.message);
        /* Degrade gracefully — page still usable without dynamic header */
      });
  }

  /* ----------------------------------------------------------
     5. BOOT — wait for DOM, then load the header
  ---------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    /* DOMContentLoaded already fired (e.g. script at bottom of body) */
    loadHeader();
  }

})();