/**
 * POST /api/contact: the three-question enquiry (need, goal, where to reach you).
 *
 * The only on-demand route on the site (a Vercel function in production). It accepts the
 * form as JSON (the enhanced form, `Accept: application/json`) or as a plain form post (no
 * JavaScript), validates on the server with Zod, and sends the enquiry to Savantho's inbox
 * through Resend's HTTP API. No SDK, no third-party branding.
 *
 * Spam: a honeypot field, a minimum fill time and a per-address rate limit. Bots get a
 * normal-looking success so they learn nothing.
 *
 * Without RESEND_API_KEY the endpoint refuses to pretend: it returns 503 and the form offers
 * WhatsApp instead, unless CONTACT_DRY_RUN=true (local development and tests), when the
 * enquiry is logged to the server console instead of sent.
 */
import type { APIRoute } from 'astro';
import { getEntry } from 'astro:content';
import { z } from 'astro/zod';
import {
  RESEND_API_KEY,
  CONTACT_TO_EMAIL,
  CONTACT_FROM_EMAIL,
  CONTACT_DRY_RUN,
  CONTACT_RATE_LIMIT,
} from 'astro:env/server';
import { site } from '@/config/site';
import { getServiceIndex } from '@/lib/services';
import {
  CHANNELS,
  FIELD,
  GOAL_MAX,
  GOAL_MIN,
  NAME_MAX,
  NEEDS,
  isEmail,
  normalisePhone,
} from '@/lib/enquiry-rules';

export const prerender = false;

const MIN_FILL_MS = 2500;
const WINDOW_MS = 10 * 60 * 1000;
const hits = new Map<string, number[]>();

/** Simple sliding-window limit, per warm function instance. Enough to blunt a burst. */
function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > CONTACT_RATE_LIMIT;
}

type Errors = Partial<Record<'need' | 'goal' | 'name' | 'phone' | 'email' | 'consent', string>>;

async function readBody(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get('content-type') ?? '';
  if (type.includes('application/json')) {
    const json = (await request.json()) as Record<string, unknown>;
    return Object.fromEntries(
      Object.entries(json).map(([k, v]) => [k, typeof v === 'string' ? v : v === true ? 'on' : '']),
    );
  }
  const form = await request.formData();
  const out: Record<string, string> = {};
  for (const [k, v] of form) if (typeof v === 'string') out[k] = v;
  return out;
}

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!,
  );

export const POST: APIRoute = async ({ request, clientAddress, redirect }) => {
  const wantsJson = (request.headers.get('accept') ?? '').includes('application/json');
  const copy = (await getEntry('contact', 'contact'))!.data.form;
  const msg = copy.errors;

  const done = (replyBy: string) =>
    wantsJson ? Response.json({ ok: true, replyBy }) : redirect('/contact/thank-you', 303);
  const fail = (status: number, message: string, errors: Errors = {}) =>
    wantsJson
      ? Response.json({ ok: false, message, errors }, { status })
      : redirect('/contact/not-sent', 303);

  let body: Record<string, string>;
  try {
    body = await readBody(request);
  } catch {
    return fail(400, msg.server);
  }

  // Bots: honeypot filled, or the form was "filled in" faster than a person can read it.
  const started = Number(body[FIELD.started]);
  const tooFast = Number.isFinite(started) && started > 0 && Date.now() - started < MIN_FILL_MS;
  if (body[FIELD.honeypot] || tooFast) return done(copy.fields.replyBy.whatsapp);

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || clientAddress || 'unknown';
  if (limited(ip)) return fail(429, msg.rate);

  // The reply channel decides which contact field is required, so read it first: every
  // field error then comes back in one response.
  const channel = z.enum(CHANNELS).catch('whatsapp').parse(body[FIELD.channel]);
  const optional = z.string().trim().optional().default('');
  const schema = z.object({
    need: z.enum(NEEDS, { errorMap: () => ({ message: msg.need }) }),
    goal: z.string().trim().min(GOAL_MIN, msg.goalShort).max(GOAL_MAX, msg.goalLong),
    name: z.string().trim().min(1, msg.name).max(NAME_MAX, msg.name),
    channel: z.enum(CHANNELS),
    phone:
      channel === 'email'
        ? optional
        : z.string({ required_error: msg.phone }).refine((v) => !!normalisePhone(v), msg.phone),
    email:
      channel === 'email'
        ? z.string({ required_error: msg.email }).trim().refine(isEmail, msg.email)
        : optional,
    consent: z.literal('on', { errorMap: () => ({ message: msg.consent }) }),
  });

  const parsed = schema.safeParse({
    need: body[FIELD.need],
    goal: body[FIELD.goal] ?? '',
    name: body[FIELD.name] ?? '',
    channel,
    phone: body[FIELD.phone],
    email: body[FIELD.email],
    consent: body[FIELD.consent],
  });
  if (!parsed.success) {
    const errors: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof Errors;
      errors[key] ??= issue.message;
    }
    return fail(422, msg.summary, errors);
  }

  const e = parsed.data;
  const phone = e.channel === 'email' ? null : normalisePhone(e.phone);
  const index = await getServiceIndex();
  const needTitle = e.need === 'not-sure' ? copy.notSure.title : index.get(e.need)!.title;
  const replyBy = copy.fields.replyBy[e.channel];
  const contactLine =
    e.channel === 'email'
      ? e.email
      : `${phone}${e.channel === 'whatsapp' ? `  (https://wa.me/${phone!.slice(1)})` : ''}`;
  const sentAt = new Date().toLocaleString('en-GB', {
    timeZone: 'Africa/Nairobi',
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const rows: [string, string][] = [
    [copy.questions.need.question, needTitle],
    [copy.questions.goal.question, e.goal],
    [copy.fields.name, e.name],
    [copy.fields.channel, `${copy.fields.channels[e.channel]}: ${contactLine}`],
    ['Received', `${sentAt} (EAT)`],
    ['Consent', copy.fields.consent],
  ];
  const subject = `Website enquiry: ${needTitle} (${e.name})`;
  const text = rows.map(([k, v]) => `${k}\n${v}\n`).join('\n');
  const html = `<table cellpadding="8" style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse">${rows
    .map(
      ([k, v]) =>
        `<tr><th align="left" valign="top" style="border-bottom:1px solid #ddd;color:#555;font-weight:600">${escape(k)}</th><td style="border-bottom:1px solid #ddd;white-space:pre-wrap">${escape(v)}</td></tr>`,
    )
    .join('')}</table>`;

  if (!RESEND_API_KEY) {
    if (CONTACT_DRY_RUN) {
      console.info(`[contact] dry run, not sent:\n${subject}\n\n${text}`);
      return done(replyBy);
    }
    console.error('[contact] RESEND_API_KEY is not set; enquiry not sent.');
    return fail(503, msg.server);
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [CONTACT_TO_EMAIL || site.email],
        subject,
        text,
        html,
        ...(e.channel === 'email' ? { reply_to: e.email } : {}),
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[contact] Resend responded ${res.status}: ${await res.text()}`);
      return fail(502, msg.server);
    }
  } catch (err) {
    console.error('[contact] Resend request failed', err);
    return fail(502, msg.server);
  }

  return done(replyBy);
};

/** Anything other than POST: point people at the page. */
export const ALL: APIRoute = ({ redirect }) => redirect('/contact', 303);
