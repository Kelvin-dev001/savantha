import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { routes } from './support/routes';

/**
 * Phase 8: security headers (vercel.json). The preview server does not apply vercel.json, so
 * these tests read the headers from it and serve every page with them, then fail on any
 * Content-Security-Policy violation: on every route, with the enquiry form in use, and with
 * GA4 switched on and consented to.
 */
type Rule = { source: string; has?: unknown[]; headers: { key: string; value: string }[] };
const config = JSON.parse(readFileSync('vercel.json', 'utf8')) as { headers: Rule[] };
const main = config.headers.find((r) => r.source === '/(.*)' && !r.has)!;
const headers = Object.fromEntries(main.headers.map((h) => [h.key.toLowerCase(), h.value]));

async function enforce(page: Page, analytics?: object) {
  await page.addInitScript(() => {
    const w = window as unknown as { __csp: string[] };
    w.__csp = [];
    document.addEventListener('securitypolicyviolation', (e) =>
      w.__csp.push(`${e.violatedDirective} ${e.blockedURI || '(inline)'}`),
    );
  });
  await page.route(
    (url) => url.hostname === 'localhost',
    async (route) => {
      const res = await route.fetch();
      let body = await res.body();
      if (analytics && (res.headers()['content-type'] ?? '').includes('text/html'))
        body = Buffer.from(
          body
            .toString()
            .replace(
              'id="analytics-config">null<',
              `id="analytics-config">${JSON.stringify(analytics)}<`,
            ),
        );
      await route.fulfill({ response: res, body, headers: { ...res.headers(), ...headers } });
    },
  );
}
const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument
test('vercel.json sets every header the brief asks for', ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Reads a file; runs once.');
  expect(headers['strict-transport-security']).toMatch(/max-age=\d{8}/);
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['x-frame-options']).toBe('SAMEORIGIN');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['permissions-policy']).toContain('camera=()');
  const csp = headers['content-security-policy']!;
  for (const d of [
    "default-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ])
    expect(csp).toContain(d);
  expect(csp.match(/script-src [^;]*/)![0]).not.toContain('unsafe');
  // Preview deployments stay out of search results.
  const preview = config.headers.find((r) => r.has);
  expect(preview?.headers).toContainEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
});

for (const route of routes()) {
  test(`csp: ${route}`, async ({ page }) => {
    // Header problems (e.g. an unknown Permissions-Policy feature) surface as console errors.
    const errors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
    await enforce(page);
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await page.mouse.wheel(0, 2000); // wake the scroll-triggered motion code
    await page.waitForTimeout(500);
    expect(await violations(page)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('csp: GA4 loads and reports once consented', async ({ page }) => {
  await page.route('https://www.googletagmanager.com/**', (r) =>
    r.fulfill({ contentType: 'text/javascript', body: 'window.__gtagLoaded = true;' }),
  );
  await enforce(page, { provider: 'ga4', id: 'G-TEST123' });
  await page.goto('/');
  await page.locator('[data-consent]').getByRole('button', { name: 'Allow' }).click();
  await expect
    .poll(() => page.evaluate(() => (window as unknown as { __gtagLoaded?: boolean }).__gtagLoaded))
    .toBe(true);
  expect(await violations(page)).toEqual([]);
});
