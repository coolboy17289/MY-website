import puppeteer from 'puppeteer';

const URL = 'http://localhost:4180/';
const browser = await puppeteer.launch({
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

const errors = [];
const failed = [];
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text());
});
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message));
page.on('requestfailed', (r) => failed.push(r.url() + ' ' + (r.failure()?.errorText || '')));

await page.goto(URL, { waitUntil: 'networkidle0', timeout: 30000 });
// Wait for router to assemble sections + loader to hide.
await new Promise((r) => setTimeout(r, 1500));

const stats = await page.evaluate(() => {
  const sections = document.querySelectorAll('.section[data-section]').length;
  const navLinks = document.querySelectorAll('.nav-link[data-section]').length;
  const reveals = document.querySelectorAll('[data-reveal]').length;
  const revealed = document.querySelectorAll('[data-reveal].is-revealed').length;
  const cursor = !!document.querySelector('.cursor-ring');
  const cursorNone = document.documentElement.classList.contains('cursor-none');
  const heroName = (document.querySelector('.hero-name')?.textContent || '').trim();
  const title = document.title;
  const loaderHidden = document.getElementById('loader')?.style.display === 'none' || document.getElementById('loader')?.classList.contains('hidden');
  return { sections, navLinks, reveals, revealed, cursor, cursorNone, heroName, title, loaderHidden };
});

await page.screenshot({ path: '/tmp/site-hero.png', fullPage: false });

// Scroll to the Skills section and screenshot.
await page.evaluate(() => document.getElementById('skills')?.scrollIntoView());
await new Promise((r) => setTimeout(r, 1200));
await page.screenshot({ path: '/tmp/site-skills.png', fullPage: false });

const stats2 = await page.evaluate(() => ({
  revealed: document.querySelectorAll('[data-reveal].is-revealed').length,
  activeNav: document.querySelector('.nav-link.active')?.getAttribute('data-section') || null,
  progress: document.querySelector('.scroll-progress-bar')?.style.transform || '',
}));

console.log('STATS', JSON.stringify(stats));
console.log('STATS2', JSON.stringify(stats2));
console.log('ERRORS', JSON.stringify(errors, null, 2));
console.log('FAILED', JSON.stringify(failed, null, 2));
await browser.close();