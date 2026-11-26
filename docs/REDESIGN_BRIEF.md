# Savantho redesign — full build brief

This is the reference spec. The always-on rules (tokens, compliance, placeholders, conventions, budgets) live in `/CLAUDE.md`; this file adds what to build and in what order. The client-facing audit behind it is at https://claude.ai/artifact/1dPZoVEB9rG1HGGicd81Dk.

---

## 1. Audiences and services

**Audiences** (to confirm with the client):
1. Families and professionals growing and protecting wealth on ethical or Shariah-conscious terms
2. SMEs and importers needing trade-finance structuring
3. Organisations needing financial-literacy training or project M&E

**Differentiator:** ethics and transparency. "We explain every fee, product and risk in writing."

**Three pillars, six services** (one content collection, `src/content/services/*.md`):

| Pillar | Service | Route |
|---|---|---|
| Grow | Wealth Planning Consultancy | `/services/wealth-planning` |
| Grow | Shariah-Compliant Finance Guidance | `/services/shariah-compliant-finance` |
| Grow | Real Estate Advisory (due diligence & structuring) | `/services/real-estate` |
| Trade | Trade Finance Consultancy | `/services/trade-finance` |
| Build | Financial Literacy Training | `/services/financial-literacy` |
| Build | Project Monitoring & Evaluation | `/services/project-me` |

Service frontmatter schema: `title, pillar, slug, summary, audience[], deliverables[], process[] (step, detail), timeline, faqs[] (q, a), whatsappMessage, seoTitle, seoDescription, order`.

---

## 2. Design direction: "Quiet wealth"

Tokens and type are in CLAUDE.md. In addition:

- **Layout:** 12-column asymmetric editorial grid, 1280 px max content, margins `clamp(24px, 6vw, 96px)`. Numbered sections (`01 — HOW WE WORK`) with gold hairline rules that echo financial statements. Lots of ivory space; at most 2 ink sections per page, for rhythm.
- **Headlines:** hero 72–112 px desktop / 44–56 px mobile, `letter-spacing: -0.02em`, leading 1.02–1.1. Eyebrows in tracked uppercase (`0.14em`). Body 17–18 px, 1.6 leading, 68ch max.
- **Lattice:** one `<Lattice density opacity animate />` component. Used in the hero (line-draws on load), section dividers, the footer, and as a watermark on the Shariah page hero. Tasteful, never busy, never religious clip-art.
- **Logo:** `/public/brand/logo-full.svg` and `/public/brand/monogram.svg` (placeholder SVGs until vectors arrive). Header = monogram + "SAVANTHO" in the display face (Newsreader since 2026-11-26), tracked. The ornate full lockup only appears on About, at most 200 px wide anywhere else.
- **Imagery art direction:** Mombasa Old Town doors and arches, the port at dawn, Nairobi skyline at dusk, hands on ledgers. One warm, desaturated grade. Placeholders until real photos exist.

---

## 3. Motion and interaction

Lenis (smooth scroll) + GSAP ScrollTrigger, loaded as islands only where used.

1. **Hero:** lattice line-draw (stroke-dashoffset, ~1.6 s) → monogram fades up → headline rises word by word (60 ms stagger) → CTA last. Total ≤ 2 s. Text stays readable if JS fails.
2. **"How we work" (Home):** four steps (Listen, Analyse, Structure, Review) pinned for ~300vh on desktop ≥ 1024 px. A vertical gold progress rule fills as you scroll, and the step copy cross-fades. Below 1024 px, stacked cards with a single reveal.
3. **Pillar cards:** ≤ 24 px parallax. Hover *and* keyboard focus lift the card and reveal its service list.
4. **Reveals:** headings mask-reveal upward once; body fades in once; nothing re-animates on scroll up.
5. **Header:** transparent over the hero; ivory with a hairline after 80 px; hides on scroll down, returns on scroll up.
6. **Magnetic primary CTA** on fine-pointer devices only.
7. **Astro View Transitions:** a short cross-fade between pages.

Rules: `prefers-reduced-motion: reduce` shows final states only. One pinned section in total. Nothing loops. INP < 200 ms.

---

## 4. Pages

Copy is real, specific and compliant, in British/Kenyan English, with short sentences and outcomes over adjectives. Every page has one H1, an eyebrow, a clear promise, proof, a "What happens next" strip (reply within 1 business day → free 20-minute call → written proposal) and a WhatsApp CTA.

