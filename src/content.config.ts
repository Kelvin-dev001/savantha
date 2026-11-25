import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Compliance-sensitive copy lives in content files so an advocate can review it in one place.
 * Phase 4 adds `services`; Phase 6 completes `insights` (list, article template, bodies).
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

/** Service slugs (routes under /services). Phase 4 turns these into the `services` collection. */
export const serviceSlugs = [
  'wealth-planning',
  'shariah-compliant-finance',
  'real-estate',
  'trade-finance',
  'financial-literacy',
  'project-me',
] as const;
const serviceSlug = z.enum(serviceSlugs);

const label = z.string();
const link = z.object({ label: z.string(), href: z.string() });
const headline = z
  .array(z.object({ text: z.string(), emphasis: z.string().optional() }))
  .min(1)
  .max(3);

/** Homepage copy, one YAML file, one key per section. */
const home = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/home' }),
  schema: z.object({
    hero: z.object({
      headline,
      lead: z.string(),
      primaryCta: z.string(),
      secondaryCta: link,
      next: z.object({
        label,
        steps: z.array(z.object({ title: z.string(), detail: z.string() })).length(3),
      }),
    }),
    audiences: z.object({
      label,
      /** The heading sentence. Segments with `note` are the audiences, footnoted 1–3. */
      sentence: z.array(z.object({ text: z.string(), note: z.number().int().optional() })),
      askingLabel: label,
      items: z
        .array(
          z.object({
            title: z.string(),
            question: z.string(),
            body: z.string(),
            services: z.array(serviceSlug).min(1),
          }),
        )
        .length(3),
    }),
    pillars: z.object({
      label,
      heading: z.string(),
      lead: z.string(),
      link,
      countLabel: z.object({ one: z.string(), many: z.string() }),
      open: z.string(),
    }),
    process: z.object({
      label,
      heading: z.string(),
      lead: z.string(),
      outcomeLabel: label,
      stepLabel: label,
      steps: z
        .array(z.object({ title: z.string(), body: z.string(), outcome: z.string() }))
        .length(4),
    }),
    values: z.object({
      label,
      heading: z.string(),
      lead: z.string(),
      rows: z.array(z.object({ value: z.string(), proof: z.string() })).length(4),
      total: z.object({ label, text: z.string() }),
    }),
    stories: z.object({
      label,
      heading: z.string(),
      emptyLead: z.string(),
      emptyColumns: z.array(z.string()).length(3),
      emptyNote: z.string(),
    }),
    insights: z.object({
      label,
      heading: z.string(),
      lead: z.string(),
      link,
      pending: z.string(),
      minutes: z.string(),
    }),
    faq: z.object({
      label,
      heading: z.string(),
      link,
      items: z.array(z.object({ q: z.string(), a: z.string() })).length(4),
    }),
    cta: z.object({
      heading: headline,
      lead: z.string(),
      primary: z.string(),
      callLabel: label,
      emailLabel: label,
    }),
  }),
});

/**
 * Client stories. Empty until clients agree to be quoted: the homepage then explains why,
 * rather than inventing anything. `consent` must be literally true to publish.
 * Stories talk about the process and the experience, never investment returns.
 */
const stories = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/stories' }),
  schema: z.object({
    client: z.string(),
    service: serviceSlug,
    quote: z.string().max(280),
    consent: z.literal(true),
    consentDate: z.coerce.date(),
    order: z.number().default(0),
  }),
});

/** Insights (MDX). Phase 6 adds the list, the article template and the full articles. */
const insights = defineCollection({
  loader: glob({ pattern: '**/[^_]*.{md,mdx}', base: './src/content/insights' }),
  schema: z.object({
    title: z.string().max(90),
    summary: z.string().max(200),
    category: z.enum(['Ethical finance', 'Trade finance', 'Family finance', 'Business finance']),
    publishedAt: z.coerce.date().optional(),
    draft: z.boolean().default(false),
    readingMinutes: z.number().int().positive().optional(),
    seoTitle: z.string().max(60).optional(),
    seoDescription: z.string().max(155).optional(),
  }),
});

export const collections = { legal, home, stories, insights };
