import { test, expect } from '@playwright/test';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * Phase 7: search, sharing and AI search. Reads the static build (dist/client) directly, so
 * these checks run once (desktop project only): titles and descriptions within budget,
 * canonical + Open Graph + Twitter tags, a generated OG card behind every og:image, one
 * JSON-LD graph per page with the right types, the sitemap agreeing with `noindex`, and the
 * robots, llms.txt, manifest and favicon files.
 */
const DIST = 'dist/client';
const SITE = 'https://savantho.net';

function pages(dir = DIST): { route: string; html: string }[] {
  let out: { route: string; html: string }[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out = out.concat(pages(full));
    else if (name === 'index.html') {
      const rel = relative(DIST, dir).replaceAll('\\', '/');
      out.push({ route: rel ? `/${rel}/` : '/', html: readFileSync(full, 'utf8') });
    }
  }
  return out;
}

const decode = (s: string) =>
  s
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const meta = (html: string, attr: 'name' | 'property', key: string) => {
  const m = html.match(new RegExp(`<meta ${attr}="${key}" content="([^"]*)"`));
  return m ? decode(m[1]!) : undefined;
};
type Node = { '@type': string | string[]; [k: string]: unknown };
const graphs = (html: string): Node[] =>
  [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(
    (m) => JSON.parse(m[1]!)['@graph'] as Node[],
  );
const types = (nodes: Node[]) => nodes.flatMap((n) => [n['@type']].flat());
const distFile = (url: string) => join(DIST, new URL(url).pathname);

const all = pages();
const noindex = (html: string) => /<meta name="robots" content="noindex/.test(html);

// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument
test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Reads the build; runs once.');
});

