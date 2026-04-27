/* ================================================
   UNFAZED MOTORS — Intro Animation Driver
   Desktop: scroll-driven
   Mobile (touch): auto-play 4-second timer
   ================================================ */

(function () {
  const intro = document.getElementById('intro');
  const spacer = document.getElementById('introSpacer');
  if (!intro || !spacer) return;

  // Reduced-motion users: skip
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intro.remove();
    spacer.remove();
    return;
  }

  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  // Preload helmet images
  const helmetSrc = intro.querySelector('.intro-helmet')?.src;
  const damagedSrc = intro.querySelector('.intro-helmet-damaged')?.src;
  let loaded = 0;
  const total = [helmetSrc, damagedSrc].filter(Boolean).length;

  function startAnim() {
    document.documentElement.classList.add('has-intro');
    if (history.scrollRestoration) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    if (isTouch) {
      // ---- MOBILE: auto-play timer ----
      // Spacer not needed on mobile, hide it
      spacer.style.display = 'none';
      // Animate --p from 0 to 1 over 4 seconds
      const start = performance.now();
      const duration = 4000;
      function step(now) {
        const elapsed = now - start;
        const p = Math.min(1, elapsed / duration);
        intro.style.setProperty('--p', p.toFixed(4));
        if (p < 1) {
          requestAnimationFrame(step);
        } else {
          intro.classList.add('done');
          document.documentElement.classList.add('intro-done');
          setTimeout(() => { intro.style.display = 'none'; }, 600);
        }
      }
      requestAnimationFrame(step);
      // Allow tap-to-skip
      intro.addEventListener('click', () => {
        intro.classList.add('done');
        document.documentElement.classList.add('intro-done');
        setTimeout(() => { intro.style.display = 'none'; }, 400);
      }, { once: true });
      return;
    }

    // ---- DESKTOP: scroll-driven ----
    let done = false;
    function tick() {
      const rect = spacer.getBoundingClientRect();
      const vh = document.documentElement.clientHeight;
      const scrollable = spacer.offsetHeight - vh;
      const y = Math.max(0, -rect.top);
      const p = scrollable > 0 ? Math.min(1, y / scrollable) : 1;
      intro.style.setProperty('--p', p.toFixed(4));

      const cueFill = document.getElementById('cueFill');
      if (cueFill) cueFill.style.width = (p * 100).toFixed(1) + '%';

      if (p >= 0.995 && !done) {
        done = true;
        intro.classList.add('done');
        document.documentElement.classList.add('intro-done');
      } else if (p < 0.995 && done) {
        done = false;
        intro.classList.remove('done');
        document.documentElement.classList.remove('intro-done');
      }
      raf = null;
    }

    let raf = null;
    function schedule() { if (raf == null) raf = requestAnimationFrame(tick); }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    tick();

    setTimeout(() => {
      document.documentElement.classList.add('intro-done');
      intro.classList.add('done');
    }, 5000);
  }

  let started = false;
  function maybeStart() { if (!started) { started = true; startAnim(); } }

  if (total === 0) {
    maybeStart();
  } else {
    function onLoad() { loaded++; if (loaded >= total) maybeStart(); }
    [helmetSrc, damagedSrc].filter(Boolean).forEach(src => {
      const img = new Image();
      img.onload = onLoad;
      img.onerror = onLoad;
      img.src = src;
    });
    setTimeout(maybeStart, 2000);
  }
})();
