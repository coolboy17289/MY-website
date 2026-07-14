// router.js
// Hash-based single-page router. Owns the canonical page list, builds the
// navigation, fetches the requested page's .txt file, parses it, and renders
// the result into <main id="main-content">.
//
// Routing model: hash-only (e.g. `#about`). Works on any static host without
// server rewrites, and matches the welcome.txt instruction that "the filename
// becomes the page's address".
(() => {
  'use strict';

  // The canonical page list. Add new entries here when you add new .txt files
  // to /pages — slug is what appears in the URL, file is the path that gets
  // fetched (URL-encoded automatically by encodeURI).
  const PAGES = [
    {
      slug: 'welcome',
      title: 'Welcome',
      icon: 'fa-house',
      file: 'pages/welcome.txt'
    },
    {
      slug: 'about',
      title: 'About',
      icon: 'fa-user',
      file: 'pages/about.txt'
    },
    {
      slug: 'now',
      title: 'Now',
      icon: 'fa-clock',
      file: 'pages/now.txt'
    },
    {
      slug: 'robotics-history',
      title: 'Robotics',
      icon: 'fa-microchip',
      file: 'pages/robotics history.txt'
    }
  ];

  const DEFAULT_SLUG = 'welcome';

  // Derive a URL slug from a .txt filename. Used as a fallback so any file
  // added later in /pages can be addressed by its own filename.
  const slugFromFilename = (name) =>
    name
      .replace(/\.txt$/i, '')
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

  const getRequestedSlug = () => {
    const raw = (location.hash || '').replace(/^#\/?/, '').trim().toLowerCase();
    return raw || DEFAULT_SLUG;
  };

  const findPage = (slug) => PAGES.find((p) => p.slug === slug) || null;

  const setActiveNav = (slug) => {
    document.querySelectorAll('[data-slug]').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-slug') === slug);
    });
  };

  const buildNav = () => {
    const list = document.getElementById('navMenu');
    if (!list) return;
    list.innerHTML = PAGES.map(
      (p) =>
        '<li>' +
          '<a href="#' + escapeAttr(p.slug) + '" class="nav-link" data-slug="' + escapeAttr(p.slug) + '">' +
            '<i class="fas ' + escapeAttr(p.icon) + '" aria-hidden="true"></i>' +
            '<span>' + escapeText(p.title) + '</span>' +
          '</a>' +
        '</li>'
    ).join('');
  };

  const escapeText = (s) =>
    String(s).replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]));

  const escapeAttr = escapeText;

  // Only one render is allowed in flight at a time. If the user navigates while
  // a previous fetch hasn't resolved, we abort it so the new render writes the
  // latest content (not stale content from the older request).
  let inflight = null;

  const renderPage = async () => {
    const main = document.getElementById('main-content');
    if (!main) return;

    // Cancel any prior render
    if (inflight) inflight.abort();
    const controller = new AbortController();
    inflight = controller;

    const requested = getRequestedSlug();
    const page = findPage(requested) || findPage(DEFAULT_SLUG);

    setActiveNav(page.slug);

    main.classList.add('is-loading');
    main.setAttribute('aria-busy', 'true');

    try {
      const url = encodeURI(page.file);
      const res = await fetch(url, { cache: 'no-cache', signal: controller.signal });
      if (!res.ok) throw new Error('Failed to load ' + page.file + ' (' + res.status + ')');
      const text = await res.text();
      if (!window.LihanParse) throw new Error('Parser not loaded.');

      // Even though we received a body, check again that we weren't superseded.
      if (controller.signal.aborted) return;

      const body = window.LihanParse.parse(text);
      main.innerHTML =
        '<article class="page page-' + escapeAttr(page.slug) + '">' +
          body +
        '</article>';

      document.title = page.title + ' — Lihan.dev';

      // Reset scroll for the new page
      window.scrollTo(0, 0);
    } catch (err) {
      // Silently swallow our own aborts — they are expected on rapid nav.
      if (err && err.name === 'AbortError') return;
      main.innerHTML =
        '<article class="page page-error">' +
          '<h1>Could not load this page</h1>' +
          '<p>' + escapeText(err && err.message ? err.message : String(err)) + '</p>' +
        '</article>';
      document.title = 'Error — Lihan.dev';
    } finally {
      if (inflight === controller) inflight = null;
      main.removeAttribute('aria-busy');
      // Trigger fade-in on the next frame so the transition runs. Skip if we
      // were aborted — the new render will own the loading state.
      if (!controller.signal.aborted) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => main.classList.remove('is-loading'));
        });
      }
    }
  };

  // Public surface
  window.LihanPages = PAGES;
  window.LihanRouter = {
    slugFromFilename,
    PAGES,
    DEFAULT_SLUG
  };

  const init = () => {
    buildNav();
    renderPage();
  };

  window.addEventListener('hashchange', renderPage);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();
