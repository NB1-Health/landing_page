import {
  BoldFeature,
  FixedToolbarFeature,
  HeadingFeature,
  InlineToolbarFeature,
  ItalicFeature,
  LinkFeature,
  ParagraphFeature,
  TextStateFeature,
  UnderlineFeature,
  lexicalEditor,
} from '@payloadcms/richtext-lexical'

import { redesignColors } from './redesignColors'

/**
 * Rich-text editors for the redesign blocks.
 *
 * A NEW file rather than an edit to `headingLexical.ts`: that factory is used by
 * every existing block, and swapping its palette would change the toolbar on the
 * live site's content.
 *
 * `TextStateFeature` is the load-bearing part — it is what puts a COLOUR control
 * in the toolbar. Defining a `lexicalEditor` inline in a block omits it, and the
 * only way left to make a word a different colour is to abuse bold and style it
 * in CSS. Never define an editor inline in a block; import one of these.
 */
const baseFeatures = [
  ParagraphFeature(),
  BoldFeature(),
  ItalicFeature(),
  UnderlineFeature(),
  FixedToolbarFeature(),
  InlineToolbarFeature(),
  TextStateFeature({ state: { color: redesignColors } }),
]

/** Headings plus inline formatting — for a field that holds a real heading. */
export const makeRedesignHeadingEditor = (
  sizes: ('h1' | 'h2' | 'h3' | 'h4')[] = ['h1', 'h2', 'h3', 'h4'],
) => lexicalEditor({ features: [...baseFeatures, HeadingFeature({ enabledHeadingSizes: sizes })] })

/** Inline formatting only — for a label or a line of body copy. */
export const redesignInlineEditor = lexicalEditor({ features: baseFeatures })

/** Inline formatting plus links — for body copy that carries one. */
export const redesignInlineLinkEditor = lexicalEditor({
  features: [...baseFeatures, LinkFeature({ enabledCollections: ['pages', 'posts'] })],
})
