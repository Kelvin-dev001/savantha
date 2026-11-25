import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Phase 7: analytics behind consent. The test build has no provider configured (the
 * production default until Savantho chooses one), so these tests switch one on by rewriting
 * the page's #analytics-config, and stand in for the provider's script, which is never
 * fetched from the internet.
 */
type Event = { name: string; props?: Record<string, string> };

const PLAUSIBLE = {
  provider: 'plausible',
  domain: 'savantho.net',
  src: 'https://plausible.io/js/script.js',
};
const GA4 = { provider: 'ga4', id: 'G-TEST123' };

async function withAnalytics(page: Page, config: object) {
  const thirdParty: string[] = [];
  page.on('request', (r) => {
    const host = new URL(r.url()).hostname;
    if (!['localhost', '127.0.0.1'].includes(host)) thirdParty.push(r.url());
  });
  await page.route(
    (url) => url.hostname === 'localhost' && !/\.\w+$/.test(url.pathname),
    async (route) => {
      const res = await route.fetch();
      const body = (await res.text()).replace(
        '<script type="application/json" id="analytics-config">null</script>',
        `<script type="application/json" id="analytics-config">${JSON.stringify(config)}</script>`,
      );
      await route.fulfill({ response: res, body });
    },
  );
  // Stand-in for plausible.io/js/script.js: replays the queue, records every call.
  await page.route('https://plausible.io/**', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: `window.__events = window.__events || [];
        (function () {
          var q = (window.plausible && window.plausible.q) || [];
          window.plausible = function (name, o) { window.__events.push({ name: name, props: o && o.props }); };
          window.__events.push({ name: 'pageview' });
          q.forEach(function (a) { window.plausible.apply(null, a); });
        })();`,
    }),
  );
  await page.route('https://www.googletagmanager.com/**', (route) =>
    route.fulfill({ contentType: 'text/javascript', body: 'window.__gtagLoaded = true;' }),
  );
  // Keep WhatsApp, phone and email links from leaving the page (tracking still sees the click).
  await page.addInitScript(() =>
    window.addEventListener(
      'click',
      (e) => {
        if (
          (e.target as Element).closest(
            'a[href^="https://wa.me"], a[href^="tel:"], a[href^="mailto:"]',
          )
        )
          e.preventDefault();
      },
      true,
    ),
  );
  return thirdParty;
}

const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { __events?: Event[] }).__events ?? []);

test('no provider configured: no banner, no preferences link, nothing loaded', async ({ page }) => {
  const external: string[] = [];
  page.on('request', (r) => {
    if (!r.url().startsWith('http://localhost')) external.push(r.url());
  });
  for (const route of ['/', '/services/trade-finance', '/contact']) {
    await page.goto(route);
    await page.waitForTimeout(800);
    await expect(page.locator('[data-consent]')).toBeHidden();
    await expect(page.locator('[data-consent-open]')).toBeHidden();
  }
  expect(external).toEqual([]);
});

