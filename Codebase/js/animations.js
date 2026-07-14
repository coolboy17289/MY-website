// Typing effect
(() => {
  const el = document.getElementById('typingText');
  if (!el) return;

  const roles = ['Web Developer', 'UI Designer', 'Linux Enthusiast', 'Software Engineer'];
  let roleIdx = 0, charIdx = 0, deleting = false;

  const tick = () => {
    const role = roles[roleIdx];
    el.textContent = role.slice(0, charIdx);

    if (!deleting && charIdx < role.length)      { charIdx++; setTimeout(tick, 90); }
    else if (deleting && charIdx > 0)           { charIdx--; setTimeout(tick, 45); }
    else {
      deleting = !deleting;
      if (!deleting) roleIdx = (roleIdx + 1) % roles.length;
      setTimeout(tick, deleting ? 80 : 1400);
    }
  };
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) tick();
  else el.textContent = roles[0];
})();

// Floating particles (Anime.js)
(() => {
  const container = document.getElementById('particles');
  if (!container || typeof anime === 'undefined') return;

  const COUNT = 22;
  const dots = [];
  for (let i = 0; i < COUNT; i++) {
    const d = document.createElement('div');
    d.className = 'particle';
    d.style.left = (Math.random() * 100) + '%';
    d.style.top  = (Math.random() * 100) + '%';
    const size  = 2 + Math.random() * 4;
    d.style.width = d.style.height = size + 'px';
    d.style.opacity = (0.25 + Math.random() * 0.5).toFixed(2);
    container.appendChild(d);
    dots.push(d);
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  anime({
    targets: dots,
    translateY: () => anime.random(-40, 40),
    translateX: () => anime.random(-40, 40),
    duration:   () => anime.random(2200, 4200),
    easing: 'easeInOutSine',
    direction: 'alternate',
    loop: true,
    delay: () => anime.random(0, 1500)
  });
})();

// Reveal-on-scroll for sections (lightweight)
(() => {
  const els = document.querySelectorAll('.section-title, .skill-card, .project-card, .contact-box');
  if (!('IntersectionObserver' in window)) return;
  els.forEach(el => el.style.opacity = '0');
  els.forEach(el => el.style.transform = 'translateY(20px)');
  els.forEach(el => el.style.transition = 'opacity .6s ease, transform .6s ease');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = '1';
        e.target.style.transform = 'translateY(0)';
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.15 });

  els.forEach(el => io.observe(el));
})();
