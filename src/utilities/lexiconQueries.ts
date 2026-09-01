import configPromise from "@payload-config";
import { getPayload, type Payload } from "payload";
import { unstable_cache } from "next/cache";

import { appLocales, type AppLocale } from "@/i18n/config";
import type { TermRow } from "@/utilities/lexiconGrouping";

/**
 * Reads for the lexicon browse pages.
 *
 * Separate from `hubDocumentQueries` because the shape is genuinely different:
 * those return cards for a hub listing, these return every row in a category with
 * its definition sentence, unpaginated, because the brief forbids pagination and
 * lazy-loading on the category page — "one scrolling page".
 */

/**
 * Every cache below carries a TTL as well as tags, and the TTL is the important
 * half.
 *
 * Tags give instant updates when a document is saved through a Next request —
 * that is the happy path and it works. But the content pipeline that fills this
 * collection runs as a SCRIPT, outside any request: `revalidateTag` throws there,
 * and the seed sets `disableRevalidate: true` besides. Without a TTL an
 * `unstable_cache` entry never expires, so a pipeline run leaves every browse page
 * serving the previous corpus indefinitely, with nothing to indicate it.
 *
 * That is exactly what happened seeding 436 terms: the database had them, the
 * category page kept reporting "1 term", and nothing was wrong with either.
 *
 * An hour is the bound on how long a missed invalidation can hide. Editorial
 * changes still appear immediately via the tags; this only decides how bad the
 * worst case is.
 */
const CACHE_TTL_SECONDS = 3600;

export type LexiconCategory = {
  id: number | string;
  /** The stable identity and the URL segment. */
  key: string;
  /** Localized display name. */
  title: string;
  /**
   * The URL segment: the localized slug. NOT `key`.
   *
   * `costomSlugField({ from: 'title' })` auto-generates this, so it is never
   * empty in a locale that has a title — which is why the old `slug ?? key`
   * fallback never fired, and why two URLs answered for every category: one via
   * the slug and one via the key.
   */
  segment: string;
  /**
   * The slug in every locale, for the hreflang cluster and the language switcher.
   *
   * Read the same way `fetchHub` reads hub slugs — a second `locale: 'all'`
   * lookup — because a per-locale URL cannot be composed from the one locale the
   * page was rendered in. Without this the cluster collapsed to a single entry
   * and the switcher had nowhere to send anyone.
   */
  slugsByLocale: Partial<Record<AppLocale, string>>;
  intro: string | null;
  exampleTerms: string[];
  noindex: boolean;
};

function clean(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function slugsFrom(raw: unknown): Partial<Record<AppLocale, string>> {
  const slugs: Partial<Record<AppLocale, string>> = {};
  if (!raw || typeof raw !== "object") return slugs;
  for (const locale of appLocales) {
    const value = (raw as Record<string, unknown>)[locale];
    if (typeof value === "string" && value.trim()) slugs[locale] = value.trim();
  }
  return slugs;
}

function toCategory(
  doc: Record<string, unknown>,
  slugsByLocale: Partial<Record<AppLocale, string>> = {},
): LexiconCategory | null {
  const key = clean(doc.key);
  const title = clean(doc.title);
  const slug = clean(doc.slug);

  // No slug in this locale means no URL in this locale — the same rule hubs and
  // documents already follow. `key` is identity, not an address.
  if (!key || !title || !slug) return null;

  return {
    id: doc.id as number | string,
    key,
    title,
    segment: slug,
    slugsByLocale,
    intro: clean(doc.intro),
    exampleTerms: (clean(doc.exampleTerms) ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    noindex: doc.noindex === true,
  };
}

/**
 * One category, by the localized slug in the URL.
 *
 * ONE address per category per locale: `/en/lexicon/topics/bacterial-taxa`,
 * `/de/glossar/themen/bakterielle-taxa`. This used to match `key` as well, on the
 * theory that the slug was an optional override — but `costomSlugField({ from:
 * 'title' })` generates it automatically, so it was never absent and the fallback
 * never fired. What the extra match actually did was give every category page a
 * second, non-canonical URL that returned 200.
 */
async function fetchCategory(
  locale: AppLocale,
  segment: string,
): Promise<LexiconCategory | null> {
  const payload: Payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "lexicon-categories",
    depth: 0,
    limit: 1,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    where: {
      and: [
        { _status: { equals: "published" } },
        // Slug ONLY. Matching `key` as well gave every category page a second
        // address — `/topics/taxa` alongside `/topics/bacterial-taxa`, both 200,
        // one of them not the canonical. That is the duplicate-content problem
        // the flat term URL exists to avoid, arriving by a different door.
        { slug: { equals: segment } },
      ],
    },
  });

  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined;
  if (!doc) return null;

  // Second read for the per-locale slugs. Same two-read shape as `fetchHub`, and
  // for the same reason: the locale-scoped read gives this page's content, the
  // `locale: 'all'` read gives the URLs of its siblings in other languages.
  const allLocales = await payload.findByID({
    collection: "lexicon-categories",
    id: doc.id as number | string,
    depth: 0,
    disableErrors: true,
    locale: "all",
    overrideAccess: false,
    // One column. Without this the read pulls the whole document — including the
    // intro and every localized field — to look at the slug.
    select: { slug: true },
  });

  return toCategory(
    doc,
    slugsFrom((allLocales as unknown as { slug?: unknown } | null)?.slug),
  );
}

