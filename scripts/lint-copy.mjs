#!/usr/bin/env node
/**
 * Compliance copy linter. Fails (exit 1) if banned phrases appear anywhere in src/.
 * Savantho is not licensed by the Capital Markets Authority — see CLAUDE.md.
 *
 * To allow a line deliberately (e.g. a legal page that must name a regulated role),
 * add the marker `lint-copy-allow` on the same line, with a reason. Use sparingly; the
 * advocate review should see every one.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SCAN_DIRS = ['src'];
const EXTENSIONS = new Set([
  '.astro',
  '.md',
  '.mdx',
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.json',
  '.yaml',
  '.yml',
  '.html',
  '.txt',
]);
const ALLOW_MARKER = 'lint-copy-allow';

/** @type {{ id: string, re: RegExp, why: string }[]} */
const RULES = [
  {
    id: 'investment-adviser',
    re: /\binvestment[\s-]+advis(?:e|o)rs?\b/i,
    why: 'Regulated title (CMA licence required).',
  },
  {
    id: 'investment-advisory',
    re: /\binvestment[\s-]+advisory\b/i,
    why: 'Regulated activity (CMA licence required).',
  },
  {
    id: 'fund-manager',
    re: /\bfund[\s-]+managers?\b/i,
    why: 'Regulated title (CMA licence required).',
  },
  {
    id: 'portfolio-manager',
    re: /\bportfolio[\s-]+managers?\b/i,
    why: 'Regulated title (CMA licence required).',
  },
  { id: 'guaranteed', re: /\bguarantee(?:d|s)?\b/i, why: 'Implies certainty of outcome.' },
  { id: 'risk-free', re: /\brisk[\s-]*free\b/i, why: 'No product is risk-free.' },
  {
    id: 'maximise-returns',
    re: /\bmaximi[sz](?:e|es|ed|ing)\s+(?:your\s+|the\s+)?returns?\b/i,
    why: 'Return promise.',
  },
  {
    id: 'protect-capital',
    re: /\bprotect(?:s|ed|ing)?\s+your\s+capital\b/i,
    why: 'Capital-protection promise.',
  },
  {
    id: 'return-figure',
    re: /\b\d+(?:[.,]\d+)?\s?%\s*(?:p\.?\s?a\.?|per\s+(?:annum|year|month)|a\s+year|annual(?:ly)?|returns?|yield|interest|profit|growth|gains?)\b/i,
    why: 'Return or performance figure.',
  },
  {
    id: 'return-figure-words',
    re: /\b(?:returns?|yields?|profits?|gains?)\s+of\s+(?:up\s+to\s+|over\s+|around\s+)?(?:KES|KSh|Ksh|USD|\$)?\s?\d/i,
    why: 'Return or performance figure.',
  },
];

async function* walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (EXTENSIONS.has(extname(entry.name).toLowerCase())) yield full;
  }
}

const hits = [];
let files = 0;
for (const d of SCAN_DIRS) {
  for await (const file of walk(join(root, d))) {
    files++;
    const lines = (await readFile(file, 'utf8')).split(/\r?\n/);
    lines.forEach((line, i) => {
      if (line.includes(ALLOW_MARKER)) return;
      for (const rule of RULES) {
        const m = line.match(rule.re);
        if (m)
          hits.push({
            file: relative(root, file).replaceAll('\\', '/'),
            line: i + 1,
            col: (m.index ?? 0) + 1,
            match: m[0],
            rule,
          });
      }
    });
  }
}

// The site-wide disclaimer must exist.
let disclaimerOk;
try {
  const d = await readFile(join(root, 'src/content/legal/disclaimer.md'), 'utf8');
  disclaimerOk = /not licensed by the Capital Markets Authority/i.test(d);
} catch {
  disclaimerOk = false;
}

if (hits.length || !disclaimerOk) {
  console.error(`\nlint:copy — ${hits.length} compliance issue(s) in ${files} files\n`);
  for (const h of hits) {
    console.error(`  ${h.file}:${h.line}:${h.col}  "${h.match}"  [${h.rule.id}] ${h.rule.why}`);
  }
  if (!disclaimerOk)
    console.error(
      '  src/content/legal/disclaimer.md is missing or no longer states the CMA position.',
    );
  console.error(
    '\nUse: consultancy, planning, guidance, financial education, "help you make informed decisions".\n',
  );
  process.exit(1);
}
console.log(`lint:copy — clean (${files} files, ${RULES.length} rules)`);
