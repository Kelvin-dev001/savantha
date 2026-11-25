/**
 * Navigation structure. Pillar/service titles mirror the brief; in Phase 4 the
 * service list will be derived from the `services` content collection.
 */

export interface NavService {
  title: string;
  href: string;
}
export interface NavPillar {
  key: 'grow' | 'trade' | 'build';
  numeral: string;
  title: string;
  line: string;
  services: NavService[];
}

export const pillars: NavPillar[] = [
  {
    key: 'grow',
    numeral: 'I',
    title: 'Grow',
    line: 'Plan, structure and protect family wealth on ethical terms.',
    services: [
      { title: 'Wealth Planning Consultancy', href: '/services/wealth-planning' },
      { title: 'Shariah-Compliant Finance Guidance', href: '/services/shariah-compliant-finance' },
      { title: 'Real Estate Advisory', href: '/services/real-estate' },
    ],
  },
  {
    key: 'trade',
    numeral: 'II',
    title: 'Trade',
    line: 'Structure the finance behind what you import and export.',
    services: [{ title: 'Trade Finance Consultancy', href: '/services/trade-finance' }],
  },
  {
    key: 'build',
    numeral: 'III',
    title: 'Build',
    line: 'Grow financial capability in teams, and measure what programmes achieve.',
    services: [
      { title: 'Financial Literacy Training', href: '/services/financial-literacy' },
      { title: 'Project Monitoring & Evaluation', href: '/services/project-me' },
    ],
  },
];

export const primaryNav = [
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export const companyLinks = [
  { label: 'About', href: '/about' },
  { label: 'Insights', href: '/insights' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
];

export const legalLinks = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Disclaimer', href: '/disclaimer' },
];

/** UI strings used by layout components (kept out of the components themselves). */
export const ui = {
  skipLink: 'Skip to content',
  homeLinkSuffix: 'Consultancy, home',
  menu: 'Menu',
  close: 'Close',
  services: 'Services',
  pillar: 'Pillar',
  allServices: 'All services',
  talkToUs: 'Talk to us',
  mainNavLabel: 'Main',
  footerNavLabel: 'Footer',
  megaNote:
    'Not sure which fits? Tell us what you are trying to do. We will point you to the right place.',
  footerPillars: 'Services',
  footerCompany: 'Company',
  footerContact: 'Contact',
  footerLegal: 'Legal',
  registration: 'Company registration',
  whatsappLabel: 'WhatsApp',
  callLabel: 'Call',
  emailLabel: 'Email',
  rights: 'All rights reserved.',
};

/** Look up a service (title + route) by its slug, e.g. 'trade-finance'. */
export function serviceBySlug(slug: string): NavService & { pillar: NavPillar['key'] } {
  for (const p of pillars) {
    const s = p.services.find((x) => x.href === `/services/${slug}`);
    if (s) return { ...s, pillar: p.key };
  }
  throw new Error(`Unknown service slug: ${slug}`);
}
