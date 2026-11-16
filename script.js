(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  // Current year
  const year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  // Compact mobile navigation
  const menuButton = $('.menu-toggle');
  const nav = $('.nav');
  const closeMenu = () => {
    nav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton?.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
  };
  menuButton?.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    nav?.classList.toggle('open', open);
    document.body.classList.toggle('menu-open', open);
  });
  $$('.nav a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  document.addEventListener('click', event => {
    if (nav?.classList.contains('open') && !nav.contains(event.target) && !menuButton?.contains(event.target)) closeMenu();
  });


  // Consistent anchor scrolling: account for the sticky header instead of
  // relying on the browser's default hash alignment.
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href*="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    let destination;
    try { destination = new URL(link.href, window.location.href); } catch { return; }
    const normalizePath = path => path.length > 1 ? path.replace(/\/+$/, '') : path;
    if (destination.origin !== window.location.origin || normalizePath(destination.pathname) !== normalizePath(window.location.pathname) || !destination.hash) return;
    const id = decodeURIComponent(destination.hash.slice(1));
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    if (window.location.hash !== destination.hash) history.pushState(null, '', destination.hash);
    const stickyHeader = document.querySelector('.header');
    const headerHeight = stickyHeader ? stickyHeader.getBoundingClientRect().height : 0;
    const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 22;
    window.scrollTo({ top: Math.max(0, top), behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  // Reveal content as it enters view. No layout measurements are done per frame.
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = $$('.section-head, .service-item, .price-card, .steps article, .faq-list details, .contact-copy, .lead-form, .closing-inner');
  revealTargets.forEach((el, index) => {
    el.classList.add('reveal');
    if (index % 4) el.classList.add(`reveal-delay-${index % 4}`);
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    revealTargets.forEach(el => observer.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('is-visible'));
  }

  // FAQ accordion: keep one answer open at a time.
  const faqItems = $$('.faq-list details');
  faqItems.forEach(item => item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqItems.forEach(other => { if (other !== item) other.open = false; });
  }));

  // Service and package links prefill the enquiry form.
  const serviceField = $('#service');
  const messageField = $('#message');
  $$('[data-service], [data-package]').forEach(link => {
    link.addEventListener('click', () => {
      const service = link.dataset.service;
      const packageName = link.dataset.package;
      if (serviceField && service) serviceField.value = service;
      if (messageField && packageName) {
        const prefix = `I'm interested in the ${packageName} package.`;
        if (!messageField.value.trim() || !messageField.value.includes(prefix)) {
          messageField.value = `${prefix}\n\n${messageField.value}`.trim();
        }
      }
    });
  });

  // Prepare an email without pretending the site has a server-side form backend.
  $('#lead-form')?.addEventListener('submit', event => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries());
    const subject = encodeURIComponent(`Nexwith enquiry — ${data.service}`);
    const body = encodeURIComponent(
      `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone || 'Not provided'}\nService: ${data.service}\n\nProject details:\n${data.message}`
    );
    const note = $('#form-note');
    if (note) note.textContent = 'Opening your email application with the enquiry details…';
    window.location.href = `mailto:nexwith@gmail.com?subject=${subject}&body=${body}`;
  });

  // Show the mobile contact bar after the hero has moved out of view.
  const mobileCta = $('.mobile-contact');
  const hero = $('.hero');
  if (mobileCta && hero && 'IntersectionObserver' in window) {
    const heroObserver = new IntersectionObserver(([entry]) => {
      mobileCta.classList.toggle('visible', !entry.isIntersecting);
    }, { threshold: 0.05 });
    heroObserver.observe(hero);
  }

  // Pointer parallax removed: keep the hero responsive without continuous pointer work.})();
