// CAAR Search Autocomplete Module
const CAARSearch = (() => {
  let searchIndex = [];
  let recentSearches = [];
  let selectedIndex = -1;
  let searchTimer = null;
  const MAX_RESULTS = 8;
  const MAX_RECENT = 5;
  const DEBOUNCE_MS = 300;

  function buildSearchIndex() {
    searchIndex = [
      { type: "product", title: "Individual Risks Insurance", href: "individual-risks.html", keywords: "risks individual personal" },
      { type: "product", title: "Auto Insurance", href: "auto-insurance.html", keywords: "auto car vehicle" },
      { type: "product", title: "Transport Insurance", href: "transport-insurance.html", keywords: "transport shipping" },
      { type: "product", title: "Technical Risks", href: "technical-risks.html", keywords: "technical engineering" },
      { type: "product", title: "Industrial Risks", href: "industrial-risks.html", keywords: "industrial factory" },
      { type: "product", title: "Habitation Insurance", href: "Online_subscription.html", keywords: "habitation home" },
      { type: "product", title: "CAT NAT Subscription", href: "catnat-subscription.html", keywords: "catnat natural" },
      { type: "product", title: "Roadside Assistance", href: "roads.html", keywords: "roads assistance" },
      { type: "service", title: "Find Agency", href: "network.html", keywords: "find agency network" },
      { type: "service", title: "Contact Us", href: "contact.html", keywords: "contact support" },
      { type: "company", title: "About Us", href: "company.html", keywords: "about company" },
      { type: "company", title: "Careers", href: "company-careers.html", keywords: "careers jobs" },
      { type: "article", title: "Accident Claims", href: "article-accident.html", keywords: "accident claims" },
      { type: "article", title: "Insurance Basics", href: "article-basics.html", keywords: "basics guide" },
      { type: "page", title: "Home", href: "index.html", keywords: "home main" },
      { type: "page", title: "Products", href: "products.html", keywords: "products services" },
      { type: "page", title: "News", href: "news.html", keywords: "news updates" }
    ];
  }

  function normalize(str) {
    return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  }

  function performSearch(query) {
    if (!query || query.length < 2) return [];
    const normalized = normalize(query);
    return searchIndex.filter(item => normalize(item.title).includes(normalized) || normalize(item.keywords).includes(normalized)).slice(0, MAX_RESULTS);
  }

  function renderResults(results, query) {
    const container = document.getElementById("searchResults");
    if (!container) return;
    if (results.length === 0) {
      container.innerHTML = '<div class="search-no-results"><span>🔍</span><div><strong>No results</strong></div></div>';
      container.classList.add("visible");
      return;
    }
    const html = results.map((item, idx) => `<div class="search-result-item" role="option" data-index="${idx}"><span class="result-icon">${item.type==="product"?"📦":item.type==="service"?"🔧":item.type==="company"?"🏢":"📰"}</span><div class="result-content"><div class="result-title">${item.title}</div><small class="result-type">${item.type}</small></div></div>`).join("");
    container.innerHTML = html;
    container.classList.add("visible");
    container.querySelectorAll(".search-result-item").forEach((el, idx) => {
      el.addEventListener("click", () => { window.location.href = results[idx].href; });
    });
  }

  function init() {
    buildSearchIndex();
    const input = document.getElementById("searchInput");
    const container = document.getElementById("searchResults");
    if (!input || !container) return;
    input.addEventListener("input", (e) => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        const results = performSearch(e.target.value);
        renderResults(results, e.target.value);
      }, DEBOUNCE_MS);
    });
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") container.classList.remove("visible");
    });
    document.addEventListener("click", (e) => {
      if (!document.getElementById("searchBar")?.contains(e.target)) {
        container.classList.remove("visible");
      }
    });
  }

  return { init };
})();

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => CAARSearch.init());
} else {
  CAARSearch.init();
}
