# Placeholders: what Savantho needs to supply

Every placeholder on the site is listed here. Text placeholders use `[[SQUARE BRACKETS]]`; elements carry `data-placeholder="true"` and show a dashed outline while `PUBLIC_SHOW_PLACEHOLDERS=true`.

Last updated: 2026-11-25 (Phase 1)

## Identity and registration

| Placeholder | Where | What we need |
|---|---|---|
| Monogram (star + italic "S") | `src/components/ui/Monogram.astro`, `public/brand/monogram.svg`, `public/favicon.svg` | Final monogram as vector SVG (single colour and full colour) |
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
| Hands on a ledger | 1:1 | Insights | Photograph, ≥ 1600 px |

No stock handshakes, laptops or men in suits.
