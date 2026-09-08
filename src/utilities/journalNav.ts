import configPromise from "@payload-config";
import { getPayload, type Payload } from "payload";
import { unstable_cache } from "next/cache";

import { getCachedHubLinks } from "@/utilities/hubQueries";
import { getDictionary } from "@/i18n/getDictionary";
import type { AppLocale } from "@/i18n/config";

/**
 * The Journal branch of the Discover menu, generated from the CMS.
 *
 * Discover ▾
 *   … four existing items, unchanged, on try.nb1.com
 *   ─────────
 *   Journal ▸                     ← this
 *     Overview
 *     Microbiome ▸
 *       Overview
 *       Gut Health … 10 pillars
 *     Research
 *     Lexicon
 *
 * GENERATED, not authored. Every href here is composed from localized slugs that
 * already live in the collections. Asking an editor to retype `/de/mikrobiom/
 * darmgesundheit` into a nav field, in each locale, is one chance to typo per row
 * and no mechanism to notice when a slug changes. §11.0 makes the same argument
 * for the footer, and this is the same data with one more level.
 *
 * It also means the nav cannot advertise a URL that does not exist:
 * `getCachedHubLinks` already drops a hub with no slug in this locale, and the
 * pillar query below drops a pillar with no slug or no title. A missing
 * translation shortens the menu rather than adding a 404 to it.
 *
 * ## Depth
 *
 * Three levels — Discover → Journal → Microbiome — and no further. Research and
 * Lexicon are leaves here even though pages exist beneath them, because nobody
 * browses 854 lexicon terms from a dropdown. The brief is explicit: the lexicon
 * index and category pages exist precisely so the narrowing happens on a page
 * rather than in a menu.
 */

export type JournalNavNode = {
  /** Display label, already localized. */
  label: string;
  /** Locale-prefixed href, ready to use. Never empty. */
  href: string;
  /** Present and non-empty only where a submenu should render. */
  children?: JournalNavNode[];
};

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

/**
 * A pillar's NAV label — the part of its title before the colon.
 *
 * Pillar titles are written for search and for the page's own H1: "Gut Health:
 * What It Means and What Actually Changes It", "Darmbakterien: Die Organismen,
 * die deine Verdauung steuern". Fifty-five characters is a headline, not a menu
 * row. Rendered raw, ten of them made the flyout panel 300px wide and 484px tall,
 * and pushed the third level 162px off the left of a 1024px screen.
 *
 * The brief's own tree shows the short form — "Gut Health", "Gut Flora" — and
 * every seeded title in both languages happens to put exactly that before a
 * colon, so the split reproduces the brief rather than approximating it.
 *
 * Deliberately a derivation, not a new `navLabel` field: ten pillars across
 * however many locales is a field nobody would keep in step with the title, and
 * the failure mode of a stale nav label is worse than a slightly long one.
 *
 * Falls back to the full title when there is no colon, or when the head is too
 * short to be a real name — "Q: ..." should not become "Q".
 */
export function navLabel(title: string): string {
  const head = title.split(":")[0]?.trim() ?? "";
  return head.length >= 3 && head.length < title.length ? head : title;
}

/**
 * The ten pillars as `{ label, href }`, in the collection's own order.
 *
 * `select` is what keeps this cheap enough to run on every page render behind a
 * cache: two columns, no rich text, no relationships. The hub slug is passed in
 * rather than joined per row — ten pillars against one hub lookup.
 */
async function fetchPillarLinks(
  locale: AppLocale,
  hubPath: string,
): Promise<JournalNavNode[]> {
  const payload: Payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "pillars",
    depth: 0,
    draft: false,
    limit: 0,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    select: { title: true, slug: true, noindex: true },
    sort: "title",
    where: { _status: { equals: "published" } },
  });

  return result.docs
    .map((doc): JournalNavNode | null => {
      const record = doc as unknown as Record<string, unknown>;

      // Filtered in JavaScript, not in `where`. In Postgres `noindex != true` is
      // NULL for a row where the column is NULL, which is not TRUE — so the
      // predicate would silently drop every pillar whose checkbox was never
      // touched. Same rule as the sitemaps.
      if (record.noindex === true) return null;

      const title = clean(record.title);
      const slug = clean(record.slug);

      // No title or no slug in this locale means no URL in this locale. A nav row
      // that 404s is worse than a shorter menu.
      if (!title || !slug) return null;

      return { label: navLabel(title), href: `${hubPath}/${slug}` };
    })
    .filter((node): node is JournalNavNode => node !== null);
}

