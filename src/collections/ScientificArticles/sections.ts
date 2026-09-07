import type { Field } from 'payload'

import {
  BlocksFeature,
  FixedToolbarFeature,
  HeadingFeature,
  HorizontalRuleFeature,
  InlineToolbarFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { BulletListBlock } from '@/blocks/BulletList/config'
import { ComplianceNote } from '@/blocks/ComplianceNote/config'
import { CtaBlock } from '@/blocks/CTA/config'
import { DataTableBlock } from '@/blocks/DataTable/config'
import { EvidenceTable } from '@/blocks/EvidenceTable/config'
import { ExpertQuote } from '@/blocks/ExpertQuote/config'
import { HighlightCallout } from '@/blocks/HighlightCallout/config'
import { PullQuote } from '@/blocks/PullQuote/config'

/**
 * The seven sections, in the order §6 of the designer brief fixes them.
 *
 * Taken from `preview-scientific-article.html`, where all seven render as `<h2>`
 * inside the body with these exact ids. An earlier version of this file carried a
 * provisional list; five of the seven names were wrong.
 *
 * `id` is the anchor, and it is NOT derived from `key` — the field name has to be
 * camelCase for Payload, the anchor has to match the preview's hyphenated ids, and
 * neither should be generated from the other. Deriving one would mean a rename in
 * the admin silently moving every deep link into the article.
 *
 * `panel` marks "In Plain Language". It is the seventh SECTION — it appears in the
 * contents list as item 7 — and simultaneously the only one wrapped in its own
 * tinted container (`.art-simple` in the preview). Both are true; it is not a
 * separate block above the body.
 *
 * `panel` is stated on every entry rather than only on the one that needs it. An
 * optional property on one member of an `as const` union makes the union
 * heterogeneous, which forces an `in` check at every read and quietly widens any
 * type derived from it.
 */
export const ARTICLE_SECTIONS = [
  { key: 'background', id: 'background', label: 'Background', panel: false },
  { key: 'studyDesign', id: 'study-design', label: 'Study Design', panel: false },
  { key: 'keyFindings', id: 'key-findings', label: 'Key Findings', panel: false },
  { key: 'mechanism', id: 'mechanism', label: 'Mechanism', panel: false },
  {
    key: 'clinicalImplications',
    id: 'clinical-implications',
    label: 'Clinical Implications',
    panel: false,
  },
  { key: 'limitations', id: 'limitations', label: 'Limitations and Open Questions', panel: false },
  {
    key: 'inPlainLanguage',
    id: 'in-plain-language',
    label: 'In Plain Language',
    /** Renders inside the tinted panel. Still section seven, still in the rail. */
    panel: true,
  },
] as const

export type ArticleSection = (typeof ARTICLE_SECTIONS)[number]
export type ArticleSectionKey = ArticleSection['key']

/**
 * The editor for a section body.
 *
 * Its own instance rather than `defaultLexical`, for the reason Pillars found the
 * hard way: `defaultLexical` has no `HeadingFeature`, so a body containing an H3
 * cannot be parsed at all and the admin refuses to render the field.
 *
 * H3 only, not H2. Each section's own title is the H2 and it is generated from the
 * section list, so an H2 inside a body would produce a second heading at the same
 * level as its own container and a duplicate entry in the contents rail.
 *
 * No `MediaBlock`: §6 of the brief is categorical — *"These pages contain no
 * images. Not one, across all 204 English articles."* Offering an image block
 * would be offering a slot the design has no treatment for.
 */
const sectionEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    HeadingFeature({ enabledHeadingSizes: ['h3'] }),
    BlocksFeature({
      blocks: [
        EvidenceTable,
        DataTableBlock,
        HighlightCallout,
        PullQuote,
        BulletListBlock,
        ExpertQuote,
        ComplianceNote,
        CtaBlock,
      ],
    }),
    FixedToolbarFeature(),
    InlineToolbarFeature(),
    HorizontalRuleFeature(),
  ],
})

/**
 * One `group` field per section, in array order.
 *
 * `heading` is an optional override, not the source of truth. Left empty the
 * renderer uses the translated label, so 408 articles do not each need someone to
 * retype "Background" in two languages — and the contents rail stays identical
 * across the collection, which is the point of a fixed section order.
 */
export function articleSectionFields(): Field[] {
  return ARTICLE_SECTIONS.map(({ key, label }, index) => ({
    name: key,
    type: 'group',
    label,
    admin: {
      description: `Section ${index + 1} of ${ARTICLE_SECTIONS.length}. Order is fixed and cannot vary per article.`,
    },
    fields: [
      {
        name: 'heading',
        type: 'text',
        localized: true,
        admin: {
          description: `Optional. Leave empty for the standard translated heading ("${label}").`,
        },
      },
      {
        name: 'body',
        type: 'richText',
        localized: true,
        editor: sectionEditor,
        admin: {
          description:
            key === 'inPlainLanguage'
              ? 'Four short paragraphs, each opening with a bold lead-in question. Renders in the tinted panel.'
              : 'H3 for sub-headings. The section title itself is generated.',
        },
      },
    ],
  }))
}
