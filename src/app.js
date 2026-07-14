// app.js
// Theme toggle (dark/light), footer year, and the loader hide (which is
// driven by the `lihan:ready` event from router.js once the single-page has
// been assembled, with a fallback timeout for safety).
(() => {
  'use strict';

  // Theme toggle
  const root = document.documentElement;
  const btn = document.getElementById('themeToggle');
  if (btn) {
    const icon = btn.querySelector('i');
    const KEY = 'theme';

    const apply = (theme) => {
      root.setAttribute('data-theme', theme);
      btn.setAttribute('aria-pressed', String(theme === 'light'));
      btn.setAttribute('aria-label',
        theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      if (icon) icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
    };

    const stored = localStorage.getItem(KEY);
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
    apply(stored || (prefersLight ? 'light' : 'dark'));

    btn.addEventListener('click', () => {
      const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      apply(next);
      localStorage.setItem(KEY, next);
    });
  }

  // Footer year
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // Loader hide after the single page is ready.
  const hideLoader = () => {
    const loader = document.getElementById('loader');
    if (!loader || loader.classList.contains('hidden')) return;
    loader.classList.add('hidden');
    setTimeout(() => { loader.style.display = 'none'; }, 600);
  };

  // Router.js fires `lihan:ready` once every section has been assembled.
  document.addEventListener('lihan:ready', hideLoader);

  // Fallback in case the event never fires (network error / file:// browsing).
  setTimeout(hideLoader, 5000);
})();