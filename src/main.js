// main.js
// Vite entry point. Side-effect-imports the behaviour scripts and exposes the
// parser on `window.LihanParse` so the various IIFE scripts can look it up
// without an ESM refactor.
//
// The stylesheet is loaded via <link> in index.html (href="/src/styles.css"),
// which Vite runs through the Tailwind v4 plugin. It is NOT imported here so
// the CSS isn't bundled twice.
import { parse } from './parser.js';
window.LihanParse = { parse };

// Side-effect imports — each one registers its own behaviour against window.
import './router.js';
import './app.js';
import './navigation.js';
import './animations.js';
import './cursor.js';
