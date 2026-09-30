import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-02.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbNot.defaults.json, not retyped.
 *
 * "We are not a probiotic." A headline, a standfirst, three ruled rows saying what
 * the product is not, and a fourth row — drawn differently — saying what it is.
 *
 * THE FOURTH ROW IS NOT A FOURTH ITEM. The mockup writes the first three inside
 * `<sc-for list="{{ nots }}" as="n" hint-placeholder-count="3">` and the last one
 * out by hand, and the three differences are all deliberate:
 *
 *   * its rule is `1.5px solid var(--nb1-dark-brown)`, the others' is
 *     `1px solid rgba(81,71,69,.22)`;
 *   * its padding is `26px 0 0`, the others' is `22px 0`;
 *   * its body text has no `opacity: .82`, so it reads at full strength.
 *
 * Making it a fourth array row would have meant either losing those three
 * differences or encoding "the last one looks different" as a rule about position,
 * which stops being true the moment an editor adds a fifth. So the three are an
 * array whose count is free, and the closing row is a group of its own that always
 * renders.
 *
 * The row copy is bound through `unwrap`: the mockup writes each interpolated
 * value as `<span class="sc-interp">`, the runtime's wrapper rather than the
 * designer's markup, and binding its text would ship a span the design has not
 * got. The hand-written fourth row has no such span, which is how you can tell.
 *
 * The section has NO id in the mockup. `anchorId` is here anyway, empty, so
 * nothing is rendered unless an editor fills it — the same field every other block
 * on this page carries, and the same output the mockup produces.
 */
export const RdLbNotBlock: Block = {
  slug: "rdLbNot",
  interfaceName: "RdLbNotBlock",
  labels: { singular: "RdLbNot", plural: "RdLbNot" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The mockup gives this section NO id, so it is empty by default and no id attribute is rendered. Fill it only if something needs to link here. Deliberately NOT localized." } },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), label: "Heading", admin: { description: "The section headline." }, defaultValue: {
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
                  "text": "We are not a probiotic. We are one of one.",
                  "version": 1
                }
              ],
              "direction": "ltr",
              "format": "",
              "indent": 0,
              "version": 1,
              "tag": "h2"
            }
          ],
          "direction": "ltr",
          "format": "",
          "indent": 0,
          "version": 1
        }
      } },
    { name: "intro", type: "textarea", localized: true, label: "Standfirst", admin: { description: "The line under the headline that sets up the list." }, defaultValue: "Easier to say what we are not. Three things this is regularly mistaken for, and why none of them is it." },
    {
      name: "notRows", type: 'array', label: "What it is not", admin: { description: "Three in the mockup, each a hairline-ruled row. The count is free \u2014 a fourth stacks correctly. The closing \"What it is.\" row below is NOT one of these: it has a heavier rule and no dimmed body, so it has its own fields." },
      defaultValue: [
        {
          "title": "Not a probiotic.",
          "body": "One blend of bacteria, made the same for everyone, decided long before anyone looked at a single gut. Convenient for whoever is making it. Ours is chosen strain by strain from your sample."
        },
        {
          "title": "Not a synbiotic.",
          "body": "A synbiotic pairs bacteria with fibre, which is right in principle and generic in practice. We pair each strain with the fibre it feeds on, at the dose your gut ferments."
        },
        {
          "title": "Not a stack.",
          "body": "A stack is what you build yourself out of labels, forum threads and hope. This is one formula, built from a reading, signed off by a scientist before it is made."
        }
      ],
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        { name: "body", type: "textarea", localized: true },
      ],
    },
    {
      name: "conclusion", type: 'group', label: "What it is", admin: { description: "The closing row, drawn differently from the three above on purpose: a 1.5px dark rule instead of a hairline, more space above, and full-strength body text. It always renders, even empty." },
      fields: [
        { name: "title", type: "text", localized: true, defaultValue: "What it is." },
        { name: "body", type: "textarea", localized: true, defaultValue: "One formula, built from your own reading. Live cultures, the fibres that feed them, and the vitamins and minerals your levels call for — nothing in it your biology did not ask for." },
      ],
    },
  ],
}
