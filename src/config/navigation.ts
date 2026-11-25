/**
 * Navigation structure. The pillar and service lists come from the services collection
 * (see src/lib/services.ts → getPillars()); this file holds the fixed links and UI strings.
 */

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
  stickyWhatsApp: 'Message Savantho on WhatsApp',
  callLabel: 'Call',
  emailLabel: 'Email',
  rights: 'All rights reserved.',
};
