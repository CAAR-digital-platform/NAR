/* ============================================================
   CAAR — main.js  (REFACTORED — v4, FIXED)

   FIXES IN THIS VERSION:
   1. Removed stray console.log at end of file that referenced
      `base` outside boot(), causing ReferenceError on every page.
   2. Updated injected search-bar CSS:
      - justify-content:center on .search-bar
      - width:100%; max-width:700px on .hdr-search-input
      - border-radius:50px (pill shape)

   RESPONSIBILITIES:
     • Load header/footer HTML components via fetch
     • Call Header.init() after header is injected
     • Global page utilities (product panels, careers, forms, etc.)
     • Contact page map + form
     • News page article pagination

   NOT responsible for:
     • Auth state       → app-state.js
     • Header behaviour → header-controller.js
     • Header rendering → header-controller.js
   ============================================================ */

/* ============================================================
   BOOT
============================================================ */
(function () {
  'use strict';

  if (window.__caarAppReady) return;
  window.__caarAppReady = true;

  /* ── Resolve the base path from the script tag ── */
  function resolveBase() {
    var scripts = document.querySelectorAll('script[src]');
    for (var i = 0; i < scripts.length; i++) {
      var s = scripts[i].getAttribute('src');
      if (s && s.indexOf('main.js') !== -1) {
        return s.replace(/main\.js.*$/, '');
      }
    }
    var p = window.location.pathname;
    return p.slice(0, p.lastIndexOf('/') + 1);
  }

  /* ── Load an HTML component into a DOM element ── */
  function loadComponent(id, url, callback) {
    var el = document.getElementById(id);
    if (!el) {
      if (callback) callback();
      return;
    }
    fetch(url)
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.text();
      })
      .then(function (html) {
        el.innerHTML = html;
        if (callback) callback();
      })
      .catch(function (err) {
        console.warn('[CAAR] Component load failed:', url, err.message);
        if (callback) callback();
      });
  }

  /* ============================================================
     BOOT FUNCTION — ALL component loading is inside here.
     base is defined here and NEVER referenced outside this fn.
  ============================================================ */
  function boot() {
    var base = resolveBase();

    /* ── Header ── */
    if (document.getElementById('site-header')) {
      loadComponent('site-header', base + 'components/header.html', function () {
        /* header-controller.js must already be loaded (script tag order) */
        if (window.Header && typeof window.Header.init === 'function') {
          window.Header.init();
        } else {
          console.error('[CAAR] Header controller not found. Check script load order.');
        }
      });
    }

    /* ── Footer ── */
    if (document.getElementById('site-footer')) {
      loadComponent('site-footer', base + 'components/footer.html', null);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();


/* ============================================================
   INJECTED CSS
   Only rules that cannot live in main.css (dynamic additions).
   FIX: search bar now uses justify-content:center + max-width
        so the input is properly centred and sized.
============================================================ */
(function () {
  var style = document.createElement('style');
  style.textContent = [

    /* User dropdown — driven ONLY by .open class */
    '.user-dropdown {',
    '  position:absolute; top:calc(100% + 10px); right:0;',
    '  background:#fff; border-radius:12px; min-width:200px;',
    '  box-shadow:0 12px 32px rgba(0,0,0,0.13); border:1px solid #f0ece6;',
    '  padding:6px 0; z-index:9999;',
    '  opacity:0; transform:translateY(8px);',
    '  pointer-events:none;',
    '  transition:opacity .22s ease, transform .22s ease;',
    '}',
    '.user-dropdown.open {',
    '  opacity:1; transform:translateY(0); pointer-events:auto;',
    '}',

    /* ── Search bar — FIX: centred input with max-width ── */
    '.search-bar {',
    '  display:flex; align-items:center; justify-content:center; gap:12px;',
    '  padding:0 40px; background:#fff; border-top:1.5px solid #e8e0d8;',
    '  max-height:0; opacity:0; transform:translateY(-8px);',
    '  pointer-events:none; overflow:hidden;',
    '  transition:max-height .3s ease, opacity .3s ease, transform .3s ease, padding .3s ease;',
    '}',
    '.search-bar.open {',
    '  max-height:80px; opacity:1; transform:translateY(0);',
    '  pointer-events:auto; padding:14px 40px;',
    '}',
    /* ── Search input — FIX: full width up to 700px, pill shape ── */
    '.hdr-search-input {',
    '  width:100%; max-width:700px; padding:12px 22px;',
    '  border:1.5px solid #E8761E; border-radius:50px;',
    '  font-size:.92rem; font-family:inherit;',
    '  background:#f8f5f0; outline:none; color:#1c1c1c;',
    '  transition:box-shadow .2s ease, border-color .2s ease;',
    '}',
    '.hdr-search-input:focus {',
    '  box-shadow:0 0 0 3px rgba(232,118,30,0.15); border-color:#c96000;',
    '}',
    '.hdr-search-input::placeholder { color:#bbb; font-style:italic; }',

    '.search-close-hdr {',
    '  background:none; border:none; cursor:pointer;',
    '  font-size:1.1rem; color:#999; padding:6px 8px;',
    '  border-radius:50%; line-height:1; flex-shrink:0;',
    '  transition:background .2s, color .2s;',
    '}',
    '.search-close-hdr:hover { background:#f0f0f0; color:#333; }',

    /* Language dropdown */
    '.lang-dropdown { position:relative; }',
    '.lang-dropdown-menu {',
    '  position:absolute; top:calc(100% + 8px); right:0;',
    '  background:#fff; border:1px solid #e8e0d8; border-radius:10px;',
    '  min-width:155px; box-shadow:0 8px 24px rgba(0,0,0,.11);',
    '  list-style:none; padding:5px 0; z-index:1010;',
    '  opacity:0; transform:translateY(-8px); pointer-events:none;',
    '  transition:opacity .22s ease, transform .22s ease;',
    '}',
    '.lang-dropdown-menu.show { opacity:1; transform:translateY(0); pointer-events:auto; }',
    '.lang-dropdown-menu li a {',
    '  display:flex; align-items:center; gap:8px;',
    '  padding:9px 14px; font-size:.83rem; font-weight:600;',
    '  color:#1c1c1c; text-decoration:none;',
    '  transition:background .15s, color .15s;',
    '}',
    '.lang-dropdown-menu li a:hover { background:#fff5e6; color:#F57C00; }',
    '.lang-toggle-btn svg { transition:transform .2s ease; }',
    '.lang-dropdown.lang-open .lang-toggle-btn svg { transform:rotate(180deg); }',

    /* Mobile */
    '@media(max-width:768px){',
    '  .nav-links,.top-row,.top-divider { display:none; }',
    '  .mobile-menu-btn { display:flex !important; }',
    '  .logo-img { width:72px; height:72px; }',
    '  .search-bar.open { padding:10px 16px; }',
    '  .hdr-search-input { max-width:100%; }',
    '}',

  ].join('\n');
  document.head.appendChild(style);
})();


/* ============================================================
   PAGE-LEVEL UTILITIES
   (product panels, company tabs, careers, multi-step forms, etc.)
   These do not touch the header.
============================================================ */

/* ── Product sidebar panel switch ── */
function show(k, btn) {
  document.querySelectorAll('.detail').forEach(function (p) { p.classList.remove('on'); });
  document.querySelectorAll('.sidebar-btn').forEach(function (b) { b.classList.remove('active'); });
  var target = document.getElementById('d-' + k);
  if (target) target.classList.add('on');
  if (btn) btn.classList.add('active');
  var bc = document.getElementById('bc');
  if (bc && btn) {
    var title = btn.querySelector('div > div:first-child');
    if (title) bc.textContent = title.textContent;
  }
}

function showTransport(k, btn) { show(k, btn); }

/* ── Company tabs ── */
function showTab(tabId, btn) {
  document.querySelectorAll('.tab-pane').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('.company-nav-btn').forEach(function (b) { b.classList.remove('active'); });
  var pane = document.getElementById('tab-' + tabId);
  if (pane) pane.classList.add('active');
  if (btn) btn.classList.add('active');
}

function toggleFullMessage() {
  var preview = document.getElementById('ld-preview');
  var full    = document.getElementById('ld-full-message');
  var readBtn = document.getElementById('ld-read-btn');
  if (!preview || !full || !readBtn) return;
  if (full.classList.contains('open')) {
    full.classList.remove('open'); full.style.display = 'none';
    preview.style.display = ''; readBtn.style.display = '';
  } else {
    full.classList.add('open'); full.style.display = 'block';
    preview.style.display = 'none'; readBtn.style.display = 'none';
  }
}

/* ── Careers tabs ── */
function goToTab(tabName) {
  document.querySelectorAll('.careers-tab-content').forEach(function (el) { el.classList.remove('active'); });
  document.querySelectorAll('.careers-tab').forEach(function (b) { b.classList.remove('active'); });
  var content = document.getElementById('tab-' + tabName);
  if (content) content.classList.add('active');
  var btn = document.querySelector('[data-tab="' + tabName + '"]');
  if (btn) btn.classList.add('active');
}

function filterJobs(btn, category) {
  document.querySelectorAll('.jf-btn').forEach(function (b) { b.classList.remove('active'); });
  btn.classList.add('active');
  var rows = document.querySelectorAll('.job-row');
  var noFilter = document.getElementById('noFilterResults');
  var found = 0;
  rows.forEach(function (row) {
    var vis = category === 'All' || row.getAttribute('data-dept') === category;
    row.style.display = vis ? '' : 'none';
    if (vis) found++;
  });
  if (noFilter) noFilter.style.display = found === 0 ? 'block' : 'none';
}

function filterAndGo(category) {
  goToTab('jobs');
  setTimeout(function () {
    var btn = document.querySelector('.jf-btn[onclick*="' + category + '"]');
    if (btn) filterJobs(btn, category);
  }, 100);
}

function handleCv(input) {
  var label = document.getElementById('cvLabel');
  if (label && input.files && input.files[0]) {
    label.textContent = input.files[0].name;
    var zone = document.getElementById('cvZone');
    if (zone) zone.classList.add('has-file');
  }
}

function submitApplication() {
  var fields = [
    { id: 'afFirst',    errId: 'err-first',    min: 2 },
    { id: 'afLast',     errId: 'err-last',     min: 2 },
    { id: 'afEmail',    errId: 'err-email',    type: 'email' },
    { id: 'afField',    errId: 'err-field',    required: true },
    { id: 'afPosition', errId: 'err-position', min: 3 },
    { id: 'afMessage',  errId: 'err-message',  min: 20 },
  ];
  var ok = true;
  fields.forEach(function (f) {
    var el = document.getElementById(f.id);
    var errEl = document.getElementById(f.errId);
    if (!el || !errEl) return;
    var val = el.value.trim();
    var valid = true;
    if (f.min && val.length < f.min) valid = false;
    if (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(val)) valid = false;
    if (f.required && !val) valid = false;
    errEl.classList.toggle('show', !valid);
    el.classList.toggle('err', !valid);
    if (!valid) ok = false;
  });
  var cvInput = document.getElementById('afCv');
  var errCv   = document.getElementById('err-cv');
  if (cvInput && errCv) {
    var hasCv = cvInput.files && cvInput.files.length > 0;
    errCv.classList.toggle('show', !hasCv);
    var zone = document.getElementById('cvZone');
    if (zone) zone.classList.toggle('err', !hasCv);
    if (!hasCv) ok = false;
  }
  var consent = document.getElementById('afConsent');
  var errConsent = document.getElementById('err-consent');
  if (consent && errConsent) {
    errConsent.classList.toggle('show', !consent.checked);
    if (!consent.checked) ok = false;
  }
  if (!ok) return;
  var ff = document.getElementById('careerFormFields');
  var sc = document.getElementById('careerSuccess');
  if (ff) ff.style.display = 'none';
  if (sc) sc.classList.add('show');
}

function resetForm() {
  var ff = document.getElementById('careerFormFields');
  var sc = document.getElementById('careerSuccess');
  if (ff) ff.style.display = '';
  if (sc) sc.classList.remove('show');
}

/* ── News advice switcher ── */
var currentAdviceKey = 'road';
function switchAdvice(key, btn) {
  if (key === currentAdviceKey) return;
  var cur  = document.getElementById('advice-' + currentAdviceKey);
  var next = document.getElementById('advice-' + key);
  if (!cur || !next) return;
  cur.classList.add('is-leaving'); cur.classList.remove('is-active');
  setTimeout(function () {
    cur.classList.remove('is-leaving');
    document.querySelectorAll('.advice-category-btn').forEach(function (b) {
      b.classList.remove('is-active'); b.setAttribute('aria-selected', 'false');
    });
    if (btn) { btn.classList.add('is-active'); btn.setAttribute('aria-selected', 'true'); }
    next.classList.add('is-active');
    currentAdviceKey = key;
  }, 200);
}

/* ── Scroll reveal ── */
document.addEventListener('DOMContentLoaded', function () {
  var elements = document.querySelectorAll('.article-section, .article-keypoints, .scroll-reveal, .scroll-reveal-group');
  if (!elements.length) return;
  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible', 'is-revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -30px 0px' });
  elements.forEach(function (el, i) {
    el.style.transitionDelay = (i * 0.05) + 's';
    observer.observe(el);
  });
});


/* ============================================================
   CONTACT PAGE — Leaflet map + form
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var hqMapEl = document.getElementById('hqMap');
  if (hqMapEl && typeof L !== 'undefined') {
    var HQ = { lat: 36.767043, lng: 3.052792 };
    hqMapEl.style.width = '100%';
    hqMapEl.style.height = '340px';
    hqMapEl.style.display = 'block';

    var hqMap = L.map('hqMap', { center: [HQ.lat, HQ.lng], zoom: 16, scrollWheelZoom: false });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(hqMap);

    var hqIcon = L.divIcon({
      className: '',
      html: '<svg width="36" height="46" viewBox="0 0 36 46"><path d="M18 0C8.059 0 0 8.059 0 18 0 31.5 18 46 18 46S36 31.5 36 18C36 8.059 27.941 0 18 0Z" fill="#E8761E"/><circle cx="18" cy="18" r="9" fill="white"/><text x="18" y="23" text-anchor="middle" font-size="12" fill="#E8761E">★</text></svg>',
      iconSize: [36, 46], iconAnchor: [18, 46], popupAnchor: [0, -48],
    });

    L.marker([HQ.lat, HQ.lng], { icon: hqIcon })
      .addTo(hqMap)
      .bindPopup(
        '<div style="font-family:DM Sans,sans-serif;min-width:200px">' +
        '<div style="background:#E8761E;color:#fff;padding:8px 12px;margin:-13px -20px 10px;border-radius:4px 4px 0 0"><strong>CAAR Headquarters</strong></div>' +
        '<p style="font-size:.78rem;color:#555;margin:0">48 Rue Didouche Mourad<br>Algiers 16000, Algeria</p>' +
        '<a href="https://maps.google.com/?q=48+Rue+Didouche+Mourad+Alger" target="_blank" style="display:inline-block;margin-top:8px;font-size:.72rem;color:#E8761E;font-weight:700">Open in Google Maps ↗</a>' +
        '</div>'
      ).openPopup();

    setTimeout(function () { hqMap.invalidateSize(); }, 200);
  }

  /* ── Contact form ── */
  var form = document.getElementById('caarContactForm');
  if (!form) return;

  function showErr(inputId, errorId) {
    var input = document.getElementById(inputId);
    var errEl = document.getElementById(errorId);
    if (input) { input.classList.add('field-error'); input.classList.remove('field-ok'); }
    if (errEl)   errEl.classList.add('visible');
  }
  function clearErr(inputId, errorId) {
    var input = document.getElementById(inputId);
    var errEl = document.getElementById(errorId);
    if (input) { input.classList.remove('field-error'); input.classList.add('field-ok'); }
    if (errEl)   errEl.classList.remove('visible');
  }

  var RULES = {
    subject: function (v) { return v.length > 0; },
    name:    function (v) { return v.length >= 3; },
    email:   function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
    phone:   function (v) { return v === '' || /^[0-9\s+\-()]{8,20}$/.test(v); },
    message: function (v) { return v.length >= 10 && v.length <= 2000; },
  };

  window.updateCharCount = function (textarea) {
    var count = textarea.value.length;
    var max   = parseInt(textarea.getAttribute('maxlength')) || 2000;
    var el    = document.getElementById('cfCharCount');
    if (!el) return;
    el.textContent = count + ' / ' + max;
    el.className = 'cf-char-count' + (count > max * 0.9 ? ' warn' : '') + (count >= max ? ' over' : '');
  };

  form.addEventListener('submit', function (e) { e.preventDefault(); submitContactForm(); });

  async function submitContactForm() {
    var subject = (document.getElementById('cfSubject') || {}).value || '';
    var name    = ((document.getElementById('cfName')    || {}).value || '').trim();
    var email   = ((document.getElementById('cfEmail')   || {}).value || '').trim();
    var phone   = ((document.getElementById('cfPhone')   || {}).value || '').trim();
    var message = ((document.getElementById('cfMessage') || {}).value || '').trim();
    var consent = (document.getElementById('cfConsent') || {}).checked;
    var robot   = (document.getElementById('cfRobot')   || {}).checked;

    var hasError = false;
    if (!RULES.subject(subject)) { showErr('cfSubject', 'err-subject'); hasError = true; } else clearErr('cfSubject', 'err-subject');
    if (!RULES.name(name))       { showErr('cfName',    'err-name');    hasError = true; } else clearErr('cfName',    'err-name');
    if (!RULES.email(email))     { showErr('cfEmail',   'err-email');   hasError = true; } else clearErr('cfEmail',   'err-email');
    if (phone && !RULES.phone(phone)) { showErr('cfPhone', 'err-phone'); hasError = true; } else clearErr('cfPhone', 'err-phone');
    if (!RULES.message(message)) { showErr('cfMessage', 'err-message'); hasError = true; } else clearErr('cfMessage', 'err-message');

    var ec = document.getElementById('err-consent');
    if (!consent) { if (ec) ec.classList.add('visible'); hasError = true; }
    else           { if (ec) ec.classList.remove('visible'); }

    var rw = document.getElementById('cfRobotWrap');
    var er = document.getElementById('err-robot');
    if (!robot) { if (rw) rw.classList.add('robot-error'); if (er) er.classList.add('visible'); hasError = true; }
    else        { if (rw) rw.classList.remove('robot-error'); if (er) er.classList.remove('visible'); }

    if (hasError) {
      var first = document.querySelector('.field-error, .cf-field-error.visible');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    var btn = document.getElementById('sendBtn');
    if (!btn) return;
    btn.textContent = 'Sending…'; btn.disabled = true; btn.classList.add('loading');

    try {
      var res  = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) { alert(data.error || 'Something went wrong.'); return; }
      var ff = document.getElementById('formFields');
      var ss = document.getElementById('successState');
      if (ff) ff.style.display = 'none';
      if (ss) ss.classList.add('show');
    } catch (err) {
      alert('Server error. Please try again later.');
    } finally {
      btn.disabled = false; btn.classList.remove('loading'); btn.textContent = 'Send my request';
    }
  }

  window.resetForm = function () {
    form.reset();
    form.querySelectorAll('.cf-input,.cf-select,.cf-textarea').forEach(function (el) {
      el.classList.remove('field-error', 'field-ok');
    });
    form.querySelectorAll('.cf-field-error').forEach(function (el) { el.classList.remove('visible'); });
    var rw = document.getElementById('cfRobotWrap'); if (rw) rw.classList.remove('robot-error');
    var cc = document.getElementById('cfCharCount'); if (cc) cc.textContent = '0 / 2000';
    var ff = document.getElementById('formFields');  if (ff) ff.style.display = '';
    var ss = document.getElementById('successState'); if (ss) ss.classList.remove('show');
  };

  var formRevealed = false;
  var ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      var section = document.getElementById('contactForm');
      if (!section) return;
      if (!formRevealed) { section.classList.add('show'); formRevealed = true; }
      setTimeout(function () { section.scrollIntoView({ behavior: 'smooth' }); }, 80);
    });
  }

  window.collapseForm = function () {
    var section = document.getElementById('contactForm');
    if (section) section.classList.remove('show');
    formRevealed = false;
  };
});


