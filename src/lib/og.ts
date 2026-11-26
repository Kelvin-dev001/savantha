/**
 * Open Graph cards: one 1200 × 630 PNG per indexable page, generated at build time by
 * src/pages/og/[...card].png.ts. Pages that are not indexed (drafts awaiting review are
 * the exception, so reviewers can share them) use the default card.
 *
 * The card is a small piece of letterhead: ink ground, the lattice fading in from the right,
 * the monogram and tracked wordmark, the page's eyebrow, its headline in Newsreader (emphasis
 * in italic gold-soft, as on the page), and the tagline over a double ledger rule.
 *
 * Text is laid out by satori (glyphs become paths, so no fonts are needed to rasterise) and
 * the SVG is turned into a PNG by sharp. The static Newsreader/Inter `.woff` files come from
 * @fontsource (satori cannot read the variable woff2 files the site itself uses).
 */
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { getEntry } from 'astro:content';
import satori from 'satori';
import sharp from 'sharp';
import { site } from '@/config/site';
import { legalRoutes } from '@/lib/legal';
import { getInsights } from '@/lib/insights';
import { getHub, getPillars, getServices } from '@/lib/services';
import { starPath } from '@/lib/lattice';
import { OG_SIZE } from '@/lib/seo';
import { readColorTokens } from '@/lib/tokens';

export interface HeadlineLine {
  text: string;
  emphasis?: string;
}

export interface OgCard {
  /** Path under /og/ without the extension: "home", "services/trade-finance", "default". */
  key: string;
  eyebrow: string;
  lines: HeadlineLine[];
}

/** Route pathname → card key ("/" → "home", "/services/trade-finance/" → "services/trade-finance"). */
export const cardKey = (pathname: string) => pathname.replace(/^\/+|\/+$/g, '') || 'home';
export const cardPath = (key: string) => `/og/${key}.png`;

/** Italicise the last word, as the service and article heroes do. */
const lastWordEmphasis = (text: string): HeadlineLine => ({
  text,
  emphasis: text.split(' ').at(-1),
});

let cards: Promise<OgCard[]> | undefined;

/** Every card, built once per build from the same content the pages read. */
export function getOgCards(): Promise<OgCard[]> {
  cards ??= (async () => {
    const [pagesEntry, homeEntry, aboutEntry, contactEntry, hub, pillars, services, insights] =
      await Promise.all([
        getEntry('pages', 'pages'),
        getEntry('home', 'home'),
        getEntry('about', 'about'),
        getEntry('contact', 'contact'),
        getHub(),
        getPillars(),
        getServices(),
        getInsights(),
      ]);
    const pages = pagesEntry!.data;
    const og = pages.seo.og;

    const legal = await Promise.all(
      legalRoutes.map(async (l) => {
        const doc = await getEntry('legal', l.entry);
        return { key: l.route, eyebrow: og.legal, lines: [{ text: doc!.data.title }] };
      }),
    );

    return [
      { key: 'default', eyebrow: og.default, lines: [lastWordEmphasis(site.tagline)] },
      { key: 'home', eyebrow: og.home, lines: homeEntry!.data.hero.headline },
      {
        key: 'about',
        eyebrow: aboutEntry!.data.hero.eyebrow,
        lines: aboutEntry!.data.hero.headline,
      },
      { key: 'services', eyebrow: hub.hub.eyebrow, lines: hub.hub.headline },
      ...services.map((s) => {
        const p = pillars.find((x) => x.key === s.data.pillar)!;
        return {
          key: `services/${s.data.slug}`,
          eyebrow: `${hub.page.pillarLabel} ${p.numeral} · ${p.title}`,
          lines: [lastWordEmphasis(s.data.title)],
        };
      }),
      { key: 'insights', eyebrow: pages.insights.eyebrow, lines: pages.insights.headline },
      ...insights.categories
        .filter((c) => c.count > 0)
        .map((c) => ({
          key: `insights/category/${c.key}`,
          eyebrow: pages.insights.eyebrow,
          lines: [{ text: c.title }],
        })),
      ...insights.insights.map((a) => ({
        key: `insights/${a.id}`,
        eyebrow: `${pages.insights.eyebrow} · ${a.category.title}`,
        lines: [{ text: a.title }],
      })),
      { key: 'faq', eyebrow: pages.faq.eyebrow, lines: pages.faq.headline },
      {
        key: 'contact',
        eyebrow: contactEntry!.data.hero.eyebrow,
        lines: contactEntry!.data.hero.headline,
      },
      ...legal,
    ];
  })();
  return cards;
}

/* ------------------------------------------------------------------------------------------ */
/* Rendering                                                                                  */
/* ------------------------------------------------------------------------------------------ */

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, children?: unknown, extra = {}): Node => ({
  type,
  props: { style, children, ...extra },
});

const root = process.cwd();
const font = (pkg: string, file: string) =>
  readFile(join(root, 'node_modules', '@fontsource', pkg, 'files', file));

let assets:
  | Promise<{
      fonts: Parameters<typeof satori>[1]['fonts'];
      monogram: string;
      lattice: string;
      c: Record<string, string>;
    }>
  | undefined;

