# Open questions

The single running list. Claude reads it out at the start of every session (see CLAUDE.md) and at
the end of every phase. Add new questions here, and delete them once answered (record the answer
in the status log or the relevant content file). Placeholders the client must supply are listed in
detail in `PLACEHOLDERS.md`.

Last updated: 2026-11-26

## Decisions for you

1. **Shariah hero watermark:** keep the 280-line lattice draw, stars only, or static? (Lighthouse
   73 at raw 4× CPU on this laptop; 100 at 2×.)
2. **`/styleguide` in production:** keep it (noindex, unlisted) or remove it before launch?
3. **HSTS preload:** turn on once the domain is final on Cloudflare.

## Accounts and keys

4. **Vercel:** the Claude connector needs access to the personal Vercel team before the project
   can be created.
5. **GA4:** measurement ID (`PUBLIC_GA4_ID`), retention period (`[[14 months]]` in
   `privacy.md`), register the six goals.
6. **Resend:** API key and a verified sender on savantho.net. Until then the form returns 503 and
   offers WhatsApp.

## From the client (Savantho)

7. **Search details:** social profile URLs (`sameAs`), office address and opening hours.
8. **Services:** confirm timelines, proposal turnaround, fees wording, formats (Kiswahili), scope
   lines, and the Shariah reviewer arrangement.
9. **Homepage:** confirm the process outcomes and value proofs.
10. **Insights:** a reviewer and fact check for each of the three guides, reserve targets, cover
    photographs, and whether to keep the Business finance subject.
11. **Assets:** founder name, photo and bio, company registration number, logo vectors, and the
    rest of `PLACEHOLDERS.md`.

## For the advocate

12. Consent checkbox vs notice line on the enquiry form, fee principles (no commissions),
    retention periods, providers, ODPC registration, and sign-off on `/privacy`, `/terms` and
    `/disclaimer` (still drafts under `[[ADVOCATE NAME]]`).
