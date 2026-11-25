/**
 * Analytics behind consent. Loaded (as its own chunk) only when a provider is configured;
 * see src/components/layout/Consent.astro.
 *
 * - Nothing is loaded or sent until the visitor chooses "Allow". The choice is kept in
 *   localStorage (not a cookie) for 12 months, then asked again. Global Privacy Control
 *   counts as "No, thanks".
 * - Events (brief §5): whatsapp_click {service, page}, call_click, email_click, form_step_1,
 *   form_submit, service_view. Link clicks are classified by their href, so every WhatsApp,
 *   phone and email link is counted whether or not it carries data-track; data-track-service
 *   and data-track-location add detail. Components send other events with
 *   window.dispatchEvent(new CustomEvent('savantho:track', { detail: { event, ...props } })).
 * - Withdrawing consent stops sending at once (and clears Google's cookies for GA4).
 */

export interface AnalyticsConfig {
  provider: 'plausible' | 'ga4';
  /** Plausible: the site domain, and the script URL (plausible.io or a proxy). */
  domain?: string;
  src?: string;
  /** GA4 measurement ID (G-XXXXXXX). */
  id?: string;
}

type Choice = 'granted' | 'denied';
type Props = Record<string, string>;

const KEY = 'savantho:consent';
const VERSION = 1;
const MAX_AGE = 365 * 24 * 60 * 60 * 1000;

declare global {
  interface Window {
    plausible?: ((event: string, options?: { props?: Props }) => void) & { q?: unknown[] };
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
  interface Navigator {
    globalPrivacyControl?: boolean;
  }
}

function readChoice(): Choice | null {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) ?? 'null') as {
      v: number;
      choice: Choice;
      at: number;
    } | null;
    if (!saved || saved.v !== VERSION || Date.now() - saved.at > MAX_AGE) return null;
    return saved.choice === 'granted' || saved.choice === 'denied' ? saved.choice : null;
  } catch {
    return null;
  }
}

function saveChoice(choice: Choice) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ v: VERSION, choice, at: Date.now() }));
  } catch {
    /* Storage blocked: the choice holds for this page only. */
  }
}

function addScript(src: string, attrs: Record<string, string> = {}) {
  const s = document.createElement('script');
  s.src = src;
  s.async = true;
  for (const [k, v] of Object.entries(attrs)) s.setAttribute(k, v);
  document.head.append(s);
}

/* ---------------------------------------------------------------------------------------- */
/* Providers                                                                                */
/* ---------------------------------------------------------------------------------------- */

let send: (event: string, props: Props) => void = () => {};
let loaded = false;

