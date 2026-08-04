import type { Metadata } from 'next'
import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

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
        ? ((rawSlug as Record<string, string>)[locale ?? 'en'] ??
          (rawSlug as Record<string, string>)['en'])
        : null

  if (!slug || slug === 'home' || slug === 'home-page') return `${base}${localePath}`

  return `${base}${localePath}/${slug}`.replace(/\/+/g, '/').replace(':/', '://')
}

export const generateMeta = async (args: {
  canonicalURL?: string
  doc: Partial<Page> | Partial<Post> | null
  locale?: string
}): Promise<Metadata> => {
  const { canonicalURL, doc, locale } = args

  const ogImage = getImageURL(doc?.meta?.image)
  const canonical = canonicalURL ?? buildCanonicalURL(doc, locale)

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
