// animations.js
// Light reveal-on-scroll for page sub-elements using IntersectionObserver.
// Anime.js particles were removed: package.json lists animejs@^4 which has a
// different API (named exports) and requires a build step, which the project
// does not have.
(() => {
  'use strict';

  const reduceMotion =
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) return;

  const observe = () => {
    const main = document.getElementById('main-content');
    if (!main) return;
    const els = main.querySelectorAll('.page h1, .page h2, .page p, .page ul, .page .btn-link, .page hr');
    els.forEach((el) => el.classList.add('reveal'));

    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('reveal-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    els.forEach((el) => io.observe(el));
  };

  // Re-observe after each route render so freshly injected elements reveal.
  window.addEventListener('hashchange', () => {
    requestAnimationFrame(observe);
  });

  // The script runs with `defer`, so the DOM is already parsed here. A single
  // initial run is enough — we don't bind a second time on DOMContentLoaded.
  observe();
})();
