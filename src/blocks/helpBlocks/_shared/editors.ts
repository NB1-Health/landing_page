import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  OrderedListFeature,
  ParagraphFeature,
  TextStateFeature,
  UnderlineFeature,
  UnorderedListFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { brandColors } from '@/fields/brandColors'

/**
 * Editors for the help-article kit.
 *
 * These are deliberately narrower than `defaultLexical`: the help template's
 * house rule is "plain and sober — no extra colour, no design treatments", so
 * editors get exactly the affordances the mockup uses and nothing else.
 */
const inlineFeatures = [
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
  TextStateFeature({ state: { color: brandColors } }),
  LinkFeature({ enabledCollections: ['pages', 'posts'] }),
]

/**
 * One short paragraph, with links. Used for FAQ answers, step callouts and the
 * closing line under the last step.
 */
export const helpInlineEditor = lexicalEditor({ features: inlineFeatures })

/**
 * Step bodies. Adds the two things a step actually needs beyond a paragraph:
 * ordered / unordered lists (including nested ones, via Tab) and an `h4`
 * sub-heading — the mockup's `.faq-subhead` ("Are you based in the EU?").
 *
 * `h4` on purpose: the on-page nav rail only collects `h2`s, so a sub-heading
 * inside a step never leaks into the contents list.
 */
export const helpBodyEditor = lexicalEditor({
  features: [
    ...inlineFeatures,
    UnorderedListFeature(),
    OrderedListFeature(),
    HeadingFeature({ enabledHeadingSizes: ['h4'] }),
  ],
})
