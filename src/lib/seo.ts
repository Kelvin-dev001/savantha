/**
 * Search and sharing: page titles, absolute URLs and the JSON-LD graph.
 *
 * Every page carries one `@graph`: the organisation (Organization + ProfessionalService),
 * the website, and the page itself, plus whatever the page adds (Service, Article, FAQPage,
 * BreadcrumbList). Nodes refer to each other by `@id`, so the organisation is described once.
 *
 * Placeholders never reach structured data: any value still holding a [[PLACEHOLDER]] is
 * left out rather than published to search engines.
 */
import { isPlaceholder, site } from '@/config/site';

export const TITLE_SUFFIX = ` | ${site.name}`;
export const TITLE_MAX = 60;
export const DESCRIPTION_MAX = 155;

/** OG card size (the generated PNGs in src/pages/og). */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export const absolute = (path: string) => new URL(path, site.url).href;

/** A page URL as the canonical tags write it: absolute, with a trailing slash. */
export const pageUrl = (path: string) =>
  absolute(path.endsWith('/') || /\.\w+$/.test(path) ? path : `${path}/`);

export const ids = {
  organization: `${site.url}/#organization`,
  website: `${site.url}/#website`,
  logo: `${site.url}/#logo`,
  webpage: (url: string) => `${url}#webpage`,
  breadcrumb: (url: string) => `${url}#breadcrumb`,
  service: (url: string) => `${url}#service`,
  article: (url: string) => `${url}#article`,
  faq: (url: string) => `${url}#faq`,
};

export type JsonLdNode = Record<string, unknown>;

/** A string, or nothing if it is still a placeholder. */
const real = (v?: string) => (v && !isPlaceholder(v) ? v : undefined);

/** Drop undefined values and empty arrays so the output stays tidy. */
export function clean<T extends JsonLdNode>(node: T): T {
  return Object.fromEntries(
    Object.entries(node).filter(
      ([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0),
    ),
  ) as T;
}

/** Full page title: "Page | Savantho Consultancy". */
export const pageTitle = (title: string) =>
  title === site.name ? title : `${title}${TITLE_SUFFIX}`;

/**
 * The site-wide nodes. `services` lists the six services (name + URL) as the organisation's
 * catalogue, so every page tells search engines what Savantho offers.
 */
export function organizationGraph(services: { title: string; href: string }[]): JsonLdNode[] {
  const sameAs = Object.values(site.socials).filter((v): v is string => Boolean(real(v)));
  const locality = real(site.address.city);
  const street = site.address.lines.map(real).filter(Boolean).join(', ') || undefined;

  const organization = clean({
    '@type': ['Organization', 'ProfessionalService'],
    '@id': ids.organization,
    name: site.name,
    legalName: site.legalName,
    alternateName: site.shortName,
    slogan: site.tagline,
    description: site.positioning,
    url: `${site.url}/`,
    logo: {
      '@type': 'ImageObject',
      '@id': ids.logo,
      url: absolute('/icon-512.png'),
      width: 512,
      height: 512,
      caption: site.name,
    },
    image: { '@id': ids.logo },
    email: site.email,
    telephone: site.phone.e164,
    address: clean({
      '@type': 'PostalAddress',
      streetAddress: street,
      addressLocality: locality,
      addressCountry: 'KE',
    }),
    areaServed: { '@type': 'Country', name: 'Kenya' },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'customer service',
        telephone: site.phone.e164,
        email: site.email,
        areaServed: 'KE',
        availableLanguage: ['en'],
      },
    ],
    knowsAbout: services.map((s) => s.title),
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, url: absolute(s.href) },
      })),
    },
    identifier: real(site.registration)
      ? {
          '@type': 'PropertyValue',
          propertyID: 'Kenya company registration number',
          value: site.registration,
        }
      : undefined,
    sameAs,
  });

  const website = {
    '@type': 'WebSite',
    '@id': ids.website,
    url: `${site.url}/`,
    name: site.name,
    description: site.positioning,
    inLanguage: site.locale,
    publisher: { '@id': ids.organization },
  };

  return [organization, website];
}

export function webPageNode(opts: {
  url: string;
  name: string;
  description: string;
  image: string;
  type?: string;
}): JsonLdNode {
  return clean({
    '@type': opts.type ?? 'WebPage',
    '@id': ids.webpage(opts.url),
    url: opts.url,
    name: opts.name,
    description: opts.description,
    inLanguage: site.locale,
    isPartOf: { '@id': ids.website },
    about: { '@id': ids.organization },
    primaryImageOfPage: { '@type': 'ImageObject', url: opts.image, ...OG_SIZE },
  });
}

/**
 * BreadcrumbList from a visible trail. "Home" is prepended; links to an anchor on another
 * page (e.g. /services#grow) are skipped, since a breadcrumb item must be a page; the last
 * item is the current page.
 */
export function breadcrumbNode(
  url: string,
  items: { label: string; href?: string }[],
  homeLabel = 'Home',
): JsonLdNode {
  const trail = [
    { label: homeLabel, href: '/' },
    ...items.filter((item, i) => i === items.length - 1 || !item.href?.includes('#')),
  ];
  return {
    '@type': 'BreadcrumbList',
    '@id': ids.breadcrumb(url),
    itemListElement: trail.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.label,
      item: i === trail.length - 1 ? url : pageUrl(item.href ?? '/'),
    })),
  };
}

/** JSON for a <script type="application/ld+json">, safe to inline in HTML. */
export const jsonLdString = (graph: JsonLdNode[]) =>
  JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');

/** Any value as JSON that is safe inside an inline <script> element. */
export const inlineJson = (value: unknown) => JSON.stringify(value).replace(/</g, '\\u003c');
