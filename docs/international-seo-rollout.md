# International SEO rollout

This change upgrades Payload to 3.82.1 and Next.js to the minimum compatible
15.4.11 patch. It does not include a Next.js major upgrade.

## Before deployment

1. Take a database backup.
2. Deploy to staging first. The deployment runs the complete migration chain,
   then the authenticated sitemap crawl.
3. In Payload, verify that Pages and Posts show an independent Draft/Published
   state for each locale. Publish and unpublish one non-English locale and
   confirm that the other locales remain live.
4. Review the migrated Page/Post availability matrix. Existing version history
   determines each locale's initial status, so do not assume every translation
   remains published.
5. Promote only after the staging crawl passes. Back up production immediately
   before its migration as well.

The crawl reads final-edge `robots.txt`, sitemap XML, response headers and rendered
metadata. Production must remain crawlable, must block `/cms`, and must not emit a
staging `X-Robots-Tag`; staging must retain the inverse containment policy. It also
fails if a reverse proxy serves the legacy HTML application for a sitemap URL.
Every indexable Page/Post must have a published English locale or a published custom
x-default; safe render-time suppression remains in place, but it blocks promotion.
`/en/our-plans` is the ticket's full-market deep-page regression fixture, so its
cluster must retain all ten entries unless that business requirement is changed.

Local environments need real or seeded CMS content. There is deliberately no
synthetic homepage fallback: serving substitute content would make an
unpublished locale look available to users and crawlers.

## Rollback

Restoring the pre-deployment database backup is the lossless rollback.

Do not deploy Payload 3.70 against the migrated database. If a schema rollback
is required instead:

1. Stay on Payload 3.82.1.
2. Temporarily disable `experimental.localizeStatus` and
   `versions.drafts.localizeStatus` for both Pages and Posts.
3. Run `npm run migrate:down` for the international SEO migration batch.
4. Verify the schema and application before deploying older code.

The migration refuses to start its destructive rollback while localized status
is enabled, preventing a partially reversed batch. Rolling status back collapses
independent locale state, so prefer the database backup.

## Deliberate scope

Availability-driven hreflang covers the indexable CMS collections already
represented in sitemaps: Pages and Posts. Search and pagination are noindex.
Products remain outside this slice until they have a defined localized content
and publication model.

The rare-exception controls support excluding a published locale and choosing a
published locale as x-default. Raw, manually entered alternate URLs remain
intentionally unsupported: they conflict with the ticket's prohibition on
hand-entered hreflang URLs and cannot guarantee reciprocal clusters.

The SEO follow-up clarified that the possible exception is `try.nb1.com`. If that
host remains paid/lead-generation only, it should be noindex and omitted from
sitemaps and hreflang, so no C2 override is needed. If it becomes intentionally
organic, add a separate cross-repository feature: an allowlisted external
relationship whose target is indexable and self-canonical, with the exact same
reciprocal cluster emitted and deployment-tested on both hosts. A one-sided URL
field in Payload is not sufficient.
