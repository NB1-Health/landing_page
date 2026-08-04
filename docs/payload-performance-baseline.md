# Payload performance: baseline and approved quick wins

## Outcome

One material low-risk query change is implemented in the page renderer:

1. The main page query now populates only the internal `name` plus implicit ID for related headers and footers. The Header and Footer components already fetch their complete documents through their own tagged caches, so the previous full population was duplicate work.

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

## Changes considered and rejected

- `depth: 2` to `depth: 1`: 81.79 ms to 82.28 ms in the representative run, with no byte reduction. It was not implemented.
- Selecting only page-render fields: 81.79 ms to 80.93 ms and only 364 B saved. It does not address the 89-block join and was not implemented.
- Broad block/schema changes: potentially material, but they belong to the separately approved editorial-structure decision.

## Validation

- `npx tsc --noEmit`: passed.
- `npm run test:int` against the isolated database: 18 files and 83 tests passed.
- `npm run build` against the isolated database: passed; existing lint warnings remain.
- Post-change local public page and Payload admin routes returned HTTP 200.

## Next measurable slice

Run the same query harness through the normal staging tunnel against one real heavy page and one ordinary page. Capture database execution time, bytes, and TTFB before considering any further query-depth or block-schema work. The current evidence says the dominant remaining cost is the single 89-type block union, not scalar field selection.
