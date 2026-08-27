# Loading-speed optimisation validation

Revalidated on 27 August 2026 against `origin/main` at `e40ebca`. The candidate was
`perf/loading-speed-optimisation` at `9f57e3e`; that preservation merge has the same
tree as the tested implementation tip `9425ee0`.

## Executive evidence

The defensible release headline is:

> CMS landing pages ship about 75 kB less compressed JavaScript, a 14% reduction,
> while posts, search and product routes are effectively unchanged. Checkout retains
> the same total payload and remains interactive; its code is deferred away from pages
> that do not use it.

The branch has no dependency, lockfile or database-migration changes, so application
rollback is code-only.

### Deterministic production-build comparison

Both refs used Node 24.19, Next 15.4.11, the same lockfile and fixture database, and
clean production builds. The table sums each route family's unique JavaScript files
from `.next/app-build-manifest.json` and compresses those exact artifacts with gzip
level 9. It is independent of CMS content and browser timing noise.

| Route family | `origin/main` | Candidate | Change |
| --- | ---: | ---: | ---: |
| CMS landing pages | 531,693 B | 457,355 B | **-74,338 B (-14.0%)** |
| Posts list | 155,065 B | 154,930 B | -135 B (-0.09%) |
| Post detail | 188,300 B | 188,243 B | -57 B (-0.03%) |
| Posts pagination | 124,275 B | 124,058 B | -217 B (-0.17%) |
| Search | 154,186 B | 154,130 B | -56 B (-0.04%) |
| Product detail | 135,873 B | 136,049 B | +176 B (+0.13%) |

For CMS landing routes specifically:

| Measurement | `origin/main` | Candidate | Change |
| --- | ---: | ---: | ---: |
| Next build First Load JS | 532 kB | 457 kB | -75 kB (-14.1%) |
| Raw route JavaScript | 2,179,738 B | 1,867,685 B | -312,053 B (-14.3%) |
| Gzip route JavaScript | 531,693 B | 457,355 B | -74,338 B (-14.0%) |
| Brotli route JavaScript | 411,912 B | 352,459 B | -59,453 B (-14.4%) |

### Controlled browser comparison

The browser check used the two clean production builds, the same disposable Postgres
database and two small published fixtures: an ordinary landing page and a page containing
the Checkout Form. Each sample used a fresh Chromium context. External requests were
recorded and aborted so vendor variability and test events could not affect the result.

Browser-loaded bytes measured 750 ms after the expected interactive selector appeared:

| Measurement | `origin/main` | Candidate | Change |
| --- | ---: | ---: | ---: |
| Landing JavaScript | 545,481 B | 479,405 B | **-66,076 B (-12.1%)** |
| Landing HTML | 18,044 B | 21,853 B | +3,809 B (+21.1%) |
| Landing JS + HTML | 563,525 B | 501,258 B | **-62,267 B (-11.1%)** |
| Checkout JavaScript | 545,481 B | 547,079 B | +1,598 B (+0.3%) |
| Checkout HTML | 24,677 B | 24,068 B | -609 B (-2.5%) |
| Checkout JS + HTML | 570,158 B | 571,147 B | +989 B (+0.2%) |

The landing fixture's HTML increase is fixture-dependent preload/RSC markup for deferred
chunks; it is more than offset by the JavaScript reduction. The candidate made two more
local JavaScript requests after the observation window, so the improvement is fewer bytes
and less early execution rather than fewer total requests.

The ordinary page on current `main` attempted to load Stripe. The candidate did not. The
candidate checkout fixture still rendered `#nb1-email` and requested Stripe, demonstrating
that checkout code was moved off unrelated pages rather than removed.

### Controlled mobile profile

Three measured samples followed one warm-up per route. Chromium used a 390 x 844 viewport,
4x CPU slowdown, 1.6 Mbps downlink, 750 Kbps uplink and 150 ms latency. Values are medians.

| Route / measurement | `origin/main` | Candidate | Change |
| --- | ---: | ---: | ---: |
| Landing DOMContentLoaded | 793 ms | 773 ms | -21 ms (-2.6%) |
| Landing load | 4,209 ms | 3,787 ms | **-422 ms (-10.0%)** |
| Landing LCP | 2,128 ms | 900 ms | **-1,228 ms (-57.7%)** |
| Checkout DOMContentLoaded | 791 ms | 811 ms | +20 ms (+2.5%) |
| Checkout load | 4,438 ms | 4,455 ms | +18 ms (+0.4%) |
| Checkout LCP | 2,168 ms | 940 ms | -1,228 ms (-56.6%) |

These timings are controlled regression evidence, not production Core Web Vitals or
Lighthouse scores. The server was on loopback, fixtures were deliberately small, external
services and production images were absent, and CDP applied rather than simulated the
throttling. Production Lighthouse samples and field data remain post-deploy gates.

## Change rundown

### Loading and rendering

- Dynamically split the Checkout Form and Stripe code so ordinary CMS pages do not load it.
- Delay the large Armin vendor widget until page load plus browser idle away from checkout;
  checkout and an explicit chat-open request still load it immediately.
- Remove unused theme-provider hydration and five client-only page-theme shims from CMS
  pages, posts and search; the affected routes render their header theme on the server.
- Add device-specific high-priority hero preloads and image dimensions plus lazy/async
  decoding across shared header/footer and the affected marketing blocks.
- Remove the initial `html { opacity: 0 }` paint suppression while retaining early theme
  initialization, and avoid duplicate Trustpilot iframe initialization.
- Add media `updatedAt` cache-busters where the homepage hero and Two Models use public URLs.

### Application caching