function enable(cfg: AnalyticsConfig) {
  if (cfg.provider === 'plausible') {
    try {
      localStorage.removeItem('plausible_ignore');
    } catch {
      /* ignore */
    }
    if (!window.plausible) {
      // Queue calls until the script arrives (it replays plausible.q).
      const stub = ((...args: unknown[]) => {
        (stub.q ??= []).push(args);
      }) as NonNullable<Window['plausible']>;
      window.plausible = stub;
    }
    if (!loaded) addScript(cfg.src!, { 'data-domain': cfg.domain! });
    send = (event, props) => window.plausible!(event, { props });
  } else {
    window.dataLayer ??= [];
    // gtag must push the `arguments` object itself, not an array.
    window.gtag ??= function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
    window[`ga-disable-${cfg.id!}`] = false;
    window.gtag('consent', loaded ? 'update' : 'default', {
      analytics_storage: 'granted',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
    });
    if (!loaded) {
      window.gtag('js', new Date());
      window.gtag('config', cfg.id, {
        allow_google_signals: false,
        allow_ad_personalization_signals: false,
      });
      addScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(cfg.id!)}`);
    }
    send = (event, props) => window.gtag!('event', event, props);
  }
  if (!loaded) {
    loaded = true;
    listen();
    const view = document.querySelector<HTMLMetaElement>('meta[name="savantho:service-view"]');
    if (view) track('service_view', { service: view.content });
  }
}

function disable(cfg: AnalyticsConfig) {
  send = () => {};
  if (cfg.provider === 'plausible') {
    try {
      localStorage.setItem('plausible_ignore', 'true');
    } catch {
      /* ignore */
    }
  } else if (cfg.id) {
    window[`ga-disable-${cfg.id}`] = true;
    window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
    // Clear Google Analytics cookies on this host and its parent domain.
    const host = location.hostname;
    const domains = ['', host, `.${host.split('.').slice(-2).join('.')}`];
    for (const c of document.cookie.split(';')) {
      const name = c.split('=')[0]!.trim();
      if (!/^_ga(_|$)/.test(name)) continue;
      for (const d of domains)
        document.cookie = `${name}=; Max-Age=0; path=/${d ? `; domain=${d}` : ''}`;
    }
  }
}

/* ---------------------------------------------------------------------------------------- */
/* Events                                                                                   */
/* ---------------------------------------------------------------------------------------- */

function track(event: string, props: Props = {}) {
  send(event, { page: location.pathname, ...props });
}

function classify(a: HTMLAnchorElement): string | undefined {
  const href = a.getAttribute('href') ?? '';
  if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(href)) return 'whatsapp_click';
  if (href.startsWith('tel:')) return 'call_click';
  if (href.startsWith('mailto:')) return 'email_click';
  return a.dataset.track;
}

function listen() {
  document.addEventListener(
    'click',
    (e) => {
      const a = (e.target as Element | null)?.closest?.('a[href]');
      if (!(a instanceof HTMLAnchorElement)) return;
      const event = classify(a);
      if (!event) return;
      const props: Props = {};
      if (event === 'whatsapp_click') props.service = a.dataset.trackService ?? 'general';
      else if (a.dataset.trackService) props.service = a.dataset.trackService;
      if (a.dataset.trackLocation) props.location = a.dataset.trackLocation;
      track(event, props);
    },
    { capture: true },
  );
  window.addEventListener('savantho:track', (e) => {
    const { event, ...props } = (e as CustomEvent<{ event: string } & Props>).detail;
    if (event) track(event, props);
  });
}

/* ---------------------------------------------------------------------------------------- */
/* Consent banner                                                                           */
/* ---------------------------------------------------------------------------------------- */

export function start(cfg: AnalyticsConfig) {
  const banner = document.querySelector<HTMLElement>('[data-consent]');
  if (!banner) return;
  const status = document.querySelector<HTMLElement>('[data-consent-status]');
  const title = banner.querySelector<HTMLElement>('[data-consent-title]');
  const openers = [...document.querySelectorAll<HTMLButtonElement>('[data-consent-open]')];
  banner
    .querySelectorAll<HTMLElement>('[data-consent-body]')
    .forEach((p) => (p.hidden = p.dataset.consentBody !== cfg.provider));

  let returnTo: HTMLElement | null = null;
  const show = (focus: boolean) => {
    banner.hidden = false;
    banner.dataset.state = 'open';
    if (focus) title?.focus();
  };
  const hide = () => {
    banner.hidden = true;
    banner.dataset.state = 'closed';
    returnTo?.focus();
    returnTo = null;
  };

  banner.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-consent-choice]');
    if (!btn) return;
    const choice = btn.dataset.consentChoice as Choice;
    saveChoice(choice);
    if (choice === 'granted') enable(cfg);
    else disable(cfg);
    if (status) status.textContent = btn.dataset.consentSaved ?? '';
    hide();
  });
  banner.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hide();
  });
  for (const opener of openers) {
    opener.hidden = false;
    opener.addEventListener('click', () => {
      returnTo = opener;
      show(true);
    });
  }

  const choice = readChoice() ?? (navigator.globalPrivacyControl ? 'denied' : null);
  if (choice === 'granted') enable(cfg);
  else if (choice === null) {
    // Wait until the page has settled, so the banner never competes with the hero.
    const later = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 600));
    later(() => show(false));
  }
}
