import type { Post } from '@/payload-types'

import { getMediaUrl } from '@/utilities/getMediaUrl'

/**
 * Serializable shape a Journal card renders from.
 *
 * The grid is a client component (the topic chips filter without a round trip),
 * so cards must cross the server/client boundary. That means resolving the
 * media URL here rather than passing a whole Media document down.
 */
export type JournalCardImage = {
  src: string
  alt: string
  width?: number
  height?: number
}

export type JournalCardData = {
  id: string
  href: string
  title: string
  excerpt: string
  readTime: number | null
  categoryTitle: string | null
  categorySlug: string | null
  image: JournalCardImage | null
}

/**
 * Cover image for a card. Prefers the 900px "medium" size over the original —
 * a card renders at ~370px wide at most, so shipping the full upload wastes
 * most of the bytes. Falls back through large, then the original.
 */
function pickCardImage(resource: Post['heroImage'] | undefined): JournalCardImage | null {
  if (!resource || typeof resource !== 'object') return null

  const sized = resource.sizes?.medium?.url
    ? resource.sizes.medium
    : resource.sizes?.large?.url
      ? resource.sizes.large
      : null

  const url = sized?.url ?? resource.url
  if (!url) return null

  return {
    // Same cache-tag convention as components/Media/ImageMedia.
    src: getMediaUrl(url, resource.updatedAt),
    alt: resource.alt ?? '',
    width: sized?.width ?? resource.width ?? undefined,
    height: sized?.height ?? resource.height ?? undefined,
  }
}

/**
 * The subset of a post a card is built from.
 *
 * Not `Post`. The index queries pass a `select` projection — title, slug,
 * excerpt, readTime, heroImage, primaryCategory — so the documents that arrive
 * here genuinely lack `content`, `meta` and the rest, and typing the parameter
 * as a full `Post` was a lie that only compiled because nothing checked it.
 * Declaring the real requirement means a full `Post` still satisfies it, and a
 * projection that drops a field the card needs fails at the query instead of at
 * runtime.
 */
export type JournalCardSource = Pick<Post, 'id'> &
  Partial<Pick<Post, 'title' | 'slug' | 'excerpt' | 'readTime' | 'heroImage' | 'primaryCategory'>>

/**
 * Every field on a card comes from the post record — that is the whole point of
 * the content model. Returns null for a record that cannot render a valid card
 * (no slug or no title for this locale), so the index never shows a broken one.
 */
export function toJournalCard(post: JournalCardSource, locale: string): JournalCardData | null {
  if (!post?.slug || typeof post.title !== 'string' || !post.title.trim()) return null

  const category = typeof post.primaryCategory === 'object' ? post.primaryCategory : null

  return {
    id: String(post.id),
    href: `/${locale}/journal/${post.slug}`,
    title: post.title,
    excerpt: post.excerpt ?? '',
    readTime: typeof post.readTime === 'number' && post.readTime > 0 ? post.readTime : null,
    categoryTitle: category?.title ?? null,
    categorySlug: category?.slug ?? null,
    image: pickCardImage(post.heroImage),
  }
}

/**
 * Cover-image slot class. The category modifier only supplies the gradient used
 * when a post has no cover image; an unrecognised slug simply has no matching
 * rule and falls back to the base `.jr-thumb` gradient, so new categories never
 * render broken.
 */
export function thumbClassName(categorySlug: string | null): string {
  return categorySlug ? `jr-thumb jr-thumb--${categorySlug}` : 'jr-thumb'
}

/** Value used for chip matching. Posts with no primary category never match a chip. */
export function cardTopic(card: JournalCardData): string {
  return card.categorySlug ?? '__none__'
}
