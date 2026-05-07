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
        // Now main.js is in js/ folder, so base should be parent of js/
        return s.replace(/js\/main\.js.*$/, '').replace(/main\.js.*$/, '');
      }
    }
    var p = window.location.pathname;
    return p.slice(0, p.lastIndexOf('/') + 1);
  }

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var existing = document.querySelector('script[src="' + src + '"]');
      if (existing) {
        if (existing.dataset.loaded === 'true') {
          resolve();
          return;
        }
        existing.addEventListener('load', function onLoad() {
          existing.removeEventListener('load', onLoad);
          resolve();
        });
        existing.addEventListener('error', function onError() {
          existing.removeEventListener('error', onError);
          reject(new Error('Failed to load ' + src));
        });
        return;
      }

      var script = document.createElement('script');
      script.src = src;
      script.async = false;
      script.onload = function () {
        script.dataset.loaded = 'true';
        resolve();
      };
      script.onerror = function () { reject(new Error('Failed to load ' + src)); };
      document.head.appendChild(script);
    });
  }

  function loadStyle(href) {
    if (document.querySelector('link[href="' + href + '"]')) return Promise.resolve();
    return new Promise(function (resolve, reject) {
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = function () { resolve(); };
      link.onerror = function () { reject(new Error('Failed to load ' + href)); };
      document.head.appendChild(link);
    });
  }

  function loadLanguageAssets(base) {
    return loadScript(base + 'js/translations.js')
      .then(function () { return loadScript(base + 'js/lang.js'); })
      .then(function () { return loadScript(base + 'js/header-auth.js'); })
      .then(function () {
        if (window.Language && typeof window.Language.init === 'function') {
          return window.Language.init();
        }
      });
  }

  function loadSearchAssets(base) {
    return loadStyle(base + 'css/Search.css')
      .then(function () { return loadScript(base + 'js/Search.js'); });
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
        if (window.Language && typeof window.Language.applyTranslations === 'function') {
          window.Language.applyTranslations(el);
        }
        if (callback) callback();
      })
      .catch(function (err) {
        console.warn('[CAAR] Component load failed:', url, err.message);
        if (callback) callback();
      });
  }

  function getHeaderRuntimeStatus() {
    var missing = [];

    if (!window.Header) missing.push('window.Header');
    if (!window.Header || typeof window.Header.init !== 'function') missing.push('window.Header.init');
    if (!window.Header || typeof window.Header.render !== 'function') missing.push('window.Header.render');

    return {
      ready: missing.length === 0,
      missing: missing,
    };
  }

  function initHeaderSafely(attempt, maxAttempts) {
    var status = getHeaderRuntimeStatus();
    if (status.ready) {
      try {
        window.Header.init();
        return true;
      } catch (err) {
        console.error('[CAAR][HeaderBoot] Header.init() crashed. Initialization aborted.', err);
        return false;
      }
    }

    var isLastAttempt = attempt >= maxAttempts;

    if (isLastAttempt) {
      console.error('[CAAR][HeaderBoot] Header initialization aborted. Missing required globals:', status.missing.join(', '));
      return false;
    }

    console.error('[CAAR][HeaderBoot] Header dependencies unavailable (attempt ' + attempt + '/' + maxAttempts + '). Missing:', status.missing.join(', '));
    setTimeout(function () {
      initHeaderSafely(attempt + 1, maxAttempts);
    }, 120);
    return false;
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
        initHeaderSafely(1, 20);
        
        if (window.initHeaderAuth) {
          window.initHeaderAuth();
        }

        if (window.Language && typeof window.Language.applyTranslations === 'function') {
          window.Language.applyTranslations(document);
        }

        if (window.CAARSmartSearch && typeof window.CAARSmartSearch.init === 'function') {
          window.CAARSmartSearch.init();
        }
      });
    }

    /* ── Footer ── */
    if (document.getElementById('site-footer')) {
      loadComponent('site-footer', base + 'components/footer.html', function () {
        if (window.Language && typeof window.Language.applyTranslations === 'function') {
          window.Language.applyTranslations(document);
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      var base = resolveBase();
      Promise.all([loadLanguageAssets(base), loadSearchAssets(base)]).then(boot).catch(function (err) {
        console.warn('[CAAR] Language assets failed to load:', err.message);
        boot();
      });
    });
  } else {
    var base = resolveBase();
    Promise.all([loadLanguageAssets(base), loadSearchAssets(base)]).then(boot).catch(function (err) {
      console.warn('[CAAR] Language assets failed to load:', err.message);
      boot();
    });
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
    '  position:absolute; top:calc(100% + 10px); inset-inline-end:0;',
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
    '  position:absolute; top:calc(100% + 8px); inset-inline-end:0;',
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
    '.lang-dropdown-menu li.active a { background:#f7e5d1; color:#d55c00; }',
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

  window.resetContactForm = function () {
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

  var section = document.getElementById('contactForm');
  var formRevealed = !!(section && section.classList.contains('show'));
  var ctaBtn = document.getElementById('ctaBtn');
  if (ctaBtn) {
    ctaBtn.addEventListener('click', function () {
      section = document.getElementById('contactForm');
      if (!section) return;
      if (!formRevealed) { section.classList.add('show'); formRevealed = true; }
      setTimeout(function () { section.scrollIntoView({ behavior: 'smooth' }); }, 80);
    });
  }

  window.collapseForm = function () {
    section = document.getElementById('contactForm');
    if (section) section.classList.remove('show');
    formRevealed = false;
  };
});


/* ============================================================
   ONLINE SUBSCRIPTION PAGE - homepage products from API
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var homepageGridEl = document.getElementById('homepageProductsGrid');
  if (!homepageGridEl) return;
  if (window.__homepageProductsInited) return;
  window.__homepageProductsInited = true;

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function request(path) {
    if (typeof window.apiRequest === 'function') {
      return window.apiRequest(path);
    }

    return fetch('http://localhost:3000' + path, { method: 'GET' })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      });
  }

  function setState(message) {
    homepageGridEl.innerHTML = '<p class="products-online-state">' + esc(message) + '</p>';
  }

  function t(key, fallback) {
    if (window.Language && typeof window.Language.t === 'function') {
      var value = window.Language.t(key);
      if (value) return value;
    }
    return fallback || '';
  }

  function resolveSubscriptionHref(product) {
    var id = Number(product && product.id);
    if (id === 1) return 'catnat-subscription.html';
    if (id === 2) return 'roads.html';

    var name = String((product && product.name) || '').toLowerCase();
    if (name.indexOf('catnat') !== -1 || name.indexOf('natural') !== -1) return 'catnat-subscription.html';
    if (name.indexOf('roadside') !== -1 || name.indexOf('road') !== -1) return 'roads.html';
    return '#';
  }

  function resolveProductImage(imageUrl) {
    if (!imageUrl || typeof imageUrl !== 'string') {
      return 'img/new.webp';
    }

    var trimmed = String(imageUrl).trim();
    if (!trimmed) {
      return 'img/new.webp';
    }

    // If it starts with http/https, use as-is; otherwise treat as relative to frontend folder
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    // Relative path — ensure it's relative to /frontend/ folder
    // If it's already img/..., keep it; browser will resolve correctly from HTML location
    if (trimmed.indexOf('/') === -1 || trimmed.indexOf('img/') === 0 || trimmed.indexOf('./img/') === 0) {
      return trimmed.indexOf('img/') === 0 ? trimmed : ('img/' + trimmed);
    }

    return 'img/new.webp';
  }

  // NOTE: Use DB `image_url` exactly as provided. Do not transform the value
  // (do not strip 'img/' or reconstruct paths). Only fall back when the
  // DB value is missing/empty or when the image fails to load (onerror).
  function renderProducts(products) {
    if (!products.length) {
      setState(t('online.no_products', 'No online products are available right now.'));
      return;
    }

    homepageGridEl.innerHTML = products.map(function (product) {
      // Use the image_url exactly as stored in the DB/API. If it's null or
      // an empty string, use the placeholder. Do NOT modify the string.
      var resolved = (product.image_url == null || product.image_url === '') ? 'img/new.webp' : product.image_url;
      var imageHtml = '<img class="product-online-card-img" src="' + esc(resolved) + '" alt="' + esc(product.name || t('online.product_alt', 'Online product')) + '" onerror="this.src=\'img/new.webp\';this.onerror=null;"/>';
      var label = String(product.cta_label || t('online.subscribe', 'Subscribe')).trim() || t('online.subscribe', 'Subscribe');
      var href = resolveSubscriptionHref(product);

      return [
        '<div class="product-online-card">',
        imageHtml,
        '<h3 class="product-online-card-title">' + esc(product.name || '') + '</h3>',
        '<p class="product-online-card-desc">' + esc(product.description || '') + '</p>',
        '<a href="' + esc(href) + '" class="product-online-card-btn">',
        '  <img class="product-online-card-btn-logo" src="img/cib.webp" alt="CIB"/>',
        '  <div class="product-online-card-btn-text">',
        '    <span class="product-online-card-btn-label">' + esc(label) + '</span>',
        '    <span class="product-online-card-btn-arrow">&#8594;</span>',
        '  </div>',
        '</a>',
        '</div>',
      ].join('');
    }).join('');

    if (window.CAARAccessGate && typeof window.CAARAccessGate.protectLinks === 'function') {
      window.CAARAccessGate.protectLinks('a.product-online-card-btn', { reason: 'product_auth_required' });
    }
  }

  (async function loadHomepageProducts() {
    setState(t('online.loading', 'Loading online products...'));

    var res;
    try {
      res = await request('/api/homepage-products');
    } catch (_) {
      setState(t('online.unable_to_load', 'Unable to load online products right now.'));
      return;
    }

    if (!res.ok) {
      setState(t('online.unable_to_load', 'Unable to load online products right now.'));
      return;
    }

    var data = res.data || {};
    var products = Array.isArray(data) ? data : (Array.isArray(data.products) ? data.products : []);
    renderProducts(products);
  })();
});

/* ============================================================
   NEWS PAGE - dynamic published articles
============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var newsContainer = document.getElementById('news-container');
  var newsPagination = document.getElementById('news-pagination');
  var listView = document.getElementById('articles-list-view');
  var detailView = document.getElementById('article-detail');
  var detailBackBtn = document.getElementById('article-detail-back');
  var detailTitle = document.getElementById('detail-title');
  var detailDate = document.getElementById('detail-date');
  var detailText = document.getElementById('detail-text');
  var detailImage = document.getElementById('detail-image');
  var detailImageWrap = document.getElementById('detail-image-wrap');
  if (!newsContainer) return;
  if (window.__newsArticlesInited) return;
  window.__newsArticlesInited = true;

  var NEWS_PER_PAGE = 4;
  var currentPage = 1;
  var allArticles = [];
  var FALLBACK_NEWS_IMAGE = 'img/new.webp';

  function esc(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function preview(content) {
    var text = String(content == null ? '' : content)
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (text.length <= 120) return text;
    return text.slice(0, 120).trimEnd() + '...';
  }

  function formatDate(value) {
    if (!value) return '';
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  }

  function showFallback(message) {
    newsContainer.innerHTML = '<p class="articles-section__subtitle">' + esc(message) + '</p>';
    if (newsPagination) newsPagination.innerHTML = '';
  }

  function normaliseArticleId(article) {
    if (!article || article.id == null) return '';
    return String(article.id).trim();
  }

  function isValidArticle(article) {
    if (!article || typeof article !== 'object') return false;
    var title = String(article.title || '').trim();
    var content = String(article.content || '').trim();
    return title.length > 0 && content.length > 0;
  }

  function getArticleImage(article) {
    if (!article || typeof article !== 'object') return FALLBACK_NEWS_IMAGE;
    var image = String(article.image_url || '').trim();
    return image || FALLBACK_NEWS_IMAGE;
  }

  function getArticleById(id) {
    if (!id) return null;
    for (var i = 0; i < allArticles.length; i++) {
      if (normaliseArticleId(allArticles[i]) === id) return allArticles[i];
    }
    return null;
  }

  function renderFullContent(content) {
    var text = String(content == null ? '' : content).replace(/\r\n/g, '\n').trim();
    if (!text) return '<p>' + (window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.no_content', 'No content available for this article.') : 'No content available for this article.') + '</p>';

    return text
      .split(/\n{2,}/)
      .map(function (paragraph) {
        return '<p>' + esc(paragraph).replace(/\n/g, '<br>') + '</p>';
      })
      .join('');
  }

  function showListView() {
    if (detailView) {
      detailView.classList.add('is-hidden');
      detailView.classList.remove('fade-in');
    }
    if (listView) listView.style.display = '';
  }

  function showDetailView(article) {
    if (!article || !listView || !detailView) return;

    var image = getArticleImage(article);
    var titleText = String(article.title || (window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.untitled_article', 'Untitled') : 'Untitled'));

    if (detailTitle) detailTitle.textContent = titleText;
    if (detailDate) detailDate.textContent = formatDate(article.created_at);
    if (detailText) detailText.innerHTML = renderFullContent(article.content);

    if (detailImage && image) {
      detailImage.src = image;
      detailImage.alt = titleText;
    }
    if (detailImageWrap) detailImageWrap.style.display = image ? '' : 'none';

    listView.style.display = 'none';
    detailView.classList.remove('is-hidden');
    detailView.classList.add('fade-in');

    var section = document.getElementById('articles-section');
    if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function renderPagination(articles) {
    if (!newsPagination) return;
    newsPagination.innerHTML = '';
    if (!articles || !articles.length) return;

    var totalPages = Math.ceil(articles.length / NEWS_PER_PAGE);
    console.log('Articles:', articles.length);
    console.log('Total pages:', totalPages);

    for (var i = 1; i <= totalPages; i++) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'page-btn' + (i === currentPage ? ' active' : '');
      btn.textContent = i;
      btn.addEventListener('click', (function (pageNumber) {
        return function () {
          if (pageNumber === currentPage) return;
          currentPage = pageNumber;
          renderCurrentPage();
        };
      })(i));
      newsPagination.appendChild(btn);
    }
  }

  function renderCurrentPage() {
    if (!allArticles.length) {
      showFallback(window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.no_articles', 'No published articles available yet.') : 'No published articles available yet.');
      return;
    }

    var totalPages = Math.ceil(allArticles.length / NEWS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    var pageStart = (currentPage - 1) * NEWS_PER_PAGE;
    var pageItems = allArticles.slice(pageStart, pageStart + NEWS_PER_PAGE);

    newsContainer.innerHTML = pageItems.map(function (article) {
      var title = esc(article.title || (window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.untitled_article', 'Untitled') : 'Untitled'));
      var excerpt = esc(preview(article.content || (window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.no_summary', 'No summary available for this article.') : 'No summary available for this article.')));
      var date = esc(formatDate(article.created_at));
      var image = getArticleImage(article);
      var articleId = esc(normaliseArticleId(article));

      return [
        '<article class="news-card">',
        '  <img src="' + esc(image) + '" alt="' + title + '">',
        '  <div class="news-content">',
        '    <span class="news-date">' + date + '</span>',
        '    <h3>' + title + '</h3>',
        '    <p>' + excerpt + '</p>',
        '    <button type="button" class="read-btn" data-article-id="' + articleId + '">' + (window.Language && typeof window.Language.t === 'function' ? window.Language.t('actions.read_more', 'Read More') : 'Read More') + '</button>',
        '  </div>',
        '</article>'
      ].join('');
    }).join('');

    renderPagination(allArticles);
  }

  function request(path) {
    if (typeof window.apiRequest === 'function') {
      return window.apiRequest(path);
    }

    return fetch('http://localhost:3000' + path, { method: 'GET' })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      });
  }

  (async function loadNewsArticles() {
    showListView();
    showFallback(window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.loading', 'Loading news...') : 'Loading news...');

    try {
      var res = await request('/api/news');

      if (!res.ok) {
        console.error('[news] Failed to fetch /api/news:', res.status, res.data);
        showFallback(window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.unable_to_load', 'Unable to load news right now.') : 'Unable to load news right now.');
        return;
      }

      var payload = res.data || {};
      var articles = Array.isArray(payload.articles) ? payload.articles : [];
      allArticles = articles.filter(isValidArticle);
      currentPage = 1;
      renderCurrentPage();
    } catch (err) {
      console.error('[news] Unexpected error while loading news:', err);
      showFallback(window.Language && typeof window.Language.t === 'function' ? window.Language.t('news.unable_to_load', 'Unable to load news right now.') : 'Unable to load news right now.');
    }
  })();

  newsContainer.addEventListener('click', function (event) {
    var btn = event.target.closest('.read-btn');
    if (!btn) return;

    var articleId = String(btn.getAttribute('data-article-id') || '').trim();
    if (!articleId) return;

    var article = getArticleById(articleId);
    if (!article) return;

    showDetailView(article);
  });

  if (detailBackBtn) {
    detailBackBtn.addEventListener('click', function () {
      showListView();
      var section = document.getElementById('articles-section');
      if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }
});
// Dans le callback de loadComponent('site-header', ...)
var path = window.location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-link').forEach(function(link) {
  var href = link.getAttribute('href');
  if (href === path || (path === '' && href === 'index.html')) {
    link.classList.add('active');
  }
});