/* ============================================================
   NEWS PAGE — article pagination + detail view
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var gridEl = document.getElementById('articles-grid');
  if (!gridEl) return;
  if (window.__newsArticlesInited) return;
  window.__newsArticlesInited = true;

  var articles = [
    { id: 'agency602', category: 'PRESS',       date: 'Sep 24, 2023', image: 'img/art1.png', emoji: '🏢', isLatest: false,
      title: 'Agency 602 Renovated – Didouche Mourad',
      excerpt: 'CAAR modernized Agency 602 in Didouche Mourad to enhance customer experience.',
      content: '<p>As part of its network modernization strategy, CAAR completed the renovation of Agency 602, located in Didouche Mourad. Reopened on September 24, 2023, the agency now features a modern design aligned with CAAR\'s visual identity.</p>' },
    { id: 'agency228', category: 'PRESS',       date: 'Sep 25, 2023', image: 'img/art2.png', emoji: '🏢', isLatest: false,
      title: 'Agency 228 Renovated – Larbâa Nath Irathen',
      excerpt: 'Agency 228 was renovated as part of CAAR\'s ongoing distribution network modernization.',
      content: '<p>CAAR continues the modernization of its network with the renovation of Agency 228, in Larbâa Nath Irathen. Officially reopened on September 25, 2023.</p>' },
    { id: 'bejaia',    category: 'EVENT',       date: 'Oct 4, 2023',  image: 'img/art3.png', emoji: '📅', isLatest: false,
      title: 'CAAR Information Day in Béjaïa',
      excerpt: 'CAAR organized an information day in Béjaïa during its 60th anniversary celebrations.',
      content: '<p>As part of its 60th anniversary, CAAR organized an information day on October 4, 2023, at the Cristal Hotel in Béjaïa, gathering key regional partners.</p>' },
    { id: 'sada2025',  category: 'PARTNERSHIP', date: 'Apr 28, 2025', image: 'img/art4.png', emoji: '🤝', isLatest: false,
      title: 'CAAR at the African Business Forum – SADA 2025',
      excerpt: 'CAAR took part in SADA 2025 in Oran, strengthening its presence within the African business community.',
      content: '<p>CAAR participated in the 3rd edition of the African Business Forum (SADA 2025) held in Oran, reinforcing its role within the African business ecosystem.</p>' },
    { id: 'tiziagri',  category: 'EVENT',       date: 'May 10, 2025', image: 'img/art5.png', emoji: '🌾', isLatest: true,
      title: 'TIZI AGRI EXPO 2025',
      excerpt: 'CAAR participated in the 1st edition of TIZI AGRI EXPO, supporting the livestock and dairy sector.',
      content: '<p>CAAR participated in the 1st edition of TIZI AGRI EXPO in Tizi Ouzou, showcasing its agricultural insurance products and connecting with professionals in the sector.</p>' },
  ];

  var PER_PAGE    = 4;
  var currentPage = 1;
  var totalPages  = Math.ceil(articles.length / PER_PAGE);
  var wrapEl      = gridEl.closest('.articles-grid-wrap');
  var paginEl     = document.getElementById('articles-pagination');
  var detailEl    = document.getElementById('article-detail');
  var listView    = document.getElementById('articles-list-view');

  function renderPage(page) {
    if (wrapEl) { wrapEl.classList.remove('is-visible'); wrapEl.classList.add('is-transitioning'); }
    setTimeout(function () {
      currentPage = page;
      var slice = articles.slice((page - 1) * PER_PAGE, page * PER_PAGE);
      gridEl.innerHTML = '';
      slice.forEach(function (art, idx) {
        var card = document.createElement('div');
        card.className = 'article-card';
        card.style.transitionDelay = (idx * 0.07) + 's';
        card.innerHTML =
          '<div class="article-card__img-wrap">' +
            (art.isLatest ? '<span class="article-card__latest">Latest</span>' : '') +
            (art.image ? '<img src="' + art.image + '" alt="' + art.title + '" class="article-card__img">' :
              '<div class="article-card__img-placeholder">' + art.emoji + '</div>') +
          '</div>' +
          '<div class="article-card__body">' +
            '<span class="article-card__category">' + art.category + '</span>' +
            '<span class="article-card__date">' + art.date + '</span>' +
            '<h3 class="article-card__title">' + art.title + '</h3>' +
            '<p class="article-card__excerpt">' + art.excerpt + '</p>' +
            '<button class="article-card__read-btn">Read article →</button>' +
          '</div>';
        card.addEventListener('click', function () { openDetail(art.id); });
        gridEl.appendChild(card);
      });
      renderPagination();
      if (wrapEl) { wrapEl.classList.remove('is-transitioning'); wrapEl.classList.add('is-visible'); }
      gridEl.querySelectorAll('.article-card').forEach(function (c, i) {
        c.style.opacity = '0'; c.style.transform = 'translateY(20px)';
        setTimeout(function () {
          c.style.transition = 'opacity .38s ease,transform .38s ease';
          c.style.opacity = '1'; c.style.transform = 'translateY(0)';
        }, i * 70 + 30);
      });
    }, 220);
  }

  function renderPagination() {
    if (!paginEl) return;
    paginEl.innerHTML = '';
    if (totalPages <= 1) return;
    for (var i = 1; i <= totalPages; i++) {
      (function (p) {
        var btn = document.createElement('button');
        btn.className = 'pagination-btn' + (p === currentPage ? ' is-active' : '');
        btn.textContent = p;
        btn.addEventListener('click', function () { renderPage(p); });
        paginEl.appendChild(btn);
      })(i);
    }
  }

  function openDetail(id) {
    var art = articles.find(function (a) { return a.id === id; });
    if (!art || !detailEl || !listView) return;
    detailEl.innerHTML =
      '<button class="article-back-link" id="detailBackBtn">← Back to articles</button>' +
      '<div class="article-detail__card">' +
        '<h2 class="article-detail__title">' + art.title + '</h2>' +
        '<div style="font-size:.75rem;color:#888;margin-bottom:16px;">' + art.emoji + ' ' + art.category + ' • ' + art.date + '</div>' +
        (art.image ? '<img src="' + art.image + '" alt="' + art.title + '" style="width:100%;border-radius:8px;margin-bottom:16px;">' : '') +
        '<div class="article-detail__text">' + art.content + '</div>' +
      '</div>';
    document.getElementById('detailBackBtn').addEventListener('click', closeDetail);
    listView.style.display = 'none';
    detailEl.classList.remove('is-hidden');
    var section = document.getElementById('articles-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function closeDetail() {
    if (!detailEl || !listView) return;
    detailEl.classList.add('is-hidden');
    listView.style.display = '';
    var section = document.getElementById('articles-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  window.closeArticleDetail = closeDetail;
  renderPage(1);
});