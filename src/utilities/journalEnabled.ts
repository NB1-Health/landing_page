import { appLocales, type AppLocale } from '@/i18n/config'

/**
 * The Journal on/off switch, and which markets it exists in.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  TWO CONSTANTS BELOW.  JOURNAL_ENABLED = false takes the content platform │
 * │  off the site entirely.  JOURNAL_LOCALES lists the markets it exists in.  │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * ## Adding a market
 *
 * Add its prefix to `JOURNAL_LOCALES` and deploy. That is the whole job — the
 * routes, the navigation, the sitemaps and the hreflang cluster all read this
 * list, so nothing else has to be remembered. Removing a prefix takes the market
 * back out just as cleanly.
 *
 * Nothing is deleted either way and no configuration changes. The collections,
 * the fields, the routes and every row in the database stay exactly as they are,
 * and the admin keeps working in every locale — editors can translate a market
 * before it is switched on, and the day it goes in this list the content is
 * already there. Only whether the PUBLIC site admits to it changes.
 *
 * ## What a locale outside the list does
 *
 * It 404s. `/fr/journal`, `/fr/journal/{slug}`, the hubs and everything under
 * them, the lexicon search index — all of it. The Journal branch does not appear
 * in Discover and the footer has no Journal or hub links, so nothing links to a
 * dead URL in the first place. The sitemaps do not list it and no hreflang
 * cluster names it, so a crawler is never told the market exists.
 *
 * A 404 rather than an empty page on purpose: an empty Journal index in seven
 * markets is seven near-identical thin pages, each self-canonical and each
 * claiming to be a translation of the others.
 *
 * ## One value for every deployment
 *
 * These are constants, so they cannot differ between staging and production.
 * Setting `JOURNAL_ENABLED = false` and merging to `main` also hides the Journal
 * on staging, because staging deploys from `main`. And once it is `true` on
 * `main`, the next promotion of `main` to `prod` carries `true` with it —
 * flipping it back before a promotion is a manual step.
 *
 * ## Where the switch is applied
 *
 * Mostly one place. `hubQueries` is the choke point: with no hub, the hub pages,
 * every hub document (pillars, lexicon terms, scientific articles), the lexicon
 * category pages, the Discover branch, the footer hub links and the hub strip all
 * disappear down paths that already existed for a partially translated locale.
 * That behaviour was built and tested; this reuses it rather than adding a second
 * way to be absent.
 *
 * The rest carries its own guard because it does not depend on a hub: the three
 * `/journal` routes, the footer's fixed Journal link, the lexicon search index,
 * the legacy `/posts` redirect, and the sitemaps.
 *
 * `grep -rn "isJournalLocale\\|isJournalEnabled" src` lists every one of them.
 */
const JOURNAL_ENABLED = false

/**
 * The markets the Journal is live in. Add a prefix to switch a market on.
 *
 * Typed as `AppLocale[]` rather than a narrow tuple so adding a prefix is a
 * one-word edit that cannot fail to typecheck for a reason unrelated to the
 * change. An unknown prefix is dropped by `journalLocales` below rather than
 * silently creating a locale the rest of the site does not have.
 */
const JOURNAL_LOCALES: AppLocale[] = ['en', 'de']

export function isJournalEnabled(): boolean {
  return JOURNAL_ENABLED
}

/**
 * The live Journal markets, in the site's own locale order.
 *
 * Filtered through `appLocales` so this can never name a locale the site does
 * not have, and so the order is the site's rather than whatever order someone
 * typed the list in — the hreflang cluster and the footer both read it.
 *
 * Empty when the Journal is switched off, which is what makes `JOURNAL_ENABLED`
 * the master switch: every consumer reads this or `isJournalLocale`, so one
 * `false` empties them all.
 */
export const journalLocales: AppLocale[] = JOURNAL_ENABLED
  ? appLocales.filter((locale) => JOURNAL_LOCALES.includes(locale))
  : []

/** Whether the Journal exists in this market. The check every route makes. */
export function isJournalLocale(locale: AppLocale): boolean {
  return journalLocales.includes(locale)
}
