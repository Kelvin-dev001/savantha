#!/usr/bin/env node
/**
 * Link checker for the static build (dist/client). Run after `npm run build`:
 *   npm run lint:links               internal links, assets and #anchors (no network)
 *   npm run lint:links -- --external also requests every external URL once
 *
 * Internal: every href/src/srcset on every page must resolve to a built file (or the one
 * on-demand route, /api/contact), and every #fragment must match an id on the target page.
 * External: reported with their status; wa.me, tel: and mailto: are checked for shape only.
 * Exits 1 on any broken link.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist/client';
const ON_DEMAND = new Set(['/api/contact']);
const external = process.argv.includes('--external');

const walk = (d) =>
  readdirSync(d).flatMap((n) => {
    const f = join(d, n);
    return statSync(f).isDirectory() ? walk(f) : [f];
  });
const pages = walk(DIST).filter((f) => f.endsWith('.html'));

/** URL path → file in dist, following Astro's directory format. */
function fileFor(path) {
  const p = decodeURIComponent(path);
  const candidates = [join(DIST, p), join(DIST, p, 'index.html'), join(DIST, `${p}.html`)];
  return candidates.find((c) => existsSync(c) && statSync(c).isFile());
}
const idsCache = new Map();
function ids(file) {
  if (!idsCache.has(file)) {
    const html = readFileSync(file, 'utf8');
    idsCache.set(file, new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  }
  return idsCache.get(file);
}
const routeOf = (file) => {
  const rel = relative(DIST, file).replaceAll('\\', '/');
  return `/${rel.replace(/index\.html$/, '').replace(/\.html$/, '')}`;
};

const broken = [];
const outside = new Map();
let checked = 0;

for (const page of pages) {
  const html = readFileSync(page, 'utf8').replace(/<script[\s\S]*?<\/script>/g, '');
  const from = routeOf(page);
  const refs = [
    ...[...html.matchAll(/\s(?:href|src)="([^"]+)"/g)].map((m) => m[1]),
    ...[...html.matchAll(/\ssrcset="([^"]+)"/g)].flatMap((m) =>
      m[1].split(',').map((s) => s.trim().split(/\s+/)[0]),
    ),
  ];
  for (const raw of refs) {
    const ref = raw.replace(/&amp;/g, '&');
    checked++;
    if (/^(tel:\+\d{9,15}|mailto:[^@\s]+@[^@\s]+)/.test(ref)) continue;
    if (/^(tel|mailto|javascript|data):/.test(ref)) {
      if (!ref.startsWith('data:')) broken.push(`${from} → ${ref} (malformed)`);
      continue;
    }
    if (/^https?:\/\//.test(ref)) {
      const u = new URL(ref);
      if (u.host === 'savantho.net') {
        // Absolute links to our own site (canonical, og:image) must exist in this build.
        if (!fileFor(u.pathname)) broken.push(`${from} → ${ref} (not in the build)`);
      } else {
        if (!outside.has(ref)) outside.set(ref, new Set());
        outside.get(ref).add(from);
      }
      continue;
    }
    const url = new URL(ref, `http://x${from}`);
    const target = url.pathname === from ? page : fileFor(url.pathname);
    if (!target) {
      if (!ON_DEMAND.has(url.pathname)) broken.push(`${from} → ${ref}`);
      continue;
    }
    const hash = decodeURIComponent(url.hash.slice(1));
    if (hash && target.endsWith('.html') && !ids(target).has(hash))
      broken.push(`${from} → ${ref} (no #${hash} on the target page)`);
  }
}

if (external) {
  for (const [url, from] of outside) {
    if (/^https:\/\/wa\.me\/\d{9,15}(\?text=.+)?$/.test(url)) continue;
    try {
      let res = await fetch(url, { method: 'HEAD', redirect: 'follow' });
      if (res.status === 405 || res.status === 403)
        res = await fetch(url, { method: 'GET', redirect: 'follow' });
      const ok = res.status < 400;
      console.log(`${ok ? 'ok ' : 'BAD'} ${res.status} ${url}`);
      if (!ok) broken.push(`${[...from][0]} → ${url} (HTTP ${res.status})`);
    } catch (e) {
      console.log(`??? ${url} (${e.cause?.code ?? e.message})`);
    }
  }
}

const wa = [...outside.keys()].filter((u) => u.startsWith('https://wa.me/'));
const badWa = wa.filter((u) => !/^https:\/\/wa\.me\/\d{9,15}\?text=.+$/.test(u));
broken.push(...badWa.map((u) => `WhatsApp link without a prefilled message: ${u}`));

console.log(
  `lint:links: ${pages.length} pages, ${checked} references, ${outside.size} external URLs (${wa.length} WhatsApp)${external ? '' : ' [not requested; use --external]'}`,
);
if (broken.length) {
  console.error(`\n${broken.length} broken:\n  ${[...new Set(broken)].join('\n  ')}`);
  process.exit(1);
}
console.log('lint:links — clean');
