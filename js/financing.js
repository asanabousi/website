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
    push('Date of Birth', fd.get('dob'));
    push("Driver's Licence", fd.get('dlNumber'));
    push('SIN', fd.get('sin'));
    push('Province (ID)', fd.get('dlProvince'));
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
      records: [{
        fields: {
          Name: name,
          Phone: fd.get('phone') || '',
          Email: fd.get('email') || '',
          Type: 'Financing',
          'Vehicle Interest': vehicleInterest,
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

    const formspreePromise = fetch(form.action, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json' }
    });

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

    // Formspree — controls UX outcome
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
