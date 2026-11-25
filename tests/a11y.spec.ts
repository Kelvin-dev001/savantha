import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/** Every route = every index.html in the build output. */
function routes(dir = 'dist', root = 'dist'): string[] {
  let out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(routes(full, root));
    else if (name === 'index.html') {
      const rel = relative(root, dir).replaceAll('\\', '/');
      out.push(rel ? `/${rel}` : '/');
    }
  }
  return out;
}

const all = routes();

for (const route of all) {
  test(`axe: ${route}`, async ({ page }) => {
    await page.goto(route);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
  });

  test(`structure: ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('main')).toHaveCount(1);
    await expect(page.locator('header').first()).toBeVisible();
    await expect(page.locator('footer')).toHaveCount(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, 'horizontal scroll').toBeLessThanOrEqual(0);
  });
}

// Motion: final states must be reachable without animation or JS.
test('axe on the final state (reduced motion): /', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('.hw__i').first()).toHaveCSS('animation-name', 'none');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('hero and reveal content are never hidden', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    await page.waitForTimeout(2200); // CSS entry sequence ≤ 2 s
    await expect(page.locator('.hero__actions')).toHaveCSS('opacity', '1');
    for (const route of ['/', '/styleguide', '/services', '/services/shariah-compliant-finance']) {
      await page.goto(route);
      for (const el of await page.locator('[data-reveal]').all()) {
        await expect(el).toHaveCSS('opacity', '1');
      }
    }
  });

  test('how we work falls back to four stacked, visible steps', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('.hww__sticky')).toHaveCSS('position', 'static');
    for (const step of await page.locator('.hww__step').all()) {
      await expect(step).toHaveCSS('opacity', '1');
    }
  });
});

// Services: every page carries its own WhatsApp message, 5–6 FAQs, "What happens next";
// Grow-pillar pages repeat the disclaimer in the page (not only in the footer).
const servicePages = all.filter((r) => /^\/services\/[^/]+$/.test(r));
test('six service pages are built', () => {
  expect(servicePages).toHaveLength(6);
});
for (const route of servicePages) {
  test(`service content: ${route}`, async ({ page }) => {
    await page.goto(route);
    const hero = page.locator('.svh [data-track="whatsapp_click"]');
    const cta = page.locator('.cta [data-track="whatsapp_click"]');
    const heroHref = await hero.getAttribute('href');
    expect(heroHref).toMatch(/^https:\/\/wa\.me\/\d+\?text=Hello%20Savantho/);
    expect(await cta.getAttribute('href')).toBe(heroHref);
    const faqs = await page.locator('.svf .faql__item').count();
    expect(faqs).toBeGreaterThanOrEqual(5);
    expect(faqs).toBeLessThanOrEqual(6);
    await expect(page.locator('.next')).toHaveCount(1);
    const isGrow = (await page.locator('.svh__eyebrow').innerText()).includes('GROW');
    await expect(page.locator('.dnote')).toHaveCount(isGrow ? 1 : 0);
  });
}
test('services hub links to all six services and three pillars', async ({ page }) => {
  await page.goto('/services');
  await expect(page.locator('.srow__link')).toHaveCount(6);
  for (const key of ['grow', 'trade', 'build']) {
    await expect(page.locator(`section#${key}`)).toHaveCount(1);
  }
});

test('skip link moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test.describe('how we work (pinned)', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('pins on desktop and advances one step per quarter', async ({ page }) => {
    await page.goto('/');
    const section = page.locator('.hww');
    await expect(page.locator('.hww__sticky')).toHaveCSS('position', 'sticky');
    const { top, height } = await section.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top + window.scrollY, height: r.height };
    });
    for (const [p, step] of [
      [0.1, '0'],
      [0.4, '1'],
      [0.6, '2'],
      [0.95, '3'],
    ] as const) {
      await page.evaluate((y) => window.scrollTo(0, y), top + p * (height - 900));
      await expect(section).toHaveAttribute('data-step', step);
    }
    await expect(page.locator('.hww__step[data-active]')).toHaveCount(1);
  });

  test('stacks under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.locator('.hww__sticky')).toHaveCSS('position', 'static');
  });
});
