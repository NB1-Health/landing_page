import type { Block } from 'payload'
import { inlineRichTextEditor } from '@/fields/headingLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-01.json — defaults are the mockup's own values.
 *
 * The five bubbles are a LOCKED array of exactly five. Each one is hand-placed
 * over the photograph at its own `top`/`left`, with its own orb colour, and the
 * fourth is a structurally different ring treatment. Only the LABEL is editorial;
 * a sixth bubble would have nowhere to go, so rows cannot be added or removed.
 * The component does not `.slice()` — min and max are the single source of truth.
 *
 * The Trustpilot rating is the real widget, not the mockup's drawing of one. The
 * mockup composes it from spans (and its fifth star is a half star, so the score
 * it depicts is 4.5) — shipping that would be a picture of a rating: static,
 * untranslated, and wrong the moment the score moves.
 */
export const RdHeroBlock: Block = {
  slug: 'rdHero',
  interfaceName: 'RdHeroBlock',
  labels: { singular: 'RD Hero', plural: 'RD Heroes' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      defaultValue: 'top',
      label: 'Anchor id',
      admin: {
        description:
          'Rendered as the section id so in-page links like "#top" land here. '
          + 'Deliberately NOT localized — the fragment must be identical in every '
          + 'locale or the links break on translated pages.',
      },
    },
    { name: 'heading', type: 'text', localized: true, required: true, defaultValue: "Stop the guesswork" },
    { name: 'intro', type: 'textarea', localized: true, defaultValue: "We read your biology. We build a formula made only for you. Nothing is charged until it is made." },
    {
      name: 'heroImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Hero photograph',
      admin: { description: 'Full-bleed behind the headline. A scrim is applied over it in CSS.' },
    },
    localizedLink({ overrides: { name: 'primaryCta', label: 'Primary CTA' } }),
    localizedLink({ overrides: { name: 'secondaryCta', label: 'Secondary CTA' } }),
    {
      name: 'bubbles',
      type: 'array',
      label: 'Domain bubbles',
      minRows: 5,
      maxRows: 5,
      admin: {
        description:
          'The five orbs over the photograph, in order: gut, energy, resilience, '
          + 'immunity, sleep. Position and colour are fixed in the design — only '
          + 'the label is editable, and there are always exactly five.',
      },
      defaultValue: [
      {
            "label": "Gut health"
      },
      {
            "label": "Energy"
      },
      {
            "label": "Resilience"
      },
      {
            "label": "Immunity"
      },
      {
            "label": "Sleep"
      }
],
      fields: [{ name: 'label', type: 'text', localized: true, required: true }],
    },
    {
      name: 'showTrustpilotRating',
      type: 'checkbox',
      defaultValue: true,
      label: 'Show Trustpilot rating',
      admin: {
        description:
          'Lead the trust strip with the live Trustpilot rating. The localized '
          + 'widget source is resolved from the page locale in code.',
      },
    },
    {
      name: 'claims',
      type: 'array',
      label: 'Trust claims',
      maxRows: 4,
      admin: { description: 'The short claims beside the rating, separated by dots.' },
      defaultValue: [
      {
            "body": {
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
                                                "text": "Formulated with a ",
                                                "version": 1
                                          },
                                          {
                                                "type": "text",
                                                "detail": 0,
                                                "format": 1,
                                                "mode": "normal",
                                                "style": "",
                                                "text": "7-person scientific board",
                                                "version": 1
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
            }
      },
      {
            "body": {
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
                                                "text": "Analysed in ",
                                                "version": 1
                                          },
                                          {
                                                "type": "text",
                                                "detail": 0,
                                                "format": 1,
                                                "mode": "normal",
                                                "style": "",
                                                "text": "EU labs",
                                                "version": 1
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
            }
      }
],
      fields: [
        { name: 'body', type: 'richText', localized: true, required: true, editor: inlineRichTextEditor },
      ],
    },
    {
      name: 'trustCycleMs',
      type: 'number',
      defaultValue: 3400,
      label: 'Trust strip cycle (ms)',
      admin: {
        description:
          'Below 760px the strip shows one item at a time and advances on this '
          + 'interval; above it, all items are visible at once and this is unused. '
          + 'Measured from the mockup: 3400ms. Set 0 to stop cycling.',
      },
    },
  ],
}
