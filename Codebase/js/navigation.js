// Mobile menu
(() => {
  const toggle = document.getElementById('mobileMenuToggle');
  const menu   = document.getElementById('navMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', String(open));
  });

  // Close menu when a link is tapped (mobile)
  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (menu.classList.contains('open')) {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Close on Escape + return focus
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
    }
  });
})();

// Active section on scroll
(() => {
  const sections = document.querySelectorAll('main section[id]');
  const links    = document.querySelectorAll('.nav-link');
  if (!sections.length) return;

  const setActive = (id) => {
    links.forEach(l => l.classList.toggle('active', l.dataset.section === id));
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id); });
  }, { rootMargin: '-50% 0px -50% 0px', threshold: 0 });

  sections.forEach(s => observer.observe(s));
})();

// Header shadow on scroll
(() => {
  const header = document.getElementById('header');
  if (!header) return;
  const onScroll = () => {
    header.style.boxShadow = window.scrollY > 8 ? '0 4px 20px rgba(0,0,0,0.25)' : 'none';
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
