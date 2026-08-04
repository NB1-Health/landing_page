# Payload page publishing

## Outcome

Payload Pages can be edited and published without a code deploy or a database copy. Drafts and version history remain native Payload features; the existing Next renderer reads the same Payload database and invalidates only explicit public paths for the affected Page after a publication change.

This does not move Content Flow pages, change the React renderer, or introduce a content-promotion service.

## Required rollout configuration

The application code needs these existing deployment variables:

| Variable | Requirement |
| --- | --- |
| `DATABASE_URL` | Production Payload and the production public app must use the same production database. |
| `PAYLOAD_SECRET` | Existing Payload authentication secret. |
| `PREVIEW_SECRET` | At least 32 random characters; generate with `openssl rand -hex 32`. Rotate it when this change is deployed because older preview URLs contained the raw value. |
| `NEXT_PUBLIC_SERVER_URL` | Canonical origin of the same deployment, for example `https://nb1.com`. |

No revalidation URL or revalidation secret is required. Payload and the Next public app run in the same process, so the publication hook calls Next's cache APIs directly. There is no public revalidation endpoint, arbitrary path input, or global cache purge.

One external deploy-script change is a prerequisite and is intentionally not made in this repository: production deploys must stop copying the entire staging database over production. The current documented deploy process would otherwise erase production CMS edits on the next code deploy. Keep schema migrations in the code deploy, but let production content remain in the production database.

## Editor flow

1. Open a Page and select the locale to edit.
2. Edit normally. Autosave and **Save draft** create Payload versions without changing the public page.
3. Use **Preview** while logged into Payload. The link is valid for five minutes, contains an HMAC signature rather than the secret, and can resolve only the selected locale plus a known Pages/Posts slug. Every draft render rechecks the Payload session, so a retained Next draft cookie is not authorization after logout.
4. Use the primary **Publish in _locale_** button. The default is deliberately the active locale. **Publish all locales** remains in the button menu for an intentional coordinated release.
5. Repeat review and publication independently for each locale. Publishing English does not wait for or expose an unfinished German, French, or other locale.

Payload's `defaultLocalePublishOption` is a global localization setting, so the same active-locale primary-button behavior also appears on other localized, versioned collections such as Posts. This branch does not otherwise change their schema or publication hooks. Editors can still choose **Publish all locales** from the menu.

A locale becomes addressable when its own localized slug has reached the published Page. Public Page reads, static params, metadata, hreflang, cross-locale redirects, and the page sitemap use no fallback locale. A never-published locale is omitted. A locale with a newer draft continues serving its last published values until that locale is published again.

The Page whose published English slug is `home` or `home-page` is the stable homepage identity. It is always canonical at `/{locale}` even if another locale translates its stored slug (for example `startseite`): preview, redirects, static params, hreflang, sitemap output, and cache targets all normalize that document to the locale root.

Payload's native **Unpublish** action is document-wide, not per-locale: it removes every locale of that Page from public reads. Restoring a published entry from **Versions** is also a whole-document snapshot rollback and therefore revalidates every locale represented by that snapshot. To correct only one locale, restore/copy the desired text into that locale's draft and use **Publish in _locale_**.

## Cache behavior

- Draft/autosave operations do not invalidate public routes.
- Any Page publication invalidates the previous and current explicit paths plus page-sitemap tags for every published locale of that Page. Payload also writes shared Page fields and `updatedAt` during a locale publication, so page-scoped all-locale invalidation prevents stale shared layout while remaining much narrower than a site-wide purge.
- **Publish all**, document-wide unpublish, delete, and whole-version restore use the same page-scoped explicit path set.
- Route targets are derived only from the configured locale allow-list and normalized Payload slug format. Caller-supplied paths are never accepted.
- Cache failures are logged without failing a successful database publication. The existing 10-minute ISR interval is the recovery backstop.

## Verification

Fast contract tests:

```sh
npx vitest run --config ./vitest.config.mts \
  tests/int/pagePublication.int.spec.ts \
  tests/int/pageRevalidationResilience.int.spec.ts
```

The database lifecycle test runs only when `DATABASE_URL` points to a local database whose name contains `test` or `publish`. It pushes the current schema only into that isolated test database:

```sh
DATABASE_URL=postgresql://localhost:55441/landing_page_publish_test \
PAYLOAD_SECRET=... PREVIEW_SECRET=... NEXT_PUBLIC_SERVER_URL=http://localhost:3000 \
npx vitest run --config ./vitest.config.mts \
  tests/int/payloadPublishingLifecycle.int.spec.ts
```

It covers new-draft invisibility, authenticated exact-draft reads, unauthenticated draft rejection, publish updates, rollback, global unpublish/restore, and independent English/German publication. Separate route tests also verify that a retained Next draft cookie cannot authorize reads after the Payload session is gone.
