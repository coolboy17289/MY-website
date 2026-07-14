// router.js
// Bulk assembler: loads every page in /pages once at boot, then stacks the
// results into a single-page <article id="single-page">. Each section has its
// own id, data-section, and reveal hooks so downstream scripts can drive
// scroll animations, scroll-spy, parallax, etc.
//
// Loads happen in parallel (Promise.allSettled) so a slow page doesn't block
// the others. Failures are rendered as inline error sections with a friendly
// message rather than crashing the whole site.
(() => {
  'use strict';

  // Canonical page list. Order here = how the sections stack on the page.
  // Add a new section by adding an entry; the train of header, content, and
  // nav-link works out automatically.
  const PAGES = [
    {
      slug: 'hero',
      title: 'Home',
      eyebrow: 'Welcome',
      icon: 'fa-house',
      file: 'pages/welcome.html',
      kind: 'html'
    },
    {
      slug: 'about',
      title: 'About',
      eyebrow: 'About',
      icon: 'fa-user',
      file: 'pages/about.html',
      kind: 'html'
    },
    {
      slug: 'skills',
      title: 'Skills',
      eyebrow: 'Skills',
      icon: 'fa-code',
      file: 'pages/skills.html',
      kind: 'html'
    },
    {
      slug: 'now',
      title: 'Now',
      eyebrow: 'Now',
      icon: 'fa-clock',
      file: 'pages/now.html',
      kind: 'html'
    },
    {
      slug: 'robotics-history',
      title: 'Robotics',
      eyebrow: 'Robotics',
      icon: 'fa-microchip',
      file: 'pages/robotics-history.html',
      kind: 'html'
    }
  ];

  const escapeText = (s) =>
    String(s).replace(/[<>&\"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));
  const escapeAttr = escapeText;

  const deriveSectionTitle = (slug, html) => {
    if (!html) return PAGES.find((p) => p.slug === slug)?.title || slug;
    const m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/);
    if (!m) return PAGES.find((p) => p.slug === slug)?.title || slug;
    return m[1].replace(/<[^>]+>/g, '').trim();
  };

  const stripFirstH1 = (html) =>
    String(html || '').replace(/<h1[^>]*>[\s\S]*?<\/h1>/, '').replace(/^\s+/, '');

  const fetchPage = async (page) => {
    // public/ is served at the root by Vite, so the file path is a leading
    // slash off the project root.
    const url = '/' + page.file.replace(/^\/+/, '');
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Failed to load ' + page.file + ' (' + res.status + ')');
    return res.text();
  };

  const buildNav = () => {
    const list = document.getElementById('navMenu');
    if (!list) return;
    list.innerHTML = PAGES.map(
      (p) =>
        '<li>' +
        '<a href="#' + escapeAttr(p.slug) + '" class="nav-link" data-section="' + escapeAttr(p.slug) + '">' +
        '<i class="fas ' + escapeAttr(p.icon) + '" aria-hidden="true"></i>' +
        '<span>' + escapeText(p.title) + '</span>' +
        '</a>' +
        '</li>'
    ).join('');
  };

  const buildSectionHtml = (page, processed, title) => {
    const isHero = page.slug === 'hero';
    const eyebrow = page.eyebrow || page.title;

    if (isHero) {
      return (
        '<section id="' + escapeAttr(page.slug) + '" ' +
              'class="section section-hero" ' +
              'data-section="' + escapeAttr(page.slug) + '">' +
          '<div class="section-inner hero-inner">' +
            '<header class="hero-header" data-reveal data-reveal-delay="0">' +
              '<p class="hero-eyebrow">' + escapeText(eyebrow) + '</p>' +
              '<h1 class="hero-name">' + escapeText(title) + '</h1>' +
              '<div class="hero-meta" data-reveal data-reveal-delay="120">' +
                '<span class="hero-meta-dot"></span>' +
                '<span class="hero-meta-text">Software · AI · Robotics · Web</span>' +
              '</div>' +
            '</header>' +
            '<div class="hero-body" data-reveal data-reveal-delay="220">' +
              processed +
            '</div>' +
            '<div class="hero-scroll-hint" data-reveal data-reveal-delay="320">' +
              '<span>Scroll</span>' +
              '<span class="hero-scroll-arrow" aria-hidden="true">&darr;</span>' +
            '</div>' +
          '</div>' +
        '</section>'
      );
    }

    return (
      '<section id="' + escapeAttr(page.slug) + '" ' +
            'class="section section-' + escapeAttr(page.slug) + '" ' +
            'data-section="' + escapeAttr(page.slug) + '">' +
        '<div class="section-inner">' +
          '<header class="section-header" data-reveal>' +
            '<p class="section-eyebrow">' + escapeText(eyebrow) + '</p>' +
            '<h2 class="section-title">' + escapeText(title) + '</h2>' +
          '</header>' +
          '<div class="section-body" data-reveal data-reveal-delay="80">' +
            processed +
          '</div>' +
        '</div>' +
      '</section>'
    );
  };

  const setActiveNav = (slug) => {
    document.querySelectorAll('.nav-link[data-section]').forEach((el) => {
      const isActive = el.getAttribute('data-section') === slug;
      el.classList.toggle('active', isActive);
      if (isActive) el.setAttribute('aria-current', 'true');
      else el.removeAttribute('aria-current');
    });
  };

  const setupScrollSpy = () => {
    const sections = Array.from(document.querySelectorAll('.section[data-section]'));
    if (!sections.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: highlight based on scroll position closest to top.
      const onScroll = () => {
        let best = null;
        for (const s of sections) {
          const top = s.getBoundingClientRect().top;
          if (best === null || top < best.top) best = { slug: s.dataset.section, top };
          if (top >= 0) break;
        }
        if (best) setActiveNav(best.slug);
      };
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
      return;
    }

    // Pick the section closest to the viewport's top-third. We track
    // intersecting entries; the one with the highest intersection ratio wins.
    let activeSlug = null;
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const slug = entry.target.getAttribute('data-section');
          if (slug !== activeSlug) {
            activeSlug = slug;
            setActiveNav(slug);
            document.title = (entry.target.dataset.title || sectionTitle(slug)) + ' — Lihan.dev';
          }
        }
      }
    }, { rootMargin: '-30% 0px -50% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });

    sections.forEach((s) => observer.observe(s));
  };

  const sectionTitle = (slug) => {
    const el = document.getElementById(slug);
    if (!el) return slug;
    const h = el.querySelector('.section-title, .hero-name');
    return h ? h.textContent.trim() : slug;
  };

  const init = async () => {
    buildNav();

    const article = document.getElementById('single-page');
    if (!article) return;

    const results = await Promise.allSettled(PAGES.map(fetchPage));

    PAGES.forEach((page, i) => {
      const r = results[i];
      let processed;
      if (r.status !== 'fulfilled') {
        const err = r.reason && r.reason.message ? r.reason.message : String(r.reason);
        processed = '<p class="section-error">Could not load this section: ' + escapeText(err) + '</p>';
      } else if (page.kind === 'html') {
        processed = r.value;
      } else if (window.LihanParse) {
        try {
          processed = window.LihanParse.parse(r.value);
        } catch (parseErr) {
          processed = '<p class="section-error">Parser error: ' + escapeText(parseErr.message || String(parseErr)) + '</p>';
        }
      } else {
        processed = '<p class="section-error">Parser not loaded.</p>';
      }

      const title = deriveSectionTitle(page.slug, processed);
      const bodyHtml = stripFirstH1(processed);

      // Record the resolved title on the section dataset so scroll-spy can
      // use it for document.title without re-querying.
      const inner = buildSectionHtml(page, bodyHtml, title);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = inner;
      const sectionEl = wrapper.firstElementChild;
      if (sectionEl) {
        sectionEl.dataset.title = title;
        article.appendChild(sectionEl);
      }
    });

    setupScrollSpy();
    setActiveNav('hero');

    document.dispatchEvent(new CustomEvent('lihan:ready'));
  };

  // Expose for debugging / advanced effects.
  window.LihanPages = PAGES;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
