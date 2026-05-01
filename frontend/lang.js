(function () {
  'use strict';

  var STORAGE_KEY = 'caarLanguage';
  var DEFAULT_LANG = 'EN';
  var RTL_LANGS = ['AR'];
  var translations = {};
  var translationsLoaded = false;

  function localeUrl(code) {
    return 'lang/' + code.toLowerCase() + '.json';
  }

  function loadLocale(code) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', localeUrl(code), false);
    xhr.send(null);

    if (xhr.status < 200 || xhr.status >= 300) {
      return {};
    }

    try {
      return JSON.parse(xhr.responseText || '{}');
    } catch (err) {
      console.warn('[CAAR] Failed to parse locale file:', code, err);
      return {};
    }
  }

  function loadTranslations() {
    if (translationsLoaded) {
      return translations;
    }

    translations = {
      EN: loadLocale('EN'),
      FR: loadLocale('FR'),
      AR: loadLocale('AR')
    };
    translationsLoaded = true;
    return translations;
  }

  function normalizeCode(code) {
    return (code || '').toString().trim().toUpperCase();
  }

  function getSavedLanguage() {
    loadTranslations();
    var saved = normalizeCode(localStorage.getItem(STORAGE_KEY));
    return saved && translations[saved] ? saved : DEFAULT_LANG;
  }

  function saveLanguage(code) {
    localStorage.setItem(STORAGE_KEY, code);
  }

  function getTranslation(key, lang) {
    loadTranslations();
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
    var lang = getSavedLanguage();
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
    loadTranslations();
    var lang = normalizeCode(code);
    if (!translations[lang]) {
      lang = DEFAULT_LANG;
    }
    saveLanguage(lang);
    applyTranslations(document);
    document.dispatchEvent(new CustomEvent('caar:language-changed', {
      detail: { lang: lang }
    }));
  }

  function init() {
    loadTranslations();
    setLanguage(getSavedLanguage());
  }

  function translate(key, lang) {
    var activeLang = normalizeCode(lang) || getSavedLanguage();
    if (!translations[activeLang]) activeLang = DEFAULT_LANG;
    return getTranslation(key, activeLang);
  }

  window.Language = {
    init: init,
    setLanguage: setLanguage,
    getLanguage: getSavedLanguage,
    applyTranslations: applyTranslations,
    t: translate,
    getTranslation: translate
  };
})();
