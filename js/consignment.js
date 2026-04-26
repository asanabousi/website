/* ================================================
   UNFAZED MOTORS — Consignment Form Handler
   Submits to Formspree (photos as attachments)
   + writes a lead row to Airtable Leads table.
   ================================================ */

(function () {
  const AIRTABLE_BASE = 'appdRYnYsp57lvv6T';
  const LEADS_TABLE = 'Leads';

  const form = document.getElementById('conForm');
  if (!form) return;

  // Force header always stuck on this page
  const hdr = document.getElementById('hdr');
  if (hdr) hdr.classList.add('stuck');

  // Sync email → _replyto
  const emailInput = document.getElementById('emailInput');
  const replyto = document.getElementById('replyto');
  if (emailInput && replyto) {
    emailInput.addEventListener('input', () => { replyto.value = emailInput.value; });
  }

  // Photo file list display
  const photosInput = document.getElementById('photos');
  const photoListEl = document.getElementById('photoList');
  if (photosInput && photoListEl) {
    photosInput.addEventListener('change', () => {
      const files = Array.from(photosInput.files || []);
      if (!files.length) {
        photoListEl.innerHTML = '';
        return;
      }
      // Limit to 8 files
      if (files.length > 8) {
        alert('Maximum 8 photos. Only the first 8 will be attached.');
      }
      const shown = files.slice(0, 8);
      photoListEl.innerHTML = shown
        .map(f => `<span>${f.name.length > 24 ? f.name.slice(0, 21) + '…' : f.name}</span>`)
        .join('');
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function buildAirtableNotes(fd) {
    const lines = [];
    const push = (label, v) => { if (v) lines.push(`${label}: ${v}`); };

    lines.push('--- VEHICLE ---');
    push('Type', fd.get('vehicleType'));
    push('Year', fd.get('year'));
    push('Make', fd.get('make'));
    push('Model', fd.get('model'));
    push('Trim', fd.get('trim'));
    push('Color', fd.get('color'));
    push('VIN', fd.get('vin'));
    push('KMs', fd.get('kms'));

    lines.push('\n--- HISTORY ---');
    push('Title Status', fd.get('ownership'));
    push('Owned For', fd.get('ownedFor'));
    push('Accident History', fd.get('accident'));
    push('Warranty', fd.get('warranty'));

    lines.push('\n--- CONDITION ---');
    push('Overall Condition', fd.get('condition'));
    push('Modifications', fd.get('modifications'));
    push('Needs Fixing', fd.get('needsFixing'));

    lines.push('\n--- DEAL ---');
    push('Asking Price', fd.get('askingPrice') ? `$${Number(fd.get('askingPrice')).toLocaleString('en-CA')}` : null);
    push('Preferred Deal', fd.get('dealType'));

    lines.push('\n--- CONTACT ---');
    push('City', fd.get('city'));

    const comments = fd.get('comments');
    if (comments) lines.push(`\nComments:\n${comments}`);

    // Note about photos
    const photosCount = (photosInput?.files?.length) || 0;
    if (photosCount > 0) {
      lines.push(`\n📷 ${photosCount} photo${photosCount > 1 ? 's' : ''} attached — see email submission for files.`);
    }

    return lines.join('\n');
  }

  function buildAirtablePayload(fd) {
    const firstName = fd.get('firstName') || '';
    const lastName = fd.get('lastName') || '';
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const vehicleSummary = [
      fd.get('year'),
      fd.get('make'),
      fd.get('model')
    ].filter(Boolean).join(' ');

    return {
      records: [{
        fields: {
          Name: name,
          Phone: fd.get('phone') || '',
          Email: fd.get('email') || '',
          Type: 'Consignment',
          'Vehicle Interest': vehicleSummary,
          Status: 'New',
          Notes: buildAirtableNotes(fd),
          'Submitted At': new Date().toISOString()
        }
      }]
    };
  }

  // ── Submit handler ────────────────────────────────────────────────────────

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Sync email one final time
    if (emailInput && replyto) replyto.value = emailInput.value;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Photo count validation — require at least 3, max 8
    const photoFiles = photosInput?.files || [];
    if (photoFiles.length < 3) {
      alert('Please upload at least 3 photos so we can give you an accurate appraisal.');
      photosInput?.focus();
      photosInput?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (photoFiles.length > 8) {
      alert('Maximum 8 photos. Please remove some before submitting.');
      return;
    }

    const submitBtn = form.querySelector('.fs-submit');
    const successEl = document.getElementById('conSuccess');
    const errorEl = document.getElementById('conError');

    if (errorEl) errorEl.classList.remove('show');
    submitBtn.disabled = true;
    const originalLabel = submitBtn.innerHTML;
    submitBtn.textContent = 'Sending…';

    const fd = new FormData(form);

    // Formspree — sends form including file attachments
    const formspreePromise = fetch(form.action, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json' }
    });

    // Airtable — JSON only, no photos (Airtable can't accept binary file uploads from the browser like this)
    const airtablePromise = fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE}/${encodeURIComponent(LEADS_TABLE)}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(buildAirtablePayload(fd))
      }
    );

    const [formspreeResult, airtableResult] = await Promise.allSettled([
      formspreePromise,
      airtablePromise
    ]);

    // Airtable — non-blocking, log only
    if (airtableResult.status === 'rejected') {
      console.warn('Airtable lead write failed:', airtableResult.reason);
    } else if (!airtableResult.value.ok) {
      airtableResult.value.json().then(d => console.warn('Airtable error:', d)).catch(() => {});
    }

    // Formspree controls UX outcome
    let formspreeOk = false;
    if (formspreeResult.status === 'fulfilled' && formspreeResult.value.ok) {
      formspreeOk = true;
    } else {
      console.warn(
        'Formspree failed:',
        formspreeResult.status === 'rejected' ? formspreeResult.reason : formspreeResult.value.status
      );
    }

    if (formspreeOk) {
      // Hide form, show success
      const formWrap = document.getElementById('conFormWrap');
      form.style.display = 'none';
      if (successEl) {
        successEl.classList.add('show');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalLabel;
      if (errorEl) {
        errorEl.classList.add('show');
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
})();
