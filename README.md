# Lihan Badenhorst — Personal Website

A single-page portfolio and notes site. Each section (Welcome, About, Skills,
Now, Robotics) is a plain HTML file in `public/pages/`, fetched at boot and
stacked into one scrolling page with scroll-spy navigation.

## Stack

- **Vite** — dev server + static build (`dist/`)
- **Tailwind CSS v4** — via `@tailwindcss/vite`, configured CSS-first in `src/styles.css` (`@theme`)
- **anime.js v4** — scroll-reveal animations and the custom-cursor pulse (ESM imports)
- **Custom cursor** — glowing dot + easing ring with hover-grow on interactive elements (`src/cursor.js`)
- Hand-written CSS for the page/section/skill-card components (`src/css/`)
- No framework — a few small vanilla-JS modules

## Project layout

```
index.html              # Vite entry; loads /src/main.js and /src/styles.css
vite.config.js          # @tailwindcss/vite plugin
vercel.json             # Vite framework preset + SPA rewrite + cache headers
src/
  main.js               # imports styles + boots the IIFE modules, exposes parser
  styles.css            # @import "tailwindcss" + the site CSS + @theme/cursor/aurora
  parser.js             # legacy .txt->HTML parser (kept; HTML pages don't use it)
  router.js             # fetches public/pages/*.html, builds sections, scroll-spy
  app.js                # theme toggle, footer year, loader hide
  navigation.js         # smooth-scroll anchors + mobile menu
  animations.js         # anime.js reveal-on-scroll, scroll-progress bar, scroll API
  cursor.js             # glowing custom cursor with hover detection
  css/                  # style.css, animations.css, responsive.css
public/
  pages/                # welcome.html, about.html, skills.html, now.html, robotics-history.html
```

## Develop

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # outputs dist/
npm run preview  # serve the production build locally
```

## Deploy on Vercel

The repo root is the Vite root, so Vercel auto-detects it — no settings needed.

- **CLI:** `npm i -g vercel && vercel`
- **Dashboard:** import the GitHub repo; Framework Preset auto-selects "Vite"; Build Command `npm run build`, Output Directory `dist` (both from `vercel.json`).

`vercel.json` adds a catch-all rewrite to `/index.html` for any path that isn't a
real static file (deep links fall back to the app shell), plus long-lived
caching for hashed `/assets/*` and short caching for `/pages/*`.

## Editing pages

Each section is a standalone HTML file in `public/pages/`. The first `<h1>` in a
file becomes the section's title (the router strips it and re-renders it as the
section heading). Use the existing classes for links: `a.btn-link` for buttons,
`a.inline-link` for inline links, and the `.skills-grid` / `.skill-card` markup
for tile grids.

## Accessibility & motion

- Custom cursor is disabled on touch devices and when `prefers-reduced-motion` is set (native cursor is kept).
- Reveal animations fall back to an instant show under reduced motion.
- Skip link, focus-visible styles, and ARIA labels on nav and theme toggle.