/* ============================================================
   CAAR — main.js  (v8 — Bug-fixed)

   FIXES IN THIS VERSION
   ─────────────────────
   1. Lang dropdown: now calls openLang/closeLang via button click.
      The CSS (header.css) uses visibility/opacity not display:none,
      so transitions work correctly.

   2. Mobile nav lag: JS now only toggles classes. CSS uses
      transform:translateX instead of right (composited, no layout).

   3. Search not opening: removed the inline-script workaround that
      was in catnat-subscription.html which bound to #searchBtn
      BEFORE the async fetch completed, throwing a TypeError.
      initHeader() is now the ONLY place these listeners live.

   ARCHITECTURE
   ─────────────
   • Fetches components/header.html into #site-header
   • Calls initHeader() ONCE after HTML is in DOM
   • window.__caarHeaderReady guards against double-run
   • All header interaction lives here — no page should re-bind
     header elements in its own <script> block

   CSS CLASSES MANAGED
   ────────────────────
   .search-bar.open              → search input visible
   .lang-dropdown-menu.show      → language menu visible
   .mobile-nav.open              → drawer slides in
   .mobile-nav-overlay.open      → dark backdrop visible
   .lang-dropdown.lang-open      → chevron rotates (CSS-only)
   .dropdown.touch-open          → desktop submenu on touch
   ============================================================ */

