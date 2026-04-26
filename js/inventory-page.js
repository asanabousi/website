/* ================================================
   UNFAZED MOTORS — Inventory Page
   Fetches all inventory, handles filters/search/sort.
   ================================================ */

const INV_CONFIG = {
  baseId: 'appdRYnYsp57lvv6T',
  token: 'REMOVED_AIRTABLE_TOKEN',
  table: 'Inventory'
};

(function () {
  const grid = document.getElementById('invGrid');
  const resultCount = document.getElementById('resultCount');
  const searchInput = document.getElementById('invSearch');
  const sortSelect = document.getElementById('invSort');
  const catChips = document.querySelectorAll('.cat-chip');
  const sidebarMakes = document.getElementById('sidebarMakes');
  const clearBtn = document.getElementById('clearFilters');
  if (!grid) return;

  let allRecords = [];
  let activeCat = 'all';
  let activeSearch = '';
  let activeSort = 'newest';
  let activeMakes = new Set();
  // ---- New filter state (additive) ----
  let activeBodyTypes = new Set();
  let activeModels = new Set();
  let yearMin = null, yearMax = null;
  let kmMax = null;

  // ---- Utilities ----
  function fmt(n) { return n ? '$' + Math.round(Number(n)).toLocaleString('en-CA') : 'Contact Us'; }
  function fmtNum(n) { return n ? Number(n).toLocaleString('en-CA') : '—'; }
  function badgeClass(badge) {
    const map = { 'NEW': 'badge-new', 'Featured': 'badge-featured', 'Reduced': 'badge-reduced', 'Just Arrived': 'badge-featured' };
    return map[badge] || '';
  }
  function statusClass(status) {
    const map = { 'In Stock': 'in-stock', 'Reserved': 'reserved', 'Sold': 'sold', 'Pending': 'pending', 'Hold': 'reserved' };
    return map[status] || 'in-stock';
  }

  function placeholderSvg() {
    return `<svg class="placeholder-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="bgi" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#e8e8e8"/><stop offset="100%" stop-color="#6a6a6a"/></linearGradient>
    <linearGradient id="bti" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#000"/></linearGradient>
  </defs>
  <ellipse cx="400" cy="355" rx="320" ry="18" fill="#000" opacity="0.6"/>
  <ellipse cx="400" cy="355" rx="260" ry="10" fill="#ff2d2d" opacity="0.12"/>
  <circle cx="610" cy="300" r="70" fill="url(#bti)"/><circle cx="610" cy="300" r="55" fill="none" stroke="#111" stroke-width="2"/>
  <circle cx="610" cy="300" r="34" fill="#1a1a1a"/><circle cx="610" cy="300" r="18" fill="#333"/>
  <circle cx="190" cy="300" r="70" fill="url(#bti)"/><circle cx="190" cy="300" r="55" fill="none" stroke="#111" stroke-width="2"/>
  <circle cx="190" cy="300" r="34" fill="#1a1a1a"/><circle cx="190" cy="300" r="18" fill="#333"/>
  <circle cx="190" cy="300" r="30" fill="none" stroke="#555" stroke-width="1.2" stroke-dasharray="2,3"/>
  <path d="M 420 270 L 605 305 L 600 320 L 420 290 Z" fill="#2b2b2b"/>
  <path d="M 240 220 Q 270 160 340 150 L 480 145 Q 540 148 570 200 L 590 270 Q 560 290 480 290 L 340 290 Q 260 285 240 260 Z" fill="url(#bgi)"/>
  <path d="M 330 165 Q 380 140 460 145 Q 500 150 510 180 L 500 220 L 340 220 Q 320 200 330 165 Z" fill="#d4d4d4"/>
  <path d="M 500 195 L 580 200 Q 600 200 595 215 L 560 240 L 500 235 Z" fill="#111"/>
  <path d="M 350 200 L 480 200 L 475 210 L 350 210 Z" fill="#ff2d2d" opacity="0.85"/>
  <text x="415" y="208" text-anchor="middle" fill="#fff" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="2">UNFAZED</text>
</svg>`;
  }

  function renderCard(rec) {
    const f = rec.fields || {};
    const stock = f['Stock Number'] || rec.id;
    const thumb = f['Photos'] && f['Photos'][0] ? f['Photos'][0].thumbnails?.large?.url || f['Photos'][0].url : null;
    const badge = f['Badge'];
    const status = f['Status'] || 'In Stock';
    const cat = f['Category'] || '';
    const year = f['Year'] || '';
    const make = f['Make'] || '';
    const model = f['Model'] || '';
    const cc = f['Engine (cc)'];
    const hp = f['Horsepower'];
    const km = f['Mileage (km)'];
    const price = f['Price (CAD)'];
    const isSold = status === 'Sold';

    return `<article class="card ${isSold ? 'card-status-sold' : ''}" data-stock="${stock}">
  <a href="vehicle.html?stock=${encodeURIComponent(stock)}">
    <div class="card-media">
    ${thumb ? `<img src="${thumb}" alt="${year} ${make} ${model}" loading="lazy">` : `<img src="assets/coming-soon.png" alt="Photos coming soon" loading="lazy">`}
      ${badge ? `<span class="card-badge ${badgeClass(badge)}">${badge}</span>` : ''}
      <span class="status-pill ${statusClass(status)}">${status}</span>
    </div>
    <div class="card-body">
      <div class="card-top"><span>${year} · ${cat}</span><span>${make.toUpperCase()}</span></div>
      <h3>${make} ${model}</h3>
      <div class="card-meta">
        ${cc ? `<span>${fmtNum(cc)}cc</span>` : ''}
        ${hp ? `<span>${fmtNum(hp)} HP</span>` : ''}
        ${km ? `<span>${fmtNum(km)} km</span>` : ''}
      </div>
      <div class="card-foot">
        <div class="card-price">${fmt(price)}<small>CAD · OR FINANCE</small></div>
        <span class="card-cta">↗</span>
      </div>
    </div>
  </a>
</article>`;
  }

  // ---- Filter + render ----
  function applyFilters() {
    let records = [...allRecords];

    // Category chip
    if (activeCat !== 'all') {
      records = records.filter(r => (r.fields['Category'] || '').toLowerCase() === activeCat.toLowerCase());
    }

    // Make checkboxes
    if (activeMakes.size > 0) {
      records = records.filter(r => activeMakes.has((r.fields['Make'] || '').toLowerCase()));
    }

    // Body Type (sidebar checkboxes)
    if (activeBodyTypes.size > 0) {
      records = records.filter(r => activeBodyTypes.has((r.fields['Category'] || '').toLowerCase()));
    }

    // Model (sidebar checkboxes)
    if (activeModels.size > 0) {
      records = records.filter(r => activeModels.has((r.fields['Model'] || '').toLowerCase()));
    }

    // Year range
    if (yearMin != null) {
      records = records.filter(r => Number(r.fields['Year'] || 0) >= yearMin);
    }
    if (yearMax != null) {
      records = records.filter(r => Number(r.fields['Year'] || 0) <= yearMax);
    }

    // Odometer max
    if (kmMax != null) {
      records = records.filter(r => Number(r.fields['Mileage (km)'] || 0) <= kmMax);
    }

    // Search
    if (activeSearch) {
      const q = activeSearch.toLowerCase();
      records = records.filter(r => {
        const f = r.fields;
        return [f['Make'], f['Model'], f['Category'], f['Year'], f['Color'], f['Stock Number']]
          .join(' ').toLowerCase().includes(q);
      });
    }

    // Sort
    records.sort((a, b) => {
      const fa = a.fields, fb = b.fields;
      switch (activeSort) {
        case 'price-asc':  return (fa['Price (CAD)'] || 0) - (fb['Price (CAD)'] || 0);
        case 'price-desc': return (fb['Price (CAD)'] || 0) - (fa['Price (CAD)'] || 0);
        case 'year-desc':  return (fb['Year'] || 0) - (fa['Year'] || 0);
        case 'year-asc':   return (fa['Year'] || 0) - (fb['Year'] || 0);
        case 'km-asc':     return (fa['Mileage (km)'] || 0) - (fb['Mileage (km)'] || 0);
        default:           return 0; // newest = Airtable order
      }
    });

    if (resultCount) resultCount.textContent = `${records.length} vehicle${records.length !== 1 ? 's' : ''}`;
    const tc = document.getElementById('totalCount');
    if (tc) tc.textContent = records.length;

    if (!records.length) {
      grid.innerHTML = `<div class="inv-no-results"><h3>Nothing here.</h3><p style="margin-top:8px">Try adjusting your filters or <button class="sidebar-clear" id="noResultClear" style="display:inline">clear all filters</button>.</p></div>`;
      document.getElementById('noResultClear')?.addEventListener('click', resetFilters);
      return;
    }

    grid.innerHTML = records.map(r => renderCard(r)).join('');
  }

  function resetFilters() {
    activeCat = 'all';
    activeMakes.clear();
    activeBodyTypes.clear();
    activeModels.clear();
    yearMin = null; yearMax = null;
    kmMax = null;
    activeSearch = '';
    activeSort = 'newest';
    if (searchInput) searchInput.value = '';
    if (sortSelect) sortSelect.value = 'newest';
    catChips.forEach(c => c.classList.toggle('active', c.dataset.cat === 'all'));
    document.querySelectorAll('.sidebar-makes input[type="checkbox"]').forEach(cb => cb.checked = false);
    ['yearMin', 'yearMax', 'kmMax'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    if (typeof updateMakesCount === 'function') updateMakesCount();
    updateAllCounts();
    buildModelSidebar();
    applyFilters();
  }
  if (clearBtn) clearBtn.addEventListener('click', resetFilters);

  // ---- Build sidebar makes ----
  function buildMakeSidebar() {
    if (!sidebarMakes) return;
    const section = sidebarMakes.closest('.sidebar-section');
    const counts = {};
    allRecords.forEach(r => {
      const make = r.fields['Make'];
      if (make) counts[make] = (counts[make] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (!sorted.length) {
      if (section) section.classList.add('hidden');
      return;
    }
    if (section) section.classList.remove('hidden');
    sidebarMakes.innerHTML = sorted.map(([make, count]) => `
      <label class="sidebar-make-item">
        <input type="checkbox" value="${make.toLowerCase()}" ${activeMakes.has(make.toLowerCase()) ? 'checked' : ''}>
        <span>${make}</span>
        <span class="make-count">${count}</span>
      </label>
    `).join('');
    sidebarMakes.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) activeMakes.add(cb.value);
        else activeMakes.delete(cb.value);
        updateMakesCount();
        applyFilters();
      });
    });
    updateMakesCount();
  }

  // ---- Update the small count badge next to "Make" ----
  function updateMakesCount() {
    const countEl = document.getElementById('makesCount');
    if (!countEl) return;
    countEl.textContent = activeMakes.size > 0 ? `(${activeMakes.size})` : '';
  }

  // ---- Collapsible Make section ----
  const makesToggle = document.getElementById('makesToggle');
  if (makesToggle && sidebarMakes) {
    makesToggle.addEventListener('click', () => {
      const isCollapsed = sidebarMakes.classList.toggle('collapsed');
      makesToggle.setAttribute('aria-expanded', String(!isCollapsed));
    });
  }

  // ============================================================
  // NEW FILTERS (additive — Body Type, Model, Year, Odometer)
  // ============================================================

  // ---- Build Body Type sidebar ----
  function buildBodyTypeSidebar() {
    const container = document.getElementById('sidebarBodyType');
    if (!container) return;
    const section = container.closest('.sidebar-section');
    const counts = {};
    allRecords.forEach(r => {
      const v = r.fields['Category'];
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    if (!sorted.length) {
      // Hide whole section if no categories exist in data
      if (section) section.classList.add('hidden');
      return;
    }
    if (section) section.classList.remove('hidden');
    container.innerHTML = sorted.map(([value, count]) => `
      <label class="sidebar-make-item">
        <input type="checkbox" value="${value.toLowerCase()}" ${activeBodyTypes.has(value.toLowerCase()) ? 'checked' : ''}>
        <span>${value}</span>
        <span class="make-count">${count}</span>
      </label>
    `).join('');
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) activeBodyTypes.add(cb.value);
        else activeBodyTypes.delete(cb.value);
        updateAllCounts();
        applyFilters();
      });
    });
  }

  // ---- Build Model sidebar (depends on selected Make) ----
  function buildModelSidebar() {
    const container = document.getElementById('sidebarModels');
    if (!container) return;
    const section = container.closest('.sidebar-section');
    if (activeMakes.size === 0) {
      // No Make selected — hide whole section
      if (section) section.classList.add('hidden');
      return;
    }
    const counts = {};
    allRecords.forEach(r => {
      const make = (r.fields['Make'] || '').toLowerCase();
      if (!activeMakes.has(make)) return;
      const v = r.fields['Model'];
      if (v) counts[v] = (counts[v] || 0) + 1;
    });
    const sorted = Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
    if (!sorted.length) {
      if (section) section.classList.add('hidden');
      return;
    }
    if (section) section.classList.remove('hidden');
    container.innerHTML = sorted.map(([value, count]) => `
      <label class="sidebar-make-item">
        <input type="checkbox" value="${value.toLowerCase()}" ${activeModels.has(value.toLowerCase()) ? 'checked' : ''}>
        <span>${value}</span>
        <span class="make-count">${count}</span>
      </label>
    `).join('');
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', () => {
        if (cb.checked) activeModels.add(cb.value);
        else activeModels.delete(cb.value);
        updateAllCounts();
        applyFilters();
      });
    });
  }

  // When Make changes, rebuild Models list. We hook into the existing
  // Make sidebar by adding a delegated listener at the container level.
  function rebuildModelsAfterMakeChange() {
    // Drop any selected models no longer valid for the new make selection
    if (activeMakes.size > 0) {
      const validModels = new Set();
      allRecords.forEach(r => {
        const make = (r.fields['Make'] || '').toLowerCase();
        if (activeMakes.has(make)) {
          const m = (r.fields['Model'] || '').toLowerCase();
          if (m) validModels.add(m);
        }
      });
      for (const m of [...activeModels]) {
        if (!validModels.has(m)) activeModels.delete(m);
      }
    } else {
      activeModels.clear();
    }
    buildModelSidebar();
    updateAllCounts();
  }
  // Delegated listener: any checkbox change inside #sidebarMakes triggers a model rebuild
  if (sidebarMakes) {
    sidebarMakes.addEventListener('change', (e) => {
      if (e.target && e.target.matches('input[type="checkbox"]')) {
        // Run AFTER the existing handler updates activeMakes (microtask)
        Promise.resolve().then(rebuildModelsAfterMakeChange);
      }
    });
  }

  // ---- Update count badges for new filters ----
  function updateAllCounts() {
    const setCount = (id, n, isDot) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (isDot) el.textContent = n > 0 ? '•' : '';
      else el.textContent = n > 0 ? `(${n})` : '';
    };
    setCount('bodyTypeCount', activeBodyTypes.size);
    setCount('modelsCount', activeModels.size);
    const yearActive = (yearMin != null || yearMax != null) ? 1 : 0;
    setCount('yearCount', yearActive, true);
    const kmActive = (kmMax != null) ? 1 : 0;
    setCount('odometerCount', kmActive, true);
  }

  // ---- Wire toggles for new sections ----
  [
    ['bodyTypeToggle', 'sidebarBodyType'],
    ['modelsToggle', 'sidebarModels'],
    ['yearToggle', 'sidebarYear'],
    ['odometerToggle', 'sidebarOdometer']
  ].forEach(([btnId, panelId]) => {
    const btn = document.getElementById(btnId);
    const panel = document.getElementById(panelId);
    if (!btn || !panel) return;
    btn.addEventListener('click', () => {
      const isCollapsed = panel.classList.toggle('collapsed');
      btn.setAttribute('aria-expanded', String(!isCollapsed));
    });
  });

  // ---- Wire Year inputs ----
  const yearMinEl = document.getElementById('yearMin');
  const yearMaxEl = document.getElementById('yearMax');
  if (yearMinEl) yearMinEl.addEventListener('input', () => {
    const v = yearMinEl.value.trim();
    yearMin = v ? Number(v) : null;
    updateAllCounts();
    applyFilters();
  });
  if (yearMaxEl) yearMaxEl.addEventListener('input', () => {
    const v = yearMaxEl.value.trim();
    yearMax = v ? Number(v) : null;
    updateAllCounts();
    applyFilters();
  });

  // ---- Wire Odometer input ----
  const kmMaxEl = document.getElementById('kmMax');
  if (kmMaxEl) kmMaxEl.addEventListener('input', () => {
    const v = kmMaxEl.value.trim();
    kmMax = v ? Number(v) : null;
    updateAllCounts();
    applyFilters();
  });

  // ---- Event listeners ----
  catChips.forEach(chip => {
    chip.addEventListener('click', () => {
      catChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeCat = chip.dataset.cat || 'all';
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', () => {
      activeSearch = searchInput.value.trim();
      applyFilters();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      activeSort = sortSelect.value;
      applyFilters();
    });
  }

  // ---- Fetch all records (paginated) ----
  async function fetchAll() {
    const { baseId, token, table } = INV_CONFIG;
    let records = [];
    let offset = null;
    const sort = 'sort[0][field]=Date%20Added&sort[0][direction]=desc';

    do {
      const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}?${sort}${offset ? '&offset=' + offset : ''}`;
      const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) throw new Error(`Airtable ${res.status}`);
      const data = await res.json();
      records = records.concat(data.records || []);
      offset = data.offset || null;
    } while (offset);

    return records;
  }

  async function load() {
    grid.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><span>Loading inventory…</span></div>`;
    try {
      allRecords = await fetchAll();
      buildMakeSidebar();
      buildBodyTypeSidebar();
      buildModelSidebar();
      updateAllCounts();
      applyFilters();
    } catch (err) {
      console.error('inventory-page:', err);
      grid.innerHTML = `<div class="error-state"><h3>Failed to load inventory.</h3><p>Check your connection and try refreshing. If the problem persists, contact us directly.</p></div>`;
    }
  }

  load();
})();
