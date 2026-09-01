'use client'

import React, { useEffect, useRef, useState } from 'react'

import type { HeadingItem } from '@/components/RichText/converters'

type Props = {
  headings: HeadingItem[]
  label: string
}

/**
 * Sticky table of contents for a Journal article, with the active section
 * highlighted as the reader scrolls.
 *
 * The anchors need no client-side id generation: the rich-text heading converter
 * already emits `id={slugify(text)}` server-side using the same slugify as
 * `extractHeadingsFromLexical`, so the ids in the prose and the hrefs here match
 * and the links work before hydration.
 */
export const ArticleToc: React.FC<Props> = ({ headings, label }) => {
  const [active, setActive] = useState<string | null>(null)
  const activeRef = useRef<string | null>(null)

  useEffect(() => {
    if (headings.length === 0) return
    if (typeof IntersectionObserver === 'undefined') return

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)

    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            // Ref guard: setState with the same value still re-renders in some
            // React versions, and scroll fires these constantly.
            if (activeRef.current !== entry.target.id) {
              activeRef.current = entry.target.id
              setActive(entry.target.id)
            }
            break
          }
        }
      },
      // Matches the template: a heading counts as current once it clears the
      // sticky header and until it leaves the top third of the viewport.
      { rootMargin: '-90px 0px -70% 0px' },
    )

    for (const el of elements) observer.observe(el)
    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <aside className="jr-toc">
      <div className="jr-lbl">{label}</div>
      <nav>
        {headings.map((heading) => (
          <a
            className={active === heading.id ? 'is-active' : undefined}
            href={`#${heading.id}`}
            key={heading.id}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </aside>
  )
}