/**
 * Assembles the tree. Pure — no database, no locale lookup — so the shape can be
 * tested against the cases that matter without seeding anything: no hubs at all,
 * Microbiome with no pillars, a pillar whose slug is missing in this locale.
 *
 * Those are exactly the states a partial translation produces, and each has a
 * specific right answer that is not "render it anyway".
 */
export function buildJournalNavTree({
  hubs,
  pillars,
  journalPath,
  labels,
}: {
  hubs: readonly { key: string; title: string; path: string }[];
  /** Already filtered to what has a URL in this locale. */
  pillars: readonly JournalNavNode[];
  journalPath: string;
  labels: { journal: string; overview: string };
}): JournalNavNode | null {
  // No hubs in this locale means the Journal branch would be a lone link to an
  // index listing nothing. The item is dropped entirely rather than rendered
  // empty — an arrow that opens a blank panel is worse than no arrow.
  if (hubs.length === 0) return null;

  const children: JournalNavNode[] = [
    // A link to the parent page itself, first.
    //
    // The brief writes these as "All Journal" and "All Microbiome topics". Using
    // "Overview" instead, because "All {name}" does not survive translation — the
    // German would be "Alle Journal", which is not German. The brief's intent is a
    // link to the parent, and "Übersicht" / "Aperçu" / "Overzicht" say that
    // correctly in every locale we ship.
    { label: labels.overview, href: journalPath },
  ];

  for (const hub of hubs) {
    if (hub.key === "microbiome") {
      children.push({
        label: hub.title,
        href: hub.path,
        // Only attach children when there are some. An empty array would render a
        // disclosure arrow that opens nothing.
        ...(pillars.length
          ? {
              children: [
                { label: labels.overview, href: hub.path },
                ...pillars,
              ],
            }
          : {}),
      });
      continue;
    }

    // Research and Lexicon are leaves. See the header comment on depth.
    children.push({ label: hub.title, href: hub.path });
  }

  return { label: labels.journal, href: journalPath, children };
}

async function fetchJournalNav(
  locale: AppLocale,
): Promise<JournalNavNode | null> {
  const dict = getDictionary(locale);
  const hubs = await getCachedHubLinks(locale)();
  const microbiome = hubs.find((hub) => hub.key === "microbiome");

  return buildJournalNavTree({
    hubs,
    pillars: microbiome ? await fetchPillarLinks(locale, microbiome.path) : [],
    journalPath: `/${locale}/journal`,
    labels: {
      journal: dict.journal.breadcrumbJournal,
      overview: dict.journal.navOverview,
    },
  });
}

/**
 * Tagged `hubs` and `pillars` so a renamed hub or a newly published pillar
 * reaches the header without a hook of its own.
 *
 * That was half true when written: `revalidateHub` busts `hubs`, but NOTHING
 * busted `pillars` — the old `revalidatePillar` only cleared `pillars-sitemap`.
 * Publishing a pillar therefore never reached this menu. `Pillars` now uses the
 * shared hook with both tags, so it does.
 *
 * `-v2` because `navLabel` changed what this function RETURNS, and no tag covers
 * "the code that built the cached value changed". Warm entries kept serving full
 * article titles into the nav after the shortening shipped. Bump it whenever the
 * shape or the derivation changes, not just when the data does.
 */
export const getCachedJournalNav = (locale: AppLocale) =>
  unstable_cache(
    async () => fetchJournalNav(locale),
    ["journal-nav-v2", locale],
    {
      tags: ["hubs", "pillars", `journal-nav-${locale}`],
      // TTL as well as tags — a pillar published by a script cannot bust a tag, and
      // without this the nav would keep the old set indefinitely. See the note in
      // `lexiconQueries`.
      revalidate: 3600,
    },
  );