test('every page: title, description, canonical, Open Graph, Twitter', () => {
  expect(all.length).toBeGreaterThan(20);
  for (const { route, html } of all) {
    const title = decode(html.match(/<title>([^<]*)<\/title>/)![1]!);
    expect(title.length, `${route} title`).toBeLessThanOrEqual(60);
    expect(title, route).toMatch(/Savantho Consultancy$/);
    const description = meta(html, 'name', 'description')!;
    expect(description.length, `${route} description`).toBeGreaterThan(50);
    expect(description.length, `${route} description`).toBeLessThanOrEqual(155);

    const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)![1];
    if (route !== '/404/') expect(canonical, route).toBe(`${SITE}${route}`);

    expect(meta(html, 'property', 'og:url')).toBe(canonical);
    expect(meta(html, 'property', 'og:title')).toBeTruthy();
    expect(meta(html, 'property', 'og:description')).toBe(description);
    expect(meta(html, 'property', 'og:locale')).toBe('en_KE');
    expect(meta(html, 'name', 'twitter:card')).toBe('summary_large_image');
    const image = meta(html, 'property', 'og:image')!;
    expect(image, route).toMatch(new RegExp(`^${SITE}/og/.+\\.png$`));
    expect(meta(html, 'name', 'twitter:image')).toBe(image);
    expect(existsSync(distFile(image)), `${route} → ${image}`).toBe(true);
    expect(html).toContain('<html lang="en-KE"');

    // Placeholders never reach search engines or link previews.
    const head = html.slice(0, html.indexOf('</head>'));
    expect(
      head.replace(/<script type="application\/json"[\s\S]*?<\/script>/, ''),
      route,
    ).not.toMatch(/\[\[/);
    expect(JSON.stringify(graphs(html)), route).not.toMatch(/\[\[/);
  }
});

test('indexable pages get their own OG card; drafts and utility pages are noindex', () => {
  for (const { route, html } of all) {
    const image = meta(html, 'property', 'og:image')!;
    const own = route === '/' ? '/og/home.png' : `/og${route.replace(/\/$/, '')}.png`;
    if (!noindex(html) || route.startsWith('/insights/'))
      expect(image, route).toBe(`${SITE}${own}`);
    else expect(image, route).toBe(`${SITE}/og/default.png`);
  }
  for (const route of ['/styleguide/', '/contact/thank-you/', '/contact/not-sent/'])
    expect(noindex(all.find((p) => p.route === route)!.html), route).toBe(true);
});

test('OG cards are 1200 × 630 PNGs', () => {
  const dir = join(DIST, 'og');
  const walk = (d: string): string[] =>
    readdirSync(d).flatMap((n) =>
      statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)],
    );
  const files = walk(dir);
  expect(files.length).toBeGreaterThanOrEqual(20);
  for (const f of files) {
    const b = readFileSync(f);
    expect(b.subarray(1, 4).toString(), f).toBe('PNG');
    expect([b.readUInt32BE(16), b.readUInt32BE(20)], f).toEqual([1200, 630]);
    expect(b.length, `${f} size`).toBeLessThan(300_000);
  }
});

test('JSON-LD: one site graph everywhere, plus the right nodes per page type', () => {
  for (const { route, html } of all) {
    const nodes = graphs(html);
    const t = types(nodes);
    expect(t, route).toEqual(
      expect.arrayContaining(['Organization', 'ProfessionalService', 'WebSite']),
    );
    const org = nodes.find((n) => [n['@type']].flat().includes('Organization'))!;
    expect(org.areaServed).toEqual({ '@type': 'Country', name: 'Kenya' });
    expect(org.contactPoint).toBeTruthy();
    expect(org).not.toHaveProperty('address.streetAddress'); // still a placeholder

    if (/^\/services\/[a-z-]+\/$/.test(route)) {
      expect(t, route).toEqual(expect.arrayContaining(['Service', 'BreadcrumbList']));
      const crumbs = nodes.find((n) => n['@type'] === 'BreadcrumbList')!;
      const items = crumbs.itemListElement as { name: string; item: string }[];
      expect(items.map((i) => i.item)).toEqual([
        `${SITE}/`,
        `${SITE}/services/`,
        `${SITE}${route}`,
      ]);
    }
    if (/^\/insights\/(?!category)[a-z-]+\/$/.test(route)) {
      expect(t, route).toEqual(expect.arrayContaining(['Article', 'BreadcrumbList']));
      expect(meta(html, 'property', 'og:type')).toBe('article');
    }
  }
  const faq = graphs(all.find((p) => p.route === '/faq/')!.html);
  expect(
    (faq.find((n) => n['@type'] === 'FAQPage')!.mainEntity as unknown[]).length,
  ).toBeGreaterThan(30);
  expect(types(graphs(all.find((p) => p.route === '/about/')!.html))).toContain('AboutPage');
  expect(types(graphs(all.find((p) => p.route === '/contact/')!.html))).toContain('ContactPage');
});

test('the sitemap lists exactly the indexable pages', () => {
  const index = readFileSync(join(DIST, 'sitemap-index.xml'), 'utf8');
  const maps = [...index.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!);
  const listed = maps.flatMap((url) =>
    [...readFileSync(distFile(url), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]!),
  );
  const indexable = all
    .filter((p) => !noindex(p.html))
    .map((p) => `${SITE}${p.route}`)
    .sort();
  expect(listed.sort()).toEqual(indexable);
});

test('robots.txt, llms.txt, manifest and favicons', () => {
  const robots = readFileSync(join(DIST, 'robots.txt'), 'utf8');
  expect(robots).toContain(`Sitemap: ${SITE}/sitemap-index.xml`);
  expect(robots).toContain('Disallow: /api/');

  const llms = readFileSync(join(DIST, 'llms.txt'), 'utf8');
  expect(llms.startsWith('# Savantho Consultancy\n\n> ')).toBe(true);
  for (const slug of [
    'wealth-planning',
    'shariah-compliant-finance',
    'real-estate',
    'trade-finance',
    'financial-literacy',
    'project-me',
  ])
    expect(llms).toContain(`${SITE}/services/${slug}/`);
  expect(llms).toContain('not licensed by the Capital Markets Authority');
  expect(llms).toContain('info@savantho.net');
  expect(llms).not.toMatch(/\[\[/);
  for (const { route } of all.filter((p) => noindex(p.html)))
    expect(llms, `${route} is noindex`).not.toContain(`${SITE}${route}`);

  const manifest = JSON.parse(readFileSync(join(DIST, 'site.webmanifest'), 'utf8'));
  expect(manifest.icons.map((i: { purpose?: string }) => i.purpose ?? 'any')).toContain('maskable');
  for (const i of manifest.icons as { src: string; sizes: string }[]) {
    const b = readFileSync(join(DIST, i.src));
    const [w, h] = i.sizes.split('x').map(Number);
    expect([b.readUInt32BE(16), b.readUInt32BE(20)], i.src).toEqual([w, h]);
  }
  const ico = readFileSync(join(DIST, 'favicon.ico'));
  expect([ico.readUInt16LE(0), ico.readUInt16LE(2), ico.readUInt16LE(4)]).toEqual([0, 1, 3]);
  expect(existsSync(join(DIST, 'apple-touch-icon.png'))).toBe(true);
  expect(existsSync(join(DIST, 'favicon.svg'))).toBe(true);
});

test('served: robots, llms.txt and an OG card answer with the right type', async ({ request }) => {
  for (const [path, type] of [
    ['/robots.txt', 'text/plain'],
    ['/llms.txt', 'text/plain'],
    ['/og/home.png', 'image/png'],
    ['/favicon.ico', 'image/'],
  ] as const) {
    const res = await request.get(path);
    expect(res.status(), path).toBe(200);
    expect(res.headers()['content-type'], path).toContain(type);
  }
});
