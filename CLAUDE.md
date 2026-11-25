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