- Cache published CMS page data, metadata, localized slugs, home detection and site settings
  for ten minutes, with authenticated preview bypasses.
- Invalidate the relevant page, sitemap and media tags on page, post, media, form and site
  settings changes; purge failures are logged without failing the CMS write.
- Correct localized footer links that pointed to `home-page` so they resolve to `/{locale}`.

One bounded caveat remains: an `ExpertQuote` can populate an Author into a cached Page, but
Authors do not currently invalidate the broad page cache. An edited referenced Author may
therefore remain stale for up to the 600-second TTL. Accept that editorial delay explicitly
or add the same small page-cache invalidation hook to Authors before merge.

### Cloudflare support

The edge-cache feature is disabled unless both conditions are true at build time:

- `DEPLOY_ENV=production`
- `CLOUDFLARE_EDGE_CACHE_ENABLED=true`

Only optimized images, direct Payload media and sitemap XML receive Cloudflare cache
contracts. HTML, checkout, CMS, APIs, previews, authenticated responses and RSC/prefetch
responses remain excluded. Page/post publication and media changes purge scoped cache tags.
Localized sitemap middleware no longer adds visitor currency/country cookies.

Changing the feature flag requires a rebuild, not merely a process restart. The complete
dashboard rules and verification commands are in
[`../cloudflare/README.md`](../cloudflare/README.md).

### Tracking and consent correctness

This is the main non-performance blast radius in the branch:

- Enhanced identity waits for resolved Ketch consent and requires
  `targeted_advertising=true`.
- Meta `external_id` is only the SHA-256 of normalized email; backend, customer and session
  IDs are no longer substituted.
- Base events still fire if consent is denied/unresolved, hashing fails or the bounded
  identity wait expires.
- Meta's browser-to-server event waits for real consent resolution before sending or
  dropping its queued copy.
- Repeated normalized consent callbacks are deduplicated, and withdrawal scrubs stored
  advertising-click attribution.
- Checkout and post-purchase payloads no longer propagate the legacy external ID.

## Validation already passed

- `npm ci`
- `npx tsc --noEmit --incremental false`
- full Vitest integration suite: 194 passed, 3 skipped
- `npm run build`
- repository Playwright production smoke: 1 passed
- additional production Chromium landing/checkout smoke
- fresh matched production builds and browser comparisons on 27 August

The deployment workflows do not currently run Vitest, TypeScript, Playwright or Lighthouse,
so these remain explicit release checks rather than assumed CI coverage.

## Safe rollout plan

### 1. Pre-merge and staging

1. Rebase and repeat the validation above if `main` moves.
2. Keep Cloudflare edge caching disabled on staging.
3. Crawl every URL in all eight localized page sitemaps, checking expected status/redirects,
   browser errors and failed first-party JavaScript/media requests.
4. Deep-check desktop and mobile versions of the homepage, order entry, Checkout Form,
   one media-heavy page, posts list/detail, search and authenticated preview.
5. Verify locale/currency separation with fresh GBP, EUR and CHF or AED contexts.
6. On a disposable staging page, warm the cache and test draft, publish, rename, media/form
   update and unpublish transitions. Drafts must never become public.
7. Repeat unresolved, reject, accept, returning-consent and withdrawal tracking journeys.
   Confirm no tracking identity before consent, normalized-email-only `external_id`, no
   duplicate callback event and attribution removal after withdrawal.

### 2. Production application rollout, edge rules off

1. Record the pre-deploy production SHA and deploy in a low-traffic window; there is no
   canary/blue-green path and the current script stops PM2 before migration/build.
2. Initially deploy with `CLOUDFLARE_EDGE_CACHE_ENABLED=false`.
3. Repeat the functional, checkout and consent smoke and inspect PM2/browser/5xx errors.
4. Set the flag and scoped zone/token values, rebuild while both Cloudflare Cache Rules
   remain disabled, and verify that only the intended responses expose edge-cache headers.

### 3. Cloudflare rollout in two increments

1. Enable sitemap/direct-media eligibility first. Prove `MISS -> HIT`, no sitemap
   `Set-Cookie`, and tag purge returning an updated object to `MISS -> HIT`.
2. Allow the four-hour direct-media TTL to pass before assuming every older object carries
   the new cache tag.
3. Enable `/_next/image` only after normalized `Accept` variation is configured. Prove
   independent WebP-capable and fallback `MISS -> HIT` sequences with correct content types.
4. Keep all HTML, checkout, CMS, API, preview, search, redirect, authenticated and RSC
   traffic outside Cloudflare eligibility.

Hard-stop and rollback if any HTML becomes `CF-Cache-Status: HIT`, currency/pricing crosses
contexts, a draft becomes public, image formats mix, checkout/Stripe disappears, tracking
precedes consent, or purge/5xx/browser errors materially increase.

Rollback order: disable optimized-image and sitemap/media rules, purge the affected tags or
URLs, set the application flag false and rebuild, then revert the performance merge through
the normal `main -> stg -> prod` workflow. Do not hard-reset `prod`.

## What cannot be proven locally

Local tests cover feature gating, emitted headers, purge request construction and failure
handling. They cannot prove Cloudflare dashboard rule precedence, real edge `MISS/HIT`,
cache-tag propagation, purge reach, `Accept`-variant isolation or production field metrics.

The live baseline captured before rollout on 27 August was:

- `/en`, `/en/order` and `/cms/admin`: HTTP 200, private/no-store, `CF-Cache-Status: DYNAMIC`.
- `/en/pages-sitemap.xml`: HTTP 200 and `DYNAMIC`, but current `main` still adds the
  `nb1_currency` cookie that this branch removes from sitemap requests.
