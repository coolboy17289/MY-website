// cursor.js
// Glowing custom cursor: a small dot that follows the pointer exactly and a
// larger ring that follows with easing (lerp). Hovering interactive elements
// grows the ring and floods it with the brand red. anime.js drives the hover
// pulse and a click ripple. Touch devices and reduced-motion keep the native
// cursor — the custom one is never created for them.
import { animate } from 'animejs';

(() => {
  'use strict';

  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mqCoarse = window.matchMedia('(pointer: coarse)');
  if (mqReduce.matches || mqCoarse.matches) return;

  const INTERACTIVE = 'a, button, .skill-card, .btn-link, [data-cursor], input, textarea, select, summary';

  const dot = document.createElement('div');
  dot.className = 'cursor-dot';
  const ring = document.createElement('div');
  ring.className = 'cursor-ring';

  document.body.appendChild(dot);
  document.body.appendChild(ring);
  document.documentElement.classList.add('cursor-none');

  let tx = window.innerWidth / 2;
  let ty = window.innerHeight / 2;
  let rx = tx;
  let ry = ty;
  let ready = false;
  let visible = false;

  const place = (el, x, y) => {
    el.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
  };

  const loop = () => {
    // Ease the ring toward the pointer; the dot tracks instantly (set in the
    // mousemove handler) for a sharp lead + soft trail feel.
    rx += (tx - rx) * 0.18;
    ry += (ty - ry) * 0.18;
    place(ring, rx, ry);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);

  window.addEventListener('mousemove', (e) => {
    tx = e.clientX;
    ty = e.clientY;
    place(dot, tx, ty);
    if (!ready) {
      ready = true;
      document.documentElement.classList.add('cursor-ready');
    }
    if (!visible) visible = true;
  });

  // Hide the cursor when the pointer leaves the window.
  document.addEventListener('mouseleave', () => {
    dot.style.opacity = '0';
    ring.style.opacity = '0';
    visible = false;
  });
  document.addEventListener('mouseenter', () => {
    if (ready) {
      dot.style.opacity = '';
      ring.style.opacity = '';
      visible = true;
    }
  });

  // Hover detection via delegation. The ring grows via CSS (.cursor-ring.cursor-hover);
  // anime.js adds a quick scale pulse on enter for extra life.
  const grow = (on) => {
    ring.classList.toggle('cursor-hover', on);
    if (on) {
      animate(ring, {
        scale: [0.85, 1],
        duration: 320,
        easing: 'outElastic',
      });
    }
  };

  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(INTERACTIVE)) grow(true);
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(INTERACTIVE) && !e.relatedTarget?.closest?.(INTERACTIVE)) {
      grow(false);
    }
  });

  // Press feedback + a short ripple on click.
  document.addEventListener('mousedown', () => {
    dot.classList.add('cursor-down');
    animate(ring, { scale: 0.82, duration: 120, easing: 'outQuad' });
  });
  document.addEventListener('mouseup', () => {
    dot.classList.remove('cursor-down');
    animate(ring, { scale: 1, duration: 220, easing: 'outElastic' });
  });
})();