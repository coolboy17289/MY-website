import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

// Vite config — repo root is the project root, so Vercel auto-detects this as
// a Vite site with zero extra configuration. The Tailwind v4 plugin compiles
// `src/styles.css` (which `@import "tailwindcss"`) into the final stylesheet.
export default defineConfig({
  plugins: [tailwindcss()],
  // Keep asset hashing paths predictable; the router fetches /pages/*.txt from
  // public/, which Vite copies to dist/ at the root regardless of base.
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});