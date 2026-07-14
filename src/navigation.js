// navigation.js
// In-page navigation: smooth-scroll on anchor clicks + mobile menu behaviour.
// The single-page model means nav links are `#hero`, `#about`, etc.
(() => {
  'use strict';

  const reduceMotion = () =>
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth-scroll behaviour for any in-page anchor link.
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href === '#') return;

    const target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    target.scrollIntoView({
      behavior: reduceMotion() ? 'auto' : 'smooth',
      block: 'start'
    });

    if (history.replaceState) {
      history.replaceState(null, '', href);
    }

    // Collapse the mobile menu after navigating.
    const menu = document.getElementById('navMenu');
    const toggle = document.getElementById('mobileMenuToggle');
    if (menu && menu.classList.contains('open')) {
      menu.classList.remove('open');
      if (toggle) toggle.setAttribute('aria-expanded', 'false');
    }
  });

  // Mobile menu toggle.
  const toggle = document.getElementById('mobileMenuToggle');
  const menu = document.getElementById('navMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', () => {
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
  }
})();
