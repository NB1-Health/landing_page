# Payload performance: baseline and approved quick wins

## Outcome

Two low-risk changes are implemented:

1. The main page query now populates only the internal `name` plus implicit ID for related headers and footers. The Header and Footer components already fetch their complete documents through their own tagged caches, so the previous full population was duplicate work.
2. The live-preview listener now treats Payload's first form-data message as its baseline and refreshes only when a saved-document identity (`entity`, `id`, `operation`, `updatedAt`) changes. Opening Preview no longer immediately refreshes the page and then refreshes it again for Payload's initial document event.

The earlier hidden-header slug-map skip is retained for locale-root requests. Explicit Page URLs still need a lightweight slug-identity lookup so a homepage with a translated slug is normalized safely to `/{locale}`; correctness takes precedence over the measured ~0.5 ms lookup.

No schema, block, localization, renderer, or cache-lifetime behavior changed.

## Measurement method

- Isolated local PostgreSQL 18 instance; no staging or production database was used.
- Current Payload schema generated into a disposable database.
- Twelve synthetic published pages; the representative page contains 48 content blocks and large text values.
- Representative header and footer relationships contain localized navigation/copy.
- Query figures are one warm-up followed by 12 measured iterations.
- Timings are directional local evidence. Serialized byte counts and query-count changes are deterministic for the fixture.

The configured shared database tunnel at `localhost:55432` was unavailable. The checked-in migrations also cannot bootstrap a clean database: `20260408_091809` expects `pages_blocks_product_showcase_panel_thumbnails`, which the preceding baseline migration does not create. The temporary database therefore used Payload's current schema push solely for measurement. The migration-chain issue is not changed in this branch.

## Baseline

| Path | Median | p95 | Serialized result |
| --- | ---: | ---: | ---: |
| Admin page list, five rows, selected columns, depth 0 | 2.14 ms | 2.84 ms | 616 B |
| Draft/live-preview full page, depth 2 | 86.61 ms | 162.55 ms | 201,043 B |
| Public full page, depth 2 | 81.79 ms | 87.41 ms | 199,987 B |
| Metadata-only page query | 0.98 ms | 1.71 ms | 447 B |
| Per-locale slug map | 0.51 ms | 0.92 ms | 33 B |

The baseline production build generated 129 static routes in 14.03 seconds. Reported first-load JavaScript was 515 kB for a public Payload page and 769 kB for the Payload admin route. A dynamically rendered 48-block page produced about 300.5 kB of HTML, with 303 ms cold TTFB and 88–125 ms warm TTFB locally. These render figures describe the synthetic fixture, not production traffic.

## Before/after evidence

### Limit duplicate header/footer population

| Public page query | Before | After | Change |
| --- | ---: | ---: | ---: |
| Median | 81.79 ms | 77.86 ms | -4.8% |
| p95 | 87.41 ms | 80.05 ms | -8.4% |
| Serialized result | 199,987 B | 137,649 B | -62,338 B / -31.2% |

An equivalence check normalized the full header/footer objects to the IDs consumed by the page template and compared every remaining page value. Result: `consumedPageDataEqual: true`.

### Locale slug lookup when the header is hidden

The original pilot removed one Payload `findByID` call per hidden-header render; that call measured 0.51 ms median and 0.92 ms p95 on the fixture. The final publishing path still skips it on locale-root requests, but explicit Page URLs use it to distinguish a translated homepage slug from an ordinary page. Pages that render a header already need the same slug map for the locale switcher.

### Avoid repeat renders when live preview opens

Payload 3.70's stock `RefreshRouteOnSave` invokes `router.refresh()` once as soon as the listener mounts. The admin then sends an initial `payload-document-event`, which invokes it a second time. Neither event represents a new editor save.

| Initial preview handshake | Before | After |
| --- | ---: | ---: |
| `router.refresh()` callbacks | 2 | 0 |
| Refreshes for each distinct later save | 1 | 1 |

The replacement retains same-origin validation and deduplicates repeat messages for the same save. A follow-up phase split showed that the previously reported 3.09-second fresh-preview result measured the browser automation's semantic click settling, not iframe rendering: the click consumed about 3.06 seconds and the already-mounted iframe content was visible about 10 ms later. A full Payload document reload through to visible preview content measured 624–763 ms locally; the warm signed preview route and authenticated draft page measured about 12 ms and 120 ms respectively.

### Keep marketing integrations out of draft preview

The localized frontend layout now enables marketing integrations only in a production, non-draft request. Payload preview therefore no longer loads GTM, Ketch, Conversion.io, Klaviyo, Chatwoot, Meta tracking, or the page-view tracker. Ordinary production pages retain the integrations.

| Authenticated draft response | Before | After | Change |
| --- | ---: | ---: | ---: |
| HTML bytes | 463,373 | 446,861 | -16,512 / -3.6% |
| Marketing integration URL groups | 4 | 0 | -100% |
| Warm TTFB median (five runs) | 126.5 ms | 122.2 ms | -4.3 ms; within local noise |

The browser check fell from 23 external script elements to one. The remaining script was Stripe on a page with no checkout block, which supports checkout-only bundle splitting as a separate measured candidate. The marketing gate is primarily a privacy/correctness and external-dependency isolation improvement; it does not materially change the Payload query or warm server render.

## Changes considered and rejected

- `depth: 2` to `depth: 1`: 81.79 ms to 82.28 ms in the representative run, with no byte reduction. It was not implemented.
- Selecting only page-render fields: 81.79 ms to 80.93 ms and only 364 B saved. It does not address the 89-block join and was not implemented.
- Broad block/schema changes: potentially material, but they belong to the separately approved editorial-structure decision.

## Validation

- `npx tsc --noEmit`: passed.
- `npx vitest run --config ./vitest.config.mts tests/int/marketingRuntime.int.spec.ts`: 4 tests passed.
- `npx vitest run --config ./vitest.config.mts tests/int/livePreviewListener.int.spec.tsx`: 2 tests passed.
- `npm run test:int`: 21 files and 103 tests passed; the two database lifecycle tests were skipped by their strict local database-name guard. Their existing publishing coverage is unchanged by this client-only listener slice.
- `npm run build` against the isolated database: passed; existing lint warnings remain.
- Post-change local public page and Payload admin routes returned HTTP 200.

## Next measurable slice

Run the same query harness through the normal staging tunnel against one real heavy page and one ordinary page. Capture database execution time, bytes, and TTFB before considering any further query-depth or block-schema work. The current evidence says the dominant remaining cost is the single 89-type block union, not scalar field selection.
