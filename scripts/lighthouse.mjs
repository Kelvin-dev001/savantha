#!/usr/bin/env node
/**
 * Lighthouse, mobile preset (Moto G Power, simulated slow 4G), on every built route.
 *   npm run build && npm run lighthouse            all routes
 *   npm run lighthouse -- / /services              some routes
 *   npm run lighthouse -- --runs 3                 median of 3 runs per route (by performance)
 *   npm run lighthouse -- --default-cpu            Lighthouse's fixed 4× CPU slowdown
 *   npm run lighthouse -- --cpu 2                  a fixed CPU slowdown
 *
 * CPU calibration: the 4× slowdown is tuned for a host with a BenchmarkIndex of about 2000
 * (Lighthouse warns below 1000, "at least ~2x weaker than our regular target device"; see
 * docs/throttling.md#cpu-throttling). On a slower machine 4× overstates blocking time, so
 * by default the multiplier is scaled to the measured index: 4 × BI / 2000, kept in 1–4.
 * Confirm on PageSpeed Insights after deploying; its servers are the reference.
 * Serves the build the way Vercel does: `astro preview` behind a local HTTP/2 + brotli proxy
 * (self-signed certificate made with openssl, which Git for Windows ships). Over plain
 * HTTP/1.1 Lighthouse models six queued connections and overstates load time.
 * Drives Playwright's Chromium. Writes reports/lighthouse/<route>.json and summary.md, prints the
 * scorecard, and exits 1 if any page misses the budgets in CLAUDE.md.
 */
import { spawn, spawnSync } from 'node:child_process';
import { request as httpRequest } from 'node:http';
import { createSecureServer } from 'node:http2';
import { readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { mkdir, writeFile } from 'node:fs/promises';
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brotliCompressSync, constants as z } from 'node:zlib';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import { chromium } from '@playwright/test';

const BUDGET = {
  performance: 95,
  accessibility: 100,
  'best-practices': 100,
  seo: 100,
  lcp: 2000,
  cls: 0.05,
  tbt: 200, // lab stand-in for INP
};

const argv = process.argv.slice(2);
const runsAt = argv.indexOf('--runs');
const RUNS = runsAt >= 0 ? Number(argv.splice(runsAt, 2)[1]) || 1 : 1;
const cpuAt = argv.indexOf('--cpu');
const fixedCpu = cpuAt >= 0 ? Number(argv.splice(cpuAt, 2)[1]) : undefined;
const defaultCpu = argv.includes('--default-cpu');
const args = argv
  .filter((a) => !a.startsWith('--'))
  .map(
    // Git Bash rewrites "/services" to "C:/Program Files/Git/services": undo that.
    (a) => a.replace(/^[A-Za-z]:[\\/].*?[\\/]Git(?=[\\/]|$)/, '').replaceAll('\\', '/') || '/',
  );
const walk = (dir, root = dir) =>
  readdirSync(dir).flatMap((n) => {
    const f = join(dir, n);
    if (statSync(f).isDirectory()) return walk(f, root);
    if (n !== 'index.html') return [];
    const rel = relative(root, dir).replaceAll('\\', '/');
    return [rel ? `/${rel}/` : '/'];
  });
const routes = args.length ? args : walk('dist/client');

const ASTRO = 4340;
const PORT = 4341;
const astroBin = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const astro = spawn(process.execPath, [astroBin, 'preview', '--port', String(ASTRO)], {
  stdio: 'ignore',
});

// HTTP/2 + brotli proxy in front of `astro preview`, which serves HTTP/1.1 uncompressed.
const keyFile = join(tmpdir(), 'savantho-lh-key.pem');
const certFile = join(tmpdir(), 'savantho-lh-cert.pem');
const ssl = spawnSync(
  'openssl',
  [
    'req',
    '-x509',
    '-newkey',
    'rsa:2048',
    '-nodes',
    '-days',
    '2',
    '-subj',
    '/CN=localhost',
    '-keyout',
    keyFile,
    '-out',
    certFile,
  ],
  { stdio: 'ignore' },
);
if (ssl.status !== 0) throw new Error('openssl is needed (Git Bash ships it) to serve HTTP/2.');
const HOP = ['connection', 'keep-alive', 'transfer-encoding', 'upgrade', 'proxy-connection'];
const proxy = createSecureServer(
  { key: readFileSync(keyFile), cert: readFileSync(certFile), allowHTTP1: true },
  (req, res) => {
    const headers = Object.fromEntries(
      Object.entries(req.headers).filter(([k]) => !k.startsWith(':') && !HOP.includes(k)),
    );
    const up = httpRequest(
      { host: 'localhost', port: ASTRO, path: req.url, method: req.method, headers },
      (r) => {
        const chunks = [];
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => {
          let body = Buffer.concat(chunks);
          const out = Object.fromEntries(
            Object.entries(r.headers).filter(([k]) => !HOP.includes(k)),
          );
          const type = String(out['content-type'] ?? '');
          if (/text|javascript|json|svg|xml|manifest/.test(type) && body.length > 512) {
            body = brotliCompressSync(body, { params: { [z.BROTLI_PARAM_QUALITY]: 11 } });
            out['content-encoding'] = 'br';
          }
          out['content-length'] = String(body.length);
          if (req.url.startsWith('/_astro/'))
            out['cache-control'] = 'public, max-age=31536000, immutable';
          res.writeHead(r.statusCode ?? 500, out);
          res.end(body);
        });
      },
    );
    up.on('error', () => {
      res.writeHead(502);
      res.end();
    });
    req.pipe(up);
  },
).listen(PORT);

