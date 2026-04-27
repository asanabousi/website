/* ================================================
   UNFAZED MOTORS — Home Featured Inventory
   Fetches Featured on Home bikes from Airtable
   and renders them into the #inv-cards container.
   ================================================ */

   const API_BASE = 'https://unfazed-chatbot.unfazedmotors.workers.dev';

(function () {
  const grid = document.getElementById('invCards');
  const countEl = document.getElementById('invCount');
  if (!grid) return;

  function fmt(n) {
    if (!n && n !== 0) return '—';
    return '$' + Math.ceil(Number(n) / 100).toLocaleString('en-CA');
  }
  function fmtNum(n) { return n ? Number(n).toLocaleString('en-CA') : '—'; }

  function badgeClass(badge) {
    if (!badge) return '';
    const map = { 'NEW': 'badge-new', 'Featured': 'badge-featured', 'Reduced': 'badge-reduced', 'Just Arrived': 'badge-featured' };
    return map[badge] || '';
  }

  function placeholderSvg() {
    return `<svg class="placeholder-svg" viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="bg1h" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#e8e8e8"/><stop offset="100%" stop-color="#6a6a6a"/></linearGradient>
    <linearGradient id="bt1h" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#000"/></linearGradient>
  </defs>
  <ellipse cx="400" cy="355" rx="320" ry="18" fill="#000" opacity="0.6"/>
  <ellipse cx="400" cy="355" rx="260" ry="10" fill="#ff2d2d" opacity="0.12"/>
  <circle cx="610" cy="300" r="70" fill="url(#bt1h)"/><circle cx="610" cy="300" r="55" fill="none" stroke="#111" stroke-width="2"/>
  <circle cx="610" cy="300" r="34" fill="#1a1a1a"/><circle cx="610" cy="300" r="18" fill="#333"/>
  <circle cx="190" cy="300" r="70" fill="url(#bt1h)"/><circle cx="190" cy="300" r="55" fill="none" stroke="#111" stroke-width="2"/>
  <circle cx="190" cy="300" r="34" fill="#1a1a1a"/><circle cx="190" cy="300" r="18" fill="#333"/>
  <circle cx="190" cy="300" r="30" fill="none" stroke="#555" stroke-width="1.2" stroke-dasharray="2,3"/>
  <path d="M 420 270 L 605 305 L 600 320 L 420 290 Z" fill="#2b2b2b"/>
  <path d="M 200 300 L 220 180 L 240 180 L 220 300 Z" fill="#444"/>
  <path d="M 180 300 L 200 180 L 215 180 L 200 300 Z" fill="#555"/>
  <path d="M 240 220 Q 270 160 340 150 L 480 145 Q 540 148 570 200 L 590 270 Q 560 290 480 290 L 340 290 Q 260 285 240 260 Z" fill="url(#bg1h)"/>
  <path d="M 330 165 Q 380 140 460 145 Q 500 150 510 180 L 500 220 L 340 220 Q 320 200 330 165 Z" fill="#d4d4d4"/>
  <path d="M 500 195 L 580 200 Q 600 200 595 215 L 560 240 L 500 235 Z" fill="#111"/>
  <path d="M 245 200 Q 250 180 275 175 L 290 190 Q 285 215 255 215 Z" fill="#fff" opacity="0.9"/>
  <circle cx="270" cy="195" r="10" fill="#ff2d2d" opacity="0.7"/>
  <path d="M 280 170 Q 320 130 360 135 L 365 155 Q 320 165 290 185 Z" fill="#0a0a0a" opacity="0.7" stroke="#2a2a2a" stroke-width="1"/>
  <path d="M 350 200 L 480 200 L 475 210 L 350 210 Z" fill="#ff2d2d" opacity="0.85"/>
  <text x="415" y="208" text-anchor="middle" fill="#fff" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="2">UNFAZED</text>
</svg>`;
  }

  function renderCard(rec, delay) {
    const f = rec.fields || {};
    const stock = f['Stock Number'] || rec.id;
    const thumb = f['Photos'] && f['Photos'][0] ? f['Photos'][0].thumbnails?.large?.url || f['Photos'][0].url : null;
    const badge = f['Badge'];
    const cat = f['Category'] || '';
    const year = f['Year'] || '';
    const make = f['Make'] || '';
    const model = f['Model'] || '';
    const cc = f['Engine (cc)'];
    const hp = f['Horsepower'];
    const km = f['Mileage (km)'];
    const price = f['Price (CAD)'];

    return `<article class="card reveal" style="transition-delay:${delay}ms">
  <a href="vehicle.html?stock=${encodeURIComponent(stock)}">
    <div class="card-media">
    ${thumb ? `<img src="${thumb}" alt="${year} ${make} ${model}" loading="lazy">` : `<img src="assets/coming-soon.png" alt="Photos coming soon" loading="lazy">`}
      ${badge ? `<span class="card-badge ${badgeClass(badge)}">${badge}</span>` : ''}
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
        <div class="card-price">${fmt(price)}<small>/MO · Plus taxes &amp; fees · OAC</small></div>
        <span class="card-cta">↗</span>
      </div>
    </div>
  </a>
</article>`;
  }
  async function fetchFeatured() {
    const res = await fetch(`${API_BASE}/inventory?featuredOnly=true&limit=6`);
  
    if (!res.ok) {
      throw new Error(`Inventory API error ${res.status}`);
    }
  
    const data = await res.json();
    const records = data.records || [];
  
    return records.map((bike) => ({
      id: bike.id,
      fields: {
        'Stock Number': bike.stockNumber,
        'Year': bike.year,
        'Make': bike.make,
        'Model': bike.model,
        'Category': bike.category,
        'Mileage (km)': bike.mileage,
        'Engine (cc)': bike.engine,
        'Horsepower': bike.horsepower,
        'Transmission': bike.transmission,
        'Color': bike.color,
        'Price (CAD)': bike.price,
        'Badge': bike.badge,
        'Description': bike.description,
        'Photos': bike.photo ? [{ url: bike.photo, thumbnails: { large: { url: bike.photo } } }] : [],
        'Status': bike.status
      }
    }));
  }
  async function load() {
    grid.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><span>Loading inventory…</span></div>`;

    try {
      const records = await fetchFeatured();

      if (countEl) countEl.textContent = `Showing ${records.length} featured units`;

      const heroCount = document.getElementById('heroStockCount');
      if (heroCount) heroCount.textContent = records.length;
      if (!records.length) {
        grid.innerHTML = `<div class="loading-state">No inventory available right now. Check back soon.</div>`;
        return;
      }

      grid.innerHTML = records.map((r, i) => renderCard(r, i * 60)).join('');

      // Notify index.html to update the hero feature card
      document.dispatchEvent(new CustomEvent('homeinvloaded', { detail: records }));

      // Trigger reveal observer on new cards
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.1 });
      grid.querySelectorAll('.reveal').forEach(el => io.observe(el));

    } catch (err) {
      console.error('home-inventory:', err);
      // On error, keep static placeholder content rather than showing error
      grid.innerHTML = `<div class="loading-state">Unable to load live inventory. <a href="inventory.html" style="color:var(--accent)">Browse all vehicles →</a></div>`;
    }
  }

  load();
})();
