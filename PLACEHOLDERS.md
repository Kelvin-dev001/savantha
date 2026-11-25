# Placeholders: what Savantho needs to supply

Every placeholder on the site is listed here. Text placeholders use `[[SQUARE BRACKETS]]`; elements carry `data-placeholder="true"` and show a dashed outline while `PUBLIC_SHOW_PLACEHOLDERS=true`.

Last updated: 2026-11-25 (Phase 8, final for the redesign)

## Identity and registration

| Placeholder | Where | What we need |
|---|---|---|
| Monogram (star + italic "S") | `src/components/ui/Monogram.astro`, `public/brand/monogram.svg`, `public/favicon.svg`; also inside the homepage hero seal (`src/components/ui/Seal.astro`). The favicon set (`favicon.ico`, `apple-touch-icon.png`, `icon-192/512/maskable.png`) and every OG card are rasterised from `public/brand/monogram.svg` at build time, so replacing that file updates them all. Keep letterforms outlined (paths, not `<text>`) so it renders without fonts | Final monogram as vector SVG (single colour and full colour). It must read at 200 px with a fine (≈ 1 px) stroke as well as at 30 px |
| Full logo lockup | `public/brand/logo-full.svg` | Final full logo as vector SVG |
| `[[COMPANY REG. NO.]]` | `src/config/site.ts` → `registration` (footer, styleguide, About register, privacy notice, terms) | Registrar of Companies registration number |
| `[[OFFICE ADDRESS]]`, `[[CITY]]` | `src/config/site.ts` → `address` (footer, Contact, About register); privacy notice and terms; Contact map alt text (`contact.yaml` → `ways.mapAlt`) | Office street address, building and city |
| `[[08:30 – 17:30]]`, `[[By appointment]]` | `src/config/site.ts` → `hours` (footer, Contact) | Confirmed office hours |
| Phone / WhatsApp `+254 735 093269` | `src/config/site.ts` | **Confirm** this number is correct and on WhatsApp Business |
| Email `info@savantho.net` | `src/config/site.ts` | **Confirm** the inbox is monitored |
| Social links | `src/config/site.ts` → `socials` (empty; footer hides them) | URLs for any networks Savantho uses |

## People

| Placeholder | Where | What we need |
|---|---|---|
| `[[FOUNDER NAME]]`, `[[ROLE]]`, quote, three story paragraphs | `src/content/about/about.yaml` → `founder` (`/about`, section 01); `/styleguide` (sample) | Founder name and title, one sentence in their own words, a 150–250 word story, and a portrait (4:5, warm grade) |
| `[[NAME, CREDENTIALS]]` | `src/content/services/shariah-compliant-finance.md` → `principles.reviewer` (`/services/shariah-compliant-finance`, end of the Screening section); `/styleguide` (sample) | Shariah reviewer name and credentials. The page also says the reviewer "oversees" the screening work: confirm that describes the arrangement |

## Compliance

| Placeholder | Where | What we need |
|---|---|---|
| `[[ADVOCATE NAME]]` | `src/content/legal/*.md` → `reviewedBy` (disclaimer, privacy, terms). While it is a placeholder, each legal page shows a "draft awaiting review" note | Name of the advocate who reviewed the compliance copy |

## Imagery (generated SVG placeholders)

| Placeholder | Ratio | Planned use | What we need |
|---|---|---|---|
| Mombasa Old Town door | 4:5 | Hero companion | Photograph, warm desaturated grade, ≥ 1600 px tall |
| Port of Mombasa at dawn | 3:2 | Trade pillar | Photograph, ≥ 2400 px wide |
| Nairobi skyline at dusk | 16:9 | Section break | Photograph, ≥ 2560 px wide |
| Hands on a ledger | 4:3 and 2:1 | Cover of the budgeting guide (`cover` in its frontmatter): homepage teaser and /insights spread at 4:3, article head at 2:1 | Photograph, ≥ 1600 px wide, composed so both crops work |
| Guide covers | 4:3 and 2:1 | Shariah guide: Mombasa Old Town door. Letters of credit: Port of Mombasa at dawn. Each guide sets its caption and alt text in `cover` | One photograph per guide, same grade; both crops must work. Swap `PlaceholderImage` for `astro:assets` in `InsightFeature.astro`, `HomeInsights.astro` and `insights/[slug].astro` |

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

