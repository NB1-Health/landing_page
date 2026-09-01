import configPromise from '@payload-config'
import { getPayload, type Payload } from 'payload'
import { unstable_cache } from 'next/cache'

import type { AppLocale } from '@/i18n/config'

/**
 * Reading the keyed content library by key.
 *
 * The point of `Disclaimers` and `ConversionBlocks` is that a page can ask for
 * "the educational disclaimer" or "the condition CTA" without an editor having
 * selected it on that document. On 2,400 lexicon terms that difference is the
 * whole design: a relationship field would be 2,400 rows a pipeline has to fill
 * correctly, and 2,400 chances to fill it wrong.
 *
 * Cached and tagged, because these are read on every page render and change a few
 * times a year. `revalidateTag('content-library')` on save busts the lot.
 */

async function fetchByKey(
  collection: 'disclaimers' | 'conversion-blocks',
  locale: AppLocale,
  key: string,
): Promise<Record<string, unknown> | null> {
  const payload: Payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    // Narrowed to one literal: `find` is typed per collection and a union gives
    // it a union of `where` shapes it will not accept. Both have `key`.
    collection: collection as 'disclaimers',
    depth: 1,
    limit: 1,
    locale,
    // Library copy is legal and conversion text. A German page falling back to
    // the English disclaimer is worse than no disclaimer — it is a compliance
    // statement the reader cannot read.
    fallbackLocale: false,
    overrideAccess: false,
    pagination: false,
    where: { key: { equals: key } },
  })

  return (result.docs[0] as unknown as Record<string, unknown>) ?? null
}

/**
 * One disclaimer, by key.
 *
 * Null when the record does not exist yet — every caller renders its translated
 * default instead, so an unseeded library degrades to the shipped wording rather
 * than to a blank space where a legal notice should be.
 */
export const getCachedDisclaimer = (locale: AppLocale, key: string) =>
  unstable_cache(
    async () => fetchByKey('disclaimers', locale, key),
    ['disclaimer', locale, key],
    { tags: ['content-library', `disclaimer_${key}`] },
  )

/** One conversion block, by key. */
export const getCachedConversionBlock = (locale: AppLocale, key: string) =>
  unstable_cache(
    async () => fetchByKey('conversion-blocks', locale, key),
    ['conversion-block', locale, key],
    { tags: ['content-library', `conversion-block_${key}`] },
  )

/**
 * The five conversion-block keys in the previews.
 *
 * Named here rather than typed as free strings so a caller cannot ask for a key
 * that was never created — the compiler catches the typo that would otherwise
 * render a page with no CTA.
 */
export const CONVERSION_KEYS = {
  pillarInline: 'pillar-inline',
  pillarClosing: 'pillar-closing',
  articleFooter: 'article-footer',
  microbiomeAnalysis: 'microbiome-analysis',
  conditionAnalysis: 'condition-analysis',
} as const

/** The seven disclaimer keys in the previews. */
export const DISCLAIMER_KEYS = {
  educational: 'educational',
  educationalBrowse: 'educational-browse',
  healthCondition: 'health-condition',
  claimsNote: 'claims-note',
  analysisNotDiagnostic: 'analysis-not-diagnostic',
  wellnessSubscription: 'wellness-subscription',
  notAMedicalTest: 'not-a-medical-test',
} as const
