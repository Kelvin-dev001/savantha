# PR: redesign/v1 → main — new Savantho Consultancy website

Replaces the one-page Canva export at savantho.net with an Astro 5 static site (one serverless
route for the enquiry form), built to the brief in `docs/REDESIGN_BRIEF.md`. Phase-by-phase
detail is in the status log at the end of `CLAUDE.md`; everything Savantho still has to supply
or approve is in `PLACEHOLDERS.md`.

## What ships

- **Pages (25 routes):** home; services hub + six service pages; about; contact (three-question
  enquiry, WhatsApp first) with thank-you / not-sent; FAQ (37 Q&As); insights list, three
  subject pages and three guides (drafts, `noindex` until reviewed); privacy, terms,
  disclaimer; 404; internal styleguide.
- **Design system:** ink / gold / ivory tokens, Newsreader + Inter (self-hosted, subset), the
  lattice motif, ledger rules. One pinned section ("How we work"), motion that respects
  reduced-motion and never hides content without JS.
- **Compliance:** CMA wording rules enforced by `npm run lint:copy`; site-wide disclaimer in
  the footer and on every Grow page; all compliance copy in `src/content/` for one advocate review.
- **Contact:** `/api/contact` (Zod validation, honeypot, timing trap, rate limit, Resend over HTTP).
- **Search and sharing:** titles ≤ 60 / descriptions ≤ 155 (build fails otherwise), canonical,
  Open Graph + Twitter, a generated OG card per page, favicon set, sitemap (drafts and utility
  pages excluded), robots.txt, `/llms.txt`, JSON-LD (Organization + ProfessionalService,
  WebSite, Service, Article, FAQPage, BreadcrumbList; placeholders never published).
- **Analytics:** GA4 behind a consent banner (nothing loads before "Allow"; GPC respected;
  withdraw from the footer). Events: `whatsapp_click`, `call_click`, `email_click`,
  `form_step_1`, `form_submit`, `service_view`. Off until `PUBLIC_GA4_ID` is set.
- **Security headers** (`vercel.json`): HSTS, CSP (`script-src 'self'` + Google Tag Manager),
  nosniff, `X-Frame-Options: SAMEORIGIN`, Referrer-Policy, Permissions-Policy, COOP;
  `X-Robots-Tag: noindex` on `*.vercel.app` previews.
- **Sticky WhatsApp button** on mobile and tablet, prefilled per page, tracked, out of the way
  of forms, menus and other WhatsApp calls to action.

## QA scorecard (Phase 8)

Lighthouse mobile preset, simulated slow 4G, served over HTTP/2 + brotli like Vercel, CPU
slowdown 2× (this laptop benchmarks at 500–900, below Lighthouse's "underpowered" line of
1000; its 4× default assumes ≈ 2000).

| Budget | Target | Result |
|---|---|---|
| Performance | ≥ 95 | 97–100 on every public page (internal `/styleguide`: 83) |
| Accessibility / Best practices | 100 / 100 | 100 / 100 on all 25 routes |
| SEO | 100 | 100 on every indexable page (`noindex` pages score 66 by design) |
| LCP | < 2.0 s | 1.70–1.93 s |
| CLS | < 0.05 | 0 |
| TBT (lab stand-in for INP) | < 200 ms | 0–189 ms |
| First-load transfer | ≤ 900 KB | 207–218 KB |
| Homepage JS | ≤ 90 KB gz | 48 KB |
| axe (WCAG 2.2 AA) | 0 violations | 0 on every route, plus reduced-motion and consent-banner states |
| Responsive | no sideways scroll at 360–1920 | 25 routes × 7 widths clean |
| Links | 0 broken | 0 (internal, assets, anchors) |
| Compliance copy | 0 banned phrases | 0 |

At Lighthouse's raw 4× on this machine: `/` 95, `/about` 87, `/services/shariah-compliant-finance`
73 (its hero draws 280 lattice lines on load). **Confirm with PageSpeed Insights on the
preview deployment** before launch.

Tests: 269 Playwright tests (desktop + mobile), covering axe on every route, SEO output, CSP
under the production headers, consent and events, the sticky button, responsive widths and
font coverage.

## Deploy

1. Push to GitHub, import into Vercel (framework: Astro; the build sets `VERCEL`, which selects
   the Vercel adapter).
2. Environment variables (see `.env.example`): `RESEND_API_KEY`, `CONTACT_FROM_EMAIL`,
   `CONTACT_TO_EMAIL`, `PUBLIC_ANALYTICS_PROVIDER=ga4`, `PUBLIC_GA4_ID`.
3. Check the headers on the preview: `curl -sI https://<preview>.vercel.app/`.
4. PageSpeed Insights (mobile) on `/`, `/about`, the Shariah page.
5. Cloudflare DNS → Vercel; Search Console + sitemap. See "Before launch" in `PLACEHOLDERS.md`.

## Not in this PR

Real copy and assets marked `[[…]]`, photography, final logo vectors, advocate sign-off,
publication of the three guides.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
