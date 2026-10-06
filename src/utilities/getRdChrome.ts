import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

import { isAppLocale, type AppLocale } from '@/i18n/config'
import type { RdFooter, RdHeader } from '@/payload-types'
import { getLocalizedPagePath } from '@/utilities/localizedPagePath'

/**
 * Fetch the redesign header / footer, by id or by default.
 *
 * A deliberate copy of the shape in `getHeaderFooter.ts` rather than a
 * generalisation of it: that file is on the path of every page on the live site,
 * and widening its types to cover two more collections would put the whole site
 * behind a change made for the redesign. Two collections, twenty lines, no risk.
 *
 * `depth: 2` matches the live header's, so the logo uploads come back populated
 * rather than as ids.
 *
 * WHY THE RETURN TYPE IS `unknown`, AND WHY THE CAST IS HERE.
 *
 * `collection` is a UNION of two slugs, and Payload resolves a document's type
 * from that slug — given a union it has no single collection to resolve against
 * and the result collapses to `never`. That is not visible here (nothing in this
 * file consumes the value) but it is fatal at the call site: `never` cannot be
 * spread, so `<RdFooter {...data} />` fails to compile with "Spread types may
 * only be created from object types."
 *
 * Widening to `unknown` and narrowing once per collection in the two getters
 * below is the smallest honest fix: each getter knows exactly which collection
 * it asked for, so it is the one place where naming the document type is a
 * statement of fact rather than a guess. The server wrappers then receive real,
 * checked props — RdHeaderServer / RdFooterServer used to cast to `never` to get
 * past this, which silently switched OFF prop checking on the chrome.
 */
function safeLocale(locale?: string): AppLocale {
  return isAppLocale(locale ?? '') ? (locale as AppLocale) : 'en'
}

/**
 * A stored destination, resolved for one locale.
 *
 * The chrome's link fields hold SLUGS — `the-lab`, `our-plans`, `order` — the
 * same convention every redesign block uses, so one stored value serves all
 * nine locales. The blocks each add the locale themselves (`liPath`, `barPath`
 * and the rest). The chrome never did, and shipped the slug raw.
 *
 * A bare `the-lab` in an href is RELATIVE TO THE CURRENT PATH, which is why
 * this was invisible for so long: on `/en/our-standards` it resolves to
 * `/en/the-lab` and looks perfect, and on `/en` it resolves to `/the-lab` and
 * drops the locale. The homepage was the one page where it showed.
 *
 * Anything already absolute is left exactly as typed — a full url, a `/path`,
 * a `#anchor`, `mailto:` or `tel:` — because an editor who wrote one meant it.
 * That guard is also what keeps populated media `url`s (`/cms/api/media/…`,
 * which `depth: 2` brings back) from being prefixed.
 */
