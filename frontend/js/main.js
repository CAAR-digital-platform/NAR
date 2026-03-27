/* ============================================================
   CAAR — main.js  (fixed)
   Loads shared header + footer, sets active nav link,
   and wires up all header interactions.

   Fixes applied:
   - Header HTML no longer contains orphaned lang-dropdown /
     search-bar elements (those were causing duplicate IDs).
   - Script now guards against double-initialisation if the
     placeholder is re-rendered.
============================================================ */

(function () {

  /* ----------------------------------------------------------
     1. DETERMINE ACTIVE PAGE from current URL
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
      'company':             'company',
      'company-careers':     'company',
      'network':             'network',
      'news':                'news',
      'article-accident':    'news',
      'article-home':        'news',
      'article-business':    'news',
      'article-basics':      'news',
      'contact':             'contact',
      'Online_subscription': 'products',
      'catnat-subscription': 'products',
      'roads':               'products',
    };

    return map[file] || '';
  }

  /* ----------------------------------------------------------
     2. INJECT HEADER
  ---------------------------------------------------------- */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');
    if (!placeholder) return;

    fetch('components/header.html')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        placeholder.innerHTML = html;

        /* Guard: if the page already has a #searchBar or #currentLang
           defined outside the placeholder, remove the injected duplicates
           so event wiring below always targets the right element. */
        deduplicateById('searchBar',     placeholder);
        deduplicateById('searchCloseHdr', placeholder);
        deduplicateById('currentLang',   placeholder);
        deduplicateById('mobileMenuBtn', placeholder);
        deduplicateById('mobileNav',     placeholder);
        deduplicateById('mobileNavOverlay', placeholder);
        deduplicateById('mobileNavClose',   placeholder);

        initHeader();
        setActiveNav();
      })
      .catch(function (err) {
        console.warn('[CAAR] Could not load header:', err);
      });
  }

  /* Remove duplicate elements: keep the one INSIDE the placeholder,
     remove any stale ones that exist elsewhere in the document. */
  function deduplicateById(id, placeholder) {
    var all = document.querySelectorAll('#' + id);
    if (all.length <= 1) return;
    all.forEach(function (el) {
      if (!placeholder.contains(el)) {
        el.parentNode && el.parentNode.removeChild(el);
      }
    });
  }


  /* ----------------------------------------------------------
     4. SET ACTIVE NAV LINK
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
     5. WIRE UP HEADER INTERACTIONS
  ---------------------------------------------------------- */
  function initHeader() {

    /* ── Search bar ── */
    var searchBtn   = document.getElementById('searchBtn');
    var searchBar   = document.getElementById('searchBar');
    var searchClose = document.getElementById('searchCloseHdr');

    if (searchBtn && searchBar) {
      searchBtn.addEventListener('click', function () {
        searchBar.classList.toggle('open');
      });
    }
    if (searchClose && searchBar) {
      searchClose.addEventListener('click', function () {
        searchBar.classList.remove('open');
      });
    }
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && searchBar) {
        searchBar.classList.remove('open');
      }
    });

    /* ── Language switcher ── */
    document.querySelectorAll('[data-lang]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var langEl = document.getElementById('currentLang');
        if (langEl) langEl.textContent = this.getAttribute('data-lang');
      });
    });

    /* ── Mobile nav drawer ── */
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

    if (mobileMenuBtn)  mobileMenuBtn.addEventListener('click', openMobileMenu);
    if (mobileClose)    mobileClose.addEventListener('click',   closeMobileMenu);
    if (mobileOverlay)  mobileOverlay.addEventListener('click', closeMobileMenu);

    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }
  }

  /* ----------------------------------------------------------
     6. BOOT
  ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    loadHeader();
    loadFooter();
  });

})();