# Cloudflare edge caching

This rollout deliberately caches only responses that do not vary by visitor, currency,
authentication, draft state, or checkout state:

- `/_next/static/*` and `robots.txt` keep their existing Cloudflare caching.
- `/_next/image` receives a conservative one-minute Cloudflare-only TTL.
- `/cms/api/media/file/*` keeps its existing four-hour edge lifetime and gains purge tags.
- `/sitemap.xml` and each localized `*sitemap.xml` receive a ten-minute
  Cloudflare-only TTL.

Do **not** add a site-wide Cache Everything rule. The localized landing/content HTML
server-renders the `nb1_currency` cookie, and some Payload copy resolves live price
tokens. Caching those responses by URL could serve the wrong currency or a stale price.
Checkout, Payload, API, preview, search, RSC/prefetch, redirects, authenticated requests,
and any other HTML remain outside this rollout.

## 1. Production environment

Create an API token restricted to the `nb1.com` zone with only `Zone > Cache Purge`
permission, then add these server-only values to `.env.prod`:

```ini
CLOUDFLARE_EDGE_CACHE_ENABLED=true
CLOUDFLARE_ZONE_ID=<nb1.com zone ID>
CLOUDFLARE_CACHE_PURGE_TOKEN=<cache-purge-only API token>
```

Never prefix the zone ID or token with `NEXT_PUBLIC_`. The production deployment guard
rejects an enabled rollout when either secret is missing. Staging cannot enable this
policy.

Payload's existing `afterChange`/`afterDelete` hooks call Cloudflare directly after a
published page/post change or a media change. There is no public inbound webhook to
secure. Page and post changes purge the `nb1-sitemaps` tag; media changes purge the
`nb1-media` tag, which covers both original files and `/_next/image` variants. Purge
failures are logged but never fail an editor's completed save. The short TTLs are the
fallback if Cloudflare is temporarily unavailable.

## 2. Cache Rules for `nb1.com`

Create the following two Cache Rules in Cloudflare. Both must use **Respect origin
cache-control / bypass when the origin header is absent**. Do not configure an Edge TTL
that overrides `private`, `no-store`, or an absent origin caching contract.

### Public sitemap and media responses

```text
(http.host eq "nb1.com"
 and http.request.method in {"GET" "HEAD"}
 and http.request.uri.query eq ""
 and (
   ends_with(http.request.uri.path, "sitemap.xml")
   or starts_with(http.request.uri.path, "/cms/api/media/file/")
 ))
```

- Cache eligibility: Eligible for cache.
- Edge TTL: Respect origin; bypass when the origin header is absent.
- Browser TTL: Respect origin.
- Cache key: the complete URL.

The application omits currency/country cookies from localized sitemap responses. A
non-success sitemap response does not include the Cloudflare caching contract, so the
"bypass when absent" setting is important.

### Next optimized images

```text
(http.host eq "nb1.com"
 and http.request.method in {"GET" "HEAD"}
 and http.request.uri.path eq "/_next/image")
```

- Cache eligibility: Eligible for cache.
- Edge TTL: Respect origin; bypass when the origin header is absent.
- Browser TTL: Respect origin.
- Keep **all** query parameters in the cache key (`url`, `w`, and `q` are required).
- Enable Cache Deception Armor.
- **Mandatory before enabling eligibility:** configure the Cache Rule's `Vary` setting
  with default `bypass`, then normalize `accept` with the media types `image/avif`,
  `image/webp`, `image/*`, and `*/*`. Next returns `Vary: Accept`; without this setting,
  Cloudflare can store one image format under a URL-only key and send it to an
  incompatible browser.

The equivalent API fragment is:

```json
{
  "vary": {
    "default": { "action": "bypass" },
    "headers": {
      "accept": {
        "action": "normalize",
        "media_types": ["image/avif", "image/webp", "image/*", "*/*"]
      }
    }
  }
}
```

If the Cloudflare rule editor does not expose this `Vary` setting, leave the
`/_next/image` rule disabled and roll out only sitemaps/media.

These narrow allowlists are the safety boundary. No HTML eligibility rule is required,
and none should be added in this tranche.

## 3. Rollout and verification

1. Add the production environment values while leaving the Cloudflare Cache Rules off.
2. Deploy this application change. Confirm the origin now returns
   `Cloudflare-CDN-Cache-Control` and `Cache-Tag` for the allowlisted paths only.
3. Enable the sitemap/media rule. Enable the optimized-image rule only when its mandatory
   `Vary` configuration is part of the same saved rule.
4. Existing media objects predate the `nb1-media` response tag. Wait out their current
   four-hour TTL before relying on tag purges; a tag purge cannot match an older untagged
   object. Future Payload updates use the narrow tags automatically.
5. Request each test URL twice and inspect `CF-Cache-Status`: the first request should be
   `MISS` and the second should become `HIT` (a regional cold cache can produce another
   initial `MISS`).
6. Publish a test page/post or update a test media item. Its tagged response should return
   to `MISS`, then `HIT` on the next request.
7. Recheck `/en`, a pricing-bearing content page, and the full checkout funnel. They must
   remain `DYNAMIC`/`BYPASS`, retain their private/no-store contract, and show the correct
   currency and live price for each test cookie.
8. Use one known JPEG/PNG source with the exact commands below. The WebP-capable and
   fallback requests must each have an independent `MISS` → `HIT` sequence. Disable this
   rule immediately if the formats or cache sequences mix.

Useful read-only checks:

```sh
curl -sSI https://nb1.com/en
curl -sSI https://nb1.com/en/order-details
curl -sSI https://nb1.com/sitemap.xml

# Replace known-test-image.jpg with a real Payload JPEG/PNG before running.
NB1_IMAGE_URL='https://nb1.com/_next/image?url=%2Fcms%2Fapi%2Fmedia%2Ffile%2Fknown-test-image.jpg&w=640&q=75'
curl -sS -D - -o /dev/null -H 'Accept: image/webp,image/*,*/*' "$NB1_IMAGE_URL" # MISS, image/webp
curl -sS -D - -o /dev/null -H 'Accept: image/webp,image/*,*/*' "$NB1_IMAGE_URL" # HIT, image/webp
curl -sS -D - -o /dev/null -H 'Accept: image/jpeg,image/png,*/*' "$NB1_IMAGE_URL" # MISS, original type
curl -sS -D - -o /dev/null -H 'Accept: image/jpeg,image/png,*/*' "$NB1_IMAGE_URL" # HIT, original type
```

Do not call this rollout complete until the two dynamic HTML checks still show no edge
cache hit and the price/currency/checkout smoke tests pass.

Cloudflare references: [Cache Rule settings](https://developers.cloudflare.com/cache/how-to/cache-rules/settings/),
[`Vary` behavior](https://developers.cloudflare.com/cache/concepts/vary/), and
[purge by cache tag](https://developers.cloudflare.com/cache/how-to/purge-cache/purge-by-tags/).
