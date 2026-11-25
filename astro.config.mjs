// @ts-check
import { defineConfig, envField } from 'astro/config';
import { readdirSync, readFileSync } from 'node:fs';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

/**
 * Static site; one on-demand route (`/api/contact`, `prerender = false`).
 * On Vercel (VERCEL=1 during builds) that route becomes a Vercel function. Locally the Node
 * adapter is used instead, because the Vercel adapter does not support `astro preview`, and
 * the Playwright tests and screenshot script run against the preview server.
 */
const adapter = process.env.VERCEL
  ? (await import('@astrojs/vercel')).default()
  : (await import('@astrojs/node')).default({ mode: 'standalone' });

const SITE = 'https://savantho.net';

/**
 * Pages kept out of the sitemap. They are the pages that carry `noindex`: utility pages,
 * the form's result pages, and insights still marked `draft: true` (read from their
 * frontmatter, since content collections are not available here). tests/seo.spec.ts checks
 * that the sitemap and the noindex tags agree.
 */
const insightsDir = new URL('./src/content/insights/', import.meta.url);
const draftInsights = readdirSync(insightsDir)
  .filter((f) => /^[^_].*\.mdx?$/.test(f))
  .filter((f) => /^draft:\s*true\s*$/m.test(readFileSync(new URL(f, insightsDir), 'utf8')))
  .map((f) => `/insights/${f.replace(/\.mdx?$/, '')}/`);
const unlisted = [
  '/styleguide/',
  '/404/',
  '/contact/thank-you/',
  '/contact/not-sent/',
  ...draftInsights,
];

// https://astro.build/config
export default defineConfig({
  site: SITE,
  trailingSlash: 'ignore',
  output: 'static',
  adapter,
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !unlisted.includes(new URL(page).pathname),
    }),
  ],
  // Hosts the on-demand route may trust. Without this list Astro ignores the Host header,
  // reads every request as "http://localhost", and its origin check then rejects plain
  // (no-JavaScript) form posts to /api/contact as cross-site.
  security: {
    checkOrigin: true,
    allowedDomains: [
      { hostname: 'savantho.net', protocol: 'https' },
      { hostname: 'www.savantho.net', protocol: 'https' },
      { hostname: '**.vercel.app', protocol: 'https' },
      { hostname: 'localhost' },
    ],
  },
  // Read at runtime by /api/contact (never inlined into the build). See .env.example.
  env: {
    schema: {
      RESEND_API_KEY: envField.string({ context: 'server', access: 'secret', optional: true }),
      CONTACT_TO_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'info@savantho.net',
      }),
      CONTACT_FROM_EMAIL: envField.string({
        context: 'server',
        access: 'secret',
        default: 'Savantho website <website@savantho.net>',
      }),
      CONTACT_DRY_RUN: envField.boolean({ context: 'server', access: 'secret', default: false }),
      CONTACT_RATE_LIMIT: envField.number({ context: 'server', access: 'secret', default: 5 }),
    },
  },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  // CSS goes inline in each page (≈ 17 KB gz): no render-blocking stylesheet requests on a
  // slow first visit. Allowed by the CSP's style-src 'unsafe-inline'; scripts stay external.
  build: { inlineStylesheets: 'always' },
  vite: {
    plugins: [tailwindcss()],
    // Never inline scripts (or other assets) into the HTML, so the Content-Security-Policy in
    // vercel.json can stay at script-src 'self' with no 'unsafe-inline'.
    build: { assetsInlineLimit: 0 },
  },
});