## Content to confirm (services, Phase 4)

The six services are in `src/content/services/*.md` (one file each, frontmatter only); pillar intros, hub copy and the labels every service page uses are in `src/content/services-hub/hub.yaml`. Both are compliance-sensitive: include them in the advocate's review.

| Item | Where | What we need |
|---|---|---|
| Timelines and proposal turnaround | each service → `timeline` (hero "At a glance", hub rows, Timeline section) | Confirm the typical durations, and that a written proposal goes out within 2–5 business days as stated per service |
| Fees | `hub.yaml` → `page.facts.feesValue`; wealth planning FAQ "How are your fees set?" | Confirm fees are quoted in writing before work starts, and that wealth plans are a fixed fee with reviews priced separately |
| Formats | each service → `format` | Confirm delivery formats, including training in Kiswahili and online sessions |
| Audiences | each service → `audience`, `intros.audience` | Confirm each list matches who Savantho actually serves (e.g. Kenyans abroad for wealth planning and real estate) |
| Deliverables | each service → `deliverables` | Confirm Savantho produces each document named (options paper, screening note, bank-ready file, indicator reference sheets, etc.) |
| What we do not do | each service → `boundaries` | Confirm every scope statement, especially: buyer-side only and no property valuation (real estate); no lending or instruments (trade finance); no Shariah rulings (Shariah); M&E independence lines |
| Provider independence | financial literacy FAQ "Will you promote products…?" | Confirm Savantho receives nothing from any financial provider for training content |
| Shariah home finance | Shariah FAQ "Can I buy a home…?" | Confirm the statement that several Kenyan banks offer murabaha / ijara home finance (no banks are named) |
| Specialisms | M&E FAQ "Do you specialise…?" | Confirm depth in financial-inclusion, savings-group, livelihoods and financial-literacy programmes |
| Training details | financial literacy FAQs | Confirm session lengths (two hours to a day), group size (up to thirty) and the before-and-after assessment |
| Review intervals | wealth planning `timeline` ("Every 6 or 12 months") | Confirm the usual review cadence |
| Page titles and descriptions | each service → `seoTitle`, `seoDescription`; `hub.yaml` → `hub.seoTitle` | Approve the search titles (rendered as "‹title› · Savantho Consultancy" with a pipe separator, ≤ 60 characters) |

## Collections waiting for content

| Collection | Where | What we need |
|---|---|---|
| Client stories | `src/content/stories/` (format in `_README.md`) | Stories clients agree to in writing (`consent: true` + date). About the process and experience, never returns. Until then the homepage shows an empty register explaining why |
| Insights | `src/content/insights/*.mdx` | Three guides written in Phase 6, still `draft: true` until reviewed (see "Content to confirm (Insights, Phase 6)"). New guides: one `.mdx` per article; the frontmatter schema is in `src/content.config.ts` |

## Content to confirm (Insights, Phase 6)

The three guides are in `src/content/insights/*.mdx`; list, category and article labels are in `src/content/pages/pages.yaml` → `insights`. All three are financial education and compliance-sensitive: include them in the advocate's review. Each is `draft: true`: built and linked so it can be reviewed in place, but it shows a "Draft, awaiting review" notice and carries `noindex`. **To publish:** set `draft: false` and `publishedAt: YYYY-MM-DD` in the frontmatter (the build refuses a published guide without a date). The notice and `noindex` then go, and the date replaces "In review" on the list and the homepage.