test('plausible: asks first, loads only after Allow, then counts the brief’s events', async ({
  page,
}) => {
  const thirdParty = await withAnalytics(page, PLAUSIBLE);
  await page.goto('/services/trade-finance');
  const banner = page.locator('[data-consent]');
  await expect(banner).toBeVisible();
  await expect(banner.locator('[data-consent-body="plausible"]')).toBeVisible();
  await expect(banner.locator('[data-consent-body="ga4"]')).toBeHidden();
  await page.waitForTimeout(500);
  expect(thirdParty, 'nothing before consent').toEqual([]);

  // The banner is part of the page: it must pass axe too.
  const results = await new AxeBuilder({ page })
    .include('[data-consent]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);

  await banner.getByRole('button', { name: 'Allow' }).click();
  await expect(banner).toBeHidden();
  await expect(page.locator('[data-consent-status]')).toContainText('Analytics is on');
  await expect.poll(() => events(page).then((e) => e.map((x) => x.name))).toContain('service_view');
  expect(thirdParty.some((u) => u.startsWith('https://plausible.io/js/script.js'))).toBe(true);
  expect((await events(page)).find((e) => e.name === 'service_view')?.props).toEqual({
    page: '/services/trade-finance',
    service: 'trade-finance',
  });

  await page.locator('[data-track-location="service-hero"]').click();
  await page.locator('footer a[href^="tel:"]').click();
  await page.locator('footer a[href^="mailto:"]').click();
  await page.evaluate(() =>
    window.dispatchEvent(
      new CustomEvent('savantho:track', {
        detail: { event: 'form_step_1', service: 'trade-finance' },
      }),
    ),
  );
  const seen = await events(page);
  expect(seen.find((e) => e.name === 'whatsapp_click')?.props).toEqual({
    page: '/services/trade-finance',
    service: 'trade-finance',
    location: 'service-hero',
  });
  expect(seen.find((e) => e.name === 'call_click')?.props).toMatchObject({ location: 'footer' });
  expect(seen.find((e) => e.name === 'email_click')?.props).toMatchObject({ location: 'footer' });
  expect(seen.find((e) => e.name === 'form_step_1')?.props).toMatchObject({
    service: 'trade-finance',
  });

  // The choice is remembered: no banner on the next page, and it is still counted.
  await page.goto('/about');
  await page.waitForTimeout(600);
  await expect(banner).toBeHidden();
  await expect.poll(() => events(page).then((e) => e.map((x) => x.name))).toContain('pageview');
});

test('consent can be withdrawn from the footer, and nothing is sent after', async ({ page }) => {
  await withAnalytics(page, PLAUSIBLE);
  await page.goto('/');
  await page.locator('[data-consent]').getByRole('button', { name: 'Allow' }).click();
  await expect.poll(() => events(page).then((e) => e.length)).toBeGreaterThan(0);

  const prefs = page.locator('[data-consent-open]');
  await expect(prefs).toBeVisible();
  await prefs.click();
  await expect(page.locator('[data-consent]')).toBeVisible();
  await expect(page.locator('[data-consent-title]')).toBeFocused();
  await page.locator('[data-consent]').getByRole('button', { name: 'No, thanks' }).click();
  await expect(prefs).toBeFocused();
  expect(await page.evaluate(() => localStorage.getItem('plausible_ignore'))).toBe('true');

  const before = (await events(page)).length;
  await page.locator('footer a[href^="https://wa.me"]').click();
  expect((await events(page)).length).toBe(before);
});

test('declining loads nothing; Global Privacy Control counts as declining', async ({ page }) => {
  const thirdParty = await withAnalytics(page, PLAUSIBLE);
  await page.goto('/');
  await page.locator('[data-consent]').getByRole('button', { name: 'No, thanks' }).click();
  await page.reload();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-consent]')).toBeHidden();
  expect(thirdParty).toEqual([]);

  await page.evaluate(() => localStorage.clear());
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'globalPrivacyControl', { get: () => true }),
  );
  await page.reload();
  await page.waitForTimeout(800);
  await expect(page.locator('[data-consent]')).toBeHidden();
  expect(thirdParty).toEqual([]);
});

test('ga4: consent mode with advertising denied, loaded only after Allow', async ({ page }) => {
  const thirdParty = await withAnalytics(page, GA4);
  await page.goto('/');
  await expect(page.locator('[data-consent-body="ga4"]')).toBeVisible();
  expect(thirdParty).toEqual([]);
  await page.locator('[data-consent]').getByRole('button', { name: 'Allow' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __gtagLoaded?: boolean }).__gtagLoaded))
    .toBe(true);
  const layer = await page.evaluate(() =>
    ((window as unknown as { dataLayer: IArguments[] }).dataLayer ?? []).map((a) => Array.from(a)),
  );
  expect(layer[0]).toEqual([
    'consent',
    'default',
    {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    },
  ]);
  expect(layer.some((a) => a[0] === 'config' && a[1] === 'G-TEST123')).toBe(true);
  await page.locator('footer a[href^="https://wa.me"]').click();
  const after = await page.evaluate(() =>
    ((window as unknown as { dataLayer: IArguments[] }).dataLayer ?? []).map((a) => Array.from(a)),
  );
  expect(after.find((a) => a[0] === 'event' && a[1] === 'whatsapp_click')?.[2]).toMatchObject({
    service: 'general',
    location: 'footer',
    page: '/',
  });
});

test('the banner fits small screens and keeps 44 px targets', async ({ page }) => {
  await withAnalytics(page, PLAUSIBLE);
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const banner = page.locator('[data-consent]');
  await expect(banner).toBeVisible();
  const box = (await banner.boundingBox())!;
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(360);
  for (const btn of await banner.getByRole('button').all())
    expect((await btn.boundingBox())!.height).toBeGreaterThanOrEqual(44);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
