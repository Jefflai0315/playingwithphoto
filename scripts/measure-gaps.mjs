import { chromium } from 'playwright';

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
];

for (const vp of viewports) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle', timeout: 20000 });

  const report = await page.evaluate(() => {
    const selectors = [
      '#hero',
      '#occasions',
      '#vision',
      '#samples',
      '#spark',
      '#metamorphosis',
      '#reel',
      '.story-group--film .ticker',
      '#styles',
      '#demo',
      '.story-group--trust .section-bridge',
      '#booth',
      '#testimonials',
      '#animation',
      '#addons',
      '#about',
      '#pricing',
      '#book',
    ];

    const items = selectors
      .map((sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const cs = getComputedStyle(el);
        return {
          sel,
          top: Math.round(r.top + window.scrollY),
          height: Math.round(r.height),
          bottom: Math.round(r.top + window.scrollY + r.height),
          paddingTop: cs.paddingTop,
          paddingBottom: cs.paddingBottom,
          marginTop: cs.marginTop,
          marginBottom: cs.marginBottom,
        };
      })
      .filter(Boolean);

    const gaps = [];
    for (let i = 0; i < items.length - 1; i++) {
      const a = items[i];
      const b = items[i + 1];
      const gap = b.top - a.bottom;
      if (gap > 8) gaps.push({ from: a.sel, to: b.sel, gapPx: gap });
    }

    // Large empty scroll children
    const scrollers = [...document.querySelectorAll(
      '.hero-scrub, .vision-scrub, .reel-spacer, .booth-scrub, .reel-chapter'
    )].map((el) => ({
      className: el.className,
      id: el.id || null,
      height: Math.round(el.getBoundingClientRect().height),
    }));

    return { items, gaps: gaps.sort((x, y) => y.gapPx - x.gapPx).slice(0, 12), scrollers };
  });

  console.log('\n===', vp.name, '===');
  console.log('Largest gaps between landmarks:');
  for (const g of report.gaps) console.log(`  ${g.gapPx}px  ${g.from} → ${g.to}`);
  console.log('Scroll runway element heights:');
  for (const s of report.scrollers) console.log(`  ${s.className}${s.id ? '#' + s.id : ''}: ${s.height}px`);

  await browser.close();
}
