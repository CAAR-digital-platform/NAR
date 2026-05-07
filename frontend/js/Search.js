(function () {
  'use strict';

  const MAX_RESULTS = 8;
  const DEBOUNCE_MS = 120;
  const STORAGE_KEY = 'caar-search-target';

  const DATA = [
    {
      id: 'products-overview',
      type: 'page',
      label: 'Products',
      path: ['Pages'],
      href: 'products.html',
      keywords: ['coverage', 'solutions', 'insurance products', 'catalog']
    },
    {
      id: 'individual-risks-category',
      type: 'category',
      label: 'Individual Risks',
      path: ['Products'],
      href: 'products.html',
      sectionId: 'individual-risks-section',
      keywords: ['personal insurance', 'home', 'family', 'individual']
    },
    {
      id: 'multi-risk-home',
      type: 'product',
      label: 'Multi-Risk Home Insurance',
      path: ['Products', 'Individual Risks'],
      href: 'individual-risks.html',
      keywords: ['home insurance', 'mrh', 'habitation', 'residence', 'property']
    },
    {
      id: 'multi-risk-professional',
      type: 'product',
      label: 'Multi-Risk Professional Insurance',
      path: ['Products', 'Individual Risks'],
      href: 'individual-risks.html',
      keywords: ['professional insurance', 'office', 'shop', 'business premises']
    },
    {
      id: 'natural-disaster-insurance',
      type: 'product',
      label: 'Natural Disaster Insurance',
      path: ['Products', 'Individual Risks'],
      href: 'catnat-subscription.html',
      keywords: ['cat nat', 'catnat', 'earthquake', 'flood', 'storm', 'mandatory']
    },
    {
      id: 'auto-insurance-category',
      type: 'category',
      label: 'Auto Insurance',
      path: ['Products'],
      href: 'products.html',
      sectionId: 'auto-insurance-section',
      keywords: ['car insurance', 'vehicle', 'motor', 'automobile']
    },
    {
      id: 'motor-insurance',
      type: 'product',
      label: 'Motor Insurance',
      path: ['Products', 'Auto Insurance'],
      href: 'auto-insurance.html',
      keywords: ['car', 'civil liability', 'vehicle insurance', 'mandatory']
    },
    {
      id: 'roadside-assistance',
      type: 'product',
      label: 'Roadside Assistance',
      path: ['Products', 'Auto Insurance'],
      href: 'roads.html',
      keywords: ['breakdown', 'towing', 'accident help', 'road assistance']
    },
    {
      id: 'glass-breakage',
      type: 'product',
      label: 'Glass Breakage Assistance',
      path: ['Products', 'Auto Insurance'],
      href: 'auto-insurance.html',
      keywords: ['windshield', 'glass', 'windows', 'auto add-on']
    },
    {
      id: 'transport-category',
      type: 'category',
      label: 'Transport Insurance',
      path: ['Products'],
      href: 'products.html',
      sectionId: 'transport-insurance-section',
      keywords: ['cargo', 'marine', 'air', 'road transport', 'goods']
    },
    {
      id: 'technical-industrial-subcategory',
      type: 'subcategory',
      label: 'Technical & Industrial Risks',
      path: ['Products'],
      href: 'products.html',
      sectionId: 'technical-industrial-section',
      keywords: ['technical and industrial', 'engineering', 'construction', 'industrial section']
    },
    {
      id: 'air-cargo',
      type: 'product',
      label: 'Air Cargo Insurance',
      path: ['Products', 'Transport Insurance'],
      href: 'transport-insurance.html',
      keywords: ['air freight', 'cargo', 'goods by air']
    },
    {
      id: 'pleasure-craft',
      type: 'product',
      label: 'Pleasure Craft Insurance',
      path: ['Products', 'Transport Insurance'],
      href: 'transport-insurance.html',
      keywords: ['boat', 'marine leisure', 'vessel']
    },
    {
      id: 'goods-public-transport',
      type: 'product',
      label: 'Goods (Public Transport)',
      path: ['Products', 'Transport Insurance'],
      href: 'transport-insurance.html',
      keywords: ['road goods', 'carrier', 'public transport']
    },
    {
      id: 'technical-risks-category',
      type: 'category',
      label: 'Technical Risks',
      path: ['Products', 'Technical & Industrial Risks'],
      href: 'technical-risks.html',
      keywords: ['engineering insurance', 'construction', 'equipment']
    },
    {
      id: 'contractors-plant-machinery',
      type: 'product',
      label: "Contractors' Plant & Machinery",
      path: ['Products', 'Technical Risks'],
      href: 'technical-risks.html',
      sectionId: 'd-cpm',
      action: { type: 'show', key: 'cpm' },
      keywords: ['cpm', 'construction equipment', 'plant machinery', 'equipment insurance']
    },
    {
      id: 'it-all-risks',
      type: 'product',
      label: 'IT All Risks Insurance',
      path: ['Products', 'Technical Risks'],
      href: 'technical-risks.html',
      sectionId: 'd-it',
      action: { type: 'show', key: 'it' },
      keywords: ['it insurance', 'computer', 'hardware', 'software', 'data']
    },
    {
      id: 'construction-all-risks',
      type: 'product',
      label: 'Construction & Erection All Risks',
      path: ['Products', 'Technical Risks'],
      href: 'technical-risks.html',
      sectionId: 'd-car',
      action: { type: 'show', key: 'car' },
      keywords: ['car ear', 'construction all risks', 'erection all risks', 'project insurance']
    },
    {
      id: 'industrial-risks-category',
      type: 'category',
      label: 'Industrial Risks',
      path: ['Products', 'Technical & Industrial Risks'],
      href: 'industrial-risks.html',
      keywords: ['factory', 'industrial insurance', 'plant', 'heavy risks']
    },
    {
      id: 'machinery-breakdown',
      type: 'product',
      label: 'Machinery Breakdown Insurance',
      path: ['Products', 'Industrial Risks'],
      href: 'industrial-risks.html',
      sectionId: 'd-mb',
      action: { type: 'show', key: 'mb' },
      keywords: ['machine breakdown', 'industrial machinery', 'bris de machines', 'mechanical breakdown']
    },
    {
      id: 'decennial-liability',
      type: 'product',
      label: 'Decennial Civil Liability',
      path: ['Products', 'Industrial Risks'],
      href: 'industrial-risks.html',
      sectionId: 'd-dec',
      action: { type: 'show', key: 'dec' },
      keywords: ['10-year liability', 'construction law', 'decennial', 'rc decennale']
    },
    {
      id: 'rc-pro-contractors',
      type: 'product',
      label: 'RC Pro for Contractors',
      path: ['Products', 'Industrial Risks'],
      href: 'industrial-risks.html',
      sectionId: 'd-rc',
      action: { type: 'show', key: 'rc' },
      keywords: ['professional liability', 'contractor liability', 'builder liability']
    },
    {
      id: 'company-page',
      type: 'page',
      label: 'Company',
      path: ['Pages'],
      href: 'company.html',
      keywords: ['about caar', 'company profile', 'about us']
    },
    {
      id: 'careers-page',
      type: 'page',
      label: 'Careers',
      path: ['Pages', 'Company'],
      href: 'company-careers.html',
      keywords: ['jobs', 'recruitment', 'work with us']
    },
    {
      id: 'network-page',
      type: 'page',
      label: 'Find an Agency',
      path: ['Pages', 'Network'],
      href: 'network.html',
      keywords: ['agency', 'branch', 'location', 'network']
    },
    {
      id: 'contact-page',
      type: 'page',
      label: 'Contact Us',
      path: ['Pages'],
      href: 'contact.html',
      keywords: ['support', 'advisor', 'message', 'contact']
    },
    {
      id: 'news-page',
      type: 'page',
      label: 'News',
      path: ['Pages'],
      href: 'news.html',
      keywords: ['announcements', 'latest news', 'articles']
    },
    {
      id: 'insurance-basics',
      type: 'page',
      label: 'Insurance Basics',
      path: ['Pages', 'News'],
      href: 'article-basics.html',
      keywords: ['basics', 'guide', 'insurance help']
    },
    {
      id: 'business-article',
      type: 'page',
      label: 'Business Insurance Advice',
      path: ['Pages', 'News'],
      href: 'article-business.html',
      keywords: ['business article', 'professional insurance guide']
    },
    {
      id: 'accident-article',
      type: 'page',
      label: 'Accident Claims Article',
      path: ['Pages', 'News'],
      href: 'article-accident.html',
      keywords: ['claims', 'accident guide', 'reporting']
    },
    {
      id: 'online-subscription',
      type: 'page',
      label: 'Online Subscription',
      path: ['Pages'],
      href: 'Online_subscription.html',
      keywords: ['online purchase', 'subscription', 'payment', 'cib']
    }
  ];

  let state = null;

  function normalize(value) {
    return (value || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s&-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      })[char];
    });
  }

  function getTypeLabel(type) {
    return ({
      product: 'Produit',
      category: 'Categorie',
      subcategory: 'Sous-categorie',
      page: 'Page'
    })[type] || 'Resultat';
  }

  function getTypeIcon(type) {
    return ({
      product: 'P',
      category: 'C',
      subcategory: 'S',
      page: 'Pg'
    })[type] || 'R';
  }

  function tokenize(value) {
    return normalize(value).split(' ').filter(Boolean);
  }

  function isSubsequence(query, target) {
    let cursor = 0;
    for (let i = 0; i < target.length && cursor < query.length; i += 1) {
      if (target[i] === query[cursor]) cursor += 1;
    }
    return cursor === query.length;
  }

  function levenshtein(a, b) {
    if (!a) return b.length;
    if (!b) return a.length;
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => new Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
    for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  }

  function scoreItem(item, query) {
    const normalizedQuery = normalize(query);
    if (!normalizedQuery) return -Infinity;

    const label = normalize(item.label);
    const path = normalize(item.path.join(' '));
    const keywords = normalize(item.keywords.join(' '));
    const haystack = [label, path, keywords].join(' ');
    const queryTokens = tokenize(normalizedQuery);

    let score = 0;

    if (label === normalizedQuery) score += 140;
    if (label.startsWith(normalizedQuery)) score += 90;
    if (label.includes(normalizedQuery)) score += 70;
    if (path.includes(normalizedQuery)) score += 30;
    if (keywords.includes(normalizedQuery)) score += 22;
    if (haystack.includes(normalizedQuery)) score += 18;

    queryTokens.forEach(function (token) {
      if (label.includes(token)) score += 16;
      if (path.includes(token)) score += 8;
      if (keywords.includes(token)) score += 6;
    });

    const labelTokens = tokenize(item.label);
    const fuzzyHit = labelTokens.some(function (token) {
      if (token.length < 4 || normalizedQuery.length < 4) return false;
      return levenshtein(normalizedQuery, token) <= 2 || isSubsequence(normalizedQuery, token);
    });

    if (fuzzyHit) score += 20;
    if (!haystack.includes(normalizedQuery) && !fuzzyHit && !isSubsequence(normalizedQuery, haystack)) {
      return -Infinity;
    }

    score -= Math.min(label.length, 40) * 0.08;
    return score;
  }

  function getResults(query) {
    return DATA
      .map(function (item) {
        return { item: item, score: scoreItem(item, query) };
      })
      .filter(function (entry) {
        return entry.score > -Infinity;
      })
      .sort(function (a, b) {
        return b.score - a.score;
      })
      .slice(0, MAX_RESULTS)
      .map(function (entry) {
        return entry.item;
      });
  }

  function highlightMatch(text, query) {
    const cleanQuery = normalize(query);
    if (!cleanQuery) return escapeHtml(text);

    const plainText = String(text);
    const lowerText = normalize(plainText);
    const start = lowerText.indexOf(cleanQuery);

    if (start >= 0) {
      const end = start + cleanQuery.length;
      return [
        escapeHtml(plainText.slice(0, start)),
        '<mark>',
        escapeHtml(plainText.slice(start, end)),
        '</mark>',
        escapeHtml(plainText.slice(end))
      ].join('');
    }

    return escapeHtml(plainText);
  }

  function buildPath(item) {
    return item.path.concat(item.label).join(' -> ');
  }

  function setActiveIndex(nextIndex) {
    state.activeIndex = nextIndex;
    const options = state.resultsContainer.querySelectorAll('.search-result-item');
    options.forEach(function (element, index) {
      const active = index === nextIndex;
      element.classList.toggle('is-active', active);
      element.setAttribute('aria-selected', active ? 'true' : 'false');
      if (active) {
        state.input.setAttribute('aria-activedescendant', element.id);
        element.scrollIntoView({ block: 'nearest' });
      }
    });

    if (nextIndex < 0) {
      state.input.setAttribute('aria-activedescendant', '');
    }
  }

  function openResults() {
    state.resultsContainer.classList.add('visible');
    state.input.setAttribute('aria-expanded', 'true');
  }

  function closeResults() {
    state.resultsContainer.classList.remove('visible');
    state.input.setAttribute('aria-expanded', 'false');
    state.input.setAttribute('aria-activedescendant', '');
    state.activeIndex = -1;
  }

  function renderNoResults(query) {
    state.resultsContainer.innerHTML =
      '<div class="search-no-results">' +
      '<strong>Aucun resultat trouve</strong>' +
      '<span>Aucune correspondance pour "' + escapeHtml(query) + '".</span>' +
      '</div>';
    openResults();
  }

  function renderEmpty() {
    state.resultsContainer.innerHTML =
      '<div class="search-empty-state">Start typing to search products, categories, sub-categories, and pages.</div>';
    openResults();
  }

  function renderResults(results, query) {
    if (!query) {
      renderEmpty();
      return;
    }

    if (!results.length) {
      renderNoResults(query);
      return;
    }

    state.results = results;
    state.activeIndex = -1;

    const html = results.map(function (item, index) {
      return (
        '<button type="button" class="search-result-item" role="option" aria-selected="false" id="search-option-' + index + '" data-index="' + index + '">' +
          '<span class="search-result-item__icon" aria-hidden="true">' + escapeHtml(getTypeIcon(item.type)) + '</span>' +
          '<span class="search-result-item__content">' +
            '<span class="search-result-item__label">' + highlightMatch(item.label, query) + '</span>' +
            '<span class="search-result-item__path">' + highlightMatch(buildPath(item), query) + '</span>' +
          '</span>' +
          '<span class="search-result-item__meta">' + escapeHtml(getTypeLabel(item.type)) + '</span>' +
        '</button>'
      );
    }).join('');

    state.resultsContainer.innerHTML = html + '<div class="search-footer-note">Enter to open the best match, arrows to navigate.</div>';

    state.resultsContainer.querySelectorAll('.search-result-item').forEach(function (button) {
      button.addEventListener('mouseenter', function () {
        setActiveIndex(Number(button.dataset.index));
      });

      button.addEventListener('click', function () {
        const item = state.results[Number(button.dataset.index)];
        navigateTo(item);
      });
    });

    openResults();
  }

  function updateValueState() {
    state.root.classList.toggle('has-value', state.input.value.trim().length > 0);
  }

  function applySearch(query) {
    const cleanQuery = query.trim();
    state.results = cleanQuery ? getResults(cleanQuery) : [];
    renderResults(state.results, cleanQuery);
  }

  function debounceApply(query) {
    window.clearTimeout(state.timer);
    state.timer = window.setTimeout(function () {
      applySearch(query);
    }, DEBOUNCE_MS);
  }

  function openSearchBar() {
    const searchBar = document.getElementById('searchBar');
    if (searchBar && !searchBar.classList.contains('open')) {
      searchBar.classList.add('open');
      searchBar.setAttribute('aria-hidden', 'false');
    }
  }

  function persistTarget(item) {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      href: item.href,
      sectionId: item.sectionId || '',
      action: item.action || null
    }));
  }

  function runStoredAction(payload) {
    if (!payload || !payload.action) return;
    if (payload.action.type === 'show' && typeof window.show === 'function') {
      window.show(payload.action.key, null);
    }
  }

  function scrollToTarget(sectionId) {
    if (!sectionId) return false;
    const target = document.getElementById(sectionId);
    if (!target) return false;

    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    target.classList.add('search-target-flash');
    window.setTimeout(function () {
      target.classList.remove('search-target-flash');
    }, 1800);
    return true;
  }

  function navigateTo(item) {
    if (!item) return;

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const samePage = currentPage === item.href;

    persistTarget(item);
    closeResults();
    openSearchBar();

    if (samePage) {
      runStoredAction({ action: item.action });
      scrollToTarget(item.sectionId);
      state.input.value = item.label;
      updateValueState();
      return;
    }

    window.location.href = item.href + (item.sectionId ? '#' + item.sectionId : '');
  }

  function executeClassicSearch() {
    const query = state.input.value.trim();
    if (!query) {
      closeResults();
      return;
    }

    const results = getResults(query);
    if (!results.length) {
      renderNoResults(query);
      return;
    }

    navigateTo(results[0]);
  }

  function onInput() {
    updateValueState();
    openSearchBar();

    const query = state.input.value.trim();
    if (!query) {
      state.results = [];
      renderEmpty();
      return;
    }

    debounceApply(query);
  }

  function onKeyDown(event) {
    const hasResults = state.results.length > 0;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!hasResults) return;
      const next = state.activeIndex >= state.results.length - 1 ? 0 : state.activeIndex + 1;
      setActiveIndex(next);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!hasResults) return;
      const next = state.activeIndex <= 0 ? state.results.length - 1 : state.activeIndex - 1;
      setActiveIndex(next);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      if (state.activeIndex >= 0 && state.results[state.activeIndex]) {
        navigateTo(state.results[state.activeIndex]);
        return;
      }

      executeClassicSearch();
      return;
    }

    if (event.key === 'Escape') {
      closeResults();
    }
  }

  function clearSearch() {
    state.input.value = '';
    state.results = [];
    updateValueState();
    renderEmpty();
    state.input.focus();
  }

  function bindEvents() {
    state.input.addEventListener('focus', function () {
      renderResults(state.results, state.input.value.trim());
    });

    state.input.addEventListener('input', onInput);
    state.input.addEventListener('keydown', onKeyDown);

    state.clearButton.addEventListener('click', clearSearch);

    document.addEventListener('click', function (event) {
      if (!state.root.contains(event.target)) {
        closeResults();
      }
    });
  }

  function consumeStoredTarget() {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    let payload = null;
    try {
      payload = JSON.parse(raw);
    } catch (error) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    if (!payload || payload.href !== currentPage) return;

    sessionStorage.removeItem(STORAGE_KEY);

    window.setTimeout(function () {
      runStoredAction(payload);
      scrollToTarget(payload.sectionId);
    }, 180);
  }

  function injectFlashStyle() {
    if (document.getElementById('smart-search-flash-style')) return;
    const style = document.createElement('style');
    style.id = 'smart-search-flash-style';
    style.textContent =
      '@keyframes searchFlash{0%{box-shadow:0 0 0 0 rgba(232,118,30,0.45);}100%{box-shadow:0 0 0 18px rgba(232,118,30,0);}}' +
      '.search-target-flash{animation:searchFlash 1.2s ease-out 1;border-radius:18px;}';
    document.head.appendChild(style);
  }

  function init() {
    const root = document.getElementById('smartSearch');
    const input = document.getElementById('searchInput');
    const resultsContainer = document.getElementById('searchResults');
    const clearButton = document.getElementById('searchClearBtn');

    if (!root || !input || !resultsContainer || !clearButton) return;
    if (root.dataset.searchReady === 'true') return;

    root.dataset.searchReady = 'true';

    state = {
      root: root,
      input: input,
      resultsContainer: resultsContainer,
      clearButton: clearButton,
      results: [],
      activeIndex: -1,
      timer: null
    };

    injectFlashStyle();
    renderEmpty();
    updateValueState();
    bindEvents();
    consumeStoredTarget();
  }

  window.CAARSmartSearch = {
    init: init,
    DATA: DATA
  };
})();
