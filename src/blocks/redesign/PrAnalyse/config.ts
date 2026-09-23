import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-05.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPrAnalyse.defaults.json, not retyped.
 *
 * Heading and standfirst, a five-person science-board roster, three numbered
 * review steps, and a closing line with a link to The Lab.
 *
 * THE PORTRAITS ARE CSS BACKGROUNDS, not `<img>`. That is the mockup's own
 * construction — it is why each box carries `role="img"` and an aria-label — and
 * it is kept, because swapping in an `<img>` changes the box model and the crop.
 * `focal` is a per-row field holding a `background-position`: the mockup crops the
 * five differently, the first two at `center center` and the last three at
 * `center 24%`. A styleToggle would have hard-coded which rows those are; a field
 * is what an editor needs the moment they upload a different face.
 *
 * The roster IS a repeat — five identical cells. The three review steps are NOT:
 * each carries its own icon, three SVGs with different path data and different
 * child counts, so they are bound by index. Same split as the journey block.
 *
 * The 01/02/03 on the steps are DERIVED from position and zero-padded, not stored.
 * A field would let the three read 01, 02, 02.
 *
 * The portraits are web-sized JPEGs, 40–62KB each. Two of these people — Polina
 * Novikova and Marijn Lewis — are also on the Our Plans science board, but as
 * different files there: 1–2MB PNGs. Different bytes, so different media rows, and
 * deliberately not shared.
 */
export const RdPrAnalyseBlock: Block = {
  slug: "rdPrAnalyse",
  interfaceName: "RdPrAnalyseBlock",
  labels: { singular: "RdPrAnalyse", plural: "RdPrAnalyse" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. Deliberately NOT localized." }, defaultValue: "analyse" },
    { name: "heading", type: "richText", localized: true, required: true, editor: makeRedesignHeadingEditor(['h2']), defaultValue: {
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
                  "text": "Your sample comes back. Then our team of scientists reviews your results.",
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "Sequencing produces the numbers. Seven specialists review them against your intake form and turn the two into a decision — the people who read your sample and build from it, plus two senior microbiome scientists who check the method from outside, with no stake in nb1. No formula is made until one of them signs it off." },
    {
      name: "people", type: 'array', label: "Science board", admin: { description: "Five in the mockup, shown as a row. A sixth renders correctly \u2014 the row is a genuine repeat." },
      defaultValue: [
        {
          "role": "Chief Scientific Officer",
          "name": "Dr. Polina Novikova",
          "credentials": "PhD Bioinformatics · University of Luxembourg",
          "photo": null,
          "focal": "center center"
        },
        {
          "role": "Immunology & gut health",
          "name": "Dr. Marijn Lewis",
          "credentials": "PhD Biomedical Sciences · University of Zurich",
          "photo": null,
          "focal": "center center"
        },
        {
          "role": "Bioinformatics",
          "name": "Dr. Irina Utkina",
          "credentials": "Gut Microbiome Science · University of Toronto",
          "photo": null,
          "focal": "center 24%"
        },
        {
          "role": "Clinical research",
          "name": "Katia B. Otterstedt",
          "credentials": "Clinical research & genomics, ECLIN",
          "photo": null,
          "focal": "center 24%"
        },
        {
          "role": "Bioinformatics",
          "name": "Dr. Monica S. Matchado",
          "credentials": "Microbiome functional profiling, TU Munich",
          "photo": null,
          "focal": "center 24%"
        }
      ],
      fields: [
        { name: "photo", type: "upload", relationTo: "media", label: "Portrait", admin: { description: "Drawn as a CSS background on a 4:5 box, which is the mockup's own construction \u2014 not an <img>." } },
        { name: "focal", type: "text", label: "Crop", admin: { description: "A CSS background-position, e.g. \"center 24%\". Move it if a new portrait cuts the face. NOT localized \u2014 it is a crop, not copy." } },
        { name: "role", type: "text", localized: true, label: "Field", admin: { description: "The small uppercase line above the name." } },
        { name: "name", type: "text", localized: true, required: true, label: "Name", admin: { description: "Also used as the portrait's screen-reader label, so there is one place to fix a spelling." } },
        { name: "credentials", type: "text", localized: true, label: "Credentials", admin: { description: "One line. The full biography lives on The Lab, which this section links to." } },
      ],
    },
    {
      name: "steps", type: 'array', label: "Review steps", admin: { description: "Exactly three. Each has its own icon drawn into the markup, so a fourth would store and render nothing. The 01/02/03 numbers come from the order, not from a field." },
      defaultValue: [
        {
          "title": "The sequencing is read",
          "body": "Every species scored across the eight patterns, against a reference set of 8,069 guts."
        },
        {
          "title": "Your intake form sits beside it",
          "body": "The answers you gave us: what you already take, your diet and lifestyle, your symptoms, your goals, and anything a clinician should know."
        },
        {
          "title": "A scientist signs the report",
          "body": "You get the full reading in plain language, and the formula it decides. Nothing is made before that signature."
        }
      ],
      fields: [
        { name: "title", type: "text", localized: true, required: true, label: "Title", admin: { description: "One line." } },
        { name: "body", type: "textarea", localized: true, label: "Body", admin: { description: "Two or three lines." } },
      ],
    },
    { name: "footerText", type: "text", localized: true, label: "Closing line", admin: { description: "The sentence beside the link." }, defaultValue: "The whole board, and the method they govern, is on The Lab." },
    localizedLink({
      overrides: {
          name: "boardLink",
          label: "Board link",
          admin: { description: "The \u2192 IS part of the label \u2014 type it. Destination not yet decided; currently \"#\"." },
          defaultValue: {
          "url": "#",
          "label": "Meet the whole board →"
        },
      },
    }),
  ],
}
