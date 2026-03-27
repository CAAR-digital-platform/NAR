/* ============================================================
   CAAR — main.js
   Loads shared header + footer, sets active nav link,
   and wires up all header interactions.
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
        initHeader();
        setActiveNav();
      })
      .catch(function (err) {
        console.warn('Could not load header:', err);
      });
  }

  /* ----------------------------------------------------------
     3. INJECT FOOTER
  ---------------------------------------------------------- */
  function loadFooter() {
    var placeholder = document.getElementById('site-footer');
    if (!placeholder) return;

    fetch('components/footer.html')
      .then(function (res) { return res.text(); })
      .then(function (html) {
        placeholder.innerHTML = html;
      })
      .catch(function (err) {
        console.warn('Could not load footer:', err);
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