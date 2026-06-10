/* ================================================
   UNFAZED MOTORS — Financing Form Handler
   Dual-submits to Formspree + Airtable Leads
   ================================================ */

(function () {

  const API_BASE = 'https://unfazed-chatbot.unfazedmotors.workers.dev';


  const form = document.getElementById('finForm');
  if (!form) return;

  // Force header always stuck on this page
  const hdr = document.getElementById('hdr');
  if (hdr) hdr.classList.add('stuck');

  // Auto-fill today's date into Date Signed if empty
  const dateSigned = document.getElementById('dateSigned');
  if (dateSigned && !dateSigned.value) {
    dateSigned.value = new Date().toISOString().slice(0, 10);
  }

  // Sync email → _replyto (live + on submit)
  const emailInput = document.getElementById('emailInput');
  const replyto = document.getElementById('replyto');
  if (emailInput && replyto) {
    emailInput.addEventListener('input', () => { replyto.value = emailInput.value; });
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  function checkedById(id) {
    const el = document.getElementById(id);
    return el ? el.checked : false;
  }

  function buildAirtableNotes(fd) {
    const lines = [];
    const push = (label, v) => { if (v) lines.push(`${label}: ${v}`); };

    push('Middle Name', fd.get('middleName'));
    push('Date of Birth', fd.get('dateOfBirth'));
    push("Driver's Licence", fd.get('driverLicense'));
    push('SIN', fd.get('sin'));
    push('Province (ID)', fd.get('licenseProvince'));
    push('Marital Status', fd.get('maritalStatus'));
    push('Dependents', fd.get('dependents'));
    push('Alt Phone', fd.get('altPhone'));
    push('Best Time to Call', fd.get('bestTime'));
    push('Preferred Contact', fd.get('contactMethod'));
    push('Street Address', fd.get('street'));
    push('Apt / Suite', fd.get('apt'));
    push('City', fd.get('city'));
    push('Province (Res)', fd.get('province'));
    push('Postal Code', fd.get('postal'));
    push('Time at Address', fd.get('timeAtAddress'));
    push('Housing', fd.get('housingStatus'));
    push('Monthly Housing Payment', fd.get('monthlyHousing'));
    push('Employer', fd.get('employer'));
    push('Job Title', fd.get('jobTitle'));
    push('Employer Phone', fd.get('employerPhone'));
    push('Employment Type', fd.get('employmentType'));
    push('Employer Address', fd.get('employerAddress'));
    push('Time at Job', fd.get('timeAtJob'));
    push('Gross Monthly Income', fd.get('grossMonthly'));
    push('Additional Income', fd.get('additionalIncome'));
    push('Additional Income Source', fd.get('additionalIncomeSource'));
    push('Vehicle Category', fd.get('preferredCategory'));
    push('Budget', fd.get('budget'));
    push('Down Payment', fd.get('downPayment'));
    push('Trade-In', fd.get('tradeIn'));
    push('Desired Term', fd.get('desiredTerm'));
    push('Credit Rating (Self)', fd.get('creditRating'));
    push('Bankruptcy', fd.get('bankruptcy'));
    push('Consumer Proposal', fd.get('consumerProposal'));
    push('Repossessions', fd.get('repossessions'));
    push('Current Auto Loan', fd.get('currentAutoLoan'));
    push('Marketing Opt-In', checkedById('marketingOptIn') ? 'Yes' : 'No');
    push('E-Signature', fd.get('eSignature'));
    push('Date Signed', fd.get('dateSigned'));

    const comments = fd.get('comments');
    if (comments) lines.push(`\nComments:\n${comments}`);

    return lines.join('\n');
  }

  function buildAirtablePayload(fd) {
    const firstName = fd.get('firstName') || '';
    const lastName = fd.get('lastName') || '';
    const name = [firstName, lastName].filter(Boolean).join(' ');
    const vehicleInterest = fd.get('specificVehicle') || fd.get('preferredCategory') || '';

    return {
      name,
      phone: fd.get('phone') || '',
      email: fd.get('email') || '',
      type: 'Financing',
      vehicleInterest,
      source: 'Financing form',
      notes: buildAirtableNotes(fd)
    };
  }

  // ── Submit handler ────────────────────────────────────────────────────────

  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    // Sync email one final time before validation
    if (emailInput && replyto) replyto.value = emailInput.value;

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const successEl = document.getElementById('finSuccess');
    const errorEl = document.getElementById('finError');

    // Reset error state
    if (errorEl) errorEl.classList.remove('show');
    submitBtn.disabled = true;
    const originalLabel = submitBtn.textContent;
    submitBtn.textContent = 'Sending…';

    const fd = new FormData(form);

    let airtableOk = false;

    try {
      const airtableResult = await fetch(`${API_BASE}/lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(buildAirtablePayload(fd))
      });

      airtableOk = airtableResult.ok;
      if (!airtableOk) {
        console.warn('Airtable lead failed:', airtableResult.status, await airtableResult.text());
      }
    } catch (err) {
      console.warn('Airtable lead failed:', err);
    }

    fetch(form.action, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json' }
    }).then((res) => {
      if (!res.ok) console.warn('Formspree email copy failed:', res.status);
    }).catch((err) => {
      console.warn('Formspree email copy failed:', err);
    });

    if (airtableOk) {
      const formWrap = document.getElementById('finFormWrap');
      if (formWrap) formWrap.style.display = 'none';
      if (successEl) {
        successEl.classList.add('show');
        successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = originalLabel;
      if (errorEl) {
        errorEl.classList.add('show');
        errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  });
})();
