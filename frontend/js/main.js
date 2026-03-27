/* ============================================================
   CAAR — main.js  (Refactored v2)
   Single source of truth for ALL header behaviour:
     • Dynamic header injection
     • Active nav-link highlighting
     • Search bar toggle
     • Language switcher
     • Mobile nav drawer (open / close / overlay / Escape key)

   Pages MUST NOT duplicate any of these listeners.
   Page-specific scripts (maps, forms, etc.) are unaffected.
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

        /* Safety: if a page somehow still has a duplicate element
           outside the placeholder, remove it so our IDs are unique. */
        var managed = [
          'searchBar', 'searchCloseHdr', 'currentLang',
          'mobileMenuBtn', 'mobileNav', 'mobileNavOverlay', 'mobileNavClose'
        ];
        managed.forEach(function (id) {
          deduplicateById(id, placeholder);
        });

        initHeader();
        setActiveNav();
      })
      .catch(function (err) {
        console.warn('[CAAR] Could not load header:', err);
      });
  }

  /* Keep only the copy that lives inside `placeholder`. */
  function deduplicateById(id, placeholder) {
    var all = document.querySelectorAll('#' + id);
    if (all.length <= 1) return;
    all.forEach(function (el) {
      if (!placeholder.contains(el) && el.parentNode) {
        el.parentNode.removeChild(el);
      }
    });
  }

  /* ----------------------------------------------------------
     3. SET ACTIVE NAV LINK
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
     4. WIRE ALL HEADER INTERACTIONS
        Called once after header HTML is injected into the DOM.
  ---------------------------------------------------------- */
  function initHeader() {

    /* ── 4a. Search bar ── */
    var searchBtn   = document.getElementById('searchBtn');
    var searchBar   = document.getElementById('searchBar');
    var searchClose = document.getElementById('searchCloseHdr');

    if (searchBtn && searchBar) {
      searchBtn.addEventListener('click', function () {
        var isOpen = searchBar.classList.toggle('open');
        if (isOpen) {
          var inp = searchBar.querySelector('input');
          if (inp) inp.focus();
        }
      });
    }

    if (searchClose && searchBar) {
      searchClose.addEventListener('click', function () {
        searchBar.classList.remove('open');
      });
    }

    /* ── 4b. Language switcher ── */
    document.querySelectorAll('[data-lang]').forEach(function (link) {
      link.addEventListener('click', function (e) {
        e.preventDefault();
        var langEl = document.getElementById('currentLang');
        if (langEl) langEl.textContent = this.getAttribute('data-lang');
      });
    });

    /* ── 4c. Mobile nav drawer ── */
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
    if (mobileClose)   mobileClose.addEventListener('click',   closeMobileMenu);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobileMenu);

    /* Close drawer when any nav link inside it is tapped */
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
      });
    }

    /* ── 4d. Escape key — closes search bar OR mobile drawer ── */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (searchBar && searchBar.classList.contains('open')) {
        searchBar.classList.remove('open');
      }
      if (mobileNav && mobileNav.classList.contains('open')) {
        closeMobileMenu();
      }
    });
  }

  /* ----------------------------------------------------------
     5. BOOT
  ---------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    loadHeader();
    /* Footer is hardcoded per page — no dynamic load needed. */
  });

})();