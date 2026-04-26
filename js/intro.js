/* ================================================
   UNFAZED MOTORS — Intro Animation Driver
   Drives --p CSS variable from scroll progress.
   Preloads both helmet images before starting.
   ================================================ */

(function () {
  const intro = document.getElementById('intro');
  const spacer = document.getElementById('introSpacer');
  if (!intro || !spacer) return;

  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    intro.remove();
    spacer.remove();
    return;
  }

  // Preload both helmet images before starting the animation
  const helmetSrc = intro.querySelector('.intro-helmet')?.src;
  const damagedSrc = intro.querySelector('.intro-helmet-damaged')?.src;
  let loaded = 0;
  const total = [helmetSrc, damagedSrc].filter(Boolean).length;

  function startAnim() {
    document.documentElement.classList.add('has-intro');
    if (history.scrollRestoration) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);

    let done = false;
    function tick() {
      const rect = spacer.getBoundingClientRect();
      // Use clientHeight for iOS Safari viewport measurement accuracy
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

    // Safety fallback: ensure site appears after 12s regardless
    setTimeout(() => {
      document.documentElement.classList.add('intro-done');
      intro.classList.add('done');
    }, 12000);
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
    // Start anyway if images take more than 2s
    setTimeout(maybeStart, 2000);
  }
})();
