# CLAUDE.md — Savantho Consultancy website

Claude Code reads this file at the start of every session. It holds the rules that always apply.
The full build spec is in `docs/REDESIGN_BRIEF.md` — read it before starting any phase.

## Project

New marketing website for **Savantho Consultancy Limited**, a Kenyan ethical financial consultancy. It replaces https://savantho.net, a one-page Canva export with no navigation, SEO, accessibility or conversion path.

**The bar:** a visitor thinks "who designed this?" within three seconds. Quiet confidence of a private bank, made in East Africa. Editorial, restrained, exact. Not a template, not a fintech startup, not crypto.

- Tagline (keep exactly): **Building Wealth, Creating Legacy**
- Values: Integrity · Resilience · Innovation · Legacy
- Positioning: Ethical financial consultancy for Kenyan families and businesses, from first budget to lasting legacy.
- Contact (to confirm): phone/WhatsApp +254 735 093269 · info@savantho.net — always read from `src/config/site.ts`

## Design skills

Before any UI work, read and follow:
- `.claude/skills/frontend-design/SKILL.md`
- `.claude/skills/premium-web-design/SKILL.md`

(If the install put them elsewhere, find them under `.claude/skills/`.) If one is missing, keep going with the rules here and in the brief. Conflicts: this file and the brief win on brand, content and compliance; the skills win on craft.

## Stack and commands

Astro 5 (static, islands) · Tailwind CSS v4 · TypeScript strict · MDX · content collections with Zod · Lenis + GSAP ScrollTrigger · Vercel (Cloudflare DNS).

```
npm run dev          # local dev server
npm run build        # production build (must pass before any commit)
npm run preview      # serve the build
npm run lint         # ESLint + Prettier check
npm run lint:copy    # fails on banned compliance phrases (see below)
npm run test:a11y    # Playwright + axe on every route
```

Environment: Windows. Use cross-platform npm scripts (no bash-only syntax). Secrets live in `.env` (gitignored); keep `.env.example` current.

## Brand tokens (Tailwind v4 `@theme` in `src/styles/global.css`)

```css
--color-ink:       #0B1530;   /* base, dark sections, body text on light */
--color-ink-800:   #121F42;
--color-ink-700:   #1B2A55;
--color-royal:     #1F3A8A;   /* links, focus, interactive states */
--color-gold:      #C9A24B;   /* accents, hairlines, icons — max ~8% of a screen */
--color-gold-soft: #E4CF9A;
--color-ivory:     #F6F1E7;   /* reading surfaces */
--color-paper:     #FBF8F2;
--color-stone:     #6B6A66;   /* secondary text on ivory — verify 4.5:1 */
--color-line:      rgb(201 162 75 / 0.28); /* ledger hairlines */
```

- One palette across every section. Never hard-code hex in components.
- Gold is never body text on ivory (fails contrast). It is only for rules, icons, display numerals ≥ 32 px bold, or text on ink.
- Type: **Fraunces** (display, variable) + **Manrope** (body/UI), self-hosted via `@fontsource-variable`, `font-display: swap`. One fluid `clamp()` scale.
- Signature motif: `<Lattice />`, a fine-line geometric lattice inspired by Islamic eight-point star patterns. 1 px gold strokes, low opacity, `aria-hidden`.
- Radius 2–4 px. Almost no shadows; use hairlines and tone instead.
- No stock handshakes, laptops or men in suits.

## Compliance rules (non-negotiable)

Savantho is **not licensed by the Capital Markets Authority (CMA)**.

- Never write: "investment adviser", "investment advisory", "fund manager", "portfolio manager", "guaranteed", "risk-free", "maximise/maximize returns", "protect your capital", or any return or performance figure.
- Use: consultancy, planning, guidance, financial education, "help you make informed decisions", "understand the risks before you commit".
- Testimonials talk about the process and experience, never investment returns.
- Site-wide disclaimer (footer + every Grow-pillar page) lives in `src/content/legal/disclaimer.md`:
  > Savantho Consultancy Limited provides financial consultancy and education. We are not licensed by the Capital Markets Authority, we do not manage client funds, and we do not recommend specific securities. Where regulated investment advice is needed, we refer clients to CMA-licensed advisers.
- Real estate = due diligence, structuring and buyer guidance, not agency or sales.
- All compliance-sensitive copy lives in content files, so an advocate can review it in one place.
- `npm run lint:copy` greps `src/` for the banned phrases and fails the build.

## Placeholders (no client assets yet)

