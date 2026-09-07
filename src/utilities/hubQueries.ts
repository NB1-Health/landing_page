import configPromise from '@payload-config'
import { getPayload, type Payload, type Where } from 'payload'
import { unstable_cache } from 'next/cache'

import { appLocales, type AppLocale } from '@/i18n/config'

export type HubKey = 'microbiome' | 'research' | 'lexicon'

export type Hub = {
  id: number | string
  key: HubKey
  title: string
  slug: string
  intro: string | null
  metaTitle: string | null
  metaDescription: string | null
  header: { id: string | null; hide: boolean }
  footer: { id: string | null; hide: boolean }
  /** Every locale that has a slug for this hub, for the hreflang cluster. */
  slugsByLocale: Partial<Record<AppLocale, string>>
}

function chromeId(value: unknown): string | null {
  if (typeof value === 'number' || typeof value === 'string') return String(value)
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id
    if (typeof id === 'number' || typeof id === 'string') return String(id)
  }
  return null
}

function clean(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readSlugsByLocale(raw: unknown): Partial<Record<AppLocale, string>> {
  const slugs: Partial<Record<AppLocale, string>> = {}
  if (!raw || typeof raw !== 'object') return slugs

  for (const locale of appLocales) {
    const value = (raw as Record<string, unknown>)[locale]
    if (typeof value === 'string' && value.trim()) slugs[locale] = value.trim()
  }
  return slugs
}

/**
 * One hub, in one locale, however it was looked up.
 *
 * Two reads, not one. The locale-scoped read gives the rendered content; the
 * `locale: 'all'` read gives every locale's slug, which the hreflang cluster
 * needs and a locale-scoped read cannot provide. §6 requires that cluster to be
 * generated from the locale relationships rather than by swapping the path
 * segment — an hreflang pointing at a page that does not exist "is not ignored
 * in isolation, it can invalidate the whole cluster".
 */
async function fetchHub(locale: AppLocale, where: Where): Promise<Hub | null> {
  const payload: Payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'hubs',
    depth: 0,
    limit: 1,
    locale,
    // A hub whose slug is only filled in English must not resolve under /de via
    // Payload's content fallback — that would serve /de/microbiome as a
    // duplicate of the English URL.
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    where,
  })

  // `as unknown as` rather than a direct assertion: now that the collection is
  // registered, payload-types gives these docs a real generated type, and TS
  // refuses a direct cast to an index-signature record. The reads below are all
  // guarded, so the loose shape is deliberate — this function's job is to turn an
  // untrusted document into a checked `Hub`.
  const doc = result.docs[0] as unknown as Record<string, unknown> | undefined
  if (!doc) return null

  const key = doc.key
  const title = clean(doc.title)
  const slug = clean(doc.slug)

  // No slug or no title in this locale means no URL and no heading. 404 is a
  // better answer than a page with an empty <h1>.
  if (typeof key !== 'string' || !title || !slug) return null

  const allLocales = await payload.findByID({
    collection: 'hubs',
    id: doc.id as number | string,
    depth: 0,
    disableErrors: true,
    locale: 'all',
    overrideAccess: false,
  })

  return {
    id: doc.id as number | string,
    key: key as HubKey,
    title,
    slug,
    intro: clean(doc.intro),
    metaTitle: clean(doc.metaTitle),
    metaDescription: clean(doc.metaDescription),
    header: { id: chromeId(doc.header), hide: doc.hideHeader === true },
    footer: { id: chromeId(doc.footer), hide: doc.hideFooter === true },
    slugsByLocale: readSlugsByLocale((allLocales as unknown as { slug?: unknown } | null)?.slug),
  }
}

/**
 * Cached hub lookup by URL segment.
 *
 * The route this renders in is `force-dynamic` — Pages are request-rendered for
 * currency-sensitive copy — so without this every request would run two queries
 * to draw a page whose content changes a few times a year. Same shape as
 * `getCachedHeader` and `getCachedGlobal`; `revalidateHub` busts the tag on save.
 *
 * Asked about a slug that is NOT a hub it returns null, and caches that too,
 * which is what makes it cheap to ask on every page request.
 */
export const getCachedHubBySlug = (locale: AppLocale, slug: string) =>
  unstable_cache(async () => fetchHub(locale, { slug: { equals: slug } }), ['hub', locale, slug], {
    tags: ['hubs', `hub_slug_${locale}_${slug}`],
  })

/** Cached lookup by the stable `key`, for code that wants "the Research hub". */
export const getCachedHubByKey = (locale: AppLocale, key: HubKey) =>
  unstable_cache(
    async () => fetchHub(locale, { key: { equals: key } }),
    ['hub-key', locale, key],
    { tags: ['hubs', `hub_key_${key}`] },
  )

/** Just enough of a hub to render a link to it. */
export type HubLink = {
  key: HubKey
  title: string
  /** Locale-prefixed and ready to use as an href. */
  path: string
}

/**
 * Presentation order.
 *
 * The collection has no sort field, and `updatedAt` would let an editor
 * reshuffle the footer by fixing a typo. This is the order §4 lists them in, and
 * it is the same in every locale.
 */
const HUB_ORDER: readonly HubKey[] = ['microbiome', 'research', 'lexicon']

async function fetchHubLinks(locale: AppLocale): Promise<HubLink[]> {
  const payload: Payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'hubs',
    depth: 0,
    limit: 0,
    locale,
    // Same rule as everywhere else: no slug in this locale means no URL in this
    // locale. Better to render two hub links than three, one of which 404s.
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    select: { key: true, title: true, slug: true },
  })

  const byKey = new Map<string, HubLink>()

  for (const doc of result.docs as unknown as Record<string, unknown>[]) {
    const key = doc.key
    const title = clean(doc.title)
    const slug = clean(doc.slug)
    if (typeof key !== 'string' || !title || !slug) continue
    byKey.set(key, { key: key as HubKey, title, path: `/${locale}/${slug}` })
  }

  return HUB_ORDER.map((key) => byKey.get(key)).filter((hub): hub is HubLink => Boolean(hub))
}

/**
 * The three hubs as links, in fixed order, for the footer and the Journal index.
 *
 * SEO-007 §11.0 calls the footer block "the single most important item in this
 * list" — direct, always-rendered links to Journal, Microbiome, Research and
 * Lexicon, because the Journal otherwise sits behind two hovers and nothing
 * points at the hubs at all.
 *
 * Generated rather than an editor-filled array of URLs. The slugs are localized
 * and already live in the collection; asking an editor to retype `/de/mikrobiom`
 * into a footer field in each of eight locales is eight chances to typo a URL and
 * no mechanism to notice when a slug changes. Designer brief §4 makes the same
 * point about generated components generally.
 *
 * Tagged `hubs`, which `revalidateHub` already busts, so a renamed hub reaches
 * every footer on the site without a hook of its own.
 */
export const getCachedHubLinks = (locale: AppLocale) =>
  unstable_cache(async () => fetchHubLinks(locale), ['hub-links', locale], {
    tags: ['hubs', `hub-links-${locale}`],
  })