| Route | Sections |
|---|---|
| `/` | Hero ("Clarity for your money. Legacy for your family." + tagline; CTA "Book a free discovery call" → WhatsApp; secondary "Explore services") · Who we help (3 audience cards) · Three pillars · How we work (pinned) · Why Savantho (4 values as ledger rows, a one-line proof each) · Client stories (empty state) · Insights teaser (3 latest) · FAQ teaser (4) · Final CTA band on ink with lattice |
| `/about` | Founder story `[[placeholder]]` · Values · Credentials & registration `[[placeholders]]` · How we're paid (transparent fee principles) · CTA |
| `/services` | Hub: the 3 pillars with their 6 services, each linking out |
| `/services/[slug]` | Hero · Who it's for · What you get · Process (numbered) · Typical timeline · FAQ (5–6 answer-first Q&As, 40–60 words each) · Related services · CTA with the service's WhatsApp message |
| `/insights`, `/insights/[slug]` | MDX articles with categories. Seed 3 drafts: "How Shariah-compliant finance works in Kenya", "Letters of credit explained for Kenyan importers", "A family budgeting framework that actually holds" |
| `/faq` | All service FAQs, grouped, with FAQPage schema |
| `/contact` | WhatsApp (primary) · tap-to-call · mailto · office hours · map placeholder · two-step form |
| `/privacy` | Kenya Data Protection Act 2019: what form and WhatsApp collect, purpose, retention, rights, contact |
| `/terms`, `/disclaimer`, `/404` | 404 designed with the lattice and links home |

**Shariah page:** explain screening principles (no riba, gharar or maysir; asset-backed; ethical sectors) and add a placeholder line "Our Shariah reviewer: [[NAME, CREDENTIALS]]".

**Header nav:** Services (mega-menu showing the 3 pillars) · About · Insights · FAQ · Contact · button "Talk to us" (WhatsApp).
**Footer:** monogram, tagline, pillar links, company links, contact, socials (render only those set in `site.ts`), `[[COMPANY REG. NO.]]`, disclaimer, © year.

---

## 5. Technical specification

- **`src/config/site.ts`:** name, phone, whatsapp (`254735093269`), email, address, hours, socials (empty until supplied), registration, url (`https://savantho.net`).
- **WhatsApp:** `whatsappLink(service?)` → `https://wa.me/254735093269?text=<encoded>`, e.g. "Hello Savantho, I'd like to discuss Trade Finance Consultancy." Sticky 56 px button bottom-right on mobile; it must not cover content and hides while an input is focused. Every click is tracked.
- **Form:** two steps (1: need + service select; 2: name, phone, email, message, consent). It posts to an Astro server endpoint (`@astrojs/vercel` adapter, that route only), which sends via Resend (`RESEND_API_KEY`, `CONTACT_TO_EMAIL`). Honeypot, simple rate limit, server-side Zod validation, accessible inline errors, success state, no third-party branding.
- **Images:** `astro:assets`, AVIF/WebP, responsive `sizes`, explicit dimensions. Lazy-load everything except the LCP image (`fetchpriority="high"`).
- **SEO:** per-page title (≤ 60 chars, `Service | Savantho Consultancy`), meta description (≤ 155), canonical, Open Graph and Twitter cards, generated OG image per page, `@astrojs/sitemap`, `robots.txt`, `lang="en-KE"`, favicon set from the monogram.
- **JSON-LD:** Organization + ProfessionalService (`areaServed: Kenya`, contactPoint, `sameAs`) site-wide; Service per service page; FAQPage; Article; BreadcrumbList.
- **AI search:** `/llms.txt` (who Savantho is, services, URLs, contact). Answer-first paragraph under each H2; question-style headings where natural.
- **Analytics:** Plausible or GA4 behind a consent banner. Events: `whatsapp_click` {service, page}, `call_click`, `email_click`, `form_step_1`, `form_submit`, `service_view`.
- **Security headers** in `vercel.json`: HSTS, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, a CSP, and `Permissions-Policy`.
- **Tooling:** ESLint, Prettier, Playwright + `@axe-core/playwright`, a `lint:copy` script, and a link checker.

---

## 6. Build phases

Stop at every **CHECKPOINT**: screenshot desktop (1440) and mobile (390), summarise, and wait for approval. Update the CLAUDE.md status log at the end of each phase.

1. **Foundation.** `git init`, branch `redesign/v1`, scaffold Astro + Tailwind v4 + TS, tokens, fonts, `site.ts`, base layout, header, footer, `<Lattice />`, placeholder system, `lint:copy`. **CHECKPOINT:** `/styleguide` page showing colours (with contrast ratios), type scale, buttons, lattice.
2. **Hero + motion system.** Lenis and GSAP setup, reduced-motion handling, hero sequence. **CHECKPOINT.**
3. **Homepage complete,** including the pinned "How we work". **CHECKPOINT.**
4. **Services:** collection, hub, the six pages, FAQs.
5. **About, Contact (form + endpoint), FAQ, legal pages, 404.**
6. **Insights:** collection, list, article template, 3 seeded drafts.
7. **SEO, schema, `llms.txt`, analytics + consent, OG images.**
8. **QA.** Lighthouse, axe, responsive sweep, `lint:copy`, link check; fix everything; finalise `PLACEHOLDERS.md`; open a PR `redesign/v1` → `main` with notes. **FINAL CHECKPOINT.**
