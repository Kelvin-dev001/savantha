import type { APIRoute } from 'astro';
import { iconPng, png } from '@/lib/icons';

/** 180 × 180, full bleed on ink: iOS rounds the corners itself. */
export const GET: APIRoute = async () => png(await iconPng(180, 0.86));
