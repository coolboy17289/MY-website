import puppeteer from 'puppeteer';

const URL = 'http://localhost:4180/';
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const errors = [];
const notFound = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('response', (r) => { if (r.status() === 404) notFound.push(r.url()); });

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
await new Promise((r) => setTimeout(r, 1500));

const stats = await page.evaluate(() => ({
  sections: document.querySelectorAll('.section[data-section]').length,
  navLinks: document.querySelectorAll('.nav-link[data-section]').length,
  reveals: document.querySelectorAll('[data-reveal]').length,
  revealed: document.querySelectorAll('[data-reveal].is-revealed').length,
  cursor: !!document.querySelector('.cursor-ring'),
  cursorNone: document.documentElement.classList.contains('cursor-none'),
  heroName: (document.querySelector('.hero-name')?.textContent || '').trim(),
  title: document.title,
  theme: document.documentElement.getAttribute('data-theme'),
  loaderHidden: document.getElementById('loader')?.classList.contains('hidden'),
}));
await page.screenshot({ path: '/tmp/site-hero.png' });

// Scroll through to trigger reveals + scroll-spy, screenshot skills.
await page.evaluate(() => document.getElementById('skills')?.scrollIntoView());
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: '/tmp/site-skills.png' });
const stats2 = await page.evaluate(() => ({
  revealed: document.querySelectorAll('[data-reveal].is-revealed').length,
  activeNav: document.querySelector('.nav-link.active')?.getAttribute('data-section') || null,
  progress: document.querySelector('.scroll-progress-bar')?.style.transform || '',
}));

// Test theme toggle -> light mode screenshot.
await page.click('#themeToggle');
await new Promise((r) => setTimeout(r, 600));
await page.evaluate(() => document.getElementById('hero')?.scrollIntoView());
await new Promise((r) => setTimeout(r, 600));
await page.screenshot({ path: '/tmp/site-light.png' });
const themeAfter = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

console.log('STATS', JSON.stringify(stats));
console.log('STATS2', JSON.stringify(stats2));
console.log('THEME_AFTER_TOGGLE', themeAfter);
console.log('ERRORS', JSON.stringify(errors, null, 2));
console.log('NOTFOUND', JSON.stringify(notFound, null, 2));
await browser.close();