import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settle } from './support/settle';

/**
 * Phase 5: the three-question enquiry (need → goal → where to reach you), its endpoint,
 * and the FAQ, legal and 404 pages. The preview server runs with CONTACT_DRY_RUN=true, so
 * enquiries are logged rather than sent (playwright.config.ts).
 */
const axe = async (page: Page) => {
  await settle(page);
  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
};

/** The form ignores anything "filled in" faster than a person could; age the timestamp. */
const ageForm = (page: Page) =>
  page.evaluate(() => {
    const t = document.querySelector<HTMLInputElement>('[data-started]');
    if (t) t.value = String(Date.now() - 60_000);
  });

const valid = {
  need: 'trade-finance',
  goal: 'Pay a new supplier in Guangzhou without tying up our cash.',
  name: 'Amina',
  channel: 'whatsapp',
  phone: '0712 345 678',
  email: '',
  consent: 'on',
};

test.describe('enquiry form, enhanced', () => {
  test('three questions, one at a time, then a receipt', async ({ page }) => {
    await page.goto('/contact');
    const form = page.locator('[data-form]');
    await expect(page.locator('[data-progress]')).toBeVisible();
    await expect(page.locator('[data-panel="0"]')).toBeVisible();
    await expect(page.locator('[data-panel="1"]')).toBeHidden();
    await expect(page.locator('[data-panel="2"]')).toBeHidden();

    // 01: continuing without an answer shows an inline error.
    await page.locator('[data-panel="0"] [data-next]').click();
    await expect(page.locator('[data-error="need"]')).toBeVisible();
    await expect(form.locator('input[name="need"]').first()).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect((await axe(page)).violations).toEqual([]);

    await page.getByLabel('Trade Finance Consultancy').check();
    await expect(page.locator('[data-error="need"]')).toBeHidden();
    await page.locator('[data-panel="0"] [data-next]').click();

    // 02: the hint follows the need.
    await expect(page.locator('[data-panel="1"]')).toBeVisible();
    await expect(page.locator('[data-panel="1"] legend')).toBeFocused();
    const goal = page.locator('textarea[name="goal"]');
    await expect(goal).toHaveAttribute('placeholder', /supplier/);
    await page.locator('[data-panel="1"] [data-next]').click();
    await expect(page.locator('[data-error="goal"]')).toBeVisible();
    await goal.fill(valid.goal);
    await page.locator('[data-panel="1"] [data-next]').click();

    // 03: WhatsApp by default; email swaps the field.
    await expect(page.locator('[data-panel="2"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeHidden();
    await page.locator('.enq__segopt', { hasText: 'Email' }).click();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="phone"]')).toBeHidden();
    await page.locator('.enq__segopt', { hasText: 'WhatsApp' }).click();

    // The rail leads back to an answered question.
    await page.locator('[data-goto="0"]').click();
    await expect(page.locator('[data-panel="0"]')).toBeVisible();
    await page.locator('[data-goto="2"]').click();
    await expect(page.locator('[data-panel="2"]')).toBeVisible();

    await page.locator('[data-submit]').click();
    await expect(page.locator('[data-error="name"]')).toBeVisible();
    await expect(page.locator('[data-error="consent"]')).toBeVisible();
    await page.getByLabel('Your name').fill(valid.name);
    await page.getByLabel('Phone number').fill('12');
    await page.getByRole('checkbox').check();
    await page.locator('[data-submit]').click();
    await expect(page.locator('[data-error="phone"]')).toBeVisible();
    await page.getByLabel('Phone number').fill(valid.phone);

    await ageForm(page);
    await page.locator('[data-submit]').click();
    const done = page.locator('[data-done]');
    await expect(done).toBeVisible();
    await expect(page.locator('[data-done-title]')).toBeFocused();
    await expect(done).toContainText('on WhatsApp within one business day');
    await expect(done.locator('[data-receipt="need"]')).toHaveText('Trade Finance Consultancy');
    await expect(done.locator('[data-receipt="goal"]')).toHaveText(valid.goal);
    expect((await axe(page)).violations).toEqual([]);
  });

  test('?service= preselects the need', async ({ page }) => {
    await page.goto('/contact?service=real-estate');
    await expect(page.getByLabel('Real Estate Advisory')).toBeChecked();
  });
});

test.describe('enquiry form, without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('all three questions show and the form posts normally', async ({ page }) => {
    await page.goto('/contact');
    for (const i of [0, 1, 2]) await expect(page.locator(`[data-panel="${i}"]`)).toBeVisible();
    await expect(page.locator('[data-progress]')).toBeHidden();
    await page.getByLabel('Not sure yet').check();
    await page
      .locator('textarea[name="goal"]')
      .fill('We have just sold land and want to understand our options.');
    await page.getByLabel('Your name').fill('Juma');
    await page.getByLabel('Phone number').fill('+254 712 345 678');
    await page.getByRole('checkbox').check();
    await page.locator('[data-submit]').click();
    await expect(page).toHaveURL(/\/contact\/thank-you\/?$/);
    await expect(page.locator('h1')).toBeVisible();
  });

  test('reveal content is never hidden on the Phase 5 pages', async ({ page }) => {
    for (const route of ['/about', '/contact', '/faq', '/privacy', '/disclaimer']) {
      await page.goto(route);
      for (const el of await page.locator('[data-reveal]').all()) {
        await expect(el).toHaveCSS('opacity', '1');
      }
    }
  });
});

