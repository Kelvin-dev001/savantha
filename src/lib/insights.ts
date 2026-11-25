/**
 * Insights: one place to read the `insights` collection and its copy in
 * src/content/pages/pages.yaml → insights. The homepage teaser, the list, the category
 * pages and the article template all read articles from here, so ordering, reading time
 * and draft handling stay the same everywhere.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type InsightEntry = CollectionEntry<'insights'>;
export type CategoryKey = InsightEntry['data']['category'];
export type InsightsCopy = CollectionEntry<'pages'>['data']['insights'];

export interface Category {
  key: CategoryKey;
  title: string;
  line: string;
  seoDescription: string;
  href: string;
  count: number;
}

export interface Insight {
  id: string;
  href: string;
  title: string;
  summary: string;
  category: Category;
  draft: boolean;
  publishedAt?: Date;
  updatedAt?: Date;
  minutes: number;
  keyPoints: string[];
  entry: InsightEntry;
}

export const insightHref = (id: string) => `/insights/${id}`;
export const categoryHref = (key: string) => `/insights/category/${key}`;

const WORDS_PER_MINUTE = 220;

/** Reading time from the MDX body: words outside tags, imports and comments. */
function readingMinutes(body = ''): number {
  const text = body
    .replace(/^(import|export)\s.*$/gm, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#>*_`|[\]()-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

export async function getInsightsCopy(): Promise<InsightsCopy> {
  const pages = await getEntry('pages', 'pages');
  if (!pages) throw new Error('src/content/pages/pages.yaml is required.');
  return pages.data.insights;
}

/**
 * Every article: published first, newest first; then drafts by `order`.
 * Categories carry their article counts.
 */
export async function getInsights(): Promise<{ insights: Insight[]; categories: Category[] }> {
  const [copy, entries] = await Promise.all([getInsightsCopy(), getCollection('insights')]);

  const categories: Category[] = copy.categories.map((c) => ({
    ...c,
    href: categoryHref(c.key),
    count: entries.filter((e) => e.data.category === c.key).length,
  }));
  const byKey = new Map(categories.map((c) => [c.key, c]));

  const time = (d?: Date) => d?.getTime() ?? 0;
  const sorted = entries.sort((a, b) => {
    if (a.data.draft !== b.data.draft) return a.data.draft ? 1 : -1;
    const byDate = time(b.data.publishedAt) - time(a.data.publishedAt);
    return byDate || a.data.order - b.data.order;
  });

  const insights = sorted.map((entry) => ({
    id: entry.id,
    href: insightHref(entry.id),
    title: entry.data.title,
    summary: entry.data.summary,
    category: byKey.get(entry.data.category)!,
    draft: entry.data.draft,
    publishedAt: entry.data.publishedAt,
    updatedAt: entry.data.updatedAt,
    minutes: entry.data.readingMinutes ?? readingMinutes(entry.body),
    keyPoints: entry.data.keyPoints,
    entry,
  }));

  return { insights, categories };
}

/** "25 Nov 2026" in lists; `long` gives "25 November 2026". */
export const formatDate = (d: Date, style: 'short' | 'long' = 'short') =>
  new Intl.DateTimeFormat('en-KE', {
    day: 'numeric',
    month: style === 'long' ? 'long' : 'short',
    year: 'numeric',
  }).format(d);

export const isoDate = (d: Date) => d.toISOString().slice(0, 10);
