(function () {
  'use strict';

  var STORAGE_KEY = 'caarLanguage';
  var DEFAULT_LANG = 'EN';
  var RTL_LANGS = ['AR'];
  var translations = {};
  var translationsLoaded = false;
  var translationsLoadingPromise = null;
  var initPromise = null;

  function localeUrl(code) {
    return 'lang/' + code.toLowerCase() + '.json';
  }

  function loadLocale(code) {
    return fetch(localeUrl(code), { cache: 'no-cache' })
      .then(function (res) {
        if (!res.ok) {
          return {};
        }
        return res.json().catch(function (err) {
          console.warn('[CAAR] Failed to parse locale file:', code, err);
          return {};
        });
      })
      .catch(function (err) {
        console.warn('[CAAR] Failed to load locale file:', code, err && err.message ? err.message : err);
        return {};
      });
  }

  function ensureTranslationsLoaded() {
    if (translationsLoaded) {
      return Promise.resolve(translations);
    }

    if (translationsLoadingPromise) {
      return translationsLoadingPromise;
    }

    translationsLoadingPromise = Promise.all([
      loadLocale('EN'),
      loadLocale('FR'),
      loadLocale('AR')
    ]).then(function (payloads) {
      translations = {
        EN: payloads[0] || {},
        FR: payloads[1] || {},
        AR: payloads[2] || {}
      };
      translationsLoaded = true;
      return translations;
    }).finally(function () {
      translationsLoadingPromise = null;
    });

    return translationsLoadingPromise;
  }

  function loadTranslations() {
    // Backward-compatible alias for older callsites.
    // This function now starts async loading and returns current cache.
    ensureTranslationsLoaded();

    if (!translationsLoaded) {
      return {
        EN: translations.EN || {},
        FR: translations.FR || {},
        AR: translations.AR || {}
      };
    }

    return translations;
  }

  function normalizeCode(code) {
    return (code || '').toString().trim().toUpperCase();
  }

  function getSavedLanguage() {
    var saved = normalizeCode(localStorage.getItem(STORAGE_KEY));
    if (!saved) return DEFAULT_LANG;
    if (!translationsLoaded) return saved;
    return translations[saved] ? saved : DEFAULT_LANG;
  }

  function saveLanguage(code) {
    localStorage.setItem(STORAGE_KEY, code);
  }

  function getTranslation(key, lang) {
    if (!translationsLoaded) return '';
    if (!key || !lang || !translations[lang]) return '';
    return translations[lang][key] || translations[DEFAULT_LANG][key] || '';
  }

  function applyText(element, key, lang) {
    if (!element || !key) return;
    var value = getTranslation(key, lang);
    if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
      element.placeholder = value;
      return;
    }
    if (element.hasAttribute('data-i18n-html')) {
      element.innerHTML = value;
      return;
    }
    element.textContent = value;
  }

  function applyWithin(root, selector, lang, callback) {
    if (!root || !root.querySelectorAll) return;
    root.querySelectorAll(selector).forEach(function (element) {
      callback(element, lang);
    });
  }

  function applyTranslations(rootElement) {
    if (!translationsLoaded) {
      ensureTranslationsLoaded().then(function () {
        applyTranslations(rootElement);
      });
      return getSavedLanguage();
    }

    var lang = getSavedLanguage();
    if (!translations[lang]) lang = DEFAULT_LANG;
    var root = rootElement && rootElement.querySelectorAll ? rootElement : document;

    if (root.matches && root.matches('[data-i18n]')) {
      applyText(root, root.dataset.i18n, lang);
    }
    if (root.matches && root.matches('[data-i18n-placeholder]')) {
      var rootPlaceholderKey = root.dataset.i18nPlaceholder;
      if (rootPlaceholderKey) root.placeholder = getTranslation(rootPlaceholderKey, lang);
    }
    if (root.matches && root.matches('[data-i18n-title]')) {
      var rootTitleKey = root.dataset.i18nTitle;
      if (rootTitleKey) root.title = getTranslation(rootTitleKey, lang);
    }
    if (root.matches && root.matches('[data-i18n-aria-label]')) {
      var rootAriaKey = root.dataset.i18nAriaLabel;
      if (rootAriaKey) root.setAttribute('aria-label', getTranslation(rootAriaKey, lang));
    }

    applyWithin(root, '[data-i18n]', lang, function (element, currentLang) {
      applyText(element, element.dataset.i18n, currentLang);
    });
    applyWithin(root, '[data-i18n-placeholder]', lang, function (element, currentLang) {
      var key = element.dataset.i18nPlaceholder;
      if (key) element.placeholder = getTranslation(key, currentLang);
    });
    applyWithin(root, '[data-i18n-title]', lang, function (element, currentLang) {
      var key = element.dataset.i18nTitle;
      if (key) element.title = getTranslation(key, currentLang);
    });
    applyWithin(root, '[data-i18n-aria-label]', lang, function (element, currentLang) {
      var key = element.dataset.i18nAriaLabel;
      if (key) element.setAttribute('aria-label', getTranslation(key, currentLang));
    });
    applyWithin(root, '[data-i18n-value]', lang, function (element, currentLang) {
      var key = element.dataset.i18nValue;
      if (key) element.value = getTranslation(key, currentLang);
    });

    if (root === document) {
      document.documentElement.lang = lang.toLowerCase();
      document.documentElement.dir = RTL_LANGS.indexOf(lang) >= 0 ? 'rtl' : 'ltr';
      document.body.classList.toggle('rtl', RTL_LANGS.indexOf(lang) >= 0);
      document.body.classList.toggle('ltr', RTL_LANGS.indexOf(lang) < 0);
      updateLanguageDropdown(lang);
      updateCurrentLang(lang);
    }

    if (root !== document && document.body) {
      document.body.classList.toggle('rtl', RTL_LANGS.indexOf(lang) >= 0);
      document.body.classList.toggle('ltr', RTL_LANGS.indexOf(lang) < 0);
    }

    document.dispatchEvent(new CustomEvent('caar:language-applied', {
      detail: { lang: lang, root: root }
    }));

    return lang;
  }

  function updateCurrentLang(lang) {
    var currentLang = document.getElementById('currentLang');
    if (currentLang) currentLang.textContent = lang;
  }

  function updateLanguageDropdown(lang) {
    document.querySelectorAll('#langDropdownMenu [data-lang]').forEach(function (link) {
      var li = link.closest('li');
      if (!li) return;
      li.classList.toggle('active', normalizeCode(link.getAttribute('data-lang')) === lang);
    });
  }

  function setLanguage(code) {
    return ensureTranslationsLoaded().then(function () {
      var lang = normalizeCode(code);
      if (!translations[lang]) {
        lang = DEFAULT_LANG;
      }
      saveLanguage(lang);
      applyTranslations(document);
      document.dispatchEvent(new CustomEvent('caar:language-changed', {
        detail: { lang: lang }
      }));
      return lang;
    });
  }

  function init() {
    if (initPromise) return initPromise;

    initPromise = ensureTranslationsLoaded().then(function () {
      var lang = getSavedLanguage();
      if (!translations[lang]) lang = DEFAULT_LANG;
      saveLanguage(lang);
      applyTranslations(document);
      return lang;
    });

    return initPromise;
  }

  function translate(key, lang) {
    var activeLang = normalizeCode(lang) || getSavedLanguage();
    if (!translationsLoaded) return '';
    if (!translations[activeLang]) activeLang = DEFAULT_LANG;
    return getTranslation(key, activeLang);
  }

  window.Language = {
    init: init,
    setLanguage: setLanguage,
    getLanguage: getSavedLanguage,
    applyTranslations: applyTranslations,
    t: translate,
    getTranslation: translate,
    ready: init
  };

  function escapeHtml(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Create an inline HTML fragment that can be translated later by applyTranslations.
  // Keeps a safe fallback visible until translations are applied.
  window.i18nSpan = function (key, fallback) {
    return '<span data-i18n="' + escapeHtml(String(key || '')) + '">' + escapeHtml(fallback || '') + '</span>';
  };

  // Convenience alias on Language
  window.Language.i18nSpan = window.i18nSpan;

  // Start loading in background immediately to keep switching responsive.
  ensureTranslationsLoaded();
})();
