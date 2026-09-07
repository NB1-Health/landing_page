import type { Metadata } from 'next/types'

import { notFound } from 'next/navigation'
import React from 'react'

import { DISCLAIMER_KEYS, getCachedDisclaimer } from '@/utilities/libraryQueries'
import { LexiconCategoryPage } from '@/components/LexiconCategoryPage'
import { buildHreflangAlternates } from '@/utilities/hreflang'
import { getCachedHubBySlug } from '@/utilities/hubQueries'
import {
  getCachedCategoryTerms,
  getCachedLexiconCategories,
  getCachedLexiconCategory,
} from '@/utilities/lexiconQueries'
import { getPublisherSchema } from '@/utilities/publisherSchema'
import { getServerSideURL } from '@/utilities/getURL'
import {
  isBrowseSegment,
  lexiconCategoryPath,
  lexiconCategoryPathForLocale,
} from '@/utilities/lexiconPaths'
import { appLocales, isAppLocale, type AppLocale } from '@/i18n/config'

/**
 * The lexicon category browse page, shared by one route folder per browse word.
 *
 * ## Why there is a folder per word instead of one dynamic segment
 *
 * The brief localises this segment: `/en/lexicon/topics/taxa` but
 * `/de/glossar/themen/taxa`. The obvious fix is a dynamic `[browse]` segment
 * validated per locale. It does not build:
 *
 *     You cannot use different slug names for the same dynamic path
 *     ('browse' !== 'doc')
 *
 * `[doc]` — which serves individual terms — is already the dynamic child of
 * `[slug]`. `[browse]` would be a SECOND dynamic child at that same position under
 * a different name, and Next refuses that regardless of what sits beneath it. The
 * `[category]` below is deeper, but the collision is one level up, at `[browse]`
 * itself. This is the same rule that ruled out `[locale]/[hub]` earlier in the
 * project, and it was asserted here rather than tested — hence the failed build.
 *
 * A STATIC folder beside a dynamic one is a different rule and is allowed. That
 * shape was verified with a real build before the category page was first
 * written, so `topics/` and `themen/` are known-good rather than assumed.
 *
 * The cost is one small folder per browse word — both are four lines and delegate
 * here. Only `topics` and `themen` exist because only EN and DE have hub slugs, so
 * they are the only locales with category URLs at all. `sujets` and `onderwerpen`
 * are in `localeConfig` and would each need a folder on the day French or Dutch
 * gets a Lexicon slug; until then those URLs correctly do not exist.
 *
 * The tidier alternative is to reuse the existing `[doc]` name at that slot —
 * `[doc]/page.tsx` for a term and `[doc]/[category]/page.tsx` for a category, with
 * `[doc]` holding the browse word. One name at the slot, so the rule is satisfied.
 * It is very likely correct and it is not proven here, and this route has already
 * cost one failed build on a confident guess.
 *
 * ## The guard
 *
 * `expectedSegment` is the folder's own word. It must be the browse word for THIS
 * locale, so `/de/glossar/topics/taxa` 404s even though the `topics/` folder
 * matched it, and `/en/lexicon/themen/taxa` 404s likewise. Serving one page at two
 * addresses is the duplicate-content problem the flat term URL exists to avoid.
 */
export function buildLexiconCategoryRoute(expectedSegment: string) {
  type Args = { params: Promise<{ locale: string; slug: string; category: string }> }

  async function resolve(params: Args['params']) {
    const { locale: localeParam, slug: hubSlug, category: categoryParam } = await params
    if (!isAppLocale(localeParam)) return null
    const locale: AppLocale = localeParam

    // Cheapest rejection first, before any query: is this folder's word the right
    // one for this locale?
    if (!isBrowseSegment(locale, expectedSegment)) return null

    // The parent segment has to be the Lexicon hub in THIS locale. Not just any
    // hub: `/en/microbiome/topics/x` would otherwise render an empty category
    // page at a URL that should 404.
    const hub = await getCachedHubBySlug(locale, decodeURIComponent(hubSlug))()
    if (!hub || hub.key !== 'lexicon') return null

    const category = await getCachedLexiconCategory(locale, decodeURIComponent(categoryParam))()
    if (!category) return null

    return { locale, hub, category }
  }

  async function generateMetadata({ params }: Args): Promise<Metadata> {
    const resolved = await resolve(params)
    if (!resolved) return {}

    const { locale, hub, category } = resolved
    const siteURL = getServerSideURL()
    const canonical = new URL(
      lexiconCategoryPath({ locale, hubSlug: hub.slug, categorySegment: category.segment }),
      siteURL,
    ).toString()

    // `pathsByLocale` holds the path AFTER the locale prefix and without a leading
    // slash; `buildHreflangAlternates` skips any locale with no entry.
    //
    // A locale is declared only where BOTH the hub and the category have a slug —
    // three localized parts, all of which must exist for the URL to.
    //
    // This previously collapsed the whole cluster to the current locale whenever
    // the segment differed from `key`, which — since the slug auto-generates — was
    // always. Every category page therefore declared a single-entry cluster. Real
    // per-locale slugs replace that guess.
    const pathsByLocale = Object.fromEntries(
      appLocales
        .filter(
          (available) =>
            Boolean(hub.slugsByLocale[available]) &&
            // `?? {}` — see LexiconCategoryPage. A cache entry predating this
            // field must cost the hreflang cluster, not throw during metadata.
            Boolean((category.slugsByLocale ?? {})[available]),
        )
        .map((available) => [
          available,
          // That locale's browse word AND that locale's category slug — a German
          // alternate reads `themen/bakterielle-taxa` even while an English page
          // is being rendered.
          lexiconCategoryPathForLocale({
            locale: available,
            hubSlug: hub.slugsByLocale[available] as string,
            categorySegment: (category.slugsByLocale ?? {})[available] as string,
          }),
        ]),
    )

    return {
      title: `${category.title} | NB1`,
      ...(category.intro ? { description: category.intro } : {}),
      ...(category.noindex ? { robots: { index: false, follow: true } } : {}),
      alternates: {
        canonical,
        ...buildHreflangAlternates({ siteURL, pathsByLocale }),
      },
    }
  }

  async function Page({ params }: Args) {
    const resolved = await resolve(params)
    if (!resolved) notFound()

    const { locale, hub, category } = resolved

    const [categories, terms, disclaimer, publisher] = await Promise.all([
      getCachedLexiconCategories(locale)(),
      getCachedCategoryTerms({ locale, categoryId: category.id, hubSlug: hub.slug })(),
      getCachedDisclaimer(locale, DISCLAIMER_KEYS.educationalBrowse)(),
      getPublisherSchema(locale),
    ])

    return (
      <LexiconCategoryPage
        categories={categories}
        category={category}
        disclaimer={disclaimer}
        hub={hub}
        locale={locale}
        publisher={publisher}
        terms={terms}
      />
    )
  }

  return { generateMetadata, Page }
}
