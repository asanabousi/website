/* ================================================
   UNFAZED MOTORS — Vehicle Detail Page
   Loads a single vehicle by ?stock= URL param.
   Modal form creates a Lead in Airtable.
   ================================================ */

const VEH_CONFIG = {
  baseId: 'appdRYnYsp57lvv6T',
  token: 'REMOVED_AIRTABLE_TOKEN',
  inventoryTable: 'Inventory',
  leadsTable: 'Leads'
};

(function () {
  const wrap = document.getElementById('vehicleWrap');
  if (!wrap) return;

  const stock = new URLSearchParams(window.location.search).get('stock');
  if (!stock) {
    showNotFound();
    return;
  }

  // ---- Utilities ----
  function fmt(n) { return n ? '$' + Math.round(Number(n)).toLocaleString('en-CA') : 'Contact for price'; }
  function fmtNum(n) { return n ? Number(n).toLocaleString('en-CA') : '—'; }
  function esc(s) { return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

  function placeholderSvg() {
    return `<svg viewBox="0 0 800 400" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMax meet" style="width:80%;max-width:480px">
  <defs>
    <linearGradient id="bgv" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#e8e8e8"/><stop offset="100%" stop-color="#6a6a6a"/></linearGradient>
    <linearGradient id="btv" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#000"/></linearGradient>
  </defs>
  <ellipse cx="400" cy="355" rx="320" ry="18" fill="#000" opacity="0.6"/>
  <circle cx="610" cy="300" r="70" fill="url(#btv)"/><circle cx="610" cy="300" r="34" fill="#1a1a1a"/><circle cx="610" cy="300" r="18" fill="#333"/>
  <circle cx="190" cy="300" r="70" fill="url(#btv)"/><circle cx="190" cy="300" r="34" fill="#1a1a1a"/><circle cx="190" cy="300" r="18" fill="#333"/>
  <path d="M 240 220 Q 270 160 340 150 L 480 145 Q 540 148 570 200 L 590 270 Q 560 290 480 290 L 340 290 Q 260 285 240 260 Z" fill="url(#bgv)"/>
  <path d="M 350 200 L 480 200 L 475 210 L 350 210 Z" fill="#ff2d2d" opacity="0.85"/>
  <text x="415" y="208" text-anchor="middle" fill="#fff" font-family="JetBrains Mono, monospace" font-size="8" letter-spacing="2">UNFAZED</text>
</svg>`;
  }

  function showNotFound() {
    wrap.innerHTML = `<div class="vehicle-not-found">
      <h2>404</h2>
      <p>That vehicle wasn't found. It may have been sold or the link is incorrect.</p>
      <a href="inventory.html" class="btn btn-outline" style="margin-top:24px">Browse Inventory <span class="arrow">↗</span></a>
    </div>`;
  }

  function showLoading() {
    wrap.innerHTML = `<div class="vehicle-loading"><div class="loading-spinner"></div><span style="font-family:'JetBrains Mono',monospace;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:var(--mute)">Loading…</span></div>`;
  }

  // ---- Build gallery HTML ----
  function buildGallery(photos) {
    if (!photos || !photos.length) {
      return `<div class="gallery-main"><img src="assets/coming-soon.png" alt="Photos coming soon" style="width:100%;height:100%;object-fit:cover"></div>`;
    }
    const mainUrl = photos[0].url;
    const thumbs = photos.map((p, i) => `
      <div class="thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" data-url="${p.url}">
        <img src="${p.thumbnails?.small?.url || p.url}" alt="Photo ${i + 1}" loading="lazy">
      </div>`).join('');

    return `
      <div class="gallery-main">
        <img src="${mainUrl}" alt="Vehicle photo" id="galleryMain">
      </div>
      ${photos.length > 1 ? `<div class="gallery-thumbs" id="galleryThumbs">${thumbs}</div>` : ''}
    `;
  }

  // ---- Build spec row ----
  function spec(label, value) {
    if (!value && value !== 0) return '';
    return `<div class="spec-item"><span class="spec-label">${label}</span><div class="spec-value">${esc(value)}</div></div>`;
  }

  // ---- Render full vehicle ----
  function renderVehicle(rec) {
    const f = rec.fields || {};
    const year = f['Year'] || '';
    const make = f['Make'] || '';
    const model = f['Model'] || '';
    const category = f['Category'] || '';
    const stockNum = f['Stock Number'] || stock;
    const status = f['Status'] || 'In Stock';
    const price = f['Price (CAD)'];
    const badge = f['Badge'];
    const photos = f['Photos'] || [];
    const description = f['Description'] || '';
    const highlights = f['Highlights'] || '';
    const cc = f['Engine (cc)'];
    const hp = f['Horsepower'];
    const km = f['Mileage (km)'];
    const transmission = f['Transmission'] || '';
    const color = f['Color'] || '';
    const vin = f['VIN'] || '';
    const drivetrain = f['Drivetrain'] || '';
    const fuelEcon = f['Fuel Economy'] || '';
    const passengers = f['Passengers'] || '';
    const accidentFree = f['Accident-Free'];
    const oneOwner = f['One Owner'];
    const certified = f['Certified'];
    const lowKm = f['Low KM'];

    

    // Page title
    document.title = `${year} ${make} ${model} — Unfazed Motors`;
    const breadcrumbName = document.getElementById('breadcrumbName');
    if (breadcrumbName) breadcrumbName.textContent = `${year} ${make} ${model}`;

    // Badges row
    const badgesHtml = [
      badge ? `<span class="veh-badge accent">${badge}</span>` : '',
      accidentFree ? `<span class="veh-badge green">Accident-Free</span>` : '',
      oneOwner ? `<span class="veh-badge green">One Owner</span>` : '',
      certified ? `<span class="veh-badge green">Certified</span>` : '',
      lowKm ? `<span class="veh-badge">Low KM</span>` : '',
      status !== 'In Stock' ? `<span class="veh-badge">${status}</span>` : ''
    ].filter(Boolean).join('');

    const galleryHtml = buildGallery(photos);

    const specRows = [
      spec('Year', year), spec('Make', make), spec('Model', model),
      spec('Category', category), spec('Engine', cc ? `${fmtNum(cc)} cc` : null),
      spec('Horsepower', hp ? `${fmtNum(hp)} HP` : null),
      spec('Mileage', km ? `${fmtNum(km)} km` : null),
      spec('Transmission', transmission), spec('Color', color),
      spec('Drivetrain', drivetrain), spec('Fuel Economy', fuelEcon),
      spec('Passengers', passengers), spec('VIN', vin),
    ].filter(Boolean).join('');

    wrap.innerHTML = `
      <div class="vehicle-main">
        <div class="vehicle-left">
          <div class="gallery">${galleryHtml}</div>
          ${badgesHtml ? `<div class="vehicle-badges">${badgesHtml}</div>` : ''}
          ${description ? `
            <div class="vehicle-description">
              <h3>About This Vehicle</h3>
              <p>${esc(description)}</p>
              ${highlights ? `<div class="vehicle-highlights">${highlights.split(',').map(h => `<span class="highlight-tag">${esc(h.trim())}</span>`).join('')}</div>` : ''}
            </div>
          ` : ''}
        </div>

        <div class="vehicle-sidebar">
          <div class="vehicle-title-block">
            <span class="vehicle-eyebrow">${category} · Stock #${esc(stockNum)}</span>
            <h1 class="vehicle-title">${esc(year)} ${esc(make)} ${esc(model)}</h1>
          </div>

          <div class="price-block">
            <div class="cash-price">${fmt(price)}<span class="price-unit">/MO</span><small>7.99% APR · OAC · Plus taxes &amp; fees</small></div>
          </div>

          <div class="spec-grid">${specRows}</div>

          <div class="vehicle-ctas">
            <button class="btn btn-primary" id="availBtn" style="width:100%;justify-content:center">
              Check Availability <span class="arrow">↗</span>
            </button>
            <a href="tel:17802361276" class="btn btn-outline" style="width:100%;justify-content:center">
              Call 780 236 1276 <span class="arrow">↗</span>
            </a>
            <a href="financing.html" class="btn-secondary-link">Apply for Financing</a>
          </div>
        </div>
      </div>
    `;

    // ---- Gallery interactions ----
    const mainImg = document.getElementById('galleryMain');
    document.getElementById('galleryThumbs')?.querySelectorAll('.thumb').forEach(thumb => {
      thumb.addEventListener('click', () => {
        if (mainImg) mainImg.src = thumb.dataset.url;
        document.querySelectorAll('.thumb').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
      });
    });

    
    // ---- Availability modal ----
    document.getElementById('availBtn')?.addEventListener('click', openModal);

    // ---- Set modal vehicle label ----
    const modalVehicle = document.getElementById('modalVehicle');
    if (modalVehicle) modalVehicle.value = `${year} ${make} ${model} (Stock #${stockNum})`;

    // Reveal sidebar
    document.querySelectorAll('.reveal').forEach(el => {
      el.classList.add('in');
    });
  }

  // ---- Modal ----
  const overlay = document.getElementById('modalOverlay');
  const closeBtn = document.getElementById('modalClose');
  function openModal() { overlay?.classList.add('open'); document.body.style.overflow = 'hidden'; }
  function closeModal() { overlay?.classList.remove('open'); document.body.style.overflow = ''; }
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

  // ---- Lead form submission ----
  const leadForm = document.getElementById('leadForm');
  leadForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = leadForm.querySelector('.form-submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    const data = Object.fromEntries(new FormData(leadForm));
    const { baseId, token, leadsTable } = VEH_CONFIG;

    try {
      const res = await fetch(`https://api.airtable.com/v0/${baseId}/${encodeURIComponent(leadsTable)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            'Name': data.name || '',
            'Phone': data.phone || '',
            'Email': data.email || '',
            'Type': 'Vehicle Inquiry',
            'Vehicle Interest': data.vehicle || '',
            'Status': 'New',
            'Notes': data.notes || '',
            'Submitted At': new Date().toISOString()
          }
        })
      });
      if (!res.ok) throw new Error(`Airtable ${res.status}`);

      const formContent = document.getElementById('formContent');
      if (formContent) {
        formContent.innerHTML = `<div class="form-success">
          <h3>We'll Be in Touch.</h3>
          <p>Your inquiry has been received. We'll reach out within a few hours — usually sooner.</p>
          <button class="btn btn-outline" onclick="document.getElementById('modalOverlay').classList.remove('open');document.body.style.overflow=''" style="margin-top:24px">Close</button>
        </div>`;
      }
    } catch (err) {
      console.error('lead submit:', err);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
      alert('Something went wrong. Please call us directly at 780 236 1276.');
    }
  });

  // ---- Fetch vehicle ----
  async function fetchVehicle() {
    const { baseId, token, inventoryTable } = VEH_CONFIG;
    const formula = encodeURIComponent(`{Stock Number}="${stock}"`);
    const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(inventoryTable)}?filterByFormula=${formula}&maxRecords=1`;
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Airtable ${res.status}`);
    const data = await res.json();
    return (data.records || [])[0] || null;
  }

  async function load() {
    showLoading();
    try {
      const rec = await fetchVehicle();
      if (!rec) { showNotFound(); return; }
      renderVehicle(rec);
    } catch (err) {
      console.error('vehicle-page:', err);
      wrap.innerHTML = `<div class="vehicle-not-found">
        <h2>Error</h2>
        <p>Failed to load this vehicle. Please try again or call us at 780 236 1276.</p>
        <a href="inventory.html" class="btn btn-outline" style="margin-top:24px">Browse Inventory</a>
      </div>`;
    }
  }

  load();
})();
