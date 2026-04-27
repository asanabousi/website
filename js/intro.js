/* ================================================
   UNFAZED MOTORS — Intro Animation Driver
   Desktop: scroll-driven
   Mobile: skip intro for iPhone Safari safety
   ================================================ */

   (function () {
    const intro = document.getElementById('intro');
    const spacer = document.getElementById('introSpacer');
    if (!intro || !spacer) return;
  
    function skipIntro() {
      intro.remove();
      spacer.remove();
      document.documentElement.classList.remove('has-intro');
      document.documentElement.classList.add('intro-done');
      document.body.style.overflow = '';
    }
  
    // iPhone / iPad / Android: skip intro completely
    const isTouch =
      window.matchMedia &&
      window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  
    if (isTouch) {
      skipIntro();
      return;
    }
  
    // Reduced motion: skip intro
    if (
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      skipIntro();
      return;
    }
  
    const helmetSrc = intro.querySelector('.intro-helmet')?.src;
    const damagedSrc = intro.querySelector('.intro-helmet-damaged')?.src;
    const sources = [helmetSrc, damagedSrc].filter(Boolean);
  
    let loaded = 0;
    let started = false;
  
    function maybeStart() {
      if (started) return;
      started = true;
      startAnim();
    }
  
    function startAnim() {
      document.documentElement.classList.add('has-intro');
  
      if (history.scrollRestoration) {
        history.scrollRestoration = 'manual';
      }
  
      window.scrollTo(0, 0);
  
      let done = false;
      let raf = null;
  
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
  
      function schedule() {
        if (raf == null) raf = requestAnimationFrame(tick);
      }
  
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      tick();
  
      // Safety fallback so desktop never gets stuck either
      setTimeout(() => {
        document.documentElement.classList.add('intro-done');
        intro.classList.add('done');
      }, 7000);
    }
  
    if (sources.length === 0) {
      maybeStart();
    } else {
      sources.forEach(src => {
        const img = new Image();
  
        img.onload = () => {
          loaded++;
          if (loaded >= sources.length) maybeStart();
        };
  
        img.onerror = () => {
          loaded++;
          if (loaded >= sources.length) maybeStart();
        };
  
        img.src = src;
      });
  
      setTimeout(maybeStart, 2500);
    }
  })();