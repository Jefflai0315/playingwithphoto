import { chromium, devices } from 'playwright';

const url = process.env.URL || 'http://localhost:5173/';
const browser = await chromium.launch();
const context = await browser.newContext({ ...devices['Galaxy S9+'] });
const page = await context.newPage();

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30_000 });
await page.waitForTimeout(1500);

const samples = await page.evaluate(async () => {
  const nav = document.getElementById('topnav');
  const bar = document.getElementById('mobileBookBar');
  const fab = document.getElementById('waFab');
  const steps = [0, 400, 1200, 2400, 4000, 6000, 8000, 10000];
  const out = [];

  for (const y of steps) {
    window.scrollTo(0, y);
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const nr = nav?.getBoundingClientRect();
    const br = bar?.getBoundingClientRect();
    const fr = fab?.getBoundingClientRect();
    out.push({
      y,
      nav: nr ? { h: nr.height, w: nr.width, top: nr.top } : null,
      bar: br ? { h: br.height, w: br.width, bottom: br.bottom } : null,
      fab: fr ? { h: fr.height, w: fr.width, bottom: fr.bottom } : null,
      innerH: window.innerHeight,
      vvh: window.visualViewport?.height,
    });
  }
  return out;
});

console.table(samples);
await browser.close();
