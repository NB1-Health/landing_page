import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-01.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbHero.defaults.json, not retyped.
 *
 * The Lab's opening section: an eyebrow, a headline, a standfirst, two calls to
 * action, and a one-line note about the science board with its own link, all laid
 * over a full-bleed photograph.
 *
 * It is NOT the Protocol hero with different words. The Protocol's hero is a
 * two-column grid — copy on the left, a rounded photograph in its own column on
 * the right — and carries a row of three overlapping avatars this page does not
 * have. This one is a single column sitting ON the photograph, which is absolutely
 * positioned behind it under a gradient veil, and has an eyebrow the Protocol
 * hero has no field for. Reusing it would have meant making the avatar row and the
 * grid optional and adding the veil, which is more change to a shipped block than
 * a new block costs.
 *
 * The photograph is an upload field and not a CSS background. At the narrow
 * breakpoint rd-lb.css takes it out of `position: absolute` and puts it back in
 * flow above the copy as a square (`order: 2`, `aspect-ratio: 1 / 1`), so it is
 * content an editor sets, and it needs alt text.
 *
 * The veil — the empty div carrying only the gradient — is static. It holds no
 * content and the mockup's own narrow breakpoint hides it outright.
 *
 * The board note is a TEXT field beside a separate LINK field, which is the
 * opposite of what the Protocol hero does. There the destination sat inside the
 * sentence ("reviewed by our [seven-person science board]") and had to be rich
 * text so a translator could move it. Here the mockup puts the sentence and the
 * link side by side as two flex children with a 12px gap, so they are two fields.
 *
 * The two CTAs are built differently and that is the mockup's doing: the primary's
 * ↗ is its own span, drawn by the button and sized in em off the label; the
 * secondary's → is inside its text node. So the primary's label must not contain a
 * glyph and the secondary's must.
 *
 * All four destinations (#buy, #method, #board and the primary's #buy) are
 * anchors on this page, so unlike the Protocol's hero none of them is an undecided
 * link waiting on the punch list.
 */
export const RdLbHeroBlock: Block = {
  slug: "rdLbHero",
  interfaceName: "RdLbHeroBlock",
  labels: { singular: "RdLbHero", plural: "RdLbHero" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#top\". Deliberately NOT localized." }, defaultValue: "top" },
    { name: "eyebrow", type: "text", localized: true, label: "Eyebrow", admin: { description: "The small monospaced line above the headline. The \u00b7 is typed into the text, not drawn by the page." }, defaultValue: "The lab · how we read you" },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h1']), defaultValue: {
        "root": {
          "type": "root",
          "children": [
            {
              "type": "heading",
              "children": [
                {
                  "type": "text",
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "We read 1,217 organisms. Then we build.",
                  "version": 1
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1,
              "tag": "h1"
            }
          ],
          "direction": "ltr",
          "format": "",
          "indent": 0,
          "version": 1
        }
      } },
    { name: "intro", type: "textarea", localized: true, defaultValue: "Read that deeply and you stop guessing at which bacteria are there, and start knowing what each one can do. That is the difference between a formula for you and a formula for someone roughly like you." },
    localizedLink({
      overrides: {
          name: "primaryCta",
          label: "Primary link",
          admin: { description: "The \u2197 glyph is drawn by the button \u2014 do not type it into the label." },
          defaultValue: {
          "url": "#buy",
          "label": "Order your kit"
        },
      },
    }),
    localizedLink({
      overrides: {
          name: "secondaryCta",
          label: "Secondary link",
          admin: { description: "The \u2192 IS part of the label here, unlike the primary above. Type it." },
          defaultValue: {
          "label": "See the method →",
          "url": "#method"
        },
      },
    }),
    { name: "boardNote", type: "text", localized: true, label: "Board note", admin: { description: "The sentence on the rule under the buttons. The link beside it is its own field, so this text can be translated without touching it." }, defaultValue: "Method governed by a seven-person science board." },
    localizedLink({
      overrides: {
          name: "boardCta",
          label: "Board link",
          admin: { description: "Sits beside the note as a separate underlined link. The \u2192 is part of the label." },
          defaultValue: {
          "label": "Meet them →",
          "url": "#board"
        },
      },
    }),
    { name: "backgroundImage", type: "upload", relationTo: "media", label: "Hero photograph", admin: { description: "Fills the whole hero behind the copy on a wide screen; on a phone it moves above the text as a square. Needs alt text either way." } },
  ],
}