const ABSOLUTE = /^(?:[a-z][a-z0-9+.-]*:|\/\/|\/|#)/i

/**
 * THE SLUG IS LOOKED UP, NOT JUST PREFIXED.
 *
 * `pages.slug` is LOCALIZED in this schema — it lives in `pages_locales`, and
 * the live pages prove it is used: en `order-v1` is de `bestellen-v1`, fr
 * `commander-v1`, nl `bestel-v1`. A naive `/de/our-plans` would 404 the day
 * someone translates that slug, and `localizedPagePath.ts` says what else goes
 * wrong first — linking to the EN slug triggers the cross-locale redirect in
 * `[locale]/[slug]/page.tsx`, which drops query params.
 *
 * So the stored value is resolved through `getLocalizedPagePath`, which is
 * `cache()`d per request and falls back to `/{locale}/{slug}` if the page
 * cannot be found. None of the redesign pages has a translated slug yet, so
 * this changes no url today — it is what stops it breaking later.
 *
 * The query string and hash are split off first and re-attached after: the
 * lookup is by slug, and `login?lang=en` would otherwise be searched for whole,
 * miss, and fall back — correct by luck rather than by design.
 */
const localizeUrl = async (value: string, locale: AppLocale): Promise<string> => {
  const v = value.trim()
  if (!v || ABSOLUTE.test(v)) return value
  const cut = v.search(/[?#]/)
  const slug = cut === -1 ? v : v.slice(0, cut)
  const tail = cut === -1 ? '' : v.slice(cut)
  return (await getLocalizedPagePath(slug, locale)) + tail
}

/**
 * Every `url` in the document, resolved — done HERE rather than in the two
 * components.
 *
 * `Header.tsx` is generated (tools/header_component.py) and carries nine href
 * sites; `Footer.tsx` has seven across three layout variants and is not handed
 * a locale at all. Fixing it in them means touching both, threading a prop
 * through two sub-components, and leaving a hand edit in a generated file for
 * the next regeneration to quietly undo. This function is the one place both
 * documents already pass through, and it has the locale in hand.
 */
/**
 * WHICH KEYS. The two collections between them name a destination four ways:
 * `url` (3 in RdHeaders, 5 in RdFooters), plus `homeUrl` and `loginUrl` on the
 * header. Matching only `url` would have left the wordmark and Log in pointing
 * at a bare slug — the two links most likely to be clicked from the homepage,
 * which is the exact page the bug shows on.
 *
 * `endsWith('Url')` does not match Payload's own `thumbnailURL` on a populated
 * upload, and that field is absolute anyway.
 */
const isDestination = (key: string) => key === 'url' || key.endsWith('Url')

const localizeUrls = async <T,>(node: T, locale: AppLocale): Promise<T> => {
  if (Array.isArray(node)) {
    return (await Promise.all(node.map((n) => localizeUrls(n, locale)))) as unknown as T
  }
  if (node && typeof node === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
      out[k] =
        isDestination(k) && typeof v === 'string'
          ? await localizeUrl(v, locale)
          : await localizeUrls(v, locale)
    }
    return out as unknown as T
  }
  return node
}

const fetchOne = async (
  collection: 'rd-headers' | 'rd-footers',
  id: string | number | null | undefined,
  locale?: string,
): Promise<unknown> => {
  const payload = await getPayload({ config: configPromise })
  const loc = safeLocale(locale)
  if (id) {
    return await localizeUrls(
      await payload.findByID({ collection, id, depth: 2, locale: loc }),
      loc,
    )
  }
  const result = await payload.find({
    collection,
    where: { isDefault: { equals: true } },
    limit: 1,
    depth: 2,
    locale: loc,
  })
  return result.docs[0] ? await localizeUrls(result.docs[0], loc) : null
}

/**
 * The same document, found by NAME rather than by id.
 *
 * WHY THIS EXISTS. The journal has to render the same chrome the rest of the
 * site wears, and the ids for that chrome are NOT the same between
 * environments — staging numbers them 2/2 and production 1/1. A hardcoded id
 * is therefore wrong in one environment whichever number is picked, and wrong
 * SILENTLY, because any rd-header renders perfectly well.
 *
 * Nor can it lean on `isDefault`: measured on staging, that flag sits on an
 * rd-header no page uses, whose `transparent` and `lightText` are still null.
 *
 * The names are the stable identifier across environments, so they are what
 * this looks up. `"Header - solid"` also says what it is at the call site,
 * where `2` said nothing.
 *
 * NO FALLBACK, DELIBERATELY. A name that does not resolve returns null and the
 * chrome does not render — loudly wrong rather than quietly wrong. Falling back
 * to `isDefault` would put the WRONG header on the page and look fine, which is
 * the failure this whole function exists to avoid. The console.error names the
 * collection and the string searched so the cause is one log line away.
 */
const fetchByName = async (
  collection: 'rd-headers' | 'rd-footers',
  name: string,
  locale?: string,
): Promise<unknown> => {
  const payload = await getPayload({ config: configPromise })
  const loc = safeLocale(locale)
  const result = await payload.find({
    collection,
    where: { name: { equals: name } },
    limit: 1,
    depth: 2,
    locale: loc,
  })
  const doc = result.docs[0]
  if (!doc) {
    console.error(
      `[rd-chrome] no ${collection} named ${JSON.stringify(name)} in this environment — ` +
        `nothing will render. Check the document names in the admin.`,
    )
    return null
  }
  return await localizeUrls(doc, loc)
}

export const getCachedRdHeaderByName = (name: string, locale?: string) =>
  unstable_cache(
    async () => (await fetchByName('rd-headers', name, locale)) as RdHeader | null,
    ['rd-header-by-name', name, locale ?? 'en'],
    { tags: [`rd_header_name_${name}`] },
  )

export const getCachedRdFooterByName = (name: string, locale?: string) =>
  unstable_cache(
    async () => (await fetchByName('rd-footers', name, locale)) as RdFooter | null,
    ['rd-footer-by-name', name, locale ?? 'en'],
    { tags: [`rd_footer_name_${name}`] },
  )

export const getCachedRdHeader = (id: string | number | null | undefined, locale?: string) =>
  unstable_cache(
    async () => (await fetchOne('rd-headers', id, locale)) as RdHeader | null,
    ['rd-header', String(id ?? 'default'), locale ?? 'en'],
    { tags: [id ? `rd_header_${id}` : 'rd_header_default'] },
  )

export const getCachedRdFooter = (id: string | number | null | undefined, locale?: string) =>
  unstable_cache(
    async () => (await fetchOne('rd-footers', id, locale)) as RdFooter | null,
    ['rd-footer', String(id ?? 'default'), locale ?? 'en'],
    { tags: [id ? `rd_footer_${id}` : 'rd_footer_default'] },
  )