- Text: `[[SQUARE BRACKETS]]`, e.g. `[[FOUNDER NAME]]`, `[[COMPANY REG. NO.]]`, `[[OFFICE ADDRESS]]`.
- Elements: `data-placeholder="true"`, with a dev-only outline hidden when `PUBLIC_SHOW_PLACEHOLDERS` is not `true`.
- Images: generated SVG placeholders (ink background, lattice, gold caption), with correct aspect ratio and explicit width and height.
- **Zero fake testimonials, stock faces or invented statistics.** Empty collections render a tasteful "coming soon" state, or the section hides itself.
- Keep `PLACEHOLDERS.md` updated: every placeholder, its file, and what Savantho must supply.

## Coding conventions

- Components in `src/components/{ui,sections,layout}`; pages in `src/pages`; content in `src/content`.
- No hard-coded copy or colours in components. Contact details come from `src/config/site.ts`.
- Semantic HTML first; one H1 per page; landmarks on every page.
- Motion JS loads only where used (`client:visible`); everything honours `prefers-reduced-motion`.
- Wrap every component `<style>` body in `@layer components { … }`. Unlayered scoped CSS beats Tailwind's layered utilities, so `hidden`, `lg:hidden`, `mt-*` etc. silently stop working without it.
- Focus ring: 2 px royal on light surfaces; inside `.surface-ink` it switches to gold-soft (royal on ink is 1.74:1, below the 3:1 rule).
- Screenshots: `npm run build && npm run shots -- /route` → `screenshots/phase-N/` (in Git Bash prefix `MSYS_NO_PATHCONV=1`).
- Git: work on branch `redesign/v1`, conventional commits, never commit to `main`. Run `npm run build` before each commit.
- At each **CHECKPOINT** in the brief: stop, show screenshots (desktop 1440 + mobile 390) and wait for review.
- Judge every section against "who designed this?". If it looks templated, redesign it before moving on.

## Quality budgets

- Mobile PageSpeed: LCP < 2.0 s · INP < 200 ms · CLS < 0.05 · Lighthouse 95+ / 100 / 100 / 100
- Homepage JS ≤ 90 KB gzipped; first-load transfer ≤ 900 KB
- WCAG 2.2 AA: contrast ≥ 4.5:1, visible 2 px royal focus ring, targets ≥ 24 px (44 px on mobile), skip link, zero axe violations
- Responsive at 360 / 390 / 768 / 1024 / 1280 / 1440 / 1920 px, no horizontal scroll

## Status log

Update at the end of every phase: date, phase, what shipped, what's next, open questions.

