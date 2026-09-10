/**
 * The Journal on/off switch.
 *
 * ┌───────────────────────────────────────────────────────────────────────────┐
 * │  FLIP THE CONSTANT BELOW.  false = the Journal does not exist on the site.│
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * `false` takes the content platform off the public site: the Journal index, the
 * hubs, every pillar, the whole lexicon and the research section all 404, the
 * Discover menu has no Journal branch, the footer has no Journal or hub links,
 * and the sitemap index stops listing its five children.
 *
 * Nothing is deleted and no configuration changes. The collections, the fields,
 * the routes and every row in the database stay exactly as they are, and the
 * admin keeps working — editors can still fill things in behind the switch. Only
 * whether the public site admits to any of it changes.
 *
 * ## One value for every deployment
 *
 * This is a constant, so it cannot differ between staging and production. Two
 * consequences worth holding in mind:
 *
 * 1. Setting it `false` and merging to `main` also hides the Journal on STAGING,
 *    because staging deploys from `main` automatically.
 *
 * 2. Once it is `true` on `main` again, the next promotion of `main` to `prod`
 *    carries `true` with it and switches the Journal on in production. Nothing
 *    here stops that — flipping it back before a promotion is a manual step.
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
 * `grep -rn "isJournalEnabled" src` lists every one of them.
 */
const JOURNAL_ENABLED = true

export function isJournalEnabled(): boolean {
  return JOURNAL_ENABLED
}
