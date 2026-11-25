// @ts-check
import { defineConfig, envField } from 'astro/config';
import mdx from '@astrojs/mdx';
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

// https://astro.build/config
export default defineConfig({
  site: 'https://savantho.net',
  trailingSlash: 'ignore',
  output: 'static',
  adapter,
  integrations: [mdx()],
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
  vite: {
    plugins: [tailwindcss()],
  },
});
