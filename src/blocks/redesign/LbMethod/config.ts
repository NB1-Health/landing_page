import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'

/**
 * GENERATED from manifests/section-04.json by tools/block_config.py — every
 * defaultValue is injected from out/RdLbMethod.defaults.json, not retyped.
 *
 * The comparison: 16S on the left, shotgun on the right, each with a drawing of
 * the same gut, and three tappable microbes on the right-hand one.
 *
 * THE TWO DRAWINGS SHIP AS FILES. They are 1,250 and 1,217 `<circle>` elements —
 * 280KB of markup, and none of it content. They live at
 * `public/rd-lb/method-16s.svg` and `public/rd-lb/method-shotgun.svg`, generated
 * by the lab workspace's tools/method_svg.py, and are pulled in with an `<image>`
 * INSIDE the mockup's own `<svg>` rather than as an `<img>` beside it. That keeps
 * the wrapper element, its viewBox and its aria-label exactly what the mockup
 * wrote, and it rasterises closer: measured, 0.79% of pixels differ at the circle
 * edges against 12.75% for an `<img>`.
 *
 * Every `var()` in those two files is resolved to a literal. An external SVG
 * loaded through an image is a separate document and cannot see the page's custom
 * properties, so `fill="var(--nb1-warm-grey)"` would have resolved to nothing and
 * the cloud would have rendered invisible. The values come from the manifest's own
 * measured token map, and the generator refuses to write a file with a `var(`
 * left in it.
 *
 * TWELVE CIRCLES DID NOT SHIP AS A FILE. The three tappable microbes are three
 * stacks of four — a white disc, a soft ring, a pulsing halo and the node itself —
 * and they are the LAST twelve in the mockup's own document order, which is what
 * makes the split safe: nothing is painted after them, so a file plus an overlay
 * is the same picture in the same order. They are drawn inline so React owns the
 * tap.
 *
 * They carry no `data-n` / `data-j` / `data-s`. In the mockup those attributes ARE
 * the storage — its script reads them back off the node after the click. Here the
 * three names, jobs and statuses are CMS fields, and leaving the attributes in
 * place would have been a second copy of the same three strings: untranslated, and
 * stale the first time an editor changed one.
 *
 * The popover is positioned from each circle's own `cx`/`cy`/`r` against the
 * viewBox, as a percentage. The mockup measures the tapped circle with
 * `getBoundingClientRect` and writes pixels; the numbers are known up front, so
 * this lands right on the first paint instead of one frame later.
 *
 * `#usFig`, `#micPop`, `#micStatus`, `#micName` and `#micJob` are dropped. Those
 * ids existed only so the mockup's own script could find the nodes with
 * `getElementById`. Nothing in rd-lb.css selects them, and shipping them would put
 * five fixed ids on a block an editor can place twice on one page.
 *
 * The state key's three swatches and the three microbes are bound BY INDEX, not
 * repeated: each swatch is its own drawing (a lime disc, an orange disc, and a
 * cool-grey disc with a dashed lime border) and each microbe has its own position
 * and fill. The numbered "what shotgun reads" list IS a repeat — those four rows
 * are structurally identical, so the count is free.
 *
 * The closing right-hand line keeps its `<b>` as markup and binds the text inside
 * it, rather than becoming rich text. The mockup wraps the WHOLE sentence: this
 * column is set bolder than the one beside it, which is the design saying "ours",
 * not an editor emphasising a clause. Keeping the element also keeps its inline
 * `font-weight: 500` — a rich-text bold would have rendered 700 and needed a
 * stylesheet override to put back.
 */
