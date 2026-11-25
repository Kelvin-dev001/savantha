/**
 * robots.txt. Everything is open to crawlers (AI search included) except the enquiry
 * endpoint; pages that should not be listed carry `noindex` and stay out of the sitemap.
 */
import type { APIRoute } from 'astro';
import { absolute } from '@/lib/seo';

export const GET: APIRoute = () =>
  new Response(
    [
      'User-agent: *',
      'Allow: /',
      'Disallow: /api/',
      '',
      `Sitemap: ${absolute('/sitemap-index.xml')}`,
      '',
    ].join('\n'),
    { headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
  );
