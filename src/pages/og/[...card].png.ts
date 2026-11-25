/**
 * /og/<page>.png: the Open Graph card for each page, generated at build time.
 * The list of cards (and their text) lives in src/lib/og.ts.
 */
import type { APIRoute, GetStaticPaths } from 'astro';
import { getOgCards, renderOgCard, type OgCard } from '@/lib/og';

export const getStaticPaths = (async () =>
  (await getOgCards()).map((card) => ({
    params: { card: card.key },
    props: { card },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const png = await renderOgCard((props as { card: OgCard }).card);
  return new Response(new Uint8Array(png), { headers: { 'Content-Type': 'image/png' } });
};
