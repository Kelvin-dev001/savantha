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
    await page.goto('/styleguide');
    for (const el of await page.locator('[data-reveal]').all()) {
      await expect(el).toHaveCSS('opacity', '1');
    }
  });
});

test('skip link moves focus to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});