test.describe('/api/contact', () => {
  const post = (page: Page, data: Record<string, string>) =>
    page.request.post('/api/contact', { data, headers: { Accept: 'application/json' } });

  test('accepts a valid enquiry', async ({ page }) => {
    const res = await post(page, valid);
    expect(res.status()).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true, replyBy: 'on WhatsApp' });
  });

  test('validates on the server, field by field', async ({ page }) => {
    const res = await post(page, {
      need: 'stocks',
      goal: 'hi',
      name: '',
      channel: 'email',
      email: 'x@',
      phone: '',
    });
    expect(res.status()).toBe(422);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(Object.keys(body.errors).sort()).toEqual(['consent', 'email', 'goal', 'name', 'need']);
  });

  test('accepts an email reply when the channel is email', async ({ page }) => {
    const res = await post(page, {
      ...valid,
      channel: 'email',
      phone: '',
      email: 'amina@example.co.ke',
    });
    expect(await res.json()).toMatchObject({ ok: true, replyBy: 'by email' });
  });

  test('quietly drops honeypot submissions', async ({ page }) => {
    const res = await post(page, { ...valid, website: 'https://spam.example' });
    expect(res.status()).toBe(200);
    expect((await res.json()).ok).toBe(true);
  });

  test('a plain form post that fails lands on /contact/not-sent', async ({ page, baseURL }) => {
    const res = await page.request.post('/api/contact', {
      form: { need: '', goal: '' },
      headers: { Origin: new URL(baseURL!).origin },
      maxRedirects: 0,
    });
    expect(res.status()).toBe(303);
    expect(res.headers()['location']).toBe('/contact/not-sent');
  });
});

test('faq lists every service question, with FAQPage schema', async ({ page }) => {
  await page.goto('/faq');
  const items = await page.locator('.faql__item').count();
  expect(items).toBeGreaterThanOrEqual(4 + 6 * 5);
  const ld = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').first().textContent()) ?? '{}',
  );
  expect(ld['@type']).toBe('FAQPage');
  expect(ld.mainEntity).toHaveLength(items);
  for (const key of ['working-with-us', 'grow', 'trade', 'build'])
    await expect(page.locator(`section#${key}`)).toHaveCount(1);
});

test('legal pages: contents, draft notice, and the disclaimer statement', async ({ page }) => {
  for (const route of ['/privacy', '/terms', '/disclaimer']) {
    await page.goto(route);
    const toc = await page.locator('.ldoc__toc-link').count();
    expect(toc).toBeGreaterThan(3);
    await expect(page.locator('.prose h2')).toHaveCount(toc + 1); // + "Questions about this page?"
    await expect(page.locator('.lmeta__draft')).toBeVisible();
  }
  await expect(page.locator('.lstate')).toContainText(
    'not licensed by the Capital Markets Authority',
  );
});

test('about: letterhead lockup, register and fee principles', async ({ page }) => {
  await page.goto('/about');
  await expect(page.locator('.letterhead__logo')).toBeVisible();
  await expect(page.locator('.rec__row')).toHaveCount(7);
  await expect(page.locator('.fees__item')).toHaveCount(5);
  await expect(page.locator('.next')).toHaveCount(1);
});

test('404 is designed, links home and passes axe', async ({ page }) => {
  const res = await page.goto('/this-page-does-not-exist');
  expect(res?.status()).toBe(404);
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('.nf__link[href="/"]')).toHaveCount(1);
  expect((await axe(page)).violations).toEqual([]);
});