(function () {
  'use strict';

  /* ── Guard: already initialised? Exit. ── */
  if (window.__caarHeaderReady) return;

  /* ──────────────────────────────────────────────────────────
     UTIL: resolve components/header.html URL from script src
     so it works from any sub-directory.
  ────────────────────────────────────────────────────────── */
  function resolveHeaderURL() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src');
      if (s && s.indexOf('main.js') !== -1) {
        /* e.g. "js/main.js" → base = "" → "components/header.html" */
        var base = s.replace(/js\/main\.js.*$/, '');
        return base + 'components/header.html';
      }
    }
    /* Fallback: derive from current URL */
    var dir = window.location.pathname.slice(
      0, window.location.pathname.lastIndexOf('/') + 1
    );
    return dir + 'components/header.html';
  }

  /* ──────────────────────────────────────────────────────────
     ACTIVE PAGE DETECTION
     Maps filenames → nav data-page values so the correct
     link gets .active without hardcoding it in every HTML file.
  ────────────────────────────────────────────────────────── */
  var PAGE_MAP = {
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

  function setActiveNav() {
    var file = window.location.pathname
      .split('/')
      .pop()
      .replace('.html', '') || '';

    var page = PAGE_MAP[file] || '';
    if (!page) return;

    document.querySelectorAll('[data-page]').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-page') === page);
    });
  }

  /* ══════════════════════════════════════════════════════════
     initHeader()
     ─────────────
     Called ONCE after header HTML has been injected into #site-header.
     Binds ALL header interactions here — no page should re-bind
     #searchBtn / #langToggleBtn / #mobileMenuBtn in its own script.

     NULL CHECKS on every element: the function degrades gracefully
     if the header fails to load for any reason.
  ══════════════════════════════════════════════════════════ */
  function initHeader() {
    /* Hard stop — prevents double-bind if script is somehow loaded twice */
    if (window.__caarHeaderReady) return;
    window.__caarHeaderReady = true;

    /* ── Grab elements ── */
    var header       = document.getElementById('caar-header');
    var searchBtn    = document.getElementById('searchBtn');
    var searchBar    = document.getElementById('searchBar');
    var searchClose  = document.getElementById('searchCloseHdr');   /* NOTE: "Hdr" suffix */
    var searchInput  = document.getElementById('searchInput');
    var langDropdown = document.getElementById('langDropdown');
    var langToggle   = document.getElementById('langToggleBtn');
    var langMenu     = document.getElementById('langDropdownMenu');  /* the <ul> */
    var currentLang  = document.getElementById('currentLang');
    var mobileBtn    = document.getElementById('mobileMenuBtn');
    var mobileNav    = document.getElementById('mobileNav');
    var mobileOverlay= document.getElementById('mobileNavOverlay');
    var mobileClose  = document.getElementById('mobileNavClose');

    /* Dev-mode warning for missing elements */
    if (process && process.env && process.env.NODE_ENV === 'development') {
      [
        ['searchBtn',       searchBtn],
        ['searchBar',       searchBar],
        ['searchCloseHdr',  searchClose],
        ['langToggleBtn',   langToggle],
        ['langDropdownMenu',langMenu],
        ['mobileMenuBtn',   mobileBtn],
        ['mobileNav',       mobileNav],
      ].forEach(function (pair) {
        if (!pair[1]) console.warn('[CAAR header] #' + pair[0] + ' not found after load.');
      });
    }

    /* ────────────────────────────────────────────────────────
       SEARCH
       ──────
       BUG FIX: previously catnat-subscription.html had an inline
       <script> that called document.getElementById('searchBtn')
       BEFORE the async fetch completed → TypeError → rest of page
       JS silently stopped. Solution: never bind header elements in
       page-level scripts. This is the one place.
    ──────────────────────────────────────────────────────── */
    function openSearch() {
      if (!searchBar) return;
      searchBar.classList.add('open');
      searchBar.setAttribute('aria-hidden', 'false');
      if (searchInput) {
        /* Defer focus so display:flex has time to paint */
        setTimeout(function () { searchInput.focus(); }, 60);
      }
    }

    function closeSearch() {
      if (!searchBar) return;
      searchBar.classList.remove('open');
      searchBar.setAttribute('aria-hidden', 'true');
      if (searchInput) searchInput.value = '';
    }

    if (searchBtn) {
      searchBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        /* Toggle: if already open, close; otherwise open */
        if (searchBar && searchBar.classList.contains('open')) {
          closeSearch();
        } else {
          openSearch();
        }
      });
    }

    if (searchClose) {
      searchClose.addEventListener('click', function () {
        closeSearch();
      });
    }

    /* ────────────────────────────────────────────────────────
       LANGUAGE DROPDOWN
       ──────────────────
       BUG FIX: the old CSS used display:none + opacity:0 as the
       hidden state. When .show was added (display:block + opacity:1),
       browsers had no painted "from" state so the opacity transition
       never ran — on some browsers the menu appeared at opacity:0
       (invisible). The new header.css uses visibility+opacity instead,
       which DOES transition correctly because the element stays in
       the render tree.

       JS here only toggles .show and the aria attributes.
       CSS in header.css does all the visual work.
    ──────────────────────────────────────────────────────── */
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
        if (langMenu && langMenu.classList.contains('show')) {
          closeLang();
        } else {
          openLang();
        }
      });
    }

    /* Update the label text when a language is chosen */
    if (langMenu) {
      langMenu.querySelectorAll('[data-lang]').forEach(function (link) {
        link.addEventListener('click', function (e) {
          e.preventDefault();
          if (currentLang) currentLang.textContent = this.getAttribute('data-lang');
          closeLang();
        });
      });
    }

    /* ────────────────────────────────────────────────────────
       MOBILE NAV DRAWER
       ──────────────────
       BUG FIX: the old CSS defined .mobile-nav twice with conflicting
       right values (-280px vs -300px). The second rule won, but both
       were processed. Also, animating right: triggers layout on every
       frame. The new header.css uses transform:translateX instead —
       composited, GPU-accelerated, zero layout cost.

       JS here just toggles .open. CSS does the animation.
    ──────────────────────────────────────────────────────── */
    function openMobile() {
      if (mobileNav)     {
        mobileNav.classList.add('open');
        mobileNav.setAttribute('aria-hidden', 'false');
      }
      if (mobileOverlay) mobileOverlay.classList.add('open');
      if (mobileBtn)     mobileBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeMobile() {
      if (mobileNav)     {
        mobileNav.classList.remove('open');
        mobileNav.setAttribute('aria-hidden', 'true');
      }
      if (mobileOverlay) mobileOverlay.classList.remove('open');
      if (mobileBtn)     mobileBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    if (mobileBtn)     mobileBtn.addEventListener('click', openMobile);
    if (mobileClose)   mobileClose.addEventListener('click', closeMobile);
    if (mobileOverlay) mobileOverlay.addEventListener('click', closeMobile);

    /* Close drawer when any nav link inside it is clicked */
    if (mobileNav) {
      mobileNav.querySelectorAll('a').forEach(function (a) {
        a.addEventListener('click', closeMobile);
      });
    }

    /* ────────────────────────────────────────────────────────
       ESCAPE KEY — closes everything
    ──────────────────────────────────────────────────────── */
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeSearch();
      closeLang();
      closeMobile();
    });

    /* ────────────────────────────────────────────────────────
       CLICK OUTSIDE — closes search & lang dropdown
       Uses event.target containment rather than stopPropagation
       so other page elements still receive their own click events.
    ──────────────────────────────────────────────────────── */
    document.addEventListener('click', function (e) {
      /* Close search when clicking outside the header entirely */
      if (searchBar && searchBar.classList.contains('open')) {
        if (header && !header.contains(e.target)) {
          closeSearch();
        }
      }

      /* Close lang dropdown when clicking outside .lang-dropdown */
      if (langDropdown && !langDropdown.contains(e.target)) {
        closeLang();
      }
    });

    /* ────────────────────────────────────────────────────────
       DESKTOP DROPDOWN — touch device support
       Prevents navigating away on first tap; opens submenu instead.
    ──────────────────────────────────────────────────────── */
    if (header) {
      header.querySelectorAll('.dropdown').forEach(function (dd) {
        dd.addEventListener('touchstart', function (e) {
          var isOpen = dd.classList.contains('touch-open');
          /* Close all others */
          header.querySelectorAll('.dropdown.touch-open').forEach(function (x) {
            if (x !== dd) x.classList.remove('touch-open');
          });
          if (!isOpen) {
            e.preventDefault();
            dd.classList.add('touch-open');
          } else {
            dd.classList.remove('touch-open');
          }
        }, { passive: false });
      });

      document.addEventListener('touchstart', function (e) {
        if (!e.target.closest || !e.target.closest('.dropdown')) {
          header.querySelectorAll('.dropdown.touch-open').forEach(function (dd) {
            dd.classList.remove('touch-open');
          });
        }
      }, { passive: true });
    }

    /* ── Mark active nav link based on current URL ── */
    setActiveNav();

  } /* ── end initHeader() ── */


  /* ══════════════════════════════════════════════════════════
     loadHeader()
     Fetches components/header.html and injects it into
     #site-header, then wires all interactions via initHeader().

     If the page has a hardcoded header (no #site-header), it
     still sets the active nav state and marks the guard.
  ══════════════════════════════════════════════════════════ */
  function loadHeader() {
    var placeholder = document.getElementById('site-header');

    if (!placeholder) {
      /* Hardcoded header — skip fetch, just activate nav */
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
        initHeader();                   /* 2. Wire ALL interactions */
      })
      .catch(function (err) {
        console.warn('[CAAR] Header load failed:', err.message);
        /* Even if the header fails to load, mark ready so no retry loop */
        if (!window.__caarHeaderReady) {
          window.__caarHeaderReady = true;
          setActiveNav();
        }
      });
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════ */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadHeader);
  } else {
    loadHeader();
  }

}());