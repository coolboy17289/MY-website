// Theme toggle (localStorage + system preference)
(() => {
  const root = document.documentElement;
  const btn  = document.getElementById('themeToggle');
  const icon = btn.querySelector('i');
  const KEY  = 'theme';

  const apply = (theme) => {
    root.setAttribute('data-theme', theme);
    btn.setAttribute('aria-pressed', String(theme === 'light'));
    btn.setAttribute('aria-label',
      theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
    icon.className = theme === 'light' ? 'fas fa-sun' : 'fas fa-moon';
  };

  const stored = localStorage.getItem(KEY);
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  apply(stored || (prefersLight ? 'light' : 'dark'));

  btn.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    apply(next);
    localStorage.setItem(KEY, next);
  });
})();

// Footer year
document.getElementById('year').textContent = new Date().getFullYear();

// Hide loader once everything is ready
window.addEventListener('load', () => {
  document.getElementById('loader')?.classList.add('hidden');
});