| Date | Phase | Done | Next / open questions |
|---|---|---|---|
| 2026-11-25 | 0 | Project folder, CLAUDE.md, brief created | Start Phase 1 |
| 2026-11-25 | 1 | git on `redesign/v1`; Astro 5.18 + Tailwind 4.3 + strict TS + MDX (Vite pinned to 6 via `overrides`); tokens + fluid type scale in `global.css`; self-hosted Fraunces (opsz) + Manrope; `site.ts`, `navigation.ts`, `whatsappLink()`; BaseLayout (skip link, landmarks, `en-KE`); Header (mega-menu, mobile sheet, hide-on-scroll, overlay mode); Footer (disclaimer from `content/legal`); `<Lattice />` (pattern + CSS line-draw), Monogram, Button, Icon, SectionLabel, Eyebrow, Ph, PlaceholderImage; `lint:copy` (10 rules); ESLint/Prettier; Playwright + axe on every built route (10/10 pass); `/styleguide` with build-time contrast ratios; `PLACEHOLDERS.md`. JS 1 KB gz. | Checkpoint 1 approved; committed 27e1846. `frontend-design` skill not installed. Next: Phase 2 (Lenis/GSAP, hero). |
| 2026-11-25 | 2 | Motion system in `src/scripts/motion/`: 1.2 KB loader; Lenis on idle (fine pointers only, pauses for the mobile sheet); GSAP + ScrollTrigger + SplitText loaded only when `[data-reveal]`/`[data-parallax]` is within a viewport (49.5 KB gz chunk); primitives `mask`/`fade`/`rule`/`stagger`, parallax ≤ 24 px, magnetic CTA; CSS cross-document view transitions; reduced motion = final states, nothing hidden without JS. Homepage hero (`HomeHero`, copy in `content/home/home.yaml`): ink, lattice draws out from a new `<Seal />`, word-by-word headline, "What happens next" ledger foot; CSS only, ≤ 2 s. Styleguide 07 Motion. 14/14 tests (adds reduced-motion axe + no-JS checks). Throttled mobile LCP ≈ 1.0 s, CLS 0.0015. | Checkpoint 2 approved: seal inscription = legal name + tagline; "What happens next" stays in the hero foot. Next: Phase 3, rest of homepage incl. pinned "How we work". |
| 2026-11-25 | 3 | Homepage complete, all copy in `home.yaml` (Zod schema per section). 01 Who we help: one footnoted display sentence + three "notes" (hover/focus underlines the phrase, CSS `:has()`). 02 Pillars: Grow full-width, Trade/Build 7/5; name parallax ≤ 24 px; hover *and* focus lift the panel and bring its services forward. 03 How we work: the one pinned section, ~300vh, CSS sticky gated by `(scripting: enabled)` + ≥1024×700 + no reduced motion, progress from `motion/pinned.ts` (0.5 KB gz, no GSAP); gold spine fills, copy cross-fades, the khatam star is built one layer per step; stacked cards otherwise. 04 Values ledger with double-ruled total. 05 Client stories: consent-gated `stories` collection, empty register state. 06 Insights teaser from new `insights` collection (3 drafts, "In preparation"). 07 FAQ: native `<details name>`. Closing `CtaBand` on ink, lattice draws on view (`<Lattice animate="view">`). `shots --reduced-motion`. 20/20 tests (adds pinned, no-JS and reduced-motion process checks). No overflow at 7 widths; CLS 0.0015; homepage JS ≈ 59 KB gz. | Checkpoint 3 approved; committed. Open: pillar services are always shown (stone → ink on hover) rather than hidden until hover; confirm process outcomes and value proofs (PLACEHOLDERS.md). Next: Phase 4 services. |
| 2026-11-25 | 4 | Services. `services` collection (6 frontmatter-only `.md`, brief schema + `shortTitle`, `lead`, `format`, `intros`, `boundaries`, optional `principles`, `related`; Zod enforces 5–6 FAQs at 40–60 words, `seoTitle` ≤ 60 with suffix, WhatsApp message prefix) and `servicesHub` (`services-hub/hub.yaml`: pillar copy, hub copy, template labels). `src/lib/services.ts` (`getServices/getPillars/getServiceIndex`); header mega-menu, mobile sheet, footer and homepage pillars/audiences/stories now derive from the collection (static pillars removed from `navigation.ts`). `/services` hub: "contents page" hero (pillar index as jump links, proof line, What happens next), one register per pillar (sticky parallax name, numbered service rows I.1…, Trade on paper), "not sure which fits?", CTA band. `/services/[slug]` "engagement letter": ivory hero with breadcrumb, italic last word, magnetic WhatsApp CTA, "At a glance" terms ledger, What happens next; numbered clauses: who it is for · screening glossary (Shariah only: riba/gharar/maysir/asset-backed/ethical sectors + `[[NAME, CREDENTIALS]]` reviewer; lattice watermark in hero) · what you get (clause-numbered items, "What we do not do", double-ruled "Everything in writing") · process (paper, ruled columns) · timeline (dot-leader schedule) · FAQ · related; in-page disclaimer on Grow pages; CTA band prefills each service's `whatsappMessage`. New shared `FaqList` (HomeFaq refactored onto it), `NextSteps`, `Breadcrumb`, `DisclaimerNote`, `ServiceRow`. Still 1 ink section above the footer per page; no new JS. 64/64 tests across desktop + mobile (adds per-service WhatsApp/FAQ/disclaimer checks, hub links, no-JS on services routes); no overflow at 7 widths × 8 routes; `lint:copy` clean (copy avoids "guarantee", incl. bank guarantees). | No checkpoint in the brief for Phase 4. Open: confirm timelines, proposal turnaround, fees wording, formats (Kiswahili), scope lines and reviewer arrangement (PLACEHOLDERS.md → services). `/faq` link on service pages 404s until Phase 5. Next: Phase 5 (About, Contact + endpoint, FAQ, legal, 404). |
| 2026-11-25 | 5 | About, Contact, FAQ, legal, 404. **Form changed at client request:** the brief's two-step form is now three questions: *What do you need?* (six services by pillar + "Not sure yet") → *What is your goal?* (one sentence; hint follows the need) → *Where can we reach you?* (name, reply by WhatsApp/call/email, that one number or address, consent). One question at a time with a ruled progress rail (answered steps link back), inline errors, `?service=slug` preselect, a "receipt" on success, `form_step_1`/`form_submit` as `savantho:track` events for Phase 7; no-JS = all three in one form posting to the endpoint → `/contact/thank-you` or `/contact/not-sent`. `POST /api/contact` (only on-demand route): Zod on the server, honeypot + 2.5 s fill-time trap + per-IP limit, Resend over HTTP (no SDK); secrets via `astro:env` at runtime; without `RESEND_API_KEY` it returns 503 (form offers WhatsApp) unless `CONTACT_DRY_RUN=true`. Adapters: `@astrojs/vercel` when `VERCEL` is set, `@astrojs/node` locally (Vercel adapter has no `astro preview`), so static output is now `dist/client`. `security.allowedDomains` set: without it Astro 5.18 reads every host as `localhost` and the origin check 403s plain form posts. `/about` letter of introduction: full lockup on letterhead, founder (all placeholders), values as four articles, "On the record" register (reads `site.ts` + Shariah reviewer), fee principles with total rule. `/faq`: hub-style registers, 37 Q&As from the services + home, FAQPage JSON-LD. `/privacy` (Kenya DPA 2019), `/terms`, `/disclaimer` (site-wide statement + detail) from `content/legal`, one template with numbered clauses, sticky contents, draft notice while the reviewer is `[[ADVOCATE NAME]]`. `/404` with drawn lattice and outlined numerals. Shared `PageHero`, `Headline`. New collections `about`, `contact`, `pages`. 122/122 tests (adds `tests/contact.spec.ts`: stepped flow, server validation, honeypot, no-JS post, FAQ schema, legal, 404; axe now waits for reveals to settle via `tests/support/settle.ts`). `lint`, `lint:copy` clean. Contact page JS +2.5 KB gz. | No checkpoint in the brief for Phase 5. Open: advocate to confirm consent checkbox vs notice line, fee principles (no commissions), retention periods, providers, ODPC registration (PLACEHOLDERS.md → Phase 5); Resend key + verified sender before launch. Not built yet: brief §5 sticky mobile WhatsApp button. `/insights` still 404s until Phase 6. Next: Phase 6 Insights. |
| 2026-11-25 | 6 | Insights. `insights` collection rebuilt: category is now a slug (`ethical-finance`, `trade-finance`, `family-finance`, `business-finance`; titles and lines in `pages.yaml` → `insights`), plus `keyPoints` (3–4, "In brief"), `services` (1–2), `whatsappMessage`, `cover` (caption + alt), `reviewedBy`, `order`, `updatedAt`, required `seoTitle`/`seoDescription`; the build refuses `draft: false` without `publishedAt`. `src/lib/insights.ts` (`getInsights`: published newest first, then drafts by `order`; reading time from the body at 220 wpm; category counts). `/insights` reads as a journal's contents page: hero with a "Browse by subject" index (only subjects with guides; current one marked), 01 Latest as a spread (cover 7 cols, title, standfirst, the guide's own In brief points; whole spread one link), 02 Every guide as a ruled register (`InsightRegister`, stretched-link rows), What happens next, CTA band. `/insights/category/[category]` (3 pages; empty subjects get no page). `/insights/[slug]` "briefing note": breadcrumb, subject, H1, italic standfirst, ruled particulars (subject, reading time, status or date, reviewer), cover 2:1, In brief, numbered sections beside a sticky contents list whose gold rail fills as you read (CSS scroll-driven `view-timeline`, no JS; plain rule when unsupported or reduced motion), ledger tables, `<Note>` MDX callout (passed via `<Content components>`, no imports in content), education note + in-page disclaimer, "talk it through" with the guide's WhatsApp message and its services, Read next. Three guides written in full (Shariah-compliant finance in Kenya; letters of credit for importers; the five-line family budget), all `draft: true`: built and linked, with a visible draft notice and `noindex`. Homepage teaser now reads from the lib and links the guides ("In review"). `settle()` ignores scroll-driven animations. Linked headings use `fade`, not `mask` (SplitText splits a link into one anchor per line). 169/169 tests + 1 desktop-only skip (adds `tests/insights.spec.ts`); no overflow at 7 widths on all Insights routes; `lint`, `lint:copy` clean. No new JS. | No checkpoint in the brief for Phase 6. Open: reviewers and fact checks per guide, reserve targets, cover photographs, Business finance subject (PLACEHOLDERS.md → Insights). Phase 7: Article + BreadcrumbList JSON-LD on guides, keep drafts out of the sitemap, OG images. Next: Phase 7 (SEO, schema, `llms.txt`, analytics + consent, OG images). |
