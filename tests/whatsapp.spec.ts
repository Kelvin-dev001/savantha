import { test, expect } from '@playwright/test';

/**
 * Phase 8: the sticky WhatsApp button (brief §5). Below 1024 px only; hidden whenever another
 * WhatsApp link is on screen, while a form field has focus and while the menu is open;
 * prefilled per page; tracked. The tests set their own viewports, so they run once.
 */
const fab = '[data-fab]';

test.beforeEach(({ page: _page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Sets its own viewports; runs once.');
});

test('desktop: no sticky button (the header has "Talk to us")', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/services/trade-finance');
  await page.evaluate(() => window.scrollTo(0, 1600));
  await expect(page.locator(fab)).toBeHidden();
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true });

  test('appears once the hero CTA scrolls away, hides at the closing CTA', async ({ page }) => {
    await page.goto('/services/trade-finance');
    await expect(page.locator(fab)).toBeHidden(); // the hero's WhatsApp CTA is on screen
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator(fab)).toBeVisible();
    const box = (await page.locator(fab).boundingBox())!;
    expect([box.width, box.height]).toEqual([56, 56]);
    expect(box.x + box.width).toBeLessThanOrEqual(390 - 16);
    await page.evaluate(() => document.querySelector('.cta')!.scrollIntoView());
    await expect(page.locator(fab)).toBeHidden();
  });

  test('carries the page’s own message and tracking', async ({ page }) => {
    await page.goto('/services/trade-finance');
    const a = page.locator(fab);
    expect(decodeURIComponent((await a.getAttribute('href'))!)).toContain('Trade Finance');
    await expect(a).toHaveAttribute('data-track', 'whatsapp_click');
    await expect(a).toHaveAttribute('data-track-service', 'trade-finance');
    await expect(a).toHaveAttribute('data-track-location', 'sticky');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(a).toBeVisible();
    await expect(a).toHaveAccessibleName(/WhatsApp/);
  });

  test('hides while a form field has focus, and while the menu is open', async ({ page }) => {
    await page.goto('/about');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await expect(page.locator(fab)).toBeVisible();
    // Scrolling up brings the (hide-on-scroll) header back.
    await page.evaluate(() => window.scrollTo(0, 1500));
    await expect(page.locator('header[data-hidden="false"]')).toHaveCount(1);
    await page.locator('.menu-toggle').click();
    await expect(page.locator(fab)).toBeHidden();

    await page.goto('/contact');
    await page.evaluate(() => window.scrollTo(0, 1600));
    await page.evaluate(() => {
      const field = document.createElement('input');
      field.setAttribute('aria-label', 'probe');
      document.querySelector('main')!.append(field);
    });
    await page.locator('input[aria-label="probe"]').focus();
    await expect(page.locator(fab)).toBeHidden();
    await page.locator('input[aria-label="probe"]').blur();
  });

  test('never covers the last line of the page', async ({ page }) => {
    await page.goto('/privacy');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(400);
    const last = (await page.locator('footer .numerals').last().boundingBox())!;
    if (await page.locator(fab).isVisible()) {
      const box = (await page.locator(fab).boundingBox())!;
      expect(last.y + last.height).toBeLessThan(box.y);
    }
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  test('the button is simply there', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator(fab)).toBeVisible();
  });
});
