import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Phase 8: the web fonts are subset (scripts/subset-fonts.mjs). Every character any page
 * shows must be in the subset, or it would fall back to a system font. Fails with the
 * characters to add to CHARSET in the script (then run npm run fonts:subset).
 */
// eslint-disable-next-line no-empty-pattern -- Playwright needs the fixtures argument
test('every character on every page is in the font subset', ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'Reads the build; runs once.');
  const { codepoints } = JSON.parse(readFileSync('src/assets/fonts/charset.json', 'utf8')) as {
    codepoints: number[];
  };
  const allowed = new Set(codepoints);
  const walk = (d: string): string[] =>
    readdirSync(d).flatMap((n) =>
      statSync(join(d, n)).isDirectory()
        ? walk(join(d, n))
        : n.endsWith('.html')
          ? [join(d, n)]
          : [],
    );
  const missing = new Map<string, string>();
  for (const file of walk('dist/client')) {
    const text = readFileSync(file, 'utf8')
      .replace(/<(script|style)[\s\S]*?<\/\1>/g, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
      .replace(/&[a-z]+;/g, ' ');
    for (const ch of text) {
      const cp = ch.codePointAt(0)!;
      if (cp < 0x20 || allowed.has(cp)) continue;
      if (!missing.has(ch)) missing.set(ch, file);
    }
  }
  expect(
    [...missing].map(([ch, file]) => `U+${ch.codePointAt(0)!.toString(16)} "${ch}" in ${file}`),
  ).toEqual([]);
});
