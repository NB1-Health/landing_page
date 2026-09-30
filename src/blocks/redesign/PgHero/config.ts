import type { Block } from 'payload'
import { makeRedesignHeadingEditor } from '@/fields/redesignLexical'
import { localizedLink } from '@/fields/localizedLink'

/**
 * GENERATED from manifests/section-01.json — defaults are the mockup's own values,
 * injected from out/RdPgHero.defaults.json rather than retyped.
 *
 * The Our Plans hero. A NEW block, not the homepage's rdHero: the two share a
 * name and nothing else. This one is a two-column grid on a LIGHT page — copy
 * left, a photograph right with a score badge hung off its edge — where the
 * homepage hero is a single dark stage with floating orbs. Their outlines match
 * 0%.
 *
 * `heading` is rich text because the mockup breaks it across two lines
 * ("Built from" / "your biology.") and where that break falls is editorial: it
 * is the difference between a headline that sets and one that widows. A text
 * field would either lose the break or hard-code it.
 *
 * `trustAvatars` is an array of uploads with THREE rows by default. The rows
 * carry no text, so nothing in the mockup's content inventory produces them —
 * but three overlapping faces is what the lockup draws, and a block is supposed
 * to render its own design with no editor input. The first face sits flush and
 * the rest overlap it by 14px; that offset is applied by index, so the stack
 * stays right at any length.
 *
 * TWO DELIBERATE DEVIATIONS from the mockup, in the avatar stack, asked for
 * after seeing it rendered. The circles are 44px rather than 52px, and the crop
 * is centred (`object-position: 50% 50%`) rather than top-aligned (`50% 0%`).
 * The portraits are tall studio shots, so the mockup's top-aligned cover crop
 * fills a small circle with hairline and cuts the chin off. Nothing in the
 * pipeline flagged this and nothing could: a fidelity check asks whether we
 * match the mockup, never whether the mockup is right. Recorded here and in
 * bindings/RdPgHero.json so a later "fix" back to 52px/0% is recognisable as a
 * regression rather than a correction — ssr_diff reports both as differences by
 * design.
 *
 * `scoreValue` is text, not a number, and IS localized: it is "85.5" in English
 * and "85,5" wherever the decimal comma is used, and a number field would render
 * one of those everywhere.
 *
 * The secondary CTA's "→" is typed INTO the label, because in this mockup it is
 * part of the text node rather than a separate span — unlike the primary CTA's
 * ↗, which is drawn. Same distinction as the footer's social link.
 *
 * No `anchorId` default: the mockup gives this header no id, and nothing on the
 * page links to it.
 */
export const RdPgHeroBlock: Block = {
  slug: 'rdPgHero',
  interfaceName: 'RdPgHeroBlock',
  labels: { singular: 'PG Hero', plural: 'PG Hero' },
  fields: [
    {
      name: 'anchorId',
      type: 'text',
      label: 'Anchor id',
      admin: {
        description:
          'Rendered as the section id, for linking to this section. Deliberately '
          + 'NOT localized — a fragment must be identical in every locale.',
      },
    },
    {
      name: 'heading',
      type: 'richText',
      localized: true,
      required: true,
      editor: makeRedesignHeadingEditor(['h1']),
      admin: { description: 'The line break is yours to place — it is what keeps the second line from widowing.' },
      defaultValue: {
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
                  "text": "Built from",
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
                  "text": "your biology.",
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
      },
    },
    {
      name: 'intro',
      type: 'textarea',
      localized: true,
      defaultValue: "We read your gut at species level. We score it against 8,069 metagenomes. Then we build one formula — only from what's there. Nothing by default. Nothing for everyone.",
    },
    localizedLink({
      overrides: {
        name: 'primaryCta',
        label: 'Primary button',
        admin: {
          description: 'The ↗ glyph is drawn by the button — do not type it into the label.',
        },
        defaultValue: {
        "url": "#buy",
        "label": "Order your kit"
      },
      },
    }),
    localizedLink({
      overrides: {
        name: 'secondaryCta',
        label: 'Secondary link',
        admin: {
          description:
            'Here the arrow IS part of the label — the mockup types it into the text '
            + 'rather than drawing it, so it travels with the translation.',
        },
        defaultValue: {
        "label": "See a sample report →",
        "url": "#data"
      },
      },
    }),
    {
      name: 'trustAvatars',
      type: 'array',
      label: 'Faces',
      admin: {
        description:
          'The overlapping faces beside the science-board line. Three is the '
          + 'mockup\'s count; the overlap is applied from the second row on, so '
          + 'adding or removing one still reads as a stack.',
      },
      defaultValue: [
        {
          "photo": null
        },
        {
          "photo": null
        },
        {
          "photo": null
        }
      ],
      fields: [{ name: 'photo', type: 'upload', relationTo: 'media' }],
    },
    { name: 'trustHeadline', type: 'text', localized: true, defaultValue: "Each formula reviewed by our science board" },
    { name: 'trustDetail', type: 'text', localized: true, defaultValue: "Seven researchers · human sign-off before manufacture" },
    { name: 'image', type: 'upload', relationTo: 'media', label: 'Hero photograph' },
    { name: 'imageBadge', type: 'text', localized: true, label: 'Badge on the photograph', defaultValue: "Made for one" },
    {
      name: 'scoreLabel',
      type: 'text',
      localized: true,
      defaultValue: "Your score",
    },
    {
      name: 'scoreValue',
      type: 'text',
      localized: true,
      admin: { description: 'Text, not a number: the decimal separator differs by locale.' },
      defaultValue: "85.5",
    },
    {
      name: 'scoreRating',
      type: 'text',
      localized: true,
      defaultValue: "Excellent",
    },
  ],
}