export const RdLbMethodBlock: Block = {
  slug: "rdLbMethod",
  interfaceName: "RdLbMethodBlock",
  labels: { singular: "RdLbMethod", plural: "RdLbMethod" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's own links point at \"#method\". Deliberately NOT localized." }, defaultValue: "method" },
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
                  "text": "Most gut tests read who's there. We read what they can do.",
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
    { name: "intro", type: "textarea", localized: true, label: "Standfirst", admin: { description: "The line under the headline." }, defaultValue: "The same gut. The same microbes, read two completely different ways." },
    {
      name: "left", type: 'group', label: "16S panel", admin: { description: "The left card. Its figure is a fixed drawing of 1,250 identical dots shipped as a file \u2014 only the words and the alt text are editable." },
      fields: [
        { name: "eyebrow", type: "text", localized: true, defaultValue: "Almost every gut test" },
        { name: "title", type: "text", localized: true, defaultValue: "Who's there" },
        { name: "meta", type: "text", localized: true, defaultValue: "16S rRNA" },
        { name: "figureAlt", type: "text", localized: true, defaultValue: "Every microbe as an identical grey dot" },
        { name: "caption", type: "textarea", localized: true, defaultValue: "Every microbe is just a dot. All you learn is that it exists." },
      ],
    },
    {
      name: "right", type: 'group', label: "Our panel", admin: { description: "The right card. Its figure is the same drawing with three tappable microbes over it." },
      fields: [
        { name: "eyebrow", type: "text", localized: true, defaultValue: "Our method" },
        { name: "title", type: "text", localized: true, defaultValue: "What each one can do" },
        { name: "meta", type: "text", localized: true, defaultValue: "Shotgun sequencing" },
        { name: "figureAlt", type: "text", localized: true, defaultValue: "The same microbes; the glowing ones are tappable" },
      ],
    },
    {
      name: "microbes", type: 'array', label: "Tappable microbes", admin: { description: "EXACTLY THREE, in the order they are drawn: top-left, right, bottom-left. Their positions and colours are part of the figure, so a fourth row would save fine and render nothing \u2014 and deleting one leaves a circle that opens an empty popover." },
      defaultValue: [
        {
          "name": "Faecalibacterium prausnitzii",
          "job": "Makes butyrate that fuels your gut lining",
          "status": "Active"
        },
        {
          "name": "Akkermansia muciniphila",
          "job": "Protects the gut mucus barrier",
          "status": "Low"
        },
        {
          "name": "Roseburia intestinalis",
          "job": "A butyrate maker your gut is short on: we feed this back",
          "status": "Missing"
        }
      ],
      fields: [
        { name: "name", type: "text", localized: true, required: true },
        { name: "job", type: "textarea", localized: true },
        { name: "status", type: "text", localized: true },
      ],
    },
    { name: "hintIdle", type: "text", localized: true, label: "Hint \u2014 before a tap", admin: { description: "The lime pill under the figure, before anything is tapped." }, defaultValue: "Tap a glowing microbe to see its job" },
    { name: "hintActive", type: "text", localized: true, label: "Hint \u2014 after a tap", admin: { description: "What the same pill says once a microbe is open." }, defaultValue: "Tap another microbe" },
    {
      name: "reads", type: 'array', label: "What shotgun reads", admin: { description: "The numbered two-by-two list. The count is free \u2014 these repeat properly. The numbers are typed, not counted by the design." },
      defaultValue: [
        {
          "number": "01",
          "text": "Which species it is"
        },
        {
          "number": "02",
          "text": "What it can ferment"
        },
        {
          "number": "03",
          "text": "What it produces"
        },
        {
          "number": "04",
          "text": "Whether it is thriving"
        }
      ],
      fields: [
        { name: "number", type: "text", localized: true },
        { name: "text", type: "text", localized: true, required: true },
      ],
    },
    {
      name: "stateKey", type: 'array', label: "State key", admin: { description: "EXACTLY THREE, matching the three microbes above in order: Active, Low, Missing. Each swatch is its own drawing \u2014 a lime disc, an orange disc, and a dashed one \u2014 so only the labels are editable and a fourth row renders nothing." },
      defaultValue: [
        {
          "label": "Active"
        },
        {
          "label": "Low"
        },
        {
          "label": "Missing"
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true },
      ],
    },
    {
      name: "footer", type: 'group', label: "Closing pair", admin: { description: "The two lines under the cards. The right-hand one is set bolder by the design, not by the editor \u2014 there is no way to make the left one bold, and that is deliberate." },
      fields: [
        { name: "leftEyebrow", type: "text", localized: true, defaultValue: "16S tells you, per microbe" },
        { name: "leftText", type: "textarea", localized: true, defaultValue: "A list of names. No idea what any of them do." },
        { name: "rightEyebrow", type: "text", localized: true, defaultValue: "We tell you, per microbe" },
        { name: "rightText", type: "textarea", localized: true, defaultValue: "Every name, the job behind it, and the jobs nobody can do." },
      ],
    },
  ],
}
