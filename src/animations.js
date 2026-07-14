// animations.js
// Reveal-on-scroll driven by anime.js v4, plus the scroll-progress bar and a
// small global API (`window.LihanScroll`) so future advanced effects (parallax,
// scroll-linked transitions) have something to hook into.
//
// Elements tagged [data-reveal] start hidden (see animations.css, gated by
// `html.js`) and animate in — opacity + translateY + blur, with an optional
// per-element stagger via [data-reveal-delay="N"] (ms) — when the Intersection
// Observer fires. Reduced-motion users get an instant `.is-revealed` lock.
import { animate, stagger } from 'animejs';

(() => {
  'use strict';

  const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduce = () => !!(mq && mq.matches);

  // Track reduced-motion preference on <html>; CSS selectors can use it too.
  const applyMotionClass = () => {
    document.documentElement.classList.toggle('reduced-motion', reduce());
  };
  if (mq) {
    applyMotionClass();
    if (mq.addEventListener) mq.addEventListener('change', applyMotionClass);
  }

  // Animate a single reveal element in. anime.js sets inline styles, so the
  // CSS hidden state is overridden once this runs.
  const revealOne = (el) => {
    if (el.classList.contains('is-revealed')) return;
    const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10) || 0;
    animate(el, {
      opacity: [0, 1],
      translateY: [18, 0],
      filter: ['blur(5px)', 'blur(0px)'],
      duration: 760,
      delay,
      easing: 'outCubic',
      onComplete: () => el.classList.add('is-revealed'),
    });
  };

  const attachRevealObserver = (els) => {
    if (!els || !els.length) return;
    if (reduce() || !('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          revealOne(e.target);
          observer.unobserve(e.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => observer.observe(el));
  };

  // Staggered entrance for the skill cards — they aren't [data-reveal] so the
  // grid reveal (on .section-body) doesn't animate them individually. This
  // gives the tiles their own cascade when the Skills section scrolls in.
  const attachSkillCardObserver = () => {
    const cards = document.querySelectorAll('.skill-card');
    if (!cards.length) return;
    if (reduce() || !('IntersectionObserver' in window)) {
      cards.forEach((c) => (c.style.opacity = '1'));
      return;
    }
    // Start hidden so the cascade has somewhere to come from.
    cards.forEach((c) => (c.style.opacity = '0'));
    const grid = cards[0].closest('.skills-grid') || cards[0].parentElement;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          animate(cards, {
            opacity: [0, 1],
            translateY: [16, 0],
            scale: [0.92, 1],
            duration: 640,
            delay: stagger(70),
            easing: 'outCubic',
          });
          observer.disconnect();
        });
      },
      { threshold: 0.2 }
    );
    if (grid) observer.observe(grid);
  };

  const scan = () => {
    attachRevealObserver(document.querySelectorAll('[data-reveal]:not(.is-revealed)'));
    attachSkillCardObserver();
  };

  // Initial scan (sections injected by router.js may already be present).
  scan();

  // router.js fires `lihan:ready` once every section has been assembled.
  document.addEventListener('lihan:ready', scan);

  // Catch reveal elements injected after load (defensive; router is the source).
  if ('MutationObserver' in window) {
    const mo = new MutationObserver(() => {
      const fresh = document.querySelectorAll('[data-reveal]:not(.is-revealed)');
      if (fresh.length) attachRevealObserver(fresh);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // Scroll-progress bar --------------------------------------------------
  const progressEl = document.getElementById('scrollProgress');
  if (progressEl) {
    const bar = progressEl.querySelector('.scroll-progress-bar');
    const update = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      if (bar) bar.style.transform = 'scaleX(' + progress.toFixed(4) + ')';
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
    update();
  }

  // Header shadow once the page is scrolled.
  const header = document.getElementById('header');
  if (header) {
    const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Public scroll API for downstream effects.
  window.LihanScroll = (() => {
    let last = { t: performance.now(), y: window.scrollY };
    const tick = () => {
      last = { t: performance.now(), y: window.scrollY };
    };
    window.addEventListener('scroll', () => {
      if (!window.LihanScroll._ticking) {
        window.requestAnimationFrame(() => {
          tick();
          window.LihanScroll._ticking = false;
        });
        window.LihanScroll._ticking = true;
      }
    }, { passive: true });

    return {
      progress: () => {
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        return docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
      },
      position: () => window.scrollY,
      velocity: () => {
        const now = performance.now();
        const dt = now - last.t;
        const dy = window.scrollY - last.y;
        return dt > 0 ? (dy / dt) * 1000 : 0;
      },
      onScroll: (fn) => {
        const wrapped = () => window.requestAnimationFrame(fn);
        window.addEventListener('scroll', wrapped, { passive: true });
        return () => window.removeEventListener('scroll', wrapped);
      },
      sectionInView: (slug) => {
        const el = document.getElementById(slug);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.5 && rect.bottom > window.innerHeight * 0.2;
      }
    };
  })();
})();