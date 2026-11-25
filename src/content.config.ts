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

/** Homepage copy, one YAML file. Phase 3 extends the schema section by section. */
const home = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/home' }),
  schema: z.object({
    hero: z.object({
      headline: z
        .array(z.object({ text: z.string(), emphasis: z.string().optional() }))
        .min(1)
        .max(3),
      lead: z.string(),
      primaryCta: z.string(),
      secondaryCta: z.object({ label: z.string(), href: z.string() }),
      next: z.object({
        label: z.string(),
        steps: z.array(z.object({ title: z.string(), detail: z.string() })).length(3),
      }),
    }),
  }),
});

export const collections = { legal, home };