const ready = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`http://localhost:${ASTRO}`)).ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start');
};

const rows = [];
const fails = [];
let chrome;
try {
  await ready();
  chrome = await chromeLauncher.launch({
    chromePath: chromium.executablePath(),
    chromeFlags: [
      '--headless=new',
      '--no-first-run',
      '--disable-gpu',
      '--ignore-certificate-errors',
    ],
  });
  await mkdir('reports/lighthouse', { recursive: true });
  const base = { port: chrome.port, output: 'json', logLevel: 'error' };
  const THROTTLE = {
    rttMs: 150,
    throughputKbps: 1638.4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675,
  };
  let cpu = fixedCpu ?? 4;
  if (!defaultCpu && fixedCpu === undefined) {
    const probe = await lighthouse(`https://localhost:${PORT}/`, {
      ...base,
      onlyCategories: ['performance'],
    });
    const bi = probe.lhr.environment.benchmarkIndex;
    cpu = Math.round(Math.min(4, Math.max(1, (4 * bi) / 2000)) * 10) / 10;
    console.log(`BenchmarkIndex ${Math.round(bi)} → CPU slowdown ${cpu}× (4× at BI 2000)
`);
  }
  for (const route of routes) {
    const runs = [];
    for (let i = 0; i < RUNS; i++)
      runs.push(
        (
          await lighthouse(`https://localhost:${PORT}${route}`, {
            ...base,
            throttling: { ...THROTTLE, cpuSlowdownMultiplier: cpu },
          })
        ).lhr,
      );
    runs.sort((a, b) => a.categories.performance.score - b.categories.performance.score);
    const lhr = runs[Math.floor(runs.length / 2)];
    const score = (k) => Math.round((lhr.categories[k]?.score ?? 0) * 100);
    const num = (id) => lhr.audits[id]?.numericValue ?? NaN;
    const scripts = (lhr.audits['resource-summary']?.details?.items ?? []).find(
      (i) => i.resourceType === 'script',
    );
    const row = {
      route,
      performance: score('performance'),
      accessibility: score('accessibility'),
      'best-practices': score('best-practices'),
      seo: score('seo'),
      lcp: Math.round(num('largest-contentful-paint')),
      cls: Math.round(num('cumulative-layout-shift') * 1000) / 1000,
      tbt: Math.round(num('total-blocking-time')),
      weightKB: Math.round(num('total-byte-weight') / 1024),
      jsKB: Math.round((scripts?.transferSize ?? 0) / 1024),
    };
    // SEO: a local server is not the canonical host, so Lighthouse flags noindex pages as
    // "not indexable". Those pages are noindex on purpose; record without failing them.
    const noindex = lhr.audits['is-crawlable']?.score === 0;
    const misses = [];
    for (const k of ['performance', 'accessibility', 'best-practices', 'seo']) {
      if (k === 'seo' && noindex) continue;
      if (row[k] < BUDGET[k]) misses.push(`${k} ${row[k]}`);
    }
    if (row.lcp > BUDGET.lcp) misses.push(`LCP ${row.lcp} ms`);
    if (row.cls > BUDGET.cls) misses.push(`CLS ${row.cls}`);
    if (row.tbt > BUDGET.tbt) misses.push(`TBT ${row.tbt} ms`);
    if (row.weightKB > 900) misses.push(`weight ${row.weightKB} KB`);
    const failed = Object.values(lhr.categories)
      .flatMap((c) => c.auditRefs)
      .filter((r) => r.weight > 0 && lhr.audits[r.id].score !== null && lhr.audits[r.id].score < 1)
      .map((r) => r.id)
      .filter((id, i, a) => a.indexOf(id) === i);
    row.notes = [noindex ? 'noindex (by design)' : '', ...misses].filter(Boolean).join('; ');
    row.failedAudits = failed;
    rows.push(row);
    if (misses.length) fails.push(`${route}: ${misses.join(', ')}`);
    const name = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replaceAll('/', '_');
    await writeFile(`reports/lighthouse/${name}.json`, JSON.stringify(lhr));
    console.log(
      `${route.padEnd(58)} P${row.performance} A${row.accessibility} BP${row['best-practices']} SEO${row.seo}  LCP ${row.lcp}ms CLS ${row.cls} TBT ${row.tbt}ms ${row.weightKB}KB${failed.length ? `  [${failed.join(', ')}]` : ''}`,
    );
  }
} finally {
  await chrome?.kill();
  proxy.close();
  astro.kill();
}

const md = [
  '| Route | Perf | A11y | BP | SEO | LCP | CLS | TBT | Weight | JS | Notes |',
  '|---|---|---|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (r) =>
      `| \`${r.route}\` | ${r.performance} | ${r.accessibility} | ${r['best-practices']} | ${r.seo} | ${(r.lcp / 1000).toFixed(2)} s | ${r.cls} | ${r.tbt} ms | ${r.weightKB} KB | ${r.jsKB} KB | ${r.notes} |`,
  ),
].join('\n');
await writeFile('reports/lighthouse/summary.md', `${md}\n`);
console.log(`\nSummary: reports/lighthouse/summary.md`);
if (fails.length) {
  console.error(`\nBelow budget:\n  ${fails.join('\n  ')}`);
  process.exit(1);
}
