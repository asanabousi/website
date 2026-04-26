/* ================================================
   UNFAZED MOTORS — Shared JS (header, nav, reveals)
   ================================================ */

(function () {
  // ---- Header sticky ----
  const hdr = document.getElementById('hdr');
  if (hdr) {
    function updateHeader() {
      hdr.classList.toggle('stuck', window.scrollY > 40);
    }
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  // ---- Mobile burger menu ----
  const burger = document.querySelector('.burger');
  const mobileNav = document.getElementById('mobileNav');
  if (burger && mobileNav) {
    burger.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('open');
      burger.classList.toggle('open', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burger.classList.remove('open');
        document.body.style.overflow = '';
      });
    });
  }

  // ---- Active nav link ----
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav a, .mobile-nav a').forEach(a => {
    const href = a.getAttribute('href');
    if (!href) return;
    const hrefBase = href.split('#')[0].split('/').pop() || 'index.html';
    if (hrefBase === currentPath) a.classList.add('active');
  });

  // ---- Reveal on scroll ----
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // ---- Smooth scroll for same-page anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      if (!id) return;
      const target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      const y = target.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });
})();
