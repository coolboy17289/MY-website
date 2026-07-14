// app.js
// Theme toggle (localStorage + system preference), footer year, and loader hide.
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

  // Hide loader once everything is loaded
  window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (!loader) return;
    loader.classList.add('hidden');
    // Also fade the loader out after the class change so the .hidden transition
    // has a chance to play.
    window.setTimeout(() => {
      loader.style.display = 'none';
    }, 600);
  });
})();
