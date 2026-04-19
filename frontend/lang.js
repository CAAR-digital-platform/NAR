(function () {
  'use strict';

  var STORAGE_KEY = 'caarLanguage';
  var DEFAULT_LANG = 'EN';
  var RTL_LANGS = ['AR'];
  var translations = window.CAAR_TRANSLATIONS || {};

  function normalizeCode(code) {
    return (code || '').toString().trim().toUpperCase();
  }

  function getSavedLanguage() {
    var saved = normalizeCode(localStorage.getItem(STORAGE_KEY));
    return saved && translations[saved] ? saved : DEFAULT_LANG;
  }

  function saveLanguage(code) {
    localStorage.setItem(STORAGE_KEY, code);
  }

  function getTranslation(key, lang) {
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

  function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(function (element) {
      applyText(element, element.dataset.i18n, lang);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function (element) {
      var key = element.dataset.i18nPlaceholder;
      if (key) element.placeholder = getTranslation(key, lang);
    });
    document.documentElement.lang = lang.toLowerCase();
    document.documentElement.dir = RTL_LANGS.indexOf(lang) >= 0 ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', RTL_LANGS.indexOf(lang) >= 0);
    updateLanguageDropdown(lang);
    updateCurrentLang(lang);
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
    var lang = normalizeCode(code);
    if (!translations[lang]) {
      lang = DEFAULT_LANG;
    }
    saveLanguage(lang);
    applyTranslations(lang);
  }

  function init() {
    if (typeof translations !== 'object' || Object.keys(translations).length === 0) {
      return;
    }
    setLanguage(getSavedLanguage());
  }

  window.Language = {
    init: init,
    setLanguage: setLanguage,
    getLanguage: getSavedLanguage,
    applyTranslations: applyTranslations
  };
})();
