import type { Metadata } from 'next'
import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

/**
 * Best Open Graph image for a document: the explicit meta image if the editor
 * set one, otherwise the cover image, otherwise the site default.
 *
 * Previously only `meta.image` was consulted, so an article with a cover but no
 * separate meta image fell all the way through to the generic site OG card —
 * which is the common case, since the brief has the cover image driving the OG
 * image. Pages have no `heroImage`, hence the property check rather than a cast.
 */
const resolveOgImageSource = (doc: Partial<Page> | Partial<Post> | null) => {
  const metaImage = doc?.meta?.image
  if (metaImage && typeof metaImage === 'object') return metaImage

  const hero = doc && 'heroImage' in doc ? (doc as Partial<Post>).heroImage : undefined
  if (hero && typeof hero === 'object') return hero

  return undefined
}

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url
    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

function buildCanonicalURL(doc: Partial<Page> | Partial<Post> | null, locale?: string) {
  const base = getServerSideURL()
  const localePath = locale ? `/${locale}` : ''

  if (!doc?.slug) return `${base}${localePath}`

  // Slug may be a localized object { en: '...', de: '...' } or a plain string
  const rawSlug = doc.slug as unknown
  const slug =
    typeof rawSlug === 'string'
      ? rawSlug
      : typeof rawSlug === 'object' && rawSlug !== null
        ? ((rawSlug as Record<string, string>)[locale ?? 'en'] ?? (rawSlug as Record<string, string>)['en'])
        : null

  if (!slug || slug === 'home' || slug === 'home-page') return `${base}${localePath}`

  return `${base}${localePath}/${slug}`.replace(/\/+/g, '/').replace(':/', '://')
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  locale?: string
}): Promise<Metadata> => {
  const { doc, locale } = args

  const ogImage = getImageURL(resolveOgImageSource(doc ?? null))
  const canonical = buildCanonicalURL(doc, locale)

  const title = doc?.meta?.title ? doc.meta.title + ' | NB1' : 'NB1'

  return {
    title,
    description: doc?.meta?.description,

    alternates: {
      canonical,
    },

    openGraph: mergeOpenGraph({
      title,
      description: doc?.meta?.description || '',
      url: canonical,
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
    }),
  }
}
