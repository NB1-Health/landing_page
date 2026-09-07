import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import type { AuthorDisplay } from '@/utilities/authorDisplay'

type Props = {
  author: AuthorDisplay | null
  labels: {
    /** Section heading, e.g. "About the author". */
    heading: string
    /** Link text to the author's own page. */
    profile: string
  }
  locale: string
}

/**
 * The author box at the foot of an article.
 *
 * Server-rendered, deliberately. It is the page's strongest E-E-A-T signal, and a
 * signal that only exists after hydration is one a crawler may never see — the
 * previews build this block from a client script, which is exactly the pattern
 * SEO-007 §8 defect 7 objects to for the navigation.
 *
 * Designed once for *an* author, per designer brief §4: "Do not design Polina's
 * author box. Her details live in one record and render identically on every
 * page; if her job title changes it changes in one place."
 *
 * Empty state: the whole block collapses. An author box with a placeholder avatar
 * and no name asserts an authority that is not there.
 */
export function AuthorBox({ author, labels, locale }: Props) {
  if (!author) return null

  const role = [author.roleTitle, author.affiliation].filter(Boolean).join(', ')

  return (
    <section className="jr-author">
      <div className="jr-av">
        {author.avatar ? (
          <Image alt={author.avatar.alt} height={52} src={author.avatar.src} width={52} />
        ) : null}
      </div>

      <div className="jr-author__body">
        <h2 className="jr-author__label">{labels.heading}</h2>

        <div className="jr-nm">
          {author.name}
          {author.credentials ? `, ${author.credentials}` : ''}
        </div>

        {role ? <div className="jr-ro">{role}</div> : null}
        {author.bio ? <p className="jr-author__bio">{author.bio}</p> : null}

        {/*
          The author's own page first, then up to three external profile links
          (designer brief §4). Whichever exist — the row collapses rather than
          rendering placeholder anchors, which is the defined empty state for this
          slot.
        */}
        <div className="jr-author__links">
          {author.slug ? (
            <Link className="jr-author__link" href={`/${locale}/journal/authors/${author.slug}`}>
              {labels.profile}
            </Link>
          ) : null}

          {author.profileLinks.map((link) => (
            <a
              className="jr-author__link"
              href={link.url}
              key={link.url}
              rel="noopener noreferrer"
              target="_blank"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
