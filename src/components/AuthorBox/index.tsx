import Image from 'next/image'
import React from 'react'

import type { AuthorDisplay } from '@/utilities/authorDisplay'

type Props = {
  author: AuthorDisplay | null
  labels: {
    /** Section heading, e.g. "About the author". */
    heading: string
    /**
     * Link text to the author's own page.
     *
     * Currently unused — see the note in the links row below. Kept on the contract
     * so the call sites do not have to change when the author route is built.
     */
    profile: string
  }
  /** Currently unused, for the same reason as `labels.profile`. */
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
export function AuthorBox({ author, labels }: Props) {
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
          Up to three external profile links (designer brief §4). The row collapses
          rather than rendering placeholder anchors, which is the defined empty
          state for this slot.

          THE AUTHOR'S OWN PAGE IS NOT LINKED, because it does not exist. §4 of the
          brief puts it first in this row, and this component shipped with

              href={`/${locale}/journal/authors/${author.slug}`}

          pointing at a route that was never built — there is no
          `journal/authors/[slug]` folder, so every one of those links 404'd. A
          dead link in the E-E-A-T block is worse than no link: it is the one
          place on the page asserting who wrote this and why they are credible.

          Restoring it needs three things, and they are product decisions rather
          than a five-minute fix:
            1. the route, with hreflang and a language-switcher entry like every
               other page type;
            2. an indexing call — one author with three articles is thin content,
               and a `noindex` author page still carries link value for readers;
            3. a sitemap, or a deliberate decision not to have one.
          Until then the name, credentials, role and bio still render, which is
          most of the signal.
        */}
        <div className="jr-author__links">
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
