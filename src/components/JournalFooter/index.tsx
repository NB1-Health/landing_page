import React from 'react'

import { Footer } from '@/Footer/Component'
import { RdFooterServer } from '@/components/RdChrome/FooterServer'
import { getCachedGlobal } from '@/utilities/getGlobals'
import { isAppLocale } from '@/i18n/config'

/**
 * Whichever footer the Journal is set to wear.
 *
 * ONE PLACE decides, for the whole branch: the index, the paginated pages,
 * every article, and the hub, pillar, term and research pages. They all render
 * this instead of <Footer>, with the same props they passed before.
 *
 * The choice is `Site Settings → Journal index page → Redesign footer`:
 *
 *   empty  — every page keeps the site footer it already chooses, by the `id`
 *            it already passes. This is what every environment reads today, so
 *            nothing moves until someone picks one.
 *   set    — the whole branch renders that redesign footer instead.
 *
 * A CMS FIELD RATHER THAN AN ENVIRONMENT VARIABLE, deliberately, and not the
 * same lever as JOURNAL_RESKIN. That one is a safety switch for a deploy: it
 * turns the new *styling* off wholesale and it belongs in the environment,
 * where it can be flipped without a rebuild. Which footer the journal wears is
 * an editorial decision, it is per-content rather than per-deploy, and the
 * person making it should not need a deploy — so it is a picker. Tying the two
 * together would have meant the styling switch silently changing the site's
 * navigation, which is not what a styling switch should be able to do.
 *
 * `id` is still passed through to the site footer, so the per-page and
 * per-article footer choices keep working exactly as they do now whenever the
 * picker is empty. The redesign footer ignores it and uses its own document —
 * the picker names one footer for the branch, which is the point of it.
 */
export async function JournalFooter({
  locale,
  id,
}: {
  locale: string
  id?: string | null
}) {
  const appLocale = isAppLocale(locale) ? locale : 'en'
  const settings = await getCachedGlobal('site-settings', 0, appLocale)()
  const picked = (settings as { journal?: { rdFooter?: unknown } } | null)?.journal?.rdFooter

  // Depth 0, so a set relationship is an id rather than a document. Either is
  // accepted: a later depth change here should not silently fall back to the
  // site footer, which looks like "the setting did nothing".
  const rdId =
    typeof picked === 'number' || typeof picked === 'string'
      ? picked
      : picked && typeof picked === 'object' && 'id' in picked
        ? (picked as { id: number | string }).id
        : null

  if (rdId != null && rdId !== '') {
    return <RdFooterServer id={rdId} locale={appLocale} />
  }

  return <Footer id={id} locale={locale} />
}

export default JournalFooter
