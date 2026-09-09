# Marketing HTML caching: application handoff

The application removes the failing middleware REST redirect lookup. Pages and
Journal articles still use `PayloadRedirects` and its shared, tagged CMS data
cache. Redirect changes and deletions invalidate that cache; it also expires
after five minutes. Canonical and locale redirects still apply to every user agent.

Default country/currency cookies are no longer set when visiting a page. The URL
supplies the default currency, and the header still saves an explicit selection.
Server-rendered CMS price tokens continue to honour that selection, so requests
with cookies remain private. This is the first currency step, not a completed
migration of arbitrary CMS price tokens to the client.

## Enablement

Keep `MARKETING_EDGE_CACHE_ENABLED` unset/false until the edge safeguards below
are installed. Set it at **build and runtime**, then rebuild and restart:

```dotenv
MARKETING_EDGE_CACHE_ENABLED=true
# Optional: replaces the default list; exact paths, never prefixes or wildcards.
MARKETING_EDGE_CACHE_PATHS=/en,/de,/fr,/nl,/it,/ch,/be,/uk,/uae
```

When PATHS is omitted, all nine locale homepages are eligible. An empty PATHS
disables all paths. Start with the homepage traffic that caused the incident.
Review the CMS blocks and behaviour of any additional marketing path before
adding it to both this list and Cloudflare's rule.

Only query-free, cookie-free GET/HEAD HTML requests qualify. No user-agent or
country cache key is needed: these responses use the URL locale's currency and
contain the same content for humans and crawlers. Requests with an explicit
currency, any other cookie, query parameters, Authorization, RSC/router/prefetch
headers, Server Action headers, or Range bypass this first rollout.

The application emits:

```http
Cloudflare-CDN-Cache-Control: public, max-age=60, stale-while-revalidate=30, stale-if-error=300
```

Next's raw request header rules grant caching before it strips Flight headers
and `_rsc` from middleware input. Middleware only vetoes the grant, so locale
and canonical redirects still run for client navigation.

Next retains its private browser `Cache-Control`; the dedicated header controls
only Cloudflare. The header deliberately uses `max-age`, not `s-maxage`, because
the latter conflicts with stale serving under Cloudflare's Origin Cache Control.
See [header precedence](https://developers.cloudflare.com/cache/concepts/cdn-cache-control/)
and [stale behaviour](https://developers.cloudflare.com/cache/concepts/cache-control/).

## Serkan: edge and origin configuration

1. Limit HTML Cache Everything eligibility to the exact agreed paths on the
   production marketing hostname. **Bypass before cache lookup** unless the
   request meets the conditions in `src/utilities/marketingCachePolicy.mjs` and
   `canCacheMarketingRequest` in `src/utilities/marketingCache.ts`. Origin headers alone cannot stop an editor
   or an RSC request from receiving an already cached public response. Initially
   bypass **all cookies and all query strings**, including analytics cookies and
   ad parameters. Do not strip cookies or ignore query strings to increase hits.
2. Respect `Cloudflare-CDN-Cache-Control`; do not force an Edge TTL that overrides
   origin restrictions. Keep browser TTL respecting the origin. Keep Always
   Online off for these paths when testing the stale directives.
3. **Only successful HTML may carry the public edge header.** Middleware runs
   before Next knows the final status/content type. Install the final-response
   guard below in nginx (or an equivalent verified Cloudflare response rule)
   before enabling the flag. Do not cache redirects, 404s, 5xx, JSON/RSC, or any
   response containing Set-Cookie. Keep the default Set-Cookie cache bypass.
4. Warm each enabled page, confirm MISS → HIT and increasing Age, then run the
   negative cases below against the same warm URLs. Monitor origin request rate,
   DB connections, latency and 5xx during a real crawler burst. Moving the uptime
   probe and crawler alerting remain separate operations.

Example nginx **http-context** maps; preserve the site's existing configuration:

```nginx
map "$upstream_status:$upstream_http_content_type" $nb1_html_response {
    default 0;
    "~^200:text/html(?:;|$)" 1;
}
map "$nb1_html_response:$upstream_http_set_cookie" $nb1_shareable_response {
    default 0;
    "1:" 1;
}
map "$nb1_shareable_response:$upstream_http_cloudflare_cdn_cache_control" $nb1_edge_control {
    default $upstream_http_cloudflare_cdn_cache_control;
    "~^0:public," "no-store";
}
```

In the existing Next proxy location, replace only this upstream header:

```nginx
proxy_hide_header Cloudflare-CDN-Cache-Control;
add_header Cloudflare-CDN-Cache-Control $nb1_edge_control always;
```

Run `nginx -t` before reloading. Verify inherited/existing `add_header` directives
remain effective (especially staging's noindex header). The maps preserve
unrelated image/static cache headers. The application flag alone does not install
these settings or make Cloudflare cache HTML.

## Validation and rollback

- Origin: `/en` returns 200 HTML, no Set-Cookie, the public dedicated header when
  enabled, and the same default prices for ordinary, Facebook and Google agents.
- Warm edge: repeat `/en` → HIT. Repeat with `nb1_currency=CHF`, an editor/preview
  cookie, an unknown session cookie, Authorization, `RSC: 1`, router/prefetch
  headers, `?_rsc=...`, `?preview=...` and `?utm_source=...` → never HIT or stale
  public HTML. Confirm currency selection still updates prices and survives reload.
- Checkout includes `/en/order-*`, `/de/bestellen-*`, `/fr/commander-*`, plus any
  other localized checkout slugs. All unlisted paths stay out, including
  checkout, influencers, topics/themen, CMS/API, previews, search and account
  pages. Existing `force-dynamic` exports stay in place; Cloudflare's exclusions
  are still necessary. Do not add pages containing checkout blocks to the list.
- Create/update/delete a staging CMS redirect and check it for both normal and
  crawler agents; verify canonical normalization and localized aliases as well.
- Publish/unpublish staging content. Next's existing hooks invalidate CMS reads;
  **Cloudflare is not purged by those hooks**. A healthy edge may serve old HTML
  for up to 90 seconds after the origin data is refreshed. Under eligible errors,
  the last cached version can remain for up to five minutes beyond freshness.
  Purge the affected URLs immediately for urgent corrections/unpublishing.
- On an isolated staging test, warm a 200 page, expire it, and simulate an origin
  500/502/503/504 to verify stale delivery with the actual zone/nginx settings.
  Also test cold-cache failure and 404 separately. No warmed object means no stale
  protection; the change does not make all outages invisible.
- Staging Basic Auth must remain enabled. Authenticated staging requests bypass
  shared caching; validate the public contract via staging loopback, then a
  coordinated production edge pilot. Do not remove staging authentication just
  to get a HIT.
- Roll back by disabling the Cloudflare HTML rule **and purging existing entries**,
  then disabling the flag and rebuilding/restarting. Disabling only the origin
  flag will not remove cached responses.

## Remaining Phase 2 work

Expanding to returning visitors and campaign URLs requires an audit of safe
tracking cookies/query parameters and their cache-key behaviour. Fully removing
currency from server rendering also requires migrating generic CMS price tokens
(hero, block fields, rich text, FAQ and sticky bars) to currency-aware client
components while preserving initial HTML and avoiding hydration mismatches.
Until then, explicit currency and other cookie-bearing requests stay private.
