# Unfazed Motors — Website

**Last updated: 2026-04-25**

Premium motorcycles and powersports dealership in Edmonton, Alberta.
Live site wired to Airtable for real-time inventory, Formspree for the financing form, and a Cloudflare Worker for the AI chatbot.

---

## Project structure

```
unfazed-motors/
├── index.html                   ← Home (intro animation + featured inventory)
├── inventory.html               ← Full inventory listing with filters
├── vehicle.html                 ← Vehicle detail (?stock=STOCK-NUMBER)
├── financing.html               ← Financing options + pre-approval form
├── financing-thank-you.html     ← Thank-you confirmation page
├── favicon.ico
├── assets/
│   ├── logo.png                 ← Skull helmet logo (white) — DROP IN
│   ├── logo-damaged.png         ← Damaged variant (intro + chatbot avatar) — DROP IN
│   └── logo-black.png           ← Black version (apparel/merch) — DROP IN
├── css/
│   ├── style.css                ← Shared design system (header, footer, buttons, cards)
│   ├── home.css                 ← Home: intro animation, hero, marquee, sections
│   ├── inventory-page.css       ← Inventory listing
│   ├── vehicle-page.css         ← Vehicle detail
│   ├── financing.css            ← Financing page
│   └── chatbot.css              ← Floating chatbot widget
└── js/
    ├── main.js                  ← Shared: header, mobile nav, reveal animations
    ├── intro.js                 ← Scroll-driven intro animation
    ├── home-inventory.js        ← Featured bikes from Airtable (home page)
    ├── inventory-page.js        ← Full inventory with filters
    ├── vehicle-page.js          ← Vehicle detail + lead form → Airtable Leads
    ├── financing.js             ← Financing form → Formspree + Airtable Leads
    └── chatbot.js               ← AI chatbot widget → Cloudflare Worker
```

---

## Fixes applied in this build

1. **Chatbot now loads on every page.** `chatbot.css`, `chatbot.js`, and the `<div id="unfazedChatRoot">` mount point are wired into all 5 HTML pages. Previously they shipped but were never linked.
2. **iPhone marquee stutter fixed.** The brand marquee was stuttering on iOS Safari because of two compounding issues:
   - `body::before` used `mix-blend-mode: overlay` over a fixed full-viewport SVG noise filter, which forced Safari to recomposite the entire page on every animation frame.
   - `header.stuck` used `backdrop-filter: blur(14px)` which is expensive on iOS when content animates beneath it.
   Both effects are now wrapped in `@media (min-width: 1000px)` and `@media (hover: hover)` so they only run on desktop. iPhone gets a clean, GPU-accelerated marquee.
3. **SIN field added to financing form.** Optional, never required. Captured into the Airtable `Notes` field on submit (not as a top-level Airtable field).
4. **Dead event listener removed** from `inventory.html` (was listening for `invloaded` which is never dispatched).
5. **Formspree confirmed wired** to form ID `xgorpqny` in `financing.html`.

---

## ⚠️ Before going live — checklist

### 1. Drop your logo files into `assets/`
The site references three images that need to exist:
- `assets/logo.png` — main white skull-helmet logo
- `assets/logo-damaged.png` — damaged variant used in the intro animation and chatbot avatar
- `assets/logo-black.png` — black version (used on apparel section)

### 2. Verify Airtable token scopes
Token currently embedded in `js/home-inventory.js`, `js/inventory-page.js`, `js/vehicle-page.js`, and `js/financing.js`.

Per your previous note the token was returning `403`. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens) and confirm the read-only PAT (`REMOVED_AIRTABLE_TOKEN...`) has:
- `data.records:read` on base `appdRYnYsp57lvv6T`, scoped to the `Inventory` table

And the write PAT (`pat0u9lUXTgn01Fuc...`) used in `financing.js` has:
- `data.records:write` on the same base, scoped to the `Leads` table

Field names must match exactly (case-sensitive). See the table schemas below.

### 3. Verify the Cloudflare Worker URL
`js/chatbot.js` currently points to:
```js
workerUrl: 'https://unfazed-chatbot.unfazedmotors.workers.dev'
```
Open that URL in a browser — if it returns anything other than a 405 ("Method Not Allowed" for GET, which is expected for a POST-only Worker), the chatbot won't connect. Update the URL if the Worker subdomain differs.

