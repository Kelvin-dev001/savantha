/**
 * Services: one place to read the `services` collection and the pillar copy in
 * `src/content/services-hub/hub.yaml`. The header, footer, homepage, hub and service pages
 * all build their pillar → service lists from here, so a service added or renamed in
 * content shows up everywhere.
 */
import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

export type Service = CollectionEntry<'services'>;
export type PillarKey = Service['data']['pillar'];
export type ServiceSlug = Service['data']['slug'];
export type Hub = CollectionEntry<'servicesHub'>['data'];

export interface NavService {
  slug: ServiceSlug;
  title: string;
  summary: string;
  href: string;
  pillar: PillarKey;
}
export interface NavPillar {
  key: PillarKey;
  numeral: string;
  title: string;
  line: string;
  intro: string;
  services: NavService[];
}

export const serviceHref = (slug: string) => `/services/${slug}`;

/** All six services, in `order`. Fails the build if a file's slug and name disagree. */
export async function getServices(): Promise<Service[]> {
  const all = await getCollection('services');
  for (const s of all) {
    if (s.id !== s.data.slug)
      throw new Error(
        `src/content/services/${s.id}.md: slug "${s.data.slug}" must match the file name.`,
      );
  }
  return all.sort((a, b) => a.data.order - b.data.order);
}

export async function getHub(): Promise<Hub> {
  const hub = await getEntry('servicesHub', 'hub');
  if (!hub) throw new Error('src/content/services-hub/hub.yaml is required.');
  return hub.data;
}

const toNav = (s: Service): NavService => ({
  slug: s.data.slug,
  title: s.data.title,
  summary: s.data.summary,
  href: serviceHref(s.data.slug),
  pillar: s.data.pillar,
});

/** The three pillars with their services, in order. */
export async function getPillars(): Promise<NavPillar[]> {
  const [hub, services] = await Promise.all([getHub(), getServices()]);
  return hub.pillars.map((p) => ({
    ...p,
    services: services.filter((s) => s.data.pillar === p.key).map(toNav),
  }));
}

/** Look up services by slug, e.g. `(await getServiceIndex()).get('trade-finance')`. */
export async function getServiceIndex(): Promise<Map<string, NavService>> {
  const services = await getServices();
  return new Map(services.map((s) => [s.data.slug, toNav(s)]));
}