| Item | Where | What we need |
|---|---|---|
| Reviewers | each guide → `reviewedBy` (shown as "To be reviewed by" while a draft) | Shariah guide: `[[NAME, CREDENTIALS]]` (Shariah reviewer) and `[[ADVOCATE NAME]]`. Letters of credit and budgeting: `[[ADVOCATE NAME]]`. Confirm who signs off each guide |
| Shariah guide: facts | `how-shariah-compliant-finance-works-in-kenya.mdx` | Shariah reviewer to confirm the five principles, the description of murabaha, ijara, diminishing musharaka, mudaraba/wakala, takaful and sukuk, and the line on late-payment charges and early-settlement rebates. Confirm the regulator table (CBK, IRA, CMA, RBA, SASRA) and that each provider's own Shariah board approves its products |
| Letters of credit guide: facts | `letters-of-credit-explained-for-kenyan-importers.mdx` | Confirm the UCP 600 points (five banking days to examine; presentation within 21 days of shipment), that "many banks" ask for the IDF reference via KenTrade before issuing, the KEBS PVoC Certificate of Conformity line, and the EAC/COMESA certificate-of-origin line |
| Budgeting guide: figures | `a-family-budgeting-framework-that-actually-holds.mdx` | Confirm the reserve targets (start with one month of essentials, build to three to six) and that the five-line order matches how Savantho works with households |
| WhatsApp messages | each guide → `whatsappMessage` | Approve the prefilled messages ("Hello Savantho, I've read your guide to …") |
| Search titles | each guide → `seoTitle`, `seoDescription`; `pages.yaml` → `insights` (list and per-subject descriptions) | Approve |
| Business finance | `pages.yaml` → `insights.categories` | The subject is defined but has no guides, so it is not listed and has no page. Write a first guide, or remove the subject |

## Content to confirm (About, Contact, legal, Phase 5)

About copy: `src/content/about/about.yaml`. Contact page and enquiry form: `src/content/contact/contact.yaml`. FAQ, legal template and 404 labels: `src/content/pages/pages.yaml`. Legal documents: `src/content/legal/` (`privacy.md`, `terms.md`, `disclaimer-details.md`; `disclaimer.md` stays the short site-wide statement). All of it is compliance-sensitive: include it in the advocate's review.

| Item | Where | What we need |
|---|---|---|
| Founder portrait | `/about` section 01 (generated SVG placeholder, 4:5) | Photograph, warm desaturated grade, ≥ 1600 px tall |
| `[[ODPC REGISTRATION NO.]]` | `about.yaml` → `record` (Data protection row); `privacy.md` → "Who we are" | Registration number with the Office of the Data Protection Commissioner, or confirm Savantho is below the registration threshold (then remove both lines) |
| `[[PROFESSIONAL QUALIFICATIONS AND MEMBERSHIPS]]` | `about.yaml` → `record` (Qualifications row) | Qualifications and professional memberships Savantho can cite |
| Fee principles | `about.yaml` → `fees` | **Confirm every line**, especially "You pay us, and only us" (no commissions from banks, insurers, developers or product providers) and "Referrals are disclosed" |
| Values in practice | `about.yaml` → `values` | Confirm Savantho can stand behind each "In practice" line |
| Office map | `/contact`, "The quickest way" column (generated SVG placeholder, 8:5) | Office address, then a static map image or an embed decision (an embed would need a privacy-notice line and CSP entry) |
| WhatsApp language and hours line | `contact.yaml` → `ways.whatsapp.body` | Confirm "Write in English or Kiswahili, at any hour; we reply in working hours" |
| "Nothing is shared or sold" | `contact.yaml` → `hero.proof` | Confirm; it must stay true of every tool that handles enquiries |
| Consent checkbox | Contact form, question 03 | Advocate to confirm consent is the right lawful basis for replying to an enquiry, or whether a notice line can replace the checkbox (one less step for the visitor) |
| Retention periods `[[12 months]]`, `[[7 years]]`, `[[30 days]]` | `privacy.md` → "How long we keep it" | Confirmed retention schedule |
| Providers `[[HOSTING PROVIDER]]`, `[[EMAIL PROVIDER]]`, `[[EMAIL HOST]]` | `privacy.md` → "Who we share it with" | Confirm Vercel (hosting), Resend (form delivery) and the mailbox provider for info@savantho.net |
| Transfer safeguards | `privacy.md` → "Transfers outside Kenya" | Advocate to confirm the safeguards relied on for each provider |
| Terms and disclaimer | `terms.md`, `disclaimer-details.md` | Advocate review of the whole text (limitation of liability, governing law, scope statements) |

