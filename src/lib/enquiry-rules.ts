/**
 * Enquiry rules shared by the contact form (browser) and /api/contact (server), so the two
 * can never disagree. No dependencies: this file ships to the browser.
 */
export const NEEDS = [
  'wealth-planning',
  'shariah-compliant-finance',
  'real-estate',
  'trade-finance',
  'financial-literacy',
  'project-me',
  'not-sure',
] as const;
export type Need = (typeof NEEDS)[number];

export const CHANNELS = ['whatsapp', 'call', 'email'] as const;
export type Channel = (typeof CHANNELS)[number];

export const GOAL_MIN = 8;
export const GOAL_MAX = 2000;
export const NAME_MAX = 80;

/** Field names the form posts. `website` is the honeypot; `t` is when the form was shown. */
export const FIELD = {
  need: 'need',
  goal: 'goal',
  name: 'name',
  channel: 'channel',
  phone: 'phone',
  email: 'email',
  consent: 'consent',
  honeypot: 'website',
  started: 't',
} as const;

/**
 * Phone numbers as people type them: "0712 345 678", "+254 712 345678", "(020) 123-4567",
 * "+44 20 7946 0000". Returns E.164-ish digits with a leading +, or null.
 */
export function normalisePhone(raw: string): string | null {
  const s = raw.trim();
  if (!/^\+?[\d\s().-]{7,24}$/.test(s)) return null;
  let digits = s.replace(/\D/g, '');
  if (s.startsWith('+')) {
    /* international as typed */
  } else if (digits.startsWith('00')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = `254${digits.slice(1)}`;
  else if (digits.length === 9) digits = `254${digits}`;
  return digits.length >= 9 && digits.length <= 15 ? `+${digits}` : null;
}

export const isEmail = (raw: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim());
