import React from 'react'
import type { BulletListBlock as BulletListBlockProps } from '@/payload-types'

type Props = BulletListBlockProps & {
  locale?: string
}

/**
 * A titled bullet list inside an article body.
 *
 * Renders prose-native markup — a heading and a plain `<ul>` — so the article's
 * own `.jr-prose` rules style it. It previously used `.art-card` / `.art-list`
 * from article-template.css, a different visual system that looked pasted in.
 * Lists are on the brief's allowed block list, and the approved template already
 * styles `ul`/`li`, so there is no new design here: the block just stops
 * fighting it.
 *
 * `h3` rather than `h2`: the block sits inside a section an editor has usually
 * already opened with an `h2`, and headings must not skip a level. It also keeps
 * the block out of the table of contents, which is built from `h2`s.
 */
export const BulletListBlockComponent: React.FC<Props> = ({ sectionTitle, items }) => {
  if (!items?.length) return null

  return (
    <>
      {sectionTitle ? <h3>{sectionTitle}</h3> : null}
      <ul>
        {items.map((item, index) => (
          <li key={index}>
            {item.leadIn ? <b>{item.leadIn} </b> : null}
            {item.body}
          </li>
        ))}
      </ul>
    </>
  )
}
