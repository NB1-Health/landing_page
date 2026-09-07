# Influencer landing templates

## Editing

- **Influencer templates** owns shared timeline, science-team portraits/copy, outcomes, plan cards/comparison, offer background, terms and footer links/copy. Editors and admins can edit and publish. The layout, outer backgrounds and spacing follow the reference design; this is not a free-form style builder.
- **Influencer landing pages** owns the creator name/handle, hero photo and copy, testimonial, offer copy, CTA label, canonical discount code, optional video and optional creator-specific terms. Select a shared template; existing records without a selection use the published template with key `default`.
- `{name}` inserts the creator name. In the hero heading it also applies the teal highlight. Content is escaped React text, not executable HTML.
- Saving a template draft does not affect public pages. Publish it to update all linked pages on their next request. Preview a linked influencer page in the existing CMS preview flow; it loads authorized template drafts and refreshes when either record changes. A missing/unpublished template does not expose draft content; optional shared sections are omitted.
- Content fields are localized with the site's configured fallback. Complete required translated fields before publishing. The influencer record retains its existing per-locale publication controls.
- Add footer links by selecting the existing legal/contact pages; only published linked pages are rendered. No prototype `.html` links are shipped.

## Offers and pricing

All seven conversion points in the reference layout (navigation, hero, final offer, two plan cards and two comparison CTAs) use the same offer-saving component. Plan CTAs use the selected family’s localized `order-core` / `order-advanced` route; other CTAs use localized `order`. CMS CTA URLs in the shared Plans block are deliberately ignored on influencer pages.

The shared Plans component keeps its existing links and monthly pricing on other pages. In influencer mode it shows the four-month catalogue rate, matching the reference cards, plus an optional live-price-token monthly note. Checkout remains authoritative for duration, eligibility and totals. No fixed prototype prices were imported. No payment API or discount calculation was changed.

Do not promise a free month unless the actual code grants one. `TEST2` was previously verified on staging as €30 off eligible Core durations, not a free-month offer. The code is transferred via existing session storage, not the URL; this is not a way to keep a code secret from browser inspection. Storage failure shows an error and prevents losing the offer through navigation. Video remains click-to-load, not the prototype’s autoplay modal. No automatic discount banner was added.

## Import / release order

1. Deploy the landing code and run migration `20260907_105644_influencer_template_design`. It adds the shared collection and optional relationship/terms fields; it does not rewrite existing creator content or publish anything.
2. Against the intended CMS, run `INFLUENCER_REFERENCE_HTML='/absolute/path/to/NB1 Influencer Landing (standalone).html' npm run payload -- run scripts/seed-influencer-template.ts`. The importer reads the embedded HTML/asset manifest as data (does not execute its scripts), uploads referenced images and creates English **drafts**. It does not overwrite an existing default template. No original HTML or uploaded image binaries need committing.
3. Review the draft template: outcome claims/evidence and media rights, live plan copy, kit/offer terms, footer page relationships, and required translations. The importer intentionally does not copy stale kit fees or free-month promises. The included creator fixture is explicitly synthetic and uses TEST2; replace its content or leave it unpublished outside local QA.
4. Publish the approved shared template and link/publish real influencer records. Verify responsive layout and uninterrupted CTA → checkout → Stripe test purchase on staging before production rollout. The existing checkout kit-fee discrepancy and thank-you discount omission remain separate QA findings.

## Local verification (7 September 2026)

An isolated PostgreSQL database `influencer_design_test` was used; staging and production were not changed.

- Full migration chain passed, including the new schema. Existing manually migrated help tables were excluded from the new generated SQL; the snapshot now includes that pre-existing schema.
- `scripts/verify-influencer-template-local.ts` verifies real CMS persistence, public draft isolation, editor draft reads, anonymous write denial, publishing, explicit/default template propagation and localization. It refuses non-local databases and retains the seeded page for preview.
- `scripts/qa-influencer-design.mts` verifies 1440px, 390px and 320px layouts, mobile hero order, long-name wrapping, images, comparison controls, keyboard outcome-card interaction and all seven offer handoffs. It blocks remote traffic and mocks catalogue prices. This is **not** a live checkout purchase test.
- Integration tests cover localized destinations, storage-before-navigation, unavailable storage, template access, normal/influencer plan behavior and existing checkout regressions. Run `npm run test:int` with an isolated `DATABASE_URL`; optional localization persistence suites additionally use `TEST_DATABASE_URL`.
- Final consolidated result: **310 passed, 1 skipped** (the opt-in legacy publication-status migration transition test). TypeScript and the production build passed. The responsive/CTA browser checks also passed against that local production build; catalogue responses were fixtures and no purchase was submitted in this design pass.

Screenshots are local-only under `outputs/influencer-design/`. Public uploads created by the local importer are ignored by Git under `public/media/influencer-reference-*` and remain in the local CMS.
