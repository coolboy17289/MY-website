// navigation.js
// Mobile menu behaviour: open/close, close on link tap, close on Escape.
(() => {
  'use strict';

  const toggle = document.getElementById('mobileMenuToggle');
  const menu = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => {
    setOpen(!menu.classList.contains('open'));
  });

  // Close when any nav link is tapped (especially useful on mobile).
  menu.addEventListener('click', (e) => {
    const link = e.target.closest('.nav-link');
    if (link && menu.classList.contains('open')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      setOpen(false);
      toggle.focus();
    }
  });

  // Close when the URL fragment changes (back/forward, direct link, etc.).
  window.addEventListener('hashchange', () => {
    if (menu.classList.contains('open')) setOpen(false);
  });
})();
