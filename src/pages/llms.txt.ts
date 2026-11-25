/**
 * /llms.txt (llmstxt.org): who Savantho is, its services, what it does not do, and how to
 * get in touch, in Markdown for AI search and assistants. Built from the same content as
 * the pages, so it cannot drift from them. Prose lives in pages.yaml → seo.llms.
 * Drafts awaiting review are left out; placeholders are never published.
 */
import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { isPlaceholder, site } from '@/config/site';
import { pageUrl as url } from '@/lib/seo';
import { getInsights } from '@/lib/insights';
import { getHub, getPillars, getServices } from '@/lib/services';
import { legalRoutes } from '@/lib/legal';

const oneLine = (s: string) => s.replace(/\s+/g, ' ').trim();

export const GET: APIRoute = async () => {
  const [pagesEntry, aboutEntry, contactEntry, hub, pillars, services, { insights }] =
    await Promise.all([
      getEntry('pages', 'pages'),
      getEntry('about', 'about'),
      getEntry('contact', 'contact'),
      getHub(),
      getPillars(),
      getServices(),
      getInsights(),
    ]);
  const pages = pagesEntry!.data;
  const about = aboutEntry!.data;
  const contact = contactEntry!.data;
  const t = pages.seo.llms;
  const legal = await Promise.all(
    legalRoutes.map(async (l) => ({
      route: l.route,
      data: (await getEntry('legal', l.entry))!.data,
    })),
  );
  const published = insights.filter((a) => !a.draft);

  const lines: string[] = [
    `# ${site.name}`,
    '',
    `> ${oneLine(t.summary)}`,
    '',
    ...t.intro.flatMap((p) => [oneLine(p), '']),
    `## ${t.servicesHeading}`,
    '',
    `- [${hub.hub.seoTitle}](${url('/services')}): ${oneLine(hub.hub.seoDescription)}`,
    ...pillars.flatMap((p) =>
      services
        .filter((s) => s.data.pillar === p.key)
        .map(
          (s) =>
            `- [${s.data.title}](${url(`/services/${s.data.slug}`)}) (${p.title}): ${oneLine(s.data.summary)}`,
        ),
    ),
    '',
    `## ${t.boundariesHeading}`,
    '',
    ...t.boundaries.map((b) => `- ${oneLine(b)}`),
    '',
    `## ${t.guidesHeading}`,
    '',
    `- [${pages.insights.seoTitle}](${url('/insights')}): ${oneLine(pages.insights.seoDescription)}`,
    ...(published.length
      ? published.map((a) => `- [${a.title}](${url(a.href)}): ${oneLine(a.summary)}`)
      : [`- ${oneLine(t.guidesNote)}`]),
    '',
    `## ${t.companyHeading}`,
    '',
    `- [${about.seoTitle}](${url('/about')}): ${oneLine(about.seoDescription)}`,
    `- [${pages.faq.seoTitle}](${url('/faq')}): ${oneLine(pages.faq.seoDescription)}`,
    `- [${contact.seoTitle}](${url('/contact')}): ${oneLine(contact.seoDescription)}`,
    '',
    `## ${t.contactHeading}`,
    '',
    `- ${t.contactLabels.whatsapp}: https://wa.me/${site.whatsapp}`,
    `- ${t.contactLabels.phone}: ${site.phone.display}`,
    `- ${t.contactLabels.email}: ${site.email}`,
    ...site.hours
      .filter((h) => !isPlaceholder(h.time))
      .map((h) => `- ${t.contactLabels.hours}: ${h.days}, ${h.time}`),
    `- ${t.contactLabels.form}: ${url('/contact')}`,
    '',
    `## ${t.optionalHeading}`,
    '',
    ...legal.map(
      (l) =>
        `- [${l.data.title}](${url(`/${l.route}`)})${l.data.summary ? `: ${oneLine(l.data.summary)}` : ''}`,
    ),
    '',
  ];

  if (lines.some((l) => isPlaceholder(l))) {
    throw new Error('/llms.txt would publish a [[PLACEHOLDER]]. Filter it out at the source.');
  }
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
