import type { AppLocale } from '@/i18n/config'
import type { PublishedLocaleSlugs } from '@/utilities/publishedLocaleAvailability'

export type LocalizedDocumentRoute = 'home' | 'page' | 'post' | 'influencer'

export type LocalizedDocument = {
  route: LocalizedDocumentRoute
  slugs: PublishedLocaleSlugs
}

export function buildLocalizedDocumentPath(
  locale: AppLocale,
  slug: string,
  route: LocalizedDocumentRoute,
): string {
  if (route === 'home') return `/${locale}`
  if (route === 'post') return `/${locale}/posts/${slug}`
  if (route === 'influencer') return `/${locale}/influencers/${slug}`
  return `/${locale}/${slug}`
}
