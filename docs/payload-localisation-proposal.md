# Payload localization: audit and proposed review workflow

## Outcome

The read-only review slice is implemented for Payload-owned pages: identify text by Page, block and row IDs plus field path; export the current target-language text in context; hash the English source; and dry-run returned feedback for staleness and conflicts. Native Payload per-locale publishing and readiness-aware Page routing are now also implemented; they do not add custom approval metadata or an importer. Content Flow dictionaries remain authoritative for their existing designed pages.

## What exists today

### Payload

- Locales are `en`, `de`, `fr`, `nl`, `ch`, `be`, `uk`, and `uae`; English is default.
- Configured market fallbacks are `ch → de`, `be → nl`, `uk → en`, and `uae → en`; global fallback is enabled.
- Public Page queries now pass `fallbackLocale: false`. An explicit published localized slug is the route-readiness marker; static params, redirects, hreflang, and page sitemaps omit missing locales.
- Localized values live inline on the Page, Header, Footer, SEO, slug, and many block fields. There is no separate Payload translation dictionary.
- Runtime schema traversal found 89 page blocks and 1,353 text/rich-text/textarea leaves: 881 effectively localized and 472 not. The non-localized total includes technical IDs, URLs, colors, names, and SVG data, so it is not a defect count. Clear visible legacy exceptions include the classic Hero rich text/link labels and generic Content rich text/link labels.
- Pages have drafts, five-second autosave, scheduled publishing, and at most ten versions. Payload's primary button publishes the active locale and preserves the last live version of every other locale.
- Native unpublish and whole-version restore remain document-wide. There is no translator assignment, stored source revision/hash, stale marker, reviewer, or custom locale-approval state.
- All authenticated users can update Pages, and the Users collection has no editor/translator/reviewer roles.

### Content Flow

- Designed-page English source is `src/data/translations/<page>/segments.json`, an ordered array of `{ id, kind, value }`.
- Each target language is `<locale>.json`, mapping numeric segment ID to translated value.
- Script-rendered copy uses `js-<locale>.json`, keyed by exact English literal.
- SEO and localized URLs live in `designed-pages.json`; navigation and footer copy live in separate shared JSON files.
- `i18n.mjs` rejects source-slot drift and stamps generated HTML with source and dictionary hashes. `verify-i18n.mjs` checks coverage, IDs, stamps, hashes, slot alignment, and final output.
- The Protocol and About NB1 currently pass targeted integrity verification. Your Biology currently fails for French, German, and Dutch because the localized HTML lacks integrity stamps. Nothing was changed in that repository.
- The latest expert-review JSON was keyed mostly by English source text, with an `__unmapped__` section containing older German fragments. Reconciliation required manually tracing 160 instructions through English source, old German, slot context, and final German. That is exactly the implementation cost the next format should remove.

### Implemented Payload review commands

Export the latest draft values for one Payload Page without fallback:

```sh
npm run translations:review -- export <page-id> <locale> [review-pack.json]
```

After the translator adds entries to the pack's `changes` array, check them against current Payload values:

```sh
npm run translations:review -- check <returned-review.json>
```

The checker is read-only. It reports each change as `apply`, `stale`, `conflict`, `unchanged`, or `invalid`; it never writes a Page or publishes a locale. Localized Lexical rich text is exported as individually addressable text nodes so a future importer can preserve formatting rather than replacing a whole rich-text document with plain text.

## Current pain and correctness risks

1. Missing Page locales are no longer silently rendered in English, but the editor UI still has no explicit translation review/approval state beyond native locale publication.
2. There is no source revision or field hash, so a translation can remain “reviewed” after English changes.
3. Native locale publishing preserves separate live values, but Payload's document-level status still makes unpublish and whole-version restore global operations.
4. Review feedback keyed by English text is ambiguous for repeated/split copy and forces the implementer to translate or infer the current target context.
5. Translation coverage is heterogeneous because localization is declared field by field.
6. The self-redirect and false hreflang risks from English slug fallback are resolved for Payload Pages by exact-locale public reads and omission of missing locale routes.
7. Preview now targets the real `/[locale]/next/preview` route, signs an allow-listed locale/collection/slug for five minutes, and never includes the raw secret or an arbitrary redirect path.

## Source identity and source of truth

For a Payload-owned page, use the Payload Page document and English localized fields as canonical source. A translatable item key should be stable across copy edits:

`pages:<pageId>/layout:<blockId>/field:<nestedFieldPath>`

Array rows use their Payload row IDs. Page metadata and chrome use their collection/global IDs and field paths. Do not use numeric DOM position or the English sentence itself as the primary key.

