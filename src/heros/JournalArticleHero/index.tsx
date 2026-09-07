import Image from 'next/image'
import React from 'react'

import { Breadcrumb } from '@/components/Breadcrumb'
import type { BreadcrumbRung } from '@/utilities/journalTrail'

import type { Author, Media, Post } from '@/payload-types'

import { formatDateTime } from '@/utilities/formatDateTime'
import { collectLexicalText } from '@/utilities/countLexicalWords'
import { getMediaUrl } from '@/utilities/getMediaUrl'

export type JournalArticleHeroLabels = {
  by: string
  reviewedBy: string
  minRead: string
}

type Props = {
  post: Post
  labels: JournalArticleHeroLabels
  /** Built by `buildJournalTrail`, and shared with the BreadcrumbList JSON-LD so
   * the two cannot drift — SEO-007 §5 treats a mismatch as a P1 defect. */
  rungs: BreadcrumbRung[]
}

function asObject<T>(value: T | number | string | null | undefined): T | null {
  return value && typeof value === 'object' ? (value as T) : null
}

/** ISO date for <time datetime>, without throwing on a malformed value. */
function isoDate(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 10)
}

/**
 * Breadcrumb, header and hero figure for a Journal article — the top of
 * Screen B in the approved template.
 *
 * Reads `post.authors` / `post.reviewer` directly rather than
 * `populatedAuthors`: that denormalised array carries only name, slug,
 * credentials and avatar, and the byline needs the author's role while the
 * author box needs their one-line bio. The article route already queries at
 * depth 2, so the full Author documents are present — no extra field, no
 * migration.
 */
export const JournalArticleHero: React.FC<Props> = ({ post, labels, rungs }) => {
  const category = asObject<{ title?: string | null; slug?: string | null }>(post.primaryCategory)
  const author = asObject<Author>(Array.isArray(post.authors) ? post.authors[0] : null)
  const reviewer = asObject<Author>(post.reviewer)
  const cover = asObject<Media>(post.heroImage)

  const coverSrc = cover?.url ? getMediaUrl(cover.url, cover.updatedAt) : null
  // Media.caption is rich text; the figcaption is a single line, so take its
  // text rather than pulling the whole rich-text renderer in here.
  const caption = cover?.caption ? collectLexicalText(cover.caption).trim() : ''

  const published = isoDate(post.publishedAt)

  return (
    <>
      {/* Home / Journal / {this article}. The category is NOT a rung: its archive
          was removed per SEO-007 §10, and a middle rung with nothing to link to
          is worse than none. It still renders below as `.jr-cat`, which is a
          label rather than a navigation step. */}
      <Breadcrumb rungs={rungs} />

      <header className="jr-head">
        {category?.title ? <span className="jr-cat">{category.title}</span> : null}
        <h1>{post.title}</h1>
        {post.subtitle ? <p className="jr-dek">{post.subtitle}</p> : null}

        <div className="jr-byline">
          {author?.name ? (
            <span>
              {labels.by} <b>{author.name}</b>
              {author.roleTitle ? `, ${author.roleTitle}` : ''}
            </span>
          ) : null}

          {/* Hidden entirely when there is no reviewer, per the brief. */}
          {reviewer?.name ? (
            <>
              {author?.name ? <span className="jr-dot" /> : null}
              <span>
                {labels.reviewedBy} <b>{reviewer.name}</b>
              </span>
            </>
          ) : null}

          {published ? (
            <>
              {author?.name || reviewer?.name ? <span className="jr-dot" /> : null}
              <time dateTime={published}>{formatDateTime(post.publishedAt as string)}</time>
            </>
          ) : null}

          {post.readTime ? (
            <>
              {author?.name || reviewer?.name || published ? <span className="jr-dot" /> : null}
              <span>
                {post.readTime} {labels.minRead}
              </span>
            </>
          ) : null}
        </div>
      </header>

      {coverSrc ? (
        <figure className="jr-fig">
          <Image
            alt={cover?.alt ?? ''}
            height={cover?.height ?? 800}
            priority
            sizes="(max-width: 880px) 100vw, 1000px"
            src={coverSrc}
            width={cover?.width ?? 1600}
          />
          {caption ? <figcaption>{caption}</figcaption> : null}
        </figure>
      ) : null}
    </>
  )
}
