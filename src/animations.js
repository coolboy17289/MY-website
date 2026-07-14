// animations.js
// Reveal-on-scroll via IntersectionObserver, plus a scroll-progress bar and
// a small global API (`window.LihanScroll`) so future advanced animations
// (parallax, scroll-linked transitions) have something to hook into.
(() => {
  'use strict';

  const reduceMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Track reduced-motion preference on <html>; CSS selectors can use it too.
  const mq = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)');
  const applyMotionClass = () => {
    document.documentElement.classList.toggle('reduced-motion', !!mq && mq.matches);
  };
  if (mq) {
    applyMotionClass();
    if (mq.addEventListener) mq.addEventListener('change', applyMotionClass);
  }

  const attachRevealObserver = (els) => {
    if (!els || !els.length) return;
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach((el) => {
        el.classList.add('reveal', 'reveal-in');
      });
      return;
    }

    els.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        // Apply stagger via data-reveal-delay.
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target;
          const delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10);
          if (delay > 0) {
            el.style.setProperty('--reveal-delay', delay + 'ms');
          }
          el.classList.add('reveal-in');
          observer.unobserve(el);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    els.forEach((el) => observer.observe(el));
  };

  // Initial scan (parser/router already ran, but in case elements exist).
  const init = () => {
    attachRevealObserver(document.querySelectorAll('[data-reveal]'));
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // Catch reveal elements injected after load (router.js adds sections async).
  if ('MutationObserver' in window) {
    const mo = new MutationObserver(() => {
      const fresh = document.querySelectorAll('[data-reveal]:not(.reveal)');
      if (fresh.length) attachRevealObserver(fresh);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  // Scroll-progress bar
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

  // Public scroll API for downstream effects.
  window.LihanScroll = (() => {
    let last = { t: performance.now(), y: window.scrollY };
    const tick = () => {
      const now = performance.now();
      const y = window.scrollY;
      last = { t: now, y };
    };
    window.addEventListener('scroll', () => {
      // Update `last` at most once per animation frame.
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
