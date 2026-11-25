import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/**
 * Compliance-sensitive copy lives in content files so an advocate can review it in one place.
 * Phase 6 completes `insights` (list, article template, bodies).
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

/** Service slugs (routes under /services). Each has one file in src/content/services/. */
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

/** Answer-first FAQ answers: 40–60 words each (brief §4). */
const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const faqAnswer = z.string().refine(
  (a) => wordCount(a) >= 40 && wordCount(a) <= 60,
  (a) => ({ message: `FAQ answers must be 40–60 words (this one is ${wordCount(a)}).` }),
);

export const pillarKeys = ['grow', 'trade', 'build'] as const;
const pillarKey = z.enum(pillarKeys);

/**
 * The six services, one Markdown file each (frontmatter only). The schema follows the brief:
 * title, pillar, slug, summary, audience[], deliverables[], process[], timeline, faqs[],
 * whatsappMessage, seoTitle, seoDescription, order, plus the few fields the page template
 * needs to read well (answer-first intros, what we do not do, the Shariah principles).
 */
const services = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    /** Lower-case name used inside sentences ("Talk to us about trade finance"). */
    shortTitle: z.string(),
    pillar: pillarKey,
    slug: serviceSlug,
    /** One or two sentences: hub rows, related services, meta fallbacks. */
    summary: z.string().max(200),
    /** Hero paragraph, answer first: what the service is and what it is for. */
    lead: z.string(),
    /** How the work is delivered, e.g. "One-to-one, in person or online". */
    format: z.string(),
    audience: z.array(z.string()).min(3).max(5),
    deliverables: z
      .array(z.object({ title: z.string(), detail: z.string() }))
      .min(4)
      .max(6),
    /** What we do not do: plain statements of scope (compliance and trust). */
    boundaries: z.array(z.string()).min(2).max(4),
    process: z
      .array(z.object({ step: z.string(), detail: z.string() }))
      .min(3)
      .max(5),
    timeline: z.object({
      /** Short answer for the hero ledger, e.g. "Four to six weeks". */
      headline: z.string(),
      summary: z.string(),
      stages: z
        .array(z.object({ label: z.string(), duration: z.string() }))
        .min(3)
        .max(5),
    }),
    /** Answer-first paragraph under each section heading. */
    intros: z.object({ audience: z.string(), deliverables: z.string(), process: z.string() }),
    /** Optional explainer section (the Shariah screening principles). */
    principles: z
      .object({
        label,
        heading: z.string(),
        lead: z.string(),
        items: z
          .array(z.object({ term: z.string(), gloss: z.string(), detail: z.string() }))
          .min(3),
        reviewerLabel: label,
        reviewer: z.string(),
      })
      .optional(),
    faqs: z
      .array(z.object({ q: z.string(), a: faqAnswer }))
      .min(5)
      .max(6),
    related: z.array(serviceSlug).min(2).max(3),
    whatsappMessage: z.string().startsWith('Hello Savantho'),
    /** Rendered as "<seoTitle> | Savantho Consultancy", which must stay ≤ 60 characters. */
    seoTitle: z.string().max(60 - ' | Savantho Consultancy'.length),
    seoDescription: z.string().max(155),
    order: z.number().int(),
  }),
});

/** Pillars, the services hub, and the labels used by the service page template. */
const servicesHub = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/services-hub' }),
  schema: z.object({
    pillars: z
      .array(
        z.object({
          key: pillarKey,
          numeral: z.string(),
          title: z.string(),
          line: z.string(),
          intro: z.string(),
        }),
      )
      .length(3),
    hub: z.object({
      eyebrow: label,
      headline,
      lead: z.string(),
      proof: z.string(),
      indexLabel: label,
      countLabel: z.object({ one: z.string(), many: z.string() }),
      unsure: z.object({ heading: z.string(), body: z.string(), cta: z.string() }),
      seoTitle: z.string().max(37),
      seoDescription: z.string().max(155),
    }),
    page: z.object({
      breadcrumbLabel: label,
      breadcrumb: label,
      pillarLabel: label,
      heroCta: z.string(),
      heroLink: link,
      factsLabel: label,
      facts: z.object({
        format: label,
        timeline: label,
        firstStep: label,
        firstStepValue: z.string(),
        fees: label,
        feesValue: z.string(),
      }),
      sections: z.object({
        audience: z.object({ label, heading: z.string() }),
        deliverables: z.object({ label, heading: z.string() }),
        boundaries: label,
        total: z.object({ label, text: z.string() }),
        process: z.object({ label, heading: z.string() }),
        timeline: z.object({ label, heading: z.string(), note: z.string() }),
        faq: z.object({ label, heading: z.string(), link }),
        related: z.object({ label, heading: z.string() }),
      }),
      disclaimerLabel: label,
    }),
  }),
});

export const collections = { legal, home, stories, insights, services, servicesHub };
