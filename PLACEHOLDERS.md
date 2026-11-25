# Placeholders: what Savantho needs to supply

Every placeholder on the site is listed here. Text placeholders use `[[SQUARE BRACKETS]]`; elements carry `data-placeholder="true"` and show a dashed outline while `PUBLIC_SHOW_PLACEHOLDERS=true`.

Last updated: 2026-11-25 (Phase 3)

## Identity and registration

| Placeholder | Where | What we need |
|---|---|---|
| Monogram (star + italic "S") | `src/components/ui/Monogram.astro`, `public/brand/monogram.svg`, `public/favicon.svg`; also inside the homepage hero seal (`src/components/ui/Seal.astro`) | Final monogram as vector SVG (single colour and full colour). It must read at 200 px with a fine (≈ 1 px) stroke as well as at 30 px |
| Full logo lockup | `public/brand/logo-full.svg` | Final full logo as vector SVG |
| `[[COMPANY REG. NO.]]` | `src/config/site.ts` → `registration` (footer, styleguide) | Registrar of Companies registration number |
| `[[OFFICE ADDRESS]]`, `[[CITY]]` | `src/config/site.ts` → `address` (footer) | Office street address, building and city |
| `[[08:30 – 17:30]]`, `[[By appointment]]` | `src/config/site.ts` → `hours` (footer) | Confirmed office hours |
| Phone / WhatsApp `+254 735 093269` | `src/config/site.ts` | **Confirm** this number is correct and on WhatsApp Business |
| Email `info@savantho.net` | `src/config/site.ts` | **Confirm** the inbox is monitored |
| Social links | `src/config/site.ts` → `socials` (empty; footer hides them) | URLs for any networks Savantho uses |

## People

| Placeholder | Where | What we need |
|---|---|---|
| `[[FOUNDER NAME]]` | `/styleguide` (sample); About page in Phase 5 | Founder name, story, photo |
| `[[NAME, CREDENTIALS]]` | `/styleguide` (sample); Shariah page in Phase 4 | Shariah reviewer name and credentials |

## Compliance

| Placeholder | Where | What we need |
|---|---|---|
| `[[ADVOCATE NAME]]` | `src/content/legal/disclaimer.md` → `reviewedBy` | Name of the advocate who reviewed the compliance copy |

## Imagery (generated SVG placeholders)

| Placeholder | Ratio | Planned use | What we need |
|---|---|---|---|
| Mombasa Old Town door | 4:5 | Hero companion | Photograph, warm desaturated grade, ≥ 1600 px tall |
| Port of Mombasa at dawn | 3:2 | Trade pillar | Photograph, ≥ 2400 px wide |
| Nairobi skyline at dusk | 16:9 | Section break | Photograph, ≥ 2560 px wide |
| Hands on a ledger | 4:3 | Homepage insights teaser, lead article (`src/components/sections/HomeInsights.astro`); later per-article images | Photograph, ≥ 1600 px wide |

No stock handshakes, laptops or men in suits.

## Content to confirm (homepage, Phase 3)

All homepage copy is in `src/content/home/home.yaml`, so it can be reviewed in one file.

| Item | Where | What we need |
|---|---|---|
| Audience descriptions and "first question" lines | `home.yaml` → `audiences` | Confirm the three audiences and that the example questions sound like real clients (they are not quotes) |
| Process steps and "You leave with" outcomes | `home.yaml` → `process` | Confirm each step matches how Savantho actually works, especially the written summary after Listen and the review intervals |
| Value proofs | `home.yaml` → `values` | Confirm Savantho can stand behind each line (e.g. a reserve before anything else; working alongside the client's advocate on legacy) |
| FAQ answers | `home.yaml` → `faq` | Confirm the free 20-minute call, the written proposal, and the trade-finance scope (LCs, documentary collections, supplier credit) |
| Advocate review | `home.yaml` | The whole file is compliance-sensitive copy: include it in the advocate's review alongside `src/content/legal/` |

## Collections waiting for content

| Collection | Where | What we need |
|---|---|---|
| Client stories | `src/content/stories/` (format in `_README.md`) | Stories clients agree to in writing (`consent: true` + date). About the process and experience, never returns. Until then the homepage shows an empty register explaining why |
| Insights | `src/content/insights/*.mdx` | Three seeded drafts (`draft: true`, bodies are `[[DRAFT]]`), written in Phase 6. The homepage lists them as "In preparation", unlinked |
