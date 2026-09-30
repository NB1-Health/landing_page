import type { Block } from 'payload'
import { redesignInlineEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-11.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgQuiet.defaults.json, not retyped.
 *
 * The quiet band: a hairline rule and one sentence, on the same dark ground as the
 * athletes section above it. Five nodes.
 *
 * ONE rich-text field, not a text field plus a coloured span. The closing clause is
 * a COLOUR, and a named colour token is what carries it — `$.color: 'rd-blue-grey'`
 * on the text node, resolved by textConverter against brandColors. Splitting the
 * sentence into two text fields would make the break between them a fact about the
 * markup rather than about the sentence, and no translator could move it.
 *
 * The paragraph gets the INLINE editor rather than the heading editor: it is a
 * statement, not a heading, and the only formatting it needs is the colour.
 */
export const RdPgQuietBlock: Block = {
  slug: "rdPgQuiet",
  interfaceName: "RdPgQuietBlock",
  labels: { singular: "PG Quiet", plural: "PG Quiet" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The mockup gives this band none; set one only if something needs to link to it. Deliberately NOT localized \u2014 a fragment must be identical in every locale." } },
    { name: "statement", type: "richText", localized: true, editor: redesignInlineEditor, label: "Statement", admin: { description: "One sentence over a hairline rule. The closing clause is coloured with the Blue grey token from the editor's colour menu \u2014 it is a colour, not bold, so it stays a colour in every locale and a translator can move where it starts." }, defaultValue: {
        "root": {
          "type": "root",
          "children": [
            {
              "type": "paragraph",
              "children": [
                {
                  "type": "text",
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "Nothing is produced until everything is known. Your formula doesn't exist before ",
                  "version": 1
                },
                {
                  "type": "text",
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "your diagnostic does.",
                  "version": 1,
                  "$": {
                    "color": "rd-blue-grey"
                  }
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1,
              "textFormat": 0
            }
          ],
          "direction": "ltr",
          "format": "",
          "indent": 0,
          "version": 1
        }
      } },
  ],
}