Maintain a small page-ownership registry during transition:

- `payload`: edit and translate in Payload; Content Flow must not overwrite it.
- `content-flow`: keep `segments.json`, locale dictionaries, JS dictionaries, SEO, and shared chrome authoritative.
- `transition`: read-only comparison only; no dual publishing.

## Translator review pack

The renderer-neutral JSON pack contains all reviewable items and an initially empty `changes` array. A returned change uses this format:

```json
{
  "schemaVersion": 1,
  "page": {
    "collection": "pages",
    "id": "42",
    "sourceLocale": "en",
    "targetLocale": "de",
    "sourceVersion": "2026-08-04T12:00:00.000Z",
    "sourceHash": "sha256:..."
  },
  "changes": [
    {
      "key": "pages:42/layout:hero-row-id/field:heading",
      "context": "Protocol hero > Heading",
      "source": "It starts with what your gut can actually do.",
      "sourceHash": "sha256:...",
      "targetBefore": "Es beginnt mit dem, was dein Darm tatsächlich kann.",
      "targetAfter": "Alles beginnt damit, was dein Darm wirklich leisten kann.",
      "comment": "More natural German phrasing"
    }
  ]
}
```

The implementer no longer has to translate German back to English. The importer locates by stable key, verifies `sourceHash`, and verifies that `targetBefore` still matches before applying `targetAfter`. A mismatch is reported as stale/conflicted, never guessed.

## Proposed locale workflow

1. **English ready:** editor approves the English Page version.
2. **Snapshot:** exporter records the Page version and hashes every translatable source item.
3. **Machine draft:** automation writes or proposes target values without approving them.
4. **Human review:** translator reviews the rendered target page and submits stable-key `targetBefore → targetAfter` changes.
5. **Safe apply:** importer rejects stale source items and target conflicts; unaffected items may still apply.
6. **Context QA:** reviewer sees desktop/mobile preview with changed items highlighted and source alongside target.
7. **Locale approval:** store `status`, `sourceHash`, reviewer, and timestamp per locale.
8. **Publish/readiness:** native publication now emits Page routes and hreflang only for locales with explicit published values. Explicit inherited-locale approval remains a possible later enhancement.

Suggested statuses: `notStarted`, `machineDraft`, `humanReview`, `changesRequested`, `approved`, and `stale`.

## Safe fallback policy

- `ch` may explicitly inherit approved German; `be` may explicitly inherit approved Dutch; `uk` and `uae` may explicitly inherit approved English.
- Inheritance is a visible readiness state, not silent missing data.
- Do not use English fallback to claim French, German, or Dutch readiness.
- If a locale is not approved/inherited, omit its hreflang and route from generated params or show an intentional unavailable state. Do not create self-redirecting fallback routes.
- Route resolution should identify the Page first and then choose the approved locale slug, rather than expecting a localized-slug `where` predicate to perform fallback.

## Reconciliation with Content Flow

Reuse the good contracts rather than its renderer assumptions:

- Carry forward source hashes, dictionary hashes, coverage checks, identity allow-lists, and stale-output rejection.
- Convert a Content Flow numeric segment ID to a stable Payload field key once when a page is deliberately transferred.
- Convert `js-<locale>.json`, SEO metadata, nav, and footer data to their corresponding Payload fields/collections only as part of that page's approved transfer.
- Until transfer, keep Content Flow's positional dictionaries and generated HTML intact. They remain valid for their standalone designed pages whether the long-term renderer is Astro, React, or something else.

## Independently shippable sequence

1. **Read-only review-pack exporter — implemented:** define the JSON schema and export stable keys, English, current target, and hashes. No Payload schema change.
2. **Conflict-checking dry run — implemented:** accept a returned pack and report exact applies/stale/conflicts without writing.
3. **Locale status metadata:** after approval, add per-locale status/hash/reviewer fields or a small related collection.
4. **Safe importer:** write only validated changes and create a Payload version; never publish automatically.
5. **Context review UI:** highlight changes in preview and let reviewers approve the locale.
6. **Readiness-aware routing — implemented for Payload Pages:** exact-locale reads, params, hreflang, redirects, and page sitemaps omit unpublished locale values.
7. **Page-by-page Content Flow transfer:** optional and explicitly approved; no Astro or React migration is implied.

Implemented candidates are slices 1, 2, and the native portion of 6. Review the JSON output with a translator before approving locale-status schema or importing behavior. See `docs/payload-publishing.md` for the editor and deployment flow.