### 4. Test the financing form end-to-end
Submit a test entry — confirm both Formspree (you get the email) and Airtable (a row appears in `Leads`) succeed. Then delete the test row.

---

## Airtable schema

### Inventory table

| Field | Type |
|---|---|
| Stock Number | Single line text (primary) |
| Status | Single select: In Stock / Reserved / Sold / Pending / Hold |
| Year | Number |
| Make | Single line text |
| Model | Single line text |
| Category | Single select: Sportbike / Adventure / Naked / Cruiser / Touring / ATV / UTV / Off-Road / Scooter / Snowmobile |
| Mileage (km) | Number |
| Engine (cc) | Number |
| Horsepower | Number |
| Transmission | Single select: Manual / Automatic / CVT / Semi-Auto |
| Color | Single line text |
| Price (CAD) | Currency |
| Badge | Single select: NEW / Certified / Low KM / Reduced / One Owner / Just Arrived / Featured |
| Description | Long text |
| Photos | Attachment |
| Date Added | Created time |
| Featured on Home | Checkbox |
| VIN | Single line text |
| Drivetrain | Single line text |
| Fuel Economy | Single line text |
| Passengers | Number |
| Highlights | Single line text |
| Accident-Free | Checkbox |
| One Owner | Checkbox |
| Certified | Checkbox |
| Low KM | Checkbox |

### Leads table

| Field | Type |
|---|---|
| Name | Single line text |
| Phone | Single line text |
| Email | Email |
| Type | Single line text |
| Vehicle Interest | Single line text |
| Status | Single select: New / Contacted / Closed |
| Notes | Long text |
| Submitted At | Single line text |

The SIN, full driver's licence number, and other sensitive fields land in the `Notes` field (line-prefixed) so they don't sit on the surface of the Airtable record.

---

## Pushing to GitHub from terminal

From inside this folder, run:

```bash
git init
git add .
git commit -m "Initial commit — Unfazed Motors website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/unfazed-motors.git
git push -u origin main
```

Replace `YOUR-USERNAME` and the repo name. If the repo doesn't exist yet, create it on github.com first (don't add a README from the GitHub UI — you already have one).

For subsequent updates:
```bash
git add .
git commit -m "Describe what changed"
git push
```

---

## Deploying to Porkbun (or any static host)

Upload the **entire folder contents** (not the folder itself) to your web root:

```
public_html/
├── index.html
├── inventory.html
├── vehicle.html
├── financing.html
├── financing-thank-you.html
├── favicon.ico
├── assets/      ← folder
├── css/         ← folder
└── js/          ← folder
```

The Airtable read-only token is embedded in JS and visible in source — that's acceptable because it's scoped to public inventory data only. The write-only token for Leads should also be scoped narrowly (write-only, Leads table only) so a leaked token can't drain the base.

---

## How the integrations work

- **Home page** (`index.html` + `js/home-inventory.js`): Fetches `Featured on Home = true` AND `Status = "In Stock"`. Falls back to any In Stock if none flagged. Up to 3 cards.
- **Inventory page** (`inventory.html` + `js/inventory-page.js`): Fetches all records with pagination. All filtering (category, make, search, sort) is client-side after initial load.
- **Vehicle detail** (`vehicle.html` + `js/vehicle-page.js`): Reads `?stock=` from URL, fetches that single record. "Check Availability" modal POSTs a Lead to Airtable.
- **Financing form** (`financing.html` + `js/financing.js`): Submits to Formspree (controls success UX) and Airtable Leads in parallel. Airtable failures are logged but don't block the user.
- **Chatbot** (every page, via `js/chatbot.js`): Floating button bottom-right. POSTs conversation history to the Cloudflare Worker URL.

---

## Editing common things

- **Phone / address / email** — search-and-replace `780 236 1276`, `9620 51 Avenue`, `hello@unfazedmotors.ca`
- **Marquee brands** — edit the two `<span>` blocks inside `.marquee-track` in `index.html`
- **About copy** — `index.html` → `#about` section
- **Financing copy / FAQ** — `financing.html`
- **Airtable credentials** — top of `js/home-inventory.js`, `js/inventory-page.js`, `js/vehicle-page.js`, `js/financing.js` (four files)
- **Chatbot Worker URL** — top of `js/chatbot.js`
