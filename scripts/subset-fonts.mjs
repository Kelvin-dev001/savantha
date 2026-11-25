#!/usr/bin/env node
/**
 * Subsets the two variable fonts to what the site uses, so a first visit on a slow phone
 * downloads less before the first paint (≈ 173 KB → ≈ 140 KB).
 *   npm run fonts:subset
 * Output (committed): src/assets/fonts/*.woff2 and src/assets/fonts/charset.json.
 * src/styles/fonts.css declares them. Re-run after upgrading @fontsource-variable or when
 * copy needs a character outside CHARSET (tests/fonts.spec.ts fails if a page uses one).
 *
 * Kept: Basic Latin, Latin-1 (accented names), typographic punctuation, arrows and maths
 * signs used in the copy; all layout features of the kept glyphs; the full optical-size
 * axis (automatic optical sizing maps it to the font size). Narrowed: the weight axis, to
 * the range the CSS uses (Fraunces 300–480, Manrope 300–650; checked in Phase 8).
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import subsetFont from 'subset-font';

const ranges = [
  [0x20, 0x7e], // Basic Latin
  [0xa0, 0xff], // Latin-1 Supplement
];
// Typographic punctuation, arrows and maths signs used in the copy.
const extras = [...'–—‘’‚“”•…‹›€™←↑→↓−≤≥'].map((c) => c.codePointAt(0));
const codepoints = [
  ...ranges.flatMap(([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i)),
  ...extras,
];
const text = String.fromCodePoint(...codepoints);

const src = 'node_modules/@fontsource-variable';
const fonts = [
  {
    from: `${src}/fraunces/files/fraunces-latin-opsz-normal.woff2`,
    to: 'fraunces-opsz-normal.woff2',
    axes: { wght: { min: 300, max: 500 } },
  },
  {
    from: `${src}/fraunces/files/fraunces-latin-opsz-italic.woff2`,
    to: 'fraunces-opsz-italic.woff2',
    axes: { wght: { min: 300, max: 500 } },
  },
  {
    from: `${src}/manrope/files/manrope-latin-wght-normal.woff2`,
    to: 'manrope-wght-normal.woff2',
    axes: { wght: { min: 300, max: 700 } },
  },
];

await mkdir('src/assets/fonts', { recursive: true });
for (const f of fonts) {
  const input = await readFile(f.from);
  const out = await subsetFont(input, text, { targetFormat: 'woff2', variationAxes: f.axes });
  await writeFile(`src/assets/fonts/${f.to}`, out);
  console.log(
    `${f.to}: ${(input.length / 1024).toFixed(1)} KB → ${(out.length / 1024).toFixed(1)} KB`,
  );
}

/** unicode-range for fonts.css, and the charset the test checks pages against. */
const toRange = (cps) => {
  const sorted = [...new Set(cps)].sort((a, b) => a - b);
  const out = [];
  for (let i = 0; i < sorted.length; i++) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    const hex = (n) => n.toString(16).toUpperCase().padStart(4, '0');
    out.push(i === j ? `U+${hex(sorted[i])}` : `U+${hex(sorted[i])}-${hex(sorted[j])}`);
    i = j;
  }
  return out.join(', ');
};
await writeFile(
  'src/assets/fonts/charset.json',
  `${JSON.stringify({ unicodeRange: toRange(codepoints), codepoints }, null, 0)}\n`,
);
console.log(`unicode-range: ${toRange(codepoints)}`);
