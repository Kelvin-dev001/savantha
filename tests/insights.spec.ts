import { test, expect } from '@playwright/test';

/**
 * Phase 6: Insights. The list, the category pages and the article template. Every route
 * also gets the axe + structure checks in a11y.spec.ts (routes are read from the build).
 */
const articles = [
  '/insights/how-shariah-compliant-finance-works-in-kenya',
  '/insights/letters-of-credit-explained-for-kenyan-importers',
  '/insights/a-family-budgeting-framework-that-actually-holds',
];

test('the list opens with the newest guide and registers the rest', async ({ page }) => {
  await page.goto('/insights');
  await expect(page.locator('.ifeat')).toHaveCount(1);
  await expect(page.locator('.irow')).toHaveCount(2);
  const hrefs = [
    await page.locator('.ifeat__link').getAttribute('href'),
    ...(await page
      .locator('.irow__link')
      .evaluateAll((as) => as.map((a) => a.getAttribute('href')))),
  ];
  expect(hrefs.sort()).toEqual([...articles].sort());
  await expect(page.locator('.next')).toHaveCount(1);
  await expect(page.locator('.cta [data-track="whatsapp_click"]')).toHaveCount(1);
});

test('the subject index lists only subjects with guides, and marks the current one', async ({
  page,
}) => {
  await page.goto('/insights');
  const links = page.locator('.iidx__link');
  await expect(links).toHaveCount(4); // All subjects + three subjects with guides
  await expect(links.first()).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.iidx__link[href="/insights/category/business-finance"]')).toHaveCount(
    0,
  );

  await page.locator('.iidx__link[href="/insights/category/trade-finance"]').click();
  await expect(page).toHaveURL(/\/insights\/category\/trade-finance$/);
  await expect(page.locator('h1')).toContainText('Trade finance');
  await expect(page.locator('.irow')).toHaveCount(1);
  await expect(page.locator('.ifeat')).toHaveCount(0);
  await expect(
    page.locator('.iidx__link[href="/insights/category/trade-finance"]'),
  ).toHaveAttribute('aria-current', 'page');
});

test('an empty subject has no page', async ({ page }) => {
  const res = await page.goto('/insights/category/business-finance');
  expect(res?.status()).toBe(404);
});

for (const route of articles) {
  test(`article template: ${route}`, async ({ page }) => {
    await page.goto(route);
    // Answer first, then numbered sections with a contents list that links to each.
    await expect(page.locator('.abrief__item')).toHaveCount(3);
    const sections = await page.locator('.aprose__body h2').count();
    expect(sections).toBeGreaterThanOrEqual(5);
    await expect(page.locator('.atoc__link')).toHaveCount(sections);
    const first = page.locator('.atoc__link').first();
    const target = (await first.getAttribute('href'))!;
    await expect(page.locator(target)).toHaveCount(1);

    // Drafts say so, and ask search engines not to list them.
    await expect(page.locator('.ahead__draft')).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

    // Compliance: education note and the site-wide disclaimer in the page.
    await expect(page.locator('.aprose__edu')).toBeVisible();
    await expect(page.locator('.dnote')).toContainText('not licensed by the Capital Markets');

    // The guide's own WhatsApp message, the service behind it, and what happens next.
    const wa = page.locator('.atalk [data-track="whatsapp_click"]');
    expect(await wa.getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/\d+\?text=Hello%20Savantho%2C%20I've%20read%20your%20guide/,
    );
    await expect(page.locator('.atalk .srow__link').first()).toHaveAttribute(
      'href',
      /^\/services\//,
    );
    await expect(page.locator('.next')).toHaveCount(1);
    await expect(page.locator('.anext .irow')).toHaveCount(2);
  });
}

test('the reading rail is driven by scroll where supported', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'the rail shows from 1024 px');
  await page.goto(articles[1]!);
  const fill = page.locator('.atoc__fill');
  await expect(fill).toHaveCSS('animation-name', 'read-fill');
  const at = async () => fill.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).d);
  const top = await at();
  await page.evaluate(() => {
    const body = document.querySelector('.aprose')!.getBoundingClientRect();
    window.scrollTo(0, window.scrollY + body.top + body.height / 2 - window.innerHeight / 2);
  });
  await expect.poll(at).toBeGreaterThan(top);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });
  test('the reading rail stays a plain rule', async ({ page }) => {
    await page.goto(articles[1]!);
    await expect(page.locator('.atoc__fill')).toHaveCSS('animation-name', 'none');
  });
});

test('the homepage teaser links to the guides', async ({ page }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('.ins .ins__link')
    .evaluateAll((as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs).toHaveLength(3);
  for (const href of hrefs) expect(articles).toContain(href);
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('insights content is never hidden', async ({ page }) => {
    for (const route of ['/insights', '/insights/category/ethical-finance', ...articles]) {
      await page.goto(route);
      for (const el of await page.locator('[data-reveal]').all()) {
        await expect(el).toHaveCSS('opacity', '1');
      }
    }
  });
});