/**
 * `-v2` in the cache key is deliberate and load-bearing.
 *
 * `LexiconCategory` gained `slugsByLocale` and `segment` stopped falling back to
 * `key`. An `unstable_cache` entry written before that deserialises into the new
 * type without the new field — TypeScript cannot see it, because the compiler
 * checks the shape we wrote, not the shape sitting in `.next/cache`. The first
 * symptom was a 500 reading `[locale]` off undefined; the second was a language
 * switcher with nothing in it.
 *
 * Bumping the key retires every old entry at once, with no cache clear to
 * remember. Bump it again the next time this shape changes.
 */
export const getCachedLexiconCategory = (locale: AppLocale, segment: string) =>
  unstable_cache(
    async () => fetchCategory(locale, segment),
    ["lexicon-category-v2", locale, segment],
    {
      tags: ["lexicon-categories", `lexicon-category_${locale}_${segment}`],
      revalidate: CACHE_TTL_SECONDS,
    },
  );

/** Every published category, for the switcher and the index grid. */
async function fetchCategories(locale: AppLocale): Promise<LexiconCategory[]> {
  const payload: Payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "lexicon-categories",
    depth: 0,
    limit: 100,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    sort: "title",
    where: { _status: { equals: "published" } },
  });

  return result.docs
    .map((doc) => toCategory(doc as unknown as Record<string, unknown>))
    .filter((category): category is LexiconCategory => category !== null);
}

/**
 * Also `-v2`: a stale entry here would carry `segment` resolved from `key`, so
 * every switcher pill and index card would link at `/topics/taxa` — a URL that no
 * longer exists.
 */
export const getCachedLexiconCategories = (locale: AppLocale) =>
  unstable_cache(
    async () => fetchCategories(locale),
    ["lexicon-categories-v2", locale],
    {
      tags: ["lexicon-categories"],
      revalidate: CACHE_TTL_SECONDS,
    },
  );

/**
 * Every term in one category, unpaginated.
 *
 * `limit: 0` — Payload's "no limit" — and `pagination: false`. That is deliberate
 * and it is the riskiest line in this file, so: the brief specifies one scrolling
 * page with no pagination and no lazy-loading at 436 entries, and the filter has
 * to match against the definition of every row, which means every row has to be
 * on the page. A cap here would silently truncate the largest category, and a
 * page that claims "436 terms" in its own result count while rendering 200 is
 * worse than a slow page.
 *
 * `select` is what keeps that affordable: five columns, no rich text, no
 * relationships. The three section bodies are the expensive part of this
 * collection and no browse page needs a word of them.
 */
