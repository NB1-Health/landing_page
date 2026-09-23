import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-06.json by tools/block_config.py — every
 * defaultValue is injected from out/RdPgData.defaults.json, not retyped.
 *
 * Four tabs, each showing a text panel beside a phone screen. All eight — four
 * panels and four screens — live in the DOM at once and are swapped by `display`,
 * which is exactly how the mockup does it. That is also why a single capture was
 * enough: `innerText` only reports the visible screen, which made it look at first
 * as though the phone had one screen that changed.
 *
 * THE PHONE IS AN ILLUSTRATION and carries no fields. It draws a sample report —
 * a greeting, a score, a delta, four charts — and the numbers only read correctly
 * as a set: changing 85.5 without also changing "up 11.9 points on your last read"
 * and "Up from 73.6" makes the picture contradict itself. It is a picture of the
 * product rather than editorial copy.
 *
 * Its two images ship as static files under `public/rd-pg/`, byte-for-byte the
 * mockup's own. They cannot be uploads, because static markup has no field to
 * point at, and the mockup's `assets/<uuid>.png` paths would 404 in the app.
 *
 * `tabs` and `panels` are bound BY INDEX and are four long. Each tab button and
 * each panel is its own node in the markup, so a fifth row would store fine and
 * render nothing.
 *
 * The step numbers are derived from position rather than stored — a field would
 * let the three read 1, 2, 2.
 */
export const RdPgDataBlock: Block = {
  slug: "rdPgData",
  interfaceName: "RdPgDataBlock",
  labels: { singular: "PG Data", plural: "PG Data" },
  fields: [
    { name: "anchorId", type: "text", label: "Anchor id", admin: { description: "Rendered as the section id. The page's footer links to \"#data\". Deliberately NOT localized." }, defaultValue: "data" },
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
                  "text": "Your biology,",
                  "version": 1
                },
                {
                  "type": "linebreak",
                  "version": 1
                },
                {
                  "type": "text",
                  "detail": 0,
                  "format": 0,
                  "mode": "normal",
                  "style": "",
                  "text": "made visible.",
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
    { name: "intro", type: "textarea", localized: true, defaultValue: "A glimpse of your report. When your analysis lands, you get all of it — your score, your formula, and every reading behind it." },
    {
      name: "tabs", type: 'array', label: "Tabs", admin: { description: "Exactly four, in order. Each is its own button in the markup, so a fifth would never appear." },
      defaultValue: [
        {
          "label": "Inside your gut"
        },
        {
          "label": "What's happening"
        },
        {
          "label": "Bacterial teams"
        },
        {
          "label": "Your formula"
        }
      ],
      fields: [
        { name: "label", type: "text", localized: true, required: true },
      ],
    },
    {
      name: "panels", type: 'array', label: "Panels", admin: { description: "Exactly four, matched to the tabs by position." },
      defaultValue: [
        {
          "title": "Where you stand",
          "steps": [
            {
              "title": "One score, in plain language",
              "body": "85.5 out of 100 — excellent, and up 11.9 points on your last reading."
            },
            {
              "title": "Two areas to focus on",
              "body": "Fibre processing and Bifidobacteria are the two readings below range."
            },
            {
              "title": "Your strongest system",
              "body": "Metabolic scored a full 20 of 20. Nothing there needs support."
            }
          ]
        },
        {
          "title": "What your gut is doing",
          "steps": [
            {
              "title": "Four systems, read today",
              "body": "Gut lining, inflammation control, fiber processing, Bifidobacteria."
            },
            {
              "title": "What needs support",
              "body": "Fibre processing at 73% and Bifidobacteria at 60% — both matched to ingredients."
            },
            {
              "title": "What is already strong",
              "body": "Gut lining protection at 90%, inflammation control at 95%."
            }
          ]
        },
        {
          "title": "Who is in your gut",
          "steps": [
            {
              "title": "Six teams, one healthy range",
              "body": "Each guild scored against the range across 8,069 metagenomes."
            },
            {
              "title": "The team to rebuild",
              "body": "Fibre degraders sit below range. Your formula targets that team."
            },
            {
              "title": "Re-measured every cycle",
              "body": "Retest and the same teams are scored again, so change is visible."
            }
          ]
        },
        {
          "title": "Built from the readout",
          "steps": [
            {
              "title": "Every ingredient traces to a reading",
              "body": "Open any component and see the number that put it there."
            },
            {
              "title": "Nothing included by default",
              "body": "Anything your diagnostic didn’t warrant is listed as left out."
            },
            {
              "title": "Rebuilds as your data changes",
              "body": "New reading, new formula. Doses move with your numbers."
            }
          ]
        }
      ],
      fields: [
        { name: "title", type: "text", localized: true, required: true },
        {
          name: "steps", type: 'array', label: "Numbered points", admin: { description: "Three per panel. The numbers come from the order, not from a field." },
          fields: [
            { name: "title", type: "text", localized: true, required: true },
            { name: "body", type: "textarea", localized: true },
          ],
        },
      ],
    },
    localizedLink({
      overrides: {
          name: "cta",
          label: "Link",
          admin: { description: "The \u2197 glyph is drawn by the link \u2014 do not type it into the label." },
          defaultValue: {
          "url": "#",
          "label": "See a full sample health report"
        },
      },
    }),
  ],
}
