import type { Payload } from 'payload'
import type { InfluencerLandingPage, InfluencerTemplate } from '@/payload-types'
import { getFallbackLocale, type AppLocale } from '@/i18n/config'
import type { AuthenticatedDraft } from './authenticatedDraft'

export async function getInfluencerTemplate(
  payload: Payload,
  page: InfluencerLandingPage,
  read: AuthenticatedDraft,
  locale: AppLocale,
): Promise<InfluencerTemplate | null> {
  const templateId = typeof page.template === 'object' ? page.template?.id : page.template
  // Query explicitly, rather than trusting a populated relationship: public
  // pages must never render a template draft, even for a logged-in editor.
  const result = await payload.find({
    collection: 'influencer-templates',
    where: {
      and: [
        templateId ? { id: { equals: templateId } } : { key: { equals: 'default' } },
        ...(read.draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
    locale,
    fallbackLocale: getFallbackLocale(locale),
    depth: 2,
    limit: 1,
    pagination: false,
    draft: read.draft,
    overrideAccess: false,
    user: read.user,
  })
  return result.docs[0] ?? null
}
