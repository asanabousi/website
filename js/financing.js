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

  function durationText(years, months) {
    const y = Number(years || 0);
    const m = Number(months || 0);
    const parts = [];
    if (y) parts.push(`${y} year${y === 1 ? '' : 's'}`);
    if (m) parts.push(`${m} month${m === 1 ? '' : 's'}`);
    return parts.length ? parts.join(' ') : '0 months';
  }

  function durationMonths(years, months) {
    return Number(years || 0) * 12 + Number(months || 0);
  }

  function section(lines, title) {
    lines.push(`\n=== ${title} ===`);
  }

  function buildAirtableNotes(fd) {
    const lines = [];
    const push = (label, v) => { if (v) lines.push(`${label}: ${v}`); };

    section(lines, 'PERSONAL INFORMATION');
    push('Salutation', fd.get('salutation'));
    push('First Name', fd.get('firstName'));
    push('Middle Name', fd.get('middleName'));
    push('Last Name', fd.get('lastName'));
    push('Suffix', fd.get('suffix'));
    push('SIN', fd.get('sin'));
    push('Phone', fd.get('phone'));
    push('Mobile Phone', fd.get('mobilePhone'));
    push('Date of Birth', fd.get('dateOfBirth'));
    push('Gender', fd.get('gender'));
    push('Marital Status', fd.get('maritalStatus'));
    push('Email', fd.get('email'));
    push('Language', fd.get('language'));
    push('Dependents', fd.get('dependents'));
    push("Driver's Licence", fd.get('driverLicense'));
    push('Province of Licence', fd.get('licenseProvince'));

    section(lines, 'CURRENT ADDRESS');
    push('Postal Code', fd.get('postalCode'));
    push('Address Type', fd.get('addressType'));
    push('Suite No.', fd.get('suiteNo'));
    push('Address No.', fd.get('addressNo'));
    push('Street Name', fd.get('streetName'));
    push('Street Type', fd.get('streetType'));
    push('City', fd.get('city'));
    push('Province', fd.get('province'));
    push('Duration', durationText(fd.get('currentAddressYears'), fd.get('currentAddressMonths')));

    if (durationMonths(fd.get('currentAddressYears'), fd.get('currentAddressMonths')) < 24) {
      section(lines, 'PREVIOUS ADDRESS');
      push('Postal Code', fd.get('previousPostalCode'));
      push('Address Type', fd.get('previousAddressType'));
      push('Suite No.', fd.get('previousSuiteNo'));
      push('Address No.', fd.get('previousAddressNo'));
      push('Street Name', fd.get('previousStreetName'));
      push('City', fd.get('previousCity'));
      push('Province', fd.get('previousProvince'));
      push('Duration', durationText(fd.get('previousAddressYears'), fd.get('previousAddressMonths')));
    }

    section(lines, 'HOME/MORTGAGE DETAILS');
    push('Home', fd.get('housing'));
    push('Mortgage Amount', fd.get('mortgageAmount'));
    push('Monthly Payment', fd.get('monthlyHousingPayment'));
    push('Market Value', fd.get('marketValue'));
    push('Mortgage Holder', fd.get('mortgageHolder'));

    section(lines, 'CURRENT EMPLOYMENT');
    push('Type', fd.get('employmentType'));
    push('Employer', fd.get('employerName'));
    push('Status', fd.get('employmentStatus'));
    push('Occupation', fd.get('jobTitle'));
    push('Industry Type', fd.get('industryType'));
    push('Telephone', fd.get('employerPhone'));
    push('Ext.', fd.get('employerExt'));
    push('Employment Address', fd.get('employerAddress'));
    push('City', fd.get('employerCity'));
    push('Province', fd.get('employerProvince'));
    push('Duration', durationText(fd.get('currentJobYears'), fd.get('currentJobMonths')));

    if (durationMonths(fd.get('currentJobYears'), fd.get('currentJobMonths')) < 24) {
      section(lines, 'PREVIOUS EMPLOYMENT');
      push('Type', fd.get('previousEmploymentType'));
      push('Employer', fd.get('previousEmployer'));
      push('Occupation', fd.get('previousJobTitle'));
      push('Telephone', fd.get('previousEmployerPhone'));
      push('Employment Address', fd.get('previousEmployerAddress'));
      push('City', fd.get('previousEmployerCity'));
      push('Province', fd.get('previousEmployerProvince'));
      push('Duration', durationText(fd.get('previousJobYears'), fd.get('previousJobMonths')));
    }

    section(lines, 'INCOME DETAILS');
    push('Gross Income', fd.get('grossMonthlyIncome'));
    push('Per', fd.get('incomePer'));
    push('Proof of Income Type', fd.get('proofIncomeType'));
    push('Annual Employment Gross', fd.get('annualEmploymentGross'));
    push('Other Income Source', fd.get('additionalIncomeSource'));
    push('Other Monthly Amount', fd.get('additionalIncomeAmount'));

    section(lines, 'VEHICLE OF INTEREST');
    push('Specific Vehicle', fd.get('specificVehicle'));
    push('Preferred Category', fd.get('preferredCategory'));
    push('Budget Range', fd.get('budgetRange'));
    push('Down Payment', fd.get('downPayment'));
    push('Trade-In', fd.get('tradeIn'));
    push('Desired Term', fd.get('desiredTerm'));

    section(lines, 'CREDIT HISTORY');
    push('Credit Self-Reported', fd.get('creditSelfReported'));
    push('Bankruptcy', fd.get('bankruptcy'));
    push('Consumer Proposal', fd.get('consumerProposal'));
    push('Repossessions', fd.get('repossessions'));
    push('Current Auto Loan', fd.get('currentAutoLoan'));

    section(lines, 'AUTHORIZATION');
    push('Marketing Opt-In', checkedById('marketingOptIn') ? 'Yes' : 'No');
    push('E-Signature', fd.get('electronicSignature'));
    push('Date Signed', fd.get('dateSigned'));

    const comments = fd.get('comments');
    if (comments) {
      section(lines, 'COMMENTS');
      lines.push(comments);
    }

    return lines.join('\n').trim();
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


  function syncConditionalBlock(blockId, shouldShow) {
    const block = document.getElementById(blockId);
    if (!block) return;
    block.hidden = !shouldShow;
    block.querySelectorAll('.conditional-required').forEach((el) => {
      el.required = shouldShow;
    });
  }

  function updateConditionalSections() {
    const addressYears = document.getElementById('currentAddressYears')?.value || '';
    const addressMonthValue = document.getElementById('currentAddressMonths')?.value || '';
    const jobYears = document.getElementById('currentJobYears')?.value || '';
    const jobMonthValue = document.getElementById('currentJobMonths')?.value || '';
    const addressStarted = addressYears !== '' || addressMonthValue !== '';
    const jobStarted = jobYears !== '' || jobMonthValue !== '';
    const addressMonths = durationMonths(addressYears, addressMonthValue);
    const jobMonths = durationMonths(jobYears, jobMonthValue);

    syncConditionalBlock('previousAddressBlock', addressStarted && addressMonths < 24);
    syncConditionalBlock('previousEmploymentBlock', jobStarted && jobMonths < 24);
  }

  ['currentAddressYears', 'currentAddressMonths', 'currentJobYears', 'currentJobMonths'].forEach((id) => {
    document.getElementById(id)?.addEventListener('input', updateConditionalSections);
  });
  updateConditionalSections();


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

    const airtablePromise = fetch(`${API_BASE}/lead`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(buildAirtablePayload(fd))
    });
    const formspreePromise = fetch(form.action, {
      method: 'POST',
      body: fd,
      headers: { Accept: 'application/json' }
    });

    const [airtableResult, formspreeResult] = await Promise.allSettled([
      airtablePromise,
      formspreePromise
    ]);
    const airtableOk = airtableResult.status === 'fulfilled' && airtableResult.value.ok;
    const formspreeOk = formspreeResult.status === 'fulfilled' && formspreeResult.value.ok;

    if (!airtableOk) {
      console.warn(
        'Airtable lead failed:',
        airtableResult.status === 'rejected' ? airtableResult.reason : airtableResult.value.status
      );
    }
    if (!formspreeOk) {
      console.warn(
        'Formspree email copy failed:',
        formspreeResult.status === 'rejected' ? formspreeResult.reason : formspreeResult.value.status
      );
    }

    if (airtableOk || formspreeOk) {
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