## Contact form: setup before launch

| Item | Where | What we need |
|---|---|---|
| Resend account and verified domain | Vercel env: `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (see `.env.example`) | A Resend API key, and savantho.net verified in Resend so mail can come from `website@savantho.net` (or another sender Savantho chooses) |
| Inbox | Vercel env: `CONTACT_TO_EMAIL` | The address enquiries should go to (default info@savantho.net) |

## Search, sharing and analytics (Phases 7–8)

Decided: **Google Analytics 4** (Phase 8). Homepage search title **approved** ("Ethical Financial Consultancy, Kenya | Savantho Consultancy").

| Item | Where | What we need |
|---|---|---|
| GA4 measurement ID | Vercel env `PUBLIC_GA4_ID` (`PUBLIC_ANALYTICS_PROVIDER=ga4` is already the default in `.env.example`) | Create the GA4 property and send the ID (G-XXXXXXXXXX). Until it is set, no banner shows and nothing is measured |
| GA4 property settings | GA4 → Admin | Data retention **14 months** (matches `privacy.md` → `[[14 months]]`), Google signals **off**, ads personalisation **off**, and mark `whatsapp_click`, `call_click`, `email_click`, `form_step_1`, `form_submit`, `service_view` as key events (params: `service`, `page`, `location`; `form_submit` also `channel`) |
| Analytics wording | `privacy.md` (analytics paragraph, providers, retention), `pages.yaml` → `consent` | Advocate to confirm, including that consent kept in the browser for 12 months is acceptable under the DPA |
| About and Contact titles | `about.yaml`, `contact.yaml` → `seoTitle` ("About us", "Contact us") | Approve |
| `/llms.txt` text | `pages.yaml` → `seo.llms` | Approve; this is how AI assistants will describe Savantho. Include it in the advocate's review |
| OG card eyebrows | `pages.yaml` → `seo.og` | Approve "Ethical financial consultancy · Kenya" for the home and default cards |
| Social profiles | `site.ts` → `socials` | **To be supplied later.** Also feeds `sameAs` in the Organization JSON-LD (LinkedIn first) |
| Street address and hours | `site.ts` | Left out of the JSON-LD while they are placeholders; once set, they publish automatically. Then set up a Google Business Profile |

## Before launch (checklist)

| Step | Notes |
|---|---|
| Vercel env | `RESEND_API_KEY`, `CONTACT_FROM_EMAIL` (verified domain), `CONTACT_TO_EMAIL`, `PUBLIC_GA4_ID`; `PUBLIC_SHOW_PLACEHOLDERS` unset or `false` |
| Headers live | After the first deploy: `curl -sI https://<deployment>/ | grep -iE "strict-transport|content-security|x-frame|permissions|referrer|x-content-type|x-robots"`. Preview URLs (`*.vercel.app`) must show `X-Robots-Tag: noindex`; the production domain must not |
| PageSpeed Insights (mobile) | Run on `/`, `/about`, `/services/shariah-compliant-finance`. Local Lighthouse passes at 2× CPU; PageSpeed's servers are the reference (see `reports/lighthouse/` after `npm run lighthouse`) |
| Google Search Console | Verify savantho.net (DNS TXT at Cloudflare), submit `/sitemap-index.xml` |
| HSTS preload | Header is `max-age=63072000; includeSubDomains` without `preload`. Add `preload` and submit to hstspreload.org only once every subdomain serves HTTPS (it is hard to undo) |
| Drafts | Each guide goes live by setting `draft: false` and `publishedAt`, after its review. Sitemap, `noindex`, OG and `llms.txt` follow automatically |
| `/styleguide` | Internal page (noindex, not in the sitemap). Decide whether it ships to production |
