#!/usr/bin/env node
/**
 * Checkpoint screenshots. Serves the production build and captures full-page PNGs.
 *   npm run build && npm run shots -- /styleguide /            (default: /styleguide)
 *   npm run shots -- --phase 2 /
 * Output: screenshots/phase-<n>/<route>-<width>.png  (gitignored)
 */
import { spawn } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const args = process.argv.slice(2);
let phase = '1';
const routes = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--phase') phase = args[++i];
  // Git Bash rewrites "/styleguide" to "C:/Program Files/Git/styleguide" — undo that.
  else
    routes.push(
      args[i].replace(/^[A-Za-z]:[\\/].*?[\\/]Git(?=[\\/]|$)/, '').replaceAll('\\', '/') || '/',
    );
}
if (!routes.length) routes.push('/styleguide');

const PORT = 4329;
const base = `http://localhost:${PORT}`;
const widths = [
  { w: 1440, h: 900 },
  { w: 390, h: 844 },
];
const outDir = `screenshots/phase-${phase}`;
await mkdir(outDir, { recursive: true });

// Run Astro's CLI with this Node binary directly (no shell), so the server can be killed cleanly.
const astroBin = fileURLToPath(new URL('../node_modules/astro/astro.js', import.meta.url));
const server = spawn(process.execPath, [astroBin, 'preview', '--port', String(PORT)], {
  stdio: 'ignore',
});
const ready = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(base);
      if (r.ok || r.status === 404) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview server did not start');
};

try {
  await ready();
  const browser = await chromium.launch();
  for (const route of routes) {
    for (const { w, h } of widths) {
      const page = await browser.newPage({
        viewport: { width: w, height: h },
        deviceScaleFactor: 1,
      });
      await page.goto(base + route, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(2200); // let the lattice draw finish
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      const name =
        (route === '/' ? 'home' : route.replace(/^\//, '').replaceAll('/', '_')) + `-${w}.png`;
      await page.screenshot({ path: `${outDir}/${name}`, fullPage: true });
      console.log(
        `${outDir}/${name}${overflow > 0 ? `  ⚠ horizontal overflow ${overflow}px` : ''}`,
      );
      await page.close();
    }
  }
  await browser.close();
} finally {
  server.kill();
}
