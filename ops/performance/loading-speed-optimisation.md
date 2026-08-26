# Loading-speed optimisation validation

Validated on 26 August 2026 against `origin/main` at `e40ebca`. The candidate was the
cleanly rebased `perf/loading-speed-optimisation` stack, including the loading changes in
`ceb5745` and the edge-cache changes in `8a051a1`.

## Controlled local comparison

Both refs were clean production builds using the same lockfile, installed dependencies,
Node 24.19, disposable Postgres database, and two small published fixtures. Chromium
141 loaded each route in five fresh browser contexts. Third-party requests were recorded
and aborted so network variability or test events could not affect the result. Values
below are medians; byte counts were identical in all five samples.

| Measurement | `origin/main` | Candidate | Change |
| --- | ---: | ---: | ---: |
| Next build, landing-route First Load JS | 532 kB | 457 kB | -75 kB (-14.1%) |
| `/en` browser-loaded JS (encoded) | 546,084 B | 470,649 B | -75,435 B (-13.8%) |
| `/en` JavaScript requests | 20 | 19 | -1 |
| `/en` HTML (encoded) | 17,468 B | 16,712 B | -756 B (-4.3%) |
| `/en` DOMContentLoaded | 226.9 ms | 34.5 ms | -192.4 ms |
| `/en` load | 289.7 ms | 86.6 ms | -203.1 ms |
| `/en` LCP | 244 ms | 48 ms | -196 ms |
| Order fixture browser-loaded JS (encoded) | 546,084 B | 547,074 B | +990 B (+0.2%) |
| Order fixture JavaScript requests | 20 | 22 | +2 deferred chunks |
| Order fixture DOMContentLoaded | 233.9 ms | 43.1 ms | -190.8 ms |
| Order fixture load | 330.5 ms | 92.4 ms | -238.1 ms |
| Order fixture LCP | 272 ms | 64 ms | -208 ms |

The homepage no longer requested Stripe; the order fixture still requested Stripe,
rendered its order-entry marker, plan selector, and interactive email field. Both routes
returned HTTP 200 with their expected headings. This demonstrates that checkout code was
moved off ordinary landing pages rather than removed from the checkout path.

The timing numbers are a repeatable local regression check, not production Core Web
Vitals: the server was on loopback, the fixtures were intentionally small, there was no
mobile CPU/network throttle, and external services were blocked. The stable bundle and
browser byte reductions are the primary before/after evidence. Production Lighthouse and
real-user data remain post-deploy checks.

## Correctness checks

The candidate also passed:

- `npm ci`
- `npx tsc --noEmit --incremental false`
- the full Vitest integration suite: 194 passed, 3 skipped
- `npm run build`
- the repository Playwright smoke against the production build: 1 passed
- an additional Chromium production smoke over the landing and order fixtures

## Post-deploy gates

1. Run at least three Lighthouse mobile samples for representative landing and order
   pages before and after deployment under the same profile. Compare medians and retain
   the reports with the release record.
2. Check production field data after enough traffic has accumulated; local measurements
   must not be presented as production CWV.
3. Complete the Cloudflare dashboard rollout and live verification in
   [`../cloudflare/README.md`](../cloudflare/README.md). In particular, HTML must remain
   `DYNAMIC`/`BYPASS`, image format variants must not mix, and tag purge must be proven.
   The application changes are safe with the feature flag off; the edge-cache benefit is
   not delivered until this external gate is complete.
