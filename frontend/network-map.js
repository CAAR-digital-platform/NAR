/**
 * network-map.js
 *
 * Extracted from main.js for clarity.
 * Include AFTER leaflet.min.js on network.html:
 *   <script src="network-map.js"></script>
 *
 * What changed vs the old embedded version:
 *  1. Wilaya and city dropdowns are loaded from /api/agencies/wilayas
 *     and /api/agencies/cities/:id — never hardcoded.
 *  2. Filtering now calls /api/agencies/filter?... so the SQL does
 *     the filtering correctly (no more JS string comparison bugs).
 *  3. Nearest agency calls /api/agencies/nearest?lat=&lng= — the
 *     Haversine SQL on the server is both correct and fast.
 *  4. Services array on each agency is already split by the API.
 *  5. The sidebar list and map markers stay in sync via a single
 *     renderAgencies() function that is the only writer.
 */

const BASE_API = 'http://localhost:3000/api';

document.addEventListener('DOMContentLoaded', function () {
  if (!document.getElementById('filterMap')) return;

  // ── State ──────────────────────────────────────────────────────────────────
  let AGENCIES       = [];   // currently rendered set
  let ALL_AGENCIES   = [];   // full unfiltered set (cached on first load)
  let heroMap        = null;
  let filterMap      = null;
  const markerMap    = {};   // agencyId → Leaflet marker
  let activeFilters  = { wilaya_id: '', city_id: '', type: '', service: '', search: '' };

  // ── Icons ──────────────────────────────────────────────────────────────────
  function makeIcon(active) {
    const fill = active ? '#C9601A' : '#E8761E';
    const w = active ? 32 : 26, h = active ? 42 : 34, cx = w / 2;
    return L.divIcon({
      className: '',
      html: `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
        <path d="M${cx} 0C${cx*.45} 0 0 ${cx*.45} 0 ${cx}C0 ${cx*1.75} ${cx} ${h} ${cx} ${h}
                 S${w} ${cx*1.75} ${w} ${cx}C${w} ${cx*.45} ${cx*1.55} 0 ${cx} 0Z"
              fill="${fill}"/>
        <circle cx="${cx}" cy="${cx}" r="${w*.3}" fill="white"/>
        <text x="${cx}" y="${cx + w*.14}" text-anchor="middle"
              font-size="${w*.28}" font-weight="800" fill="${fill}"
              font-family="DM Sans,sans-serif">C</text>
      </svg>`,
      iconSize: [w, h],
      iconAnchor: [cx, h],
      popupAnchor: [0, -(h + 4)],
    });
  }

  // ── Popup HTML ─────────────────────────────────────────────────────────────
  function makePopup(ag) {
    const services = Array.isArray(ag.services)
      ? ag.services.join(' · ')
      : (ag.services || '');
    return `
      <div class="popup-head">
        <div class="popup-head-code">${ag.type} · ${ag.wilaya}</div>
        <div class="popup-head-name">CAAR — ${ag.city}</div>
      </div>
      <div class="popup-body">
        ${ag.address ? `<div class="popup-addr">${ag.address}</div>` : ''}
        ${ag.phone   ? `<div class="popup-ph">📞 ${ag.phone}</div>` : ''}
        ${services   ? `<div class="popup-addr" style="font-size:0.65rem;color:#888">${services}</div>` : ''}
        <div class="popup-actions">
          <button class="popup-btn pbtn-dir"
            onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${ag.latitude},${ag.longitude}','_blank')">
            🧭 Directions
          </button>
          ${ag.phone ? `<a class="popup-btn pbtn-call" href="tel:${ag.phone}">📞 Call</a>` : ''}
        </div>
      </div>`;
  }

  // ── Render both list and map markers ──────────────────────────────────────
  function renderAgencies(list) {
    AGENCIES = list;

    const container = document.getElementById('filterCardList');
    const noRes     = document.getElementById('filterNoResults');
    const countEl   = document.getElementById('filterCountNum');

    if (countEl) countEl.textContent = list.length;

    // Show/hide "no results"
    if (noRes) noRes.classList.toggle('show', list.length === 0);

    // ── Sidebar cards ────────────────────────────────────────────────────────
    if (container) {
      const visSet = new Set(list.map(a => a.id));

      container.innerHTML = list.map(ag => `
        <div class="filter-card" data-id="${ag.id}">
          <div class="fc-header">
            <div class="fc-name">CAAR — ${ag.city}</div>
            <div class="fc-code">${ag.agency_code}</div>
          </div>
          <div class="fc-wilaya">${ag.city}, ${ag.wilaya}</div>
          ${ag.phone ? `<div class="fc-phone"><span class="fc-phone-icon">📞</span>${ag.phone}</div>` : ''}
          <div class="fc-services">
            ${(Array.isArray(ag.services) ? ag.services : []).map(s =>
              `<span class="fc-service-tag">${s}</span>`
            ).join('')}
          </div>
          <div class="fc-btns">
            <button class="fc-btn fc-btn-map">View on map</button>
            <button class="fc-btn fc-btn-dir">Directions</button>
          </div>
        </div>`
      ).join('');

      // Attach events
      container.querySelectorAll('.filter-card').forEach(card => {
        const id = parseInt(card.getAttribute('data-id'), 10);
        card.addEventListener('click', () => flyTo(id));
        card.querySelector('.fc-btn-map')?.addEventListener('click', e => {
          e.stopPropagation(); flyTo(id);
        });
        card.querySelector('.fc-btn-dir')?.addEventListener('click', e => {
          e.stopPropagation();
          const ag = ALL_AGENCIES.find(a => a.id === id);
          if (ag) window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${ag.latitude},${ag.longitude}`,
            '_blank'
          );
        });
      });

      // ── Sync map markers ────────────────────────────────────────────────────
      if (filterMap) {
        Object.entries(markerMap).forEach(([mid, marker]) => {
          if (visSet.has(parseInt(mid, 10))) {
            if (!filterMap.hasLayer(marker)) marker.addTo(filterMap);
          } else {
            if (filterMap.hasLayer(marker)) filterMap.removeLayer(marker);
          }
        });
      }
    }
  }

  // ── Fly to + highlight ────────────────────────────────────────────────────
  function flyTo(id) {
    const ag = ALL_AGENCIES.find(a => a.id === id);
    if (!ag || !filterMap) return;

    filterMap.flyTo([ag.latitude, ag.longitude], 15, { animate: true, duration: 1.2 });

    Object.entries(markerMap).forEach(([mid, m]) => m.setIcon(makeIcon(false)));
    const m = markerMap[id];
    if (m) {
      m.setIcon(makeIcon(true));
      setTimeout(() => m.openPopup(), 1200);
    }

    document.querySelectorAll('.filter-card').forEach(c => c.classList.remove('active'));
    const card = document.querySelector(`.filter-card[data-id="${id}"]`);
    if (card) {
      card.classList.add('active');
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
  window.caarFlyTo = flyTo;

  // ── Build filter maps after load ─────────────────────────────────────────
  function initMaps() {
    if (typeof L === 'undefined') { setTimeout(initMaps, 300); return; }

    // Hero mini-map
    const heroEl = document.getElementById('heroMap');
    if (heroEl) {
      heroMap = L.map('heroMap', { center: [28.0339, 1.6596], zoom: 5,
        scrollWheelZoom: false, attributionControl: false });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
       .addTo(heroMap);
      const dot = L.divIcon({
        className: '',
        html: '<svg width="10" height="10"><circle cx="5" cy="5" r="4.5" fill="#E8761E" stroke="white" stroke-width="1"/></svg>',
        iconSize: [10, 10], iconAnchor: [5, 5],
      });
      ALL_AGENCIES.forEach(ag =>
        L.marker([ag.latitude, ag.longitude], { icon: dot }).addTo(heroMap)
          .bindPopup(`<strong>${ag.city}</strong><br><small>${ag.wilaya}</small>`)
      );
      setTimeout(() => heroMap.invalidateSize(), 200);
    }

    // Main filter map
    const filterEl = document.getElementById('filterMap');
    if (filterEl) {
      filterMap = L.map('filterMap', { center: [28.0339, 1.6596], zoom: 5,
        scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19, attribution: '© OpenStreetMap',
      }).addTo(filterMap);

      ALL_AGENCIES.forEach(ag => {
        const marker = L.marker([ag.latitude, ag.longitude], { icon: makeIcon(false) })
          .addTo(filterMap);
        marker.bindPopup(makePopup(ag), { maxWidth: 260, minWidth: 250 });
        marker.on('click', () => {
          Object.values(markerMap).forEach(m => m.setIcon(makeIcon(false)));
          marker.setIcon(makeIcon(true));
          const card = document.querySelector(`.filter-card[data-id="${ag.id}"]`);
          if (card) {
            card.classList.add('active');
            card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
        markerMap[ag.id] = marker;
      });

      setTimeout(() => filterMap.invalidateSize(), 200);
    }

    renderAgencies(ALL_AGENCIES);
  }

  // ── Load wilayas for dropdown ─────────────────────────────────────────────
  async function loadWilayas() {
    try {
      const res      = await fetch(`${BASE_API}/agencies/wilayas`);
      const wilayas  = await res.json();
      const menuEl   = document.getElementById('fdm-wilaya');
      if (!menuEl) return;

      menuEl.innerHTML = `
        <div class="fd-item active" onclick="applyFilter('wilaya_id','',this,'Wilaya')">All Wilayas</div>
        ${wilayas
          .filter(w => w.agency_count > 0)
          .map(w => `
            <div class="fd-item"
              onclick="applyFilter('wilaya_id','${w.id}',this,'${w.name}');loadCities(${w.id})">
              ${w.name} (${w.agency_count})
            </div>`)
          .join('')}`;
    } catch (err) {
      console.error('[Network] loadWilayas:', err.message);
    }
  }

  // ── Load cities for a wilaya ──────────────────────────────────────────────
  window.loadCities = async function (wilayaId) {
    const menuEl = document.getElementById('fdm-city');
    if (!menuEl) return;
    try {
      const res    = await fetch(`${BASE_API}/agencies/cities/${wilayaId}`);
      const cities = await res.json();
      menuEl.innerHTML = `
        <div class="fd-item active" onclick="applyFilter('city_id','',this,'City')">All Cities</div>
        ${cities
          .filter(c => c.agency_count > 0)
          .map(c => `
            <div class="fd-item"
              onclick="applyFilter('city_id','${c.id}',this,'${c.name}')">
              ${c.name} (${c.agency_count})
            </div>`)
          .join('')}`;
    } catch {
      // non-fatal
    }
  };

  // ── Apply filter — calls the API ──────────────────────────────────────────
  window.applyFilter = async function (key, value, el, labelText) {
    activeFilters[key] = value;

    // Reset city when wilaya changes
    if (key === 'wilaya_id') activeFilters.city_id = '';

    const labelEl = document.getElementById(`fdlbl-${key}`);
    if (labelEl) labelEl.textContent = labelText || key;

    // Mark active item
    const menu = document.getElementById(`fdm-${key}`);
    if (menu) menu.querySelectorAll('.fd-item').forEach(i => i.classList.remove('active'));
    if (el) el.classList.add('active');

    // Close dropdown
    const drop = document.getElementById(`fd-${key}`);
    if (drop) drop.classList.remove('open');

    await fetchFiltered();
  };

  async function fetchFiltered() {
    const params = new URLSearchParams();
    if (activeFilters.wilaya_id) params.set('wilaya_id', activeFilters.wilaya_id);
    if (activeFilters.city_id)   params.set('city_id',   activeFilters.city_id);
    if (activeFilters.type)      params.set('type',       activeFilters.type);
    if (activeFilters.service)   params.set('service',    activeFilters.service);

    try {
      const url  = `${BASE_API}/agencies/filter?${params}`;
      const res  = await fetch(url);
      let   list = await res.json();

      // Apply client-side search (name/city/wilaya text search)
      if (activeFilters.search) {
        const q = normalize(activeFilters.search);
        list = list.filter(ag =>
          normalize(ag.name).includes(q) ||
          normalize(ag.city).includes(q) ||
          normalize(ag.wilaya).includes(q)
        );
      }

      renderAgencies(list);
    } catch (err) {
      console.error('[Network] fetchFiltered:', err.message);
    }
  }

  function normalize(str) {
    return (str || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  // ── Type / service filters (client-side selectors in HTML use these) ──────
  window.setFilter = function (key, val, el) {
    applyFilter(key, val, el, val || (key.charAt(0).toUpperCase() + key.slice(1)));
  };

  // ── Name search ───────────────────────────────────────────────────────────
  window.setSearchFilter = function (val) {
    activeFilters.search = val ? normalize(val) : '';
    const clrBtn = document.getElementById('fdSearchClear');
    if (clrBtn) clrBtn.style.display = activeFilters.search ? 'block' : 'none';
    fetchFiltered();
  };

  window.clearNameSearch = function () {
    const inp = document.getElementById('fdSearchInput');
    if (inp) inp.value = '';
    activeFilters.search = '';
    const clrBtn = document.getElementById('fdSearchClear');
    if (clrBtn) clrBtn.style.display = 'none';
    fetchFiltered();
  };

  // ── Reset all ─────────────────────────────────────────────────────────────
  window.resetFilters = function () {
    activeFilters = { wilaya_id: '', city_id: '', type: '', service: '', search: '' };

    const inp = document.getElementById('fdSearchInput');
    if (inp) inp.value = '';

    ['wilaya', 'city', 'type', 'service'].forEach(k => {
      const lbl = document.getElementById(`fdlbl-${k}`);
      if (lbl) lbl.textContent = k.charAt(0).toUpperCase() + k.slice(1);
      const drop = document.getElementById(`fd-${k}`);
      if (drop) drop.classList.remove('open');
    });

    renderAgencies(ALL_AGENCIES);
    if (filterMap) filterMap.flyTo([28.0339, 1.6596], 5, { animate: true, duration: 1 });
    Object.values(markerMap).forEach(m => m.setIcon(makeIcon(false)));
  };

  // ── Dropdown toggle ───────────────────────────────────────────────────────
  window.toggleDrop = function (id) {
    ['fd-wilaya', 'fd-city', 'fd-type', 'fd-service'].forEach(d => {
      const el = document.getElementById(d);
      if (el && d !== id) el.classList.remove('open');
    });
    const t = document.getElementById(id);
    if (t) t.classList.toggle('open');
  };

  document.addEventListener('click', e => {
    if (!e.target.closest('.filter-dropdown') && !e.target.closest('.fd-search-wrap')) {
      ['fd-wilaya', 'fd-city', 'fd-type', 'fd-service'].forEach(d => {
        document.getElementById(d)?.classList.remove('open');
      });
    }
  });

  // ── Hero search autocomplete ───────────────────────────────────────────────
  let autoItems = [];

  window.onSearchInput = function (val) {
    const clrBtn = document.getElementById('sClear');
    if (clrBtn) clrBtn.classList.toggle('vis', val.length > 0);

    const q = normalize(val);
    if (q.length < 2) { closeAuto(); return; }

    autoItems = ALL_AGENCIES.filter(ag =>
      normalize(ag.city).includes(q) ||
      normalize(ag.wilaya).includes(q) ||
      normalize(ag.name).includes(q)
    ).slice(0, 6);

    renderAuto(autoItems);
  };

  window.onSearchKey  = e => { if (e.key === 'Escape') closeAuto(); };
  window.clearSearch  = function () {
    const inp = document.getElementById('mapSearch');
    if (inp) inp.value = '';
    document.getElementById('sClear')?.classList.remove('vis');
    closeAuto();
    heroMap?.flyTo([28.0339, 1.6596], 5, { animate: true, duration: 1.5 });
  };

  function renderAuto(items) {
    const list = document.getElementById('autoList');
    if (!list) return;
    if (!items.length) { list.classList.remove('open'); return; }

    list.innerHTML = items.map((it, i) => `
      <div class="auto-item" data-index="${i}">
        <span class="auto-ico">📍</span>
        <div>
          <div class="auto-name">${it.city}</div>
          <div class="auto-sub">${it.wilaya}</div>
        </div>
      </div>`).join('');

    list.classList.add('open');
    list.querySelectorAll('.auto-item').forEach(el => {
      el.addEventListener('click', function () {
        const it = autoItems[parseInt(this.getAttribute('data-index'), 10)];
        if (!it || !heroMap) return;
        const inp = document.getElementById('mapSearch');
        if (inp) inp.value = it.city;
        closeAuto();
        heroMap.flyTo([it.latitude, it.longitude], 14, { animate: true, duration: 1.5 });
      });
    });
  }

  function closeAuto() {
    const list = document.getElementById('autoList');
    if (list) { list.classList.remove('open'); list.innerHTML = ''; }
  }

  document.addEventListener('click', e => { if (!e.target.closest('.search-wrap')) closeAuto(); });

  // ── Use my location → nearest agency via API ──────────────────────────────
  window.useMyLocation = function () {
    if (!navigator.geolocation) { alert('Geolocation not supported.'); return; }

    const btn = document.getElementById('locateBtn');
    const lbl = btn?.querySelector('span');
    if (btn) { btn.classList.add('loading'); if (lbl) lbl.textContent = 'Locating…'; }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        if (btn) { btn.classList.remove('loading'); if (lbl) lbl.textContent = 'Use my location'; }

        try {
          const res = await fetch(`${BASE_API}/agencies/nearest?lat=${lat}&lng=${lng}`);
          if (!res.ok) throw new Error('Not found');
          const nearest = await res.json();

          document.getElementById('filterSection')?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => flyTo(nearest.id), 600);
        } catch {
          alert('Could not find a nearby agency.');
        }
      },
      () => {
        if (btn) { btn.classList.remove('loading'); if (lbl) lbl.textContent = 'Use my location'; }
        alert('Could not get your location.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Focus HQ from ?focus=hq ───────────────────────────────────────────────
  window.dismissFocusBanner = function () {
    document.getElementById('focusBanner')?.classList.remove('show');
  };

  if (window.location.search.includes('focus=hq')) {
    const hq = ALL_AGENCIES.find(a => a.type === 'Headquarters');
    if (hq) {
      document.getElementById('focusBanner')?.classList.add('show');
      setTimeout(() => flyTo(hq.id), 600);
    }
  }

  // ── Bootstrap: load agencies + geography + init maps ─────────────────────
  (async function bootstrap() {
    try {
      const res  = await fetch(`${BASE_API}/agencies`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      ALL_AGENCIES = await res.json();
    } catch (err) {
      console.error('[Network] Failed to load agencies:', err.message);
      ALL_AGENCIES = [];
    }

    await loadWilayas();
    initMaps();
  })();
});