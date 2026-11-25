import { test, expect } from '@playwright/test';
import { routes } from './support/routes';

/**
 * Phase 8: responsive sweep. Every route at the seven widths in CLAUDE.md: no horizontal
 * scroll, a visible H1, and nothing in <main> poking past the viewport (unless an ancestor
 * clips it on purpose, like the lattice slices).
 */
const WIDTHS = [360, 390, 768, 1024, 1280, 1440, 1920];

// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Sets its own viewports; runs once.');
});

for (const route of routes()) {
  test(`widths: ${route}`, async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: width < 768 ? 800 : 900 });
      await page.goto(route);
      const result = await page.evaluate(() => {
        const vw = document.documentElement.clientWidth;
        const clipped = (el: Element) => {
          for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
            const o = getComputedStyle(p);
            if (o.overflowX !== 'visible' || o.contain.includes('paint')) return true;
          }
          return false;
        };
        const wide = [...document.querySelectorAll('main *')]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            if (r.width === 0 || getComputedStyle(el).position === 'fixed') return false;
            return (r.right > vw + 1 || r.left < -1) && !clipped(el);
          })
          .slice(0, 3)
          .map((el) => `${el.tagName.toLowerCase()}.${[...el.classList].join('.')}`);
        return { overflow: document.documentElement.scrollWidth - window.innerWidth, wide };
      });
      expect(result.overflow, `${route} @ ${width}px scrolls sideways`).toBeLessThanOrEqual(0);
      expect(result.wide, `${route} @ ${width}px`).toEqual([]);
      await expect(page.locator('h1'), `${route} @ ${width}px`).toBeVisible();
    }
  });
}
