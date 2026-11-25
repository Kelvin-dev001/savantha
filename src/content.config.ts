import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Compliance-sensitive copy lives in content files so an advocate can review it in one place.
 * Phase 4 adds `services`; Phase 6 adds `insights`.
 */
const legal = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    updated: z.coerce.date().optional(),
    reviewedBy: z.string().optional(),
  }),
});

export const collections = { legal };
