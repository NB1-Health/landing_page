import type { Field } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { BulletListBlock } from '@/blocks/BulletList/config'
import { HighlightCallout } from '@/blocks/HighlightCallout/config'
import { PullQuote } from '@/blocks/PullQuote/config'

/**
 * The three fixed sections on a lexicon term, from `preview-lexicon-term.html`.
 *
 * Ids taken from the preview's `<h2>` elements verbatim — note the third is
 * `role-in-gut-microbiome-health`, not a slug of a shortened label. Same rule as
 * the scientific article: the anchor is data, not something derived from a
 * translated heading, because deriving it means a rename moves every deep link.
 *
 * Three sections and ~800 words, repeated across up to 2,400 pages. The
 * uniformity is the point: a reader who has seen one term knows where to look on
 * every other.
 */
export const TERM_SECTIONS = [
  { key: 'inSimpleTerms', id: 'in-simple-terms', label: 'In Simple Terms' },
  { key: 'scientificBackground', id: 'scientific-background', label: 'Scientific Background' },
  {
    key: 'roleInGutHealth',
    id: 'role-in-gut-microbiome-health',
    label: 'Role in Gut Microbiome Health',
  },
] as const

export type TermSection = (typeof TERM_SECTIONS)[number]
export type TermSectionKey = TermSection['key']

/**
 * The editor for a term section.
 *
 * A deliberately short list of blocks. These pages are ~270 words per section and
 * there are up to 2,400 of them; the more a body can contain, the less uniform
 * the corpus is, and uniformity is what makes a reference section usable. No
 * tables, no CTAs, no media — the conversion block and the disclaimers are placed
 * by the template, not dropped in by hand.
 *
 * `HeadingFeature` with h3 only, for the same reason as everywhere else: the
 * section's own title is the h2, and `defaultLexical` has no heading feature at
 * all, which makes a body containing one unparseable.
 */
const sectionEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h3'] }),
    BlocksFeature({ blocks: [BulletListBlock, HighlightCallout, PullQuote] }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
  ],
})

export function termSectionFields(): Field[] {
  return TERM_SECTIONS.map(({ key, label }, index) => ({
    name: key,
    type: 'group',
    label,
    admin: {
      description: `Section ${index + 1} of ${TERM_SECTIONS.length}. Order is fixed. Around 270 words.`,
    },
    fields: [
      {
        name: 'body',
        type: 'richText',
        localized: true,
        editor: sectionEditor,
        admin: { description: 'H3 for sub-headings. The section title is generated.' },
      },
    ],
  }))
}
