import type { APIRoute } from 'astro';
import { site } from '@/config/site';
import { readColorTokens } from '@/lib/tokens';

const ivory = readColorTokens().find((t) => t.name === 'ivory')!.value;

export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: site.name,
        short_name: site.shortName,
        description: site.positioning,
        lang: site.locale,
        start_url: '/',
        display: 'browser',
        theme_color: site.themeColor,
        background_color: ivory,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      null,
      2,
    ),
    { headers: { 'Content-Type': 'application/manifest+json' } },
  );