async function fetchCategoryTerms({
  locale,
  categoryId,
  hubSlug,
}: {
  locale: AppLocale;
  categoryId: number | string;
  hubSlug: string;
}): Promise<TermRow[]> {
  const payload: Payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "lexicon-terms",
    depth: 0,
    limit: 0,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
      slug: true,
      definition: true,
      italicName: true,
    },
    sort: "title",
    where: {
      and: [
        { _status: { equals: "published" } },
        { category: { equals: categoryId } },
      ],
    },
  });

  return result.docs
    .map((doc): TermRow | null => {
      const record = doc as unknown as Record<string, unknown>;
      const title = clean(record.title);
      const slug = clean(record.slug);

      // No title or no slug in this locale means no row: the definition alone is
      // not a link, and a row that cannot be clicked on a browse page is a dead
      // end rather than an entry.
      if (!title || !slug) return null;

      return {
        id: String(record.id),
        title,
        href: `/${locale}/${hubSlug}/${slug}`,
        definition: clean(record.definition) ?? "",
        italic: record.italicName === true,
      };
    })
    .filter((row): row is TermRow => row !== null);
}

/**
 * Cached per category and locale, tagged so publishing a term busts the browse
 * page that lists it as well as the term's own URL.
 */
export const getCachedCategoryTerms = (args: {
  locale: AppLocale;
  categoryId: number | string;
  hubSlug: string;
}) =>
  unstable_cache(
    async () => fetchCategoryTerms(args),
    [
      "lexicon-category-terms",
      args.locale,
      String(args.categoryId),
      args.hubSlug,
    ],
    {
      tags: ["lexicon-terms", `lexicon-category-terms_${args.categoryId}`],
      revalidate: CACHE_TTL_SECONDS,
    },
  );

/** How many terms each category holds, for the switcher and the index cards. */
async function fetchCategoryCounts(
  locale: AppLocale,
): Promise<Record<string, number>> {
  const payload: Payload = await getPayload({ config: configPromise });
  const categories = await fetchCategories(locale);
  const counts: Record<string, number> = {};

  // One count query per category rather than reading every term and tallying:
  // `limit: 1` with pagination on returns `totalDocs` without transferring 2,400
  // rows, and ten cheap queries beat one expensive one at this volume.
  await Promise.all(
    categories.map(async (category) => {
      const result = await payload.find({
        collection: "lexicon-terms",
        depth: 0,
        limit: 1,
        locale,
        fallbackLocale: false,
        overrideAccess: false,
        select: { title: true },
        where: {
          and: [
            { _status: { equals: "published" } },
            { category: { equals: category.id } },
          ],
        },
      });
      counts[category.key] = result.totalDocs;
    }),
  );

  return counts;
}

export const getCachedCategoryCounts = (locale: AppLocale) =>
  unstable_cache(
    async () => fetchCategoryCounts(locale),
    ["lexicon-category-counts", locale],
    {
      tags: ["lexicon-terms", "lexicon-categories"],
      revalidate: CACHE_TTL_SECONDS,
    },
  );

/**
 * Every published term in the lexicon, as a search index.
 *
 * Deliberately terse keys. At 2,400 terms the field names are repeated 2,400
 * times, and `title`/`definition` rather than `t`/`d` adds roughly 30KB to a
 * payload whose whole justification is that it stays small enough to fetch in one
 * go. The client-side type re-expands them immediately.
 *
 * This is the ONE read in the lexicon that crosses every category, which is why
 * it lives behind a lazily-fetched endpoint rather than in a page: the index page
 * renders ten category cards, and a reader who never uses the search field should
 * never pay for it.
 */
export type TermSearchEntry = {
  /** Title. */
  t: string;
  /** Href, locale-prefixed and ready to use. */
  h: string;
  /** Definition sentence. */
  d: string;
  /** Italicise the name. `1` or absent — a boolean costs five more bytes. */
  i?: 1;
};

