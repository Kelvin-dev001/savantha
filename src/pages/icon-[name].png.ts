/** /icon-192.png, /icon-512.png and /icon-maskable.png for the web manifest and JSON-LD logo. */
import type { APIRoute, GetStaticPaths } from 'astro';
import { iconPng, png } from '@/lib/icons';

const icons = {
  '192': { size: 192, inset: 1 },
  '512': { size: 512, inset: 1 },
  // Maskable: the mark stays inside the 80 % safe zone.
  maskable: { size: 512, inset: 0.72 },
} as const;

export const getStaticPaths = (() =>
  Object.keys(icons).map((name) => ({ params: { name } }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const { size, inset } = icons[params.name as keyof typeof icons];
  return png(await iconPng(size, inset));
};