function loadAssets() {
  assets ??= (async () => {
    const [nr, nrItalic, in500, in600, monogramSvg] = await Promise.all([
      font('newsreader', 'newsreader-latin-400-normal.woff'),
      font('newsreader', 'newsreader-latin-400-italic.woff'),
      font('inter', 'inter-latin-500-normal.woff'),
      font('inter', 'inter-latin-600-normal.woff'),
      readFile(join(root, 'public', 'brand', 'monogram.svg'), 'utf8'),
    ]);
    // rgba() for every token: satori does not parse the space-separated rgb() syntax.
    const c = Object.fromEntries(
      readColorTokens().map((t) => [t.name, `rgba(${t.rgb.join(', ')}, ${t.alpha})`]),
    );
    return {
      fonts: [
        { name: 'Newsreader', data: nr, weight: 400 as const, style: 'normal' as const },
        { name: 'Newsreader', data: nrItalic, weight: 400 as const, style: 'italic' as const },
        { name: 'Inter', data: in500, weight: 500 as const, style: 'normal' as const },
        { name: 'Inter', data: in600, weight: 600 as const, style: 'normal' as const },
      ],
      monogram: `data:image/svg+xml;base64,${Buffer.from(monogramSvg).toString('base64')}`,
      lattice: latticeDataUri(c.gold!),
      c,
    };
  })();
  return assets;
}

/**
 * The lattice for the card: explicit stars (no <pattern> or mask, so every rasteriser draws
 * it the same), strongest at the right edge and fading out before the headline.
 */
function latticeDataUri(gold: string) {
  const { width: W, height: H } = OG_SIZE;
  const tile = 96;
  const d = starPath(tile);
  const paths: string[] = [];
  for (let y = -tile / 2; y < H; y += tile) {
    for (let x = W - tile; x > -tile; x -= tile) {
      const t = (x + tile / 2 - W * 0.38) / (W * 0.62); // 0 at 38 % of the width, 1 at the edge
      if (t <= 0) continue;
      const opacity = Math.round(Math.min(1, t) ** 1.4 * 0.34 * 1000) / 1000;
      paths.push(`<path d="${d}" transform="translate(${x} ${y})" stroke-opacity="${opacity}"/>`);
    }
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none" stroke="${gold}" stroke-width="1">${paths.join('')}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/** Headline size from its length: short headlines large, long article titles smaller. */
function headlineSize(lines: HeadlineLine[]) {
  const total = lines.reduce((n, l) => n + l.text.length, 0);
  if (total <= 24) return 96;
  if (total <= 36) return 86;
  if (total <= 52) return 74;
  if (total <= 72) return 62;
  return 54;
}

function headline(lines: HeadlineLine[], c: Record<string, string>) {
  const size = headlineSize(lines);
  const word = (text: string, italic: boolean) =>
    h(
      'span',
      {
        fontStyle: italic ? 'italic' : 'normal',
        color: italic ? c['gold-soft'] : c.ivory,
        marginRight: Math.round(size * 0.24),
      },
      text,
    );
  return h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Newsreader',
      fontSize: size,
      lineHeight: 1.04,
      letterSpacing: '-0.02em',
      maxWidth: 960,
    },
    lines.map((line) => {
      const parts = line.emphasis ? line.text.split(line.emphasis) : [line.text];
      const words: Node[] = [];
      parts.forEach((part, i) => {
        part
          .split(/\s+/)
          .filter(Boolean)
          .forEach((w) => words.push(word(w, false)));
        if (line.emphasis && i < parts.length - 1)
          line.emphasis.split(/\s+/).forEach((w) => words.push(word(w, true)));
      });
      return h('div', { display: 'flex', flexWrap: 'wrap' }, words);
    }),
  );
}

function rule(c: Record<string, string>) {
  return h('div', { display: 'flex', flexDirection: 'column', width: '100%' }, [
    h('div', { height: 1, width: '100%', backgroundColor: c.gold }),
    h('div', { height: 1, width: '100%', marginTop: 3, backgroundColor: c.line }),
  ]);
}

/** Render one card to PNG. */
export async function renderOgCard(card: OgCard): Promise<Buffer> {
  const { fonts, monogram, lattice, c } = await loadAssets();
  const { width, height } = OG_SIZE;

  const tree = h(
    'div',
    {
      width,
      height,
      display: 'flex',
      position: 'relative',
      backgroundColor: c.ink,
      color: c.ivory,
      fontFamily: 'Inter',
    },
    [
      h('img', { position: 'absolute', top: 0, left: 0, width, height }, undefined, {
        src: lattice,
        width,
        height,
      }),
      h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '60px 72px 52px',
        },
        [
          // Letterhead: monogram, wordmark, eyebrow
          h('div', { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, [
            h('div', { display: 'flex', alignItems: 'center' }, [
              h('img', { width: 52, height: 52 }, undefined, {
                src: monogram,
                width: 52,
                height: 52,
              }),
              h(
                'div',
                {
                  marginLeft: 18,
                  fontFamily: 'Newsreader',
                  fontSize: 22,
                  letterSpacing: '0.28em',
                  textTransform: 'uppercase',
                },
                site.shortName,
              ),
            ]),
            h(
              'div',
              {
                fontWeight: 600,
                fontSize: 16,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: c['gold-soft'],
              },
              card.eyebrow,
            ),
          ]),
          headline(card.lines, c),
          // Foot: double ledger rule, tagline, domain
          h('div', { display: 'flex', flexDirection: 'column' }, [
            rule(c),
            h(
              'div',
              {
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginTop: 20,
              },
              [
                h(
                  'div',
                  {
                    fontFamily: 'Newsreader',
                    fontStyle: 'italic',
                    fontSize: 26,
                    color: c['gold-soft'],
                  },
                  site.tagline,
                ),
                h(
                  'div',
                  {
                    fontWeight: 500,
                    fontSize: 18,
                    letterSpacing: '0.08em',
                    color: c.ivory,
                    opacity: 0.72,
                  },
                  new URL(site.url).host,
                ),
              ],
            ),
          ]),
        ],
      ),
    ],
  );

  const svg = await satori(tree as Parameters<typeof satori>[0], { width, height, fonts });
  return sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: false }).toBuffer();
}