async function fetchSearchIndex({
  locale,
  hubSlug,
}: {
  locale: AppLocale;
  hubSlug: string;
}): Promise<TermSearchEntry[]> {
  const payload: Payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "lexicon-terms",
    depth: 0,
    limit: 0,
    locale,
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    select: {
      title: true,
      slug: true,
      definition: true,
      italicName: true,
      noindex: true,
    },
    sort: "title",
    where: { _status: { equals: "published" } },
  });

  return result.docs
    .map((doc): TermSearchEntry | null => {
      const record = doc as unknown as Record<string, unknown>;
      const title = clean(record.title);
      const slug = clean(record.slug);
      if (!title || !slug) return null;

      // Filtered here rather than in `where`, matching the sitemap routes. A SQL
      // `noindex != true` evaluates to NULL for a row where the column is NULL,
      // which is not TRUE — so the predicate would silently drop every term whose
      // checkbox was never touched, which is most of them on a pipeline-filled
      // collection. `=== true` in JavaScript has no such hole.
      //
      // A term hidden from crawlers is hidden from our own search too: surfacing
      // it here is the same page reached by another route.
      if (record.noindex === true) return null;

      return {
        t: title,
        h: `/${locale}/${hubSlug}/${slug}`,
        d: clean(record.definition) ?? "",
        ...(record.italicName === true ? { i: 1 as const } : {}),
      };
    })
    .filter((entry): entry is TermSearchEntry => entry !== null);
}

export const getCachedSearchIndex = (args: {
  locale: AppLocale;
  hubSlug: string;
}) =>
  unstable_cache(
    async () => fetchSearchIndex(args),
    ["lexicon-search-index", args.locale, args.hubSlug],
    {
      tags: ["lexicon-terms", `lexicon-search-index_${args.locale}`],
      revalidate: CACHE_TTL_SECONDS,
    },
  );

/**
 * Three example term names per category, for the index cards.
 *
 * The editor's `exampleTerms` wins when set. This fills the gap otherwise,
 * because the brief wants three names on every card and 13 categories × 8 locales
 * is 104 fields nobody will maintain — the same argument that keeps the term's
 * disclaimer out of the term.
 *
 * Newest first rather than alphabetical: the point of the examples is to show
 * what the category contains, and the three most recently published are more
 * representative of a growing corpus than the three that happen to start with A.
 */
async function fetchExampleTerms(
  locale: AppLocale,
  categories: LexiconCategory[],
): Promise<Record<string, string[]>> {
  const payload: Payload = await getPayload({ config: configPromise });
  const examples: Record<string, string[]> = {};

  await Promise.all(
    categories.map(async (category) => {
      if (category.exampleTerms.length >= 3) {
        examples[category.key] = category.exampleTerms.slice(0, 3);
        return;
      }

      const result = await payload.find({
        collection: "lexicon-terms",
        depth: 0,
        limit: 3,
        locale,
        fallbackLocale: false,
        overrideAccess: false,
        select: { title: true },
        sort: "-publishedAt",
        where: {
          and: [
            { _status: { equals: "published" } },
            { category: { equals: category.id } },
          ],
        },
      });

      const filled = result.docs
        .map((doc) => clean((doc as unknown as Record<string, unknown>).title))
        .filter((title): title is string => Boolean(title));

      // An editor's partial list is kept and topped up, not discarded — they
      // named those terms on purpose.
      examples[category.key] = [
        ...category.exampleTerms,
        ...filled.filter((title) => !category.exampleTerms.includes(title)),
      ].slice(0, 3);
    }),
  );

  return examples;
}

export const getCachedExampleTerms = (
  locale: AppLocale,
  categories: LexiconCategory[],
) =>
  unstable_cache(
    async () => fetchExampleTerms(locale, categories),
    [
      "lexicon-example-terms",
      locale,
      categories.map((category) => category.key).join(","),
    ],
    {
      tags: ["lexicon-terms", "lexicon-categories"],
      revalidate: CACHE_TTL_SECONDS,
    },
  );
