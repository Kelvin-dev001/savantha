/**
 * Single source of truth for Savantho's identity and contact details.
 * Components must read from here — never hard-code a phone number, email or address.
 * Values wrapped in [[DOUBLE BRACKETS]] are placeholders awaiting the client (see PLACEHOLDERS.md).
 */

export type SocialKey = 'linkedin' | 'instagram' | 'facebook' | 'x' | 'youtube' | 'tiktok';

export interface SiteConfig {
  name: string;
  legalName: string;
  shortName: string;
  tagline: string;
  positioning: string;
  url: string;
  locale: string;
  phone: { display: string; e164: string };
  whatsapp: string;
  email: string;
  address: { lines: string[]; city: string; country: string };
  hours: { days: string; time: string }[];
  registration: string;
  socials: Partial<Record<SocialKey, string>>;
  values: string[];
  themeColor: string;
}

export const site: SiteConfig = {
  name: 'Savantho Consultancy',
  legalName: 'Savantho Consultancy Limited',
  shortName: 'Savantho',
  tagline: 'Building Wealth, Creating Legacy',
  positioning:
    'Ethical financial consultancy for Kenyan families and businesses, from first budget to lasting legacy.',
  url: 'https://savantho.net',
  locale: 'en-KE',
  // TO CONFIRM with client
  phone: { display: '+254 735 093269', e164: '+254735093269' },
  whatsapp: '254735093269',
  email: 'info@savantho.net',
  address: { lines: ['[[OFFICE ADDRESS]]'], city: '[[CITY]]', country: 'Kenya' },
  hours: [
    { days: 'Monday – Friday', time: '[[08:30 – 17:30]]' },
    { days: 'Saturday', time: '[[By appointment]]' },
  ],
  registration: '[[COMPANY REG. NO.]]',
  // Render only the networks that are set. Empty until supplied.
  socials: {},
  values: ['Integrity', 'Resilience', 'Innovation', 'Legacy'],
  /** Browser UI colour. Mirrors --color-ink (meta tags cannot read CSS variables). */
  themeColor: '#0B1530',
};

/** True when a string still contains a [[PLACEHOLDER]]. */
export const isPlaceholder = (value: string) => /\[\[.+?\]\]/.test(value);
